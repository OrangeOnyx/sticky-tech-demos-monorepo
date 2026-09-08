import { test, expect } from "bun:test"
import { existsSync } from "node:fs"
import { join } from "node:path"
import {
  OTB_DISPLAY_NAME,
  OTB_PROMPT,
  OTB_LIBRARY_ASSETS,
  OTB_REFERENCE_ASSETS,
} from "./otb"

test("OTB prompt names the Lafayette strip and real photo look", () => {
  expect(OTB_DISPLAY_NAME).toBe("On The Boulevard")
  expect(OTB_PROMPT).toContain("101–149 Arnould Blvd")
  expect(OTB_PROMPT).toContain("Lafayette LA")
  expect(OTB_PROMPT).toContain("Nov 2020")
  expect(OTB_PROMPT).toContain("THE PINK PAISLEY")
  expect(OTB_PROMPT).not.toContain("Mediterranean")
})

test("default Marble images are three Dropbox-slot stills", () => {
  expect(OTB_REFERENCE_ASSETS.map((asset) => asset.name)).toEqual([
    "otb-dropbox-53.jpg",
    "otb-dropbox-70.jpg",
    "otb-dropbox-80.jpg",
  ])
  expect(OTB_REFERENCE_ASSETS.map((asset) => asset.label)).toEqual([
    "Elevated golden-hour strip",
    "Politics boutique interior",
    "Pink Paisley mezzanine interior",
  ])
})

test("library keeps all six Dropbox-slot stills", () => {
  expect(OTB_LIBRARY_ASSETS.map((asset) => asset.name)).toEqual([
    "otb-dropbox-53.jpg",
    "otb-dropbox-60.jpg",
    "otb-dropbox-70.jpg",
    "otb-dropbox-80.jpg",
    "otb-dropbox-90.jpg",
    "otb-dropbox-99.jpg",
  ])
})

test("seeded public files exist", () => {
  const publicDir = join(import.meta.dir, "../public")
  for (const asset of OTB_LIBRARY_ASSETS) {
    const relative = asset.url.replace(/^\//, "")
    expect(existsSync(join(publicDir, relative))).toBe(true)
  }
})
