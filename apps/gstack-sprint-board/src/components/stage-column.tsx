import { CheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FEATURE, type Stage, type StageStatus } from "@/lib/pipeline"

type StageColumnProps = {
  stage: Stage
  status: StageStatus
  onOpen: (stageId: Stage["id"]) => void
}

const statusLabel: Record<StageStatus, string> = {
  pending: "pending",
  active: "active",
  done: "done",
}

export function StageColumn({ stage, status, onOpen }: StageColumnProps) {
  return (
    <section
      className="flex w-[17.5rem] shrink-0 flex-col gap-3"
      data-status={status}
      data-stage={stage.id}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-medium tracking-tight">
            {stage.command}
          </p>
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "done"
                  ? "secondary"
                  : "outline"
            }
          >
            {status === "done" ? (
              <CheckIcon data-icon="inline-start" />
            ) : null}
            {statusLabel[status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{stage.specialist}</p>
      </div>

      <button
        type="button"
        className="rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => onOpen(stage.id)}
        aria-label={`Open ${stage.command} transcript`}
      >
        <Card
          size="sm"
          className={
            status === "active"
              ? "ring-foreground/20"
              : status === "pending"
                ? "opacity-70"
                : undefined
          }
        >
          <CardHeader>
            <CardTitle>
              {status === "active" ? FEATURE.title : stage.specialist}
            </CardTitle>
            <CardDescription>
              {status === "active" ? FEATURE.request : stage.summary}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {stage.teaser}
            </p>
            <p className="pt-3 text-xs text-foreground">Open transcript</p>
          </CardContent>
        </Card>
      </button>
    </section>
  )
}
