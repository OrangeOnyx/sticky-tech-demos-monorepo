import { ConversationProvider, useConversation } from "@elevenlabs/react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { VoiceShell } from "@/components/voice-shell"
import { createId } from "@/lib/ids"
import type {
  AppConfig,
  ListenMode,
  TranscriptMessage,
  TurnState,
} from "@/lib/types"

async function getConversationToken() {
  const response = await fetch("/api/token")
  const data = (await response.json().catch(() => ({}))) as {
    token?: string
    error?: string
  }

  if (!response.ok || !data.token) {
    throw new Error(data.error || "Failed to get a conversation token.")
  }

  return data.token
}

function LiveVoiceChatInner({ config }: { config: AppConfig }) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [listenMode, setListenMode] = useState<ListenMode>("always")
  const [isStarting, setIsStarting] = useState(false)

  const conversation = useConversation({
    onConnect: () => {
      setError(null)
    },
    onDisconnect: (details) => {
      if (details.reason === "error") {
        setError(details.message)
      }
    },
    onError: (message) => {
      setError(message)
    },
    onMessage: ({ role, message, event_id }) => {
      const content = message.trim()
      if (!content) {
        return
      }

      const nextRole = role === "agent" ? "assistant" : "user"
      const id =
        event_id != null ? `voice-${nextRole}-${event_id}` : createId(nextRole)

      setMessages((current) => {
        const existing = current.find((item) => item.id === id)
        if (!existing) {
          return [
            ...current,
            {
              id,
              role: nextRole,
              content,
              source: "voice",
            },
          ]
        }

        return current.map((item) =>
          item.id === id ? { ...item, content } : item,
        )
      })
    },
  })

  const turn: TurnState =
    conversation.status !== "connected"
      ? "idle"
      : conversation.isSpeaking
        ? "speaking"
        : "listening"

  const startSession = useCallback(async () => {
    setIsStarting(true)
    setError(null)

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const token = await getConversationToken()
      conversation.startSession({
        conversationToken: token,
        overrides: {
          agent: {
            firstMessage: "Hello. Speech Engine is live — talk whenever you want.",
          },
        },
      })
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not start the live session."
      setError(message)
      toast.error(message)
    } finally {
      setIsStarting(false)
    }
  }, [conversation])

  const sendTyped = useCallback(
    (text: string) => {
      const content = text.trim()
      if (!content) {
        return
      }

      conversation.sendUserMessage(content)
      setMessages((current) => [
        ...current,
        {
          id: createId("typed"),
          role: "user",
          content,
          source: "typed",
        },
      ])
    },
    [conversation],
  )

  return (
    <VoiceShell
      config={config}
      status={
        isStarting || conversation.status === "connecting"
          ? "connecting"
          : conversation.status === "connected"
            ? "connected"
            : "disconnected"
      }
      turn={turn}
      messages={messages}
      partial=""
      error={error}
      listenMode={listenMode}
      onListenModeChange={setListenMode}
      isMuted={conversation.isMuted}
      onMutedChange={conversation.setMuted}
      onStart={() => {
        void startSession()
      }}
      onStop={() => {
        void conversation.endSession()
      }}
      onHoldStart={() => {
        if (conversation.isMuted) {
          conversation.setMuted(false)
        }
      }}
      onHoldEnd={() => {
        if (listenMode === "hold") {
          conversation.setMuted(true)
        }
      }}
      onSendTyped={sendTyped}
    />
  )
}

export function LiveVoiceChat({ config }: { config: AppConfig }) {
  return (
    <ConversationProvider>
      <LiveVoiceChatInner config={config} />
    </ConversationProvider>
  )
}
