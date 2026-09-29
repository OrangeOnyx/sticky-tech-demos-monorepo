export type Candidate = {
  title: string
  url: string
  blurb: string
}

export type JudgeMode = "fixture" | "live"

export type ChoiceAnswer = {
  type: "choice"
  choice: string
  probabilities: Record<string, number>
  confidence: number
}

export type ScoreAnswer = {
  type: "score"
  score: number
  legend: Record<string, string>
  probabilities: Record<string, number>
  confidence: number
}

export type NoulAnswer = {
  type: "noul"
  noul: number
}

export type JudgeAnswers = {
  verdict: ChoiceAnswer
  sticky_fit: ScoreAnswer
  needs_api_key: NoulAnswer
  is_near_miss: NoulAnswer
}

export type TokenUsage = {
  input_tokens: number
  output_tokens: number
}

export type JudgeResponse = {
  mode: JudgeMode
  model: string
  latencyMs: number
  liveReady: boolean
  answers: JudgeAnswers
  usage?: TokenUsage
}

export type JudgeError = {
  error: string
}
