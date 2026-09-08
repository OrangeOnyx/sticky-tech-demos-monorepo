import assert from "node:assert/strict"
import { test } from "node:test"
import { buildWorldPrompt, PromptError, selectModel } from "./prompt"

test("text-only prompt", () => {
  const prompt = buildWorldPrompt({
    text_prompt: "A mossy coastal castle at dusk",
    auto_enhance: true,
  })
  assert.deepEqual(prompt, {
    type: "text",
    text_prompt: "A mossy coastal castle at dusk",
    disable_recaption: false,
  })
})

test("one image uses image prompt", () => {
  const prompt = buildWorldPrompt({
    text_prompt: "Keep the lighting warm",
    auto_enhance: false,
    images: [
      {
        name: "ref.png",
        mime: "image/png",
        extension: "png",
        data_base64: "aaaa",
      },
    ],
  })
  assert.equal(prompt.type, "image")
  if (prompt.type === "image") {
    assert.equal(prompt.image_prompt.source, "data_base64")
    assert.equal(prompt.disable_recaption, true)
  }
})

test("two or three images use multi-image with azimuths", () => {
  const prompt = buildWorldPrompt({
    images: [
      { name: "a.jpg", mime: "image/jpeg", extension: "jpg", data_base64: "a" },
      { name: "b.jpg", mime: "image/jpeg", extension: "jpg", data_base64: "b" },
      { name: "c.jpg", mime: "image/jpeg", extension: "jpg", data_base64: "c" },
    ],
  })
  assert.equal(prompt.type, "multi-image")
  if (prompt.type === "multi-image") {
    assert.deepEqual(
      prompt.multi_image_prompt.map((item) => item.azimuth),
      [0, 120, 240],
    )
  }
})

test("rejects empty generate requests", () => {
  assert.throws(() => buildWorldPrompt({}), PromptError)
})

test("draft model maps to marble-1.0-draft", () => {
  assert.equal(selectModel(true), "marble-1.0-draft")
  assert.equal(selectModel(false), "marble-1.1")
})
