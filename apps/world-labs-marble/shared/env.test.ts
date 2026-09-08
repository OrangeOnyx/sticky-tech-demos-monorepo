import { test, expect } from "bun:test"
import { marbleApiBase, resolveApiPort, resolveAppConfig } from "./env"

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

test("API port defaults for missing/blank values and honors overrides", () => {
  for (const PORT of [undefined, "", "  "]) expect(resolveApiPort({ PORT })).toBe(3001)
  expect(resolveApiPort({ PORT: " 4321 " })).toBe(4321)
})

test("invalid API ports fail instead of silently choosing an unusable port", () => {
  for (const PORT of ["0", "-1", "65536", "1.5", "abc", "NaN", "Infinity", "0x1234"]) {
    expect(() => resolveApiPort({ PORT })).toThrow("PORT must be an integer")
  }
})
