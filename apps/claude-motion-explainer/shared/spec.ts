import { z } from "zod"

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

const sceneMeta = {
  id: z.string().min(1).max(40),
  enabled: z.boolean(),
  durationInFrames: z.number().int().min(15).max(600),
}

export const titleSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("title"),
  propertyName: z.string().min(1).max(80),
  subtitle: z.string().max(160),
  accent: hexColor,
})

export const kpiSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("kpi"),
  label: z.string().min(1).max(80),
  value: z.number().min(0).max(100),
  decimals: z.number().int().min(0).max(2),
  suffix: z.string().max(8),
  caption: z.string().max(180),
  accent: hexColor,
})

export const occupancySceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("occupancy"),
  title: z.string().min(1).max(80),
  bySqft: z.number().min(0).max(100),
  byUnit: z.number().min(0).max(100),
  caption: z.string().max(180),
  occupiedColor: hexColor,
  vacantColor: hexColor,
})

export const vacancyUnitSchema = z.object({
  unit: z.string().min(1).max(24),
  sqft: z.number().positive().max(10_000_000),
  note: z.string().max(80),
})

export const vacanciesSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("vacancies"),
  title: z.string().min(1).max(80),
  units: z.array(vacancyUnitSchema).max(12),
  emptyLabel: z.string().min(1).max(120),
  accent: hexColor,
})

export const expirationBarSchema = z.object({
  label: z.string().min(1).max(40),
  count: z.number().int().nonnegative().max(10_000),
})

export const expirationsSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("expirations"),
  title: z.string().min(1).max(80),
  caption: z.string().max(180),
  bars: z.array(expirationBarSchema).length(3),
  accent: hexColor,
})

export const rentBarSchema = z.object({
  label: z.string().min(1).max(80),
  rentPerSqft: z.number().nonnegative().max(100_000),
})

export const rentSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("rent"),
  title: z.string().min(1).max(80),
  caption: z.string().max(180),
  bars: z.array(rentBarSchema).max(8),
  avgRentPerSqft: z.number().nonnegative().max(100_000),
  totalMonthlyRent: z.number().nonnegative().max(1_000_000_000),
  accent: hexColor,
})

export const outroSceneSchema = z.object({
  ...sceneMeta,
  type: z.literal("outro"),
  headline: z.string().min(1).max(80),
  lines: z.array(z.string().min(1).max(160)).min(1).max(4),
  accent: hexColor,
})

export const sceneSchema = z.discriminatedUnion("type", [
  titleSceneSchema,
  kpiSceneSchema,
  occupancySceneSchema,
  vacanciesSceneSchema,
  expirationsSceneSchema,
  rentSceneSchema,
  outroSceneSchema,
])

export const explainerSpecSchema = z.object({
  fps: z.literal(30),
  width: z.literal(1280),
  height: z.literal(720),
  background: hexColor,
  ink: hexColor,
  muted: hexColor,
  scenes: z.array(sceneSchema).min(1).max(12),
})

export type ExplainerSpec = z.infer<typeof explainerSpecSchema>
export type Scene = z.infer<typeof sceneSchema>
export type TitleScene = z.infer<typeof titleSceneSchema>
export type KpiScene = z.infer<typeof kpiSceneSchema>
export type OccupancyScene = z.infer<typeof occupancySceneSchema>
export type VacanciesScene = z.infer<typeof vacanciesSceneSchema>
export type ExpirationsScene = z.infer<typeof expirationsSceneSchema>
export type RentScene = z.infer<typeof rentSceneSchema>
export type OutroScene = z.infer<typeof outroSceneSchema>

export const SCENE_LABELS: Record<Scene["type"], string> = {
  title: "Title",
  kpi: "KPI counter",
  occupancy: "Occupancy donut",
  vacancies: "Vacancy list",
  expirations: "Expiration bars",
  rent: "Rent per sqft",
  outro: "Outro",
}

export const REQUIRED_SCENE_TYPES: Scene["type"][] = [
  "title",
  "kpi",
  "occupancy",
  "vacancies",
  "expirations",
  "rent",
  "outro",
]

export function enabledDuration(spec: ExplainerSpec): number {
  const total = spec.scenes
    .filter((scene) => scene.enabled)
    .reduce((sum, scene) => sum + scene.durationInFrames, 0)
  return Math.max(1, total)
}

export function startFrameForScene(spec: ExplainerSpec, id: string): number | null {
  let frame = 0
  for (const scene of spec.scenes) {
    if (scene.id === id) return scene.enabled ? frame : null
    if (scene.enabled) frame += scene.durationInFrames
  }
  return null
}

export function sceneAccent(scene: Scene): string {
  if (scene.type === "occupancy") return scene.occupiedColor
  return scene.accent
}
