import assert from "node:assert/strict"
import { test } from "node:test"
import { buildExplainerSpec } from "./build-spec.ts"
import { FIXTURES } from "./fixtures.ts"
import { parseRentRoll } from "./parse.ts"
import { REQUIRED_SCENE_TYPES, explainerSpecSchema } from "./spec.ts"

test("fixture specs are valid, ordered, and use parser figures", () => {
  const accents = new Set<string>()
  for (const fixture of FIXTURES) {
    const parsed = parseRentRoll(fixture.csv)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    const spec = buildExplainerSpec(parsed.metrics)
    const validated = explainerSpecSchema.safeParse(spec)
    assert.equal(validated.success, true)
    assert.deepEqual(
      spec.scenes.map((scene) => scene.type),
      REQUIRED_SCENE_TYPES,
    )
    assert.ok(spec.scenes.every((scene) => scene.enabled && scene.durationInFrames >= 15))
    accents.add(spec.scenes[0]?.type === "title" ? spec.scenes[0].accent : "")

    const kpi = spec.scenes.find((scene) => scene.type === "kpi")
    const occupancy = spec.scenes.find((scene) => scene.type === "occupancy")
    const vacancies = spec.scenes.find((scene) => scene.type === "vacancies")
    const expirations = spec.scenes.find((scene) => scene.type === "expirations")
    const rent = spec.scenes.find((scene) => scene.type === "rent")
    assert.equal(kpi?.type === "kpi" ? kpi.value : null, parsed.metrics.occupancyBySqft)
    assert.equal(occupancy?.type === "occupancy" ? occupancy.bySqft : null, parsed.metrics.occupancyBySqft)
    assert.equal(occupancy?.type === "occupancy" ? occupancy.byUnit : null, parsed.metrics.occupancyByUnit)
    assert.deepEqual(
      vacancies?.type === "vacancies" ? vacancies.units.map((unit) => unit.unit) : [],
      parsed.metrics.vacantUnits.map((unit) => unit.unit),
    )
    assert.deepEqual(
      expirations?.type === "expirations" ? expirations.bars.map((bar) => bar.count) : [],
      [
        parsed.metrics.expirations.within3,
        parsed.metrics.expirations.within6,
        parsed.metrics.expirations.within12,
      ],
    )
    assert.equal(rent?.type === "rent" ? rent.avgRentPerSqft : null, parsed.metrics.avgRentPerSqft)
    assert.equal(rent?.type === "rent" ? rent.totalMonthlyRent : null, parsed.metrics.totalMonthlyRent)
  }
  assert.equal(accents.size, 3)
})

test("schema rejects an unknown scene", () => {
  const parsed = parseRentRoll(FIXTURES[0].csv)
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const spec = buildExplainerSpec(parsed.metrics)
  const broken = {
    ...spec,
    scenes: [{ id: "nope", type: "explosion", enabled: true, durationInFrames: 30 }],
  }
  assert.equal(explainerSpecSchema.safeParse(broken).success, false)
})
