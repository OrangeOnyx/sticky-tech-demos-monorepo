import { expect, test } from "bun:test"
import { greetingReply, stubReply } from "../../shared/stub-llm"

test("greeting is a short spoken line", () => {
  expect(greetingReply().toLowerCase()).toContain("fixture")
})

test("empty input asks the user to try again", () => {
  expect(stubReply("   ")).toMatch(/try again/i)
})

test("keyword turns stay on the voice demo", () => {
  expect(stubReply("How does barge-in work?")).toMatch(/barge-in/i)
  expect(stubReply("Tell me about Speech Engine")).toMatch(/speech-to-text/i)
  expect(stubReply("hello there")).toMatch(/stub assistant/i)
})

test("generic turns echo the user text", () => {
  expect(stubReply("Remember the blue notebook")).toContain(
    "Remember the blue notebook",
  )
})
