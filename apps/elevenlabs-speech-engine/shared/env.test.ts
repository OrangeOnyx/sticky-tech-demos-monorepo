import { expect, test } from "bun:test"
import { resolveAppConfig } from "./env"

test("missing API key is fixture mode", () => {
  const config = resolveAppConfig({})
  expect(config.mode).toBe("fixture")
  expect(config.liveReady).toBe(false)
})

test("API key without engine id is live but not ready", () => {
  const config = resolveAppConfig({ ELEVENLABS_API_KEY: "sk_test" })
  expect(config.mode).toBe("live")
  expect(config.liveReady).toBe(false)
  expect(config.hasApiKey).toBe(true)
})

test("API key plus engine id is live-ready", () => {
  const config = resolveAppConfig({
    ELEVENLABS_API_KEY: "sk_test",
    ELEVENLABS_SPEECH_ENGINE_ID: "seng_demo",
  })
  expect(config.mode).toBe("live")
  expect(config.liveReady).toBe(true)
})
