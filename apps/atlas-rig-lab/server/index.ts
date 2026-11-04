import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { liveConfigError, missingLiveEnv, readAtlasConfig, toClientStatus, isSafeId } from "../shared/atlas.ts"
import { imageError, parseMultipart } from "../shared/multipart.ts"
import { downloadMesh, executeWorkflow, fetchStatus, uploadImage } from "./atlas-client.ts"

const PORT = Number(process.env.PORT ?? 3001)

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function executionIdFrom(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) return null
  const id = decodeURIComponent(pathname.slice(prefix.length))
  return isSafeId(id) ? id : null
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

  const missing = missingLiveEnv(process.env)
  const config = readAtlasConfig(process.env)

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      liveReady: Boolean(config),
      missing,
      pollMs: config?.pollMs ?? 3000,
      timeoutMs: config?.timeoutMs ?? 300_000,
    })
    return
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    if (!config) {
      json(res, 400, { error: liveConfigError(missing) })
      return
    }
    const body = await readBody(req)
    let parts
    try {
      parts = parseMultipart(body, req.headers["content-type"] ?? "")
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : "Upload could not be read." })
      return
    }
    const image = parts.find((part) => part.filename || part.mime.startsWith("image/"))
    const invalid = imageError(image)
    if (!image || invalid) {
      json(res, 400, { error: invalid ?? "Choose a PNG, JPEG, or WebP image." })
      return
    }
    try {
      const fileId = await uploadImage(config, {
        name: image.filename || "image.png",
        type: image.mime || "application/octet-stream",
        bytes: new Uint8Array(image.data),
      })
      const executionId = await executeWorkflow(config, fileId)
      json(res, 200, { executionId })
    } catch (error) {
      json(res, 502, {
        error: error instanceof Error ? error.message : "Atlas AI Studio request failed.",
      })
    }
    return
  }

  const statusId = req.method === "GET" ? executionIdFrom(url.pathname, "/api/status/") : null
  if (statusId) {
    if (!config) {
      json(res, 400, { error: liveConfigError(missing) })
      return
    }
    try {
      const status = await fetchStatus(config, statusId)
      json(res, 200, toClientStatus(status))
    } catch (error) {
      json(res, 502, {
        error: error instanceof Error ? error.message : "Atlas AI Studio status failed.",
      })
    }
    return
  }

  const resultId = req.method === "GET" ? executionIdFrom(url.pathname, "/api/result/") : null
  if (resultId) {
    if (!config) {
      json(res, 400, { error: liveConfigError(missing) })
      return
    }
    try {
      const status = await fetchStatus(config, resultId)
      if (status.phase !== "ready") {
        json(res, 409, { error: status.message })
        return
      }
      const mesh = await downloadMesh(config, status, resultId)
      res.statusCode = 200
      res.setHeader("Content-Type", mesh.contentType)
      res.setHeader("Content-Length", String(mesh.bytes.byteLength))
      res.setHeader("Content-Disposition", 'attachment; filename="atlas-rig.glb"')
      res.setHeader("Cache-Control", "no-store")
      res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
      res.end(mesh.bytes)
    } catch (error) {
      json(res, 502, {
        error: error instanceof Error ? error.message : "Atlas AI Studio download failed.",
      })
    }
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
  const ready = Boolean(readAtlasConfig(process.env))
  console.log(
    `Atlas Rig Lab API on http://127.0.0.1:${PORT} (${ready ? "live config present" : "sample only"})`,
  )
})
