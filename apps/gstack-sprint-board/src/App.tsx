import { useEffect, useRef, useState } from "react"
import { BoardHeader } from "@/components/board-header"
import { PipelineBoard } from "@/components/pipeline-board"
import { StageDrawer } from "@/components/stage-drawer"
import {
  advanceCursor,
  AUTOPLAY_MS,
  isShipped,
  type StageId,
} from "@/lib/pipeline"

export default function App() {
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [autoplayUsed, setAutoplayUsed] = useState(false)
  const [openStage, setOpenStage] = useState<StageId | null>(null)
  const cursorRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [])

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function onAdvance() {
    if (timerRef.current !== null) {
      return
    }
    setCursor((current) => advanceCursor(current))
  }

  function onAutoplay() {
    if (autoplayUsed || isShipped(cursor) || timerRef.current !== null) {
      return
    }
    setAutoplayUsed(true)
    setPlaying(true)
    timerRef.current = window.setInterval(() => {
      const next = advanceCursor(cursorRef.current)
      setCursor(next)
      if (isShipped(next)) {
        stopTimer()
        setPlaying(false)
      }
    }, AUTOPLAY_MS)
  }

  function onReset() {
    stopTimer()
    setPlaying(false)
    setAutoplayUsed(false)
    setCursor(0)
    setOpenStage(null)
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <BoardHeader
        cursor={cursor}
        playing={playing}
        autoplayUsed={autoplayUsed}
        onAdvance={onAdvance}
        onAutoplay={onAutoplay}
        onReset={onReset}
        onOpenStage={setOpenStage}
      />
      <PipelineBoard cursor={cursor} onOpenStage={setOpenStage} />
      <footer className="px-4 py-3 text-[11px] leading-relaxed text-muted-foreground md:px-6">
        Specialists and slash commands from{" "}
        <a
          className="underline underline-offset-2"
          href="https://github.com/garrytan/gstack"
          rel="noreferrer"
          target="_blank"
        >
          garrytan/gstack
        </a>{" "}
        (MIT). This board is a fixture walkthrough of seven demo stages, not the
        full 23-skill catalog, and it does not install Claude Code.
      </footer>
      <StageDrawer
        stageId={openStage}
        onOpenChange={(open) => {
          if (!open) {
            setOpenStage(null)
          }
        }}
      />
    </div>
  )
}
