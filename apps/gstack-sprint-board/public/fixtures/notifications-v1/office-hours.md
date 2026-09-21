# /office-hours — Notifications v1

**Specialist:** YC Office Hours  
**Mode:** Fixture transcript (no live Claude Code session)  
**Input:** “We need a notifications platform — in-app, email, SMS, push, Slack, plus a preference center.”

## Premise challenge

You said “notifications platform.” That is a category, not a product.

What you actually described, after the six questions:

1. **Who hurts?** Founders who ship a feature on Tuesday and spend Wednesday answering “did we tell anyone?”
2. **When does it hurt?** The hour after a deploy, when the one person who should see the change is in Slack, not in the product.
3. **What have they tried?** `console.log`, a Mailgun script, a Linear comment, a pinned Slack message.
4. **What would make them come back tomorrow?** One in-product bell they trust, plus one email they actually open.
5. **What is fake progress?** A preference center with 19 toggles and zero sends.
6. **What is the wedge?** Transactional “something happened on a thing you own.” Not a marketing engine.

## Reframe

You are not building Twilio. You are building **the one message that makes the user come back tomorrow**.

Recommended wedge: in-app inbox + a single transactional email for “your run finished / your board moved.” SMS, push, and Slack wait.

## Alternatives

| Approach | Effort | Why it dies |
| --- | --- | --- |
| Full omni-channel platform | 3 months | Preference center becomes the product. Nobody sends. |
| Slack-only bot | 1 week | Leaves the product. Users who are not in that workspace vanish. |
| **Inbox + one email** | 1 week | Narrow enough to learn from real usage. |

**Recommendation:** Ship the narrowest wedge. Design doc feeds `/plan-ceo-review`.
