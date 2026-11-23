import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LivePanel } from "@/components/live-panel.tsx"
import { MessagePanel } from "@/components/message-panel.tsx"
import { SurfaceStage } from "@/components/surface-stage.tsx"
import { TransportBar } from "@/components/transport-bar.tsx"
import { scenarios } from "@/fixtures/scenarios.ts"
import { useReplay } from "@/player/use-replay.ts"
import type { A2uiMessage } from "../shared/protocol.ts"

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [liveMessages, setLiveMessages] = useState<A2uiMessage[] | null>(null)
  const [autoPlayToken, setAutoPlayToken] = useState(0)
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0]
  const messages = scenarioId === "live" && liveMessages ? liveMessages : scenario.messages
  const replay = useReplay(messages, autoPlayToken)

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3 px-4 py-4">
          <div className="flex items-start gap-3">
            <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5">
              <path d="M10 1.2 17 18.5H3Z" fill="#1f6b45" />
              <path d="M10 7.2 13.4 18.5H6.6Z" fill="#f4faf6" />
            </svg>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                Cypress Command
              </p>
              <h1 className="text-lg font-medium tracking-tight">A2UI surfaces</h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Recorded agent messages, assembled one step at a time with @a2ui/react.
                The property records are invented.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Fixture replay</Badge>
            <Badge variant="outline">v0.9</Badge>
            <a className="text-sm underline underline-offset-4" href="https://a2ui.org">
              a2ui.org
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">
        <Tabs
          value={scenarioId}
          onValueChange={(value) => {
            setScenarioId(value)
          }}
        >
          <TabsList>
            {scenarios.map((item) => (
              <TabsTrigger key={item.id} value={item.id} data-testid={`scenario-${item.id}`}>
                {item.title}
              </TabsTrigger>
            ))}
            <TabsTrigger value="live" data-testid="scenario-live">
              Live stub
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card>
            <CardHeader>
              <CardTitle>
                {scenarioId === "live" ? "Live stub" : scenario.title}
              </CardTitle>
              <CardDescription>
                {scenarioId === "live"
                  ? "A canned stream. No model is contacted."
                  : scenario.detail}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TransportBar
                cursor={replay.cursor}
                length={replay.length}
                playing={replay.playing}
                speed={replay.speed}
                ready={replay.ready}
                onPlay={replay.play}
                onPause={replay.pause}
                onStep={replay.step}
                onBack={replay.back}
                onRestart={replay.restart}
                onSpeed={replay.setSpeed}
              />
              <SurfaceStage
                surfaces={replay.surfaces}
                cursor={replay.cursor}
                error={replay.error}
                actions={replay.actions}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stream</CardTitle>
              <CardDescription>Each A2UI message as it is applied.</CardDescription>
            </CardHeader>
            <CardContent>
              <MessagePanel messages={messages} cursor={replay.cursor} />
            </CardContent>
          </Card>
        </div>
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle>Live stub</CardTitle>
            <CardDescription>
              Optional. Fixtures above do not read the environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LivePanel
              onStream={(next) => {
                setLiveMessages(next)
                setScenarioId("live")
                setAutoPlayToken((token) => token + 1)
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
