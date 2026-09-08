import { test, expect } from "bun:test"
import { buildWorldPrompt, PromptError, selectModel } from "./prompt"

test("text-only prompt", () => {
  const prompt = buildWorldPrompt({
    text_prompt: "A mossy coastal castle at dusk",
    auto_enhance: true,
  })
  expect(prompt).toEqual({
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
  expect(prompt.type).toBe("image")
  if (prompt.type === "image") {
    expect(prompt.image_prompt.source).toBe("data_base64")
    expect(prompt.disable_recaption).toBe(true)
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
  expect(prompt.type).toBe("multi-image")
  if (prompt.type === "multi-image") {
    expect(prompt.multi_image_prompt.map((item) => item.azimuth)).toEqual([
      0, 120, 240,
    ])
  }
})

test("rejects empty generate requests", () => {
  expect(() => buildWorldPrompt({})).toThrow(PromptError)
})

test("draft model maps to marble-1.0-draft", () => {
  expect(selectModel(true)).toBe("marble-1.0-draft")
  expect(selectModel(false)).toBe("marble-1.1")
})
