export const AS_OF = "2026-10-12"

export function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function extractDate(raw: string): string | null {
  const iso = raw.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/)
  if (iso) {
    const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`
    return isIsoDate(candidate) ? candidate : null
  }
  const us = raw.match(/\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(20\d{2})\b/)
  if (!us) return null
  const candidate = `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`
  return isIsoDate(candidate) ? candidate : null
}

export function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const monthIndex = (year ?? 0) * 12 + ((month ?? 1) - 1) + months
  const nextYear = Math.floor(monthIndex / 12)
  const nextMonth = (monthIndex % 12) + 1
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
  const nextDay = Math.min(day ?? 1, lastDay)
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`
}
