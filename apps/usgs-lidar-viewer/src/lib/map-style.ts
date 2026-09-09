import type { StyleSpecification } from "maplibre-gl"
import { SATELLITE_TILE_URL, USGS_HILLSHADE_TILE_URL } from "./tiles"

export const SATELLITE_LAYER_ID = "satellite"
export const LIDAR_LAYER_ID = "lidar"

export function createMapStyle(lidarOpacity: number): StyleSpecification {
  return {
    version: 8,
    name: "usgs-lidar-viewer",
    sources: {
      satellite: {
        type: "raster",
        tiles: [SATELLITE_TILE_URL],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          'Esri, Maxar, Earthstar Geographics — <a href="https://www.esri.com/en-us/home" rel="noreferrer">Esri World Imagery</a>',
      },
      lidar: {
        type: "raster",
        tiles: [USGS_HILLSHADE_TILE_URL],
        tileSize: 256,
        maxzoom: 23,
        attribution:
          'USGS National Map <a href="https://www.usgs.gov/3d-elevation-program" rel="noreferrer">3DEP</a>',
      },
    },
    layers: [
      {
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: "satellite",
      },
      {
        id: LIDAR_LAYER_ID,
        type: "raster",
        source: "lidar",
        paint: {
          "raster-opacity": lidarOpacity,
          "raster-resampling": "linear",
        },
      },
    ],
  }
}
