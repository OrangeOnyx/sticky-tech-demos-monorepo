"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@ui-sdk/react/button"
import type { AgentComponent } from "@ui-sdk/react/agent"
import { agent } from "../agent"
import type { ActGate } from "../script/act-gate"
import { showingScript } from "../script/showing-script"

const pauseMs = 700

type ActResult = Awaited<ReturnType<typeof agent.act>>

function visibleSnapshot(): AgentComponent[] {
  return agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more")
}

function AgentPanel({ gate, onReset }: { gate: ActGate; onReset: () => void }) {
  const [cursor, setCursor] = useState(0)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ActResult | null>(null)
  const [snapshot, setSnapshot] = useState<AgentComponent[]>([])
  const playToken = useRef(0)

  useEffect(() => {
    const refresh = () => {
      const next = visibleSnapshot()
      setSnapshot((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      )
    }
    refresh()
    const timer = window.setInterval(refresh, 200)
    const stop = agent.subscribe(refresh)
    return () => {
      window.clearInterval(timer)
      stop()
    }
  }, [])

  async function runAt(index: number): Promise<boolean> {
    const step = showingScript[index]
    if (!step || gate.pending) return false
    const token = playToken.current
    gate.start()
    setBusy(true)
    try {
      const next = await agent.act({
        steps: [{ ref: step.ref, action: step.action, args: step.args }],
      })
      if (playToken.current !== token) return false
      setResult(next)
      setSnapshot(visibleSnapshot())
      if (!next.ok) {
        setError(next.error?.message ?? "The step failed.")
        return false
      }
      setError(null)
      setCursor(index + 1)
      return true
    } finally {
      gate.finish()
      if (!gate.pending) setBusy(false)
    }
  }

  async function play() {
    if (gate.pending) return
    const token = playToken.current + 1
    playToken.current = token
    setRunning(true)
    setError(null)
    for (let index = cursor; index < showingScript.length; index += 1) {
      if (playToken.current !== token) return
      const ok = await runAt(index)
      if (!ok || playToken.current !== token) break
      if (index < showingScript.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs))
      }
    }
    if (playToken.current === token) setRunning(false)
  }

  function reset() {
    playToken.current += 1
    const pending = gate.noteReset()
    setBusy(pending)
    setRunning(false)
    setCursor(0)
    setError(null)
    setResult(null)
    onReset()
    queueMicrotask(() => setSnapshot(visibleSnapshot()))
  }

  const done = cursor >= showingScript.length
  const current = showingScript[cursor]

  return (
    <aside className="panel" aria-label="Agent bridge">
      <div className="panel-head">
        <h2>Agent bridge</h2>
        <p>
          Same calls as the UI SDK console guide: <code>snapshot()</code>, then{" "}
          <code>act</code>. This script has no model.
        </p>
      </div>
      <div className="transport" data-agent-hidden>
        <Button onClick={() => void play()} disabled={running || busy || done}>
          Play
        </Button>
        <Button onClick={() => void runAt(cursor)} disabled={running || busy || done}>
          Step
        </Button>
        <Button onClick={reset}>Reset</Button>
      </div>
      <ol className="steps">
        {showingScript.map((step, index) => {
          const state = index < cursor ? "done" : index === cursor ? "current" : "waiting"
          return (
            <li key={step.id} data-state={state}>
              <span className="step-index">{index + 1}</span>
              <span>
                <span className="step-title">{step.title}</span>
                <code className="step-call">
                  {step.action}({JSON.stringify(step.args).slice(1, -1)}) on {step.ref}
                </code>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="status" role="status" data-error={error ? "" : undefined}>
        {error
          ? error
          : running
            ? `Playing ${current?.title ?? "the script"}.`
            : done
              ? "The script finished. Reset to run it again."
              : `Next: ${current?.title ?? "Reset"}.`}
      </p>
      <h3>Last act</h3>
      <pre>{result ? JSON.stringify(result, null, 2) : "No step yet."}</pre>
      <h3>snapshot()</h3>
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </aside>
  )
}

export { AgentPanel }
