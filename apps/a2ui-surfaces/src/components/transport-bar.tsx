import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SPEEDS, type Speed } from "../../shared/playback.ts"

type TransportBarProps = {
  cursor: number
  length: number
  playing: boolean
  speed: Speed
  ready: boolean
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onBack: () => void
  onRestart: () => void
  onSpeed: (speed: Speed) => void
}

export function TransportBar({
  cursor,
  length,
  playing,
  speed,
  ready,
  onPlay,
  onPause,
  onStep,
  onBack,
  onRestart,
  onSpeed,
}: TransportBarProps) {
  const atEnd = cursor >= length
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Playback"
    >
      <Button type="button" variant="outline" size="sm" onClick={onRestart} disabled={!ready || cursor === 0}>
        <RotateCcw />
        Restart
      </Button>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Step back" onClick={onBack} disabled={!ready || cursor === 0}>
        <SkipBack />
      </Button>
      {playing ? (
        <Button type="button" size="sm" data-testid="pause" onClick={onPause}>
          <Pause />
          Pause
        </Button>
      ) : (
        <Button type="button" size="sm" data-testid="play" onClick={onPlay} disabled={!ready || length === 0}>
          <Play />
          {atEnd ? "Replay" : "Play"}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Step forward"
        data-testid="step"
        onClick={onStep}
        disabled={!ready || atEnd}
      >
        <SkipForward />
      </Button>
      <div className="flex items-center gap-1" role="group" aria-label="Speed">
        {SPEEDS.map((option) => (
          <Button
            key={option}
            type="button"
            size="xs"
            variant={option === speed ? "default" : "outline"}
            aria-pressed={option === speed}
            onClick={() => onSpeed(option)}
          >
            {option}×
          </Button>
        ))}
      </div>
      <p className="ml-auto text-sm text-muted-foreground" data-testid="progress">
        Message {cursor} of {length}
      </p>
    </div>
  )
}
