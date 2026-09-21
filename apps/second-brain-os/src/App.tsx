import { useEffect, useMemo, useState } from "react"
import { BrainCircuit } from "lucide-react"
import { IngestPanel } from "@/components/ingest-panel"
import { PagePreview } from "@/components/page-preview"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WikiGraph } from "@/components/wiki-graph"
import { ingestRaw } from "@/lib/fixtures"
import { buildGraph, findPage, loadVault } from "@/lib/vault"
import type { WikiPage } from "@/lib/types"

export default function App() {
  const [pages, setPages] = useState<WikiPage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>("llm-wiki")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ingestError, setIngestError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastKind, setLastKind] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadVault()
      .then((loaded) => {
        if (!cancelled) {
          setPages(loaded)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Vault failed to load")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const graph = useMemo(() => buildGraph(pages), [pages])
  const selected = findPage(pages, selectedId)
  const neighborIds = useMemo(() => {
    const ids = new Set<string>()
    if (!selectedId) {
      return ids
    }
    ids.add(selectedId)
    for (const link of graph.links) {
      if (link.source === selectedId) {
        ids.add(link.target)
      }
      if (link.target === selectedId) {
        ids.add(link.source)
      }
    }
    return ids
  }, [graph.links, selectedId])

  function onIngest(raw: string) {
    setBusy(true)
    setIngestError(null)
    window.setTimeout(() => {
      try {
        const result = ingestRaw(raw, pages)
        setPages(result.pages)
        setSelectedId(result.createdId)
        setLastKind(result.kind)
      } catch (error) {
        setIngestError(error instanceof Error ? error.message : "Ingest failed")
      } finally {
        setBusy(false)
      }
    }, 450)
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="size-4 text-muted-foreground" />
          <div>
            <h1 className="font-heading text-sm font-medium tracking-tight">
              Second Brain OS
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Karpathy-style wiki graph · fixture ingest
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="page-count">
            {pages.length} pages
          </Badge>
          <Badge>No API key</Badge>
        </div>
      </header>

      {loadError ? (
        <p className="p-4 text-sm text-destructive">{loadError}</p>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[18rem_minmax(0,1fr)_22rem] lg:overflow-hidden">
          <Card
            size="sm"
            className="h-full rounded-none border-0 border-b py-0 ring-0 lg:border-r lg:border-b-0"
          >
            <IngestPanel
              busy={busy}
              error={ingestError}
              lastKind={lastKind}
              onIngest={onIngest}
            />
          </Card>
          <div className="min-h-0 min-w-0">
            <WikiGraph
              nodes={graph.nodes}
              links={graph.links}
              selectedId={selectedId}
              neighborIds={neighborIds}
              onSelect={setSelectedId}
            />
          </div>
          <Card
            size="sm"
            className="h-full rounded-none border-0 border-t py-0 ring-0 lg:border-t-0 lg:border-l"
          >
            <PagePreview page={selected} pages={pages} onLink={setSelectedId} />
          </Card>
        </div>
      )}

      <Separator />
      <footer className="px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Playground inspired by{" "}
        <a
          className="underline underline-offset-2"
          href="https://github.com/undefined-ui/second-brain-os"
          rel="noreferrer"
          target="_blank"
        >
          undefined-ui/second-brain-os
        </a>{" "}
        (MIT) and{" "}
        <a
          className="underline underline-offset-2"
          href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"
          rel="noreferrer"
          target="_blank"
        >
          Karpathy llm-wiki
        </a>
        . Fixture mode only — no Claude, Obsidian, or MCP.
      </footer>
    </div>
  )
}
