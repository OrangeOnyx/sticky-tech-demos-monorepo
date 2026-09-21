# /qa — Notifications v1

**Specialist:** QA Lead  
**Target:** fixture board at `http://localhost:5173`  
**Note:** This demo does **not** drive a real browser QA agent. The steps below are a recorded walkthrough you can repeat by hand.

## Setup

1. `bun install && bun run dev` from `apps/gstack-sprint-board/`
2. Hard refresh so `/fixtures/notifications-v1/*.md` are current
3. Confirm the feature card sits in **/office-hours** (active)

## Cases

| # | Steps | Expected |
| --- | --- | --- |
| 1 | Load app | 7 columns. Stage 1 of 7. Badge on office-hours = active |
| 2 | Click **Advance** | Card moves to `/plan-ceo-review`. Previous column = done |
| 3 | Click a **done** column | Drawer opens with that stage’s full markdown |
| 4 | Click a **pending** column | Drawer still opens (fixtures exist; status stays pending) |
| 5 | Click **Autoplay once** | Remaining stages advance ~1.2s apart, then stop at Shipped |
| 6 | Autoplay again | Button stays disabled until **Reset** |
| 7 | **Reset** | Cursor back to office-hours. Autoplay re-enabled |
| 8 | Advance through `/ship` | Progress reads **Shipped**. All columns done |
| 9 | Open `/qa` transcript | This file. Mentions fixture mode, not Aside/Claude |

## Bugs filed (fixture)

- **B1** Drawer width felt like a phone pane on desktop — set `sm:max-w-2xl`.
- **B2** Pending columns looked empty; they now show a muted artifact teaser.

## Re-verify

Cases 1–9 pass in fixture mode. No Anthropic key. No real mailer. No `/browse`.
