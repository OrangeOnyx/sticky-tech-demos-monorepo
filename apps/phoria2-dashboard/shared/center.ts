/** Invented Larkspur Yard figures. Not a real property and not a real rent roll. */

export const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"] as const
export type Month = (typeof MONTHS)[number]

export const METRICS = [
  { id: "occupancy", label: "Occupancy", hint: "Share of the bay that is leased" },
  { id: "rentPsf", label: "Rent / sq ft", hint: "Invented asking or in-place rent per square foot" },
  { id: "vacancyDays", label: "Vacancy days", hint: "Invented days the bay sat empty that month" },
] as const

export type MetricId = (typeof METRICS)[number]["id"]
export type ChartMark = "bar" | "surface"

export function isMetricId(value: string): value is MetricId {
  return METRICS.some((metric) => metric.id === value)
}

export function isMonth(value: string): value is Month {
  return (MONTHS as readonly string[]).includes(value)
}

export function isChartMark(value: string): value is ChartMark {
  return value === "bar" || value === "surface"
}

export type UnitMonth = {
  month: Month
  occupancy: number
  rentPsf: number
  vacancyDays: number
}

export type Unit = {
  id: string
  code: string
  buildingId: string
  name: string
  tenant: string
  use: string
  floor: number
  sqft: number
  note: string
  months: UnitMonth[]
}

export type Building = {
  id: string
  name: string
  blurb: string
  /** Courtyard position of the building's center, in scene units (x, z). */
  origin: readonly [number, number]
  units: Unit[]
}

type MonthTriple = readonly [occupancy: number, rentPsf: number, vacancyDays: number]

function monthsFrom(triples: readonly MonthTriple[]): UnitMonth[] {
  return MONTHS.map((month, index) => {
    const triple = triples[index]
    if (!triple) throw new Error(`Expected 6 months, missing ${month}`)
    return {
      month,
      occupancy: triple[0],
      rentPsf: triple[1],
      vacancyDays: triple[2],
    }
  })
}

function unit(
  buildingId: string,
  suffix: string,
  name: string,
  tenant: string,
  use: string,
  floor: number,
  sqft: number,
  note: string,
  triples: readonly MonthTriple[],
): Unit {
  return {
    id: `${buildingId}-${suffix}`,
    code: `${buildingId.toUpperCase()}-${suffix}`,
    buildingId,
    name,
    tenant,
    use,
    floor,
    sqft,
    note,
    months: monthsFrom(triples),
  }
}

export const BUILDINGS: readonly Building[] = [
  {
    id: "gh",
    name: "Glasshouse",
    blurb: "A glazed row of small shops along the north edge of the court.",
    origin: [-7, -4.6],
    units: [
      unit(
        "gh",
        "1",
        "Bay 1",
        "Paper Finch Books",
        "Books",
        1,
        1480,
        "Invented bookseller. Open most of the sample year.",
        [
          [97, 52, 0],
          [96, 52, 0],
          [98, 52, 0],
          [97, 52, 0],
          [95, 52, 2],
          [96, 52, 0],
        ],
      ),
      unit(
        "gh",
        "2",
        "Bay 2",
        "Hearth & Kettle",
        "Food",
        1,
        980,
        "Invented lunch counter. Rent is flat across the sample months.",
        [
          [94, 46, 0],
          [95, 46, 0],
          [96, 46, 0],
          [97, 46, 0],
          [98, 46, 0],
          [97, 46, 0],
        ],
      ),
      unit(
        "gh",
        "3",
        "Bay 3",
        "Northglass Coffee",
        "Cafe",
        1,
        720,
        "Invented cafe on the smallest bay, with a higher sample rent per foot.",
        [
          [91, 58, 0],
          [92, 58, 0],
          [94, 58, 0],
          [96, 58, 0],
          [97, 58, 0],
          [95, 58, 1],
        ],
      ),
    ],
  },
  {
    id: "cr",
    name: "Cooper Row",
    blurb: "Three street-facing bays on the northeast side.",
    origin: [7, -4.6],
    units: [
      unit(
        "cr",
        "1",
        "Bay 1",
        "Fieldnote Studio",
        "Studio",
        1,
        1100,
        "Invented design studio. Steady occupancy in the sample.",
        [
          [88, 36, 1],
          [89, 36, 0],
          [90, 36, 0],
          [90, 36, 0],
          [91, 36, 0],
          [90, 36, 0],
        ],
      ),
      unit(
        "cr",
        "2",
        "Bay 2",
        "Bramble Goods",
        "General retail",
        1,
        860,
        "Invented housewares shop.",
        [
          [84, 32, 2],
          [85, 32, 1],
          [86, 32, 0],
          [88, 32, 0],
          [87, 32, 1],
          [86, 32, 0],
        ],
      ),
      unit(
        "cr",
        "3",
        "Bay 3",
        "Pebble Lens",
        "Optical",
        1,
        640,
        "Invented optical shop.",
        [
          [80, 41, 3],
          [81, 41, 2],
          [79, 41, 4],
          [82, 41, 1],
          [83, 41, 0],
          [82, 41, 1],
        ],
      ),
    ],
  },
  {
    id: "ma",
    name: "Mill Annex",
    blurb: "A deeper wing on the southwest. One bay is empty for most of the sample.",
    origin: [-7, 4.8],
    units: [
      unit(
        "ma",
        "1",
        "Bay 1",
        "Quiet Current",
        "Wellness",
        1,
        1600,
        "Invented movement studio. Occupancy eases into early summer in this sample.",
        [
          [76, 28, 2],
          [74, 28, 3],
          [72, 28, 4],
          [70, 28, 5],
          [73, 28, 3],
          [75, 28, 2],
        ],
      ),
      unit(
        "ma",
        "2",
        "Bay 2",
        "Vacant",
        "Vacant",
        1,
        900,
        "Empty through June in this sample. Rent shown is an invented asking rent.",
        [
          [0, 24, 31],
          [0, 24, 30],
          [0, 24, 31],
          [0, 24, 30],
          [35, 24, 14],
          [48, 24, 9],
        ],
      ),
      unit(
        "ma",
        "3",
        "Bay 3",
        "Cedar Thread",
        "Apparel",
        1,
        740,
        "Invented clothing shop.",
        [
          [82, 30, 0],
          [83, 30, 0],
          [81, 30, 1],
          [80, 30, 2],
          [84, 30, 0],
          [85, 30, 0],
        ],
      ),
    ],
  },
  {
    id: "ow",
    name: "Orchard Walk",
    blurb: "Southeast bays. The sample shows a summer lift.",
    origin: [7, 4.8],
    units: [
      unit(
        "ow",
        "1",
        "Bay 1",
        "Orchard Press",
        "Print",
        1,
        1200,
        "Invented print shop. Busier in the later sample months.",
        [
          [70, 34, 4],
          [74, 34, 3],
          [80, 34, 2],
          [86, 34, 1],
          [90, 34, 0],
          [88, 34, 0],
        ],
      ),
      unit(
        "ow",
        "2",
        "Bay 2",
        "Little Juniper",
        "Flowers",
        1,
        680,
        "Invented florist.",
        [
          [60, 40, 8],
          [68, 40, 6],
          [78, 40, 3],
          [88, 40, 1],
          [92, 40, 0],
          [90, 40, 0],
        ],
      ),
      unit(
        "ow",
        "3",
        "Bay 3",
        "Juniper Pop-up",
        "Seasonal retail",
        1,
        420,
        "Invented seasonal bay. Thin in March, fuller by July.",
        [
          [15, 26, 20],
          [25, 26, 16],
          [48, 26, 10],
          [80, 26, 2],
          [92, 26, 0],
          [55, 26, 8],
        ],
      ),
    ],
  },
  {
    id: "lh",
    name: "Lantern Hall",
    blurb: "The center pavilion. Two floors in the sample, drawn as three bays.",
    origin: [0, 0.2],
    units: [
      unit(
        "lh",
        "1",
        "Hall",
        "Lantern Hall Market",
        "Anchor retail",
        1,
        2100,
        "Invented anchor on the ground floor.",
        [
          [96, 44, 0],
          [96, 44, 0],
          [97, 44, 0],
          [97, 44, 0],
          [98, 44, 0],
          [97, 44, 0],
        ],
      ),
      unit(
        "lh",
        "2",
        "Upper 2",
        "Sable Atelier",
        "Workshop",
        2,
        980,
        "Invented workshop on the upper floor.",
        [
          [90, 38, 0],
          [91, 38, 0],
          [92, 38, 0],
          [92, 38, 0],
          [93, 38, 0],
          [92, 38, 0],
        ],
      ),
      unit(
        "lh",
        "3",
        "Upper 3",
        "Wick & Wren",
        "Home",
        2,
        760,
        "Invented home shop upstairs.",
        [
          [87, 35, 1],
          [88, 35, 0],
          [89, 35, 0],
          [90, 35, 0],
          [91, 35, 0],
          [90, 35, 0],
        ],
      ),
    ],
  },
]

/** Shorter buildings first so taller series sit at the back of the chart. */
export const CHART_BUILDING_ORDER = [
  "Mill Annex",
  "Orchard Walk",
  "Cooper Row",
  "Glasshouse",
  "Lantern Hall",
] as const

export const UNIT_WIDTH = 1.55
export const UNIT_DEPTH = 1.7
export const UNIT_GAP = 0.35

export type Placement = {
  id: string
  x: number
  z: number
  width: number
  depth: number
}

export function allUnits(): Unit[] {
  return BUILDINGS.flatMap((building) => [...building.units])
}

export function findUnit(id: string): Unit | undefined {
  return allUnits().find((unit) => unit.id === id)
}

export function findBuilding(id: string): Building | undefined {
  return BUILDINGS.find((building) => building.id === id)
}

export function findBuildingByName(name: string): Building | undefined {
  return BUILDINGS.find((building) => building.name === name)
}

export function unitMonth(unit: Unit, month: Month): UnitMonth {
  const row = unit.months.find((entry) => entry.month === month)
  if (!row) throw new Error(`No ${month} row for ${unit.id}`)
  return row
}

export function placements(): Placement[] {
  const placed: Placement[] = []
  for (const building of BUILDINGS) {
    const count = building.units.length
    const span = count * UNIT_WIDTH + (count - 1) * UNIT_GAP
    building.units.forEach((unit, index) => {
      const x =
        building.origin[0] - span / 2 + UNIT_WIDTH / 2 + index * (UNIT_WIDTH + UNIT_GAP)
      placed.push({
        id: unit.id,
        x,
        z: building.origin[1],
        width: UNIT_WIDTH,
        depth: UNIT_DEPTH,
      })
    })
  }
  return placed
}
