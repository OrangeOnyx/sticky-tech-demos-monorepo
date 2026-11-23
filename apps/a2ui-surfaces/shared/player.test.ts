import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { Catalog, MessageProcessor } from "@a2ui/web_core/v0_9"
import { basicCatalog } from "@a2ui/web_core/v0_9/basic_catalog"
import { propertyCatalogApis } from "./catalog-api.ts"
import { buildLiveStub, liveAgentEnabled, sanitizePrompt } from "./live.ts"
import { intervalMs, stepBack, stepForward } from "./playback.ts"
import {
  PROPERTY_CATALOG_ID,
  fixtureProblems,
  messageKind,
  messageSummary,
} from "./protocol.ts"
import { showingMessages } from "../src/fixtures/showing.ts"
import { workOrderMessages } from "../src/fixtures/work-order.ts"

function replay(messages: typeof workOrderMessages) {
  const catalog = new Catalog(
    PROPERTY_CATALOG_ID,
    "v0.9",
    [...basicCatalog.components.values(), ...propertyCatalogApis],
    [...basicCatalog.functions.values()],
  )
  const processor = new MessageProcessor([catalog])
  processor.processMessages(messages)
  return processor
}

describe("fixtures", () => {
  it("accepts the work order stream", () => {
    assert.deepEqual(fixtureProblems(workOrderMessages), [])
    assert.equal(messageKind(workOrderMessages[0]), "createSurface")
    assert.match(messageSummary(workOrderMessages[1]), /updateComponents · root, intro/)
    const processor = replay(workOrderMessages)
    const surface = processor.getSurface("work-order")
    assert.ok(surface)
    assert.equal(surface.componentsModel.get("root")?.id, "root")
    assert.equal(surface.dataModel.get("/recordId"), "WO-1842")
    assert.equal(surface.dataModel.get("/priority/level"), "urgent")
    assert.match(String(surface.dataModel.get("/filing/status")), /Northline Mechanical/)
    processor.dispose()
  })

  it("accepts the showing stream and selects the afternoon slot", () => {
    assert.deepEqual(fixtureProblems(showingMessages), [])
    const before = JSON.stringify(showingMessages)
    const processor = replay(structuredClone(showingMessages))
    assert.equal(JSON.stringify(showingMessages), before)
    const surface = processor.getSurface("showing")
    assert.ok(surface)
    assert.equal(surface.componentsModel.get("slot-afternoon")?.id, "slot-afternoon")
    assert.equal(surface.dataModel.get("/slots/afternoon"), true)
    assert.equal(surface.dataModel.get("/slots/morning"), false)
    assert.match(String(surface.dataModel.get("/confirm")), /Jordan Hale/)
    processor.dispose()
  })

  it("rejects a stream that skips createSurface", () => {
    const problems = fixtureProblems(workOrderMessages.slice(1))
    assert.ok(problems.some((problem) => problem.includes("createSurface")))
  })
})

describe("playback", () => {
  it("steps forward, stops at the end, and steps back", () => {
    const length = workOrderMessages.length
    assert.equal(stepForward(0, length), 1)
    assert.equal(stepForward(length, length), length)
    assert.equal(stepBack(0, length), 0)
    assert.equal(stepBack(3, length), 2)
  })

  it("maps speed to a shorter interval", () => {
    assert.equal(intervalMs(1), 800)
    assert.equal(intervalMs(2), 400)
    assert.ok(intervalMs(4) < intervalMs(0.5))
  })
})

describe("live stub", () => {
  it("stays off without a key", () => {
    assert.equal(liveAgentEnabled(undefined), false)
    assert.equal(liveAgentEnabled(null), false)
    assert.equal(liveAgentEnabled(""), false)
    assert.equal(liveAgentEnabled("   "), false)
  })

  it("replays a canned stream that includes the prompt and calls nothing", () => {
    assert.equal(liveAgentEnabled("local-stub"), true)
    const messages = buildLiveStub("  Check the west closet\nplease  ")
    assert.deepEqual(fixtureProblems(messages), [])
    const blob = JSON.stringify(messages)
    assert.match(blob, /Check the west closet please/)
    assert.equal(blob.includes("api.openai"), false)
    assert.equal(blob.includes("generativelanguage"), false)
    const processor = replay(messages)
    assert.equal(
      processor.getSurface("live-stub")?.dataModel.get("/reply"),
      "Check the west closet please",
    )
    processor.dispose()
  })

  it("caps a long prompt", () => {
    const prompt = "drip ".repeat(100)
    assert.equal(sanitizePrompt(prompt).length, 280)
  })
})
