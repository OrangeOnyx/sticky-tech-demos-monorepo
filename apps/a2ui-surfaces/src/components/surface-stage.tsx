import { Component, type ReactNode } from "react"
import { A2uiSurface, MarkdownContext } from "@a2ui/react/v0_9"
import type { ActionPayload } from "@a2ui/web_core/v0_9"
import { renderMarkdown } from "@a2ui/markdown-it"
import type { ReplaySurface } from "@/player/use-replay.ts"

type SurfaceStageProps = {
  surfaces: readonly ReplaySurface[]
  cursor: number
  error: string | null
  actions: readonly ActionPayload[]
  emptyHint?: string
}

type BoundaryState = { message: string | null }

class StageBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  render() {
    if (this.state.message) {
      return <p className="text-sm text-destructive">{this.state.message}</p>
    }
    return this.props.children
  }
}

export function SurfaceStage({ surfaces, cursor, error, actions, emptyHint }: SurfaceStageProps) {
  const latest = actions[actions.length - 1]
  return (
    <div className="a2ui-stage a2ui-light flex min-h-[28rem] flex-col gap-4 rounded-xl bg-[#f4f7f5] p-4" data-testid="stage">
      <StageBoundary key={cursor}>
        {surfaces.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {emptyHint ?? "No surface yet. Play or step the recorded stream."}
          </div>
        ) : (
          <MarkdownContext.Provider value={renderMarkdown}>
            <div className="flex flex-col gap-4">
              {surfaces.map((surface) => (
                <A2uiSurface key={surface.id} surface={surface} />
              ))}
            </div>
          </MarkdownContext.Provider>
        )}
      </StageBoundary>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {latest ? (
        <p className="text-xs text-muted-foreground" data-testid="last-action">
          Renderer action {latest.name}
          {latest.context && Object.keys(latest.context).length > 0
            ? ` · ${JSON.stringify(latest.context)}`
            : ""}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Sample records. Not a live property.</p>
      )}
    </div>
  )
}
