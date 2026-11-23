# A2UI surfaces

A single-user player for **recorded** [A2UI](https://a2ui.org) message streams. Press play and watch `@a2ui/react` assemble a work-order form, then a showing-request screen, one JSON message at a time.

This is a fixture replay, not a fork and not a live agent. It does not vendor A2UI. The property names, addresses, and people are invented. The chrome is Cypress Command. It is not Orange Ocean.

A2UI is an Apache-2.0 project: [github.com/a2ui-project/a2ui](https://github.com/a2ui-project/a2ui).

```bash
cd apps/a2ui-surfaces
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Node 22 or newer is required (`engines` is `>=22`). Node 24 is the intended runtime (`.nvmrc` is `24`). npm is the way to install and run this app.

## What you can do

1. **Work order** — step or play a v0.9 stream for Harbor Elm Court. The surface grows from a title, to a custom property banner, to the issue fields, to an urgent priority mark, and ends on “Filed · Northline Mechanical has WO-1842.”
2. **Showing request** — Maple Row Lofts. Prospect fields fill in, then three custom slot cards. The afternoon window becomes selected.
3. **Stream** — the side panel lists every message. Applied messages show their JSON. Later messages stay pending until the playhead reaches them.
4. **Live stub** — off unless `VITE_A2UI_LIVE_AGENT_KEY` is set. Any non-empty value unlocks a canned reply that includes your prompt. It does not call a model or the network.

## Samples vs the stub

| Path | Needs | What you get |
| --- | --- | --- |
| **Fixtures** | `npm install && npm run dev`. No `.env`. | Both recorded streams. |
| **Live stub** | Copy `.env.example` to `.env` and set `VITE_A2UI_LIVE_AGENT_KEY` to any non-empty string. Restart `npm run dev`. | A third stream built in the browser from the text you type. |

## Catalog

The player registers one catalog, `https://cypresscommand.example/a2ui/property-ops/v0.9`. It keeps the published basic widgets (`Column`, `Text`, `TextField`, `Button`, `Divider`) and adds three React components: `PropertyBanner`, `PriorityMark`, and `SlotCard`. Bindings use the v0.9 `{ "path": "/…" }` form. `@a2ui/react@0.15` exposes this renderer on `v0_9`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 |
| `npm test` | Fixture shape, playback cursor, live-stub gate, and a `MessageProcessor` replay of each stream |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

`bunfig.toml` is here so the monorepo install rule is satisfied. You do not need Bun to run this app. `package-lock.json` is the lockfile.
