# USGS 1m LiDAR Elevation Viewer

Single-user map: search a US address, fly to it, and crossfade USGS 3DEP LiDAR hillshade against satellite imagery.

```bash
cd apps/usgs-lidar-viewer
npm install
npm run dev
```

Bun works too (`bun install && bun run dev`). Open [http://localhost:5173](http://localhost:5173). No API keys.

`bunfig.toml` sets `minimumReleaseAge = 259200` so installs wait three days after a package is published.

## What you get

- Nominatim address search (US-scoped) → MapLibre `fitBounds` / `flyTo`
- USGS 3DEP multidirectional hillshade via the public ImageServer `exportImage` tiles
- Esri World Imagery satellite tiles
- Opacity slider: satellite ←→ LiDAR

1 m detail appears where 3DEP lidar has been collected, typically after zooming past ~14. Coverage is not nationwide at 1 m.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `bun run dev` | Vite on port 5173 (`--host`) |
| `npm run build` / `bun run build` | Production client build |
| `bun test` | Geocoder parsing and slider math |
| `npm run lint` / `bun run lint` | oxlint |

## Attribution

Use of these public services requires credit. The app footer repeats this.

| Source | Role | Terms |
| --- | --- | --- |
| [USGS 3DEP](https://www.usgs.gov/3d-elevation-program) / [The National Map ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer) | 1 m (where available) hillshade | Public domain USGS data. Dynamic `Hillshade Multidirectional` raster function. |
| [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a356e7c8d9c5fcf43) | Satellite basemap | Esri, Maxar, Earthstar Geographics, and the GIS User Community. Attribution required. |
| [Nominatim](https://nominatim.org/) | Address search | © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. About **one request per second**. Identify the app; do not bulk-geocode. |
| [MapLibre GL JS](https://maplibre.org/) | Map renderer | BSD. |

## Rate limits and keys

No keys are required for this demo. Nominatim will 429 if you search faster than about 1 req/s. USGS and Esri public tiles can throttle heavy use. This app only searches on submit, not on every keystroke.

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova), Tailwind v4, MapLibre GL JS, Bun or npm.
