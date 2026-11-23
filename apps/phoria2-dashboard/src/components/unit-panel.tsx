import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"
import type { Month, Unit } from "../../shared/center.ts"
import { buildingForUnit, formatMetric } from "../../shared/metrics.ts"

type UnitPanelProps = {
  unit: Unit | null
  month: Month
  onClear: () => void
}

export function UnitPanel({ unit, month, onClear }: UnitPanelProps) {
  if (!unit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>Click a bay in the yard, or a mark on the chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nothing is selected. Every number in Larkspur Yard is invented.
          </p>
        </CardContent>
      </Card>
    )
  }

  const building = buildingForUnit(unit)
  const active = unit.months.find((entry) => entry.month === month) ?? unit.months[0]
  if (!active) return null
  const rentLabel = active.occupancy === 0 ? "Asking rent" : "Rent / sq ft"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{unit.tenant}</CardTitle>
        <CardDescription>
          {building.name} · {unit.name} · {unit.code}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{unit.use}</Badge>
          <Badge variant="outline">{unit.floor === 1 ? "Ground" : `Floor ${unit.floor}`}</Badge>
          <Badge variant="secondary">{unit.sqft.toLocaleString("en-US")} sq ft</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{unit.note}</p>
        <p className="text-sm">{building.blurb}</p>
        <Separator />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{month} sample</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Occupancy</dt>
            <dd className="text-right tabular-nums">{formatMetric("occupancy", active.occupancy)}</dd>
            <dt className="text-muted-foreground">{rentLabel}</dt>
            <dd className="text-right tabular-nums">{formatMetric("rentPsf", active.rentPsf)}</dd>
            <dt className="text-muted-foreground">Vacancy days</dt>
            <dd className="text-right tabular-nums">
              {formatMetric("vacancyDays", active.vacancyDays)}
            </dd>
          </dl>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Sample months</p>
          <ScrollArea className="h-48">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Month</th>
                  <th className="py-1 pr-2 text-right font-medium">Occ.</th>
                  <th className="py-1 pr-2 text-right font-medium">Rent</th>
                  <th className="py-1 text-right font-medium">Days</th>
                </tr>
              </thead>
              <tbody>
                {unit.months.map((entry) => (
                  <tr
                    key={entry.month}
                    className={cn(entry.month === month && "bg-accent")}
                  >
                    <th className="py-1 pr-2 font-medium">{entry.month}</th>
                    <td className="py-1 pr-2 text-right tabular-nums">
                      {formatMetric("occupancy", entry.occupancy)}
                    </td>
                    <td className="py-1 pr-2 text-right tabular-nums">
                      {formatMetric("rentPsf", entry.rentPsf)}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {formatMetric("vacancyDays", entry.vacancyDays)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear selection
        </Button>
      </CardFooter>
    </Card>
  )
}
