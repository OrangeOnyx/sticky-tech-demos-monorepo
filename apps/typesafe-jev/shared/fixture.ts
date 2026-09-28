import { QUESTIONS } from "./questions.ts"
import type { Candidate, ChoiceAnswer, JudgeAnswers, ScoreAnswer } from "./types.ts"

export type ProfileId =
  | "approve-strong"
  | "skip-listicle"
  | "skip-heavy"
  | "skip-already"
  | "tweak-partial"

const LISTICLE = ["listicle", "roundup", "prompt pack", "prompt farm", "tools to bookmark", "50 ai"]
const ALREADY = ["already built", "already exists", "already shipped", "existing demo", "duplicate of"]
const HEAVY = [
  "gpu",
  "cuda",
  "kubernetes",
  "multiplayer",
  "ios-only",
  "ios only",
  "swiftui",
  "heavy realtime",
  "local gpu",
]
const STRONG = ["single-user", "single user", "self-contained", "web mvp", "under apps/"]

function haystack(candidate: Candidate): string {
  return `${candidate.title}\n${candidate.url}\n${candidate.blurb}`.toLowerCase()
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle))
}

export function classifyProfile(candidate: Candidate): ProfileId {
  const text = haystack(candidate)
  if (includesAny(text, LISTICLE)) return "skip-listicle"
  if (includesAny(text, ALREADY)) return "skip-already"
  if (includesAny(text, HEAVY)) return "skip-heavy"
  if (includesAny(text, STRONG)) return "approve-strong"
  return "tweak-partial"
}

export function needsApiKeyProbability(candidate: Candidate): number {
  const text = haystack(candidate)
  const explicitlyFree =
    /no api key|without (an |a )?key|needs no api|does not need|fixture mode|public data|no secret/.test(
      text,
    )
  const explicitlyNeeds =
    /requires (an |a )?api key|needs (an |a )?(openai|anthropic|stripe|elevenlabs|third-party)|api key required|bearer token|openai api/.test(
      text,
    )
  if (explicitlyNeeds && !explicitlyFree) return 0.91
  if (explicitlyFree && !explicitlyNeeds) return 0.12
  if (explicitlyNeeds && explicitlyFree) return 0.48
  return 0.36
}

const CHOICE: Record<ProfileId, { choice: string; probabilities: Record<string, number>; confidence: number }> = {
  "approve-strong": {
    choice: "approve",
    probabilities: { approve: 0.84, tweak: 0.13, skip: 0.03 },
    confidence: 0.78,
  },
  "skip-listicle": {
    choice: "skip",
    probabilities: { approve: 0.02, tweak: 0.07, skip: 0.91 },
    confidence: 0.86,
  },
  "skip-heavy": {
    choice: "skip",
    probabilities: { approve: 0.03, tweak: 0.1, skip: 0.87 },
    confidence: 0.8,
  },
  "skip-already": {
    choice: "skip",
    probabilities: { approve: 0.04, tweak: 0.14, skip: 0.82 },
    confidence: 0.74,
  },
  "tweak-partial": {
    choice: "tweak",
    probabilities: { approve: 0.18, tweak: 0.67, skip: 0.15 },
    confidence: 0.55,
  },
}

const SCORE_PROBS: Record<ProfileId, [number, number, number]> = {
  "approve-strong": [0.02, 0.06, 0.92],
  "skip-listicle": [0.84, 0.14, 0.02],
  "skip-heavy": [0.8, 0.18, 0.02],
  "skip-already": [0.08, 0.69, 0.23],
  "tweak-partial": [0.12, 0.71, 0.17],
}

const SCORE_CONFIDENCE: Record<ProfileId, number> = {
  "approve-strong": 0.88,
  "skip-listicle": 0.76,
  "skip-heavy": 0.71,
  "skip-already": 0.52,
  "tweak-partial": 0.58,
}

const NEAR_MISS: Record<ProfileId, number> = {
  "approve-strong": 0.08,
  "skip-listicle": 0.94,
  "skip-heavy": 0.88,
  "skip-already": 0.91,
  "tweak-partial": 0.63,
}

function choiceAnswer(profile: ProfileId): ChoiceAnswer {
  const row = CHOICE[profile]
  return {
    type: "choice",
    choice: row.choice,
    probabilities: row.probabilities,
    confidence: row.confidence,
  }
}

function scoreAnswer(profile: ProfileId): ScoreAnswer {
  const [poor, partial, strong] = SCORE_PROBS[profile]
  const score = Number((partial + strong * 2).toFixed(2))
  const levels = QUESTIONS.sticky_fit.criteria
  return {
    type: "score",
    score,
    legend: {
      "0": levels[0] ?? "Poor",
      "1": levels[1] ?? "Partial",
      "2": levels[2] ?? "Strong sticky MVP fit",
    },
    probabilities: {
      "0": poor,
      "1": partial,
      "2": strong,
    },
    confidence: SCORE_CONFIDENCE[profile],
  }
}

export function judgeFixture(candidate: Candidate): JudgeAnswers {
  const profile = classifyProfile(candidate)
  return {
    verdict: choiceAnswer(profile),
    sticky_fit: scoreAnswer(profile),
    needs_api_key: {
      type: "noul",
      noul: needsApiKeyProbability(candidate),
    },
    is_near_miss: {
      type: "noul",
      noul: NEAR_MISS[profile],
    },
  }
}
