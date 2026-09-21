# /ship — Notifications v1

**Specialist:** Release Engineer  
**Fixture result:** ready to open the demo PR

## Preflight

- `bun test` — pipeline cursor + fixture files present
- `bun run build` — Vite production build
- `bun run lint` — oxlint
- No `.env`. No Anthropic key. No Claude Code install.

## Coverage of the demo contract

| Promise | Evidence |
| --- | --- |
| Stages pipeline | office-hours → plan-ceo-review → plan-eng-review → plan-design-review → review → qa → ship |
| Status | pending / active / done derived from cursor |
| Feature | Notifications v1 card moves on Advance / Autoplay |
| Transcripts | `public/fixtures/notifications-v1/*.md` |
| bunfig | `[install] minimumReleaseAge = 259200` |
| Credit | README → [garrytan/gstack](https://github.com/garrytan/gstack) MIT |

## Test delta (fixture)

```
bun test
  pipeline cursor
  fixtures
  2 pass
```

Not a real coverage gate. `/ship` in live gstack would bootstrap a runner if none existed.

## PR body (this demo)

Single-user sprint board that walks Garry Tan’s gstack specialist flow with fixture transcripts only.

Attach **screenshot** of the board mid-pipeline and a **video** of Advance + drawer + Autoplay.

## Done

Notifications v1 is shipped as a story. The virtual team clocked out. If you want the real specialists, install gstack — this app will not do it for you.
