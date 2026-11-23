# PLAN — univer-rent-roll

## Goal
A single-user page that opens an editable [Univer](https://github.com/dream-num/univer) Sheet on an invented Harbor Court rent roll, with a second sheet of occupancy and rent formulas, plus reset and JSON/CSV export.

## Single-user MVP
- Vite + React + TypeScript under `apps/univer-rent-roll/` only.
- `npm install && npm run dev` on Node 24 → http://127.0.0.1:5173. **npm only.** No Bun required. `bunfig.toml` (`[install] minimumReleaseAge = 259200`) is committed only to satisfy the monorepo rule. `package-lock.json` is the lockfile.
- One screen:
  - Cypress Command chrome (Brunswick green `#1e4d3a`, ink `#0c1c14`, stone `#eae5dc`). No Orange Ocean naming, color, or copy.
  - An editable Univer Sheet from the Apache-2.0 preset `@univerjs/presets` + `@univerjs/preset-sheets-core` (same version, currently 1.6.x). No API key. No `@univerjs-pro` and no `@univerjs/preset-sheets-advanced`.
  - Workbook **Harbor Court**, two sheets:
    1. **Rent Roll** — 20 invented units. Columns: Unit, Tenant, Sq ft, Status (`Occupied` / `Vacant` / `Notice`), Monthly rent, Lease end. Header row frozen. Tenants are invented people and businesses. Vacant units have a blank tenant, `$0` rent, and a blank lease end.
    2. **Summary** — formulas over `'Rent Roll'!A2:A100` (and the matching C/D/E ranges), so a few extra rows still count: unit count (`COUNTA`), occupied / notice / vacant (`COUNTIF`), in-place occupancy (occupied ÷ units), leased occupancy ((occupied + notice) ÷ units), total sq ft, leased sq ft (`SUMIF`), monthly rent (`SUM`), in-place rent, notice rent, and average rent on occupied + notice units. Percent and currency number formats.
  - Toolbar above the grid: **Reset data** (dispose the unit and recreate the fixture), **Export JSON**, **Export CSV**. Export reads the live grid, so edits are included. CSV is the rent-roll rows. JSON is `{ property, note, units, summaryFromRows, summaryFromSheet }`.
- Fixtures and pure helpers live in `shared/` so `node --test` can check counts, occupancy, rent totals, formula strings, CSV escaping, and the workbook snapshot without a browser.
- A one-line note on the page: charts live in the commercial advanced preset, so this OSS build keeps occupancy as formulas.

## Explicitly out
- `@univerjs/preset-sheets-advanced`, `@univerjs-pro/*`, charts, pivot tables, print, collaboration, and any license key (charts are commercial, not in the OSS preset; unlicensed pro output is watermarked)
- Real property, tenant, or rent data
- Orange Ocean / On The Boulevard branding or data
- Auth, multi-user, persistence, a backend
- Sibling apps, root lockfiles, `AGENTS.md`, `tracking/`, a new repository
- Bun as a runtime requirement

## Outcome-oriented tasks
1. **Plan.** This file, before the app.
2. **Scaffold.** `npm create vite@latest` with the `react-ts` template inside `apps/univer-rent-roll/`. Add `bunfig.toml` before install. shadcn/ui minimalist (button, badge) aligned with `apps/agent-desktop-xray`. Cypress Command colors in `src/index.css`. `npm install` of `@univerjs/presets` and `@univerjs/preset-sheets-core` at the same version, plus `rxjs`.
3. **Fixture + formulas.** `shared/harbor-court.ts`: 20 units, `summarize()`, CSV/JSON builders, and `harborCourtWorkbook()` cell data including Summary formulas. `shared/harbor-court.test.ts`.
4. **Sheet on screen.** Mount Univer in `useEffect` the way the React guide does (own child container, dispose on a microtask). `createWorkbook(harborCourtWorkbook())`. Toolbar reset and exports.
5. **README + checks.** npm quickstart, Node 24, Univer credit and Apache-2.0 link, chart omission, invented-data note. `npm test`, `npm run lint`, `npm run build`.

## Stack
- **Vite + React + TypeScript (npm):** same shape as agent-desktop-xray / rea-xray. Runs without Bun. Node 24 is the documented runtime.
- **`@univerjs/presets` + `@univerjs/preset-sheets-core`:** official preset mode. Facade API (`getRange`, `getValues`, `save`) is how export and reset talk to the grid. No hand-rolled spreadsheet.
- **shadcn/ui (radix-nova, neutral) + Tailwind v4:** monorepo UI default, recolored to Cypress Command. Button and badge only.
- **`node:test`:** fixture math, formula text, and CSV. No Vitest.
- **oxlint:** matches sibling `lint` scripts.

## Deferred
- A chart, until it exists in an Apache-2.0 preset. The commercial preset is out of this demo.
- XLSX import/export (exchange client is part of the commercial stack). JSON and CSV are enough.
- Data-validation dropdowns for Status, filters, and collaboration.
- Cloudflare Pages. The Vite build is static if someone hosts it later.

## Acceptance
- From `apps/univer-rent-roll/` on Node 24, with no `.env`: `npm install && npm run dev` opens Harbor Court. Rent Roll shows 20 invented units. Summary formulas show occupancy and total rent. Cells are editable. Reset restores the fixture. Export JSON and Export CSV download the current grid.
- `npm test` and `npm run build` pass. `npm run lint` passes.
- Only `apps/univer-rent-roll/` changes. No root lockfile.
- Nothing in the fixture is a real tenant, rent, or property record.
- The PR includes **at least one screenshot and one short demo video** of the running app (open the roll, show Summary, edit a cell, export, reset).
