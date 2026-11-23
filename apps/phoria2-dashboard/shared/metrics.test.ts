import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  BUILDINGS,
  CHART_BUILDING_ORDER,
  MONTHS,
  allUnits,
  findUnit,
  placements,
} from "./center.ts"
import {
  buildingValue,
  chartRows,
  chartSpec,
  formatMetric,
  metricColor,
  normalizeMetric,
  unitHeight,
} from "./metrics.ts"

describe("Larkspur Yard fixture", () => {
  it("is five buildings, fifteen bays, and six sample months", () => {
    assert.equal(BUILDINGS.length, 5)
    assert.equal(allUnits().length, 15)
    for (const unit of allUnits()) {
      assert.equal(unit.months.length, 6)
      assert.deepEqual(
        unit.months.map((row) => row.month),
        [...MONTHS],
      )
      for (const row of unit.months) {
        assert.ok(row.occupancy >= 0 && row.occupancy <= 100)
        assert.ok(row.rentPsf > 0)
        assert.ok(row.vacancyDays >= 0)
      }
    }
  })

  it("uses invented names only", () => {
    const text = JSON.stringify(BUILDINGS).toLowerCase()
    assert.equal(text.includes("orange ocean"), false)
    assert.equal(text.includes("on the boulevard"), false)
  })
})

describe("building rollups", () => {
  it("area-weights Glasshouse occupancy for March", () => {
    const glasshouse = BUILDINGS[0]
    assert.equal(glasshouse?.name, "Glasshouse")
    if (!glasshouse) return
    const sqft = glasshouse.units.reduce((sum, unit) => sum + unit.sqft, 0)
    const weighted =
      glasshouse.units.reduce((sum, unit) => {
        const march = unit.months[0]
        assert.ok(march)
        return sum + march.occupancy * unit.sqft
      }, 0) / sqft
    assert.equal(buildingValue(glasshouse, "Mar", "occupancy"), Math.round(weighted * 10) / 10)
    assert.equal(buildingValue(glasshouse, "Mar", "occupancy"), 94.7)
  })

  it("averages vacancy days across Mill Annex bays", () => {
    const annex = BUILDINGS.find((building) => building.id === "ma")
    assert.ok(annex)
    assert.equal(buildingValue(annex, "Mar", "vacancyDays"), 11)
  })

  it("builds one chart row per building per month", () => {
    const rows = chartRows("rentPsf")
    assert.equal(rows.length, CHART_BUILDING_ORDER.length * MONTHS.length)
    assert.equal(rows[0]?.building, "Mill Annex")
    assert.equal(rows[0]?.month, "Mar")
    const glasshouse = BUILDINGS[0]
    assert.ok(glasshouse)
    const match = rows.find((row) => row.building === "Glasshouse" && row.month === "Mar")
    assert.equal(match?.value, buildingValue(glasshouse, "Mar", "rentPsf"))
    assert.equal(match?.value, 51.5)
  })
})

describe("formatting and yard scale", () => {
  it("formats each metric", () => {
    assert.equal(formatMetric("occupancy", 94.7), "94.7%")
    assert.equal(formatMetric("rentPsf", 51.5), "$51.50")
    assert.equal(formatMetric("vacancyDays", 1), "1 day")
    assert.equal(formatMetric("vacancyDays", 11), "11 days")
  })

  it("keeps colors inside the sample scale", () => {
    assert.equal(normalizeMetric("occupancy", 55), 0)
    assert.equal(normalizeMetric("occupancy", 100), 1)
    assert.equal(metricColor("occupancy", 55), "#d2ddcf")
    assert.equal(metricColor("occupancy", 100), "#1e4d3a")
    assert.equal(metricColor("vacancyDays", 0), "#1e4d3a")
    assert.ok(unitHeight("occupancy", 100) > unitHeight("occupancy", 55))
  })

  it("places every bay without overlapping its neighbors", () => {
    const boxes = placements()
    assert.equal(boxes.length, 15)
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]
        const b = boxes[j]
        assert.ok(a && b)
        const gapX = Math.abs(a.x - b.x) - (a.width + b.width) / 2
        const gapZ = Math.abs(a.z - b.z) - (a.depth + b.depth) / 2
        const separated = gapX > 0.3 || gapZ > 0.3
        assert.equal(separated, true, `${a.id} overlaps ${b.id}`)
      }
    }
  })

  it("points the chart spec at the selected metric", () => {
    const spec = chartSpec("occupancy", "surface")
    assert.equal(spec.mark, "surface")
    assert.equal(spec.data.length, 30)
    assert.equal(spec.y.title, "Occupancy")
    assert.equal(findUnit("ma-2")?.tenant, "Vacant")
  })
})
