import type { InspectResponse } from "../../shared/types.ts"
import { DataTable } from "@/components/data-table"
import { ErrorCard } from "@/components/error-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cellText, isRecord, namedItems, normalized, ordinaryTables, reaError } from "@/lib/evidence"

export function SqliteReport({
  inventory,
  detail,
  selectedTable,
  tableLoading,
  onSelectTable,
}: {
  inventory: InspectResponse
  detail: InspectResponse | null
  selectedTable: string | null
  tableLoading: boolean
  onSelectTable: (table: string) => void
}) {
  const report = inventory.reports[0]
  const error = report ? reaError(report) : { message: "SQLite inspection returned no report." }
  if (!report || error) return <ErrorCard error={error ?? { message: "SQLite inspection failed." }} />

  const schema = normalized(report)?.schema
  const indexes = isRecord(schema) ? namedItems(schema.indexes) : []
  const views = isRecord(schema) ? namedItems(schema.views) : []
  const triggers = isRecord(schema) ? namedItems(schema.triggers) : []
  const tables = ordinaryTables(inventory)
  const detailReport = detail?.reports[0]
  const detailError = detailReport ? reaError(detailReport) : null
  const detailSchema = detailReport ? normalized(detailReport)?.schema : null
  const selected = isRecord(detailSchema) && Array.isArray(detailSchema.tables)
    ? detailSchema.tables.find((table) => isRecord(table) && table.name === selectedTable)
    : null
  const columns = isRecord(selected) && Array.isArray(selected.columns) ? selected.columns : []
  const rows = detailReport ? normalized(detailReport)?.rows : null
  const rowValues = isRecord(rows) && Array.isArray(rows.values) ? rows.values : []
  const rowColumns = isRecord(rows) && Array.isArray(rows.columns)
    ? rows.columns.map((column) => String(column))
    : []

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Schema</CardTitle>
          <CardDescription>
            Inventory from REA. Pick a table to load its columns and up to 25 rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <Button
                key={table}
                type="button"
                size="sm"
                variant={table === selectedTable ? "default" : "outline"}
                onClick={() => onSelectTable(table)}
              >
                {table}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Indexes</p>
            <div className="flex flex-wrap gap-2">
              {indexes.length === 0 ? <Badge variant="outline">None</Badge> : null}
              {indexes.map((index) => (
                <Badge key={index.name} variant="secondary">
                  {index.detail ? `${index.name} on ${index.detail}` : index.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Views</p>
            <div className="flex flex-wrap gap-2">
              {views.length === 0 ? <Badge variant="outline">None</Badge> : null}
              {views.map((view) => (
                <Badge key={view.name} variant="secondary">
                  {view.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Triggers</p>
            <div className="flex flex-wrap gap-2">
              {triggers.length === 0 ? <Badge variant="outline">None</Badge> : null}
              {triggers.map((trigger) => (
                <Badge key={trigger.name} variant="secondary">
                  {trigger.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTable ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTable}</CardTitle>
            <CardDescription>
              {tableLoading
                ? "Loading columns and rows."
                : isRecord(rows) && rows.truncated
                  ? "Sample truncated at the row limit. Order is unspecified."
                  : "Columns and a bounded row sample."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {detailError ? <ErrorCard error={detailError} /> : null}
            {columns.length > 0 ? (
              <DataTable
                columns={["Column", "Type", "Not null", "Default", "PK"]}
                rows={columns.map((column) => {
                  const cell = isRecord(column) ? column : {}
                  return [
                    String(cell.name ?? "—"),
                    String(cell.declared_type ?? "—"),
                    cell.not_null ? "yes" : "no",
                    cell.default_sql == null ? "—" : String(cell.default_sql),
                    cell.primary_key_position ? String(cell.primary_key_position) : "—",
                  ]
                })}
              />
            ) : null}
            {rowColumns.length > 0 ? (
              <DataTable
                columns={rowColumns}
                rows={rowValues.map((row) =>
                  Array.isArray(row) ? row.map((cell) => cellText(cell)) : [],
                )}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
