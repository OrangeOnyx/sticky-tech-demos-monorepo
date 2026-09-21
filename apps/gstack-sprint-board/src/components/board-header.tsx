import {
  CheckIcon,
  CircleIcon,
  LoaderCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FEATURE,
  isShipped,
  progressLabel,
  progressRatio,
  STAGES,
  stageStatus,
  type StageId,
} from "@/lib/pipeline"

type BoardHeaderProps = {
  cursor: number
  playing: boolean
  autoplayUsed: boolean
  onAdvance: () => void
  onAutoplay: () => void
  onReset: () => void
  onOpenStage: (stageId: StageId) => void
}

export function BoardHeader({
  cursor,
  playing,
  autoplayUsed,
  onAdvance,
  onAutoplay,
  onReset,
  onOpenStage,
}: BoardHeaderProps) {
  const shipped = isShipped(cursor)
  const ratio = progressRatio(cursor)

  return (
    <header className="flex flex-col gap-4 px-4 pt-4 md:px-6 md:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-2xl flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-base font-medium tracking-tight md:text-lg">
              gstack sprint board
            </h1>
            <Badge variant="outline">Fixture mode</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Walk Garry Tan’s specialist flow with canned transcripts. Feature:{" "}
            <span className="text-foreground">{FEATURE.title}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onAdvance}
            disabled={playing || shipped}
          >
            Advance
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onAutoplay}
            disabled={playing || autoplayUsed || shipped}
          >
            Autoplay once
          </Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{progressLabel(cursor)}</span>
          <span>{Math.round(ratio * 100)}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
          aria-label="Sprint progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <ol className="flex flex-wrap items-center gap-1">
          {STAGES.map((stage, index) => {
            const status = stageStatus(index, cursor)
            return (
              <li key={stage.id} className="flex items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant={status === "active" ? "secondary" : "ghost"}
                  onClick={() => onOpenStage(stage.id)}
                >
                  {status === "done" ? (
                    <CheckIcon data-icon="inline-start" />
                  ) : status === "active" ? (
                    <LoaderCircleIcon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <CircleIcon data-icon="inline-start" />
                  )}
                  {stage.command}
                </Button>
                {index < STAGES.length - 1 ? (
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
      <Separator />
    </header>
  )
}
