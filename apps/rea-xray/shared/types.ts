export type InspectKind = "sqlite" | "model" | "wasm" | "binary" | "unknown"

export type FileIdentity = {
  name: string
  sha256: string
  size: number
}

export type ReaReport = {
  command: string
  exitCode: number
  body: unknown
}

export type ApiMessage = {
  code?: string
  message: string
  remediation?: string
}

export type InspectResponse = {
  kind: InspectKind
  file: FileIdentity
  reports: ReaReport[]
  error?: ApiMessage
}

export type FixtureInfo = {
  name: string
  bytes: number
  kind: InspectKind
}

export type FixturesResponse = {
  fixtures: FixtureInfo[]
}
