export type Unit = {
  value: string
  label: string
  building: string
  beds: string
}

export type NamedValue = {
  value: string
  label: string
}

export const units: Unit[] = [
  { value: "lumen-204", label: "Lumen 204", building: "Lumen House", beds: "2 bed" },
  { value: "kiln-12", label: "Kiln 12", building: "Kiln Works", beds: "1 bed" },
  { value: "northloft-3b", label: "Northloft 3B", building: "Northloft", beds: "Studio" },
  { value: "glasshouse-1", label: "Glasshouse 1", building: "Glasshouse", beds: "3 bed" },
  { value: "cedar-88", label: "Cedar 88", building: "Cedar Court", beds: "2 bed" },
]

export const showingTypes: NamedValue[] = [
  { value: "in-person", label: "In person" },
  { value: "video", label: "Video tour" },
  { value: "self-guided", label: "Self-guided" },
]

export const tourStops: NamedValue[] = [
  { value: "lobby", label: "Meet at lobby" },
  { value: "walk", label: "Walk the unit" },
  { value: "roof", label: "Roof deck" },
  { value: "keys", label: "Keys" },
]

export const initialStopOrder = tourStops.map((stop) => stop.value)

export const stopLabels: Record<string, string> = Object.fromEntries(
  tourStops.map((stop) => [stop.value, stop.label]),
)

export function labelFor(items: NamedValue[], value: string | null): string {
  if (!value) return ""
  return items.find((item) => item.value === value)?.label ?? value
}
