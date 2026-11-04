import { spawnSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixturesDir = path.join(root, "fixtures")
const goSrc = path.join(root, "scripts", "hello-go")

mkdirSync(fixturesDir, { recursive: true })

writeSqlite(path.join(fixturesDir, "demo.sqlite"))
writeFileSync(path.join(fixturesDir, "tiny.safetensors"), safetensors())
writeFileSync(path.join(fixturesDir, "tiny.gguf"), gguf())
writeFileSync(path.join(fixturesDir, "hello.wasm"), wasm())
buildGo(path.join(fixturesDir, "hello-go"))

console.log("fixtures written to", fixturesDir)

function writeSqlite(file) {
  rmSync(file, { force: true })
  const db = new DatabaseSync(file)
  db.exec(`
    DROP VIEW IF EXISTS note_tag_counts;
    DROP TABLE IF EXISTS note_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS notes;

    CREATE TABLE notes (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE note_tags (
      note_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL
    );
    CREATE INDEX idx_tags_name ON tags(name);
    CREATE VIEW note_tag_counts AS
      SELECT note_id, COUNT(*) AS tag_count
      FROM note_tags
      GROUP BY note_id;
  `)

  const insertNote = db.prepare(
    "INSERT INTO notes (title, body, pinned) VALUES (?, ?, ?)",
  )
  const notes = [
    ["Desk lamp", "Warm bulb, north window.", 1],
    ["Field notes", "Three tables, one index, one view.", 0],
    ["GGUF header", "Version 3, two tiny tensors.", 0],
    ["Safetensors", "Bias, weight, and a scale.", 1],
    ["WASM module", "One import, two exports.", 0],
    ["Go binary", "Main module plus a local greet dep.", 0],
    ["Limitations", "REA reports what it did not prove.", 0],
    ["Drop zone", "Fixtures work before any upload.", 1],
  ]
  for (const row of notes) insertNote.run(...row)

  const insertTag = db.prepare("INSERT INTO tags (name) VALUES (?)")
  for (const name of ["demo", "sqlite", "model", "binary", "local"]) {
    insertTag.run(name)
  }

  const link = db.prepare(
    "INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)",
  )
  const links = [
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 3],
    [4, 3],
    [5, 4],
    [6, 4],
    [6, 5],
    [7, 1],
    [8, 5],
  ]
  for (const row of links) link.run(...row)
  db.close()
}

function u32(value) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32LE(value)
  return buf
}

function u64(value) {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(value))
  return buf
}

function ggufString(value) {
  const bytes = Buffer.from(value, "utf8")
  return Buffer.concat([u64(bytes.length), bytes])
}

function gguf() {
  const stringType = 8
  const uint32Type = 4
  const metadata = [
    kv("general.architecture", stringType, ggufString("tiny")),
    kv("general.name", stringType, ggufString("tiny-demo")),
    kv("general.alignment", uint32Type, u32(32)),
    kv("tiny.context_length", uint32Type, u32(8)),
    kv("tiny.block_count", uint32Type, u32(1)),
  ]
  const f32 = 0
  const tensors = [
    tensor("token_embd.weight", [4, 4], f32, 0),
    tensor("output.weight", [4], f32, 64),
  ]
  const header = Buffer.concat([
    Buffer.from("GGUF"),
    u32(3),
    u64(tensors.length),
    u64(metadata.length),
    ...metadata,
    ...tensors,
  ])
  const alignment = 32
  const pad = (alignment - (header.length % alignment)) % alignment
  const weights = Buffer.alloc(80)
  return Buffer.concat([header, Buffer.alloc(pad), weights])
}

function kv(key, type, value) {
  return Buffer.concat([ggufString(key), u32(type), value])
}

function tensor(name, dims, type, offset) {
  return Buffer.concat([
    ggufString(name),
    u32(dims.length),
    ...dims.map((dim) => u64(dim)),
    u32(type),
    u64(offset),
  ])
}

function safetensors() {
  const header = {
    __metadata__: { format: "demo" },
    bias: { dtype: "F32", shape: [2], data_offsets: [0, 8] },
    weight: { dtype: "F32", shape: [2, 3], data_offsets: [8, 32] },
    scale: { dtype: "I64", shape: [1], data_offsets: [32, 40] },
  }
  let json = JSON.stringify(header)
  while (Buffer.byteLength(json) % 8 !== 0) json += " "
  const bytes = Buffer.from(json, "utf8")
  const length = Buffer.alloc(8)
  length.writeBigUInt64LE(BigInt(bytes.length))
  return Buffer.concat([length, bytes, Buffer.alloc(40)])
}

function wasm() {
  const hex = [
    "0061736d01000000",
    "010f0360017f0060027f7f017f6000017f",
    "020b0103656e76036c6f670000",
    "0303020102",
    "07100203616464000106616e737765720002",
    "0a0e020700200020016a0b0400412a0b",
  ].join("")
  return Buffer.from(hex, "hex")
}

function buildGo(outFile) {
  const result = spawnSync(
    "go",
    ["build", "-trimpath", "-buildvcs=false", "-ldflags=-s -w", "-o", outFile, "."],
    {
      cwd: goSrc,
      env: {
        ...process.env,
        CGO_ENABLED: "0",
        GOOS: "linux",
        GOARCH: "amd64",
      },
      encoding: "utf8",
    },
  )
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    throw new Error("go build failed")
  }
}
