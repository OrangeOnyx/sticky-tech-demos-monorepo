import { useCallback, useRef, useState } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"
import { AddressSearch } from "@/components/address-search"
import { CrossfadeSlider } from "@/components/crossfade-slider"
import { ElevationMap } from "@/components/elevation-map"
import { flyToHit } from "@/lib/fly-to"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { GeocodeHit } from "@/lib/geocode"
import { DEFAULT_PLACE_LABEL, lidarOpacityFromMix } from "@/lib/tiles"

export default function App() {
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mix, setMix] = useState(100)
  const [mapReady, setMapReady] = useState(false)
  const [place, setPlace] = useState(DEFAULT_PLACE_LABEL)

  const onReadyChange = useCallback((ready: boolean) => {
    setMapReady(ready)
  }, [])

  function onSelect(hit: GeocodeHit) {
    const map = mapRef.current
    if (!map) {
      return
    }
    flyToHit(map, hit)
    setPlace(hit.label)
  }

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background">
      <ElevationMap
        mapRef={mapRef}
        lidarOpacity={lidarOpacityFromMix(mix)}
        onReadyChange={onReadyChange}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 md:p-4">
        <Card className="pointer-events-auto mx-auto max-w-2xl bg-card/90 py-3 shadow-lg backdrop-blur-md">
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h1 className="font-heading text-sm font-medium tracking-tight md:text-base">
                  USGS 1m LiDAR elevation
                </h1>
                <p className="max-w-xl text-xs text-muted-foreground">
                  Search a US address, then crossfade 3DEP hillshade against satellite.
                </p>
              </div>
              <Badge variant="outline">No API key</Badge>
            </div>
            <AddressSearch disabled={!mapReady} onSelect={onSelect} />
            <p className="truncate text-xs text-muted-foreground" title={place}>
              {place}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 md:p-4">
        <Card className="pointer-events-auto mx-auto max-w-xl bg-card/90 py-3 shadow-lg backdrop-blur-md">
          <CardContent className="flex flex-col gap-3">
            <CrossfadeSlider value={mix} onValueChange={setMix} />
            <Separator />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Hillshade:{" "}
              <a
                className="underline underline-offset-2"
                href="https://www.usgs.gov/3d-elevation-program"
                rel="noreferrer"
                target="_blank"
              >
                USGS 3DEP
              </a>{" "}
              (1 m where collected). Imagery: Esri World Imagery (Esri, Maxar,
              Earthstar Geographics). Search:{" "}
              <a
                className="underline underline-offset-2"
                href="https://nominatim.org/"
                rel="noreferrer"
                target="_blank"
              >
                Nominatim
              </a>
              , ©{" "}
              <a
                className="underline underline-offset-2"
                href="https://www.openstreetmap.org/copyright"
                rel="noreferrer"
                target="_blank"
              >
                OpenStreetMap
              </a>
              . Map: MapLibre. Nominatim allows about one search per second.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
