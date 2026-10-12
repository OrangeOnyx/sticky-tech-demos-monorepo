import { AS_OF, addMonths, extractDate, isIsoDate } from "./dates.ts"

export type UnitStatus = "occupied" | "vacant"

export type UnitRow = {
  unit: string
  tenant: string
  sqft: number
  rent: number
  leaseEnd: string | null
  status: UnitStatus
}

export type RentRollMetrics = {
  propertyName: string
  asOf: string
  units: UnitRow[]
  occupancyBySqft: number
  occupancyByUnit: number
  vacantUnits: { unit: string; sqft: number }[]
  expirations: { within3: number; within6: number; within12: number }
  avgRentPerSqft: number
  totalMonthlyRent: number
  occupiedSqft: number
  totalSqft: number
  occupiedCount: number
  unitCount: number
}

export type ParseResult =
  | { ok: true; metrics: RentRollMetrics }
  | { ok: false; error: string }

type Field = "unit" | "tenant" | "sqft" | "rent" | "leaseEnd" | "status"

const HEADER_MAP: Record<string, Field> = {
  unit: "unit",
  suite: "unit",
  space: "unit",
  tenant: "tenant",
  occupant: "tenant",
  tenant_name: "tenant",
  sqft: "sqft",
  sf: "sqft",
  sq_ft: "sqft",
  square_feet: "sqft",
  square_ft: "sqft",
  rent: "rent",
  monthly_rent: "rent",
  monthly: "rent",
  lease_end: "leaseEnd",
  lease_end_date: "leaseEnd",
  expiration: "leaseEnd",
  expires: "leaseEnd",
  lease_expiration: "leaseEnd",
  status: "status",
  occupancy: "status",
}

const VACANT_WORDS = new Set(["vacant", "empty", "available"])
const OCCUPIED_WORDS = new Set(["occupied", "leased", "current"])

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        cell += char ?? ""
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ",") {
      row.push(cell.trim())
      cell = ""
      continue
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(cell.trim())
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      cell = ""
      continue
    }
    cell += char ?? ""
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    if (row.some((value) => value.length > 0)) rows.push(row)
  }
  return rows
}

function parseNumber(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/[$,]/g, "")
    .replace(/(?:sq\.?\s*ft|sqft|sf|\/\s*mo(?:nth)?|per\s*month)$/i, "")
    .trim()
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function isHeader(fields: string[]): boolean {
  const mapped = fields.map((field) => HEADER_MAP[normHeader(field)])
  return mapped.includes("unit") && mapped.includes("sqft")
}

function resolveStatus(raw: string, tenant: string): UnitStatus {
  const token = raw.trim().toLowerCase()
  if (VACANT_WORDS.has(token)) return "vacant"
  if (OCCUPIED_WORDS.has(token)) return "occupied"
  if (VACANT_WORDS.has(tenant.trim().toLowerCase())) return "vacant"
  if (!tenant.trim()) return "vacant"
  return "occupied"
}

function cleanTenant(tenant: string, status: UnitStatus): string {
  const trimmed = tenant.trim().slice(0, 80)
  if (status === "vacant" && VACANT_WORDS.has(trimmed.toLowerCase())) return ""
  return trimmed
}

function unitFromColumns(fields: string[], columns: Array<Field | null>): UnitRow | { error: string } {
  const bag: Partial<Record<Field, string>> = {}
  columns.forEach((column, index) => {
    if (column) bag[column] = fields[index] ?? ""
  })
  const unit = (bag.unit ?? "").replace(/^unit\s+/i, "").trim().slice(0, 24)
  if (!unit) return { error: "A row is missing a unit." }
  const sqft = parseNumber(bag.sqft ?? "")
  if (sqft === null || sqft <= 0 || sqft > 10_000_000) {
    return { error: `Couldn't read sqft for unit ${unit}.` }
  }
  const rentValue = parseNumber(bag.rent ?? "") ?? 0
  if (rentValue > 1_000_000_000) return { error: `Rent for unit ${unit} is unreadable.` }
  const leaseRaw = (bag.leaseEnd ?? "").trim()
  const leaseEnd = leaseRaw ? extractDate(leaseRaw) : null
  if (leaseRaw && !leaseEnd) return { error: `Couldn't read the lease end for unit ${unit}.` }
  const status = resolveStatus(bag.status ?? "", bag.tenant ?? "")
  return {
    unit,
    tenant: cleanTenant(bag.tenant ?? "", status),
    sqft,
    rent: rentValue,
    leaseEnd,
    status,
  }
}

function heuristicUnit(fields: string[]): UnitRow | { error: string } {
  const unit = (fields[0] ?? "").replace(/^unit\s+/i, "").trim().slice(0, 24)
  if (!unit) return { error: "Each line needs a unit." }

  let sqft: number | null = null
  let rent: number | null = null
  let leaseEnd: string | null = null
  let status: UnitStatus | null = null
  const names: string[] = []
  const plainNumbers: number[] = []

  for (const field of fields.slice(1)) {
    const trimmed = field.trim()
    if (!trimmed) continue
    const statusWord = trimmed.match(/^(occupied|vacant|leased|empty|available|current)$/i)
    if (statusWord) {
      status = VACANT_WORDS.has(statusWord[1].toLowerCase()) ? "vacant" : "occupied"
      continue
    }
    const date = extractDate(trimmed)
    if (date && (trimmed === date || /lease|end|expir/i.test(trimmed))) {
      leaseEnd = date
      continue
    }
    const sqftMatch = trimmed.match(/^(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|sf)\b\.?$/i)
    if (sqftMatch) {
      sqft = Number(sqftMatch[1].replace(/,/g, ""))
      continue
    }
    const rentMatch =
      trimmed.match(/^\$\s*(\d[\d,]*(?:\.\d+)?)(?:\s*\/\s*mo(?:nth)?)?$/i) ??
      trimmed.match(/^(\d[\d,]*(?:\.\d+)?)\s*(?:\/\s*mo(?:nth)?|per\s+month)$/i)
    if (rentMatch) {
      rent = Number(rentMatch[1].replace(/,/g, ""))
      continue
    }
    if (VACANT_WORDS.has(trimmed.toLowerCase())) {
      status = "vacant"
      continue
    }
    const plain = trimmed.match(/^\$?\s*(\d[\d,]*(?:\.\d+)?)$/)
    if (plain) {
      plainNumbers.push(Number(plain[1].replace(/[$,]/g, "")))
      continue
    }
    names.push(trimmed)
  }

  if (sqft === null && plainNumbers.length > 0) {
    sqft = plainNumbers[0] ?? null
    if (rent === null && plainNumbers[1] !== undefined) rent = plainNumbers[1]
  } else if (rent === null && plainNumbers[0] !== undefined) {
    rent = plainNumbers[0]
  }

  let tenant = names.join(" ").trim()
  if (VACANT_WORDS.has(tenant.toLowerCase())) {
    status = "vacant"
    tenant = ""
  }
  if (!status) status = tenant ? "occupied" : "vacant"
  if (sqft === null || !Number.isFinite(sqft) || sqft <= 0 || sqft > 10_000_000) {
    return { error: `Couldn't read sqft for unit ${unit}.` }
  }
  if (rent === null || !Number.isFinite(rent)) rent = 0
  return {
    unit,
    tenant: cleanTenant(tenant, status),
    sqft,
    rent,
    leaseEnd,
    status,
  }
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-*•]+|\d+[.)])\s+/, "").trim()
}

function protectThousands(line: string): string {
  let current = line
  let previous = ""
  while (current !== previous) {
    previous = current
    current = current.replace(/(\d),(\d{3})(?!\d)/g, "$1$2")
  }
  return current
}

function metricsFromUnits(
  units: UnitRow[],
  propertyName: string,
  asOf: string,
): RentRollMetrics {
  const occupied = units.filter((unit) => unit.status === "occupied")
  const vacant = units.filter((unit) => unit.status === "vacant")
  const occupiedSqft = occupied.reduce((sum, unit) => sum + unit.sqft, 0)
  const totalSqft = units.reduce((sum, unit) => sum + unit.sqft, 0)
  const totalMonthlyRent = round(
    occupied.reduce((sum, unit) => sum + unit.rent, 0),
    2,
  )
  const end3 = addMonths(asOf, 3)
  const end6 = addMonths(asOf, 6)
  const end12 = addMonths(asOf, 12)
  const inWindow = (unit: UnitRow, end: string) =>
    unit.status === "occupied" &&
    unit.leaseEnd !== null &&
    unit.leaseEnd >= asOf &&
    unit.leaseEnd <= end

  return {
    propertyName,
    asOf,
    units,
    occupancyBySqft: totalSqft === 0 ? 0 : round((occupiedSqft / totalSqft) * 100, 1),
    occupancyByUnit: units.length === 0 ? 0 : round((occupied.length / units.length) * 100, 1),
    vacantUnits: vacant.map((unit) => ({ unit: unit.unit, sqft: unit.sqft })),
    expirations: {
      within3: occupied.filter((unit) => inWindow(unit, end3)).length,
      within6: occupied.filter((unit) => inWindow(unit, end6)).length,
      within12: occupied.filter((unit) => inWindow(unit, end12)).length,
    },
    avgRentPerSqft: occupiedSqft === 0 ? 0 : round(totalMonthlyRent / occupiedSqft, 2),
    totalMonthlyRent,
    occupiedSqft,
    totalSqft,
    occupiedCount: occupied.length,
    unitCount: units.length,
  }
}

export function parseRentRoll(
  text: string,
  options?: { asOf?: string; propertyName?: string },
): ParseResult {
  const asOf = options?.asOf ?? AS_OF
  if (!isIsoDate(asOf)) return { ok: false, error: "asOf must be YYYY-MM-DD." }

  const source = text.replace(/^\uFEFF/, "")
  if (!source.trim()) {
    return {
      ok: false,
      error: "Paste a rent roll with columns unit, tenant, sqft, rent, lease_end, status.",
    }
  }

  let named: string | null = null
  const content: string[] = []
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const hashed = trimmed.match(/^#\s*(.+)$/)
    if (hashed) {
      named = hashed[1].trim()
      continue
    }
    const labeled = trimmed.match(/^property\s*:\s*(.+)$/i)
    if (labeled) {
      named = labeled[1].trim()
      continue
    }
    content.push(line)
  }

  if (content.length === 0) {
    return {
      ok: false,
      error: "Paste a rent roll with columns unit, tenant, sqft, rent, lease_end, status.",
    }
  }

  const table = parseCsv(content.join("\n"))
  const header = table[0] && isHeader(table[0]) ? table[0] : null
  const units: UnitRow[] = []

  if (header) {
    const columns = header.map((field) => HEADER_MAP[normHeader(field)] ?? null)
    if (!columns.includes("unit") || !columns.includes("sqft")) {
      return { ok: false, error: "The header needs unit and sqft columns." }
    }
    for (const fields of table.slice(1)) {
      const parsed = unitFromColumns(fields, columns)
      if ("error" in parsed) return { ok: false, error: parsed.error }
      units.push(parsed)
    }
  } else {
    for (const line of content) {
      const fields = parseCsv(protectThousands(stripBullet(line)))[0] ?? []
      const parsed = heuristicUnit(fields)
      if ("error" in parsed) return { ok: false, error: parsed.error }
      units.push(parsed)
    }
  }

  if (units.length === 0) {
    return {
      ok: false,
      error: "Couldn't read any units. Use columns unit, tenant, sqft, rent, lease_end, status.",
    }
  }

  const seen = new Set<string>()
  for (const unit of units) {
    if (seen.has(unit.unit)) return { ok: false, error: `Unit ${unit.unit} is listed twice.` }
    seen.add(unit.unit)
  }

  const override = options?.propertyName?.trim()
  const propertyName = (override || named || "Rent roll").slice(0, 80)
  return { ok: true, metrics: metricsFromUnits(units, propertyName, asOf) }
}
