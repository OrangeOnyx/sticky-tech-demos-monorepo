import { startGenerate, pollOperation, fetchWorld } from "@/lib/api"
import type { AppConfig, ImageUpload, Operation, World } from "@/lib/types"
import { PlaygroundForm } from "@/components/playground-form"
import { WorldViewer } from "@/components/world-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  config: AppConfig
}

function percentOf(operation: Operation | null): number {
  return operation?.metadata?.progress?.percent ?? (operation?.done ? 100 : 8)
}

export function Playground({ config }: Props) {
  const [operation, setOperation] = useState<Operation | null>(null)
  const [world, setWorld] = useState<World | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current)
    }
  }, [])

  const operationId = operation?.operation_id
  const operationDone = Boolean(operation?.done)
  const operationFailed = Boolean(operation?.error)

  useEffect(() => {
    if (!operationId || operationDone || operationFailed) return

    const tick = async () => {
      try {
        const next = await pollOperation(operationId)
        setOperation(next)
        if (next.error?.message) {
          setError(next.error.message)
          setBusy(false)
          return
        }
        if (next.done) {
          const worldId = next.response?.id || next.metadata?.world_id
          if (worldId) {
            const latest = next.response ?? (await fetchWorld(worldId))
            setWorld(latest)
          }
          setBusy(false)
          toast.success("World ready")
          return
        }
        pollRef.current = window.setTimeout(() => {
          void tick()
        }, config.pollMs)
      } catch (err) {
        setBusy(false)
        setError(err instanceof Error ? err.message : "Polling failed.")
      }
    }

    pollRef.current = window.setTimeout(() => {
      void tick()
    }, config.pollMs)

    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current)
    }
  }, [operationId, operationDone, operationFailed, config.pollMs])

  async function onGenerate(input: {
    text_prompt: string
    display_name: string
    draft: boolean
    auto_enhance: boolean
    images: ImageUpload[]
  }) {
    setError(null)
    setWorld(null)
    setBusy(true)
    try {
      const started = await startGenerate(input)
      setOperation(started)
      if (started.done && started.response) {
        setWorld(started.response)
        setBusy(false)
      }
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : "Generate failed.")
    }
  }

  const statusLabel = useMemo(() => {
    if (error) return "Failed"
    if (world) return "Ready"
    if (busy || (operation && !operation.done)) return "Generating"
    return "Idle"
  }, [busy, error, operation, world])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Belle Realty · OTB
          </p>
          <h1 className="font-heading text-3xl tracking-tight">
            On The Boulevard
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Marble World API playground for the strip at 101–149 Arnould Blvd,
            Lafayette LA. Prompt plus floor plan and satellite go to generate,
            then this page polls until a viewer is ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.mode === "live" ? "default" : "secondary"}>
            {config.mode === "live" ? "Live Marble" : "Fixture mode"}
          </Badge>
          <Badge variant="outline">{statusLabel}</Badge>
        </div>
      </header>

      {config.mode === "fixture" ? (
        <Alert>
          <AlertTitle>No WLT_API_KEY</AlertTitle>
          <AlertDescription>
            Running a local mock of On The Boulevard so generate → poll → view
            still works without a key. Add <code className="text-foreground">WLT_API_KEY</code>{" "}
            for live Marble. Extra photos live on Drive{" "}
            <code className="text-foreground">G:\My Drive\00 OTB</code>.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>Live key is on the Bun server</AlertTitle>
          <AlertDescription>
            The browser never sees <code className="text-foreground">WLT_API_KEY</code>.
            Generation uses credits on your World Labs account.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <PlaygroundForm busy={busy} onGenerate={onGenerate} />

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader className="gap-3">
              <CardTitle>Operation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {operation ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {operation.metadata?.progress?.description ||
                        (operation.done ? "Completed" : "Working…")}
                    </span>
                    <span className="tabular-nums">
                      {percentOf(operation)}%
                    </span>
                  </div>
                  <Progress value={percentOf(operation)} />
                  <p className="font-mono text-xs break-all text-muted-foreground">
                    {operation.operation_id}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate a world to watch status here.
                </p>
              )}
              {error ? (
                <>
                  <Separator />
                  <p className="text-sm text-destructive">{error}</p>
                </>
              ) : null}
            </CardContent>
          </Card>

          <WorldViewer world={world} />
        </div>
      </div>
    </main>
  )
}
