import { useEffect, useRef, useState } from "react"
import { chart } from "phoria2/charts"
import { View } from "phoria2"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { METRICS, type ChartMark, type MetricId } from "../../shared/center.ts"
import { chartSpec, isChartRow, type ChartRow } from "../../shared/metrics.ts"

type ChartViewProps = {
  metric: MetricId
  mark: ChartMark
  onPick: (row: ChartRow) => void
}

export function ChartView({ metric, mark, onPick }: ChartViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<View | null>(null)
  const chartRef = useRef<ReturnType<typeof chart> | null>(null)
  const framedRef = useRef(false)
  const onPickRef = useRef(onPick)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const view = new View({
      canvas,
      orbit: { minDistance: 12, maxDistance: 40 },
      background: "#f3ede0",
      highlight: "#efe0bd",
      keyboard: true,
      framing: "height",
      description: "Larkspur Yard chart. Invented metric by building and month.",
    })
    viewRef.current = view
    const stop = view.on("click", (hit) => {
      if (hit && isChartRow(hit.datum)) onPickRef.current(hit.datum)
    })
    view.start()
    setReady(true)
    return () => {
      stop()
      framedRef.current = false
      chartRef.current = null
      view.dispose()
      viewRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view || !ready) return
    const next = view.scene.add(chart(chartSpec(metric, mark)))
    chartRef.current = next
    if (!framedRef.current) {
      view.frame(next, { padding: 0.62, direction: "perspective" })
      framedRef.current = true
    }
    return () => {
      view.scene.remove(next)
      next.dispose()
      if (chartRef.current === next) chartRef.current = null
    }
  }, [metric, mark, ready])

  const metricLabel = METRICS.find((item) => item.id === metric)?.label ?? "Metric"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mark === "bar" ? "Bars" : "Surface"} · {metricLabel}
        </CardTitle>
        <CardDescription>
          Month across, building in depth. Drag to orbit, right-drag to pan, scroll to zoom.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative h-[440px]">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">Click a mark to choose a building and month.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const node = chartRef.current
            if (!node) return
            viewRef.current?.frame(node, {
              padding: 0.62,
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
