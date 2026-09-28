import { useEffect, useState, type FormEvent } from "react"
import { PRESETS } from "../shared/presets.ts"
import type { Candidate, JudgeMode, JudgeResponse } from "../shared/types.ts"
import { VerdictPanel } from "@/components/verdict-panel"
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

const initialPreset = PRESETS[0]

function isJudgeResponse(value: unknown): value is JudgeResponse {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return record.mode === "fixture" || record.mode === "live"
    ? typeof record.model === "string" &&
        typeof record.latencyMs === "number" &&
        Boolean(record.answers)
    : false
}

export default function App() {
  const [presetId, setPresetId] = useState<string | null>(initialPreset?.id ?? null)
  const [candidate, setCandidate] = useState<Candidate>(
    initialPreset?.candidate ?? { title: "", url: "", blurb: "" },
  )
  const [mode, setMode] = useState<JudgeMode>("fixture")
  const [liveReady, setLiveReady] = useState<boolean | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [judging, setJudging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JudgeResponse | null>(null)

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
        if (!cancelled) {
          setHealthError("Local judge API is not reachable. Restart npm run dev.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function applyPreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id)
    if (!preset) return
    setPresetId(preset.id)
    setCandidate(preset.candidate)
    setError(null)
  }

  function editCandidate(patch: Partial<Candidate>) {
    setPresetId(null)
    setCandidate((current) => ({ ...current, ...patch }))
  }

  async function onJudge(event: FormEvent) {
    event.preventDefault()
    setJudging(true)
    setError(null)
    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, candidate }),
      })
      const payload: unknown = await response.json()
      if (!response.ok || !isJudgeResponse(payload)) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Judge failed."
        setResult(null)
        setError(message)
        return
      }
      setResult(payload)
    } catch {
      setError("Could not reach the local judge API.")
    } finally {
      setJudging(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">Sticky tech demos</p>
          <h1 className="text-2xl font-semibold tracking-tight">TypeSafe Jev</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Realtime verdicts before you spend other LLM tokens. Fixture mode is local.
            Live mode asks <span className="text-foreground">jev-latest</span> through the
            server.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex rounded-lg border border-border p-1" role="group" aria-label="Judge mode">
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
              ? "Fixture answers stay on this machine. No API key required."
              : liveReady
                ? "A server key is set. Judge will call TypeSafe and show latency and tokens."
                : "Add TYPESAFE_API_KEY to .env and restart before using Live."}
          </p>
        </div>
      </header>

      {healthError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {healthError}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Candidate</CardTitle>
            <CardDescription>
              Title, link, and why it was bookmarked. Presets fill the fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(event) => void onJudge(event)}>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sample presets">
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={candidate.title}
                  onChange={(event) => editCandidate({ title: event.target.value })}
                  placeholder="Working name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={candidate.url}
                  onChange={(event) => editCandidate({ url: event.target.value })}
                  placeholder="https://"
                  inputMode="url"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="blurb">Why bookmarked</Label>
                <Textarea
                  id="blurb"
                  value={candidate.blurb}
                  onChange={(event) => editCandidate({ blurb: event.target.value })}
                  className="min-h-28"
                  placeholder="One or two sentences."
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={judging}>
                {judging ? "Judging…" : "Judge"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <VerdictPanel result={result} />
      </div>

      <p className="text-xs text-muted-foreground">
        Judgments stay in this session. The API key stays on the local server.
      </p>
    </main>
  )
}
