import type { GenerateRequest, WorldPrompt } from "./types"

const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export class PromptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PromptError"
  }
}

export function extensionFromName(name: string, mime: string): string {
  const fromName = name.split(".").pop()?.toLowerCase()
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName
  }
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export function selectModel(draft: boolean): string {
  return draft ? "marble-1.0-draft" : "marble-1.1"
}

export function displayNameFromPrompt(
  displayName: string | undefined,
  textPrompt: string,
): string {
  const named = displayName?.trim()
  if (named) return named.slice(0, 80)
  const fromPrompt = textPrompt.trim().split(/\s+/).slice(0, 6).join(" ")
  return fromPrompt || "Untitled world"
}

function azimuths(count: number): number[] {
  if (count <= 1) return [0]
  return Array.from({ length: count }, (_, index) =>
    Math.round((360 / count) * index),
  )
}

export function buildWorldPrompt(input: GenerateRequest): WorldPrompt {
  const text = input.text_prompt?.trim() || ""
  const images = (input.images ?? []).slice(0, MAX_IMAGES)
  const disable_recaption = input.auto_enhance === false

  if (!text && images.length === 0) {
    throw new PromptError("Enter a text prompt or upload 1–3 images.")
  }

  for (const image of images) {
    const approxBytes = Math.ceil((image.data_base64.length * 3) / 4)
    if (approxBytes > MAX_IMAGE_BYTES) {
      throw new PromptError(
        `Image ${image.name || "upload"} is larger than 4MB.`,
      )
    }
  }

  if (images.length === 0) {
    return {
      type: "text",
      text_prompt: text,
      disable_recaption,
    }
  }

  if (images.length === 1) {
    const image = images[0]
    return {
      type: "image",
      text_prompt: text || null,
      disable_recaption,
      image_prompt: {
        source: "data_base64",
        data_base64: image.data_base64,
        extension: extensionFromName(image.name, image.mime),
      },
    }
  }

  return {
    type: "multi-image",
    text_prompt: text || null,
    disable_recaption,
    multi_image_prompt: images.map((image, index) => ({
      azimuth: azimuths(images.length)[index] ?? 0,
      content: {
        source: "data_base64",
        data_base64: image.data_base64,
        extension: extensionFromName(image.name, image.mime),
      },
    })),
  }
}
