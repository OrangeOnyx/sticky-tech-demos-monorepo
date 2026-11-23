# PLAN — phoria2-dashboard

## Goal

A single-user 3D dashboard for an invented retail center, drawn with [phoria2](https://github.com/kevinroast/phoria2) (dependency-free WebGL 2): a bar or surface chart of occupancy, rent per sq ft, and vacancy days by building and month, plus a simple 3D unit picker whose click opens invented details.

## Single-user MVP

- Vite + React + TypeScript under `apps/phoria2-dashboard/` only, in `sticky-tech-demos-monorepo`
- `npm install && npm run dev` → http://127.0.0.1:5173. **npm only.** Adam has no Bun. Keep `bunfig.toml` (`[install] minimumReleaseAge = 259200`) only to satisfy the monorepo AGENTS.md rule; commit `package-lock.json`. Scripts must run on Node 22 and Node 24 (no Bun, no API key, no `.env`)
- One screen:
  - Header: Cypress Command mark, the invented center name **Larkspur Yard**, and a “Sample figures” badge. Paper and cypress-green from the public Cypress Command site (`#faf7ef`, `#0a1f16`, `#1e4d3a`). No Orange Ocean name, palette, or property
  - Toolbar: metric switcher (**Occupancy**, **Rent / sq ft**, **Vacancy days**), chart mark (**Bars** / **Surface**), and the sample months
  - **Chart view**: `chart()` from `phoria2/charts`. `x` is month, `z` is building, `y` is the selected metric. Orbit, pan, wheel zoom. Clicking a mark sets the month and the building
  - **Yard view**: one box per invented unit, grouped into five buildings on a ground plane, with HTML labels. Box height and color follow that unit’s metric for the active month. Orbit and zoom. Clicking a unit selects it (outline) and fills the side panel
  - **Side panel**: tenant, use, floor, sq ft, the three metrics for the active month, and the unit’s month table. Empty state asks for a click. Every figure is labeled as invented
- Fixture module `shared/center.ts`: 5 buildings, 3 units each, 6 months (Mar–Aug 2026). Hand-written numbers. No network, no real addresses, no real tenants, no real rents
- `.gitignore`, `.oxlintrc.json`, README (npm-first, phoria2 credit, Cypress Command note), `node --test` for rollups and chart rows. No server

## Explicitly out

- Real property, tenant, or rent data, including anything from Orange Ocean or On The Boulevard
- API keys, live feeds, auth, multi-user, persistence
- glTF buildings, custom shaders, editing handles, particles
- Sibling apps, root lockfile, root `AGENTS.md`, `tracking/`, a new repository
- Bun as a runtime requirement

## Outcome-oriented tasks

1. **Plan.** Commit this PLAN.md before the app.
2. **Scaffold.** `npm create vite@latest` with the `react-ts` template inside this folder. Add `bunfig.toml` before `npm install`. `npx shadcn@latest init` with the sibling minimalist preset (radix-nova, neutral). Add button, card, badge, toggle-group, separator, and scroll-area on demand. Copy the sibling `.gitignore` and `.oxlintrc.json`. `npm install phoria2`.
3. **Fixtures and pure helpers.** Buildings, units, months, and area-weighted rollups. `chartRows(metric)` is one row per building per month. `unitMetric`, `formatMetric`, and `metricColor` are tested with `node --test` and do not import WebGL.
4. **Chart and yard.** Two `View`s, each with `orbit: true` and `dispose()` on unmount. Metric and mark changes call `chart.update` or replace the chart node without dropping the camera. Yard meshes update scale, color, and outline in place.
5. **README + PR.** npm quickstart, what is invented, phoria2 links (repo, site, npm). One PR that only touches `apps/phoria2-dashboard/`, with at least one screenshot and one short video (metric switch, orbit, bar click, unit click, side panel).

## Stack

- **Vite + React + TypeScript (npm):** same shape as atlas-rig-lab and agent-desktop-xray; runs without Bun
- **phoria2:** the library under demo. `View` + `chart()` for the chart, `Mesh` / `box` / `Label` for the yard. Plain `three` would ignore the point of the demo
- **shadcn/ui (minimalist, radix-nova, neutral):** monorepo UI default, themed with Cypress Command paper and green. Components added on demand
- **oxlint + Node test runner:** match siblings; no Jest or Vitest
- **No Node server:** every number is in the fixture. `npm run dev` is Vite only

## phoria2 facts the demo uses (kevs3d.co.uk/phoria2/llms-full.txt)

- `new View({ canvas, orbit, background, highlight, keyboard })`, then `view.start()`, `view.frame()`, `view.dispose()`
- `chart({ mark: 'bar' | 'surface', data, x, z, y, color, tooltip, theme, box })` from `phoria2/charts`. A surface is one row per grid point. `update(rows)` animates new heights. A pick’s `hit.datum` is the original row
- Orbit: left-drag turns, right-drag pans, wheel zooms. `view.controls` can be reset with `view.frame(node, { direction: 'perspective' })`
- Boxes are centred: place a unit at `y = height / 2`. `pickable: false` on the ground plane
- Scene logic can run under `NullRenderer` with no GPU. This app’s tests stay on the pure helpers and do not need that

## Cypress Command

The header carries the public Cypress Command mark and the name “Cypress Command”. Colors come from the public site: ink `#0a1f16`, cypress `#1e4d3a`, mid green `#2f6b4e`, paper `#faf7ef` / `#f3ede0`, sage borders `#c6d0bf`. The invented center is **Larkspur Yard**. It is not a real property and it is not an Orange Ocean product. Do not use Orange Ocean naming, orange-ocean palette, or OTB records.

## Deferred

- Cloudflare Pages hosting (static build is enough to add later)
- A glTF massing model, if a later demo needs more than boxes
- Importing a spreadsheet of sample rows (the fixture is the whole dataset)

## Acceptance

- From `apps/phoria2-dashboard/` with no `.env`: `npm install && npm run dev` opens the dashboard. The chart shows six months by five buildings. Switching the metric changes bar or surface height. Bars and Surface both render. Drag orbits and the wheel zooms in both views
- Clicking a chart mark sets the month and building. Clicking a yard unit shows that unit’s invented tenant, sq ft, and the three metrics in the side panel, and outlines the box
- `npm test` and `npm run build` pass on Node 22 or newer, including Node 24
- `package-lock.json` and `bunfig.toml` are committed. Nothing outside `apps/phoria2-dashboard/` changes
- The PR includes at least one screenshot and one short video of the running app
- UI copy says the figures are invented. It does not say Orange Ocean
