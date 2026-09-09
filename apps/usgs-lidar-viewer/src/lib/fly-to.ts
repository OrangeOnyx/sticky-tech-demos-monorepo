import type { Map as MapLibreMap } from "maplibre-gl"
import type { GeocodeHit } from "./geocode"

export function flyToHit(map: MapLibreMap, hit: GeocodeHit) {
  if (hit.bbox) {
    map.fitBounds(
      [
        [hit.bbox[0], hit.bbox[1]],
        [hit.bbox[2], hit.bbox[3]],
      ],
      { padding: 72, maxZoom: 16, duration: 1600 },
    )
    return
  }

  map.flyTo({
    center: [hit.lon, hit.lat],
    zoom: 16,
    duration: 1600,
  })
}
