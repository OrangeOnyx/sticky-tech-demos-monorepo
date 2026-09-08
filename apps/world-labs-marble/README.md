# World Labs Marble — On The Boulevard

Single-user demo of the Marble World API for **On The Boulevard Shopping Center** (Belle Realty / OTB) at 101–149 Arnould Blvd, Lafayette, LA.

Windows / Node (no Bun):

```bash
cd apps/world-labs-marble
npm install
npm run dev:node
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The API listens on `127.0.0.1:3001`. `npm run dev` is the same Node path. Vite exits if `5173` is occupied.

Bun is optional (`bun install && bun run dev:bun`).

This unauthenticated playground is local-only, including fixture mode. Do not expose it through `--host`, port forwarding, or a public reverse proxy. Remote access requires a separate authenticated design. API requests from foreign Host/Origin headers are rejected; the UI uses the same-origin Vite proxy.

The form prefills the OTB prompt plus Marble’s three-image set. Those slots are **real photographs** of the strip from Adam’s Nov 2020 Dropbox pack (`On The Boulevard 53.jpg` through `99.jpg`), not Atlas or Drive stand-ins:

| Slot | Dropbox original | Bundled file |
| --- | --- | --- |
| 1. Elevated golden-hour strip | `On The Boulevard 53.jpg` | `public/otb/otb-dropbox-53.jpg` |
| 2. Politics boutique interior | `On The Boulevard 70.jpg` | `public/otb/otb-dropbox-70.jpg` |
| 3. Pink Paisley mezzanine interior | `On The Boulevard 80.jpg` | `public/otb/otb-dropbox-80.jpg` |

The viewer empty state also shows three more stills from the same pack (60, 90, 99) under `public/otb/otb-dropbox-*.jpg`. Marble accepts at most three images, so generate uses 53 + 70 + 80. The ~550MB drone clip `Drone Footage RAW/DJI_0030.MOV` lives in that Dropbox folder and is **not** in git.

Secondary CAD/sat copies remain at `public/otb/floorplan-center.png` and `public/otb/OTB-sat-base.jpg` if you want to swap them in the form. They are not the default seeds.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | `WLT_API_KEY` is missing | UI still runs. Generate starts a local mock job, polls until ready (~4.5s), and opens an L-shaped OTB stand-in textured from the Nov 2020 stills (cream fascia, white columns, aqua walkway, brown shingles). |
| **Live** | `WLT_API_KEY` is set | The API server calls `https://api.worldlabs.ai/marble/v1` with the `WLT-Api-Key` header. The browser never sees the key. When an SPZ URL is returned, Spark renders it; otherwise you get thumbnail/pano plus an Open in Marble link. |

`npm install && npm run dev:node` is enough to see the page. Fixture mode is the default in this repo because no key is committed. Copy `.env.example` to `.env` and set `WLT_API_KEY` for live Marble — Node loads that file (Bun auto-loads `.env`; this app also loads it under `tsx`).

## Environment

Copy `.env.example` to `.env` in this folder.

| Variable | Required | Notes |
| --- | --- | --- |
| `WLT_API_KEY` | Live only | Server-side World Labs key. Header name is `WLT-Api-Key`. Never expose it to the browser. |
| `MARBLE_API_BASE` | No | Defaults to `https://api.worldlabs.ai/marble/v1`. |
| `PORT` | No | API port and Vite proxy target. Missing/blank defaults to `3001`; otherwise use an integer from `1` to `65535`. Set it in this folder’s `.env` or the shell (shell takes precedence). |

Get a key from the [World Labs Platform](https://platform.worldlabs.ai/). Live generation uses credits.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `npm run dev:node` | Vite UI + Node API together (`tsx`, no Bun) |
| `npm run dev:api` | API only (`tsx server/index.ts`) |
| `npm run dev:ui` | Vite only (loopback) |
| `npm test` | `node:test` via `tsx` (no Bun) |
| `bun run dev:bun` | Optional Bun spawn of API + Vite |

## Stack

Vite + React + shadcn/ui, Node (`tsx`) or optional Bun, Three.js, `@sparkjsdev/spark`. Official Marble samples are vanilla HTML; this demo stays on Vite because there is no Next-only SDK requirement.

Out of scope: Atlas / multi-camera, auth, game engine, Cloudflare Pages.
