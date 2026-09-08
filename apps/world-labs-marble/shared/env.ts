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
