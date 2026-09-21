# PLAN — gstack-sprint-board

## Goal
Single-user sprint board that walks Garry Tan’s `garrytan/gstack` specialist flow with fixture transcripts: office-hours → plan reviews → review → qa → ship (no Claude Code install required in fixture mode).

## Single-user MVP
- Board/timeline of gstack stages as columns or a vertical pipeline:
  `/office-hours` → `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review` → `/review` → `/qa` → `/ship`
- Each stage shows a fixture transcript / artifact card (markdown snippets that feel like real specialist output)
- Click “Advance” (or autoplay once) to move a sample feature through the pipeline
- Optional: expand a stage to read the full fixture transcript
- Self-contained under `apps/gstack-sprint-board/`: `bun install && bun run dev`
- README credits `garrytan/gstack` (MIT) and lists the demo stages (not all 23 skills)
- PR must attach **screenshot AND video** of the running app

## Explicitly out of scope
- Installing or wrapping real Claude Code / gstack `./setup`
- Real browser QA / Aside browser / Anthropic API (fixture only; optional live hook later)
- Touching sibling apps
- New GitHub repository
- Full 23-skill catalog UI

## Outcome-oriented tasks
1. Scaffold Vite+React+TS + `bunfig.toml` (`minimumReleaseAge = 259200`) + minimal shadcn chrome
2. Define fixture feature (“Notifications v1”) + per-stage transcript MD under `public/fixtures/`
3. Pipeline board UI with stage status (pending / active / done) + advance control
4. Stage detail drawer with transcript
5. README + run; PR with screenshot + video

## Stack
- **Bun** — monorepo default
- **Vite + React + TS + shadcn** — board UI
- **Static fixtures** — no API keys

## Deferred
- Live Anthropic / Claude Code bridge
- All 23 skills as selectable personas
- Export plan as downloadable MD
