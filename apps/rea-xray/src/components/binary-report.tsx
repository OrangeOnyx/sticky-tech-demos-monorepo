import type { Edge } from "@xyflow/react"
import type { ReaReport } from "../../shared/types.ts"
import { DataTable } from "@/components/data-table"
import { ErrorCard } from "@/components/error-card"
import { ModuleGraph } from "@/components/module-graph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { displayValue, isRecord, normalized, reaError, recordRows } from "@/lib/evidence"

export function BinaryReport({ reports }: { reports: ReaReport[] }) {
  const go = reports.find((report) => report.command === "inspect-go-binary")
  const rust = reports.find((report) => report.command === "inspect-rust-binary")
  const elf = reports.find((report) => report.command === "inspect-elf-notes")
  const pe = reports.find((report) => report.command === "inspect-pe-imports")
  const extra = elf ?? pe

  return (
    <Tabs defaultValue="go">
      <TabsList>
        <TabsTrigger value="go">Go</TabsTrigger>
        <TabsTrigger value="rust">Rust</TabsTrigger>
        {extra ? (
          <TabsTrigger value="extra">{elf ? "ELF notes" : "PE imports"}</TabsTrigger>
        ) : null}
      </TabsList>
      <TabsContent value="go">
        <GoPanel report={go} />
      </TabsContent>
      <TabsContent value="rust">
        <RustPanel report={rust} />
      </TabsContent>
      {extra ? (
        <TabsContent value="extra">
          <ExtraPanel report={extra} title={elf ? "ELF notes" : "PE imports"} />
        </TabsContent>
      ) : null}
    </Tabs>
  )
}

function GoPanel({ report }: { report: ReaReport | undefined }) {
  const error = report ? reaError(report) : { message: "Go inspection returned no report." }
  if (!report || error) return <ErrorCard error={error ?? { message: "Go inspection failed." }} />
  const build = normalized(report)?.build_info
  if (!isRecord(build) || !isRecord(build.module)) {
    return <ErrorCard error={{ message: "No Go build info in this binary." }} />
  }
  const module = build.module
  const main = isRecord(module.main) ? module.main : null
  const deps = Array.isArray(module.dependencies) ? module.dependencies.filter(isRecord) : []
  const settings = Array.isArray(module.settings) ? module.settings.filter(isRecord) : []
  const mainId = main ? String(main.path ?? "main") : "main"
  const nodes = [
    ...(main
      ? [{ id: mainId, label: String(main.path ?? "main"), hint: String(main.version ?? "") }]
      : []),
    ...deps.map((dep) => ({
      id: String(dep.path),
      label: String(dep.path),
      hint: replacementHint(dep),
    })),
  ]
  const edges: Edge[] = deps.map((dep) => ({
    id: `${mainId}->${String(dep.path)}`,
    source: mainId,
    target: String(dep.path),
  }))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{displayValue(build.go_version)}</CardTitle>
          <CardDescription>Embedded Go build info. The graph is main to direct modules.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {nodes.length > 0 ? <ModuleGraph nodes={nodes} edges={edges} /> : null}
          <DataTable
            columns={["Module", "Version", "Replacement"]}
            rows={[
              ...(main
                ? [[String(main.path ?? ""), String(main.version ?? ""), "—"]]
                : []),
              ...deps.map((dep) => [
                String(dep.path ?? ""),
                String(dep.version ?? ""),
                isRecord(dep.replacement) ? displayValue(dep.replacement.path) : "—",
              ]),
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Build settings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Key", "Value"]}
            rows={settings.map((setting) => [
              displayValue(setting.key),
              displayValue(setting.value),
            ])}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function replacementHint(dep: Record<string, unknown>): string {
  const version = displayValue(dep.version)
  if (!isRecord(dep.replacement)) return version
  return `${version} → ${displayValue(dep.replacement.path)}`
}

function RustPanel({ report }: { report: ReaReport | undefined }) {
  const error = report ? reaError(report) : { message: "Rust inspection returned no report." }
  if (!report || error) return <ErrorCard error={error ?? { message: "Rust inspection failed." }} />
  const result = normalized(report)
  const metadata = result?.auditable_metadata
  if (!isRecord(metadata)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No .dep-v0 section</CardTitle>
          <CardDescription>
            REA found no cargo-auditable crate list. That does not mean the binary has no dependencies.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const packages = Array.isArray(metadata.packages) ? metadata.packages.filter(isRecord) : []
  const nodes = packages.map((pkg, index) => ({
    id: `pkg-${index}`,
    label: String(pkg.name ?? index),
    hint: displayValue(pkg.version),
  }))
  const edges = rustEdges(metadata.dependency_edges, packages)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Crates</CardTitle>
          <CardDescription>
            {displayValue(metadata.section_name)} · root {displayValue(metadata.root_package_index)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {nodes.length > 0 ? <ModuleGraph nodes={nodes} edges={edges} /> : null}
          <DataTable
            columns={["Crate", "Version", "Source", "Root"]}
            rows={packages.map((pkg) => [
              displayValue(pkg.name),
              displayValue(pkg.version),
              displayValue(pkg.source),
              pkg.root ? "yes" : "no",
            ])}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function rustEdges(value: unknown, packages: Record<string, unknown>[]): Edge[] {
  if (!Array.isArray(value)) return edgesFromDependencies(packages)
  const edges: Edge[] = []
  value.forEach((item, index) => {
    const pair = edgePair(item)
    if (!pair) return
    const [from, to] = pair
    if (from < 0 || to < 0 || from >= packages.length || to >= packages.length) return
    edges.push({ id: `edge-${index}`, source: `pkg-${from}`, target: `pkg-${to}` })
  })
  return edges.length > 0 ? edges : edgesFromDependencies(packages)
}

function edgesFromDependencies(packages: Record<string, unknown>[]): Edge[] {
  const edges: Edge[] = []
  packages.forEach((pkg, from) => {
    if (!Array.isArray(pkg.dependencies)) return
    pkg.dependencies.forEach((dep, index) => {
      const to = typeof dep === "number" ? dep : Number(dep)
      if (!Number.isInteger(to) || to < 0 || to >= packages.length) return
      edges.push({ id: `dep-${from}-${index}`, source: `pkg-${from}`, target: `pkg-${to}` })
    })
  })
  return edges
}

function edgePair(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const from = Number(value[0])
    const to = Number(value[1])
    if (Number.isInteger(from) && Number.isInteger(to)) return [from, to]
  }
  if (!isRecord(value)) return null
  const from = Number(value.from_index ?? value.from ?? value.source)
  const to = Number(value.to_index ?? value.to ?? value.target)
  if (Number.isInteger(from) && Number.isInteger(to)) return [from, to]
  return null
}

function ExtraPanel({ report, title }: { report: ReaReport; title: string }) {
  const error = reaError(report)
  if (error) return <ErrorCard error={error} title={title} />
  const result = normalized(report)
  const entries = Array.isArray(result?.entries)
    ? result.entries
    : Array.isArray(result?.imports)
      ? result.imports
      : []
  const table = recordRows(entries, [
    "owner",
    "type_name",
    "table_kind",
    "dll",
    "name",
    "ordinal",
    "library",
  ])
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{displayValue(result?.format)}</CardDescription>
      </CardHeader>
      <CardContent>
        {table.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">REA returned no entries.</p>
        ) : (
          <DataTable columns={table.columns} rows={table.rows} />
        )}
      </CardContent>
    </Card>
  )
}
