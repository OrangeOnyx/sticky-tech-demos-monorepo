import { useEffect, useRef, useState, type FormEvent } from "react"
import type { PlayerRef } from "@remotion/player"
import { buildExplainerSpec } from "../shared/build-spec.ts"
import { FIXTURES } from "../shared/fixtures.ts"
import { formatInt, formatMoney, formatPct, formatRentPerSqft } from "../shared/format.ts"
import { parseRentRoll, type RentRollMetrics } from "../shared/parse.ts"
import {
  explainerSpecSchema,
  startFrameForScene,
  type ExplainerSpec,
  type Scene,
} from "../shared/spec.ts"
import { PlayerStage } from "@/components/player-stage"
import { PropsPanel } from "@/components/props-panel"
import { Timeline } from "@/components/timeline"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Mode = "fixture" | "live"
type Source = "fixture" | "live" | "fallback"

const firstFixture = FIXTURES[0]
if (!firstFixture) throw new Error("Missing sample rent roll.")

function localCut(text: string, propertyName: string) {
  const parsed = parseRentRoll(text, { propertyName })
  if (!parsed.ok) return null
  return { metrics: parsed.metrics, spec: buildExplainerSpec(parsed.metrics) }
}

function requireCut(text: string, propertyName: string) {
  const cut = localCut(text, propertyName)
  if (!cut) throw new Error("Maple Court fixture failed to parse.")
  return cut
}

const starting = requireCut(firstFixture.csv, firstFixture.propertyName)

function isMetrics(value: unknown): value is RentRollMetrics {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.propertyName === "string" &&
    typeof record.occupancyBySqft === "number" &&
    typeof record.totalMonthlyRent === "number" &&
    Array.isArray(record.vacantUnits)
  )
}

export default function App() {
  const playerRef = useRef<PlayerRef>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [fixtureId, setFixtureId] = useState<string | null>(firstFixture.id)
  const [text, setText] = useState(firstFixture.csv)
  const [propertyName, setPropertyName] = useState(firstFixture.propertyName)
  const [mode, setMode] = useState<Mode>("fixture")
  const [spec, setSpec] = useState<ExplainerSpec>(starting.spec)
  const [metrics, setMetrics] = useState<RentRollMetrics>(starting.metrics)
  const [selectedId, setSelectedId] = useState(starting.spec.scenes[0]?.id ?? "title")
  const [source, setSource] = useState<Source>("fixture")
  const [model, setModel] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [liveReady, setLiveReady] = useState<boolean | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) throw new Error("health")
        return (await response.json()) as { liveReady?: boolean }
      })
      .then((payload) => {
        if (!cancelled) setLiveReady(Boolean(payload.liveReady))
      })
      .catch(() => {
        if (!cancelled) setHealthError("Local explainer API is not reachable. Restart npm run dev.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void requestExplain(firstFixture.csv, firstFixture.propertyName, "fixture")
    return () => abortRef.current?.abort()
  }, [])

  async function requestExplain(nextText: string, nextName: string, nextMode: Mode) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode, text: nextText, propertyName: nextName }),
        signal: controller.signal,
      })
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        if (!controller.signal.aborted) setError("The explainer API returned an unreadable response.")
        return
      }
      if (!response.ok || !payload || typeof payload !== "object") {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not build an explainer."
        setError(message)
        return
      }
      const record = payload as Record<string, unknown>
      const parsedSpec = explainerSpecSchema.safeParse(record.spec)
      if (!parsedSpec.success || !isMetrics(record.metrics)) {
        setError(
          typeof record.error === "string" ? record.error : "The explainer spec didn't validate.",
        )
        return
      }
      const nextSource = record.source
      if (nextSource !== "fixture" && nextSource !== "live" && nextSource !== "fallback") {
        setError("The explainer API returned an unexpected payload.")
        return
      }
      setSpec(parsedSpec.data)
      setMetrics(record.metrics)
      setSource(nextSource)
      setModel(typeof record.model === "string" ? record.model : null)
      setWarning(typeof record.warning === "string" ? record.warning : null)
      setSelectedId(parsedSpec.data.scenes[0]?.id ?? "title")
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      setError("Could not reach the local explainer API.")
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  function applyFixture(id: string) {
    const fixture = FIXTURES.find((item) => item.id === id)
    if (!fixture) return
    setFixtureId(fixture.id)
    setText(fixture.csv)
    setPropertyName(fixture.propertyName)
    void requestExplain(fixture.csv, fixture.propertyName, mode)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void requestExplain(text, propertyName, mode)
  }

  function selectScene(id: string) {
    setSelectedId(id)
    const frame = startFrameForScene(spec, id)
    if (frame === null) return
    playerRef.current?.seekTo(frame)
    playerRef.current?.pause()
  }

  function updateScene(next: Scene) {
    setSpec((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => (scene.id === next.id ? next : scene)),
    }))
  }

  const selected = spec.scenes.find((scene) => scene.id === selectedId)
  const sourceLabel =
    source === "live" ? `Live · ${model ?? "model"}` : source === "fallback" ? "Fallback cut" : "Fixture"

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">Rent roll, in motion</p>
          <h1 className="text-2xl font-semibold tracking-tight">Claude Motion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a small commercial roll. Fixture mode builds the explainer on this machine.
            Live mode asks Claude for the cut, through the server.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex rounded-lg border border-border p-1" role="group" aria-label="Explainer mode">
            {(["fixture", "live"] as const).map((value) => (
              <button
                key={value}
                type="button"
                data-testid={`mode-${value}`}
                aria-pressed={mode === value}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                  mode === value ? "bg-foreground text-background" : "text-muted-foreground",
                )}
                onClick={() => setMode(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="max-w-xs text-xs text-muted-foreground">
            {mode === "fixture"
              ? "Fixture cuts stay on this machine. No API key required."
              : liveReady
                ? "A server key is set. Build will call Anthropic and keep the key off this page."
                : "Add ANTHROPIC_API_KEY to .env and restart before using Live."}
          </p>
        </div>
      </header>

      {healthError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {healthError}
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Rent roll</CardTitle>
            <CardDescription>
              Invented samples only. Columns are unit, tenant, sqft, rent, lease_end, status.
              Bullets work too. Expirations count from Oct 12, 2026.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sample rent rolls">
                {FIXTURES.map((fixture) => (
                  <Button
                    key={fixture.id}
                    type="button"
                    size="sm"
                    variant={fixtureId === fixture.id ? "default" : "outline"}
                    data-testid={`preset-${fixture.id}`}
                    onClick={() => applyFixture(fixture.id)}
                  >
                    {fixture.propertyName}
                  </Button>
                ))}
              </div>
              <Label className="flex flex-col items-stretch gap-1.5 font-normal">
                <span>Property</span>
                <Input
                  value={propertyName}
                  data-testid="property-name"
                  onChange={(event) => {
                    setFixtureId(null)
                    setPropertyName(event.target.value)
                  }}
                />
              </Label>
              <Label className="flex flex-col items-stretch gap-1.5 font-normal">
                <span>Roll</span>
                <Textarea
                  value={text}
                  data-testid="rent-roll"
                  spellCheck={false}
                  className="h-64 font-mono text-xs leading-5"
                  onChange={(event) => {
                    setFixtureId(null)
                    setText(event.target.value)
                  }}
                />
              </Label>
              <Button type="submit" data-testid="build" disabled={loading}>
                {loading ? "Building…" : "Build explainer"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Building again replaces timeline edits. The samples are fictional.
              </p>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4" data-testid="metrics">
              <Metric label="Occupied area" value={formatPct(metrics.occupancyBySqft)} testId="metric-occupancy-sqft" />
              <Metric label="Occupied suites" value={formatPct(metrics.occupancyByUnit)} />
              <Metric label="Vacant" value={String(metrics.vacantUnits.length)} />
              <Metric label="Monthly rent" value={formatMoney(metrics.totalMonthlyRent)} testId="metric-rent" />
              <Metric label="Rent / sqft" value={formatRentPerSqft(metrics.avgRentPerSqft)} />
              <Metric
                label="Expiring 3 / 6 / 12"
                value={`${metrics.expirations.within3} / ${metrics.expirations.within6} / ${metrics.expirations.within12}`}
                testId="metric-expiring"
              />
              <div className="col-span-2 text-xs text-muted-foreground">
                {formatInt(metrics.occupiedSqft)} of {formatInt(metrics.totalSqft)} sqft leased · {metrics.propertyName}
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <PlayerStage spec={spec} playerRef={playerRef} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" data-testid="source-label">
              {sourceLabel}
            </p>
            <p className="text-xs text-muted-foreground">Scrub the bar. Edits redraw the current frame.</p>
          </div>
          {warning ? (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm" role="status">
              {warning}
            </p>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Cut</CardTitle>
              <CardDescription>
                Reorder, time, or hide a scene. The panel edits the words and figures in the preview.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <Timeline
                spec={spec}
                selectedId={selectedId}
                onSelect={selectScene}
                onDuration={(id, durationInFrames) => {
                  setSpec((current) => ({
                    ...current,
                    scenes: current.scenes.map((scene) =>
                      scene.id === id ? { ...scene, durationInFrames } : scene,
                    ),
                  }))
                }}
                onToggle={(id) => {
                  setSpec((current) => ({
                    ...current,
                    scenes: current.scenes.map((scene) =>
                      scene.id === id ? { ...scene, enabled: !scene.enabled } : scene,
                    ),
                  }))
                }}
                onMove={(index, direction) => {
                  setSpec((current) => {
                    const nextIndex = index + direction
                    if (nextIndex < 0 || nextIndex >= current.scenes.length) return current
                    const scenes = current.scenes.slice()
                    const [moved] = scenes.splice(index, 1)
                    if (!moved) return current
                    scenes.splice(nextIndex, 0, moved)
                    return { ...current, scenes }
                  })
                }}
              />
              <PropsPanel
                spec={spec}
                scene={selected}
                onSceneChange={updateScene}
                onFrameChange={(patch) => setSpec((current) => ({ ...current, ...patch }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums" data-testid={testId}>
        {value}
      </dd>
    </div>
  )
}
