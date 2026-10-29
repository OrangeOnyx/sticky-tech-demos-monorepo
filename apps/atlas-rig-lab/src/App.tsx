import { useEffect, useRef, useState } from "react"
import { matchPrimaryClips, type ClipKind } from "../shared/clips.ts"
import { RigViewer } from "@/components/rig-viewer"
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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const SAMPLE_GLB = "/samples/RobotExpressive.glb"
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type Mode = "sample" | "live"
type Phase = "idle" | "uploading" | "queued" | "running" | "downloading" | "ready" | "error"

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Waiting for an image",
  uploading: "Uploading",
  queued: "Queued",
  running: "Running",
  downloading: "Downloading",
  ready: "Ready",
  error: "Error",
}

const PHASE_PROGRESS: Record<Phase, number> = {
  idle: 0,
  uploading: 18,
  queued: 40,
  running: 64,
  downloading: 86,
  ready: 100,
  error: 100,
}

type PrimaryClips = Record<ClipKind, string | null>

const EMPTY_PRIMARY: PrimaryClips = { idle: null, walk: null, run: null }

function imageProblem(file: File): string | null {
  const typeOk =
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    /\.(png|jpe?g|webp)$/i.test(file.name)
  if (!typeOk) return "Image must be PNG, JPEG, or WebP."
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 10 MB or smaller."
  return null
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function errorText(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error
  }
  return fallback
}

export default function App() {
  const [mode, setMode] = useState<Mode>("sample")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [message, setMessage] = useState("Sample mode needs no API key.")
  const [elapsed, setElapsed] = useState(0)
  const [glbUrl, setGlbUrl] = useState<string | null>(null)
  const [clipNames, setClipNames] = useState<string[]>([])
  const [primary, setPrimary] = useState<PrimaryClips>(EMPTY_PRIMARY)
  const [clipName, setClipName] = useState<string | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [liveReady, setLiveReady] = useState<boolean | null>(null)
  const [liveHint, setLiveHint] = useState("Live mode needs ATLAS_STUDIO_* in .env")
  const [pollMs, setPollMs] = useState(3000)
  const [timeoutMs, setTimeoutMs] = useState(300_000)
  const runId = useRef(0)
  const startedAt = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const busy = phase === "uploading" || phase === "queued" || phase === "running" || phase === "downloading"

  useEffect(() => {
    let cancelled = false
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) throw new Error("health")
        return (await response.json()) as {
          liveReady?: boolean
          missing?: string[]
          pollMs?: number
          timeoutMs?: number
        }
      })
      .then((payload) => {
        if (cancelled) return
        setLiveReady(Boolean(payload.liveReady))
        if (payload.pollMs) setPollMs(payload.pollMs)
        if (payload.timeoutMs) setTimeoutMs(payload.timeoutMs)
        if (payload.missing && payload.missing.length > 0) {
          setLiveHint(`Live mode needs ATLAS_STUDIO_* in .env (${payload.missing.join(", ")}).`)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveReady(false)
          setLiveHint("Local API is not reachable. Restart npm run dev before using Live mode.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [busy])

  useEffect(() => {
    return () => {
      runId.current += 1
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function takeFile(next: File | null) {
    if (!next) return
    const problem = imageProblem(next)
    if (problem) {
      setPhase("error")
      setMessage(problem)
      return
    }
    const url = URL.createObjectURL(next)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setFile(next)
    if (phase === "error") {
      setPhase("idle")
      setMessage(mode === "sample" ? "Sample mode needs no API key." : liveHint)
    }
  }

  function beginRun() {
    const id = runId.current + 1
    runId.current = id
    startedAt.current = Date.now()
    setElapsed(0)
    setGlbUrl(null)
    setClipNames([])
    setPrimary(EMPTY_PRIMARY)
    setClipName(null)
    setPlaying(true)
    setPhase("uploading")
    setMessage("Uploading the character image.")
    return id
  }

  async function runSample() {
    const id = beginRun()
    const steps: Array<[Phase, string, number]> = [
      ["uploading", "Uploading the character image.", 350],
      ["queued", "Queued the sample rig.", 400],
      ["running", "Preparing idle, walk, and run.", 400],
      ["downloading", "Loading RobotExpressive.glb.", 350],
    ]
    for (const [nextPhase, nextMessage, delay] of steps) {
      if (runId.current !== id) return
      setPhase(nextPhase)
      setMessage(nextMessage)
      await wait(delay)
    }
    if (runId.current !== id) return
    setGlbUrl(SAMPLE_GLB)
  }

  async function runLive() {
    if (!file) return
    if (!liveReady) {
      setPhase("error")
      setMessage(liveHint)
      return
    }
    const id = beginRun()
    try {
      const body = new FormData()
      body.append("image", file, file.name)
      const created = await fetch("/api/generate", { method: "POST", body })
      const createdPayload: unknown = await created.json()
      if (runId.current !== id) return
      if (!created.ok) throw new Error(errorText(createdPayload, "Atlas AI Studio rejected the image."))
      const executionId =
        createdPayload &&
        typeof createdPayload === "object" &&
        "executionId" in createdPayload &&
        typeof createdPayload.executionId === "string"
          ? createdPayload.executionId
          : ""
      if (!executionId) throw new Error("Atlas AI Studio did not return an execution id.")
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        if (runId.current !== id) return
        const statusResponse = await fetch(`/api/status/${encodeURIComponent(executionId)}`)
        const statusPayload: unknown = await statusResponse.json()
        if (runId.current !== id) return
        if (!statusResponse.ok) {
          throw new Error(errorText(statusPayload, "Atlas AI Studio status failed."))
        }
        const record =
          statusPayload && typeof statusPayload === "object"
            ? (statusPayload as { phase?: string; message?: string; ready?: boolean })
            : {}
        if (record.phase === "error") {
          throw new Error(record.message || "Atlas AI Studio failed the workflow.")
        }
        if (record.ready) {
          setPhase("downloading")
          setMessage("Downloading the rigged GLB.")
          setGlbUrl(`/api/result/${encodeURIComponent(executionId)}`)
          return
        }
        if (record.phase === "running" || record.phase === "queued") {
          setPhase(record.phase)
          setMessage(record.message || PHASE_LABEL[record.phase])
        }
        await wait(pollMs)
      }
      throw new Error("Atlas AI Studio timed out. Rigging can take several minutes.")
    } catch (error) {
      if (runId.current !== id) return
      setGlbUrl(null)
      setPhase("error")
      setMessage(error instanceof Error ? error.message : "Live mode failed.")
    }
  }

  function onGenerate() {
    if (!file || busy) return
    if (mode === "sample") void runSample()
    else void runLive()
  }

  const otherClips = clipNames.filter(
    (name) => name !== primary.idle && name !== primary.walk && name !== primary.run,
  )
  const primaryValue: ClipKind | "" =
    clipName && clipName === primary.idle
      ? "idle"
      : clipName && clipName === primary.walk
        ? "walk"
        : clipName && clipName === primary.run
          ? "run"
          : ""
  const sampleModel = glbUrl === SAMPLE_GLB

  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Atlas Rig Lab</h1>
          <Badge variant="secondary">Atlas AI Studio</Badge>
          <Badge variant="outline">{mode === "sample" ? "Sample" : "Live"}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Drop a character image and view a rigged GLB. This app talks to Atlas AI Studio
          (atlas.design). It is not Orange Ocean Atlas.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Character</CardTitle>
            <CardDescription>
              PNG, JPEG, or WebP, up to 10 MB. Sample mode ignores the pixels and plays the bundled robot.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              className={`flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4 text-center ${dragOver ? "bg-muted" : "bg-background"}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                takeFile(event.dataTransfer.files[0] ?? null)
              }}
            >
              <input
                id="character-image"
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  takeFile(event.target.files?.[0] ?? null)
                  event.target.value = ""
                }}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Selected character" className="size-28 rounded-md object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Drop a PNG, JPEG, or WebP here.</span>
              )}
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                {file ? "Replace image" : "Choose image"}
              </Button>
              {file ? <span className="truncate text-xs text-muted-foreground">{file.name}</span> : null}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Mode</span>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={mode}
                onValueChange={(value) => {
                  if (value === "sample" || value === "live") setMode(value)
                }}
              >
                <ToggleGroupItem value="sample">Sample</ToggleGroupItem>
                <ToggleGroupItem value="live">Live</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {mode === "sample"
                  ? "No key and no network call. Generate waits about 1.5 seconds, then loads the CC0 robot."
                  : liveHint}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{PHASE_LABEL[phase]}</span>
                {busy || phase === "ready" ? (
                  <span className="text-xs text-muted-foreground">{elapsed}s</span>
                ) : null}
              </div>
              <Progress value={PHASE_PROGRESS[phase]} />
              <p className="text-sm text-muted-foreground">{message}</p>
              {phase === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMode("sample")
                    void runSample()
                  }}
                >
                  Try sample
                </Button>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="button" disabled={!file || busy} onClick={onGenerate}>
              {busy ? "Working" : "Generate"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="min-h-[36rem]">
          <CardHeader>
            <CardTitle>Rig</CardTitle>
            <CardDescription>Orbit, switch clips, and show the skeleton.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[28rem] flex-1 flex-col gap-3">
            <RigViewer
              glbUrl={glbUrl}
              clipName={clipName}
              showSkeleton={showSkeleton}
              playing={playing}
              onClips={(names) => {
                const nextPrimary = matchPrimaryClips(names)
                setClipNames(names)
                setPrimary(nextPrimary)
                setClipName(nextPrimary.idle ?? names[0] ?? null)
              }}
              onReady={() => {
                setPhase("ready")
                setMessage(sampleModel ? "Sample rig is ready." : "Atlas AI Studio rig is ready.")
                if (startedAt.current !== null) {
                  setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
                }
              }}
              onError={(reason) => {
                setPhase("error")
                setMessage(reason)
              }}
            />
            <div className="flex flex-col gap-3">
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={primaryValue}
                onValueChange={(value) => {
                  if (value !== "idle" && value !== "walk" && value !== "run") return
                  const next = primary[value]
                  if (next) setClipName(next)
                }}
              >
                <ToggleGroupItem value="idle" disabled={!primary.idle}>
                  Idle
                </ToggleGroupItem>
                <ToggleGroupItem value="walk" disabled={!primary.walk}>
                  Walk
                </ToggleGroupItem>
                <ToggleGroupItem value="run" disabled={!primary.run}>
                  Run
                </ToggleGroupItem>
              </ToggleGroup>
              {otherClips.length > 0 ? (
                <Select
                  value={otherClips.includes(clipName ?? "") ? (clipName ?? "") : ""}
                  onValueChange={setClipName}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Other clips" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {otherClips.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">Other clips appear here after the GLB loads.</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={showSkeleton} onCheckedChange={setShowSkeleton} />
                  Skeleton
                </label>
                <Button type="button" variant="outline" disabled={!glbUrl} onClick={() => setPlaying((value) => !value)}>
                  {playing ? "Pause" : "Play"}
                </Button>
                {glbUrl ? (
                  <Button variant="outline" asChild>
                    <a href={glbUrl} download={sampleModel ? "RobotExpressive.glb" : "atlas-rig.glb"}>
                      Download GLB
                    </a>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled>
                    Download GLB
                  </Button>
                )}
              </div>
              {sampleModel ? (
                <p className="text-xs text-muted-foreground">
                  Sample model RobotExpressive by Tomás Laulhé (Quaternius), CC0 1.0, with modifications by Don McCurdy.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
