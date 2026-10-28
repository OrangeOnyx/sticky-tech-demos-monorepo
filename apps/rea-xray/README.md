# REA X-ray

Single-user file X-ray. Drop a SQLite database, GGUF or safetensors model, WASM module, or ELF / Mach-O / PE binary and read a visual report from [REA](https://github.com/morluto/rea)'s static inspectors. Built-in fixtures work with no upload and no `.env`.

```bash
cd apps/rea-xray
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Node

Node `^24.22.1` or `>=26.12.1` is required (`.nvmrc` is `24.22.1`). `npm run dev` refuses to start on anything else.

SQLite inspection uses Node's `DatabaseSync.limits` API, which ships in Node 24.15+ and current Node 26. Node 22 is too old for that API. On Node 20 the REA CLI fails while importing `node:zlib`.

npm is the supported path. `package-lock.json` is committed. `bunfig.toml` is here so the monorepo install rule is satisfied. You do not need Bun.

This demo calls REA's static inspectors only. It does not call Frida, Ghidra, Hopper, IDA, or JADX. `rea-agents` lists Frida as an optional dependency for other commands; nothing in this app imports or launches it.

## What you can open

| Fixture | Inspector |
| --- | --- |
| `demo.sqlite` | `inspect-sqlite-database` |
| `tiny.gguf`, `tiny.safetensors` | `inspect-model-artifact` |
| `hello.wasm` | `inspect-wasm-artifact` |
| `hello-go` | `inspect-go-binary`, `inspect-rust-binary`, `inspect-elf-notes` |

The page calls the published `rea-agents@6.8.0` CLI at `node_modules/rea-agents/scripts/rea.mjs`. The package has no `main` or `exports`. This app consumes that package. It is not a fork and it does not vendor REA source.

REA is MIT, from [morluto/rea](https://github.com/morluto/rea).

Uploads are capped at 256 MiB, written to a private temp file, and deleted after the CLI returns. The local API listens on `127.0.0.1:3001`. Vite proxies `/api`.

## WASM and WABT

Without WABT, the WASM fixture renders REA's capability-unavailable card and REA's remediation text. To decode sections, imports, and exports, install WABT 1.0.42, copy `.env.example` to `.env`, and set `REA_WABT_BIN_DIRECTORY` to the absolute directory that contains `wasm-validate`, `wasm-objdump`, and `wasm2wat`. Restart `npm run dev`.

## Rebuild fixtures

```bash
npm run fixtures
```

That rewrites `fixtures/` with Node's `node:sqlite`, hand-built GGUF / safetensors / WASM bytes, and `go build -trimpath -buildvcs=false -ldflags=-s -w` for `hello-go`. A Rust fixture needs `cargo auditable`, which this demo does not require. The Go fixture shows the empty Rust state (no `.dep-v0` section).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 plus the inspect API |
| `npm test` | Magic-byte routing and one fixture inspect per kind |
| `npm run build` | Typecheck and production client build |
| `npm run lint` | oxlint |
| `npm run fixtures` | Regenerate committed fixtures |
