import { useEffect, useRef, type RefObject } from "react"
import { Map as MapLibreMap, NavigationControl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { LIDAR_LAYER_ID, createMapStyle } from "@/lib/map-style"
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/tiles"

type ElevationMapProps = {
  lidarOpacity: number
  onReadyChange?: (ready: boolean) => void
  mapRef: RefObject<MapLibreMap | null>
}

export function ElevationMap({
  lidarOpacity,
  onReadyChange,
  mapRef,
}: ElevationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const opacityRef = useRef(lidarOpacity)

  useEffect(() => {
    opacityRef.current = lidarOpacity
  }, [lidarOpacity])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const map = new MapLibreMap({
      container,
      style: createMapStyle(opacityRef.current),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxPitch: 0,
      attributionControl: { compact: true },
    })

    map.addControl(new NavigationControl({ showCompass: false }), "top-right")
    mapRef.current = map

    const markReady = () => {
      onReadyChange?.(true)
    }

    if (map.loaded()) {
      markReady()
    } else {
      map.once("load", markReady)
    }

    return () => {
      onReadyChange?.(false)
      mapRef.current = null
      map.remove()
    }
  }, [mapRef, onReadyChange])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer(LIDAR_LAYER_ID)) {
      return
    }
    map.setPaintProperty(LIDAR_LAYER_ID, "raster-opacity", lidarOpacity)
  }, [lidarOpacity, mapRef])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      data-testid="elevation-map"
    />
  )
}
