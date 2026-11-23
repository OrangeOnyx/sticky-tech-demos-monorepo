/**
 * Invented Harbor Court rent roll. Every tenant, rent, and date is made up.
 * Nothing here is a real property record.
 */

export const PROPERTY_NAME = "Harbor Court"
export const PROPERTY_NOTE =
  "Invented sample for a Univer demo. Not a real property, tenant, or rent roll."
export const RENT_ROLL_SHEET = "Rent Roll"
export const SUMMARY_SHEET = "Summary"
export const RENT_ROLL_SHEET_ID = "rent-roll"
export const SUMMARY_SHEET_ID = "summary"
export const WORKBOOK_ID = "harbor-court"

/** First data row in A1 notation. Row 1 is the header. */
export const FIRST_DATA_ROW = 2
/** Formula ranges extend past the 20 fixture rows so a few added units still count. */
export const FORMULA_LAST_ROW = 100
/** Summary metrics start on this A1 row (column B holds the formula). */
export const SUMMARY_FIRST_METRIC_ROW = 5

export const UNIT_STATUSES = ["Occupied", "Vacant", "Notice"] as const
export type UnitStatus = (typeof UNIT_STATUSES)[number]

export type UnitRecord = {
  unit: string
  tenant: string
  sqFt: number
  status: UnitStatus
  monthlyRent: number
  leaseEnd: string
}

export type Summary = {
  units: number
  occupied: number
  notice: number
  vacant: number
  inPlaceOccupancy: number
  leasedOccupancy: number
  totalSqFt: number
  leasedSqFt: number
  monthlyRent: number
  inPlaceRent: number
  noticeRent: number
  averageRent: number
}

export type SheetSummary = { [Key in keyof Summary]: number | null }

export const RENT_ROLL_HEADERS = [
  "Unit",
  "Tenant",
  "Sq ft",
  "Status",
  "Monthly rent",
  "Lease end",
] as const

export const HARBOR_COURT_UNITS: UnitRecord[] = [
  { unit: "101", tenant: "Mara Ellison", sqFt: 820, status: "Occupied", monthlyRent: 1850, leaseEnd: "2027-03-31" },
  { unit: "102", tenant: "North Pier Books", sqFt: 640, status: "Occupied", monthlyRent: 1620, leaseEnd: "2026-11-30" },
  { unit: "103", tenant: "", sqFt: 710, status: "Vacant", monthlyRent: 0, leaseEnd: "" },
  { unit: "104", tenant: "Juniper & Co.", sqFt: 1100, status: "Occupied", monthlyRent: 2640, leaseEnd: "2028-01-15" },
  { unit: "105", tenant: "Theo March", sqFt: 540, status: "Notice", monthlyRent: 1495, leaseEnd: "2026-12-31" },
  { unit: "106", tenant: "Harbor Light Dental", sqFt: 980, status: "Occupied", monthlyRent: 2450, leaseEnd: "2027-08-01" },
  { unit: "107", tenant: "", sqFt: 600, status: "Vacant", monthlyRent: 0, leaseEnd: "" },
  { unit: "108", tenant: "Lila Voss Studio", sqFt: 760, status: "Occupied", monthlyRent: 1980, leaseEnd: "2027-05-31" },
  { unit: "109", tenant: "Cedar Row Cafe", sqFt: 890, status: "Occupied", monthlyRent: 2310, leaseEnd: "2028-06-30" },
  { unit: "110", tenant: "Owen Park", sqFt: 520, status: "Occupied", monthlyRent: 1380, leaseEnd: "2026-09-30" },
  { unit: "201", tenant: "Brightline Tutoring", sqFt: 700, status: "Occupied", monthlyRent: 1760, leaseEnd: "2027-02-28" },
  { unit: "202", tenant: "", sqFt: 480, status: "Vacant", monthlyRent: 0, leaseEnd: "" },
  { unit: "203", tenant: "Naomi Pell Legal", sqFt: 1250, status: "Occupied", monthlyRent: 3125, leaseEnd: "2029-04-30" },
  { unit: "204", tenant: "Sable & Finch", sqFt: 930, status: "Notice", monthlyRent: 2190, leaseEnd: "2026-12-15" },
  { unit: "205", tenant: "Wes Calder", sqFt: 610, status: "Occupied", monthlyRent: 1540, leaseEnd: "2027-10-31" },
  { unit: "206", tenant: "Kinfolk Records", sqFt: 840, status: "Occupied", monthlyRent: 2100, leaseEnd: "2028-03-01" },
  { unit: "207", tenant: "", sqFt: 1500, status: "Vacant", monthlyRent: 0, leaseEnd: "" },
  { unit: "208", tenant: "Petra Lang Architecture", sqFt: 1180, status: "Occupied", monthlyRent: 2950, leaseEnd: "2028-09-30" },
  { unit: "209", tenant: "Milo Hart", sqFt: 560, status: "Occupied", monthlyRent: 1475, leaseEnd: "2027-01-31" },
  { unit: "210", tenant: "Wharfside Atelier", sqFt: 1020, status: "Occupied", monthlyRent: 2680, leaseEnd: "2027-07-31" },
]

function colRange(column: string): string {
  return `'${RENT_ROLL_SHEET}'!${column}${FIRST_DATA_ROW}:${column}${FORMULA_LAST_ROW}`
}

export type SummaryMetric = {
  key: keyof Summary
  label: string
  formula: string
  format: "int" | "percent" | "money" | "moneyExact"
  note: string
}

export const SUMMARY_METRICS: SummaryMetric[] = [
  {
    key: "units",
    label: "Units",
    formula: `=COUNTA(${colRange("A")})`,
    format: "int",
    note: "Non-blank unit ids",
  },
  {
    key: "occupied",
    label: "Occupied",
    formula: `=COUNTIF(${colRange("D")},"Occupied")`,
    format: "int",
    note: "Status is Occupied",
  },
  {
    key: "notice",
    label: "Notice",
    formula: `=COUNTIF(${colRange("D")},"Notice")`,
    format: "int",
    note: "Status is Notice",
  },
  {
    key: "vacant",
    label: "Vacant",
    formula: `=COUNTIF(${colRange("D")},"Vacant")`,
    format: "int",
    note: "Status is Vacant",
  },
  {
    key: "inPlaceOccupancy",
    label: "In-place occupancy",
    formula: "=IF(B5=0,0,B6/B5)",
    format: "percent",
    note: "Occupied ÷ units",
  },
  {
    key: "leasedOccupancy",
    label: "Leased occupancy",
    formula: "=IF(B5=0,0,(B6+B7)/B5)",
    format: "percent",
    note: "(Occupied + Notice) ÷ units",
  },
  {
    key: "totalSqFt",
    label: "Total sq ft",
    formula: `=SUM(${colRange("C")})`,
    format: "int",
    note: "Every unit, including vacant",
  },
  {
    key: "leasedSqFt",
    label: "Leased sq ft",
    formula: `=SUMIF(${colRange("D")},"Occupied",${colRange("C")})+SUMIF(${colRange("D")},"Notice",${colRange("C")})`,
    format: "int",
    note: "Occupied and notice sq ft",
  },
  {
    key: "monthlyRent",
    label: "Monthly rent",
    formula: `=SUM(${colRange("E")})`,
    format: "money",
    note: "Vacant units contribute $0",
  },
  {
    key: "inPlaceRent",
    label: "In-place rent",
    formula: `=SUMIF(${colRange("D")},"Occupied",${colRange("E")})`,
    format: "money",
    note: "Occupied rent only",
  },
  {
    key: "noticeRent",
    label: "Notice rent",
    formula: `=SUMIF(${colRange("D")},"Notice",${colRange("E")})`,
    format: "money",
    note: "Notice rent only",
  },
  {
    key: "averageRent",
    label: "Average leased rent",
    formula: "=IF((B6+B7)=0,0,(B14+B15)/(B6+B7))",
    format: "moneyExact",
    note: "Average of occupied and notice rents",
  },
]

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function summarize(units: UnitRecord[]): Summary {
  const occupied = units.filter((unit) => unit.status === "Occupied")
  const notice = units.filter((unit) => unit.status === "Notice")
  const vacant = units.filter((unit) => unit.status === "Vacant")
  const unitCount = units.length
  const leasedCount = occupied.length + notice.length
  const inPlaceRent = sum(occupied.map((unit) => unit.monthlyRent))
  const noticeRent = sum(notice.map((unit) => unit.monthlyRent))
  return {
    units: unitCount,
    occupied: occupied.length,
    notice: notice.length,
    vacant: vacant.length,
    inPlaceOccupancy: unitCount === 0 ? 0 : occupied.length / unitCount,
    leasedOccupancy: unitCount === 0 ? 0 : leasedCount / unitCount,
    totalSqFt: sum(units.map((unit) => unit.sqFt)),
    leasedSqFt: sum([...occupied, ...notice].map((unit) => unit.sqFt)),
    monthlyRent: sum(units.map((unit) => unit.monthlyRent)),
    inPlaceRent,
    noticeRent,
    averageRent: leasedCount === 0 ? 0 : (inPlaceRent + noticeRent) / leasedCount,
  }
}

export function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function cellText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
  return ""
}

export function unitsFromGrid(values: unknown[][]): UnitRecord[] {
  const units: UnitRecord[] = []
  for (const row of values) {
    const unit = cellText(row[0]).trim()
    if (!unit) continue
    const statusText = cellText(row[3]).trim()
    const status: UnitStatus = UNIT_STATUSES.includes(statusText as UnitStatus)
      ? (statusText as UnitStatus)
      : "Vacant"
    units.push({
      unit,
      tenant: cellText(row[1]).trim(),
      sqFt: finiteNumber(row[2]) ?? 0,
      status,
      monthlyRent: finiteNumber(row[4]) ?? 0,
      leaseEnd: cellText(row[5]).trim(),
    })
  }
  return units
}

export function summaryFromMetricColumn(values: unknown[]): SheetSummary {
  const summary = {} as SheetSummary
  SUMMARY_METRICS.forEach((metric, index) => {
    summary[metric.key] = finiteNumber(values[index])
  })
  return summary
}

export function csvField(value: string | number): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function unitsToCsv(units: UnitRecord[]): string {
  const lines = [RENT_ROLL_HEADERS.map((header) => csvField(header)).join(",")]
  for (const unit of units) {
    lines.push(
      [
        unit.unit,
        unit.tenant,
        unit.sqFt,
        unit.status,
        unit.monthlyRent,
        unit.leaseEnd,
      ]
        .map((value) => csvField(value))
        .join(","),
    )
  }
  return `${lines.join("\n")}\n`
}

export type ExportPayload = {
  property: string
  note: string
  generatedAt: string
  units: UnitRecord[]
  summaryFromRows: Summary
  summaryFromSheet: SheetSummary | null
}

export function exportPayload(
  units: UnitRecord[],
  summaryFromSheet: SheetSummary | null,
  generatedAt: string,
): ExportPayload {
  return {
    property: PROPERTY_NAME,
    note: PROPERTY_NOTE,
    generatedAt,
    units,
    summaryFromRows: summarize(units),
    summaryFromSheet,
  }
}

export function formatMoney(value: number, digits: 0 | 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
}

type SnapshotCell = {
  v?: string | number
  f?: string
  s?: string
}

type SnapshotSheet = {
  id: string
  name: string
  rowCount: number
  columnCount: number
  defaultColumnWidth: number
  defaultRowHeight: number
  freeze?: { xSplit: number; ySplit: number; startRow: number; startColumn: number }
  columnData: Record<number, { w: number }>
  cellData: Record<number, Record<number, SnapshotCell>>
}

export type HarborCourtWorkbook = {
  id: string
  name: string
  sheetOrder: string[]
  styles: Record<string, Record<string, unknown>>
  sheets: Record<string, SnapshotSheet>
}

function row(cells: Array<SnapshotCell | null>): Record<number, SnapshotCell> {
  const record: Record<number, SnapshotCell> = {}
  cells.forEach((cell, index) => {
    if (cell) record[index] = cell
  })
  return record
}

export function harborCourtWorkbook(): HarborCourtWorkbook {
  const rentCellData: SnapshotSheet["cellData"] = {
    0: row(RENT_ROLL_HEADERS.map((header) => ({ v: header, s: "header" }))),
  }
  HARBOR_COURT_UNITS.forEach((unit, index) => {
    rentCellData[index + 1] = row([
      { v: unit.unit, s: "unit" },
      unit.tenant ? { v: unit.tenant } : null,
      { v: unit.sqFt, s: "int" },
      { v: unit.status },
      { v: unit.monthlyRent, s: "money" },
      unit.leaseEnd ? { v: unit.leaseEnd } : null,
    ])
  })

  const summaryCellData: SnapshotSheet["cellData"] = {
    0: row([{ v: PROPERTY_NAME, s: "title" }]),
    1: row([{ v: "Fictional waterfront sample. Names, rents, and dates are invented.", s: "note" }]),
    3: row([
      { v: "Metric", s: "header" },
      { v: "Value", s: "header" },
      { v: "What it means", s: "header" },
    ]),
  }
  SUMMARY_METRICS.forEach((metric, index) => {
    summaryCellData[SUMMARY_FIRST_METRIC_ROW - 1 + index] = row([
      { v: metric.label, s: "label" },
      { f: metric.formula, s: metric.format },
      { v: metric.note, s: "note" },
    ])
  })
  const noteRow = SUMMARY_FIRST_METRIC_ROW - 1 + SUMMARY_METRICS.length + 1
  summaryCellData[noteRow] = row([
    {
      v: "Charts ship in Univer's commercial preset, not this Apache-2.0 core. Occupancy stays a formula.",
      s: "note",
    },
  ])

  return {
    id: WORKBOOK_ID,
    name: PROPERTY_NAME,
    sheetOrder: [RENT_ROLL_SHEET_ID, SUMMARY_SHEET_ID],
    styles: {
      header: {
        bl: 1,
        bg: { rgb: "#1e4d3a" },
        cl: { rgb: "#eae5dc" },
      },
      title: {
        bl: 1,
        fs: 16,
        cl: { rgb: "#0c1c14" },
      },
      label: { bl: 1 },
      note: { cl: { rgb: "#1e4d3a" } },
      unit: { n: { pattern: "@" } },
      int: { n: { pattern: "#,##0" } },
      money: { n: { pattern: '"$"#,##0' } },
      moneyExact: { n: { pattern: '"$"#,##0.00' } },
      percent: { n: { pattern: "0.0%" } },
    },
    sheets: {
      [RENT_ROLL_SHEET_ID]: {
        id: RENT_ROLL_SHEET_ID,
        name: RENT_ROLL_SHEET,
        rowCount: FORMULA_LAST_ROW + 20,
        columnCount: 8,
        defaultColumnWidth: 120,
        defaultRowHeight: 28,
        freeze: { xSplit: 0, ySplit: 1, startRow: 1, startColumn: 0 },
        columnData: {
          0: { w: 90 },
          1: { w: 230 },
          2: { w: 100 },
          3: { w: 120 },
          4: { w: 140 },
          5: { w: 140 },
        },
        cellData: rentCellData,
      },
      [SUMMARY_SHEET_ID]: {
        id: SUMMARY_SHEET_ID,
        name: SUMMARY_SHEET,
        rowCount: 40,
        columnCount: 6,
        defaultColumnWidth: 140,
        defaultRowHeight: 28,
        freeze: { xSplit: 0, ySplit: 4, startRow: 4, startColumn: 0 },
        columnData: {
          0: { w: 220 },
          1: { w: 160 },
          2: { w: 420 },
        },
        cellData: summaryCellData,
      },
    },
  }
}
