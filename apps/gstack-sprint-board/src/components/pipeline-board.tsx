import { StageColumn } from "@/components/stage-column"
import { stageStatus, STAGES, type StageId } from "@/lib/pipeline"

type PipelineBoardProps = {
  cursor: number
  onOpenStage: (stageId: StageId) => void
}

export function PipelineBoard({ cursor, onOpenStage }: PipelineBoardProps) {
  return (
    <div className="flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 pb-6 md:px-6">
      <div className="flex min-h-0 gap-4">
        {STAGES.map((stage, index) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            status={stageStatus(index, cursor)}
            onOpen={onOpenStage}
          />
        ))}
      </div>
    </div>
  )
}
