import { useEffect, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  STAGES,
  transcriptPath,
  type StageId,
} from "@/lib/pipeline"

type StageDrawerProps = {
  stageId: StageId | null
  onOpenChange: (open: boolean) => void
}

type Transcript = {
  stageId: StageId
  markdown: string
  error: string
}

export function StageDrawer({ stageId, onOpenChange }: StageDrawerProps) {
  const stage = STAGES.find((item) => item.id === stageId) ?? null
  const [transcript, setTranscript] = useState<Transcript | null>(null)

  useEffect(() => {
    if (!stageId) {
      return
    }

    const controller = new AbortController()
    const requested = stageId

    void fetch(transcriptPath(requested), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${transcriptPath(requested)}`)
        }
        return response.text()
      })
      .then((markdown) => {
        setTranscript({ stageId: requested, markdown, error: "" })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        const error =
          cause instanceof Error ? cause.message : "Failed to load transcript"
        setTranscript({ stageId: requested, markdown: "", error })
      })

    return () => controller.abort()
  }, [stageId])

  const loading = Boolean(stageId) && transcript?.stageId !== stageId
  const markdown =
    transcript?.stageId === stageId ? transcript.markdown : ""
  const error = transcript?.stageId === stageId ? transcript.error : ""

  return (
    <Sheet open={stageId !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-2xl data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{stage?.command ?? "/stage"}</Badge>
            <Badge variant="secondary">Fixture</Badge>
          </div>
          <SheetTitle>{stage?.specialist ?? "Stage"}</SheetTitle>
          <SheetDescription>{stage?.summary ?? "Transcript"}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4 pb-6">
            {loading ? (
              <div className="flex flex-col gap-3 pt-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : null}
            {error ? (
              <p className="pt-2 text-sm text-destructive">{error}</p>
            ) : null}
            {markdown ? (
              <div className="transcript">
                <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
