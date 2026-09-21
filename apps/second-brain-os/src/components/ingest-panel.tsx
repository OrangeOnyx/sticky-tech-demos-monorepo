import { useState, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_SOURCES } from "@/lib/fixtures"

type Props = {
  busy: boolean
  error: string | null
  lastKind: string | null
  onIngest: (raw: string) => void
}

export function IngestPanel({ busy, error, lastKind, onIngest }: Props) {
  const [text, setText] = useState("")
  const [dragOver, setDragOver] = useState(false)

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (!file) {
      return
    }
    const next = await file.text()
    setText(next)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="space-y-1">
        <Label htmlFor="ingest-raw">Mock ingest</Label>
        <p className="text-xs text-muted-foreground">
          Paste or drop a short source. A fixture LLM step (no API keys) files a
          wiki page and updates the graph.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_SOURCES.map((sample) => (
          <Button
            key={sample.id}
            type="button"
            size="xs"
            variant="outline"
            data-testid={`sample-${sample.id}`}
            onClick={() => setText(sample.text)}
          >
            {sample.label}
          </Button>
        ))}
      </div>
      <div
        className={
          dragOver
            ? "min-h-0 flex-1 rounded-lg ring-2 ring-ring"
            : "min-h-0 flex-1"
        }
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Textarea
          id="ingest-raw"
          data-testid="ingest-textarea"
          className="h-full min-h-40 resize-none"
          value={text}
          placeholder="Drop a .md / .txt file, or paste a paragraph…"
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <Button
        data-testid="ingest-submit"
        disabled={busy || text.trim().length === 0}
        onClick={() => onIngest(text)}
      >
        {busy ? "Filing…" : "Run fixture ingest"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" data-testid="ingest-error">
          {error}
        </p>
      ) : lastKind ? (
        <p className="text-xs text-muted-foreground" data-testid="ingest-status">
          Filed with fixture:{lastKind}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Try a sample chip — each keyword route is deterministic.
        </p>
      )}
    </div>
  )
}
