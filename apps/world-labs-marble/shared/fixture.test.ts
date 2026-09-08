import assert from "node:assert/strict"
import { test } from "node:test"
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

  assert.equal(started.done, false)
  assert.equal(started.source, "fixture")
  assert.ok(started.metadata?.world_id)

  const mid = getFixtureOperation(started.operation_id)
  assert.equal(mid?.done, false)
  assert.ok((mid?.metadata?.progress?.percent ?? 0) > 0)

  const originalNow = Date.now
  Date.now = () => originalNow() + fixtureDurationMs() + 10
  try {
    const done = getFixtureOperation(started.operation_id)
    assert.equal(done?.done, true)
    assert.equal(done?.response?.id, started.metadata?.world_id)
    assert.equal(done?.response?.source, "fixture")
    assert.equal(done?.response?.display_name, "Greenhouse")
    assert.equal(
      getFixtureWorld(done!.response!.id)?.assets?.thumbnail_url,
      "/otb/otb-dropbox-53.jpg",
    )
    assert.equal(
      getFixtureWorld(done!.response!.id)?.assets?.imagery?.pano_url,
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
    assert.equal(done?.response?.display_name, "On The Boulevard")
    assert.ok(done?.response?.assets?.caption?.includes("On The Boulevard"))
    assert.ok(done?.response?.assets?.caption?.includes("Arnould Blvd"))
    assert.ok(done?.response?.assets?.caption?.includes("Nov 2020"))
  } finally {
    Date.now = originalNow
  }
})

test("unknown fixture operation is null", () => {
  resetFixtureStore()
  assert.equal(getFixtureOperation("missing"), null)
})
