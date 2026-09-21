import type { ReactNode } from "react"
import { Fragment } from "react"
import { resolveLink } from "@/lib/vault"
import type { WikiPage } from "@/lib/types"
import { normalizeTarget } from "@/lib/wikilinks"

type Props = {
  body: string
  pages: WikiPage[]
  onLink: (id: string) => void
}

const WIKILINK = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g

export function WikiBody({ body, pages, onLink }: Props) {
  const blocks = splitBlocks(body)
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => (
        <Block key={index} block={block} pages={pages} onLink={onLink} />
      ))}
    </div>
  )
}

function splitBlocks(body: string): string[] {
  const blocks: string[] = []
  const lines = body.replace(/\r\n/g, "\n").split("\n")
  let buf: string[] = []
  let inCode = false
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        buf.push(line)
        blocks.push(buf.join("\n"))
        buf = []
        inCode = false
      } else {
        if (buf.length) {
          blocks.push(buf.join("\n"))
          buf = []
        }
        buf.push(line)
        inCode = true
      }
      continue
    }
    if (inCode) {
      buf.push(line)
      continue
    }
    if (line.trim() === "") {
      if (buf.length) {
        blocks.push(buf.join("\n"))
        buf = []
      }
      continue
    }
    const isList = /^[-*]\s/.test(line) || /^\d+\.\s/.test(line)
    const prevList = buf.length > 0 && (/^[-*]\s/.test(buf[0]) || /^\d+\.\s/.test(buf[0]))
    if (buf.length && isList !== prevList) {
      blocks.push(buf.join("\n"))
      buf = []
    }
    buf.push(line)
  }
  if (buf.length) {
    blocks.push(buf.join("\n"))
  }
  return blocks
}

function Block({
  block,
  pages,
  onLink,
}: {
  block: string
  pages: WikiPage[]
  onLink: (id: string) => void
}) {
  if (block.startsWith("```")) {
    const inner = block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground">
        <code>{inner}</code>
      </pre>
    )
  }
  if (block.startsWith("### ")) {
    return <h3 className="font-heading text-sm font-medium">{inline(block.slice(4), pages, onLink)}</h3>
  }
  if (block.startsWith("## ")) {
    return <h2 className="font-heading text-sm font-medium">{inline(block.slice(3), pages, onLink)}</h2>
  }
  if (block.startsWith("# ")) {
    return <h1 className="font-heading text-base font-medium">{inline(block.slice(2), pages, onLink)}</h1>
  }
  if (/^[-*]\s/.test(block) || /^\d+\.\s/.test(block)) {
    const items = block.split("\n")
    return (
      <ul className="list-disc space-y-1 pl-4">
        {items.map((item, index) => (
          <li key={index}>
            {inline(item.replace(/^([-*]|\d+\.)\s/, ""), pages, onLink)}
          </li>
        ))}
      </ul>
    )
  }
  return <p>{inline(block, pages, onLink)}</p>
}

function inline(
  text: string,
  pages: WikiPage[],
  onLink: (id: string) => void,
): ReactNode[] {
  const parts = text.split(INLINE).filter((part) => part.length > 0)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    WIKILINK.lastIndex = 0
    const wiki = WIKILINK.exec(part)
    if (wiki) {
      const target = normalizeTarget(wiki[1] ?? "")
      const label = wiki[2] || wiki[1] || target
      const resolved = resolveLink(target, pages)
      if (!resolved) {
        return (
          <span key={index} className="text-muted-foreground">
            {label}
          </span>
        )
      }
      return (
        <button
          key={index}
          type="button"
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          onClick={() => onLink(resolved.id)}
        >
          {label}
        </button>
      )
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}
