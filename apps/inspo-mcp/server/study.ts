import { matchFixture } from "../shared/match.ts"
import { emptyStudy, normalizeRecommend } from "../shared/normalize.ts"
import type { StudyMode, StudyResponse } from "../shared/types.ts"
import { callTool, designLiveEnabled, type ToolText } from "./mcp.ts"

const MAX_BRIEF = 500

export interface StudyDeps {
  callTool: (name: string, args: Record<string, unknown>) => Promise<ToolText>
  designLive: boolean
}

function asMode(value: unknown): StudyMode | null {
  return value === "fixture" || value === "live" ? value : null
}

export async function runStudy(
  input: { mode: unknown; brief: unknown },
  deps: StudyDeps,
): Promise<{ status: number; body: StudyResponse | { error: string } }> {
  const mode = asMode(input.mode)
  if (!mode) {
    return { status: 400, body: { error: "Mode must be fixture or live." } }
  }
  if (typeof input.brief !== "string" || !input.brief.trim()) {
    return { status: 400, body: { error: "Enter a UI brief." } }
  }
  const brief = input.brief.trim()
  if (brief.length > MAX_BRIEF) {
    return { status: 400, body: { error: "Brief is too long." } }
  }

  const started = Date.now()
  if (mode === "fixture") {
    const study = matchFixture(brief)
    return {
      status: 200,
      body: { ...study, mode, latencyMs: Date.now() - started },
    }
  }

  try {
    const recommend = await deps.callTool("recommend", {
      brief,
      detail: "concise",
      maxTokens: 8000,
    })
    const recommendJson: unknown = JSON.parse(recommend.text)
    const record =
      recommendJson && typeof recommendJson === "object"
        ? (recommendJson as Record<string, unknown>)
        : null
    const exemplars = Array.isArray(record?.exemplars) ? record.exemplars : []
    const first = exemplars.find(
      (item) => item && typeof item === "object" && typeof (item as { slug?: unknown }).slug === "string",
    ) as { slug: string } | undefined

    let designMarkdown: string | null = null
    const calls = ["recommend"]
    if (first) {
      const design = await deps.callTool("get_design_system", {
        slug: first.slug,
        live: deps.designLive,
      })
      designMarkdown = design.text
      calls.push("get_design_system")
    }

    const study = normalizeRecommend(recommendJson, {
      brief,
      designMarkdown,
      designSlug: first?.slug ?? null,
      thumbMode: "remote",
      calls,
      note: deps.designLive
        ? null
        : "Live recommend. Design system used captured tokens (get_design_system live:false).",
    })
    if (study.exemplars.length === 0) {
      const empty = emptyStudy(
        brief,
        "Inspo returned no exemplars for this brief.",
      )
      return {
        status: 200,
        body: { ...empty, calls, mode, latencyMs: Date.now() - started },
      }
    }
    return {
      status: 200,
      body: { ...study, mode, latencyMs: Date.now() - started },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live Inspo call failed."
    return { status: 502, body: { error: message } }
  }
}

export function defaultDeps(env: NodeJS.ProcessEnv = process.env): StudyDeps {
  return {
    designLive: designLiveEnabled(env),
    callTool: (name, args) => callTool(name, args, env),
  }
}
