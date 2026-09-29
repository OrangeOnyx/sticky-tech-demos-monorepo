export const VERDICT_OPTIONS = ["approve", "tweak", "skip"] as const

export const SCORE_LEVELS = ["Poor", "Partial", "Strong sticky MVP fit"] as const

export const QUESTIONS = {
  verdict: {
    type: "choice" as const,
    instructions:
      "Which verdict should Adam give this bookmark before spending LLM tokens? Approve only a single-user web MVP that can live self-contained under apps/. Skip listicles, prompt farms, iOS-only apps, GPU-local setups, heavy realtime, and ideas that are already built.",
    criteria: {
      approve:
        "Single-user web MVP, self-contained under apps/, demoable in a browser on one machine.",
      tweak:
        "Close to a sticky web MVP, but the slice is too wide (extra platform, extra user, or extra dependency) and should be narrowed first.",
      skip:
        "Listicle, prompt farm, iOS-only, GPU-local, heavy realtime, already built, or otherwise outside the sticky filter.",
    },
  },
  sticky_fit: {
    type: "score" as const,
    instructions:
      "How well does this match a strong sticky MVP: one user, one web app, self-contained under apps/?",
    criteria: [...SCORE_LEVELS],
  },
  needs_api_key: {
    type: "noul" as const,
    instructions:
      "Does building this require a third-party API key to demo meaningfully?",
    criteria: {
      true: "A meaningful demo needs a third-party secret or paid API.",
      false: "The core loop can be shown with fixtures, public data, or no key.",
    },
  },
  is_near_miss: {
    type: "noul" as const,
    instructions: "Is this interesting but fails the sticky filter?",
    criteria: {
      true: "Interesting enough to notice, but it fails the sticky filter.",
      false: "Either a clean sticky MVP, or not a near miss.",
    },
  },
}

export function formatCandidateState(candidate: {
  title: string
  url: string
  blurb: string
}): string {
  return [
    `Title: ${candidate.title.trim() || "(none)"}`,
    `URL: ${candidate.url.trim() || "(none)"}`,
    `Why bookmarked: ${candidate.blurb.trim() || "(none)"}`,
  ].join("\n")
}

export function buildSystemOneBody(candidate: {
  title: string
  url: string
  blurb: string
}) {
  return {
    state: formatCandidateState(candidate),
    model: "jev-latest",
    questions: QUESTIONS,
  }
}
