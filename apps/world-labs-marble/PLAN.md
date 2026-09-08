# PLAN — world-labs-marble

## Goal
Single-user MVP playground for World Labs Marble World API: turn a text prompt or a few images into a navigable 3D world and explore it in the browser.

## Single-user MVP
- One page: prompt textarea and/or drop 1–3 images
- Kick off Marble world generation via World API; poll operation until ready
- Simple in-browser viewer for the resulting world (iframe/embed/official viewer SDK if available; otherwise a clear “open result” + status UI)
- Fixture mode when `WLT_API_KEY` (or documented Marble env name) is missing — mock job + sample world so `bun install && bun run dev` still demos the flow
- Self-contained under `apps/world-labs-marble/`

## Explicitly out of scope
- Atlas early-access / multi-camera capture pipeline
- Multi-user auth, accounts, billing
- Full game engine / physics sandbox
- New GitHub repository
- Sibling apps / monorepo root churn

## Outcome-oriented tasks
1. Scaffold Vite+React+TS (or Next only if Marble SDK requires it) + `bunfig.toml` (`minimumReleaseAge = 259200`) + shadcn minimal UI
2. Client: prompt + image upload, start generation, show status/progress
3. Server (Bun): call Marble World API with key; poll; never expose key to browser
4. Viewer: render or deep-link the completed world; fixture sample when no key
5. README: env vars, fixture vs live, `bun run dev`
6. Validation: run app; attach **screenshot AND video** of running UI to the PR

## Stack
- **Bun** — monorepo default
- **Vite + React + shadcn** — single-screen playground (switch only if SDK forces Next)
- **World Labs Marble World API** — the demo subject

## Deferred
- Video-to-world input
- Atlas camera fusion
- Cloudflare Pages preview
- Sharing / permalinks
