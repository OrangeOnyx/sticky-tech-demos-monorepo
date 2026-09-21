# /review — Notifications v1

**Specialist:** Staff Engineer  
**Branch:** `cursor/gstack-sprint-board` (fixture)  
**CI:** green. Production-shaped bugs below.

## AUTO-FIXED

1. **Idempotency key missing on outbox insert.** Two advances in a StrictMode double-invoke would insert two emails. Added `(feature_id, from_stage, to_stage)` unique index.
2. **Unread badge used `count++` in render.** Moved to derived `inbox.filter(r => r.unreadAt).length`.

## ASK (would need a human in a live run)

**Race:** tab A marks read, tab B still has the event as unread and a click re-opens as unread, then SSE flips it. Harmless visually, but the read receipt timestamp jumps. Recommended fix: compare `updatedAt` and ignore stale payloads. **Fixture records the issue; does not patch production.**

## Completeness gaps

- No retry UI for `email_outbox.status = failed`. Acceptable for HOLD SCOPE.
- No `/cso` pass. Do not interpolate user text into email HTML.
- Autoplay “once” flag lived in `localStorage` in an early sketch — dropped. Reset should be allowed to autoplay again in a demo.

## Advisory simplification

The SSE helper is a 40-line EventSource wrapper. Do not introduce a realtime framework for one unread bit.

**Verdict:** ship the board demo. The notification *platform* is still a fixture story, which is the point of this app.
