import { summarizeDesign } from "./parse-design.ts"
import type {
  DesignSystem,
  Evidence,
  Exemplar,
  Macro,
  MatchStrength,
  ReferenceComponent,
  StudyBody,
} from "./types.ts"

const ARCHIVE = "https://inspomcp.dev"

export function archiveScreenUrl(slug: string): string {
  return `${ARCHIVE}/screens/${encodeURIComponent(slug)}`
}

export function designPageUrl(slug: string): string {
  return `${ARCHIVE}/d/${encodeURIComponent(slug)}/DESIGN.md`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

function asMacro(value: unknown): Macro | null {
  const record = asRecord(value)
  const slug = asString(record?.slug)
  const label = asString(record?.label)
  if (!slug || !label) return null
  return { slug, label }
}

function asEvidence(value: unknown): Evidence | null {
  const record = asRecord(value)
  if (!record) return null
  const paper = asRecord(record.paperBand)
  const display = asRecord(record.displayClass)
  const accent = asRecord(record.accentHue)
  const paperBand = asString(paper?.consensus)
  const displayClass = asString(display?.consensus)
  const accentHue = asString(accent?.consensus)
  if (!paperBand || !displayClass || !accentHue) return null
  return {
    sites: typeof record.sites === "number" ? record.sites : 0,
    paperBand,
    paperShare: typeof paper?.share === "number" ? paper.share : 0,
    displayClass,
    displayShare: typeof display?.share === "number" ? display.share : 0,
    accentHue,
    accentShare: typeof accent?.share === "number" ? accent.share : 0,
    note: asString(record.note) ?? "",
  }
}

function localThumb(slug: string): string {
  return `/fixtures/thumbs/${slug}.webp`
}

export function inferMatch(evidence: Evidence | null, exemplarCount: number): MatchStrength {
  if (exemplarCount === 0) return "weak"
  const share = Math.max(evidence?.paperShare ?? 0, evidence?.displayShare ?? 0)
  if (exemplarCount >= 3 && share >= 0.75) return "strong"
  return "partial"
}

export interface NormalizeOptions {
  brief: string
  designMarkdown: string | null
  designSlug: string | null
  thumbMode: "remote" | "local"
  match?: MatchStrength
  note?: string | null
  calls: string[]
  spacingNote?: string | null
}

export function normalizeRecommend(raw: unknown, options: NormalizeOptions): StudyBody {
  const record = asRecord(raw)
  if (!record) {
    throw new Error("Inspo recommend payload was not an object.")
  }

  const pickRecord = asRecord(record.pick)
  const macro = asMacro(pickRecord?.macrostructure)
  const rationale = asString(pickRecord?.rationale)
  const pick = macro && rationale ? { macrostructure: macro, rationale } : null

  const exemplars: Exemplar[] = []
  if (Array.isArray(record.exemplars)) {
    for (const item of record.exemplars) {
      const row = asRecord(item)
      const slug = asString(row?.slug)
      const title = asString(row?.title)
      const sourceUrl = asString(row?.sourceUrl)
      if (!row || !slug || !title || !sourceUrl) continue
      const remoteThumb = asString(row.thumb) ?? ""
      exemplars.push({
        slug,
        title,
        sourceUrl,
        archiveUrl: archiveScreenUrl(slug),
        thumb: options.thumbMode === "local" ? localThumb(slug) : remoteThumb,
        northstar: asString(row.northstar) ?? "",
        palette: asStringList(row.palette),
        fonts: asStringList(row.fonts),
        mode: asString(row.mode) ?? "",
        axes: asString(row.axes) ?? "",
        macrostructure: asMacro(row.macrostructure) ?? { slug: "unknown", label: "Unknown" },
      })
    }
  }

  const referenceComponents: ReferenceComponent[] = []
  if (Array.isArray(record.referenceComponents)) {
    for (const item of record.referenceComponents) {
      const row = asRecord(item)
      const id = asString(row?.id)
      const type = asString(row?.type)
      const label = asString(row?.label)
      if (!id || !type || !label) continue
      referenceComponents.push({
        id,
        type,
        label,
        note: asString(row?.note) ?? asString(row?.about) ?? "",
      })
    }
  }

  const evidence = asEvidence(record.evidence)
  const palette = asStringList(record.paletteSuggestion)
  const designSlug = options.designSlug
  let designSystem: DesignSystem | null = null
  if (designSlug && options.designMarkdown) {
    designSystem = {
      slug: designSlug,
      markdown: options.designMarkdown,
      pageUrl: designPageUrl(designSlug),
    }
  }

  return {
    brief: options.brief,
    match: options.match ?? inferMatch(evidence, exemplars.length),
    pick,
    palette: palette.length > 0 ? palette : (exemplars[0]?.palette ?? []),
    evidence,
    exemplars,
    referenceComponents,
    designSystem,
    summary: designSystem ? summarizeDesign(designSystem.markdown) : null,
    spacingNote: options.spacingNote ?? asString(record.spacingGuidance),
    note: options.note ?? null,
    calls: options.calls,
  }
}

export function emptyStudy(brief: string, note: string): StudyBody {
  return {
    brief,
    match: "weak",
    pick: null,
    palette: [],
    evidence: null,
    exemplars: [],
    referenceComponents: [],
    designSystem: null,
    summary: null,
    spacingNote: null,
    note,
    calls: [],
  }
}
