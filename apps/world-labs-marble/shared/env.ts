export type AppMode = "fixture" | "live"

export type AppConfig = {
  mode: AppMode
  hasApiKey: boolean
  pollMs: number
}

export function resolveAppConfig(
  env: Record<string, string | undefined>,
): AppConfig {
  const hasApiKey = Boolean(env.WLT_API_KEY?.trim())
  return {
    mode: hasApiKey ? "live" : "fixture",
    hasApiKey,
    pollMs: hasApiKey ? 4000 : 800,
  }
}

export function marbleApiBase(env: Record<string, string | undefined>): string {
  return (
    env.MARBLE_API_BASE?.trim() || "https://api.worldlabs.ai/marble/v1"
  ).replace(/\/$/, "")
}

export function resolveApiPort(env: Record<string, string | undefined>): number {
  const value = env.PORT?.trim() || "3001"
  const port = Number(value)
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.")
  }
  return port
}
