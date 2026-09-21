# /plan-design-review — Notifications v1

**Specialist:** Senior Designer  
**Audit:** plan artifacts, not a live UI pass

## Dimension scores (now → what a 10 looks like)

| Dimension | Now | 10 |
| --- | --- | --- |
| Hierarchy | 4 | One number, one sentence, one action. |
| Empty state | 3 | Empty is a promise: “When a stage moves, it shows up here.” |
| Unread | 5 | Count is honest. Zero hides the badge. Never `99+` in v1. |
| Density | 6 | 20 rows, 14px, no avatars-for-decoration. |
| Motion | 4 | Advance moves the card. Do not bounce the badge. |
| AI slop | 2 | Gradient bells, glassmorphism, “Stay in the loop!!” copy. Kill it. |

## AI slop to delete if it appears

- Purple glow behind the bell
- Confetti on mark-as-read
- “You have notifications 🎉”
- A settings cog that opens a 19-toggle preference graveyard
- Skeleton loaders that last longer than the fetch

## Interactive choices (recorded)

1. **Badge:** numeric, hidden at 0. Not a red dot. (Approved)
2. **Row action:** the whole row opens the stage drawer. No nested “View” buttons. (Approved)
3. **Email subject:** `{object} {verb}` — “Notifications v1 advanced to /review”. No “RE: ACTION REQUIRED”. (Approved)

## Plan edits

- Inbox empty state copy is part of the MVP, not polish.
- Autoplay may not spam 7 emails. Fixture mode logs them. Live mode would debounce to the last stage of a burst.
- Drawer transcript is the artifact; do not restyle markdown into a marketing page.
