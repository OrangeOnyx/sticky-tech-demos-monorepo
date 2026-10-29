export const CLIP_KINDS = ["idle", "walk", "run"] as const

export type ClipKind = (typeof CLIP_KINDS)[number]

const PATTERNS: Record<ClipKind, RegExp> = {
  idle: /idle/i,
  walk: /walk/i,
  run: /run/i,
}

export function matchClip(names: readonly string[], kind: ClipKind): string | null {
  const matches = names.filter((name) => PATTERNS[kind].test(name))
  if (matches.length === 0) return null
  return [...matches].sort((a, b) => a.length - b.length || a.localeCompare(b))[0] ?? null
}

export function matchPrimaryClips(names: readonly string[]): Record<ClipKind, string | null> {
  return {
    idle: matchClip(names, "idle"),
    walk: matchClip(names, "walk"),
    run: matchClip(names, "run"),
  }
}
