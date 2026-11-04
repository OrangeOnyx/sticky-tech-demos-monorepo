# Agent Desktop X-ray

A single-user viewer for **sample** accessibility-tree snapshots in the shape returned by [Vercel Labs agent-desktop](https://github.com/vercel-labs/agent-desktop). Pick a node, copy a snapshot-qualified CLI command, and step through an observe → act → verify replay that hits `STALE_REF` and then recovers.

This is a sample-data demo, not a fork. It does not vendor the agent-desktop binary, does not capture a real desktop, and does not need a `.env` file.

agent-desktop is a Vercel Labs project, licensed under [Apache-2.0](https://github.com/vercel-labs/agent-desktop/blob/main/LICENSE). Refs and the JSON envelope follow [Snapshots and refs](https://agent-browser.dev/desktop/snapshots-and-refs).

```bash
cd apps/agent-desktop-xray
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Node 22 or newer is required for `npm test` (the Node test runner strips TypeScript). npm is the way to install and run this app.

## What you can do

1. **Tree** — switch among invented DemoNotes snapshots (`version: "2.6"`). Select a node. The command panel shows `agent-desktop click '@<snapshot_id>:eN'` or, for a text field, `agent-desktop set-value`. A bare `@eN` is never suggested (`INVALID_ARGS`). Arrow keys move among nodes that have a ref while the tree is focused.
2. **Replay** — five recorded steps: snapshot, click New note, snapshot again, a stale `set-value` from the first snapshot, then a recovery snapshot whose Body ref actually matches. The error card shows `STALE_REF`.

## Samples vs a local bridge

| Path | Needs | What you get |
| --- | --- | --- |
| **Samples** | `npm install && npm run dev`. No `.env`, no `agent-desktop` binary. | The Tree and Replay tabs, using fixtures in `src/fixtures/demo-notes.ts`. |
| **Bridge** | Not shipped. Optional later: `AGENT_DESKTOP_BRIDGE=1` and `GET /api/bridge/status` on your machine. | Would only report whether `agent-desktop` is on `PATH`. The UI stays on “Bridge off — samples only.” Driving a real desktop needs the OS accessibility permission and is out of scope here. |

See `.env.example`. The happy path never starts a server.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 |
| `npm test` | Ref formatting, bare-ref rejection, and `STALE_REF` detection |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

`bunfig.toml` is here so the monorepo install rule is satisfied. You do not need Bun to run this app. `package-lock.json` is the lockfile.
