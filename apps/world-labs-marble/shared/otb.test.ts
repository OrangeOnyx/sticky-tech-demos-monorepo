import { test, expect } from "bun:test"
import {
  OTB_DISPLAY_NAME,
  OTB_PROMPT,
  OTB_REFERENCE_ASSETS,
} from "./otb"

test("OTB prompt names the Lafayette strip", () => {
  expect(OTB_DISPLAY_NAME).toBe("On The Boulevard")
  expect(OTB_PROMPT).toContain("101–149 Arnould Blvd")
  expect(OTB_PROMPT).toContain("Lafayette LA")
})

test("two fixture reference images are the floor plan and satellite", () => {
  expect(OTB_REFERENCE_ASSETS.map((asset) => asset.name)).toEqual([
    "floorplan-center.png",
    "OTB-sat-base.jpg",
  ])
})
