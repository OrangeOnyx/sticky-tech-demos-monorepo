import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { judgeCandidate } from "./judge.ts"

const PORT = Number(process.env.PORT ?? 3001)

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.end()
    return
  }

  const liveReady = Boolean(process.env.TYPESAFE_API_KEY?.trim())

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true, liveReady })
    return
  }

  if (req.method === "POST" && url.pathname === "/api/judge") {
    let payload: unknown
    try {
      payload = await readJson(req)
    } catch {
      json(res, 400, { error: "Request body must be JSON." })
      return
    }
    const record =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null
    const result = await judgeCandidate({
      mode: record?.mode,
      candidate: record?.candidate,
      apiKey: process.env.TYPESAFE_API_KEY,
    })
    json(res, result.status, result.body)
    return
  }

  json(res, 404, { error: "Not found" })
}

const httpServer = createServer((req, res) => {
  void handleRequest(req, res).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Server error")
    json(res, 500, { error: "Server error" })
  })
})

httpServer.listen(PORT, "127.0.0.1", () => {
  const liveReady = Boolean(process.env.TYPESAFE_API_KEY?.trim())
  console.log(
    `TypeSafe Jev API on http://127.0.0.1:${PORT} (${liveReady ? "live key present" : "fixture only"})`,
  )
})
