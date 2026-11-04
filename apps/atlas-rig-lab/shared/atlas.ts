export const REQUIRED_LIVE_ENV = [
  "ATLAS_STUDIO_API_KEY",
  "ATLAS_STUDIO_BASE_URL",
  "ATLAS_STUDIO_API_VERSION",
  "ATLAS_STUDIO_API_ID",
  "ATLAS_STUDIO_IMAGE_INPUT_KEY",
  "ATLAS_STUDIO_RESULT_PATH",
] as const

const TEXT_INPUT_KEYS = new Set([
  "prompt",
  "text",
  "description",
  "caption",
  "negative_prompt",
  "instruction",
])

export type AtlasConfig = {
  apiKey: string
  baseUrl: string
  apiVersion: string
  apiId: string
  authHeader: string
  authScheme: string
  imageInputKey: string
  uploadField: string
  resultPath: string
  outputKey: string
  pollMs: number
  timeoutMs: number
}

export type NormalizedStatus = {
  phase: "queued" | "running" | "ready" | "error"
  message: string
  fileId: string | null
  downloadUrl: string | null
}

export type ClientStatus = {
  phase: NormalizedStatus["phase"]
  message: string
  ready: boolean
}

const MISSING_LIVE_MESSAGE = "Live mode needs ATLAS_STUDIO_* in .env"

export function missingLiveEnv(env: NodeJS.ProcessEnv): string[] {
  return REQUIRED_LIVE_ENV.filter((key) => !env[key]?.trim())
}

export function liveConfigError(missing: string[]): string {
  if (missing.length === 0) return MISSING_LIVE_MESSAGE
  return `${MISSING_LIVE_MESSAGE} (${missing.join(", ")}).`
}

export function readAtlasConfig(env: NodeJS.ProcessEnv): AtlasConfig | null {
  if (missingLiveEnv(env).length > 0) return null
  const pollMs = Number(env.ATLAS_STUDIO_POLL_MS)
  const timeoutMs = Number(env.ATLAS_STUDIO_TIMEOUT_MS)
  return {
    apiKey: env.ATLAS_STUDIO_API_KEY!.trim(),
    baseUrl: env.ATLAS_STUDIO_BASE_URL!.trim().replace(/\/+$/, ""),
    apiVersion: env.ATLAS_STUDIO_API_VERSION!.trim().replace(/^\/+|\/+$/g, ""),
    apiId: env.ATLAS_STUDIO_API_ID!.trim(),
    authHeader: env.ATLAS_STUDIO_AUTH_HEADER?.trim() || "Authorization",
    authScheme: env.ATLAS_STUDIO_AUTH_SCHEME ?? "Bearer",
    imageInputKey: env.ATLAS_STUDIO_IMAGE_INPUT_KEY!.trim(),
    uploadField: env.ATLAS_STUDIO_UPLOAD_FIELD?.trim() || "file",
    resultPath: env.ATLAS_STUDIO_RESULT_PATH!.trim(),
    outputKey: env.ATLAS_STUDIO_OUTPUT_KEY?.trim() ?? "",
    pollMs: Number.isFinite(pollMs) && pollMs >= 500 ? pollMs : 3000,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs >= 1000 ? timeoutMs : 300_000,
  }
}

export function authHeaderValue(config: AtlasConfig): string {
  const scheme = config.authScheme.trim()
  return scheme ? `${scheme} ${config.apiKey}` : config.apiKey
}

export function uploadUrl(config: AtlasConfig): string {
  return `${config.baseUrl}/${config.apiVersion}/upload/${encodeURIComponent(config.apiId)}`
}

export function executeUrl(config: AtlasConfig): string {
  return `${config.baseUrl}/${config.apiVersion}/api_execute_async/${encodeURIComponent(config.apiId)}`
}

export function statusUrl(config: AtlasConfig, executionId: string): string {
  return `${config.baseUrl}/${config.apiVersion}/api_status/${encodeURIComponent(executionId)}`
}

export function buildExecuteBody(
  imageInputKey: string,
  fileId: string,
): Record<string, string> {
  const key = imageInputKey.trim()
  if (!key) throw new Error("ATLAS_STUDIO_IMAGE_INPUT_KEY is empty.")
  if (TEXT_INPUT_KEYS.has(key.toLowerCase())) {
    throw new Error("The Atlas AI Studio execute body accepts an image file id only.")
  }
  return { [key]: fileId }
}

export function buildUploadForm(
  fieldName: string,
  file: { name: string; type: string; bytes: Uint8Array },
): FormData {
  const field = fieldName.trim()
  if (!field) throw new Error("ATLAS_STUDIO_UPLOAD_FIELD is empty.")
  if (TEXT_INPUT_KEYS.has(field.toLowerCase())) {
    throw new Error("The Atlas AI Studio upload accepts an image file only.")
  }
  const form = new FormData()
  const copy = new ArrayBuffer(file.bytes.byteLength)
  new Uint8Array(copy).set(file.bytes)
  const blob = new Blob([copy], { type: file.type || "application/octet-stream" })
  form.append(field, blob, file.name)
  return form
}

export function applyResultPath(
  config: Pick<AtlasConfig, "baseUrl" | "apiVersion" | "apiId" | "resultPath">,
  ids: { executionId: string; fileId: string },
): string | null {
  const template = config.resultPath.trim()
  if (!template) return null
  let path = template
  path = path.split("{base}").join(config.baseUrl)
  path = path.split("{version}").join(config.apiVersion)
  path = path.split("{api_id}").join(encodeURIComponent(config.apiId))
  path = path.split("{execution_id}").join(encodeURIComponent(ids.executionId))
  path = path.split("{file_id}").join(encodeURIComponent(ids.fileId))
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith("/")) return `${config.baseUrl}${path}`
  return `${config.baseUrl}/${path.replace(/^\/+/, "")}`
}

export function findStringField(payload: unknown, keys: readonly string[]): string | null {
  const wanted = new Set(keys.map((key) => key.toLowerCase()))
  const queue: unknown[] = [payload]
  const seen = new Set<unknown>()
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || typeof current !== "object" || seen.has(current)) continue
    seen.add(current)
    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }
    const entries = Object.entries(current as Record<string, unknown>)
    for (const [key, value] of entries) {
      if (wanted.has(key.toLowerCase()) && typeof value === "string" && value.trim()) {
        return value.trim()
      }
    }
    for (const value of entries.map((entry) => entry[1])) queue.push(value)
  }
  return null
}

const QUEUED = new Set(["pending", "queued", "waiting", "submitted", "created"])
const RUNNING = new Set(["running", "processing", "in_progress", "in-progress", "started"])
const READY = new Set(["completed", "complete", "success", "succeeded", "done", "ready"])
const FAILED = new Set(["failed", "failure", "error", "errored", "cancelled", "canceled"])

function findStatusValue(payload: unknown): string | null {
  return findStringField(payload, ["status", "state", "execution_status"])
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readArtifact(value: unknown): { fileId: string | null; downloadUrl: string | null } {
  if (typeof value === "string" && value.trim()) {
    if (/^https?:\/\//i.test(value.trim())) {
      return { fileId: null, downloadUrl: value.trim() }
    }
    return { fileId: value.trim(), downloadUrl: null }
  }
  const record = asRecord(value)
  if (!record) return { fileId: null, downloadUrl: null }
  const url = ["download_url", "url", "file_url", "output_url"]
    .map((key) => record[key])
    .find((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item.trim()))
  const id = ["file_id", "fileId"]
    .map((key) => record[key])
    .find((item): item is string => typeof item === "string" && item.trim().length > 0)
  return {
    fileId: id?.trim() ?? null,
    downloadUrl: url?.trim() ?? null,
  }
}

function outputRecords(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload)
  if (!root) return null
  const result = asRecord(root.result)
  const data = asRecord(root.data)
  const candidates = [result?.outputs, root.outputs, data?.outputs, asRecord(data?.result)?.outputs]
  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (record) return record
  }
  return null
}

function readOutputs(
  payload: unknown,
  outputKey: string,
): { fileId: string | null; downloadUrl: string | null } {
  const outputs = outputRecords(payload)
  if (outputs) {
    if (outputKey && outputKey in outputs) {
      const picked = readArtifact(outputs[outputKey])
      if (picked.fileId || picked.downloadUrl) return picked
    }
    for (const value of Object.values(outputs)) {
      const picked = readArtifact(value)
      if (picked.fileId || picked.downloadUrl) return picked
    }
  }
  const root = asRecord(payload)
  const directUrl = root
    ? ["download_url", "output_url", "file_url", "url"]
        .map((key) => root[key])
        .find((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item.trim()))
    : undefined
  const directId = findStringField(payload, ["file_id", "fileId"])
  return {
    fileId: directId,
    downloadUrl: directUrl?.trim() ?? null,
  }
}

function readError(payload: unknown): string | null {
  const root = asRecord(payload)
  const error = root?.error
  if (typeof error === "string" && error.trim()) return error.trim()
  const nested = asRecord(error)
  const nestedMessage = nested?.error ?? nested?.message
  if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage.trim()
  const message = root?.message
  if (typeof message === "string" && message.trim()) return message.trim()
  return null
}

export function normalizeAtlasStatus(payload: unknown, outputKey = ""): NormalizedStatus {
  const raw = findStatusValue(payload)?.toLowerCase() ?? ""
  const artifact = readOutputs(payload, outputKey)
  let phase: NormalizedStatus["phase"] = "queued"
  if (FAILED.has(raw)) phase = "error"
  else if (READY.has(raw)) phase = "ready"
  else if (RUNNING.has(raw)) phase = "running"
  else if (QUEUED.has(raw)) phase = "queued"
  else if (artifact.fileId || artifact.downloadUrl) phase = "ready"
  else if (raw) phase = "error"

  if (phase === "ready" && !artifact.fileId && !artifact.downloadUrl) {
    return {
      phase: "error",
      message: "Atlas AI Studio finished without a mesh file id or download URL.",
      fileId: null,
      downloadUrl: null,
    }
  }

  if (phase === "error") {
    return {
      phase,
      message: readError(payload) ?? (raw ? `Atlas AI Studio status: ${raw}.` : "Atlas AI Studio returned an unknown status."),
      fileId: null,
      downloadUrl: null,
    }
  }

  const message =
    phase === "ready"
      ? "Atlas AI Studio finished the rig."
      : phase === "running"
        ? "Atlas AI Studio is rigging the mesh."
        : "Atlas AI Studio queued the workflow."

  return {
    phase,
    message,
    fileId: phase === "ready" ? artifact.fileId : null,
    downloadUrl: phase === "ready" ? artifact.downloadUrl : null,
  }
}

export function toClientStatus(status: NormalizedStatus): ClientStatus {
  return {
    phase: status.phase,
    message: status.message,
    ready: status.phase === "ready",
  }
}

export function isSafeId(value: string): boolean {
  return /^[A-Za-z0-9._:-]{1,200}$/.test(value)
}
