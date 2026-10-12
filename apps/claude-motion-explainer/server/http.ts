import type { IncomingMessage, ServerResponse } from "node:http"
import { explainRentRoll } from "./explain.ts"

const PORT = Number(process.env.PORT ?? 3001)

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
    if (Buffer.concat(chunks).length > 100_000) {
      throw new Error("too large")
    }
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

export function createHandler(options: { apiKey?: string; model?: string }) {
  return async function handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`)

      if (req.method === "OPTIONS") {
        res.statusCode = 204
        res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")
        res.end()
        return
      }

      const liveReady = Boolean(options.apiKey?.trim())

      if (req.method === "GET" && url.pathname === "/api/health") {
        json(res, 200, { ok: true, liveReady })
        return
      }

      if (req.method === "POST" && url.pathname === "/api/explain") {
        let payload: unknown
        try {
          payload = await readJson(req)
        } catch (error) {
          const tooLarge = error instanceof Error && error.message === "too large"
          json(res, tooLarge ? 413 : 400, {
            error: tooLarge ? "Rent roll is too large." : "Request body must be JSON.",
          })
          return
        }
        const record =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : null
        const result = await explainRentRoll({
          mode: record?.mode,
          text: record?.text,
          propertyName: record?.propertyName,
          apiKey: options.apiKey,
          model: options.model,
        })
        json(res, result.status, result.body)
        return
      }

      json(res, 404, { error: "Not found" })
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Server error")
      if (!res.headersSent) json(res, 500, { error: "Server error" })
    }
  }
}
