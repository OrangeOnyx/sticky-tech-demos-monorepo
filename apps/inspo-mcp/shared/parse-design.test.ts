import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { summarizeDesign } from "./parse-design.ts"

const catalog = path.join(path.dirname(fileURLToPath(import.meta.url)), "catalog")

describe("DESIGN.md summary", () => {
  it("pulls palette roles, type, and spacing from the Dovetail snapshot", () => {
    const markdown = readFileSync(path.join(catalog, "dark-saas-pricing.design.md"), "utf8")
    const summary = summarizeDesign(markdown)
    assert.equal(summary.paletteRoles[0]?.hex, "#0444fb")
    assert.equal(summary.paletteRoles[2]?.role, "accent")
    assert.equal(summary.typeSteps.find((step) => step.role === "h1")?.size, "112px")
    assert.equal(summary.spacing, "24px · 32px · 64px · 96px · 100px")
    assert.equal(summary.radii, "0px · 8px")
  })
})
