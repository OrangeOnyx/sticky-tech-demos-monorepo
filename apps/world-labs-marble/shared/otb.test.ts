import { test, expect } from "bun:test"
import { existsSync } from "node:fs"
import { join } from "node:path"
import {
  OTB_DISPLAY_NAME,
  OTB_PROMPT,
  OTB_REFERENCE_ASSETS,
} from "./otb"

test("OTB prompt names the Lafayette strip", () => {
  expect(OTB_DISPLAY_NAME).toBe("On The Boulevard")
  expect(OTB_PROMPT).toContain("101–149 Arnould Blvd")
  expect(OTB_PROMPT).toContain("Lafayette LA")
  expect(OTB_PROMPT).toContain("Mediterranean")
})

test("three default Marble images cover floor plan, nadir, and look", () => {
  expect(OTB_REFERENCE_ASSETS.map((asset) => asset.name)).toEqual([
    "drive-floorplan-whole-center.png",
    "drive-georef-nadir.jpg",
    "drive-marketing-style.png",
  ])
  expect(OTB_REFERENCE_ASSETS.map((asset) => asset.label)).toEqual([
    "Whole-center floor plan",
    "Georef nadir aerial",
    "Isometric look / massing",
  ])
})

test("seeded public files exist", () => {
  const publicDir = join(import.meta.dir, "../public")
  for (const asset of OTB_REFERENCE_ASSETS) {
    const relative = asset.url.replace(/^\//, "")
    expect(existsSync(join(publicDir, relative))).toBe(true)
  }
})
