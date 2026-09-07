export type AppMode = "fixture" | "live"

export type AppConfig = {
  mode: AppMode
  liveReady: boolean
  hasApiKey: boolean
  hasEngineId: boolean
  hasPublicWs: boolean
  hasOpenAi: boolean
}

export function resolveAppConfig(
  env: Record<string, string | undefined>,
): AppConfig {
  const hasApiKey = Boolean(env.ELEVENLABS_API_KEY?.trim())
  const hasEngineId = Boolean(env.ELEVENLABS_SPEECH_ENGINE_ID?.trim())
  const hasPublicWs = Boolean(env.PUBLIC_WS_URL?.trim())
  const hasOpenAi = Boolean(env.OPENAI_API_KEY?.trim())

  return {
    mode: hasApiKey ? "live" : "fixture",
    liveReady: hasApiKey && hasEngineId,
    hasApiKey,
    hasEngineId,
    hasPublicWs,
    hasOpenAi,
  }
}
