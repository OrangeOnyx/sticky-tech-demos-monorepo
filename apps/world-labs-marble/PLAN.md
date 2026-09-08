# PLAN — world-labs-marble

## Goal
Single-user playground that turns a text prompt and/or 1–3 images into a Marble world of **On The Boulevard Shopping Center** (101–149 Arnould Blvd, Lafayette LA) via the World API, then shows poll status and an in-browser viewer.

## Single-user MVP
- One page: text prompt, optional image uploads (1–3), generate, poll until ready
- Bun server calls `https://api.worldlabs.ai/marble/v1` with `WLT-Api-Key`; the browser never sees the key
- In-browser viewer: Spark splat viewer when an SPZ URL exists; otherwise Marble open-link + thumbnail/pano + status
- Env: `WLT_API_KEY` for live Marble; **fixture/demo mode** when missing so `bun install && bun run dev` still runs the full flow with a mock job and sample world
- Default generate payload: OTB prompt + three images (whole-center floor plan, nadir aerial, isometric look) mapped to Drive `00 OTB`
- Self-contained under `apps/world-labs-marble/`

## Explicitly out of scope
- Atlas early-access / multi-camera pipeline
- Multi-user auth, accounts, billing
- Full game engine / physics
- New GitHub repository (this monorepo folder only)
- Cloudflare Pages deploy
- Sibling apps, `AGENTS.md`, tracking

## Outcome-oriented tasks
1. Scaffold Vite + React + `bunfig.toml` (`minimumReleaseAge = 259200`) + shadcn minimal UI
2. Bun API: generate → poll operation → fetch world; fixture store when no key
3. Playground UI: prompt + uploads, job status, viewer / open-result
4. README: env vars, fixture vs live, `bun run dev`
5. Validation: screenshot + video of the running fixture flow for the PR

## Stack (one-line rationale)
- **Bun** — monorepo default runtime/PM
- **Vite + React** — one-screen playground; Marble has no Next-only SDK requirement
- **shadcn/ui** — minimalist form, badges, status
- **World Labs Marble World API** — generate + operations poll
- **Three.js + Spark** — official in-browser Gaussian splat viewer when SPZ assets exist; fixture uses a local sample scene

## Deferred
- Atlas / video / panorama-specific pipelines
- Durable Cloudflare Pages preview
- Auth / saved world library
- Mesh export / game-engine integration
