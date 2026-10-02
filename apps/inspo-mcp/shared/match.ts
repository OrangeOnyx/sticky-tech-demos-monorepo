import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { archiveScreenUrl } from "./normalize.ts"
import { summarizeDesign } from "./parse-design.ts"
import type {
  Evidence,
  Exemplar,
  MatchStrength,
  ReferenceComponent,
  StudyBody,
} from "./types.ts"

interface Keyword {
  term: string
  weight: number
}

interface CatalogFile {
  id: string
  designSlug: string
  keywords: Keyword[]
  pick: StudyBody["pick"]
  palette: string[]
  evidence: Evidence
  exemplars: Omit<Exemplar, "archiveUrl">[]
  referenceComponents: ReferenceComponent[]
  spacingNote: string
}

const CATALOG_IDS = ["dark-saas-pricing", "editorial-magazine"] as const

const catalogDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "catalog")

function readCatalog(id: string): { file: CatalogFile; markdown: string } {
  const file = JSON.parse(readFileSync(path.join(catalogDir, `${id}.json`), "utf8")) as CatalogFile
  const markdown = readFileSync(path.join(catalogDir, `${id}.design.md`), "utf8")
  return { file, markdown }
}

function scoreBrief(brief: string, keywords: Keyword[]): number {
  const text = brief.toLowerCase()
  let total = 0
  let distinctive = false
  for (const keyword of keywords) {
    if (!text.includes(keyword.term.toLowerCase())) continue
    total += keyword.weight
    if (keyword.weight >= 2) distinctive = true
  }
  return distinctive ? total : 0
}

function strengthFor(score: number): MatchStrength {
  return score >= 4 ? "strong" : "partial"
}

const WEAK_NOTE =
  "No committed fixture covers this brief. Fixture mode only has studies for the sample briefs (dark SaaS pricing, editorial magazine). Switch to Live to query the archive."

const SNAPSHOT_NOTE =
  "Offline snapshot of recommend and get_design_system from inspomcp.dev, captured 2026-10-02. Screenshots stay with their designers."

export function matchFixture(brief: string): StudyBody {
  const trimmed = brief.trim()
  if (!trimmed) {
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
      note: "Enter a UI brief.",
      calls: [],
    }
  }

  let best: { id: string; score: number } | null = null
  for (const id of CATALOG_IDS) {
    const { file } = readCatalog(id)
    const score = scoreBrief(trimmed, file.keywords)
    if (score === 0) continue
    if (!best || score > best.score) best = { id, score }
  }

  if (!best) {
    return {
      brief: trimmed,
      match: "weak",
      pick: null,
      palette: [],
      evidence: null,
      exemplars: [],
      referenceComponents: [],
      designSystem: null,
      summary: null,
      spacingNote: null,
      note: WEAK_NOTE,
      calls: [],
    }
  }

  const { file, markdown } = readCatalog(best.id)
  const exemplars: Exemplar[] = file.exemplars.map((exemplar) => ({
    ...exemplar,
    archiveUrl: archiveScreenUrl(exemplar.slug),
  }))

  return {
    brief: trimmed,
    match: strengthFor(best.score),
    pick: file.pick,
    palette: file.palette,
    evidence: file.evidence,
    exemplars,
    referenceComponents: file.referenceComponents,
    designSystem: {
      slug: file.designSlug,
      markdown,
      pageUrl: `https://inspomcp.dev/d/${file.designSlug}/DESIGN.md`,
    },
    summary: summarizeDesign(markdown),
    spacingNote: file.spacingNote,
    note: SNAPSHOT_NOTE,
    calls: ["recommend", "get_design_system"],
  }
}
