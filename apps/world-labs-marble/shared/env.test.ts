import assert from "node:assert/strict"
import { test } from "node:test"
import { marbleApiBase, resolveApiPort, resolveAppConfig } from "./env"

test("missing WLT_API_KEY is fixture mode", () => {
  const config = resolveAppConfig({})
  assert.equal(config.mode, "fixture")
  assert.equal(config.hasApiKey, false)
  assert.equal(config.pollMs, 800)
})

test("present WLT_API_KEY is live mode", () => {
  const config = resolveAppConfig({ WLT_API_KEY: " wl-test " })
  assert.equal(config.mode, "live")
  assert.equal(config.hasApiKey, true)
  assert.equal(config.pollMs, 4000)
})

test("Marble API base defaults and trims trailing slash", () => {
  assert.equal(marbleApiBase({}), "https://api.worldlabs.ai/marble/v1")
  assert.equal(
    marbleApiBase({ MARBLE_API_BASE: "https://example.test/v1/" }),
    "https://example.test/v1",
  )
})

test("API port defaults for missing/blank values and honors overrides", () => {
  for (const PORT of [undefined, "", "  "]) {
    assert.equal(resolveApiPort({ PORT }), 3001)
  }
  assert.equal(resolveApiPort({ PORT: " 4321 " }), 4321)
})

test("invalid API ports fail instead of silently choosing an unusable port", () => {
  for (const PORT of ["0", "-1", "65536", "1.5", "abc", "NaN", "Infinity", "0x1234"]) {
    assert.throws(() => resolveApiPort({ PORT }), /PORT must be an integer/)
  }
})
