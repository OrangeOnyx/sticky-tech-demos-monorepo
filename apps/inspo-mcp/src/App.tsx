import { useEffect, useState, type FormEvent } from "react"
import { PRESETS } from "../shared/presets.ts"
import type { HealthResponse, StudyMode, StudyResponse } from "../shared/types.ts"
import { StudyPanel } from "@/components/study-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const initialPreset = PRESETS[0]

function isStudyResponse(value: unknown): value is StudyResponse {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    (record.mode === "fixture" || record.mode === "live") &&
    typeof record.match === "string" &&
    typeof record.latencyMs === "number" &&
    Array.isArray(record.exemplars)
  )
}

export default function App() {
  const [presetId, setPresetId] = useState<string | null>(initialPreset?.id ?? null)
  const [brief, setBrief] = useState(initialPreset?.brief ?? "")
  const [mode, setMode] = useState<StudyMode>("fixture")
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [studying, setStudying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StudyResponse | null>(null)

  async function study(nextBrief: string, nextMode: StudyMode) {
    setStudying(true)
    setError(null)
    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode, brief: nextBrief }),
      })
      const payload: unknown = await response.json()
      if (!response.ok || !isStudyResponse(payload)) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Study failed."
        setResult(null)
        setError(message)
        return
      }
      setResult(payload)
    } catch {
      setError("Could not reach the local Inspo API.")
    } finally {
      setStudying(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) throw new Error("health")
        return (await response.json()) as HealthResponse
      })
      .then((payload) => {
        if (!cancelled) setHealth(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setHealthError("Local Inspo API is not reachable. Restart npm run dev.")
        }
      })
    if (initialPreset) {
      fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "fixture", brief: initialPreset.brief }),
      })
        .then(async (response) => {
          const payload: unknown = await response.json()
          if (!response.ok || !isStudyResponse(payload)) return
          if (!cancelled) setResult(payload)
        })
        .catch(() => {
          if (!cancelled) {
            setHealthError("Local Inspo API is not reachable. Restart npm run dev.")
          }
        })
    }
    return () => {
      cancelled = true
    }
  }, [])

  function applyPreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id)
    if (!preset) return
    setPresetId(preset.id)
    setBrief(preset.brief)
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void study(brief, mode)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">Sticky tech demos</p>
          <h1 className="text-2xl font-semibold tracking-tight">Inspo MCP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a UI brief. Fixture mode studies a local snapshot. Live mode asks{" "}
            <span className="text-foreground">inspomcp.dev</span> through the server.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex rounded-lg border border-border p-1" role="group" aria-label="Study mode">
            {(["fixture", "live"] as const).map((value) => (
              <button
                key={value}
                type="button"
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
              ? "Fixture answers stay on this machine. No network and no key."
              : "Live calls the public Inspo MCP. No API key. The browser never talks to it directly."}
          </p>
        </div>
      </header>

      {healthError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {healthError}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
            <CardDescription>
              Plain English. Presets fill a strong match and an empty fixture case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sample briefs">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={presetId === preset.id ? "default" : "outline"}
                    aria-pressed={presetId === preset.id}
                    onClick={() => applyPreset(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="brief">UI brief</Label>
                <Textarea
                  id="brief"
                  value={brief}
                  onChange={(event) => {
                    setPresetId(null)
                    setBrief(event.target.value)
                  }}
                  className="min-h-32"
                  placeholder="minimal SaaS pricing page, dark, generous whitespace"
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={studying}>
                {studying ? "Studying…" : "Study"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {health
                  ? `API ok · ${health.endpoint}`
                  : "Checking the local API…"}
              </p>
            </form>
          </CardContent>
        </Card>

        <StudyPanel result={result} />
      </div>
    </main>
  )
}
