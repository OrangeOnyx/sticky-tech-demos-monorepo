import { createHash } from "node:crypto"
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { FixtureInfo, InspectKind, InspectResponse } from "../shared/types.ts"
import { HttpError } from "./errors.ts"
import { runRea } from "./rea.ts"
import { sniff, type MagicKind } from "./sniff.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const fixturesDir = path.join(root, "fixtures")
export const MAX_UPLOAD_BYTES = 256 * 1024 * 1024

const FIXTURE_ORDER = [
  "demo.sqlite",
  "tiny.gguf",
  "tiny.safetensors",
  "hello.wasm",
  "hello-go",
] as const

const UNKNOWN_MESSAGE =
  "This file does not match SQLite, GGUF, safetensors, WASM, ELF, Mach-O, or PE."

type Options = {
  table?: string | null
  rowLimit?: number | null
}

export function displayName(name: string | undefined): string {
  const base = path.basename((name ?? "").trim())
  if (!base || base === "." || base === "..") return "upload"
  return base.slice(0, 200)
}

export function sanitizeTempName(name: string): string {
  const base = path
    .basename(name)
    .replace(/[^\w.-]+/g, "_")
    .replace(/^\.+/, "")
  return (base || "upload").slice(0, 120)
}

export async function listFixtures(): Promise<FixtureInfo[]> {
  const present = new Set(await readdir(fixturesDir).catch(() => []))
  const fixtures: FixtureInfo[] = []
  for (const name of FIXTURE_ORDER) {
    if (!present.has(name)) continue
    const filePath = path.join(fixturesDir, name)
    const info = await lstat(filePath)
    if (!info.isFile()) continue
    const bytes = await readFile(filePath)
    fixtures.push({
      name,
      bytes: info.size,
      kind: magicToKind(sniff(bytes)),
    })
  }
  return fixtures
}

export async function inspectFixtureFile(
  name: string,
  options: Options = {},
): Promise<InspectResponse> {
  const filePath = resolveFixture(name)
  const info = await lstat(filePath).catch(() => null)
  if (!info?.isFile()) throw new HttpError(404, `Fixture ${name} is not available.`)
  const bytes = await readFile(filePath)
  return inspectAtPath({
    name,
    bytes,
    filePath,
    table: options.table,
    rowLimit: options.rowLimit,
  })
}

export async function inspectBuffer(input: {
  name: string
  bytes: Buffer
  table?: string | null
  rowLimit?: number | null
}): Promise<InspectResponse> {
  if (input.bytes.length > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, "Uploads are limited to 256 MiB.")
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), "rea-xray-"))
  try {
    const filePath = path.join(dir, sanitizeTempName(input.name))
    await writeFile(filePath, input.bytes, { flag: "wx" })
    return await inspectAtPath({
      name: displayName(input.name),
      bytes: input.bytes,
      filePath,
      table: input.table,
      rowLimit: input.rowLimit,
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export function parseRowLimit(raw: string | null): number {
  if (!raw) return 25
  if (!/^\d+$/.test(raw)) {
    throw new HttpError(400, "rowLimit must be an integer from 1 to 100.")
  }
  const value = Number(raw)
  if (value < 1 || value > 100) {
    throw new HttpError(400, "rowLimit must be an integer from 1 to 100.")
  }
  return value
}

export function parseTable(raw: string | null): string | null {
  if (!raw) return null
  const table = raw.trim()
  if (!table) return null
  if (table.length > 256 || table.includes("\0")) {
    throw new HttpError(400, "Table name must be 1–256 characters.")
  }
  return table
}

async function inspectAtPath(input: {
  name: string
  bytes: Buffer
  filePath: string
  table?: string | null
  rowLimit?: number | null
}): Promise<InspectResponse> {
  const file = {
    name: input.name,
    sha256: createHash("sha256").update(input.bytes).digest("hex"),
    size: input.bytes.length,
  }
  const magic = sniff(input.bytes)
  const absolute = path.resolve(input.filePath)

  if (magic === "unknown") {
    return { kind: "unknown", file, reports: [], error: { message: UNKNOWN_MESSAGE } }
  }

  if (magic === "sqlite") {
    const args = ["inspect-sqlite-database", absolute]
    if (input.table) {
      args.push("--table", input.table, "--row-limit", String(input.rowLimit ?? 25))
    }
    args.push("--json")
    return { kind: "sqlite", file, reports: [await runRea(args)] }
  }

  if (magic === "gguf" || magic === "safetensors") {
    return {
      kind: "model",
      file,
      reports: [await runRea(["inspect-model-artifact", absolute, "--json"])],
    }
  }

  if (magic === "wasm") {
    return {
      kind: "wasm",
      file,
      reports: [await runRea(["inspect-wasm-artifact", absolute, "--format", "json"])],
    }
  }

  const reports = await Promise.all([
    runRea(["inspect-go-binary", absolute, "--json"]),
    runRea(["inspect-rust-binary", absolute, "--json"]),
    ...(magic === "elf" ? [runRea(["inspect-elf-notes", absolute, "--json"])] : []),
    ...(magic === "pe" ? [runRea(["inspect-pe-imports", absolute, "--json"])] : []),
  ])
  return { kind: "binary", file, reports }
}

function resolveFixture(name: string): string {
  if (!FIXTURE_ORDER.includes(name as (typeof FIXTURE_ORDER)[number])) {
    throw new HttpError(404, `Unknown fixture ${displayName(name)}.`)
  }
  const filePath = path.resolve(fixturesDir, name)
  if (path.dirname(filePath) !== fixturesDir) {
    throw new HttpError(404, `Unknown fixture ${displayName(name)}.`)
  }
  return filePath
}

function magicToKind(magic: MagicKind): InspectKind {
  if (magic === "gguf" || magic === "safetensors") return "model"
  if (magic === "elf" || magic === "macho" || magic === "pe") return "binary"
  if (magic === "sqlite" || magic === "wasm") return magic
  return "unknown"
}
