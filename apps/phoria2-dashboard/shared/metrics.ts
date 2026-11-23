import {
  BUILDINGS,
  CHART_BUILDING_ORDER,
  MONTHS,
  type Building,
  type ChartMark,
  type MetricId,
  type Month,
  type Unit,
  findBuilding,
  unitMonth,
} from "./center.ts"

export type ChartRow = {
  building: string
  month: Month
  value: number
}

export function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

export function metricValue(unit: Unit, month: Month, metric: MetricId): number {
  return unitMonth(unit, month)[metric]
}

/** Area-weighted occupancy and rent. Vacancy days are the mean across bays. */
export function buildingValue(building: Building, month: Month, metric: MetricId): number {
  const units = building.units
  if (metric === "vacancyDays") {
    const total = units.reduce((sum, unit) => sum + metricValue(unit, month, metric), 0)
    return Math.round(total / units.length)
  }
  const sqft = units.reduce((sum, unit) => sum + unit.sqft, 0)
  const weighted = units.reduce(
    (sum, unit) => sum + metricValue(unit, month, metric) * unit.sqft,
    0,
  )
  return roundTo(weighted / sqft, 1)
}

export function chartRows(metric: MetricId): ChartRow[] {
  const byName = new Map(BUILDINGS.map((building) => [building.name, building]))
  const rows: ChartRow[] = []
  for (const name of CHART_BUILDING_ORDER) {
    const building = byName.get(name)
    if (!building) throw new Error(`Missing building ${name}`)
    for (const month of building.units[0]?.months.map((entry) => entry.month) ?? []) {
      rows.push({
        building: building.name,
        month,
        value: buildingValue(building, month, metric),
      })
    }
  }
  return rows
}

export function formatMetric(metric: MetricId, value: number): string {
  if (metric === "occupancy") return `${value.toFixed(1)}%`
  if (metric === "rentPsf") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }
  const days = Math.round(value)
  return days === 1 ? "1 day" : `${days} days`
}

export function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** 0 is the low end of the sample scale, 1 is the high end. */
export function normalizeMetric(metric: MetricId, value: number): number {
  if (metric === "occupancy") return clamp01((value - 55) / 45)
  if (metric === "rentPsf") return clamp01((value - 18) / 44)
  return clamp01(value / 31)
}

function lerpChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}

function hexChannel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16)
}

export function lerpHex(from: string, to: string, t: number): string {
  const amount = clamp01(t)
  const channels = [0, 2, 4].map((offset) =>
    lerpChannel(hexChannel(from, 1 + offset), hexChannel(to, 1 + offset), amount)
      .toString(16)
      .padStart(2, "0"),
  )
  return `#${channels.join("")}`
}

/** Cypress greens. Vacancy fades toward sage as days rise, so an empty bay reads lighter. */
export function metricColor(metric: MetricId, value: number): string {
  const t = normalizeMetric(metric, value)
  if (metric === "vacancyDays") return lerpHex("#1e4d3a", "#a1b29a", t)
  return lerpHex("#d2ddcf", "#1e4d3a", t)
}

export function unitHeight(metric: MetricId, value: number): number {
  return roundTo(0.45 + normalizeMetric(metric, value) * 2.6, 3)
}

export function chartSpec(metric: MetricId, mark: ChartMark) {
  const label = metric === "occupancy" ? "Occupancy" : metric === "rentPsf" ? "Rent / sq ft" : "Vacancy days"
  return {
    mark,
    data: chartRows(metric),
    x: { field: "month" as const, title: "Month" },
    z: {
      field: "building" as const,
      title: "Building",
      scale: { domain: [...CHART_BUILDING_ORDER] },
    },
    y: {
      field: "value" as const,
      title: label,
      format: (value: number) => formatMetric(metric, value),
    },
    color:
      mark === "bar"
        ? {
            field: "building" as const,
            title: "Building",
            scale: {
              domain: [...CHART_BUILDING_ORDER],
              range: ["#7c9682", "#4e6255", "#2f6b4e", "#1e4d3a", "#0a1f16"],
            },
          }
        : {
            field: "value" as const,
            title: label,
            scale: { scheme: "blues" as const },
          },
    width: 0.72,
    tooltip: [
      { field: "building" as const, title: "Building" },
      { field: "month" as const, title: "Month" },
      { field: "value" as const, title: label, format: (value: number) => formatMetric(metric, value) },
    ],
    theme: "light" as const,
    box: [12, 6, 9] as [number, number, number],
    description: `Invented ${label.toLowerCase()} for Larkspur Yard by building and month.`,
  }
}

export function isChartRow(value: unknown): value is ChartRow {
  if (!value || typeof value !== "object") return false
  const row = value as Partial<ChartRow>
  return (
    typeof row.building === "string" &&
    typeof row.month === "string" &&
    MONTHS.includes(row.month as Month) &&
    typeof row.value === "number"
  )
}

export function buildingForUnit(unit: Unit): Building {
  const building = findBuilding(unit.buildingId)
  if (!building) throw new Error(`Missing building ${unit.buildingId}`)
  return building
}
