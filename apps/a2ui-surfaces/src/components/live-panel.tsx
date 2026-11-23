import { useState } from "react"
import { Button } from "@/components/ui/button"
import { buildLiveStub, liveAgentEnabled } from "../../shared/live.ts"
import type { A2uiMessage } from "../../shared/protocol.ts"

type LivePanelProps = {
  onStream: (messages: A2uiMessage[]) => void
}

export function LivePanel({ onStream }: LivePanelProps) {
  const enabled = liveAgentEnabled(import.meta.env.VITE_A2UI_LIVE_AGENT_KEY)
  const [prompt, setPrompt] = useState("Check the west closet at Harbor Elm Court")

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="live-off">
        Live stub is off. Recorded fixtures run with no key. Set{" "}
        <code>VITE_A2UI_LIVE_AGENT_KEY</code> in a <code>.env</code> file to any non-empty
        value to enable a canned reply. See <code>.env.example</code>. The stub does not call a model.
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-2"
      data-testid="live-on"
      onSubmit={(event) => {
        event.preventDefault()
        onStream(buildLiveStub(prompt))
      }}
    >
      <label className="text-sm font-medium" htmlFor="live-prompt">
        Ask the stub
      </label>
      <textarea
        id="live-prompt"
        className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div>
        <Button type="submit" size="sm">
          Stream stub
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        This reply is recorded in the browser. The key only unlocks the control.
      </p>
    </form>
  )
}
