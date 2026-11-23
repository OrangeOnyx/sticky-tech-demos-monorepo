import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  csvField,
  exportPayload,
  FORMULA_LAST_ROW,
  HARBOR_COURT_UNITS,
  harborCourtWorkbook,
  PROPERTY_NAME,
  RENT_ROLL_HEADERS,
  RENT_ROLL_SHEET,
  RENT_ROLL_SHEET_ID,
  SUMMARY_FIRST_METRIC_ROW,
  SUMMARY_METRICS,
  SUMMARY_SHEET,
  summarize,
  unitsFromGrid,
  unitsToCsv,
} from "./harbor-court.ts"

describe("Harbor Court fixture", () => {
  it("ships 20 invented units and no Orange Ocean copy", () => {
    assert.equal(HARBOR_COURT_UNITS.length, 20)
    assert.equal(new Set(HARBOR_COURT_UNITS.map((unit) => unit.unit)).size, 20)
    const blob = JSON.stringify(HARBOR_COURT_UNITS)
    assert.equal(blob.includes("Orange Ocean"), false)
    assert.equal(blob.includes("@"), false)
  })

  it("matches the hand-checked occupancy and rent totals", () => {
    const summary = summarize(HARBOR_COURT_UNITS)
    assert.deepEqual(
      {
        units: summary.units,
        occupied: summary.occupied,
        notice: summary.notice,
        vacant: summary.vacant,
        inPlaceOccupancy: summary.inPlaceOccupancy,
        leasedOccupancy: summary.leasedOccupancy,
        totalSqFt: summary.totalSqFt,
        leasedSqFt: summary.leasedSqFt,
        monthlyRent: summary.monthlyRent,
        inPlaceRent: summary.inPlaceRent,
        noticeRent: summary.noticeRent,
        averageRent: summary.averageRent,
      },
      {
        units: 20,
        occupied: 14,
        notice: 2,
        vacant: 4,
        inPlaceOccupancy: 0.7,
        leasedOccupancy: 0.8,
        totalSqFt: 16630,
        leasedSqFt: 13340,
        monthlyRent: 33545,
        inPlaceRent: 29860,
        noticeRent: 3685,
        averageRent: 33545 / 16,
      },
    )
  })
})

describe("grid export", () => {
  it("skips blank unit rows and keeps an edited rent", () => {
    const units = unitsFromGrid([
      ["101", "Mara Ellison", 820, "Occupied", 1850, "2027-03-31"],
      ["", "", "", "", "", ""],
      ["103", "", 710, "Vacant", 0, ""],
      ["104", "Juniper & Co.", 1100, "Occupied", 2700, "2028-01-15"],
    ])
    assert.equal(units.length, 3)
    assert.equal(units[2]?.monthlyRent, 2700)
    assert.equal(summarize(units).monthlyRent, 4550)
  })

  it("keeps a status that is not Occupied, Vacant, or Notice", () => {
    const units = unitsFromGrid([
      ["101", "Mara Ellison", 820, "occupied", 1850, "2027-03-31"],
      ["102", "North Pier Books", 640, "Holdover", 1620, "2026-11-30"],
    ])
    assert.deepEqual(
      units.map((unit) => unit.status),
      ["occupied", "Holdover"],
    )
    const summary = summarize(units)
    assert.equal(summary.units, 2)
    assert.equal(summary.occupied, 0)
    assert.equal(summary.notice, 0)
    assert.equal(summary.vacant, 0)
    assert.match(unitsToCsv(units), /occupied/)
    assert.match(unitsToCsv(units), /Holdover/)
  })

  it("escapes commas and quotes in CSV", () => {
    assert.equal(csvField('North Pier, "Books"'), '"North Pier, ""Books"""')
    const csv = unitsToCsv([
      {
        unit: "101",
        tenant: "North Pier, Books",
        sqFt: 640,
        status: "Occupied",
        monthlyRent: 1620,
        leaseEnd: "2026-11-30",
      },
    ])
    assert.equal(csv.split("\n")[0], RENT_ROLL_HEADERS.join(","))
    assert.match(csv, /"North Pier, Books"/)
  })

  it("builds a JSON payload from rows and sheet formula results", () => {
    const payload = exportPayload(
      HARBOR_COURT_UNITS,
      { ...summarize(HARBOR_COURT_UNITS), monthlyRent: 33545 },
      "2026-11-23T00:00:00.000Z",
    )
    assert.equal(payload.property, PROPERTY_NAME)
    assert.equal(payload.generatedAt, "2026-11-23T00:00:00.000Z")
    assert.equal(payload.units.length, 20)
    assert.equal(payload.summaryFromRows.leasedOccupancy, 0.8)
    assert.equal(payload.summaryFromSheet?.monthlyRent, 33545)
  })
})

describe("workbook snapshot", () => {
  it("puts fixture rows on Rent Roll and formulas on Summary", () => {
    const workbook = harborCourtWorkbook()
    assert.deepEqual(workbook.sheetOrder, ["rent-roll", "summary"])
    const rentRoll = workbook.sheets[RENT_ROLL_SHEET_ID]
    assert.ok(rentRoll)
    assert.equal(rentRoll.name, RENT_ROLL_SHEET)
    assert.equal(rentRoll.cellData[0]?.[0]?.v, "Unit")
    assert.equal(rentRoll.cellData[1]?.[1]?.v, "Mara Ellison")
    assert.equal(rentRoll.cellData[20]?.[0]?.v, "210")
    assert.equal(rentRoll.cellData[3]?.[4]?.v, 0)
    assert.equal(rentRoll.freeze?.ySplit, 1)

    const summary = workbook.sheets.summary
    assert.ok(summary)
    assert.equal(summary.name, SUMMARY_SHEET)
    SUMMARY_METRICS.forEach((metric, index) => {
      const cell = summary.cellData[SUMMARY_FIRST_METRIC_ROW - 1 + index]?.[1]
      assert.equal(cell?.f, metric.formula)
    })
    assert.match(SUMMARY_METRICS[0]?.formula ?? "", new RegExp(`A2:A${FORMULA_LAST_ROW}`))
    assert.match(SUMMARY_METRICS[1]?.formula ?? "", /COUNTIF/)
    assert.match(SUMMARY_METRICS[8]?.formula ?? "", /SUM/)
    const note = JSON.stringify(summary.cellData)
    assert.match(note, /commercial preset/)
    assert.equal(note.includes("Orange Ocean"), false)
  })
})
