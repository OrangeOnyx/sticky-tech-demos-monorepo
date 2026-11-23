export const SPEEDS = [0.5, 1, 2, 4] as const

export type Speed = (typeof SPEEDS)[number]

export function intervalMs(speed: Speed): number {
  return Math.round(800 / speed)
}

export function clampCursor(cursor: number, length: number): number {
  if (!Number.isFinite(cursor) || length <= 0) return 0
  return Math.min(Math.max(Math.trunc(cursor), 0), length)
}

export function stepForward(cursor: number, length: number): number {
  return clampCursor(cursor + 1, length)
}

export function stepBack(cursor: number, length: number): number {
  return clampCursor(cursor - 1, length)
}
