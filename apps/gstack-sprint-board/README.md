# gstack sprint board

Single-user board that walks Garry Tan’s [gstack](https://github.com/garrytan/gstack) specialist flow using **fixture transcripts only**. No Claude Code install, no Anthropic key, no live browser QA.

```bash
cd apps/gstack-sprint-board
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). Click **Advance** to move **Notifications v1** through the pipeline, or **Autoplay once**. Click a column (or a command in the timeline) to read that stage’s markdown.

`bunfig.toml` sets `minimumReleaseAge = 259200` so installs wait three days after a package is published.

## Demo stages

This app shows seven gstack slash commands, not the full 23-skill catalog:

| Stage | Specialist |
| --- | --- |
| `/office-hours` | YC Office Hours |
| `/plan-ceo-review` | CEO / Founder |
| `/plan-eng-review` | Eng Manager |
| `/plan-design-review` | Senior Designer |
| `/review` | Staff Engineer |
| `/qa` | QA Lead |
| `/ship` | Release Engineer |

Transcripts live in `public/fixtures/notifications-v1/`.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Vite on port 5173 (`--host`) |
| `bun run build` | Production client build |
| `bun test` | Pipeline cursor + fixture file checks |
| `bun run lint` | oxlint |

## Credit

Skill names, specialist roles, and the Think → Plan → Review → Test → Ship ordering come from [garrytan/gstack](https://github.com/garrytan/gstack), MIT License. This folder is a sticky demo of that process, not a wrapper around `./setup`.

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova), Tailwind v4, Bun.
