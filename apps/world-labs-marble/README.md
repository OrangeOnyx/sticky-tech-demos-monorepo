# World Labs Marble playground

Single-user demo of the Marble World API: text and/or 1–3 images → generate → poll the operation → in-browser viewer.

```bash
cd apps/world-labs-marble
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The Bun API listens on port `3001`.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | `WLT_API_KEY` is missing | UI still runs. Generate starts a local mock job, polls until ready (~4.5s), and opens a sample Three.js world. |
| **Live** | `WLT_API_KEY` is set | The Bun server calls `https://api.worldlabs.ai/marble/v1` with the `WLT-Api-Key` header. The browser never sees the key. When an SPZ URL is returned, Spark renders it; otherwise you get thumbnail/pano plus an Open in Marble link. |

`bun install && bun run dev` is enough to see the page. Fixture mode is the default in this repo because no key is committed.

## Environment

Copy `.env.example` to `.env` in this folder.

| Variable | Required | Notes |
| --- | --- | --- |
| `WLT_API_KEY` | Live only | Server-side World Labs key. Header name is `WLT-Api-Key`. Never expose it to the browser. |
| `MARBLE_API_BASE` | No | Defaults to `https://api.worldlabs.ai/marble/v1`. |
| `PORT` | No | Bun API port. Defaults to `3001`. |

Get a key from the [World Labs Platform](https://platform.worldlabs.ai/). Live generation uses credits.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Vite UI + Bun API together |
| `bun run build` | Production client build |
| `bun test` | Prompt, fixture-job, and env-mode tests |

## Stack

Vite + React + shadcn/ui, Bun, Three.js, `@sparkjsdev/spark`. Official Marble samples are vanilla HTML; this demo stays on Vite because there is no Next-only SDK requirement.

Out of scope: Atlas / multi-camera, auth, game engine, Cloudflare Pages.
