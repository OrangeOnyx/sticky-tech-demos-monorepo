export const STAGES = [
  {
    id: "office-hours",
    command: "/office-hours",
    specialist: "YC Office Hours",
    summary: "Six forcing questions. Reframe the product before anyone writes code.",
    teaser: "You said “notifications platform.” That is a category, not a product.",
  },
  {
    id: "plan-ceo-review",
    command: "/plan-ceo-review",
    specialist: "CEO / Founder",
    summary: "Find the 10-star product hiding inside the request. Four scope modes.",
    teaser: "HOLD SCOPE. Inbox + one email. SMS, push, and Slack wait.",
  },
  {
    id: "plan-eng-review",
    command: "/plan-eng-review",
    specialist: "Eng Manager",
    summary: "Lock architecture, data flow, edge cases, and the test matrix.",
    teaser: "Append-only events → inbox rows → idempotent email outbox.",
  },
  {
    id: "plan-design-review",
    command: "/plan-design-review",
    specialist: "Senior Designer",
    summary: "Score each dimension 0–10 and catch AI slop before it ships.",
    teaser: "Kill the gradient bell. Empty state is a promise, not polish.",
  },
  {
    id: "review",
    command: "/review",
    specialist: "Staff Engineer",
    summary: "Find the bugs that pass CI but blow up in production.",
    teaser: "AUTO-FIXED: outbox unique index. ASK: mark-as-read race.",
  },
  {
    id: "qa",
    command: "/qa",
    specialist: "QA Lead",
    summary: "Walk staging flows, file bugs, re-verify. Fixture mode only here.",
    teaser: "Nine cases on localhost. No Aside browser. No Anthropic key.",
  },
  {
    id: "ship",
    command: "/ship",
    specialist: "Release Engineer",
    summary: "Sync, run tests, audit coverage, open the PR.",
    teaser: "Tests green. Fixture PR: screenshot + video required.",
  },
] as const

export type Stage = (typeof STAGES)[number]
export type StageId = Stage["id"]
export type StageStatus = "pending" | "active" | "done"

export const FEATURE = {
  id: "notifications-v1",
  title: "Notifications v1",
  request:
    "Ship in-app, email, SMS, push, and Slack notifications with a preference center.",
} as const

export const AUTOPLAY_MS = 1200

export function isShipped(cursor: number): boolean {
  return cursor >= STAGES.length
}

export function clampCursor(cursor: number): number {
  if (!Number.isFinite(cursor)) {
    return 0
  }
  return Math.min(Math.max(Math.trunc(cursor), 0), STAGES.length)
}

export function advanceCursor(cursor: number): number {
  return clampCursor(cursor + 1)
}

export function stageStatus(index: number, cursor: number): StageStatus {
  const next = clampCursor(cursor)
  if (index < next) {
    return "done"
  }
  if (index === next) {
    return "active"
  }
  return "pending"
}

export function progressLabel(cursor: number): string {
  const next = clampCursor(cursor)
  if (isShipped(next)) {
    return "Shipped"
  }
  return `Stage ${next + 1} of ${STAGES.length}`
}

export function progressRatio(cursor: number): number {
  return clampCursor(cursor) / STAGES.length
}

export function transcriptPath(stageId: StageId): string {
  return `/fixtures/${FEATURE.id}/${stageId}.md`
}

export function fixtureFileName(stageId: StageId): string {
  return `${stageId}.md`
}
