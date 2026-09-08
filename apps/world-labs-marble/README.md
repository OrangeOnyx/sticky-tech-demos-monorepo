# World Labs Marble — On The Boulevard

Single-user demo of the Marble World API for **On The Boulevard Shopping Center** (Belle Realty / OTB) at 101–149 Arnould Blvd, Lafayette, LA.

```bash
cd apps/world-labs-marble
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The Bun API listens on port `3001`.

The form prefills the OTB prompt plus Marble’s three-image set. Those slots map to Drive `G:\My Drive\00 OTB`:

| Slot | Drive original | Bundled file |
| --- | --- | --- |
| 1. Whole-center floor plan | `Floor Plan Whole Center Final.png` | `public/otb/floorplan-center.png` |
| 2. Georef nadir aerial | `georef-fit-nadir.png` | `public/otb/OTB-sat-base.jpg` |
| 3. Target look / massing | `Belle Realty SOT Documents/Style I would like to get the center to look like for marketing.png` | `public/otb/spatial-isometric.png` |

Floor plan and nadir are the otb-command public copies of this property (`public/floorplan-center.png`, `public/OTB-sat-base.jpg`). Slot 3 is the Atlas spatial isometric of the same L-shaped strip (otb-command `public/manual/img/spatial.png`) so Marble still gets a 3D massing cue; the default **text prompt** carries the Mediterranean / Mission marketing look (peach stucco, clay tile, palms). Drop the live Drive PNGs over those paths (or swap them in the form) when they are on disk. `drone.png` from the same Drive folder is optional and not in the default 1–3 set.

CAD layout lives in otb-command at `cad/Boulev_CLEAN.dxf`. Marble does not ingest DXF; this demo uses the floor-plan PNG instead.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | `WLT_API_KEY` is missing | UI still runs. Generate starts a local mock job, polls until ready (~4.5s), and opens an L-shaped OTB stand-in (nadir parking texture, floor-plan overlay, peach stucco / clay-tile massing). |
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
