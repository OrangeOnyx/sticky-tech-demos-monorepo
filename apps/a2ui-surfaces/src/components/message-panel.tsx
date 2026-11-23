import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { messageKind, messageSummary, type A2uiMessage } from "../../shared/protocol.ts"

type MessagePanelProps = {
  messages: readonly A2uiMessage[]
  cursor: number
}

export function MessagePanel({ messages, cursor }: MessagePanelProps) {
  const currentRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  return (
    <ScrollArea className="h-[32rem]">
      <ol className="flex flex-col gap-2 pr-3" data-testid="message-list">
        {messages.map((message, index) => {
          const applied = index < cursor
          const current = index === cursor - 1
          const kind = messageKind(message)
          return (
            <li
              key={`${index}-${kind}`}
              ref={current ? currentRef : undefined}
              data-applied={applied ? "true" : "false"}
              className={
                current
                  ? "rounded-lg border border-primary/40 bg-primary/5 p-3"
                  : applied
                    ? "rounded-lg border p-3"
                    : "rounded-lg border border-dashed p-3 opacity-50"
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={current ? "default" : "outline"}>{index + 1}</Badge>
                <span className="text-xs font-medium">{kind}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {applied ? "applied" : "pending"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{messageSummary(message)}</p>
              {applied ? (
                <pre className="mt-2 max-h-48 overflow-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(message, null, 2)}
                </pre>
              ) : null}
            </li>
          )
        })}
      </ol>
    </ScrollArea>
  )
}
