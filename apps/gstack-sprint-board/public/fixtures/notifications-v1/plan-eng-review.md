# /plan-eng-review — Notifications v1

**Specialist:** Eng Manager  
**Reads:** CEO plan (HOLD SCOPE + mark-as-read sync)

## Architecture

```
[board action] -> append-only events
                 -> renderer (template "object verb")
                 -> inbox rows (user_id, unread)
                 -> outbox email (idempotent on event_id)
```

No job queue in v1. A single `notifications` table plus an `email_outbox` with `status` (`pending | sent | failed`) is enough. Retry is a cron of 30 seconds, not Kafka.

## Data flow (happy path)

1. `advanceCursor` writes `feature.stage_changed`.
2. Renderer builds `{ title, body, href }` from the stage command.
3. Inbox insert is the source of truth. Email is a projection.
4. Mark-as-read is an `unread_at = null` write keyed by `(user_id, event_id)`. Broadcast via a tiny SSE stream, not sockets.

## Edge cases forced into the open

- Double-advance during autoplay: events must be idempotent on `(feature_id, from_stage, to_stage)`.
- User has no email: inbox still writes; outbox row stays `failed` with a visible reason.
- Clerk/session missing: no send. Never notify “anonymous.”
- Mark-as-read race: last write wins on `unread_at`. Do not toggle.

## Test matrix

| Case | Expect |
| --- | --- |
| Advance 0→1 | 1 inbox row, 1 outbox pending |
| Replay same advance | 0 extra rows |
| Mark read twice | still read |
| Fixture mode | **no network mailer** — write a local JSONL log instead |

**Security:** templates are code, not user HTML. No markdown-in-email until `/cso` says otherwise (out of scope for this demo).
