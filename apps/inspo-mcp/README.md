# Inspo MCP

Single-user playground for [Inspo](https://inspomcp.dev), Hassan’s free no-auth archive of production sites. Type a UI brief and read exemplar screens, a palette, and a DESIGN.md snippet.

```bash
cd apps/inspo-mcp
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Fixture mode is the default. It needs no API key, no `.env` file, and no network.

Node 22 or newer is required (`npm run dev` starts a small API with Node's TypeScript stripper). Bun is optional. This app is meant to run with npm on Windows.

## Try it — fixture

1. `npm install` then `npm run dev` in this folder.
2. Open http://127.0.0.1:5173. The page studies the dark SaaS pricing brief on its own.
3. Leave the toggle on **Fixture**.
4. Press **Dark SaaS pricing** and **Study**. You should see Dovetail, Frame, and n8n thumbs, a blue and peach palette, Inter type, and a DESIGN.md.
5. Press **Editorial magazine** and **Study**. The top screen is Eye Magazine, set in Georgia.
6. Press **Uncatalogued brief** and **Study**. Fixture mode has no snapshot for that brief, so the study is empty.

Local thumbs live in `public/fixtures/thumbs/`. They are small copies of Inspo’s public captures so the page works offline. The sites remain their designers’ work.

Check the API:

```bash
curl http://127.0.0.1:3001/api/health
```

`ok` is true when the local server is up. `fixtureDefault` stays true. `endpoint` is the MCP URL live mode will call.

## Try it — live

Live mode is optional. Inspo’s hosted MCP is public and needs no key. The browser talks only to the local API. The API calls Streamable HTTP at `https://inspomcp.dev/api/mcp` (JSON-RPC `tools/call`, protocol `2025-06-18`).

1. Start `npm run dev` (no `.env` required).
2. Switch the toggle to **Live** and press **Study**.
3. The server calls `recommend` with your brief, then `get_design_system` for the top exemplar slug.

`get_design_system` uses `live: false` by default, which is the captured DESIGN.md and does not fetch the source site. To ask Inspo to supplement tokens from the live site, copy `.env.example` to `.env`, set `INSPO_DESIGN_LIVE=true`, and restart. Optional `INSPO_MCP_URL` overrides the endpoint. Do not commit `.env`. There is no secret to put in it.

The local API listens on `127.0.0.1:3001`. Vite proxies `/api` so the page stays on port 5173.

## Bun

The monorepo convention is Bun. This app includes `bunfig.toml` with `minimumReleaseAge = 259200`. If Bun is installed:

```bash
bun install
bun run dev
```

`bun run dev` still launches the Node API and Vite. npm is the path to use when Bun is not installed. `package-lock.json` is committed for that.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 plus the Inspo API |
| `npm test` | Fixture matching, DESIGN.md parsing, and the live request shape (no network) |
| `npm run build` | Typecheck and production client build |
| `npm run lint` | oxlint |

## What the study calls

| Tool | When |
| --- | --- |
| `recommend` | Every live study. Plain-English brief in, macrostructure, exemplars, palette out. |
| `get_design_system` | After recommend, on the first exemplar slug. Fonts, ranked palette, type ramp, spacing. |

Fixture mode returns committed snapshots of those two calls for the sample briefs, and an empty study otherwise. Screen pages are `https://inspomcp.dev/screens/<slug>`. DESIGN.md pages are `https://inspomcp.dev/d/<slug>/DESIGN.md`.

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova), Tailwind v4, a Node HTTP server. `cn` is local (`clsx` + `tailwind-merge`).
