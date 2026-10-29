import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import {
  applyResultPath,
  authHeaderValue,
  buildExecuteBody,
  buildUploadForm,
  executeUrl,
  findStringField,
  liveConfigError,
  missingLiveEnv,
  normalizeAtlasStatus,
  readAtlasConfig,
  statusUrl,
  toClientStatus,
  uploadUrl,
  type AtlasConfig,
} from "./atlas.ts"
import { imageError, parseMultipart } from "./multipart.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixtures = path.join(root, "shared/fixtures")

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(fixtures, name), "utf8")) as unknown
}

const liveEnv: NodeJS.ProcessEnv = {
  ATLAS_STUDIO_API_KEY: "atk_test_secret",
  ATLAS_STUDIO_BASE_URL: "https://api.example.test/",
  ATLAS_STUDIO_API_VERSION: "0.2",
  ATLAS_STUDIO_API_ID: "api_123",
  ATLAS_STUDIO_AUTH_HEADER: "Authorization",
  ATLAS_STUDIO_AUTH_SCHEME: "Bearer",
  ATLAS_STUDIO_IMAGE_INPUT_KEY: "portrait",
  ATLAS_STUDIO_UPLOAD_FIELD: "file",
  ATLAS_STUDIO_RESULT_PATH: "{base}/{version}/download_binary_result/{file_id}",
  ATLAS_STUDIO_POLL_MS: "3000",
  ATLAS_STUDIO_TIMEOUT_MS: "300000",
}

function config(): AtlasConfig {
  const parsed = readAtlasConfig(liveEnv)
  assert.ok(parsed)
  return parsed
}

describe("atlas request building", () => {
  it("requires the export values and never invents a download route", () => {
    const missing = missingLiveEnv({})
    assert.ok(missing.includes("ATLAS_STUDIO_API_KEY"))
    assert.ok(missing.includes("ATLAS_STUDIO_RESULT_PATH"))
    assert.equal(readAtlasConfig({}), null)
    assert.match(liveConfigError(missing), /Live mode needs ATLAS_STUDIO_\* in \.env/)
  })

  it("builds upload and execute URLs from env and sends the image key only", () => {
    const cfg = config()
    assert.equal(uploadUrl(cfg), "https://api.example.test/0.2/upload/api_123")
    assert.equal(executeUrl(cfg), "https://api.example.test/0.2/api_execute_async/api_123")
    assert.equal(statusUrl(cfg, "exec_sample_01"), "https://api.example.test/0.2/api_status/exec_sample_01")
    assert.equal(authHeaderValue(cfg), "Bearer atk_test_secret")

    const body = buildExecuteBody(cfg.imageInputKey, "file_sample_01")
    assert.deepEqual(body, { portrait: "file_sample_01" })
    assert.equal("prompt" in body, false)
    assert.equal("text" in body, false)
    assert.throws(() => buildExecuteBody("prompt", "file_sample_01"), /image file id only/)

    const form = buildUploadForm(cfg.uploadField, {
      name: "hero.png",
      type: "image/png",
      bytes: new Uint8Array([1, 2, 3]),
    })
    assert.deepEqual([...form.keys()], ["file"])
    const file = form.get("file")
    assert.ok(file instanceof Blob)
    assert.equal(file.type, "image/png")
  })

  it("fills the download route from the env template", () => {
    const cfg = config()
    assert.equal(
      applyResultPath(cfg, { executionId: "exec 1", fileId: "file/1" }),
      "https://api.example.test/0.2/download_binary_result/file%2F1",
    )
  })

  it("reads file and execution ids from fixture envelopes", () => {
    assert.equal(findStringField(fixture("atlas-upload.json"), ["file_id"]), "file_sample_01")
    assert.equal(findStringField(fixture("atlas-execute.json"), ["execution_id"]), "exec_sample_01")
  })
})

describe("atlas status normalizer", () => {
  it("maps pending and running fixtures", () => {
    const pending = normalizeAtlasStatus(fixture("atlas-status-pending.json"))
    assert.equal(pending.phase, "queued")
    assert.equal(pending.fileId, null)
    const running = normalizeAtlasStatus(fixture("atlas-status-running.json"))
    assert.equal(running.phase, "running")
    assert.equal(running.downloadUrl, null)
  })

  it("reads a file id from result.outputs", () => {
    const status = normalizeAtlasStatus(fixture("atlas-status-completed.json"), "mesh")
    assert.equal(status.phase, "ready")
    assert.equal(status.fileId, "file_mesh_01")
    assert.equal(status.downloadUrl, null)
    const client = toClientStatus(status)
    assert.deepEqual(Object.keys(client).sort(), ["message", "phase", "ready"])
    assert.equal(client.ready, true)
    assert.equal("fileId" in client, false)
    assert.equal("downloadUrl" in client, false)
  })

  it("accepts an alternate state plus output URL", () => {
    const status = normalizeAtlasStatus(fixture("atlas-status-completed-url.json"))
    assert.equal(status.phase, "ready")
    assert.equal(status.downloadUrl, "https://cdn.example.test/rigs/character.glb")
  })

  it("reads a nested output file id and a failed node error", () => {
    const nested = normalizeAtlasStatus(fixture("atlas-status-nested.json"))
    assert.equal(nested.phase, "ready")
    assert.equal(nested.fileId, "file_nested_9")
    const failed = normalizeAtlasStatus(fixture("atlas-status-failed.json"))
    assert.equal(failed.phase, "error")
    assert.equal(failed.message, "Rig humanoid mesh failed")
    assert.equal(failed.fileId, null)
  })
})

describe("multipart image upload", () => {
  it("keeps the image part and rejects a text-only body", () => {
    const boundary = "riglab"
    const body = Buffer.from(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="image"; filename="hero.png"',
        "Content-Type: image/png",
        "",
        "png-bytes",
        `--${boundary}`,
        'Content-Disposition: form-data; name="prompt"',
        "",
        "a character",
        `--${boundary}--`,
        "",
      ].join("\r\n"),
    )
    const parts = parseMultipart(body, `multipart/form-data; boundary=${boundary}`)
    const image = parts.find((part) => part.filename)
    assert.ok(image)
    assert.equal(image.field, "image")
    assert.equal(image.data.toString(), "png-bytes")
    assert.equal(imageError(image), null)
    const text = parts.find((part) => part.field === "prompt")
    assert.equal(imageError(text), "Image must be PNG, JPEG, or WebP.")
  })
})

describe("client bundle boundary", () => {
  it("does not read the Atlas key from the browser source", () => {
    const src = path.join(root, "src")
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.(tsx?|css)$/.test(entry)) files.push(full)
      }
    }
    walk(src)
    assert.ok(files.length > 0)
    for (const file of files) {
      const text = readFileSync(file, "utf8")
      assert.equal(text.includes("ATLAS_STUDIO_API_KEY"), false, file)
      assert.equal(text.includes("import.meta.env"), false, file)
    }
  })
})
