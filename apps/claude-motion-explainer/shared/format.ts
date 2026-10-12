const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatAsOf(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  const name = MONTHS[Number(month) - 1] ?? month
  return `${name} ${Number(day)}, ${year}`
}

export function formatInt(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatMoney(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? "-" : ""
  return `${sign}$${formatInt(Math.abs(rounded))}`
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatRentPerSqft(value: number): string {
  return `$${value.toFixed(2)}`
}
