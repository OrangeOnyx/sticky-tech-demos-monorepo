export type StudyMode = "fixture" | "live"
export type MatchStrength = "strong" | "partial" | "weak"

export interface Macro {
  slug: string
  label: string
}

export interface Exemplar {
  slug: string
  title: string
  sourceUrl: string
  archiveUrl: string
  thumb: string
  northstar: string
  palette: string[]
  fonts: string[]
  mode: string
  axes: string
  macrostructure: Macro
}

export interface ReferenceComponent {
  id: string
  type: string
  label: string
  note: string
}

export interface Evidence {
  sites: number
  paperBand: string
  paperShare: number
  displayClass: string
  displayShare: number
  accentHue: string
  accentShare: number
  note: string
}

export interface DesignSystem {
  slug: string
  markdown: string
  pageUrl: string
}

export interface PaletteRole {
  hex: string
  role: string
}

export interface TypeStep {
  role: string
  family: string
  size: string
  weight: string
}

export interface DesignSummary {
  paletteRoles: PaletteRole[]
  typeSteps: TypeStep[]
  spacing: string | null
  radii: string | null
}

export interface StudyBody {
  brief: string
  match: MatchStrength
  pick: { macrostructure: Macro; rationale: string } | null
  palette: string[]
  evidence: Evidence | null
  exemplars: Exemplar[]
  referenceComponents: ReferenceComponent[]
  designSystem: DesignSystem | null
  summary: DesignSummary | null
  spacingNote: string | null
  note: string | null
  calls: string[]
}

export interface StudyResponse extends StudyBody {
  mode: StudyMode
  latencyMs: number
}

export interface HealthResponse {
  ok: true
  fixtureDefault: true
  endpoint: string
  designLive: boolean
}
