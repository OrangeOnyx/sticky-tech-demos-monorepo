import { expect, test } from "vitest"
import { createActGate } from "./act-gate"

test("a reset during an act ignores that act's writes and then accepts the next one", () => {
  const gate = createActGate()
  gate.start()
  expect(gate.noteReset()).toBe(true)
  expect(gate.accepts({ source: "agent" })).toBe(false)
  expect(gate.accepts({ source: "keyboard" })).toBe(true)
  expect(gate.pending).toBe(true)

  gate.finish()
  expect(gate.pending).toBe(false)
  expect(gate.accepts({ source: "agent" })).toBe(true)
})

test("a reset with nothing in flight still accepts agent writes", () => {
  const gate = createActGate()
  expect(gate.noteReset()).toBe(false)
  expect(gate.accepts({ source: "agent" })).toBe(true)
})

test("suppression stays until every in-flight act settles", () => {
  const gate = createActGate()
  gate.start()
  gate.start()
  gate.noteReset()
  gate.finish()
  expect(gate.accepts({ source: "agent" })).toBe(false)
  gate.finish()
  expect(gate.accepts({ source: "agent" })).toBe(true)
})
