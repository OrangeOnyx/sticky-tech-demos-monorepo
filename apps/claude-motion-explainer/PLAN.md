# PLAN — claude-motion-explainer

## Goal
Paste a small commercial rent roll and get a short, editable motion explainer (occupancy, vacancies, upcoming expirations, rent/sqft) where an LLM writes Remotion scene code/props — no video model — previewed live in the browser.

## Single-user MVP
- Vite + React + TypeScript page under `apps/claude-motion-explainer/` only
- Input: paste a rent-roll CSV (`unit,tenant,sqft,rent,lease_end,status`) or free-form bullets
- Deterministic parser computes metrics: occupancy % (by sqft and by unit), vacant units, leases expiring in 3/6/12 months, avg rent per sqft, total monthly rent
- LLM step returns a typed `ExplainerSpec` (ordered scenes: title, KPI counter, occupancy donut, vacancy list, expiration timeline bars, rent/sqft bar chart, outro) with text, numbers, colors, durations
- Remotion composition renders the spec; `@remotion/player` gives live in-browser preview with play/scrub
- Editable timeline: scene list with per-scene duration + reorder/toggle; props panel to edit any number or word — the player re-renders just that scene instantly
- Mode toggle: Fixture (default) vs Live
  - Fixture: 3 canned explainers built from FAKE sample rent rolls (e.g. "Maple Court Plaza", "Riverbend Commons", "Harbor Point Retail"), invented tenants and figures only. No env needed.
  - Live: local `POST /api/explain` calls the LLM with `ANTHROPIC_API_KEY` from `.env` (server-side only); response validated with zod, falls back to fixture-style spec on invalid output
- `.env.example` with `ANTHROPIC_API_KEY=` (never a real key)
- README leads with `npm install && npm run dev`
- npm only: `package-lock.json`; no `bunfig.toml`, no Bun scripts

## Explicitly out of scope
- Any real tenant/property data (no Atlas / On The Boulevard data in the repo)
- Sibling apps, root files, `AGENTS.md`, `tracking/`, new GitHub repos
- Generative video / image models, voiceover, music
- Auth, multi-user, persistence beyond the browser session
- XLSX / PDF rent-roll import, Yardi/AppFolio integrations

## Outcome-oriented tasks
1. Scaffold Vite + React + TS + shadcn (minimal) with npm; Remotion + @remotion/player render a hello composition
2. Rent-roll parser + metrics with unit tests on the 3 fake fixtures
3. `ExplainerSpec` schema (zod) + scene components; fixture spec plays end-to-end in the Player
4. Editor: scene timeline + props panel; editing a value updates the preview immediately
5. Node server `/api/explain`: fixture by default, live Anthropic call when key set and toggle is Live; key never reaches the browser
6. README, `.env.example`, tests; run fixture path and attach a screenshot and a video to the single PR into main
7. (Stretch, only if it fits) MP4 export via `@remotion/renderer` CLI script (`npm run render`) for the current spec

## Stack
- **Vite + React + TypeScript** — same one-screen shape as `apps/typesafe-jev` / `apps/inspo-mcp`
- **Remotion + @remotion/player** — code-defined animation from React props, which is exactly the Claude Motion pattern; Player gives free in-browser preview
- **zod** — validate LLM-written spec so bad output can't crash the player
- **Anthropic Messages API (direct HTTP)** — user's own key from `.env`, server-side only
- **Node `http` server + Vite proxy** — matches sibling apps; keeps the key off the client
- **shadcn/ui** — minimal editor chrome
- **npm** — Adam doesn't use Bun; no bunfig

## Deferred
- MP4 export if it doesn't fit scope (document `npx remotion render` as the path)
- LLM writing raw TSX (MVP constrains it to a spec over prebuilt scene components for safety)
- Live call in CI, hosting, saving/sharing explainers
