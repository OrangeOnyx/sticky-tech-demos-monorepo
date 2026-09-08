import { test, expect } from "bun:test"
import {
  createFixtureJob,
  fixtureDurationMs,
  getFixtureOperation,
  getFixtureWorld,
  resetFixtureStore,
} from "./fixture"

test("fixture job polls from queued to ready", () => {
  resetFixtureStore()
  const started = createFixtureJob({
    text_prompt: "A lantern-lit greenhouse",
    display_name: "Greenhouse",
  })

  expect(started.done).toBe(false)
  expect(started.source).toBe("fixture")
  expect(started.metadata?.world_id).toBeTruthy()

  const mid = getFixtureOperation(started.operation_id)
  expect(mid?.done).toBe(false)
  expect(mid?.metadata?.progress?.percent).toBeGreaterThan(0)

  const originalNow = Date.now
  Date.now = () => originalNow() + fixtureDurationMs() + 10
  try {
    const done = getFixtureOperation(started.operation_id)
    expect(done?.done).toBe(true)
    expect(done?.response?.id).toBe(started.metadata?.world_id)
    expect(done?.response?.source).toBe("fixture")
    expect(done?.response?.display_name).toBe("Greenhouse")
    expect(getFixtureWorld(done!.response!.id)?.assets?.thumbnail_url).toBe(
      "/otb/otb-dropbox-53.jpg",
    )
    expect(getFixtureWorld(done!.response!.id)?.assets?.imagery?.pano_url).toBe(
      "/otb/otb-dropbox-99.jpg",
    )
  } finally {
    Date.now = originalNow
  }
})

test("OTB fixture caption names the shopping center", () => {
  resetFixtureStore()
  const started = createFixtureJob({
    text_prompt:
      "Create a navigable 3D world of On The Boulevard Shopping Center",
    display_name: "On The Boulevard",
  })
  const originalNow = Date.now
  Date.now = () => originalNow() + fixtureDurationMs() + 10
  try {
    const done = getFixtureOperation(started.operation_id)
    expect(done?.response?.display_name).toBe("On The Boulevard")
    expect(done?.response?.assets?.caption).toContain("On The Boulevard")
    expect(done?.response?.assets?.caption).toContain("Arnould Blvd")
    expect(done?.response?.assets?.caption).toContain("Nov 2020")
  } finally {
    Date.now = originalNow
  }
})

test("unknown fixture operation is null", () => {
  resetFixtureStore()
  expect(getFixtureOperation("missing")).toBeNull()
})
