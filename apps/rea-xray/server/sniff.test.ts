import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { sniff } from "./sniff.ts"

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures")

test("routes magic bytes to the REA inspector family", () => {
  assert.equal(sniff(Buffer.from("SQLite format 3\0extra")), "sqlite")
  assert.equal(sniff(Buffer.from("GGUFrest")), "gguf")
  assert.equal(sniff(Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])), "wasm")
  assert.equal(sniff(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02])), "elf")
  assert.equal(sniff(Buffer.from("MZ")), "pe")
  assert.equal(sniff(Buffer.from([0xcf, 0xfa, 0xed, 0xfe])), "macho")
  assert.equal(sniff(Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0x00])), "macho")
  assert.equal(sniff(Buffer.from("hello")), "unknown")
  assert.equal(sniff(Buffer.from("SQLite format 3")), "unknown")
})

test("detects a safetensors header length followed by an object", () => {
  const json = Buffer.from('{"bias":{"dtype":"F32","shape":[2],"data_offsets":[0,8]}}')
  const length = Buffer.alloc(8)
  length.writeBigUInt64LE(BigInt(json.length))
  assert.equal(sniff(Buffer.concat([length, json, Buffer.alloc(8)])), "safetensors")
  assert.equal(sniff(Buffer.from("{not a length prefix")), "unknown")
})

test("fixture files sniff to the kinds the page offers", () => {
  assert.equal(sniff(readFileSync(path.join(fixtures, "demo.sqlite"))), "sqlite")
  assert.equal(sniff(readFileSync(path.join(fixtures, "tiny.gguf"))), "gguf")
  assert.equal(sniff(readFileSync(path.join(fixtures, "tiny.safetensors"))), "safetensors")
  assert.equal(sniff(readFileSync(path.join(fixtures, "hello.wasm"))), "wasm")
  assert.equal(sniff(readFileSync(path.join(fixtures, "hello-go"))), "elf")
})
