# PLAN — agent-desktop-xray

## Goal
A single-user web X-ray of Vercel Labs **agent-desktop** (https://github.com/vercel-labs/agent-desktop): browse sample accessibility-tree snapshots, click an element to copy the exact `agent-desktop click '@ref'` / `set-value` / `type` command, and step through a recorded observe→act→verify replay that shows a **STALE_REF** error instead of a misclick.

## Single-user MVP
- Vite + React + TypeScript under `apps/agent-desktop-xray/` only, in `OrangeOnyx/sticky-tech-demos-monorepo`
- `npm install && npm run dev` → http://127.0.0.1:5173. **npm only.** Adam has no Bun. Keep `bunfig.toml` (`[install] minimumReleaseAge = 259200`) only to satisfy the monorepo AGENTS.md rule; commit `package-lock.json`
- One screen with two tabs:
  1. **Tree** — pick a bundled sample snapshot (JSON envelope matching agent-desktop v2.6 shape: `ok`, `command: "snapshot"`, `data.app`, `data.snapshot_id`, `data.tree` with `role` / `name` / `ref_id` / `available_actions` / `children`). Expand/collapse the a11y tree. Selecting a node with a `ref_id` shows a command panel with copyable lines, e.g. `agent-desktop click '@s8f3k2p9:e8'` and (for textfield) `agent-desktop set-value '@s8f3k2p9:e3' "…"`. Bare `@eN` is never suggested (INVALID_ARGS). Highlight selected node; show role, name, actions, and snapshot_id
  2. **Replay** — a 3–5 step made-up agent run against a toy “Notes” app (not a real OS capture): Snapshot₁ → click New → Snapshot₂ (new textfield) → click a **stale** ref from Snapshot₁ → JSON error envelope with `error.code: "STALE_REF"` (or `AMBIGUOUS_TARGET`) → fresh Snapshot₃ with the working ref. Stepper with Prev/Next, current command + response JSON, and the tree for the active snapshot. A short callout explains why refs are snapshot-qualified
- Fixtures live under `public/samples/` (or `src/fixtures/`): at least **two** full snapshot trees (before/after) plus one click-ok and one STALE_REF JSON response. All names are invented (e.g. app `DemoNotes`, buttons “New note”, “Save”). **No real desktop screenshots, no private window titles, no user PII**
- Optional **Live bridge** panel (collapsed by default): documents how to point at a local `agent-desktop` CLI later. MVP ships a stub: if `AGENT_DESKTOP_BRIDGE=1` and a sibling Node API is up, `GET /api/bridge/status` returns whether the binary is on PATH; otherwise the UI says “Bridge off — samples only.” Do **not** require the CLI for the happy path
- `.env.example`, README (npm-first, agent-desktop credit + MIT link, observe/act/verify loop), oxlint, `node --test` for ref→command formatting and STALE_REF detection helpers

## Explicitly out
- Shipping or vendoring the Rust `agent-desktop` binary
- Driving the user’s real desktop from the cloud agent or CI (no Accessibility permissions on the VM)
- Screenshot / pixel matching demos (that is the opposite of agent-desktop)
- Auth, multi-user, persistence, hosted bridge
- Sibling apps, root `AGENTS.md`, `tracking/`, a new repository
- Bun as a runtime requirement
- Calling cua or any other computer-use driver

## Outcome-oriented tasks
1. **Plan + scaffold.** Commit this PLAN.md. `npm create vite@latest . -- --template react-ts` inside `apps/agent-desktop-xray/`. Add `bunfig.toml` before install. `npx shadcn@latest init` (radix-nova, neutral, Geist — match typesafe-jev / atlas-rig-lab). Copy sibling `.gitignore` and `.oxlintrc.json`. `npm install`
2. **Fixtures + types.** Hand-write 2–3 snapshot envelopes and action/error envelopes that match the public README shape (`version: "2.6"`, qualified `@<snapshot_id>:eN` refs). TypeScript types for tree nodes. Unit tests: `formatClickCmd(ref)`, reject bare `@eN`, detect `STALE_REF` in error envelopes
3. **Tree tab end to end.** Fixture picker → recursive tree → select → command panel with Copy. Keyboard: arrow keys move selection among interactive nodes when focus is in the tree
4. **Replay tab end to end.** Hard-coded script of steps; each step shows command, response, and the snapshot tree after that step. Final stale step surfaces the error card in red, then the recovery snapshot
5. **Bridge stub (optional).** Tiny `server/dev.mjs` + `server/index.ts` (sibling pattern) with `GET /api/bridge/status` only. No spawn of agent-desktop unless PATH check. Vite proxies `/api`. App runs fully without the server if preferred — if so, keep bridge UI as docs-only and skip the server; prefer the docs-only path unless the sibling launcher is trivial to copy
6. **README + PR.** npm quickstart, sample vs bridge table, credit Vercel Labs agent-desktop, link https://github.com/vercel-labs/agent-desktop and https://agent-browser.dev/desktop/snapshots-and-refs. Open **one PR** that only touches `apps/agent-desktop-xray/`, with **at least one screenshot** (tree tab, a ref selected, command panel visible) **and one short video** (10–30 s: open Tree → pick fixture → select button → copy click cmd → switch to Replay → step through until STALE_REF → recovery)

## Stack
- **Vite + React + TypeScript (npm):** same shape as typesafe-jev / rea-xray / atlas-rig-lab; runs without Bun
- **shadcn/ui (minimalist):** button, card, tabs, badge, scroll-area, separator, alert — add on demand
- **Static JSON fixtures:** the product under demo is CLI + a11y JSON; no need for three.js or graphs
- **oxlint + Node test runner:** match siblings; no Jest/Vitest
- **Optional Node `http` + Vite proxy:** only if bridge stub is kept; otherwise pure static Vite is fine

## agent-desktop facts the demo must get right (from upstream README / docs, 2026-11-03)
- Refs are **snapshot-qualified**: `@s8f3k2p9:e8`. Bare `@e8` → `INVALID_ARGS`
- After UI changes, old refs → `STALE_REF` or `AMBIGUOUS_TARGET`; take a new snapshot
- Prefer semantic acts in the command panel: `click`, `set-value` (over `type` for fields), `check` / `uncheck`
- Each CLI command returns one JSON envelope (`ok`, `command`, `data` or `error`)
- agent-desktop has **no model inside**; the loop lives in the agent. This demo visualizes that loop

## Deferred
- Real local bridge that shells out to `agent-desktop snapshot` / `click` and streams into the viewer (needs OS a11y permissions on Adam’s machine)
- Trace / session file import from upstream `trace` command
- Multi-app / multi-window surface picker
- Hosting on Cloudflare Pages (static MVP is fine; bridge needs a local server)

## Acceptance
- From `apps/agent-desktop-xray/` with no `.env` and no `agent-desktop` binary: `npm install && npm run dev` opens the Tree tab; selecting a fixture node shows a qualified `agent-desktop click '…'` command; Replay reaches a visible STALE_REF step then a recovery snapshot
- `npm test`, `npm run lint`, and `npm run build` pass
- `package-lock.json` and `bunfig.toml` are committed. **Nothing outside `apps/agent-desktop-xray/` changes**
- Fixtures contain no private screen content
- The PR includes **at least one screenshot and one short demo video** of the running app (not optional)
- README credits Vercel Labs agent-desktop and states this is a sample-data demo, not a fork
