/** Public USGS 3DEP dynamic hillshade (1 m where 3DEP lidar exists). */
export const USGS_HILLSHADE_RASTER_FUNCTION = "Hillshade Multidirectional"

export const USGS_HILLSHADE_TILE_URL =
  "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage" +
  "?bbox={bbox-epsg-3857}" +
  "&bboxSR=3857" +
  "&imageSR=3857" +
  "&size=256,256" +
  "&format=jpgpng" +
  `&renderingRule=${encodeURIComponent(
    JSON.stringify({ rasterFunction: USGS_HILLSHADE_RASTER_FUNCTION }),
  )}` +
  "&f=image"

/** Public Esri World Imagery XYZ tiles (satellite). */
export const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

export const DEFAULT_CENTER: [number, number] = [-112.1401, 36.0544]
export const DEFAULT_ZOOM = 14
export const DEFAULT_PLACE_LABEL = "Grand Canyon South Rim, Arizona"

export function lidarOpacityFromMix(mix: number): number {
  if (!Number.isFinite(mix)) {
    return 1
  }
  return Math.min(1, Math.max(0, mix / 100))
}
