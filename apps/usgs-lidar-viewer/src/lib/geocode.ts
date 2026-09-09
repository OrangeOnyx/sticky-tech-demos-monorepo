export type LonLat = {
  lon: number
  lat: number
}

export type GeocodeHit = LonLat & {
  id: string
  label: string
  bbox?: [west: number, south: number, east: number, north: number]
}

export class GeocodeError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = "GeocodeError"
    this.status = status
  }
}

type NominatimHit = {
  place_id?: number | string
  display_name?: string
  lat?: string
  lon?: string
  boundingbox?: [string, string, string, string]
}

export function parseNominatimHits(payload: unknown): GeocodeHit[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const hits: GeocodeHit[] = []

  for (const raw of payload as NominatimHit[]) {
    const lat = Number(raw.lat)
    const lon = Number(raw.lon)
    const label = raw.display_name?.trim()

    if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue
    }

    const hit: GeocodeHit = {
      id: String(raw.place_id ?? `${lon},${lat}`),
      label,
      lon,
      lat,
    }

    const box = raw.boundingbox
    if (box?.length === 4) {
      const south = Number(box[0])
      const north = Number(box[1])
      const west = Number(box[2])
      const east = Number(box[3])
      if (
        Number.isFinite(south) &&
        Number.isFinite(north) &&
        Number.isFinite(west) &&
        Number.isFinite(east)
      ) {
        hit.bbox = [west, south, east, north]
      }
    }

    hits.push(hit)
  }

  return hits
}

export function nominatimSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    addressdetails: "0",
    countrycodes: "us",
  })
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`
}

export async function searchAddress(query: string): Promise<GeocodeHit[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const response = await fetch(nominatimSearchUrl(trimmed), {
    headers: {
      Accept: "application/json",
    },
  })

  if (response.status === 429) {
    throw new GeocodeError(
      "Nominatim rate-limited this search. Wait a second and try again.",
      429,
    )
  }

  if (!response.ok) {
    throw new GeocodeError(
      `Address search failed (${response.status}).`,
      response.status,
    )
  }

  return parseNominatimHits(await response.json())
}
