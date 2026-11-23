import { ScrollArea } from "@/components/ui/scroll-area"

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <ScrollArea className="h-64 rounded-lg border">
      <pre className="p-3 font-mono text-xs leading-relaxed" data-testid="response-json">
        {JSON.stringify(value, null, 2)}
      </pre>
    </ScrollArea>
  )
}
