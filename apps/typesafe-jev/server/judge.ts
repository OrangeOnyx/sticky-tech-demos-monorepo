import { judgeFixture } from "../shared/fixture.ts"
import { buildSystemOneBody } from "../shared/questions.ts"
import type {
  Candidate,
  JudgeAnswers,
  JudgeError,
  JudgeMode,
  JudgeResponse,
  TokenUsage,
} from "../shared/types.ts"

const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"
const TITLE_MAX = 180
const URL_MAX = 400
const BLURB_MAX = 2000

export type JudgeResult = {
  status: number
  body: JudgeResponse | JudgeError
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  return value.slice(0, max)
}

export function parseCandidate(input: unknown): { candidate: Candidate } | { error: string } {
  const record = asRecord(input)
  if (!record) return { error: "Candidate must be an object with title, url, and blurb." }
  const title = readString(record.title, TITLE_MAX)
  const url = readString(record.url ?? "", URL_MAX)
  const blurb = readString(record.blurb, BLURB_MAX)
  if (title === null || url === null || blurb === null) {
    return { error: "Title, url, and blurb must be strings." }
  }
  if (!title.trim() && !blurb.trim()) {
    return { error: "Add a title or a short blurb first." }
  }
  return { candidate: { title, url, blurb } }
}

function isChoice(value: unknown): value is JudgeAnswers["verdict"] {
  const record = asRecord(value)
  return Boolean(
    record &&
      record.type === "choice" &&
      typeof record.choice === "string" &&
      record.probabilities &&
      typeof record.probabilities === "object" &&
      typeof record.confidence === "number",
  )
}

function isScore(value: unknown): value is JudgeAnswers["sticky_fit"] {
  const record = asRecord(value)
  return Boolean(
    record &&
      record.type === "score" &&
      typeof record.score === "number" &&
      record.legend &&
      typeof record.legend === "object" &&
      record.probabilities &&
      typeof record.probabilities === "object" &&
      typeof record.confidence === "number",
  )
}

function isNoul(value: unknown): value is JudgeAnswers["needs_api_key"] {
  const record = asRecord(value)
  return Boolean(record && record.type === "noul" && typeof record.noul === "number")
}

function readAnswers(value: unknown): JudgeAnswers | null {
  const record = asRecord(value)
  if (!record) return null
  if (!isChoice(record.verdict) || !isScore(record.sticky_fit)) return null
  if (!isNoul(record.needs_api_key) || !isNoul(record.is_near_miss)) return null
  return {
    verdict: record.verdict,
    sticky_fit: record.sticky_fit,
    needs_api_key: record.needs_api_key,
    is_near_miss: record.is_near_miss,
  }
}

function readUsage(value: unknown): TokenUsage | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  if (typeof record.input_tokens !== "number" || typeof record.output_tokens !== "number") {
    return undefined
  }
  return {
    input_tokens: record.input_tokens,
    output_tokens: record.output_tokens,
  }
}

function upstreamMessage(status: number, payload: unknown): string {
  if (status === 401) return "TypeSafe rejected the API key."
  if (status === 429 || status === 529) return "TypeSafe is busy. Try again shortly."
  const record = asRecord(payload)
  const detail = record?.error ?? record?.message ?? record?.detail
  if (typeof detail === "string" && detail.trim()) {
    return `TypeSafe returned ${status}: ${detail.slice(0, 240)}`
  }
  if (status === 422) return "TypeSafe rejected the question payload."
  return `TypeSafe returned ${status}.`
}

export async function judgeCandidate(options: {
  mode: unknown
  candidate: unknown
  apiKey: string | undefined
  fetchImpl?: typeof fetch
}): Promise<JudgeResult> {
  const mode: JudgeMode | null =
    options.mode === "fixture" || options.mode === "live" ? options.mode : null
  if (!mode) {
    return { status: 400, body: { error: "Mode must be fixture or live." } }
  }

  const parsed = parseCandidate(options.candidate)
  if ("error" in parsed) {
    return { status: 400, body: { error: parsed.error } }
  }

  const liveReady = Boolean(options.apiKey?.trim())
  const started = performance.now()

  if (mode === "fixture") {
    return {
      status: 200,
      body: {
        mode,
        model: "fixture",
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
        liveReady,
        answers: judgeFixture(parsed.candidate),
      },
    }
  }

  if (!liveReady) {
    return {
      status: 400,
      body: {
        error:
          "Live mode needs TYPESAFE_API_KEY in apps/typesafe-jev/.env. Fixture mode works with no key.",
      },
    }
  }

  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl(TYPESAFE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSystemOneBody(parsed.candidate)),
      signal: AbortSignal.timeout(45_000),
    })
  } catch {
    return {
      status: 502,
      body: { error: "Could not reach TypeSafe." },
    }
  }

  const rawText = await response.text()
  let payload: unknown = null
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    return { status: 502, body: { error: upstreamMessage(response.status, payload) } }
  }

  const record = asRecord(payload)
  const answers = readAnswers(record?.answers)
  if (!record || typeof record.model !== "string" || !answers) {
    return { status: 502, body: { error: "TypeSafe returned an unexpected payload." } }
  }

  const body: JudgeResponse = {
    mode,
    model: record.model,
    latencyMs: Math.max(0, Math.round(performance.now() - started)),
    liveReady: true,
    answers,
  }
  const usage = readUsage(record.usage)
  if (usage) body.usage = usage
  return { status: 200, body }
}
