# PLAN — a2ui-surfaces

## Goal
A single-user player that replays recorded A2UI message streams and watches `@a2ui/react` assemble a surface one message at a time: a property work-order form, then a showing-request screen, with the JSON of each message beside the UI.

## Single-user MVP
- Vite + React + TypeScript under `apps/a2ui-surfaces/` only, in `OrangeOnyx/sticky-tech-demos-monorepo`
- `npm install && npm run dev` → http://127.0.0.1:5173. **npm only.** Node 24 is the documented runtime (`engines` `>=22`, so Node 24 satisfies it). Adam has no Bun. Keep `bunfig.toml` (`[install] minimumReleaseAge = 259200`) only to satisfy the monorepo AGENTS.md rule; commit `package-lock.json`
- One screen:
  - **Stage** — the live surface, rendered by `A2uiSurface` from `@a2ui/react/v0_9`
  - **Transport** — play, pause, step forward, step back, restart, and speed (0.5×, 1×, 2×, 4×)
  - **Stream** — a side panel. Each fixture message is listed; messages already applied are readable JSON, the current one is highlighted, later ones stay pending
  - **Scenario switch** — “Work order” and “Showing request”. Switching resets the processor
- Fixtures are hand-written v0.9 envelopes in `src/fixtures/` (not a live model). Two scripts, each long enough that play visibly builds the screen:
  1. **Work order** — `createSurface` → column shell → `PropertyBanner` → issue and area `TextField`s → `PriorityMark` → notes → file `Button` → a filed confirmation via later `updateDataModel` / `updateComponents`
  2. **Showing request** — banner → prospect fields → three custom `SlotCard`s → a selected slot in the data model → confirm copy
- Catalog: one app catalog, id `https://cypresscommand.example/a2ui/property-ops/v0.9`, built from the published basic catalog (`Column`, `Text`, `TextField`, `Button`, `Card`, `Divider`) plus three custom React components (`PropertyBanner`, `PriorityMark`, `SlotCard`) registered with `createComponentImplementation`. Bindings use v0.9 `{ "path": "/…" }`
- All names, addresses, and record ids are invented (Harbor Elm Court, Maple Row Lofts). No Orange Ocean, On The Boulevard, or live tenant data. The chrome says **Cypress Command** and uses an ink / cypress-green palette
- Optional **live stub**: `.env.example` documents `VITE_A2UI_LIVE_AGENT_KEY`. Empty or absent → the control stays off and says fixtures only. Any non-empty value enables an in-browser stub that turns the typed prompt into another recorded stream. It does not call a model or the network
- README (npm-first, A2UI credit, Apache-2.0 link), oxlint, `node --test` for message-shape checks, playback cursor math, and the live-stub gate

## Explicitly out
- A real model, API key, WebSocket, or A2A / AG-UI transport
- v1.0 wire format. `@a2ui/react@0.15` exposes the React renderer and `createComponentImplementation` on `v0_9` and has no `./v1_0` export. v1.0 is the spec’s newer envelope (`@path`); this demo follows the React package’s documented path
- Auth, multi-user, persistence, hosting
- Sibling apps, root lockfiles, `AGENTS.md`, `tracking/`, a new repository
- Bun as a runtime requirement
- Orange Ocean / OTB naming, colors, or records

## Outcome-oriented tasks
1. **Plan.** This file, before app code
2. **Scaffold.** `npm create vite@latest . -- --template react-ts` inside `apps/a2ui-surfaces/`. `bunfig.toml` before install. `npx shadcn@latest init` (radix-nova, neutral, Geist — match agent-desktop-xray). Copy the sibling `.gitignore` and `.oxlintrc.json`. `npm install` plus `@a2ui/react`, `@a2ui/web_core`, and `zod`
3. **Fixtures + pure helpers.** Typed v0.9 messages. Tests: exactly one envelope key, shared `surfaceId`, a `root` component, playback step/back/speed, live stub stays off without a key and never emits a URL
4. **Player, end to end.** `MessageProcessor` fed one message per step. Play uses a timer. Step back rebuilds the processor and reapplies the prefix (A2UI updates are not reversible). `injectBasicCatalogStyles()` plus Cypress Command `--a2ui-color-primary`
5. **Live stub panel.** Reads `import.meta.env.VITE_A2UI_LIVE_AGENT_KEY` only. Enabled path replays `buildLiveStub(prompt)` through the same player
6. **README + PR.** npm quickstart. One PR touching only `apps/a2ui-surfaces/`, with at least one screenshot (work order mid-stream, message panel visible) and one short video (play the work order through the filed state, switch to the showing request, step until a slot is selected)

## Stack
- **Vite + React + TypeScript (npm):** same shape as agent-desktop-xray / rea-xray; runs on Node 24 without Bun
- **`@a2ui/react` + `@a2ui/web_core` (0.15, v0.9 entry):** the official renderer and processor. Custom catalog instead of a hand-rolled component tree
- **shadcn/ui (minimalist):** button, card, badge, tabs, scroll-area, separator — chrome only. The surface itself is A2UI
- **oxlint + Node test runner:** match siblings; no Vitest

## A2UI facts the fixtures must get right (`@a2ui/react@0.15` README, a2ui.org v0.9 messages)
- Each message is one JSON object with `version: "v0.9"` and exactly one of `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`
- `createSurface` comes before components or data for that `surfaceId`. `surfaceId` is unique for the processor’s life; reset means a new `MessageProcessor`
- The component list is a flat adjacency list. One component has `id: "root"`
- Data bindings are `{ "path": "/pointer" }`, not the v1.0 `{ "@path": "…" }` form
- `catalogId` on `createSurface` must be the id of a catalog passed to `MessageProcessor`
- Custom components omit envelope fields (`id`, `component`) from their Zod schema. Dynamic props use `CommonSchemas`
- The basic catalog widgets are custom elements. Call `injectBasicCatalogStyles()` once

## Deferred
- v1.0 envelopes if a later `@a2ui/react` ships a `v1_0` renderer entry
- A real agent behind the stub (SSE or A2A). The key name can stay
- Editing fixtures in the UI
- Cloudflare Pages

## Acceptance
- From `apps/a2ui-surfaces/` with no `.env`: `npm install && npm run dev` opens the player. Play on Work order builds a form and ends on a filed confirmation. Showing request ends with a selected slot. The side panel shows each message as it is applied
- With no key, Live stub is visibly off. With `VITE_A2UI_LIVE_AGENT_KEY` set to any non-empty string, Send replays a canned stream that includes the prompt text and does not call the network
- `npm test` and `npm run build` pass
- `package-lock.json` and `bunfig.toml` are committed. **Nothing outside `apps/a2ui-surfaces/` changes**
- The PR includes **at least one screenshot and one short demo video** of the running app
- README credits A2UI (Apache-2.0, https://github.com/a2ui-project/a2ui, https://a2ui.org) and states this is a fixture replay, not a fork and not a live agent
