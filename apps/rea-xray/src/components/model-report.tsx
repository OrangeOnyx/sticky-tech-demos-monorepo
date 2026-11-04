import type { ReaReport } from "../../shared/types.ts"
import { DataTable } from "@/components/data-table"
import { ErrorCard } from "@/components/error-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { displayValue, isRecord, normalized, reaError, shapeText } from "@/lib/evidence"

export function ModelReport({ report }: { report: ReaReport | undefined }) {
  const error = report ? reaError(report) : { message: "Model inspection returned no report." }
  if (!report || error) return <ErrorCard error={error ?? { message: "Model inspection failed." }} />
  const result = normalized(report)
  if (!result) return <ErrorCard error={{ message: "Model inspection returned no evidence." }} />

  const metadata = Array.isArray(result.metadata) ? result.metadata : []
  const tensors = Array.isArray(result.tensors) ? result.tensors : []
  const totals = isRecord(result.totals) ? result.totals : {}

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Declaration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Stat label="Format" value={displayValue(result.format)} />
          <Stat label="Version" value={displayValue(result.version)} />
          <Stat label="Alignment" value={displayValue(result.alignment)} />
          <Stat label="Parameters" value={displayValue(totals.parameter_count)} />
          <Stat label="Tensor bytes" value={displayValue(totals.tensor_bytes)} />
          <Stat label="Tensors" value={String(tensors.length)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Key", "Type", "Value"]}
            rows={metadata.map((item) => {
              const row = isRecord(item) ? item : {}
              return [displayValue(row.key), displayValue(row.type), displayValue(row.value)]
            })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tensors</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Name", "DType", "Shape", "Params", "Bytes"]}
            rows={tensors.map((item) => {
              const row = isRecord(item) ? item : {}
              return [
                displayValue(row.name),
                displayValue(row.type),
                shapeText(row.shape),
                displayValue(row.parameter_count),
                displayValue(row.byte_length),
              ]
            })}
          />
        </CardContent>
      </Card>
    </div>
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
