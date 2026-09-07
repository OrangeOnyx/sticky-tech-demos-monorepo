export type AppMode = "fixture" | "live"

export type SessionStatus = "disconnected" | "connecting" | "connected"

export type TurnState = "idle" | "listening" | "speaking"

export type ListenMode = "hold" | "always"

export type ChatRole = "user" | "assistant"

export type TranscriptMessage = {
  id: string
  role: ChatRole
  content: string
  pending?: boolean
  source?: "voice" | "typed" | "fixture"
}

export type AppConfig = {
  mode: AppMode
  liveReady: boolean
  hasApiKey: boolean
  hasEngineId: boolean
  hasPublicWs: boolean
  hasOpenAi: boolean
}

export type ChatTurn = {
  role: ChatRole
  content: string
}
