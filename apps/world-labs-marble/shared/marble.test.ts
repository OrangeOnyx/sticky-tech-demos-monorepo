import assert from "node:assert/strict"
import { test } from "node:test"
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
  assert.equal(pickSplatUrl(world), "https://example/500k.spz")
})

test("allows Marble and GCS asset hosts only", () => {
  assert.equal(
    isAllowedAssetUrl("https://storage.googleapis.com/bucket/world.spz"),
    true,
  )
  assert.equal(isAllowedAssetUrl("https://marble.worldlabs.ai/world/abc"), true)
  assert.equal(isAllowedAssetUrl("https://evil.example/steal"), false)
  assert.equal(isAllowedAssetUrl("http://storage.googleapis.com/x"), false)
})
