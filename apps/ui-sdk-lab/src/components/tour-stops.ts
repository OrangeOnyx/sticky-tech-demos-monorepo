import {
  createChange,
  createReorder,
  createRovingFocus,
  definePrimitive,
  type ChangeDetails,
  type ReorderDraft,
  type ReorderReason,
} from "@ui-sdk/core"

type TourStopsOptions = {
  value?: string[]
  defaultValue?: string[]
  labels?: Record<string, string>
  onValueChange?: (
    value: string[],
    details: ChangeDetails<ReorderReason>,
  ) => void
}

type TourStopsState = {
  value: string[]
  labels: Record<string, string>
  moving: ReorderDraft | null
  focused: string | null
}

const tourStops = definePrimitive({
  name: "tour-stops",
  options: {
    value: "value",
    defaultValue: "value",
    labels: "value",
    onValueChange: "callback",
  },
  controlled: ["value"],
  state: (options: TourStopsOptions): TourStopsState => ({
    value: options.value ?? options.defaultValue ?? [],
    labels: options.labels ?? {},
    moving: null,
    focused: null,
  }),
  sync: (options) => ({
    ...(options.value === undefined ? {} : { value: options.value }),
    ...(options.labels === undefined ? {} : { labels: options.labels }),
  }),
  api: (context) => {
    const change = createChange(context)
    const reorder = createReorder(context, {
      slot: "item",
      key: "value",
      draft: "moving",
      set: (value, details) => change("value", value, details),
      label: (key) => context.store.get().labels[key],
    })
    const roving = createRovingFocus(context, {
      slot: "item",
      key: "focused",
      orientation: () => "both",
    })

    const resolveKey = (name: string) => {
      const { value, labels } = context.store.get()
      if (value.includes(name)) return name
      const folded = name.toLocaleLowerCase()
      return value.find((key) => labels[key]?.toLocaleLowerCase() === folded)
    }

    return {
      reorder,
      roving,
      stops: () => {
        const { value, labels } = context.store.get()
        return value.map((key) => ({ value: key, label: labels[key] ?? key }))
      },
      moveStop: (name: string, index: number) => {
        const order = context.store.get().value
        const key = resolveKey(name)
        if (!key) {
          const names = order.map((item) => context.store.get().labels[item] ?? item)
          throw new Error(`No stop "${name}". Stops: ${names.join(", ")}.`)
        }
        if (!Number.isInteger(index) || index < 0 || index >= order.length) {
          throw new Error(`Index ${String(index)} is outside 0–${String(order.length - 1)}.`)
        }
        return reorder.move(key, index)
      },
    }
  },
  slots: (slot) => ({
    root: slot({
      role: "listbox",
      keys: {
        none: "Each option handles ArrowUp, ArrowDown, Home, End, Space, and Enter.",
      },
      attrs: () => ({
        "aria-orientation": "vertical",
      }),
    }),
    item: slot<{ value: string }>({
      role: "option",
      props: { value: "string" },
      focus: "roving",
      press: {
        none: "Space and Enter pick the stop up through reorder.keydown.",
      },
      attrs: (state, part) => ({
        "aria-selected": part.api.reorder.moving(state, part.key) ? "true" : "false",
        tabindex: part.api.roving.tabIndex(state, part),
        "data-grabbed": part.api.reorder.dragging(state, part.key) ? "" : undefined,
        "data-moving": part.api.reorder.moving(state, part.key) ? "" : undefined,
      }),
      on: {
        keydown: (event, { el, api, key }) => {
          if (api.reorder.keydown(event, key)) return
          if (el) api.roving.keydown(event, el)
        },
        pointerdown: (event, { api, key }) => api.reorder.pointerdown(event, key),
      },
      bind: (el, part) => {
        const unbindFocus = part.api.roving.bind(el, part)
        const unbindReorder = part.api.reorder.bind(el, part)
        return () => {
          unbindFocus()
          unbindReorder()
        }
      },
    }),
  }),
  agent: {
    actions: ["moveStop"],
    items: (api) => api.stops(),
  },
})

export { tourStops, type TourStopsOptions, type TourStopsState }
