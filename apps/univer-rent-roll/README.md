# Harbor Court rent roll

A single-user Univer Sheet preloaded with an invented rent roll for **Harbor Court**. Edit units, read occupancy and rent from formulas on a Summary sheet, then reset or export.

This demo uses the Apache-2.0 preset [`@univerjs/presets`](https://www.npmjs.com/package/@univerjs/presets) and [`@univerjs/preset-sheets-core`](https://www.npmjs.com/package/@univerjs/preset-sheets-core). It is not a fork of [Univer](https://github.com/dream-num/univer) and it does not need an API key. Charts, pivot tables, and printing live in the commercial preset (`@univerjs/preset-sheets-advanced` / `@univerjs-pro`). They are not included here, so occupancy stays a formula.

Every tenant, rent, and date is made up. This is not a real property record.

```bash
cd apps/univer-rent-roll
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Node 24 is the version this app was run on (`.nvmrc` is `24`). npm is the way to install and run it.

## What you can do

1. **Rent Roll** — 20 invented units: unit, tenant, sq ft, status (`Occupied`, `Vacant`, or `Notice`), monthly rent, and lease end. The header row is frozen. Change any cell.
2. **Summary** — `COUNTA`, `COUNTIF`, `SUM`, and `SUMIF` over `'Rent Roll'!A2:A100` (and the matching columns). In-place occupancy is occupied ÷ units. Leased occupancy is (occupied + notice) ÷ units. Monthly rent sums the rent column, with vacant units at $0.
3. **Reset data** — drops the workbook and loads the fixture again.
4. **Export JSON / Export CSV** — downloads the current grid, including edits. CSV is the rent-roll rows. JSON includes `summaryFromRows` (recomputed from those rows) and `summaryFromSheet` (the formula cells).

The line under the buttons reads the Summary formula cells after Univer calculates them.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 |
| `npm test` | Fixture totals, formula text, and CSV escaping |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

`bunfig.toml` is here so the monorepo install rule is satisfied. You do not need Bun. `package-lock.json` is the lockfile.

Univer is Apache-2.0, from [dream-num/univer](https://github.com/dream-num/univer). Docs: [docs.univer.ai](https://docs.univer.ai).

The page chrome uses Cypress Command colors.
