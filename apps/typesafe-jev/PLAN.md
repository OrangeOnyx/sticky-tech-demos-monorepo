# PLAN — typesafe-jev

## Goal
Realtime Verdict playground so Adam can see a calibrated Approve / Tweak / Skip judgment, plus fit and yes/no signals, before spending other LLM tokens.

## Single-user MVP
- Vite + React + TypeScript page under `apps/typesafe-jev/` only
- Candidate fields: title, URL, short blurb / why bookmarked
- Four sample presets: strong sticky MVP, listicle / near-miss, heavy infra, already built
- Mode toggle: Fixture (default) vs Live
- Judge posts to local `POST /api/judge`
  - Fixture returns canned answers with the same question ids as live. No env required.
  - Live calls `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer $TYPESAFE_API_KEY` and `model: "jev-latest"`. The key stays on the server.
- Questions (same ids in fixture and live):
  - `verdict` choice: `approve` | `tweak` | `skip`, rubrics for the sticky filter (single-user web MVP, self-contained under `apps/`, not listicle / prompt farm / iOS-only / GPU-local / heavy realtime / already built)
  - `sticky_fit` score: Poor / Partial / Strong sticky MVP fit
  - `needs_api_key` noul: Does building this require a third-party API key to demo meaningfully?
  - `is_near_miss` noul: Is this interesting but fails the sticky filter?
- UI: verdict badge + confidence, choice probability bars, score legend, noul gauges, raw JSON accordion, latency and token usage when live
- `.env.example` with `TYPESAFE_API_KEY=` (never a real key)
- README leads with `npm install && npm run dev` → http://127.0.0.1:5173, plus Bun notes
- Local `cn` via `clsx` + `tailwind-merge` (no npm package named `cn`)
- `package-lock.json` so npm works without Bun
- `bunfig.toml` with `[install] minimumReleaseAge = 259200`

## Explicitly out of scope
- Sibling apps, `AGENTS.md`, `tracking/`
- A new GitHub repository
- Approve ledger / AI OS vault integration
- OpenRouter, Vercel, or Cloudflare gateway paths
- Auth, multi-user, persistence beyond the session

## Outcome-oriented tasks
1. Write this plan, then scaffold Vite + React + shadcn (minimalist) with `bunfig.toml` before install
2. Shared questions + deterministic fixture judgments for the four presets and a keyword fallback
3. Node server on port 3001: fixture by default, live TypeSafe only when the key is set and the toggle says Live
4. Playground UI: presets, mode toggle, verdict, bars, gauges, raw JSON
5. README (npm first), `.env.example`, fixture tests
6. Run the app on the fixture path and attach a screenshot and a video to the PR

## Stack
- **Vite + React + TypeScript** — one screen, official Vite shape, npm scripts Adam can run without Bun
- **shadcn/ui (radix-nova, neutral)** — minimal chrome; components added for this screen only
- **Node `http` server + Vite proxy** — same split as `apps/elevenlabs-speech-engine`, so `TYPESAFE_API_KEY` never reaches the browser. Dev script is Node so `npm run dev` does not need Bun.
- **Direct TypeSafe HTTP** — `state` + `questions` → `answers`, model `jev-latest`, per https://docs.typesafe.ai/api.md
- **Bun optional** — `bunfig.toml` is present for the monorepo rule; Bun is not required to run the demo

## Deferred
- Live call in CI (no key in the repo; fixture mode is the required path)
- Durable hosting
- Saving judgments or writing back to an Approve ledger
