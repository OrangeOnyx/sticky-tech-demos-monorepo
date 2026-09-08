import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { applyDotenv, loadDotenv, parseDotenv } from "./load-env"

test("parseDotenv skips comments and empty lines", () => {
  const values = parseDotenv(`
# comment
WLT_API_KEY=wl-from-file
MARBLE_API_BASE="https://example.test/v1/"

PORT=3001
`)
  assert.deepEqual(values, {
    WLT_API_KEY: "wl-from-file",
    MARBLE_API_BASE: "https://example.test/v1/",
    PORT: "3001",
  })
})

test("applyDotenv does not overwrite existing env", () => {
  const env: NodeJS.ProcessEnv = { WLT_API_KEY: "already-set" }
  applyDotenv({ WLT_API_KEY: "from-file", PORT: "3001" }, env)
  assert.equal(env.WLT_API_KEY, "already-set")
  assert.equal(env.PORT, "3001")
})

test("loadDotenv reads .env next to the app root", () => {
  const root = mkdtempSync(join(tmpdir(), "marble-env-"))
  writeFileSync(join(root, ".env"), "MARBLE_NODE_ENV_TEST=from-disk\n")
  delete process.env.MARBLE_NODE_ENV_TEST
  loadDotenv(root)
  assert.equal(process.env.MARBLE_NODE_ENV_TEST, "from-disk")
  delete process.env.MARBLE_NODE_ENV_TEST
})
