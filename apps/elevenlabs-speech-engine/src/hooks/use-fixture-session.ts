import { useCallback, useRef, useState } from "react"
import { cancelFixtureSpeech, speakFixtureReply } from "@/lib/fixture-audio"
import { createId } from "@/lib/ids"
import { createSpeechRecognition } from "@/lib/recognition"
import { FIXTURE_UTTERANCES, greetingReply, stubReply } from "@/lib/stub-llm"
import type {
  ListenMode,
  SessionStatus,
  TranscriptMessage,
  TurnState,
} from "@/lib/types"

export function useFixtureSession() {
  const [status, setStatus] = useState<SessionStatus>("disconnected")
  const [turn, setTurn] = useState<TurnState>("idle")
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [partial, setPartial] = useState("")
  const [listenMode, setListenMode] = useState<ListenMode>("hold")
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const utteranceIndexRef = useRef(0)
  const holdTranscriptRef = useRef("")

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (!recognition) {
      return
    }
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try {
      recognition.stop()
    } catch {
      recognition.abort()
    }
  }, [])

  const bargeIn = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    cancelFixtureSpeech()
    setTurn("listening")
  }, [])

  const speakAssistant = useCallback(
    async (content: string, id: string) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, content, pending: false } : message,
        ),
      )

      if (isMuted) {
        setTurn("listening")
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setTurn("speaking")
      await speakFixtureReply(content, controller.signal)
      if (!controller.signal.aborted) {
        setTurn("listening")
      }
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    },
    [isMuted],
  )

  const runTurn = useCallback(
    async (userText: string, source: TranscriptMessage["source"]) => {
      const text = userText.trim()
      if (!text) {
        setPartial("")
        setTurn("listening")
        return
      }

      const userMessage: TranscriptMessage = {
        id: createId("user"),
        role: "user",
        content: text,
        source,
      }
      const assistantId = createId("assistant")
      const history = [...messages, userMessage]
        .filter((message) => !message.pending)
        .map((message) => ({ role: message.role, content: message.content }))

      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: assistantId,
          role: "assistant",
          content: "Thinking…",
          pending: true,
        },
      ])
      setPartial("")
      setError(null)

      const reply = stubReply(text, history)
      await speakAssistant(reply, assistantId)
    },
    [messages, speakAssistant],
  )

  const startSession = useCallback(async () => {
    setStatus("connecting")
    setError(null)
    setMessages([])
    setPartial("")

    await new Promise((resolve) => window.setTimeout(resolve, 220))
    setStatus("connected")
    setTurn("speaking")

    const assistantId = createId("assistant")
    const greeting = greetingReply()
    setMessages([
      {
        id: assistantId,
        role: "assistant",
        content: greeting,
        source: "fixture",
      },
    ])
    await speakAssistant(greeting, assistantId)
  }, [speakAssistant])

  const endSession = useCallback(() => {
    stopRecognition()
    abortRef.current?.abort()
    abortRef.current = null
    cancelFixtureSpeech()
    setStatus("disconnected")
    setTurn("idle")
    setPartial("")
  }, [stopRecognition])

  const beginListen = useCallback(() => {
    if (status !== "connected") {
      return
    }

    if (turn === "speaking") {
      bargeIn()
    }

    holdTranscriptRef.current = ""
    setPartial("Listening…")
    setTurn("listening")
    setError(null)
    stopRecognition()

    const recognition = createSpeechRecognition()
    if (!recognition) {
      return
    }

    recognitionRef.current = recognition
    recognition.onresult = (event) => {
      let next = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        next += result[0].transcript
        if (result.isFinal) {
          holdTranscriptRef.current = `${holdTranscriptRef.current} ${result[0].transcript}`.trim()
        }
      }
      setPartial(next.trim() || "Listening…")
    }
    recognition.onerror = (event) => {
      if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Microphone recognition: ${event.error}`)
      }
    }
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }
    }

    try {
      recognition.start()
    } catch {
      setError("Could not start browser speech recognition. Type a line instead.")
    }
  }, [bargeIn, status, stopRecognition, turn])

  const finishListen = useCallback(async () => {
    stopRecognition()
    const heard = holdTranscriptRef.current.trim()
    holdTranscriptRef.current = ""

    if (heard) {
      await runTurn(heard, "voice")
      return
    }

    if (partial && partial !== "Listening…") {
      await runTurn(partial, "voice")
      return
    }

    const fallback =
      FIXTURE_UTTERANCES[utteranceIndexRef.current % FIXTURE_UTTERANCES.length]
    utteranceIndexRef.current += 1
    setPartial(fallback)
    await runTurn(fallback, "fixture")
  }, [partial, runTurn, stopRecognition])

  const sendTyped = useCallback(
    async (text: string) => {
      if (status !== "connected") {
        return
      }
      if (turn === "speaking") {
        bargeIn()
      }
      await runTurn(text, "typed")
    },
    [bargeIn, runTurn, status, turn],
  )

  const playDemoTurn = useCallback(async () => {
    if (status !== "connected") {
      return
    }
    if (turn === "speaking") {
      bargeIn()
    }
    const line =
      FIXTURE_UTTERANCES[utteranceIndexRef.current % FIXTURE_UTTERANCES.length]
    utteranceIndexRef.current += 1
    await runTurn(line, "fixture")
  }, [bargeIn, runTurn, status, turn])

  return {
    status,
    turn,
    messages,
    partial,
    listenMode,
    setListenMode,
    error,
    isMuted,
    setMuted: setIsMuted,
    startSession,
    endSession,
    beginListen,
    finishListen,
    sendTyped,
    playDemoTurn,
  }
}
