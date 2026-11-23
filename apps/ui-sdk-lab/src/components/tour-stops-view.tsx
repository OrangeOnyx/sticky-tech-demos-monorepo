"use client"

import { useSyncExternalStore } from "react"
import { createParts, usePart, usePrimitive } from "@ui-sdk/react/primitive"
import { tourStops, type TourStopsOptions, type TourStopsState } from "./tour-stops"

const parts = createParts(tourStops, { item: "div" })

type TourStopsViewProps = TourStopsOptions & {
  labels: Record<string, string>
  "aria-labelledby": string
  "aria-describedby": string
}

function TourStopsView({
  labels,
  value,
  defaultValue,
  onValueChange,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
}: TourStopsViewProps) {
  const handle = usePrimitive(tourStops, {
    labels,
    value,
    defaultValue,
    onValueChange,
  })
  const state = useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.instance.get() as TourStopsState,
    () => handle.instance.get() as TourStopsState,
  )
  const order = state.moving?.order ?? state.value

  return usePart(
    handle,
    "root",
    {},
    {
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      children: order.map((id) => (
        <parts.Item key={id} value={id}>
          {labels[id] ?? id}
        </parts.Item>
      )),
    },
    "div",
  )
}

export { TourStopsView }
