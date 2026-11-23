import { useEffect, useRef, useState } from "react"
import { Group, Label, Lines, Mesh, View, box, grid, plane } from "phoria2"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BUILDINGS,
  METRICS,
  type MetricId,
  type Month,
  type Unit,
  findUnit,
  placements,
} from "../../shared/center.ts"
import { formatMetric, metricColor, metricValue, unitHeight } from "../../shared/metrics.ts"

type YardViewProps = {
  metric: MetricId
  month: Month
  selectedId: string | null
  onPick: (unitId: string) => void
}

type Bay = {
  mesh: Mesh
  unit: Unit
}

export function YardView({ metric, month, selectedId, onPick }: YardViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<View | null>(null)
  const courtRef = useRef<Group | null>(null)
  const baysRef = useRef<Bay[]>([])
  const onPickRef = useRef(onPick)
  const metricRef = useRef(metric)
  const monthRef = useRef(month)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    metricRef.current = metric
    monthRef.current = month
  }, [metric, month])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const view = new View({
      canvas,
      orbit: { minDistance: 8, maxDistance: 32 },
      background: "#f3ede0",
      highlight: "#efe0bd",
      keyboard: true,
      framing: "both",
      description: "Larkspur Yard. Each box is an invented bay.",
    })
    viewRef.current = view
    const court = view.scene.add(new Group({ name: "Larkspur Yard" }))
    courtRef.current = court

    const bays: Bay[] = []
    for (const placement of placements()) {
      const unit = findUnit(placement.id)
      if (!unit) continue
      const value = metricValue(unit, monthRef.current, metricRef.current)
      const height = unitHeight(metricRef.current, value)
      const mesh = new Mesh({
        geometry: box({ width: placement.width, height: 1, depth: placement.depth }),
        material: { color: metricColor(metricRef.current, value), roughness: 0.82 },
        position: [placement.x, height / 2, placement.z],
        scale: [1, height, 1],
        data: unit,
        name: `${unit.code} ${unit.tenant}`,
      })
      court.add(mesh)
      bays.push({ mesh, unit })
    }
    baysRef.current = bays

    for (const building of BUILDINGS) {
      court.add(
        new Label({
          text: building.name,
          position: [building.origin[0], 3.5, building.origin[1]],
          place: "above",
          className: "yard-label",
        }),
      )
    }

    view.scene.add(
      new Mesh({
        geometry: plane({ width: 24, depth: 18 }),
        material: { color: "#e0e8d8", roughness: 1 },
        position: [0, -0.02, 0.2],
        pickable: false,
        name: "Court",
      }),
    )
    view.scene.add(
      new Lines({
        geometry: grid({ size: 24, divisions: 12 }),
        material: { color: "#c6d0bf" },
        position: [0, -0.01, 0.2],
        pickable: false,
      }),
    )

    view.tooltip((hit) => {
      const unit = hit?.datum as Unit | undefined
      if (!unit?.code) return null
      const active = unit.months.find((entry) => entry.month === monthRef.current)
      if (!active) return { title: unit.tenant }
      const activeMetric = metricRef.current
      const label = METRICS.find((item) => item.id === activeMetric)?.label ?? "Value"
      return {
        title: `${unit.code} · ${unit.tenant}`,
        rows: {
          [label]: formatMetric(activeMetric, active[activeMetric]),
        },
      }
    })
    const stop = view.on("click", (hit) => {
      const unit = hit?.datum as Unit | undefined
      if (unit?.id && findUnit(unit.id)) onPickRef.current(unit.id)
    })
    view.frame(court, { padding: 0.2, direction: "perspective" })
    view.start()
    setReady(true)
    return () => {
      stop()
      baysRef.current = []
      courtRef.current = null
      view.dispose()
      viewRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    for (const bay of baysRef.current) {
      const value = metricValue(bay.unit, month, metric)
      const height = unitHeight(metric, value)
      bay.mesh.scale.set(1, height, 1)
      bay.mesh.position.y = height / 2
      bay.mesh.material.color = metricColor(metric, value)
      bay.mesh.outline = bay.unit.id === selectedId ? { color: "#0a1f16", width: 3 } : null
    }
  }, [metric, month, selectedId, ready])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yard · {month}</CardTitle>
        <CardDescription>
          One box per bay. Height follows the selected metric for {month}.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative h-[440px]">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">Click a bay for its invented record.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const court = courtRef.current
            if (!court) return
            viewRef.current?.frame(court, {
              padding: 0.2,
              direction: "perspective",
              duration: 0.45,
            })
          }}
        >
          Reset view
        </Button>
      </CardFooter>
    </Card>
  )
}
