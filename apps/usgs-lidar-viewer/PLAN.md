# PLAN — usgs-lidar-viewer

## Goal
Single-user MVP that recreates the viral USGS 1m LiDAR elevation viewer vibe: search a US address, zoom to 1m terrain, crossfade LiDAR hillshade vs satellite.

## Single-user MVP
- Address search (Nominatim or similar free geocoder) → fly to location
- MapLibre (preferred) or Leaflet: USGS 3DEP / 1m elevation hillshade tiles + satellite basemap
- Opacity / crossfade slider between LiDAR hillshade and satellite
- Self-contained under `apps/usgs-lidar-viewer/`: `bun install && bun run dev` (or npm if Bun blocked)
- No API keys required if using public USGS/Esri tiles + Nominatim (document any rate limits / attribution)

## Explicitly out of scope
- Multi-user accounts, saved projects, auth
- Full 3D terrain mesh / Contour CAD export
- Touching sibling apps (`world-labs-marble`, `elevenlabs-speech-engine`, etc.)
- New GitHub repository

## Outcome-oriented tasks
1. Scaffold Vite+React+TS + bunfig (`minimumReleaseAge = 259200`) + shadcn minimal chrome
2. Map + satellite basemap + hillshade layer from USGS 3DEP / documented public tiles
3. Address search + flyTo
4. Crossfade slider LiDAR ↔ satellite
5. Attribution footer (USGS / imagery / geocoder)
6. README + run; PR with **screenshot AND video** of running app

## Stack
- **Bun** (or Node) — monorepo default
- **Vite + React + shadcn** — one-screen map UI
- **MapLibre GL** — vector/raster layers + slider-friendly opacity
- **USGS 3DEP / public hillshade tiles** — the demo subject

## Deferred
- Contours + click elevation readout
- 3D terrain tilt
- OTB / Lafayette bookmarks
- Offline tile cache
