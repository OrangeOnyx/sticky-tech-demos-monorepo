import assert from "node:assert/strict"
import { test } from "node:test"
import { addMonths } from "./dates.ts"
import { FIXTURES } from "./fixtures.ts"
import { parseRentRoll } from "./parse.ts"

const expected = {
  "maple-court": {
    occupancyBySqft: 82.5,
    occupancyByUnit: 71.4,
    occupiedSqft: 9400,
    totalSqft: 11400,
    occupiedCount: 5,
    unitCount: 7,
    totalMonthlyRent: 30000,
    avgRentPerSqft: 3.19,
    vacantUnits: [
      { unit: "103", sqft: 900 },
      { unit: "202", sqft: 1100 },
    ],
    expirations: { within3: 1, within6: 3, within12: 3 },
    firstTenant: "Northwind Coffee",
  },
  riverbend: {
    occupancyBySqft: 80,
    occupancyByUnit: 66.7,
    occupiedSqft: 9600,
    totalSqft: 12000,
    occupiedCount: 4,
    unitCount: 6,
    totalMonthlyRent: 29150,
    avgRentPerSqft: 3.04,
    vacantUnits: [
      { unit: "C", sqft: 1500 },
      { unit: "E", sqft: 900 },
    ],
    expirations: { within3: 1, within6: 2, within12: 3 },
    firstTenant: "Cedar Clinic",
  },
  "harbor-point": {
    occupancyBySqft: 88.1,
    occupancyByUnit: 80,
    occupiedSqft: 8900,
    totalSqft: 10100,
    occupiedCount: 4,
    unitCount: 5,
    totalMonthlyRent: 30300,
    avgRentPerSqft: 3.4,
    vacantUnits: [{ unit: "R2", sqft: 1200 }],
    expirations: { within3: 1, within6: 1, within12: 3 },
    firstTenant: "Salt & Pine Kitchen",
  },
} as const

test("expiration windows are measured from Oct 12, 2026", () => {
  assert.equal(addMonths("2026-10-12", 3), "2027-01-12")
  assert.equal(addMonths("2026-10-12", 6), "2027-04-12")
  assert.equal(addMonths("2026-10-12", 12), "2027-10-12")
})

test("three invented fixtures parse to stable metrics", () => {
  for (const fixture of FIXTURES) {
    const want = expected[fixture.id as keyof typeof expected]
    const csv = parseRentRoll(fixture.csv)
    const bullets = parseRentRoll(fixture.bullets)
    assert.equal(csv.ok, true)
    assert.equal(bullets.ok, true)
    if (!csv.ok || !bullets.ok) return
    assert.equal(csv.metrics.propertyName, fixture.propertyName)
    assert.deepEqual(csv.metrics, bullets.metrics)
    assert.equal(csv.metrics.asOf, "2026-10-12")
    assert.equal(csv.metrics.occupancyBySqft, want.occupancyBySqft)
    assert.equal(csv.metrics.occupancyByUnit, want.occupancyByUnit)
    assert.equal(csv.metrics.occupiedSqft, want.occupiedSqft)
    assert.equal(csv.metrics.totalSqft, want.totalSqft)
    assert.equal(csv.metrics.occupiedCount, want.occupiedCount)
    assert.equal(csv.metrics.unitCount, want.unitCount)
    assert.equal(csv.metrics.totalMonthlyRent, want.totalMonthlyRent)
    assert.equal(csv.metrics.avgRentPerSqft, want.avgRentPerSqft)
    assert.deepEqual(csv.metrics.vacantUnits, want.vacantUnits)
    assert.deepEqual(csv.metrics.expirations, want.expirations)
    assert.equal(csv.metrics.units[0]?.tenant, want.firstTenant)
  }
})

test("fixtures do not contain real portfolio names", () => {
  const blob = JSON.stringify(FIXTURES).toLowerCase()
  for (const banned of ["atlas", "on the boulevard", "yardi", "appfolio"]) {
    assert.equal(blob.includes(banned), false, banned)
  }
})

test("a lease on the window boundary counts, the next day does not", () => {
  const parsed = parseRentRoll(
    `unit,tenant,sqft,rent,lease_end,status
1,Edge,1000,1000,2027-01-12,occupied
2,After,1000,1000,2027-01-13,occupied
3,Already,1000,1000,2026-10-11,occupied
4,Vacant Soon,1000,0,2026-11-01,vacant`,
    { propertyName: "Boundary Court" },
  )
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.deepEqual(parsed.metrics.expirations, { within3: 1, within6: 2, within12: 2 })
  assert.equal(parsed.metrics.totalMonthlyRent, 3000)
  assert.equal(parsed.metrics.avgRentPerSqft, 1)
})

test("quoted tenants, comma money, and an all-vacant roll", () => {
  const quoted = parseRentRoll(
    `unit,tenant,sqft,rent,lease_end,status
1,"Birch, Books",1000,3000,2028-01-01,occupied`,
  )
  assert.equal(quoted.ok, true)
  if (!quoted.ok) return
  assert.equal(quoted.metrics.units[0]?.tenant, "Birch, Books")

  const loose = parseRentRoll(
    "- 9, Sample Goods, 1,400 sqft, $4,900/mo, lease end 2027-03-31, occupied",
    { propertyName: "Sample Goods Hall" },
  )
  assert.equal(loose.ok, true)
  if (!loose.ok) return
  assert.equal(loose.metrics.units[0]?.sqft, 1400)
  assert.equal(loose.metrics.units[0]?.rent, 4900)
  assert.equal(loose.metrics.units[0]?.leaseEnd, "2027-03-31")

  const empty = parseRentRoll(`unit,tenant,sqft,rent,lease_end,status
1,,500,1200,,vacant`)
  assert.equal(empty.ok, true)
  if (!empty.ok) return
  assert.equal(empty.metrics.occupancyBySqft, 0)
  assert.equal(empty.metrics.avgRentPerSqft, 0)
  assert.equal(empty.metrics.totalMonthlyRent, 0)
  assert.equal(empty.metrics.expirations.within12, 0)
})

test("empty and duplicate rolls fail closed", () => {
  assert.equal(parseRentRoll("   ").ok, false)
  const duplicate = parseRentRoll(`unit,tenant,sqft,rent,lease_end,status
1,Alpha,100,100,2028-01-01,occupied
1,Beta,100,100,2028-01-01,occupied`)
  assert.equal(duplicate.ok, false)
  if (!duplicate.ok) assert.match(duplicate.error, /listed twice/)
})
