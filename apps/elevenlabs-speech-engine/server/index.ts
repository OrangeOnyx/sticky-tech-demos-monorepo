import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
import { resolveAppConfig } from "../shared/env"
import { stubReply, type ChatTurn } from "../shared/stub-llm"

const PORT = Number(process.env.PORT ?? 3001)

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.end(JSON.stringify(body))
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? (JSON.parse(raw) as T) : ({} as T)
}

function transcriptToTurns(
  transcript: Array<{ role: string; content: string }>,
): ChatTurn[] {
  return transcript.map((message) => ({
    role: message.role === "agent" ? "assistant" : "user",
    content: message.content,
  }))
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.end()
    return
  }

  const config = resolveAppConfig(process.env)

  if (req.method === "GET" && url.pathname === "/api/config") {
    json(res, 200, config)
    return
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true, ...config })
    return
  }

  if (req.method === "POST" && url.pathname === "/api/reply") {
    const body = await readJson<{ text?: string; history?: ChatTurn[] }>(req)
    json(res, 200, { message: stubReply(body.text ?? "", body.history ?? []) })
    return
  }

  if (req.method === "GET" && url.pathname === "/api/token") {
    if (!config.liveReady) {
      json(res, 400, {
        error:
          config.hasApiKey
            ? "Set ELEVENLABS_SPEECH_ENGINE_ID to issue a live conversation token."
            : "Fixture mode: no ELEVENLABS_API_KEY. The UI stubs voice locally.",
      })
      return
    }

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })
    const response = await elevenlabs.conversationalAi.conversations.getWebrtcToken({
      agentId: process.env.ELEVENLABS_SPEECH_ENGINE_ID!,
    })
    json(res, 200, { token: response.token })
    return
  }

  json(res, 404, { error: "Not found" })
}

const httpServer = createServer((req, res) => {
  void handleRequest(req, res).catch((error) => {
    console.error(error)
    json(res, 500, {
      error: error instanceof Error ? error.message : "Server error",
    })
  })
})

const config = resolveAppConfig(process.env)

if (config.liveReady) {
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })

  elevenlabs.speechEngine.attach(
    process.env.ELEVENLABS_SPEECH_ENGINE_ID!,
    httpServer,
    "/ws",
    {
      debug: true,
      onInit(conversationId) {
        console.log("Speech Engine session started:", conversationId)
      },
      onTranscript(transcript, signal, session) {
        if (signal.aborted) {
          return
        }

        const history = transcriptToTurns(transcript)
        const lastUser = [...history].reverse().find((item) => item.role === "user")
        session.sendResponse(stubReply(lastUser?.content ?? "", history))
      },
      onClose(session) {
        console.log("Speech Engine session closed:", session.conversationId)
      },
      onError(error) {
        console.error("Speech Engine error:", error)
      },
    },
  )
}

httpServer.listen(PORT, () => {
  console.log(
    `Speech Engine API on http://127.0.0.1:${PORT} (${config.mode}${config.liveReady ? ", live-ready" : ""})`,
  )
})
