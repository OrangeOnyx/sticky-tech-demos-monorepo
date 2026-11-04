# PLAN — rea-xray

## Goal
A single-user "file X-ray" page: drop a SQLite DB, GGUF or safetensors model, WASM module, or Go or Rust binary, and see REA's static inspection as a visual report. Built-in fixtures mean it works without an upload.

## Single-user MVP
- Vite + React + TypeScript app under `apps/rea-xray/` only. A local Node API on `127.0.0.1:3001`, proxied by Vite at `/api`. Same split as `apps/typesafe-jev`.
- `npm install && npm run dev` → http://127.0.0.1:5173. npm is the only path. Bun is not required.
- Drop zone plus a **Fixtures** picker: `demo.sqlite`, `tiny.gguf`, `tiny.safetensors`, `hello.wasm`, `hello-go` (a tiny Linux ELF).
- The server saves the upload to a private temp dir, sniffs magic bytes, runs the matching REA CLI inspector with `--json`, deletes the temp file, and returns the Evidence JSON.
  - `SQLite format 3\0` → `inspect-sqlite-database` (inventory). A second call with `--table T --row-limit 25` runs when you pick a table.
  - `GGUF` or a u64 length followed by `{` → `inspect-model-artifact`
  - `\0asm` → `inspect-wasm-artifact --format json`
  - ELF / Mach-O / PE → `inspect-go-binary` and `inspect-rust-binary` in parallel. Also `inspect-elf-notes` for ELF and `inspect-pe-imports` for PE.
- Report views, one per kind:
  - **SQLite:** a tables/indexes/views/triggers list, the column list, and a rows grid for the selected table
  - **Model:** format, version, alignment, a metadata key/value table, and a tensor table (name, dtype, shape as `2×3`, params, bytes). Totals go in a stat row.
  - **WASM:** sections, imports and exports when WABT is configured. Otherwise a "capability unavailable" card that shows REA's own remediation text.
  - **Binary:** Go version, a build-settings table, a modules table and a main→deps graph. Rust: a crate graph from cargo-auditable edges, or "no `.dep-v0` section".
- Every view has a header card (file name, SHA-256, size, REA provider and version), a Limitations accordion (REA's `limitations[]`) and a Raw JSON accordion.
- REA error replies (JSON on stdout, exit 1) are shown as a readable error card, not a crash.
- `bunfig.toml` with `[install] minimumReleaseAge = 259200` stays, to satisfy the monorepo rule. `package-lock.json` is committed.
- README credits REA (MIT, morluto/rea, npm `rea-agents`). This app is a demo that consumes the published package. It is not a fork and vendors no REA source.

## Explicitly out of scope
- Ghidra, Hopper, IDA, JADX, Frida or any native decompile / disassembly / pseudocode
- The MCP server, `rea setup`, and agent registration
- JS/Electron, APK, firmware, pcap, browser and other REA targets
- Auth, multi-user, persistence, history, hosted uploads
- Sibling apps, `AGENTS.md`, `tracking/`, and any new GitHub repo

## Outcome-oriented tasks
1. **Plan + scaffold.** Commit this file. Then `npm create vite@latest . -- --template react-ts`, `npx shadcn@latest init` (radix-nova, neutral, matching sibling `components.json`) and `bunfig.toml`. Set `engines` and `.nvmrc` before the first install.
2. **Fixtures that need no upload.** `scripts/make-fixtures.mjs` (Node 24) writes `fixtures/demo.sqlite` (via `node:sqlite`: 3 tables, 1 index, 1 view, ~20 rows), `tiny.safetensors` (a hand-written header with 3 small tensors), `tiny.gguf` (a v3 header with a few KV pairs and 2 tensors) and `hello.wasm` (hand-assembled bytes with 1 import and 2 exports). `hello-go` is built once with `go build -trimpath -ldflags="-s -w"` and committed (about 1.5 MB). Rust fixture: see Deferred.
3. **Inspect API, end to end on SQLite first.** `server/index.ts` handles `POST /api/inspect` (raw body plus `x-filename`, with a 256 MiB cap), `GET /api/fixtures` and `POST /api/inspect/fixture/:name`. `server/rea.ts` wraps `execFile`. `server/sniff.ts` routes by magic bytes. Tests: sniff routing plus one fixture inspect per kind (`node --test`).
4. **SQLite report slice.** Table list → columns → rows grid. This is the first full vertical slice. Re-check the plan after it works.
5. **Model report slice** (GGUF and safetensors share one view).
6. **Binary report slice.** Go modules table and graph. Rust crate graph with an empty state.
7. **WASM report slice.** Show the unavailable card by default. When `REA_WABT_BIN_DIRECTORY` is set in `.env`, render sections and imports/exports. `.env.example` documents it.
8. **Polish + PR.** README (npm-first, Node note, REA credit, WABT optional), lint and build. Run the fixtures, record the demo, open the PR.

## Stack
- **npm + Node 24 (`--experimental-strip-types` server, `server/dev.mjs` launcher):** Adam has no Bun. The launcher is copied from `typesafe-jev`, so `npm run dev` starts the API and Vite together.
- **Vite + React + TypeScript:** a one-screen tool with the same scaffold as the sibling apps. No framework overhead.
- **shadcn/ui (radix-nova, neutral) + Tailwind v4:** the monorepo UI default. Add only Card, Tabs, Table, Accordion, Badge and Alert on demand.
- **`rea-agents` (pinned `6.8.0`, run through its CLI with `--json`):** the package has no `main` or `exports`, so the CLI is the supported Node entry. It returns structured Evidence JSON.
- **`@xyflow/react` + `@dagrejs/dagre`:** a prebuilt graph view and auto-layout for the crate and module graphs. No hand-rolled SVG.
- **`node:test`:** fast tests for sniffing and per-fixture inspection only.
- **oxlint:** matches the sibling apps' `lint` script.

## Deferred
- **WASM with real WABT output by default.** REA needs exactly WABT 1.0.42 binaries, and upstream has only exercised them on macOS arm64. We show REA's own capability diagnostic until a user sets `REA_WABT_BIN_DIRECTORY`. A `scripts/fetch-wabt.mjs` helper can come later.
- **Rust fixture.** It needs `cargo auditable build`, so it is committed only if `cargo-auditable` is already on the agent machine. Otherwise the Rust panel is shown with uploads (and the Go fixture shows the empty state).
- **Mach-O/PE fixtures, full-file hashing (`--hash full`), Evidence bundle export, `inspect_analysis_view` paging:** none of them are needed to show the X-ray idea.
- **Hosting / Cloudflare Pages:** the app needs a Node server that spawns REA, so it is not static-hostable as-is.
- **Drag-in folders, multiple files and diffing:** single-file only for the MVP.

## Node version (engines)
REA's package `engines` is `^22.23.4 || ^24.22.1 || >=26.12.1`. SQLite inspection also needs Node 24.15+ or 26+ (the `DatabaseSync.limits` API). The intersection that keeps every slice working:

```json
"engines": { "node": "^24.22.1 || >=26.12.1" }
```

Add `.nvmrc` with `24.22.1`. Node 22 is dropped on purpose because SQLite would fail there. On Node 20 the REA CLI crashes on import (`node:zlib` has no `zstdDecompress`). The server should check `process.versions.node` at startup and print a clear message.

## Acceptance
- From `apps/rea-xray/` on Node 24.22.1+: `npm install && npm run dev` opens the page, and every fixture renders a report with no upload and no `.env`.
- Uploading one real file of each supported kind gives a report or a readable REA error card.
- `npm test`, `npm run lint` and `npm run build` pass.
- Only `apps/rea-xray/` is changed.
- **The PR must include at least one screenshot and one short demo video of the running app.** Not optional.
