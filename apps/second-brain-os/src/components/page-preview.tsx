import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WikiBody } from "@/components/wiki-body"
import { TYPE_COLORS } from "@/lib/graph-style"
import type { WikiPage } from "@/lib/types"
import { resolveLink } from "@/lib/vault"

type Props = {
  page: WikiPage | undefined
  pages: WikiPage[]
  onLink: (id: string) => void
}

export function PagePreview({ page, pages, onLink }: Props) {
  if (!page) {
    return (
      <div
        data-testid="page-preview"
        className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground"
      >
        Click a node to preview.
      </div>
    )
  }

  const outbound = page.links
    .map((id) => resolveLink(id, pages))
    .filter((target): target is WikiPage => Boolean(target))
    .filter((target) => target.id !== page.id)

  return (
    <div data-testid="page-preview" className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: TYPE_COLORS[page.type] }}
          />
          <h2 className="font-heading text-sm font-medium">{page.title}</h2>
          <Badge variant="outline">{page.type}</Badge>
          {page.ingested ? <Badge>fixture</Badge> : null}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">{page.path}</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-3">
          <WikiBody body={page.body} pages={pages} onLink={onLink} />
          {outbound.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {outbound.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => onLink(target.id)}
                >
                  [[{target.id}]]
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
