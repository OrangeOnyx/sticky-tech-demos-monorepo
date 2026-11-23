# Larkspur Yard

A 3D dashboard for an invented retail court, drawn with [phoria2](https://github.com/kevinroast/phoria2). Bars or a surface show occupancy, rent per square foot, and vacancy days by building and month. A yard of boxes is the unit picker. Click a bay and the side panel shows that bay’s invented record.

The figures are made up for this demo. Larkspur Yard is not a real property. This folder does not use Orange Ocean names or records.

The header uses the Cypress Command mark. Product site: [cypresscommand.com](https://cypresscommand.com/).

```bash
cd apps/phoria2-dashboard
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Node 22 or newer, including Node 24. No `.env` and no API key. Bun is optional.

Drag either view to orbit, right-drag to pan, and scroll to zoom. Switch the metric, the chart mark (Bars or Surface), and the month. Click a chart mark or a yard box to fill the side panel.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 |
| `npm test` | Rollups, chart rows, colors, and bay placement. No GPU and no network. |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

## Stack

Vite, React, TypeScript, shadcn/ui (radix-nova, neutral) themed with Cypress Command paper and cypress green, and phoria2 1.9 (`View`, `chart()` from `phoria2/charts`, `Mesh` / `box` / `Label`). npm is the path when Bun is not installed. `package-lock.json` is committed.

## Bun

The monorepo convention is Bun. This app includes `bunfig.toml` with `minimumReleaseAge = 259200`. If Bun is installed:

```bash
bun install
bun run dev
```

## Credit

phoria2 by Kevin Roast, MIT. [Repository](https://github.com/kevinroast/phoria2), [site](https://kevs3d.co.uk/phoria2/), [npm](https://www.npmjs.com/package/phoria2).
