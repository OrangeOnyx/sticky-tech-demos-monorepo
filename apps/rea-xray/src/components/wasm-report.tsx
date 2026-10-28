import type { ReaReport } from "../../shared/types.ts"
import { DataTable } from "@/components/data-table"
import { ErrorCard } from "@/components/error-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { displayValue, isCapability, isRecord, normalized, reaError, recordRows } from "@/lib/evidence"

export function WasmReport({ report }: { report: ReaReport | undefined }) {
  const error = report ? reaError(report) : { message: "WASM inspection returned no report." }
  if (!report || error) {
    if (error && isCapability(error)) {
      return <ErrorCard error={error} title="Capability unavailable" />
    }
    return <ErrorCard error={error ?? { message: "WASM inspection failed." }} />
  }

  const result = normalized(report)
  if (!result) return <ErrorCard error={{ message: "WASM inspection returned no evidence." }} />

  const sections = arrayField(result, ["sections", "section_headers"])
  const imports = arrayField(result, ["imports"])
  const exportsField = arrayField(result, ["exports"])
  const sectionTable = recordRows(sections, ["index", "name", "id", "size", "offset", "count"])
  const importTable = recordRows(imports, ["module", "name", "kind", "type", "form", "wat"])
  const exportTable = recordRows(exportsField, ["name", "kind", "type", "form", "wat"])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Module</CardTitle>
          <CardDescription>Validation {displayValue(result.validation)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Stat label="Sections" value={String(sections.length)} />
          <Stat label="Imports" value={String(imports.length)} />
          <Stat label="Exports" value={String(exportsField.length)} />
        </CardContent>
      </Card>
      <RecordCard title="Sections" columns={sectionTable.columns} rows={sectionTable.rows} />
      <RecordCard title="Imports" columns={importTable.columns} rows={importTable.rows} />
      <RecordCard title="Exports" columns={exportTable.columns} rows={exportTable.rows} />
    </div>
  )
}

function arrayField(result: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(result[key])) return result[key]
  }
  if (isRecord(result.interface)) {
    for (const key of keys) {
      if (Array.isArray(result.interface[key])) return result.interface[key]
    }
  }
  return []
}

function RecordCard({
  title,
  columns,
  rows,
}: {
  title: string
  columns: string[]
  rows: string[][]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">None in this result.</p>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
