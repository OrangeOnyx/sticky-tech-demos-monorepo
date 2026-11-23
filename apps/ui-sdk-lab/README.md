# UI SDK lab

Schedule a showing and assign a unit on the Cypress Command desk. The form is built from [Vercel UI SDK](https://ui-sdk.dev) behaviors: a typeahead unit picker, a select, a date popup, and a drag-to-reorder list of tour stops. A side panel shows the live `snapshot()` and a scripted agent that fills the form with `act()`. No model and no API key.

This is a sample-data demo, not a fork. It does not vendor UI SDK source. Units, guests, and buildings are invented.

UI SDK is a Vercel Labs project in public beta, from [vercel-labs/ui](https://github.com/vercel-labs/ui). The bridge follows [Connect an agent](https://ui-sdk.dev/docs/agents/connect-an-agent).

```bash
cd apps/ui-sdk-lab
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Node 24 is the documented runtime (`.nvmrc` is `24`). Node 22.13 or newer also runs the app. npm is the way to install and run it. `package-lock.json` is the lockfile. `bunfig.toml` is here so the monorepo install rule is satisfied. You do not need Bun.

`@ui-sdk/react` and `@ui-sdk/core` are pinned to `0.1.0-beta.13`.

## What you can do

1. **By hand.** Type in Unit to filter the list. Choose a showing type. Open the calendar or type a date. Drag a tour stop, or focus one and press Space, then the arrow keys, then Space again. Escape puts a picked-up stop back.
2. **With the script.** Play runs five `agent.act()` steps: Kiln 12, In person, 4 Dec 2026, guest Mina Cho, then Keys moves to just after the lobby. Step runs one of those. Reset clears the form. The JSON is `snapshot()` of the components on the page, and the last `act` result. `window.agent` is the same bridge, if you want the console.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 |
| `npm test` | Vitest: the agent fills the form, and the stop list reorders |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

The palette is Cypress Command: Paper, Ink, Terra, and Olive.
