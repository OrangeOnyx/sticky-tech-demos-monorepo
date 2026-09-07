import { lazy, Suspense, useEffect, useState } from "react"
import { FixtureVoiceChat } from "@/components/fixture-voice-chat"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAppConfig } from "@/lib/config"
import type { AppConfig } from "@/lib/types"

const LiveVoiceChat = lazy(async () => {
  const module = await import("@/components/live-voice-chat")
  return { default: module.LiveVoiceChat }
})

const fixtureFallback: AppConfig = {
  mode: "fixture",
  liveReady: false,
  hasApiKey: false,
  hasEngineId: false,
  hasPublicWs: false,
  hasOpenAi: false,
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchAppConfig()
      .then((next) => {
        if (!cancelled) {
          setConfig(next)
        }
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not reach the local API. Falling back to fixture mode.",
        )
        setConfig(fixtureFallback)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!config) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-3 px-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  return (
    <>
      {loadError ? (
        <div className="mx-auto w-full max-w-2xl px-4 pt-6">
          <Alert>
            <AlertTitle>Using fixture fallback</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {config.mode === "live" ? (
        <Suspense
          fallback={
            <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-3 px-4">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-96 w-full" />
            </main>
          }
        >
          <LiveVoiceChat config={config} />
        </Suspense>
      ) : (
        <FixtureVoiceChat config={config} />
      )}
    </>
  )
}
