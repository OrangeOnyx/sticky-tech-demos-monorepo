import type { World } from "./types"

export function pickSplatUrl(world: World): string | null {
  const urls = world.assets?.splats?.spz_urls
  if (!urls) return null
  return (
    urls["500k"] || urls["100k"] || urls.full_res || Object.values(urls)[0] || null
  )
}

const ALLOWED_ASSET_HOSTS = [
  "marble.worldlabs.ai",
  "api.worldlabs.ai",
  "storage.googleapis.com",
  "googleapis.com",
  "googleusercontent.com",
  "sparkjs.dev",
]

export function isAllowedAssetUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol !== "https:") return false
    return ALLOWED_ASSET_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
  } catch {
    return false
  }
}

export function unwrapWorld(payload: unknown): World | null {
  if (!payload || typeof payload !== "object") return null
  if ("id" in payload && typeof (payload as World).id === "string") {
    return payload as World
  }
  if (
    "world" in payload &&
    (payload as { world?: unknown }).world &&
    typeof (payload as { world?: unknown }).world === "object" &&
    "id" in ((payload as { world: World }).world ?? {})
  ) {
    return (payload as { world: World }).world
  }
  if (
    "response" in payload &&
    (payload as { response?: unknown }).response &&
    typeof (payload as { response?: unknown }).response === "object" &&
    "id" in ((payload as { response: World }).response ?? {})
  ) {
    return (payload as { response: World }).response
  }
  return null
}
