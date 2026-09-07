import { VoiceShell } from "@/components/voice-shell"
import { useFixtureSession } from "@/hooks/use-fixture-session"
import type { AppConfig } from "@/lib/types"

export function FixtureVoiceChat({ config }: { config: AppConfig }) {
  const session = useFixtureSession()

  return (
    <VoiceShell
      config={config}
      status={session.status}
      turn={session.turn}
      messages={session.messages}
      partial={session.partial}
      error={session.error}
      listenMode={session.listenMode}
      onListenModeChange={session.setListenMode}
      isMuted={session.isMuted}
      onMutedChange={session.setMuted}
      onStart={() => {
        void session.startSession()
      }}
      onStop={session.endSession}
      onHoldStart={session.beginListen}
      onHoldEnd={() => {
        void session.finishListen()
      }}
      onSendTyped={(text) => {
        void session.sendTyped(text)
      }}
      onDemoTurn={() => {
        void session.playDemoTurn()
      }}
    />
  )
}
