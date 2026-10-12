# Claude Motion Explainer

```bash
cd apps/claude-motion-explainer
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Fixture mode is the default. It needs no API key and no `.env` file.

Paste a small commercial rent roll and preview a short explainer: occupancy, vacancies, upcoming expirations, and rent per square foot. The film is Remotion scene code driven by a typed spec. Nothing here calls a video model.

This app uses npm and `package-lock.json`. It does not use Bun.

Node 22 or newer is required. `npm run dev` starts Vite and a small API with Node's TypeScript stripper.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | Default. Works with `ANTHROPIC_API_KEY` unset. | `POST /api/explain` parses the roll locally and returns a spec. The browser never calls Anthropic. |
| **Live** | `ANTHROPIC_API_KEY` is set in `.env`, then the dev process is restarted. | The server calls the Anthropic Messages API with `claude-sonnet-5-5` (or `ANTHROPIC_MODEL`). Zod checks the JSON. Invalid output falls back to the same fixture-style spec. Parsed figures stay locked to the roll. |

The UI toggle picks the mode per request. A key on the server does not force live calls. The key stays in the API process. Vite does not receive it, and it is not prefixed with `VITE_`.

## Sample rolls

Three invented properties ship with the app. Tenants and figures are fake. Do not paste a real rent roll into the repo.

- Maple Court Plaza
- Riverbend Commons
- Harbor Point Retail

Expirations are counted from **Oct 12, 2026**, so the samples stay stable. A lease counts in the 3, 6, and 12 month windows when it ends on or before that horizon and on or after the as-of date. Wider windows include the shorter ones. Vacant suites are left out of the expiration counts. Monthly rent and average rent per square foot use leased area only.

CSV:

```csv
unit,tenant,sqft,rent,lease_end,status
101,Northwind Coffee,1400,4900,2027-03-31,occupied
```

Bullets:

```text
- 101, Northwind Coffee, 1400 sqft, $4,900/mo, lease end 2027-03-31, occupied
- 103, vacant, 900 sqft
```

A `# Property name` line sets the title when the property field is empty.

## Editor

The player is `@remotion/player`: play, pause, and scrub in the browser. The scene list sets duration in frames at 30fps, reorders, and hides scenes. The props panel edits words, numbers, and colors. The current frame redraws as you type. Building again replaces those edits with a new spec.

## Enable live mode

1. Copy `.env.example` to `.env` in this folder.
2. Set `ANTHROPIC_API_KEY`. Do not commit `.env`.
3. Restart `npm run dev`.
4. Switch the toggle to **Live** and press **Build explainer**.

The local API listens on `127.0.0.1:3001`. Vite proxies `/api` so the page stays on port 5173.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 plus the explainer API |
| `npm test` | Parser, fixture specs, and the explain API (no network key required) |
| `npm run build` | Typecheck and production client build |
| `npm run lint` | oxlint |

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova), Tailwind v4, Remotion Player, zod, a Node HTTP server. The Anthropic call is direct HTTP from the server.

MP4 export with `@remotion/renderer` is deferred. The in-browser player is the preview.
