import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { matchFixture } from "./match.ts"
import { PRESETS } from "./presets.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

describe("fixture studies", () => {
  it("returns a strong pricing study with a local thumb and DESIGN.md", () => {
    const preset = PRESETS.find((item) => item.id === "dark-saas-pricing")
    assert.ok(preset)
    const study = matchFixture(preset.brief)
    assert.equal(study.match, "strong")
    assert.equal(study.pick?.macrostructure.label, "Feature Stack")
    assert.ok(study.exemplars.length >= 3)
    assert.equal(study.exemplars[0]?.slug, "dovetail-com--pricing")
    assert.equal(study.exemplars[0]?.thumb, "/fixtures/thumbs/dovetail-com--pricing.webp")
    assert.ok(study.palette.includes("#0444fb"))
    assert.match(study.designSystem?.markdown ?? "", /## Typography/)
    assert.match(study.designSystem?.markdown ?? "", /## Spacing scale/)
    assert.equal(study.summary?.typeSteps[0]?.family, "Inter")
    assert.ok(study.summary?.spacing?.includes("96px"))
    assert.deepEqual(study.calls, ["recommend", "get_design_system"])
    const thumb = path.join(root, "public", study.exemplars[0]?.thumb ?? "")
    assert.equal(existsSync(thumb), true)
  })

  it("returns a strong editorial study", () => {
    const preset = PRESETS.find((item) => item.id === "editorial-magazine")
    assert.ok(preset)
    const study = matchFixture(preset.brief)
    assert.equal(study.match, "strong")
    assert.equal(study.exemplars[0]?.slug, "eyemagazine-com")
    assert.equal(study.summary?.typeSteps.find((step) => step.role === "body")?.family, "Georgia")
    assert.match(study.designSystem?.pageUrl ?? "", /eyemagazine-com/)
  })

  it("treats a one-word pricing brief as a partial match of the same study", () => {
    const study = matchFixture("pricing")
    assert.equal(study.match, "partial")
    assert.equal(study.exemplars[0]?.slug, "dovetail-com--pricing")
  })

  it("returns an empty study for an uncatalogued brief", () => {
    const preset = PRESETS.find((item) => item.id === "uncatalogued")
    assert.ok(preset)
    const study = matchFixture(preset.brief)
    assert.equal(study.match, "weak")
    assert.equal(study.exemplars.length, 0)
    assert.equal(study.designSystem, null)
    assert.equal(study.palette.length, 0)
    assert.match(study.note ?? "", /No committed fixture/)
  })
})
