import { marbleApiBase } from "./env"
import type { Operation, World, WorldPrompt } from "./types"
import { unwrapWorld } from "./world-assets"

export class MarbleApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MarbleApiError"
    this.status = status
  }
}

function apiKey(): string {
  const key = process.env.WLT_API_KEY?.trim()
  if (!key) {
    throw new MarbleApiError("WLT_API_KEY is not set.", 400)
  }
  return key
}

function baseUrl(): string {
  return marbleApiBase(process.env)
}

async function marbleFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  headers.set("WLT-Api-Key", apiKey())
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, { ...init, headers })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(body, response.status)
    throw new MarbleApiError(message, response.status)
  }

  return body as T
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    if ("detail" in body && typeof body.detail === "string") return body.detail
    if ("error" in body && typeof body.error === "string") return body.error
  }
  return `Marble API ${status}`
}

export async function generateWorld(input: {
  world_prompt: WorldPrompt
  display_name: string
  model: string
}): Promise<Operation> {
  const operation = await marbleFetch<Operation>("/worlds:generate", {
    method: "POST",
    body: JSON.stringify({
      display_name: input.display_name,
      model: input.model,
      world_prompt: input.world_prompt,
    }),
  })
  return { ...operation, source: "live" }
}

export async function getOperation(operationId: string): Promise<Operation> {
  const operation = await marbleFetch<Operation>(
    `/operations/${encodeURIComponent(operationId)}`,
  )
  const world = unwrapWorld(operation.response)
  return {
    ...operation,
    response: world ? { ...world, source: "live" } : operation.response,
    source: "live",
  }
}

export async function getWorld(worldId: string): Promise<World> {
  const payload = await marbleFetch<unknown>(
    `/worlds/${encodeURIComponent(worldId)}`,
  )
  const world = unwrapWorld(payload)
  if (!world) {
    throw new MarbleApiError("Marble returned an empty world.", 502)
  }
  return { ...world, source: "live" }
}
