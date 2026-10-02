# PLAN — inspo-mcp

## Goal
A single-user playground where Adam pastes a UI brief and sees real Inspo exemplars, a palette, and a DESIGN.md-style snippet, offline by default.

## Single-user MVP
- Vite + React + TypeScript page under `apps/inspo-mcp/` only
- Brief field plus three presets: dark SaaS pricing (strong), editorial magazine (strong), uncatalogued nonsense (weak / empty)
- Mode toggle: Fixture (default) vs Live
- Study posts to local `POST /api/study`
  - Fixture matches the brief against two committed snapshots of `recommend` + `get_design_system`. No network.
  - Live calls the hosted Streamable HTTP MCP at `https://inspomcp.dev/api/mcp` (no auth): `recommend`, then `get_design_system` on the top exemplar slug. The browser only talks to the local API.
- UI: exemplar thumbs and source / archive links, palette swatches, type and spacing summary, full DESIGN.md
- `GET /api/health` reports the local API and the configured MCP URL
- `.env.example` documents optional `INSPO_MCP_URL` and `INSPO_DESIGN_LIVE` only. No secrets.
- README leads with `npm install && npm run dev` → http://127.0.0.1:5173
- Local `cn` via `clsx` + `tailwind-merge`
- `package-lock.json` so npm works without Bun
- `bunfig.toml` with `[install] minimumReleaseAge = 259200`

## Explicitly out of scope
- Sibling apps, `AGENTS.md`, `tracking/`
- A new GitHub repository
- Auth, accounts, or saving studies
- Calling every Inspo tool. MVP is `recommend` + `get_design_system`
- Reference JSX viewer (`get_reference_jsx` stays a documented follow-up)

## Outcome-oriented tasks
1. Write this plan, then scaffold Vite + React + shadcn (minimalist) with `bunfig.toml` before install
2. Commit fixture snapshots (strong pricing, strong editorial, weak empty fallback) and local thumbs
3. Node server on port 3001: fixture by default, live MCP only when the toggle says Live
4. Playground UI: presets, mode toggle, exemplars, palette, DESIGN.md
5. README (npm first), `.env.example`, health endpoint, fixture tests
6. Run the fixture path and attach a screenshot and a video to the PR

## Stack
- **Vite + React + TypeScript** — one screen. Same shape as `apps/typesafe-jev`, so `npm run dev` does not need Bun. A heavier framework would add routing this page does not use.
- **shadcn/ui (radix-nova, neutral)** — minimal chrome; button, card, badge, input label, textarea only
- **Node `http` server + Vite proxy** — Inspo stays off the browser. Dev script is Node so npm is enough.
- **Hosted MCP** — `POST https://inspomcp.dev/api/mcp`, JSON-RPC `tools/call`, protocol `2025-06-18`, verified against the live endpoint. `get_design_system` defaults to `live: false` (captured tokens). Set `INSPO_DESIGN_LIVE=true` to let Inspo fetch the source site.
- **Bun optional** — `bunfig.toml` satisfies the monorepo rule. Bun is not required to run the demo.

## Deferred
- Live call in CI (fixture mode is the required path; the public endpoint can change)
- Durable hosting
- `search_screens`, `get_reference_jsx`, and the rest of the 15-tool catalog
