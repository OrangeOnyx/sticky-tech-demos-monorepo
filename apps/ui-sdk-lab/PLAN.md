# PLAN — ui-sdk-lab

## Goal

A single-user leasing desk: schedule a showing and assign a unit. The form is built from [Vercel UI SDK](https://ui-sdk.dev) headless behaviors. A side panel shows the live `createAgent()` snapshot and a scripted agent that fills the form with `agent.act()`, one step at a time. No model and no API key.

This is a web form plus the UI SDK bridge. It does not browse desktop accessibility trees, copy `agent-desktop` CLI lines, or replay `STALE_REF`. That is a different demo.

## Single-user MVP

- Vite + React + TypeScript under `apps/ui-sdk-lab/` only, in `OrangeOnyx/sticky-tech-demos-monorepo`.
- `npm install && npm run dev` → http://127.0.0.1:5173. **npm only.** Adam has no Bun. Node 24 is the documented runtime (`.nvmrc` is `24`). Vite also runs on this repo's Node 22. Keep `bunfig.toml` (`[install] minimumReleaseAge = 259200`) so the monorepo rule is satisfied. Commit `package-lock.json`.
- Pin `@ui-sdk/react` and `@ui-sdk/core` to **`0.1.0-beta.13`** (exact, no caret). That is the `latest` dist-tag on 2026-11-23. `beta` is `0.1.0-beta.14` (published 2026-11-21), which is younger than the 3-day release-age window, so it stays unpinned.
- One screen, two columns:
  1. **Showing form** for the invented desk **Cypress Command**. Paper / Ink / Terra / Olive only. The words "Orange Ocean" never appear.
  2. **Agent panel** — live JSON from `agent.snapshot()`, the last `act` result, and Play / Step / Reset. The script is hard-coded. It calls the same bridge the [connect-an-agent guide](https://ui-sdk.dev/docs/agents/connect-an-agent/guide) uses from the console: `snapshot()`, then `act({ steps: [{ ref, action, args }] })`.
- Controls, all labeled for people and for the bridge:
  - **Unit** — typeahead picker (Combobox: popup + selection + typeahead). Invented units, filter by typing, choose one.
  - **Showing type** — Select (In person, Video tour, Self-guided).
  - **Date** — Date Picker popup. Type a date or pick a day.
  - **Guest** — text Input.
  - **Tour stops** — drag-to-reorder list built with `createReorder` from `@ui-sdk/core`, plus a keyboard move (the behavior's own key alternative). An `agent` key exposes `moveStop` so the script can reorder without a pointer.
- `createAgent()` is imported in `src/agent.ts` before `createRoot`, and assigned to `window.agent`, matching the guide. The panel is the scripted stand-in for the console. WebMCP / ChatGPT registration is out of scope.
- Fixtures in `src/fixtures/units.ts`: five invented units (name, id, building, beds). No real addresses, no tenant PII, no live listings.
- README (npm-first, Node 24, UI SDK credit, Cypress Command palette, what this demo is not). oxlint. Vitest in jsdom for the agent bridge (the UI SDK skill's required agent test) plus the reorder primitive and the script plan.
- A one-line note in the header: sample data, UI SDK beta `0.1.0-beta.13`.

## Explicitly out

- A language model, AI Gateway, or any API key
- WebMCP, `registerTools`, and ChatGPT site tools
- Desktop accessibility trees, `agent-desktop` CLI commands, `STALE_REF` replays
- The name Orange Ocean, OTB data, or that product's screens
- Auth, multi-user, persistence, a backend
- Sibling apps, root lockfile, root `AGENTS.md`, `tracking/`, a new repository
- Bun as a runtime requirement
- shadcn/ui. UI SDK parts are unstyled on purpose; a second component kit would hide the behaviors. Chrome is plain CSS in the Cypress Command palette.

## How this differs from agent-desktop-xray

| | agent-desktop-xray | ui-sdk-lab |
| --- | --- | --- |
| Subject | Sample OS accessibility-tree JSON | A live web form |
| Library | None (fixtures shaped like agent-desktop v2.6) | `@ui-sdk/react` + `@ui-sdk/core` |
| Agent loop | Recorded CLI envelopes, including a stale ref | `createAgent().snapshot()` and `act()` against components on the page |
| Interaction | Pick a tree node, copy a command | Typeahead, select, date popup, drag-to-reorder, then watch a script fill them |

## Outcome-oriented tasks

1. **Plan.** This file, committed before the scaffold.
2. **Scaffold.** `npm create vite@latest . -- --template react-ts` inside `apps/ui-sdk-lab/`. Add `bunfig.toml` before any install. Pin `@ui-sdk/react@0.1.0-beta.13` and `@ui-sdk/core@0.1.0-beta.13`. Read `node_modules/@ui-sdk/react/docs/llms.txt` and the Combobox, Select, Date Picker, and `createReorder` pages in the installed docs before writing components. Confirm each `act` action name from those docs (`setValue` on Select, Combobox, Input, Date Picker; `moveStop` on the reorder primitive).
3. **Form, empty and usable by hand.** Unit typeahead, showing-type select, date popup, guest input, reorderable stops. Keyboard: type to filter units, arrows in the lists, Escape closes popups, and stops move without a pointer. Visible labels. Focus ring in Ink.
4. **Agent panel.** Snapshot refreshes after each human change and each script step. Play runs the script with a short pause. Step runs the next act. Reset restores the empty form and step 0. If a step's `ok` is false, the panel shows `result.error` and Play stops.
5. **README + checks.** `npm test` (Vitest), `npm run lint`, `npm run build`. One PR that only touches `apps/ui-sdk-lab/`, with one screenshot (form filled, snapshot visible) and one short video (Play or Step through the script, then Reset).

## Stack

- **Vite + React 19 + TypeScript, npm:** same shape as agent-desktop-xray / rea-xray. UI SDK requires React 19.
- **`@ui-sdk/react@0.1.0-beta.13` and `@ui-sdk/core@0.1.0-beta.13`:** unstyled behaviors and the agent bridge. Pinned so a later beta cannot change `act` under us. Beta.13 is also old enough for `minimumReleaseAge`.
- **Plain CSS:** Cypress Command tokens — Paper `#F3EFE6`, surface `#FAF8F3`, Ink `#141A17`, secondary `#434A45`, muted `#5E6660`, Olive `#1F5138`, Terra `#A83323`. No orange brand color.
- **Vitest + jsdom + oxlint:** the UI SDK skill asks for an agent test in jsdom. Keyboard reorder is tested with `@ui-sdk/core/testing`. The browser still checks popups.

## Script (invented)

Starts empty: no unit, showing type unset, no date, guest blank, stops in fixture order (Meet at lobby, Walk the unit, Roof deck, Keys).

1. Unit → `kiln-12` (label "Kiln 12")
2. Showing type → `in-person` (label "In person")
3. Date → `2026-12-04`
4. Guest → `Mina Cho`
5. Move stop `keys` to index 1 (after the lobby, before the walk)

Refs are the accessible labels: "Unit", "Showing type", "Showing date", "Guest", "Tour stops". Args are confirmed against the installed package before they are hard-coded.

## Deferred

- WebMCP so a browser agent can drive the same form
- `allow` permissions and `data-agent-secret` (nothing here is secret)
- Multi-unit tours, conflict checks, a real calendar feed
- Cloudflare Pages. The static build can be hosted later; this MVP is local.

## Acceptance

- From `apps/ui-sdk-lab/` with no `.env`: `npm install && npm run dev` opens the form. A person can pick a unit by typing, choose a showing type, open the date popup, and reorder stops with a pointer and with the keyboard.
- Play fills every field in order. The snapshot panel shows the same values. Reset clears them. Step does one act per press.
- `npm test` and `npm run build` pass. `npm run lint` passes.
- `package-lock.json` and `bunfig.toml` are committed. Nothing outside `apps/ui-sdk-lab/` changes.
- Copy says Cypress Command. It never says Orange Ocean.
- Fixtures are invented.
- The PR body has at least one screenshot and one short video of the running app.
- README credits Vercel Labs UI SDK (beta), links https://github.com/vercel-labs/ui and https://ui-sdk.dev/docs/agents/connect-an-agent, and says this demo is not a fork.
