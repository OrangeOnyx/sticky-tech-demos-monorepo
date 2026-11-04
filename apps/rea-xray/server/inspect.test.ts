import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import type { InspectResponse, ReaReport } from "../shared/types.ts"
import { inspectBuffer, inspectFixtureFile } from "./inspect.ts"

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures")

function report(body: InspectResponse, command: string): ReaReport {
  const found = body.reports.find((item) => item.command === command)
  assert.ok(found, `missing ${command}`)
  return found
}

function record(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value))
  return value as Record<string, unknown>
}

test("sqlite fixture inventory lists tables, an index, and a view", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("demo.sqlite")
  assert.equal(body.kind, "sqlite")
  assert.equal(body.file.name, "demo.sqlite")
  assert.equal(body.file.sha256.length, 64)
  const result = report(body, "inspect-sqlite-database")
  assert.equal(result.exitCode, 0)
  const normalized = record(record(result.body).normalized_result)
  const schema = record(normalized.schema)
  const tables = schema.tables as { name: string }[]
  assert.deepEqual(
    tables.map((table) => table.name),
    ["notes", "tags", "note_tags"],
  )
  assert.equal((schema.indexes as unknown[]).length, 1)
  assert.equal((schema.views as { name: string }[])[0]?.name, "note_tag_counts")
})

test("sqlite table read returns columns and rows", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("demo.sqlite", { table: "notes", rowLimit: 25 })
  const result = report(body, "inspect-sqlite-database")
  assert.equal(result.exitCode, 0)
  const normalized = record(record(result.body).normalized_result)
  const rows = record(normalized.rows)
  assert.deepEqual(rows.columns, ["id", "title", "body", "pinned"])
  const values = rows.values as { value?: string }[][]
  assert.ok(values.length >= 8)
  assert.equal(values[0]?.[1]?.value, "Desk lamp")
  const schema = record(normalized.schema)
  const table = (schema.tables as { columns: unknown[] }[])[0]
  assert.equal(table?.columns.length, 4)
})

test("gguf fixture reports two tensors", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("tiny.gguf")
  assert.equal(body.kind, "model")
  const result = report(body, "inspect-model-artifact")
  assert.equal(result.exitCode, 0)
  const normalized = record(record(result.body).normalized_result)
  assert.equal(normalized.format, "gguf")
  assert.equal((normalized.tensors as unknown[]).length, 2)
  assert.equal(record(normalized.totals).parameter_count, "20")
})

test("safetensors fixture reports three tensors", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("tiny.safetensors")
  assert.equal(body.kind, "model")
  const result = report(body, "inspect-model-artifact")
  assert.equal(result.exitCode, 0)
  const normalized = record(record(result.body).normalized_result)
  assert.equal(normalized.format, "safetensors")
  assert.equal((normalized.tensors as unknown[]).length, 3)
})

test("wasm fixture returns a report or REA's capability error", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("hello.wasm")
  assert.equal(body.kind, "wasm")
  const result = report(body, "inspect-wasm-artifact")
  const payload = record(result.body)
  if (result.exitCode === 0) {
    assert.ok(payload.normalized_result)
    return
  }
  assert.equal(payload.code, "capability_unavailable")
  assert.equal(typeof record(payload.remediation).action, "string")
})

test("go fixture reports modules, an empty rust section, and elf notes", { timeout: 60_000 }, async () => {
  const body = await inspectFixtureFile("hello-go")
  assert.equal(body.kind, "binary")
  assert.deepEqual(body.reports.map((item) => item.command).sort(), [
    "inspect-elf-notes",
    "inspect-go-binary",
    "inspect-rust-binary",
  ])

  const go = report(body, "inspect-go-binary")
  assert.equal(go.exitCode, 0)
  const build = record(record(record(go.body).normalized_result).build_info)
  assert.match(String(build.go_version), /^go1\./)
  const module = record(build.module)
  const deps = module.dependencies as { path: string }[]
  assert.equal(deps.some((dep) => dep.path === "example.com/greet"), true)

  const rust = report(body, "inspect-rust-binary")
  assert.equal(rust.exitCode, 0)
  assert.equal(record(record(rust.body).normalized_result).auditable_metadata, null)

  const elf = report(body, "inspect-elf-notes")
  assert.equal(elf.exitCode, 0)
  assert.equal(record(record(elf.body).normalized_result).format, "elf64")
})

test("an upload of fixture bytes is inspected from a temp file", { timeout: 60_000 }, async () => {
  const fixture = await inspectFixtureFile("tiny.safetensors")
  const bytes = readFileSync(path.join(fixtureRoot, "tiny.safetensors"))
  const uploaded = await inspectBuffer({ name: "copied.safetensors", bytes })
  assert.equal(uploaded.kind, "model")
  assert.equal(uploaded.file.name, "copied.safetensors")
  assert.equal(uploaded.file.sha256, fixture.file.sha256)
  assert.equal(report(uploaded, "inspect-model-artifact").exitCode, 0)
})

test("unknown bytes become a readable error", async () => {
  const body = await inspectBuffer({ name: "notes.txt", bytes: Buffer.from("hello") })
  assert.equal(body.kind, "unknown")
  assert.equal(body.reports.length, 0)
  assert.match(body.error?.message ?? "", /SQLite/)
})
