import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactCatalogComponent } from "@a2ui/react/v0_9"
import { MessageProcessor, type ActionPayload, type SurfaceModel } from "@a2ui/web_core/v0_9"
import { propertyCatalog } from "@/catalog/property-catalog.tsx"
import type { A2uiMessage } from "../../shared/protocol.ts"
import { clampCursor, intervalMs, type Speed } from "../../shared/playback.ts"

export type ReplaySurface = SurfaceModel<ReactCatalogComponent>

type ReplaySession = {
  processor: MessageProcessor<ReactCatalogComponent>
  dispose: () => void
}

function openSession(onAction: (action: ActionPayload) => void): ReplaySession {
  const processor = new MessageProcessor<ReactCatalogComponent>([propertyCatalog], onAction)
  return {
    processor,
    dispose: () => processor.dispose(),
  }
}

export function useReplay(messages: readonly A2uiMessage[], autoPlayToken: number) {
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const [surfaces, setSurfaces] = useState<ReplaySurface[]>([])
  const [actions, setActions] = useState<ActionPayload[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const sessionRef = useRef<ReplaySession | null>(null)
  const messagesRef = useRef(messages)
  const cursorRef = useRef(0)

  const publish = useCallback(() => {
    const session = sessionRef.current
    setSurfaces(session ? Array.from(session.processor.getSurfaces().values()) : [])
  }, [])

  useEffect(() => {
    let alive = true
    messagesRef.current = messages
    const session = openSession((action) => {
      if (!alive) return
      setActions((current) => [...current.slice(-7), action])
    })
    sessionRef.current = session
    cursorRef.current = 0
    setCursor(0)
    setPlaying(false)
    setActions([])
    setError(null)
    setReady(true)
    publish()
    return () => {
      alive = false
      sessionRef.current?.dispose()
      sessionRef.current = null
      setReady(false)
    }
  }, [messages, publish])

  const go = useCallback(
    (next: number) => {
      const list = messagesRef.current
      const current = sessionRef.current
      if (!current) return
      const clamped = clampCursor(next, list.length)
      if (clamped === cursorRef.current) return
      try {
        if (clamped === cursorRef.current + 1) {
          current.processor.processMessages([structuredClone(list[cursorRef.current])])
        } else {
          current.dispose()
          const replacement = openSession((action) => {
            setActions((existing) => [...existing.slice(-7), action])
          })
          sessionRef.current = replacement
          if (clamped > 0) {
            replacement.processor.processMessages(structuredClone(list.slice(0, clamped)))
          }
        }
        setError(null)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
        setPlaying(false)
        return
      }
      cursorRef.current = clamped
      setCursor(clamped)
      publish()
    },
    [publish],
  )

  useEffect(() => {
    if (!playing) return
    if (cursor >= messages.length) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(() => go(cursor + 1), intervalMs(speed))
    return () => window.clearTimeout(timer)
  }, [playing, cursor, speed, messages.length, go])

  useEffect(() => {
    if (autoPlayToken === 0) return
    setPlaying(true)
  }, [autoPlayToken])

  const length = messages.length

  return {
    cursor,
    length,
    playing,
    speed,
    surfaces,
    actions,
    error,
    ready,
    play: () => {
      if (cursorRef.current >= messagesRef.current.length) go(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    step: () => {
      setPlaying(false)
      go(cursorRef.current + 1)
    },
    back: () => {
      setPlaying(false)
      go(cursorRef.current - 1)
    },
    restart: () => {
      setPlaying(false)
      go(0)
    },
    setSpeed,
  }
}
