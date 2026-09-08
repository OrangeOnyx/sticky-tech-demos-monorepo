import type { GenerateRequest, Operation, World } from "@/lib/types"

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`)
  }
  return body
}

export async function startGenerate(
  input: GenerateRequest,
): Promise<Operation> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return readJson<Operation>(response)
}

export async function pollOperation(operationId: string): Promise<Operation> {
  const response = await fetch(
    `/api/operations/${encodeURIComponent(operationId)}`,
  )
  return readJson<Operation>(response)
}

export async function fetchWorld(worldId: string): Promise<World> {
  const response = await fetch(`/api/worlds/${encodeURIComponent(worldId)}`)
  return readJson<World>(response)
}

export function proxyAssetUrl(url: string): string {
  if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url
  }
  return `/api/asset-proxy?url=${encodeURIComponent(url)}`
}
