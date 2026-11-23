import { useEffect, useRef, useState, type DragEvent } from "react"
import { FileSearch, Upload } from "lucide-react"
import type { FixtureInfo, InspectResponse } from "../shared/types.ts"
import { BinaryReport } from "@/components/binary-report"
import { ModelReport } from "@/components/model-report"
import { ReportFrame } from "@/components/report-frame"
import { SqliteReport } from "@/components/sqlite-report"
import { WasmReport } from "@/components/wasm-report"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isRecord, ordinaryTables } from "@/lib/evidence"
import { cn } from "@/lib/utils"

type Source =
  | { type: "fixture"; name: string }
  | { type: "upload"; file: File }

const labels: Record<string, string> = {
  "demo.sqlite": "SQLite",
  "tiny.gguf": "GGUF",
  "tiny.safetensors": "safetensors",
  "hello.wasm": "WASM",
  "hello-go": "Go ELF",
}

function isInspectResponse(value: unknown): value is InspectResponse {
  if (!isRecord(value) || !isRecord(value.file) || !Array.isArray(value.reports)) return false
  return (
    value.kind === "sqlite" ||
    value.kind === "model" ||
    value.kind === "wasm" ||
    value.kind === "binary" ||
    value.kind === "unknown"
  )
}

async function request(source: Source, table?: string): Promise<InspectResponse> {
  const params = new URLSearchParams()
  if (table) {
    params.set("table", table)
    params.set("rowLimit", "25")
  }
  const query = params.size ? `?${params}` : ""
  const response =
    source.type === "fixture"
      ? await fetch(`/api/inspect/fixture/${encodeURIComponent(source.name)}${query}`, {
          method: "POST",
        })
      : await fetch(`/api/inspect${query}`, {
          method: "POST",
          headers: { "x-filename": source.file.name },
          body: source.file,
        })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("The inspect API returned a response this page could not read.")
  }
  if (!isInspectResponse(payload)) {
    const message =
      isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string"
        ? payload.error.message
        : "Inspect failed."
    throw new Error(message)
  }
  return payload
}

export default function App() {
  const [fixtures, setFixtures] = useState<FixtureInfo[]>([])
  const [fixtureError, setFixtureError] = useState<string | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [result, setResult] = useState<InspectResponse | null>(null)
  const [detail, setDetail] = useState<InspectResponse | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/fixtures")
      .then(async (response) => {
        if (!response.ok) throw new Error("fixtures")
        return (await response.json()) as { fixtures?: FixtureInfo[] }
      })
      .then((payload) => {
        if (!cancelled) setFixtures(payload.fixtures ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setFixtureError("Local inspect API is not reachable. Restart npm run dev.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!source || !selectedTable) return
    let cancelled = false
    request(source, selectedTable)
      .then((payload) => {
        if (!cancelled) setDetail(payload)
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Table read failed.")
        }
      })
      .finally(() => {
        if (!cancelled) setTableLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [source, selectedTable])

  async function inspect(next: Source) {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    setResult(null)
    setDetail(null)
    setSelectedTable(null)
    setSource(next)
    try {
      const payload = await request(next)
      if (id !== requestId.current) return
      setResult(payload)
      if (payload.kind === "sqlite") {
        const table = ordinaryTables(payload)[0] ?? null
        if (table) setTableLoading(true)
        setSelectedTable(table)
      }
    } catch (reason: unknown) {
      if (id !== requestId.current) return
      setError(reason instanceof Error ? reason.message : "Inspect failed.")
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void inspect({ type: "upload", file })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Sticky tech demos</p>
        <h1 className="text-2xl font-semibold tracking-tight">REA X-ray</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Drop a SQLite database, GGUF or safetensors model, WASM module, or ELF, Mach-O, or PE
          binary. REA reads it statically and this page draws the report. Fixtures need no upload.
        </p>
      </header>

      {fixtureError ? (
        <Alert variant="destructive">
          <AlertTitle>API offline</AlertTitle>
          <AlertDescription>{fixtureError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center",
              dragging && "border-ring bg-muted",
            )}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Upload data-icon="inline-start" />
            <span className="text-sm font-medium">Drop a file</span>
            <span className="text-xs text-muted-foreground">or click to browse, up to 256 MiB</span>
            <input
              className="sr-only"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void inspect({ type: "upload", file })
                event.target.value = ""
              }}
            />
          </label>
          <Card>
            <CardHeader>
              <CardTitle>Fixtures</CardTitle>
              <CardDescription>Built in. No .env required.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {fixtures.map((fixture) => (
                <Button
                  key={fixture.name}
                  type="button"
                  variant={
                    source?.type === "fixture" && source.name === fixture.name
                      ? "default"
                      : "outline"
                  }
                  disabled={loading}
                  onClick={() => void inspect({ type: "fixture", name: fixture.name })}
                >
                  <FileSearch data-icon="inline-start" />
                  {labels[fixture.name] ?? fixture.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? <p className="text-sm text-muted-foreground">Reading with REA…</p> : null}
          {result ? (
            <ReportFrame result={result} detail={detail}>
              {result.kind === "sqlite" ? (
                <SqliteReport
                  inventory={result}
                  detail={detail}
                  selectedTable={selectedTable}
                  tableLoading={tableLoading}
                  onSelectTable={(table) => {
                    if (table === selectedTable) return
                    setTableLoading(true)
                    setDetail(null)
                    setSelectedTable(table)
                  }}
                />
              ) : null}
              {result.kind === "model" ? <ModelReport report={result.reports[0]} /> : null}
              {result.kind === "wasm" ? <WasmReport report={result.reports[0]} /> : null}
              {result.kind === "binary" ? <BinaryReport reports={result.reports} /> : null}
            </ReportFrame>
          ) : loading ? null : (
            <Card>
              <CardHeader>
                <CardTitle>Nothing open</CardTitle>
                <CardDescription>
                  Pick a fixture or drop a file. The report keeps REA&apos;s limitations and the raw
                  Evidence JSON.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Static inspection through the published <span className="text-foreground">rea-agents</span>{" "}
        package. This demo does not decompile.
      </p>
    </main>
  )
}
