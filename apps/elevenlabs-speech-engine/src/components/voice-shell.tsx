import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  MicIcon,
  MicOffIcon,
  RadioIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type {
  AppConfig,
  ListenMode,
  SessionStatus,
  TranscriptMessage,
  TurnState,
} from "@/lib/types"

type VoiceShellProps = {
  config: AppConfig
  status: SessionStatus
  turn: TurnState
  messages: TranscriptMessage[]
  partial: string
  error: string | null
  listenMode: ListenMode
  onListenModeChange: (mode: ListenMode) => void
  isMuted: boolean
  onMutedChange: (muted: boolean) => void
  onStart: () => void
  onStop: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
  onSendTyped: (text: string) => void
  onDemoTurn?: () => void
}

function statusLabel(status: SessionStatus, turn: TurnState) {
  if (status === "disconnected") {
    return "Idle"
  }
  if (status === "connecting") {
    return "Connecting"
  }
  if (turn === "speaking") {
    return "Speaking"
  }
  if (turn === "listening") {
    return "Listening"
  }
  return "Connected"
}

export function VoiceShell({
  config,
  status,
  turn,
  messages,
  partial,
  error,
  listenMode,
  onListenModeChange,
  isMuted,
  onMutedChange,
  onStart,
  onStop,
  onHoldStart,
  onHoldEnd,
  onSendTyped,
  onDemoTurn,
}: VoiceShellProps) {
  const [draft, setDraft] = useState("")
  const threadRef = useRef<HTMLDivElement | null>(null)
  const connected = status === "connected"
  const connecting = status === "connecting"

  useEffect(() => {
    const thread = threadRef.current
    if (!thread) {
      return
    }
    thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" })
  }, [messages, partial])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !connected) {
      return
    }
    onSendTyped(text)
    setDraft("")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center px-4 py-8">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Speech Engine voice chat</CardTitle>
              <CardDescription>
                Mic in, stub LLM, spoken reply. Live transcripts and barge-in
                on one page.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={config.mode === "fixture" ? "secondary" : "default"}>
                {config.mode === "fixture" ? "Fixture mode" : "Live key"}
              </Badge>
              <Badge variant="outline">{statusLabel(status, turn)}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {config.mode === "fixture" ? (
            <Alert>
              <RadioIcon />
              <AlertTitle>No ElevenLabs key — running locally</AlertTitle>
              <AlertDescription>
                Transcripts, turn-taking, and audio are stubbed so the UI still
                works. Add <code>ELEVENLABS_API_KEY</code> plus a Speech Engine
                ID for the live WebRTC path.
              </AlertDescription>
            </Alert>
          ) : null}

          {config.mode === "live" && !config.liveReady ? (
            <Alert variant="destructive">
              <AlertTitle>Live mode is not ready</AlertTitle>
              <AlertDescription>
                The API key is present, but <code>ELEVENLABS_SPEECH_ENGINE_ID</code>{" "}
                is missing. Create an engine (see README) or remove the key to
                stay in fixture mode.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Session error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {connected ? (
              <>
                <Button variant="outline" onClick={onStop}>
                  <SquareIcon data-icon="inline-start" />
                  End
                </Button>
                <Button
                  variant={isMuted ? "secondary" : "outline"}
                  onClick={() => onMutedChange(!isMuted)}
                >
                  {isMuted ? (
                    <MicOffIcon data-icon="inline-start" />
                  ) : (
                    <MicIcon data-icon="inline-start" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
              </>
            ) : (
              <Button onClick={onStart} disabled={connecting}>
                <RadioIcon data-icon="inline-start" />
                {connecting ? "Starting…" : "Start conversation"}
              </Button>
            )}

            {onDemoTurn && connected && config.mode === "fixture" ? (
              <Button variant="secondary" onClick={onDemoTurn}>
                <SparklesIcon data-icon="inline-start" />
                Play demo turn
              </Button>
            ) : null}
          </div>

          <ToggleGroup
            type="single"
            value={listenMode}
            onValueChange={(value) => {
              if (value === "hold" || value === "always") {
                onListenModeChange(value)
              }
            }}
            variant="outline"
            size="sm"
            disabled={!connected}
            spacing={0}
          >
            <ToggleGroupItem value="hold">Hold to talk</ToggleGroupItem>
            <ToggleGroupItem value="always">Always listen</ToggleGroupItem>
          </ToggleGroup>

          <ScrollArea className="h-80 rounded-xl border">
            <div ref={threadRef} className="flex flex-col gap-3 p-4">
              {messages.length === 0 && !partial ? (
                <Empty className="min-h-64 border-none">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MicIcon />
                    </EmptyMedia>
                    <EmptyTitle>No turns yet</EmptyTitle>
                    <EmptyDescription>
                      Start a conversation, then hold the mic, type a line, or
                      play a fixture turn.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <p className="text-xs opacity-70">
                        {message.role === "user" ? "You" : "Assistant"}
                        {message.source === "fixture" ? " · fixture" : ""}
                        {message.source === "typed" ? " · typed" : ""}
                        {message.source === "voice" ? " · voice" : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </article>
                ))
              )}
              {partial ? (
                <article className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl bg-primary/15 px-3 py-2 text-sm text-muted-foreground">
                    {partial}
                  </div>
                </article>
              ) : null}
            </div>
          </ScrollArea>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="min-w-48"
              disabled={!connected}
              onPointerDown={(event) => {
                if (!connected || listenMode !== "hold") {
                  return
                }
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                onHoldStart()
              }}
              onPointerUp={() => {
                if (listenMode === "hold") {
                  void onHoldEnd()
                }
              }}
              onClick={() => {
                if (!connected || listenMode !== "always") {
                  return
                }
                if (turn === "speaking") {
                  onHoldStart()
                  return
                }
                onHoldStart()
                window.setTimeout(() => {
                  void onHoldEnd()
                }, 900)
              }}
            >
              <MicIcon data-icon="inline-start" />
              {listenMode === "hold" ? "Hold to talk" : "Tap to speak"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Speaking while the assistant talks barges in and cancels playback.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="composer">Type a turn</FieldLabel>
                <ButtonGroup className="w-full">
                  <Textarea
                    id="composer"
                    value={draft}
                    rows={3}
                    disabled={!connected}
                    placeholder={
                      connected
                        ? "Type instead of speaking…"
                        : "Start a conversation first"
                    }
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                  />
                  <Button type="submit" disabled={!connected || !draft.trim()}>
                    Send
                  </Button>
                </ButtonGroup>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          {config.mode === "live"
            ? "Live: browser mic → ElevenLabs Speech Engine → stub LLM → spoken reply."
            : "Fixture: local stub transcripts and browser speech, no ElevenLabs calls."}
        </CardFooter>
      </Card>
    </main>
  )
}
