import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { resolveApiPort, resolveAppConfig } from "../shared/env"
import {
  createFixtureJob,
  getFixtureOperation,
  getFixtureWorld,
} from "../shared/fixture"
import {
  generateWorld,
  getOperation,
  getWorld,
  MarbleApiError,
} from "../shared/marble"
import { isAllowedAssetUrl } from "../shared/world-assets"
import {
  buildWorldPrompt,
  displayNameFromPrompt,
  PromptError,
  selectModel,
} from "../shared/prompt"
import type { GenerateRequest } from "../shared/types"

const PORT = resolveApiPort(process.env)
const UI_PORT = 5173
const localHosts = new Set(
  ["127.0.0.1", "localhost"].map((host) => new URL(`http://${host}:${PORT}`).host),
)
const localOrigins = new Set(
  [PORT, UI_PORT].flatMap((port) => [
    new URL(`http://127.0.0.1:${port}`).origin,
    new URL(`http://localhost:${port}`).origin,
  ]),
)

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
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

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // The Vite proxy changes Host to the API target and preserves Origin.
  // Check before reading a body or dispatching any credit-spending request.
  if (
    !localHosts.has(req.headers.host ?? "") ||
    (req.headers.origin !== undefined && !localOrigins.has(req.headers.origin))
  ) {
    json(res, 403, { error: "Only local playground requests are allowed." })
    return
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
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

  if (req.method === "POST" && url.pathname === "/api/generate") {
    const body = await readJson<GenerateRequest>(req)
    const worldPrompt = buildWorldPrompt(body)
    const displayName = displayNameFromPrompt(
      body.display_name,
      body.text_prompt ?? "",
    )
    const model = selectModel(Boolean(body.draft))

    if (config.mode === "fixture") {
      json(res, 200, createFixtureJob({ ...body, display_name: displayName }))
      return
    }

    const operation = await generateWorld({
      world_prompt: worldPrompt,
      display_name: displayName,
      model,
    })
    json(res, 200, operation)
    return
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/operations/")) {
    const operationId = decodeURIComponent(
      url.pathname.slice("/api/operations/".length),
    )
    if (!operationId) {
      json(res, 400, { error: "Missing operation id." })
      return
    }

    if (config.mode === "fixture") {
      const operation = getFixtureOperation(operationId)
      if (!operation) {
        json(res, 404, { error: "Operation not found." })
        return
      }
      json(res, 200, operation)
      return
    }

    json(res, 200, await getOperation(operationId))
    return
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/worlds/")) {
    const worldId = decodeURIComponent(url.pathname.slice("/api/worlds/".length))
    if (!worldId) {
      json(res, 400, { error: "Missing world id." })
      return
    }

    if (config.mode === "fixture") {
      const world = getFixtureWorld(worldId)
      if (!world) {
        json(res, 404, { error: "World not found." })
        return
      }
      json(res, 200, world)
      return
    }

    json(res, 200, await getWorld(worldId))
    return
  }

  if (req.method === "GET" && url.pathname === "/api/asset-proxy") {
    const assetUrl = url.searchParams.get("url") ?? ""
    if (!isAllowedAssetUrl(assetUrl)) {
      json(res, 400, { error: "Asset host is not allowed." })
      return
    }
    const upstream = await fetch(assetUrl)
    if (!upstream.ok) {
      json(res, 502, { error: `Asset fetch failed (${upstream.status}).` })
      return
    }
    res.statusCode = 200
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ?? "application/octet-stream",
    )
    res.setHeader("Cache-Control", "private, max-age=60")
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.end(buffer)
    return
  }

  json(res, 404, { error: "Not found" })
}

const httpServer = createServer((req, res) => {
  void handleRequest(req, res).catch((error) => {
    console.error(error)
    if (error instanceof PromptError) {
      json(res, 400, { error: error.message })
      return
    }
    if (error instanceof MarbleApiError) {
      json(res, error.status || 502, { error: error.message })
      return
    }
    json(res, 500, {
      error: error instanceof Error ? error.message : "Server error",
    })
  })
})

const config = resolveAppConfig(process.env)

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Marble API on http://127.0.0.1:${PORT} (${config.mode}${config.hasApiKey ? ", live key present" : ""})`,
  )
})
