import { test, expect } from "bun:test"
import { marbleApiBase, resolveAppConfig } from "./env"

test("missing WLT_API_KEY is fixture mode", () => {
  const config = resolveAppConfig({})
  expect(config.mode).toBe("fixture")
  expect(config.hasApiKey).toBe(false)
  expect(config.pollMs).toBe(800)
})

test("present WLT_API_KEY is live mode", () => {
  const config = resolveAppConfig({ WLT_API_KEY: " wl-test " })
  expect(config.mode).toBe("live")
  expect(config.hasApiKey).toBe(true)
  expect(config.pollMs).toBe(4000)
})

test("Marble API base defaults and trims trailing slash", () => {
  expect(marbleApiBase({})).toBe("https://api.worldlabs.ai/marble/v1")
  expect(marbleApiBase({ MARBLE_API_BASE: "https://example.test/v1/" })).toBe(
    "https://example.test/v1",
  )
})
