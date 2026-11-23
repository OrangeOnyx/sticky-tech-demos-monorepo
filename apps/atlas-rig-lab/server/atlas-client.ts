import {
  applyResultPath,
  authHeaderValue,
  buildExecuteBody,
  buildUploadForm,
  executeUrl,
  findStringField,
  normalizeAtlasStatus,
  statusUrl,
  uploadUrl,
  type AtlasConfig,
  type NormalizedStatus,
} from "../shared/atlas.ts"

function redact(text: string, apiKey: string): string {
  return text.split(apiKey).join("[redacted]").slice(0, 240)
}

async function atlasFetch(
  url: string,
  config: AtlasConfig,
  init: RequestInit,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set(config.authHeader, authHeaderValue(config))
  return fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(60_000),
  })
}

async function readBody(response: Response, config: AtlasConfig): Promise<unknown> {
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Atlas AI Studio returned ${response.status}. ${redact(text, config.apiKey)}`)
  }
  if (!text) return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(`Atlas AI Studio returned ${response.status} with a non-JSON body.`)
  }
}

export async function uploadImage(
  config: AtlasConfig,
  file: { name: string; type: string; bytes: Uint8Array },
): Promise<string> {
  const response = await atlasFetch(uploadUrl(config), config, {
    method: "POST",
    body: buildUploadForm(config.uploadField, file),
  })
  const payload = await readBody(response, config)
  const fileId = findStringField(payload, ["file_id", "fileId"])
  if (!fileId) throw new Error("Atlas AI Studio upload did not return a file_id.")
  return fileId
}

export async function executeWorkflow(config: AtlasConfig, fileId: string): Promise<string> {
  const response = await atlasFetch(executeUrl(config), config, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildExecuteBody(config.imageInputKey, fileId)),
  })
  const payload = await readBody(response, config)
  const executionId = findStringField(payload, ["execution_id", "executionId"])
  if (!executionId) throw new Error("Atlas AI Studio did not return an execution_id.")
  return executionId
}

export async function fetchStatus(
  config: AtlasConfig,
  executionId: string,
): Promise<NormalizedStatus> {
  const response = await atlasFetch(statusUrl(config, executionId), config, { method: "GET" })
  const payload = await readBody(response, config)
  return normalizeAtlasStatus(payload, config.outputKey)
}

export async function downloadMesh(
  config: AtlasConfig,
  status: NormalizedStatus,
  executionId: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const fileId = status.fileId ?? ""
  const url =
    status.downloadUrl ??
    (fileId ? applyResultPath(config, { executionId, fileId }) : null)
  if (!url) {
    throw new Error("Live mode needs ATLAS_STUDIO_RESULT_PATH in .env, or a download URL in the status response.")
  }
  const response = await atlasFetch(url, config, { method: "GET" })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Atlas AI Studio returned ${response.status}. ${redact(text, config.apiKey)}`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0) throw new Error("Atlas AI Studio returned an empty mesh.")
  if (bytes.byteLength > 80 * 1024 * 1024) throw new Error("Atlas AI Studio mesh is larger than 80 MB.")
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "model/gltf-binary"
  return { bytes, contentType }
}
