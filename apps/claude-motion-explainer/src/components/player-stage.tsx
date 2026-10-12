import type { RefObject } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { enabledDuration, type ExplainerSpec } from "../../shared/spec.ts"
import { Explainer } from "@/remotion/Explainer"

export function PlayerStage({
  spec,
  playerRef,
}: {
  spec: ExplainerSpec
  playerRef: RefObject<PlayerRef | null>
}) {
  return (
    <div
      className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
      style={{ background: spec.background }}
      data-testid="player-stage"
    >
      <Player
        ref={playerRef}
        component={Explainer}
        inputProps={{ spec }}
        durationInFrames={enabledDuration(spec)}
        fps={spec.fps}
        compositionWidth={spec.width}
        compositionHeight={spec.height}
        acknowledgeRemotionLicense
        controls
        loop
        autoPlay
        style={{ width: "100%" }}
      />
    </div>
  )
}
