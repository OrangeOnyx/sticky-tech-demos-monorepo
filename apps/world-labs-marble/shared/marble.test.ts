import { test, expect } from "bun:test"
import { isAllowedAssetUrl, pickSplatUrl } from "./world-assets"
import type { World } from "./types"

test("picks a mid-res splat URL when available", () => {
  const world: World = {
    id: "w1",
    assets: {
      splats: {
        spz_urls: {
          "100k": "https://example/100k.spz",
          "500k": "https://example/500k.spz",
          full_res: "https://example/full.spz",
        },
      },
    },
  }
  expect(pickSplatUrl(world)).toBe("https://example/500k.spz")
})

test("allows Marble and GCS asset hosts only", () => {
  expect(
    isAllowedAssetUrl("https://storage.googleapis.com/bucket/world.spz"),
  ).toBe(true)
  expect(isAllowedAssetUrl("https://marble.worldlabs.ai/world/abc")).toBe(true)
  expect(isAllowedAssetUrl("https://evil.example/steal")).toBe(false)
  expect(isAllowedAssetUrl("http://storage.googleapis.com/x")).toBe(false)
})
