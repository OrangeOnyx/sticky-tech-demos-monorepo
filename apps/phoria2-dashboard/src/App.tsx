import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ChartView } from "@/components/chart-view"
import { UnitPanel } from "@/components/unit-panel"
import { YardView } from "@/components/yard-view"
import {
  METRICS,
  MONTHS,
  type ChartMark,
  type MetricId,
  type Month,
  findBuildingByName,
  findUnit,
  isChartMark,
  isMetricId,
  isMonth,
} from "../shared/center.ts"
import type { ChartRow } from "../shared/metrics.ts"

export default function App() {
  const [metric, setMetric] = useState<MetricId>("occupancy")
  const [mark, setMark] = useState<ChartMark>("bar")
  const [month, setMonth] = useState<Month>("Aug")
  const [unitId, setUnitId] = useState<string | null>("lh-1")
  const unit = unitId ? (findUnit(unitId) ?? null) : null

  function onChartPick(row: ChartRow) {
    if (!isMonth(row.month)) return
    setMonth(row.month)
    const building = findBuildingByName(row.building)
    if (!building) return
    setUnitId((current) => {
      const selected = current ? findUnit(current) : undefined
      if (selected && selected.buildingId === building.id) return current
      return building.units[0]?.id ?? null
    })
  }

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/brand/cc-mark.svg"
              alt=""
              width={42}
              height={40}
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground">Cypress Command</p>
              <h1 className="font-heading text-xl leading-tight font-medium">Larkspur Yard</h1>
            </div>
          </div>
          <Badge variant="secondary">Sample figures</Badge>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Invented occupancy, rent, and vacancy for a fictional retail court. Not a live property.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Metric</span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={metric}
              onValueChange={(value) => {
                if (isMetricId(value)) setMetric(value)
              }}
            >
              {METRICS.map((item) => (
                <ToggleGroupItem key={item.id} value={item.id}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Chart</span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={mark}
              onValueChange={(value) => {
                if (isChartMark(value)) setMark(value)
              }}
            >
              <ToggleGroupItem value="bar">Bars</ToggleGroupItem>
              <ToggleGroupItem value="surface">Surface</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Month</span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={month}
              onValueChange={(value) => {
                if (isMonth(value)) setMonth(value)
              }}
            >
              {MONTHS.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_320px]">
          <ChartView metric={metric} mark={mark} onPick={onChartPick} />
          <YardView metric={metric} month={month} selectedId={unitId} onPick={setUnitId} />
          <UnitPanel unit={unit} month={month} onClear={() => setUnitId(null)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Drawn with{" "}
          <a className="underline underline-offset-4" href="https://kevs3d.co.uk/phoria2/">
            phoria2
          </a>
          . Sample months are Mar–Aug 2026. No key and no network call.
        </p>
      </main>
    </div>
  )
}
