import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  OTB_AERIAL_PREVIEW,
  OTB_DISPLAY_NAME,
  OTB_DRIVE_ASSETS,
  OTB_DRIVE_FEATURED_ASSETS,
  OTB_DROPBOX_ASSETS,
  OTB_LIBRARY_ASSETS,
  OTB_PROMPT,
  OTB_REFERENCE_ASSETS,
} from "./otb"

test("OTB prompt names the Lafayette strip and real photo look", () => {
  assert.equal(OTB_DISPLAY_NAME, "On The Boulevard")
  assert.ok(OTB_PROMPT.includes("101–149 Arnould Blvd"))
  assert.ok(OTB_PROMPT.includes("Lafayette LA"))
  assert.ok(OTB_PROMPT.includes("Nov 2020"))
  assert.ok(OTB_PROMPT.includes("THE PINK PAISLEY"))
  assert.ok(!OTB_PROMPT.includes("Mediterranean"))
})

test("default Marble images are three Dropbox-slot stills", () => {
  assert.deepEqual(
    OTB_REFERENCE_ASSETS.map((asset) => asset.name),
    ["otb-dropbox-53.jpg", "otb-dropbox-70.jpg", "otb-dropbox-80.jpg"],
  )
  assert.deepEqual(
    OTB_REFERENCE_ASSETS.map((asset) => asset.label),
    [
      "Elevated golden-hour strip",
      "Politics boutique interior",
      "Pink Paisley mezzanine interior",
    ],
  )
  assert.ok(OTB_REFERENCE_ASSETS.every((asset) => asset.kind === "dropbox"))
})

test("library keeps Dropbox stills plus live Drive and PostShot media", () => {
  assert.deepEqual(
    OTB_DROPBOX_ASSETS.map((asset) => asset.name),
    [
      "otb-dropbox-53.jpg",
      "otb-dropbox-60.jpg",
      "otb-dropbox-70.jpg",
      "otb-dropbox-80.jpg",
      "otb-dropbox-90.jpg",
      "otb-dropbox-99.jpg",
    ],
  )
  assert.deepEqual(
    OTB_DRIVE_FEATURED_ASSETS.map((asset) => asset.name),
    [
      "floorplan-whole-center.jpg",
      "georef-fit-nadir.jpg",
      "drone.jpg",
      "postshot-check.jpg",
      "postshot-source-S1002525.jpg",
    ],
  )
  assert.ok(OTB_DRIVE_ASSETS.every((asset) => asset.kind === "drive"))
  assert.equal(OTB_LIBRARY_ASSETS.length, OTB_DROPBOX_ASSETS.length + OTB_DRIVE_ASSETS.length)
  assert.ok(!OTB_LIBRARY_ASSETS.some((asset) => asset.url.endsWith(".mp4")))
  assert.ok(OTB_AERIAL_PREVIEW.url.endsWith(".mp4"))
})

test("seeded public files exist", () => {
  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public")
  for (const asset of OTB_LIBRARY_ASSETS) {
    const relative = asset.url.replace(/^\//, "")
    assert.equal(existsSync(join(publicDir, relative)), true, asset.url)
  }
  const aerial = OTB_AERIAL_PREVIEW.url.replace(/^\//, "")
  assert.equal(existsSync(join(publicDir, aerial)), true)
})
