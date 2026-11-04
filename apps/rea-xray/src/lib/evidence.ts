import type { ApiMessage, ReaReport } from "../../shared/types.ts"

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function evidenceOf(report: ReaReport): Record<string, unknown> | null {
  if (!isRecord(report.body) || !("normalized_result" in report.body)) return null
  return report.body
}

export function normalized(report: ReaReport): Record<string, unknown> | null {
  const evidence = evidenceOf(report)
  if (!evidence || !isRecord(evidence.normalized_result)) return null
  return evidence.normalized_result
}

export function remediationText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value
  if (isRecord(value) && typeof value.action === "string") return value.action
  return null
}

export function reaError(report: ReaReport): ApiMessage | null {
  if (evidenceOf(report) && report.exitCode === 0) return null
  if (!isRecord(report.body)) {
    return { message: "REA returned a result this page could not read." }
  }
  if (report.exitCode === 0 && evidenceOf(report)) return null
  const code = typeof report.body.code === "string" ? report.body.code : undefined
  const message =
    typeof report.body.message === "string" ? report.body.message : "REA inspection failed."
  const remediation = remediationText(report.body.remediation) ?? undefined
  if (report.exitCode === 0 && !code) return null
  return { code, message, remediation }
}

export function isCapability(error: ApiMessage | null): boolean {
  return error?.code === "capability_unavailable"
}

export function limitations(reports: ReaReport[]): string[] {
  const seen = new Set<string>()
  const lines: string[] = []
  for (const report of reports) {
    const sources = [evidenceOf(report)?.limitations, normalized(report)?.limitations]
    for (const source of sources) {
      if (!Array.isArray(source)) continue
      for (const item of source) {
        const text =
          typeof item === "string"
            ? item
            : isRecord(item) && typeof item.message === "string"
              ? item.message
              : null
        if (!text || seen.has(text)) continue
        seen.add(text)
        lines.push(text)
      }
    }
  }
  return lines
}

export function providers(reports: ReaReport[]): { name: string; version: string }[] {
  const found: { name: string; version: string }[] = []
  for (const report of reports) {
    const provider = evidenceOf(report)?.provider
    if (!isRecord(provider)) continue
    const name =
      typeof provider.name === "string"
        ? provider.name
        : typeof provider.id === "string"
          ? provider.id
          : "REA"
    const version = provider.version == null ? "" : String(provider.version)
    found.push({ name, version })
  }
  return found
}

export function displayValue(value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map((item) => displayValue(item)).join(", ")
  return JSON.stringify(value)
}

export function shapeText(shape: unknown): string {
  if (!Array.isArray(shape) || shape.length === 0) return "scalar"
  return shape.map((dim) => displayValue(dim)).join("×")
}

export function cellText(cell: unknown): string {
  if (!isRecord(cell)) return displayValue(cell)
  if (cell.type === "null") return "NULL"
  if ("value" in cell) return displayValue(cell.value)
  return displayValue(cell.type)
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ordinaryTables(result: { reports: { body: unknown; exitCode: number; command: string }[] }): string[] {
  const report = result.reports[0]
  if (!report) return []
  const schema = normalized(report)?.schema
  if (!isRecord(schema) || !Array.isArray(schema.tables)) return []
  return schema.tables.flatMap((table) => {
    if (!isRecord(table) || typeof table.name !== "string") return []
    if (table.kind && table.kind !== "table") return []
    return [table.name]
  })
}

export function namedItems(value: unknown): { name: string; detail?: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== "string") return []
    const detail =
      typeof item.table === "string"
        ? item.table
        : typeof item.kind === "string"
          ? item.kind
          : undefined
    return [{ name: item.name, detail }]
  })
}

export function recordRows(
  items: unknown[],
  preferred: string[],
): { columns: string[]; rows: string[][] } {
  if (items.length === 0) return { columns: [], rows: [] }
  if (items.every((item) => typeof item === "string" || typeof item === "number")) {
    return { columns: ["Value"], rows: items.map((item) => [displayValue(item)]) }
  }
  const present = new Set<string>()
  for (const item of items) {
    if (!isRecord(item)) continue
    for (const key of preferred) {
      if (key in item && item[key] != null) present.add(key)
    }
  }
  const columns = preferred.filter((key) => present.has(key))
  if (columns.length === 0) {
    return { columns: ["Value"], rows: items.map((item) => [displayValue(item)]) }
  }
  return {
    columns,
    rows: items.map((item) =>
      columns.map((column) => displayValue(isRecord(item) ? item[column] : item)),
    ),
  }
}
