import { formatAsOf, formatInt, formatMoney, formatPct, formatRentPerSqft } from "./format.ts"
import type { RentRollMetrics } from "./parse.ts"
import type { ExplainerSpec } from "./spec.ts"

type Palette = {
  background: string
  ink: string
  muted: string
  accent: string
  vacant: string
}

const MAPLE: Palette = {
  background: "#1A1410",
  ink: "#F6F0E8",
  muted: "#C4B5A5",
  accent: "#E2A15A",
  vacant: "#3F342C",
}

const RIVER: Palette = {
  background: "#101A16",
  ink: "#F2F6F3",
  muted: "#A8BDB4",
  accent: "#8FBF7A",
  vacant: "#24312B",
}

const HARBOR: Palette = {
  background: "#101820",
  ink: "#F3F7FA",
  muted: "#A9BCC8",
  accent: "#7EB6D6",
  vacant: "#243240",
}

function paletteFor(name: string): Palette {
  const normalized = name.toLowerCase()
  if (normalized.includes("river")) return RIVER
  if (normalized.includes("harbor")) return HARBOR
  if (normalized.includes("maple")) return MAPLE
  return MAPLE
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

export function buildExplainerSpec(metrics: RentRollMetrics): ExplainerSpec {
  const palette = paletteFor(metrics.propertyName)
  const asOf = formatAsOf(metrics.asOf)
  const occupied = metrics.units.filter((unit) => unit.status === "occupied")
  const vacantCount = metrics.vacantUnits.length

  return {
    fps: 30,
    width: 1280,
    height: 720,
    background: palette.background,
    ink: palette.ink,
    muted: palette.muted,
    scenes: [
      {
        id: "title",
        type: "title",
        enabled: true,
        durationInFrames: 90,
        propertyName: metrics.propertyName,
        subtitle: `${plural(metrics.unitCount, "suite")} · as of ${asOf}`,
        accent: palette.accent,
      },
      {
        id: "kpi",
        type: "kpi",
        enabled: true,
        durationInFrames: 120,
        label: "Occupied by area",
        value: metrics.occupancyBySqft,
        decimals: 1,
        suffix: "%",
        caption: `${metrics.occupiedCount} of ${metrics.unitCount} suites leased · ${formatPct(metrics.occupancyByUnit)} by suite`,
        accent: palette.accent,
      },
      {
        id: "occupancy",
        type: "occupancy",
        enabled: true,
        durationInFrames: 120,
        title: "Occupancy",
        bySqft: metrics.occupancyBySqft,
        byUnit: metrics.occupancyByUnit,
        caption: `${formatInt(metrics.occupiedSqft)} of ${formatInt(metrics.totalSqft)} sqft leased`,
        occupiedColor: palette.accent,
        vacantColor: palette.vacant,
      },
      {
        id: "vacancies",
        type: "vacancies",
        enabled: true,
        durationInFrames: 105,
        title: "Vacant suites",
        units: metrics.vacantUnits.map((unit) => ({
          unit: unit.unit,
          sqft: unit.sqft,
          note: "Available",
        })),
        emptyLabel: "No suites are vacant.",
        accent: palette.accent,
      },
      {
        id: "expirations",
        type: "expirations",
        enabled: true,
        durationInFrames: 120,
        title: "Leases ending",
        caption: `From ${asOf}. Each bar includes the shorter windows.`,
        bars: [
          { label: "3 months", count: metrics.expirations.within3 },
          { label: "6 months", count: metrics.expirations.within6 },
          { label: "12 months", count: metrics.expirations.within12 },
        ],
        accent: palette.accent,
      },
      {
        id: "rent",
        type: "rent",
        enabled: true,
        durationInFrames: 150,
        title: "Rent per square foot",
        caption: `${formatMoney(metrics.totalMonthlyRent)} per month in place · ${formatRentPerSqft(metrics.avgRentPerSqft)} average per sqft`,
        bars: occupied.slice(0, 8).map((unit) => ({
          label: unit.tenant || unit.unit,
          rentPerSqft: unit.sqft === 0 ? 0 : Math.round((unit.rent / unit.sqft) * 100) / 100,
        })),
        avgRentPerSqft: metrics.avgRentPerSqft,
        totalMonthlyRent: metrics.totalMonthlyRent,
        accent: palette.accent,
      },
      {
        id: "outro",
        type: "outro",
        enabled: true,
        durationInFrames: 90,
        headline: metrics.propertyName,
        lines: [
          `${formatPct(metrics.occupancyBySqft)} of the floor area is leased.`,
          vacantCount === 0
            ? "No suites are vacant."
            : `${plural(vacantCount, "suite")} still vacant.`,
          `${plural(metrics.expirations.within12, "lease")} end within 12 months.`,
        ],
        accent: palette.accent,
      },
    ],
  }
}
