import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  OTB_AERIAL_PREVIEW,
  OTB_ATLAS,
  OTB_DISPLAY_NAME,
  OTB_DRIVE_ASSETS,
  OTB_DRIVE_FEATURED_ASSETS,
  OTB_DROPBOX_ASSETS,
  OTB_FLIGHT_TRACK,
  OTB_LIBRARY_ASSETS,
  OTB_PROMPT,
  OTB_REFERENCE_ASSETS,
  OTB_ROOF_BRIEF_ASSETS,
  OTB_ROOF_BRIEF_FEATURED_ASSETS,
  OTB_SITE_REFERENCE_ASSETS,
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

test("library keeps Dropbox stills plus Drive, roof-brief, and site plats", () => {
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
  assert.deepEqual(
    OTB_ROOF_BRIEF_FEATURED_ASSETS.map((asset) => asset.name),
    [
      "01-membrane-failure-close.jpg",
      "04-thermal-anomaly.jpg",
      "06-nadir-101-end-good-condition.jpg",
    ],
  )
  assert.ok(OTB_DRIVE_ASSETS.every((asset) => asset.kind === "drive"))
  assert.ok(OTB_ROOF_BRIEF_ASSETS.every((asset) => asset.kind === "roof-brief"))
  assert.ok(OTB_SITE_REFERENCE_ASSETS.every((asset) => asset.kind === "reference"))
  assert.equal(
    OTB_LIBRARY_ASSETS.length,
    OTB_DROPBOX_ASSETS.length +
      OTB_DRIVE_ASSETS.length +
      OTB_ROOF_BRIEF_ASSETS.length +
      OTB_SITE_REFERENCE_ASSETS.length,
  )
  assert.ok(!OTB_LIBRARY_ASSETS.some((asset) => asset.url.endsWith(".mp4")))
  assert.ok(!OTB_LIBRARY_ASSETS.some((asset) => asset.url.endsWith(".glb")))
  assert.ok(!OTB_LIBRARY_ASSETS.some((asset) => asset.url.endsWith(".ksplat")))
  assert.ok(OTB_AERIAL_PREVIEW.url.endsWith(".mp4"))
  assert.ok(OTB_FLIGHT_TRACK.url.endsWith(".svg"))
})

test("seeded public files exist", () => {
  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public")
  for (const asset of OTB_LIBRARY_ASSETS) {
    const relative = asset.url.replace(/^\//, "")
    assert.equal(existsSync(join(publicDir, relative)), true, asset.url)
  }
  const extras = [
    OTB_AERIAL_PREVIEW.url,
    OTB_FLIGHT_TRACK.url,
    OTB_ATLAS.meshUrl,
    OTB_ATLAS.splatUrl,
  ]
  for (const url of extras) {
    assert.equal(existsSync(join(publicDir, url.replace(/^\//, ""))), true, url)
  }
})
