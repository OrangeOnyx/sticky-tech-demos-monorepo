import { buildExplainerSpec } from "../shared/build-spec.ts"
import { parseRentRoll, type RentRollMetrics } from "../shared/parse.ts"
import {
  REQUIRED_SCENE_TYPES,
  explainerSpecSchema,
  type ExplainerSpec,
  type Scene,
} from "../shared/spec.ts"

export const DEFAULT_MODEL = "claude-sonnet-5-5"

export type ExplainMode = "fixture" | "live"

export type ExplainResponse = {
  mode: ExplainMode
  source: "fixture" | "live" | "fallback"
  model: string | null
  warning?: string
  metrics: RentRollMetrics
  spec: ExplainerSpec
}

export type ExplainResult = {
  status: number
  body: ExplainResponse | { error: string }
}

type FetchLike = typeof fetch

const FALLBACK_WARNING =
  "The model output didn't match the spec. Showing the fixture-style cut from the parsed roll."

function errorResult(status: number, error: string): ExplainResult {
  return { status, body: { error } }
}

function success(
  mode: ExplainMode,
  source: ExplainResponse["source"],
  model: string | null,
  metrics: RentRollMetrics,
  spec: ExplainerSpec,
  warning?: string,
): ExplainResult {
  const body: ExplainResponse = { mode, source, model, metrics, spec }
  if (warning) body.warning = warning
  return { status: 200, body }
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced?.[1] ?? text
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("no json")
  return JSON.parse(raw.slice(start, end + 1)) as unknown
}

function lockNumbers(candidate: ExplainerSpec, baseline: ExplainerSpec): ExplainerSpec | null {
  const types = candidate.scenes.map((scene) => scene.type)
  if (types.length !== REQUIRED_SCENE_TYPES.length) return null
  if (new Set(types).size !== types.length) return null
  for (const required of REQUIRED_SCENE_TYPES) {
    if (!types.includes(required)) return null
  }
  const ids = candidate.scenes.map((scene) => scene.id)
  if (new Set(ids).size !== ids.length) return null

  const baselineByType = new Map(baseline.scenes.map((scene) => [scene.type, scene]))
  const scenes = candidate.scenes.map((scene) => lockScene(scene, baselineByType.get(scene.type)))
  if (scenes.some((scene) => scene === null)) return null

  return {
    ...candidate,
    fps: 30,
    width: 1280,
    height: 720,
    scenes: scenes as Scene[],
  }
}

function lockScene(scene: Scene, baseline: Scene | undefined): Scene | null {
  if (!baseline || baseline.type !== scene.type) return null
  if (scene.type === "title" && baseline.type === "title") {
    return { ...scene, propertyName: baseline.propertyName }
  }
  if (scene.type === "kpi" && baseline.type === "kpi") {
    return {
      ...scene,
      value: baseline.value,
      decimals: baseline.decimals,
      suffix: baseline.suffix,
    }
  }
  if (scene.type === "occupancy" && baseline.type === "occupancy") {
    return { ...scene, bySqft: baseline.bySqft, byUnit: baseline.byUnit }
  }
  if (scene.type === "vacancies" && baseline.type === "vacancies") {
    return { ...scene, units: baseline.units }
  }
  if (scene.type === "expirations" && baseline.type === "expirations") {
    return { ...scene, bars: baseline.bars }
  }
  if (scene.type === "rent" && baseline.type === "rent") {
    return {
      ...scene,
      bars: baseline.bars,
      avgRentPerSqft: baseline.avgRentPerSqft,
      totalMonthlyRent: baseline.totalMonthlyRent,
    }
  }
  return scene
}

function promptFor(metrics: RentRollMetrics, baseline: ExplainerSpec): string {
  return [
    "Rewrite this rent-roll explainer spec.",
    "Change titles, captions, outro lines, and 6-digit hex colors if a clearer read helps.",
    "Keep every number, unit name, scene type, and the property name.",
    "Durations are frames at 30fps, between 15 and 600.",
    "Return the spec JSON only.",
    "",
    "Metrics:",
    JSON.stringify(metrics),
    "",
    "Baseline spec:",
    JSON.stringify(baseline),
  ].join("\n")
}

async function liveSpec(input: {
  apiKey: string
  model: string
  metrics: RentRollMetrics
  baseline: ExplainerSpec
  fetchImpl: FetchLike
}): Promise<{ spec: ExplainerSpec; source: "live" | "fallback"; warning?: string }> {
  const response = await input.fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 8000,
      system:
        "You write JSON for a rent-roll motion graphic. Return only a JSON object matching the baseline spec. Do not invent tenants, rents, or dates.",
      messages: [
        {
          role: "user",
          content: promptFor(input.metrics, input.baseline),
        },
      ],
    }),
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401 || status === 403) {
      throw new Error("Anthropic rejected the API key.")
    }
    throw new Error(`Anthropic rejected the request (${status}).`)
  }

  const payload = (await response.json()) as {
    content?: { type?: string; text?: string }[]
  }
  const text = (payload.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")

  try {
    const parsed = explainerSpecSchema.safeParse(extractJson(text))
    if (!parsed.success) {
      return { spec: input.baseline, source: "fallback", warning: FALLBACK_WARNING }
    }
    const locked = lockNumbers(parsed.data, input.baseline)
    if (!locked) {
      return { spec: input.baseline, source: "fallback", warning: FALLBACK_WARNING }
    }
    const checked = explainerSpecSchema.safeParse(locked)
    if (!checked.success) {
      return { spec: input.baseline, source: "fallback", warning: FALLBACK_WARNING }
    }
    return { spec: checked.data, source: "live" }
  } catch {
    return { spec: input.baseline, source: "fallback", warning: FALLBACK_WARNING }
  }
}

export async function explainRentRoll(input: {
  mode: unknown
  text: unknown
  propertyName?: unknown
  apiKey?: string
  model?: string
  fetchImpl?: FetchLike
}): Promise<ExplainResult> {
  if (input.mode !== "fixture" && input.mode !== "live") {
    return errorResult(400, "Mode must be fixture or live.")
  }
  if (typeof input.text !== "string" || input.text.length > 50_000) {
    return errorResult(400, "Paste a rent roll as text.")
  }
  const propertyName = typeof input.propertyName === "string" ? input.propertyName : undefined
  const parsed = parseRentRoll(input.text, { propertyName })
  if (!parsed.ok) return errorResult(400, parsed.error)

  const baseline = buildExplainerSpec(parsed.metrics)
  if (input.mode === "fixture") {
    return success("fixture", "fixture", null, parsed.metrics, baseline)
  }

  const apiKey = input.apiKey?.trim()
  if (!apiKey) {
    return errorResult(400, "Add ANTHROPIC_API_KEY to .env and restart before using Live.")
  }

  const model = input.model?.trim() || DEFAULT_MODEL
  try {
    const live = await liveSpec({
      apiKey,
      model,
      metrics: parsed.metrics,
      baseline,
      fetchImpl: input.fetchImpl ?? fetch,
    })
    return success("live", live.source, model, parsed.metrics, live.spec, live.warning)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach Anthropic."
    const safe = message.startsWith("Anthropic") ? message : "Could not reach Anthropic."
    return errorResult(502, safe)
  }
}
