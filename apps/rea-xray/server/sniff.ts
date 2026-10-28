export type MagicKind =
  | "sqlite"
  | "gguf"
  | "safetensors"
  | "wasm"
  | "elf"
  | "macho"
  | "pe"
  | "unknown"

const SQLITE = Buffer.from("SQLite format 3\0", "utf8")

const MACHO_MAGICS = new Set<number>([
  0xfeedface, 0xcefaedfe, 0xfeedfacf, 0xcffaedfe, 0xcafebabe, 0xbebafeca,
  0xcafebabf, 0xbfbafeca,
])

export function sniff(bytes: Buffer): MagicKind {
  if (bytes.length >= SQLITE.length && bytes.subarray(0, SQLITE.length).equals(SQLITE)) {
    return "sqlite"
  }
  if (bytes.length >= 4 && bytes.subarray(0, 4).toString("utf8") === "GGUF") return "gguf"
  if (bytes.length >= 4 && bytes[0] === 0 && bytes.subarray(1, 4).toString("utf8") === "asm") {
    return "wasm"
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    return "elf"
  }
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) return "pe"
  if (bytes.length >= 4 && MACHO_MAGICS.has(bytes.readUInt32BE(0))) return "macho"
  if (isSafetensors(bytes)) return "safetensors"
  return "unknown"
}

function isSafetensors(bytes: Buffer): boolean {
  if (bytes.length < 10 || bytes[8] !== 0x7b) return false
  const headerLen = bytes.readBigUInt64LE(0)
  return headerLen >= 2n && headerLen <= 100_000_000n && headerLen <= BigInt(bytes.length - 8)
}
