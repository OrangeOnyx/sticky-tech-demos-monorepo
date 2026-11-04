import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { loadEnv } from "./env.ts"
import { HttpError } from "./errors.ts"
import {
  displayName,
  inspectBuffer,
  inspectFixtureFile,
  listFixtures,
  MAX_UPLOAD_BYTES,
  parseRowLimit,
  parseTable,
} from "./inspect.ts"

loadEnv()

const PORT = Number(process.env.PORT ?? 3001)
const ORIGIN = "http://127.0.0.1:5173"

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", ORIGIN)
  res.end(JSON.stringify(body))
}

async function readLimited(req: IncomingMessage): Promise<Buffer> {
  const declared = Number(req.headers["content-length"] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, "Uploads are limited to 256 MiB.")
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > MAX_UPLOAD_BYTES) {
      req.destroy()
      throw new HttpError(413, "Uploads are limited to 256 MiB.")
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function options(url: URL) {
  const table = parseTable(url.searchParams.get("table"))
  const rowLimit = parseRowLimit(url.searchParams.get("rowLimit"))
  return { table, rowLimit }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.setHeader("Access-Control-Allow-Origin", ORIGIN)
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Filename")
    res.end()
    return
  }

  if (req.method === "GET" && url.pathname === "/api/fixtures") {
    json(res, 200, { fixtures: await listFixtures() })
    return
  }

  if (req.method === "POST" && url.pathname === "/api/inspect") {
    const filename = displayName(headerName(req.headers["x-filename"]))
    const bytes = await readLimited(req)
    const body = await inspectBuffer({ name: filename, bytes, ...options(url) })
    json(res, 200, body)
    return
  }

  const fixtureMatch = /^\/api\/inspect\/fixture\/([^/]+)$/.exec(url.pathname)
  if (req.method === "POST" && fixtureMatch) {
    const name = decodeURIComponent(fixtureMatch[1] ?? "")
    const body = await inspectFixtureFile(name, options(url))
    json(res, 200, body)
    return
  }

  json(res, 404, { error: { message: "Not found" } })
}

function headerName(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

const httpServer = createServer((req, res) => {
  void handleRequest(req, res).catch((error: unknown) => {
    if (error instanceof HttpError) {
      json(res, error.status, { error: { message: error.message } })
      return
    }
    console.error(error instanceof Error ? error.message : "Server error")
    json(res, 500, { error: { message: "Server error" } })
  })
})

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`REA X-ray API on http://127.0.0.1:${PORT}`)
})
