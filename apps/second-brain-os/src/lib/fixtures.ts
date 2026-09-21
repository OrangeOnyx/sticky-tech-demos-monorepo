import { pageFromMarkdown } from "./vault"
import type { PageType, WikiPage } from "./types"
import { slugify } from "./wikilinks"

export type SampleSource = {
  id: string
  label: string
  hint: string
  text: string
}

export const SAMPLE_SOURCES: SampleSource[] = [
  {
    id: "rag",
    label: "RAG is enough",
    hint: "keyword: RAG",
    text: `# RAG is enough, a wiki is ceremony

Retrieval-augmented generation already searches the raw corpus. Why maintain markdown?

Because tomorrow's question should not pay today's token bill. A wiki files the judgment; RAG re-reads the pile. If the second brain is only a vector index, nothing compounds.

Filed against the llm-wiki claim that maintenance beats retrieval.`,
  },
  {
    id: "obsidian",
    label: "Obsidian graph",
    hint: "keyword: Obsidian",
    text: `Spent an hour in the Obsidian graph view. Local markdown, [[wikilinks]], no cloud.

The human interface for a Karpathy-style vault is still a folder of notes. The agent writes; Obsidian is how you notice orphans.`,
  },
  {
    id: "zettel",
    label: "Atomic notes",
    hint: "keyword: Zettelkasten",
    text: `Zettelkasten / atomic notes: one idea per card, links over folders.

The llm-wiki is that discipline with a model as the clerk. Atomic is the page contract; compounding is what happens if the clerk actually links.`,
  },
]

export type FixtureKind = "rag" | "obsidian" | "zettel" | "generic"

export function matchFixture(raw: string): FixtureKind {
  const text = raw.toLowerCase()
  if (/\brag\b|retrieval[- ]augmented/.test(text)) {
    return "rag"
  }
  if (/obsidian/.test(text)) {
    return "obsidian"
  }
  if (/zettel|atomic note/.test(text)) {
    return "zettel"
  }
  return "generic"
}

function uniqueId(base: string, pages: WikiPage[]): string {
  const slug = slugify(base) || "untitled-source"
  if (!pages.some((page) => page.id === slug)) {
    return slug
  }
  let n = 2
  while (pages.some((page) => page.id === `${slug}-${n}`)) {
    n += 1
  }
  return `${slug}-${n}`
}

function titleFromRaw(raw: string): string {
  const heading = raw.match(/^#\s+(.+)$/m)
  if (heading?.[1]) {
    return heading[1].trim()
  }
  const line = raw
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row.length > 0)
  return line ? line.slice(0, 72) : "Untitled capture"
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

type Draft = {
  slugBase: string
  title: string
  type: PageType
  folder: string
  body: string
}

function specFor(kind: FixtureKind, raw: string): Draft {
  if (kind === "rag") {
    return {
      slugBase: "rag-is-enough",
      title: "RAG is enough",
      type: "source",
      folder: "wiki/sources",
      body: `Fixture LLM (no API) filed this raw note as a source.

The author claims retrieval-augmented generation already replaces a maintained wiki. Record the claim; do not overwrite [[retrieval-vs-maintenance]].

This source argues against [[compounding-wiki]] and should be read next to [[llm-wiki]] and [[raw-vs-wiki]].

## Excerpt

${excerpt(raw)}
`,
    }
  }
  if (kind === "obsidian") {
    return {
      slugBase: "obsidian-graph-view",
      title: "Obsidian graph view",
      type: "source",
      folder: "wiki/sources",
      body: `Fixture LLM (no API) filed a note about using [[obsidian]] as the human graph.

The useful test is the same as this playground: orphans are visible. A page with no edges is not yet in the [[llm-wiki]].

Links: [[compounding-wiki]], [[second-brain-os]].

## Excerpt

${excerpt(raw)}
`,
    }
  }
  if (kind === "zettel") {
    return {
      slugBase: "zettelkasten",
      title: "Zettelkasten",
      type: "concept",
      folder: "wiki/concepts",
      body: `One idea per page, links over folders. The [[llm-wiki]] inherits this from Zettelkasten and from [[obsidian]] culture, then adds a model that is supposed to do the filing.

Atomic notes are a page contract. [[compounding-wiki]] is what you get only if the clerk actually writes the edges.

See [[raw-vs-wiki]] for the archive split.

## Excerpt

${excerpt(raw)}
`,
    }
  }
  const title = titleFromRaw(raw)
  return {
    slugBase: slugify(title) || "untitled-source",
    title,
    type: "source",
    folder: "wiki/sources",
    body: `Fixture LLM (no API) captured a raw inbox note.

Filed under sources and linked into the existing wiki so the graph gains a node and edges, not an orphan.

Connects to [[llm-wiki]] and [[raw-vs-wiki]]. Index: [[index]].

## Excerpt

${excerpt(raw)}
`,
  }
}

function excerpt(raw: string): string {
  const text = raw.trim().replace(/\s+/g, " ")
  return text.length > 420 ? `${text.slice(0, 417)}...` : text
}

function appendLog(page: WikiPage, line: string): WikiPage {
  const body = page.body.endsWith("\n") ? `${page.body}${line}\n` : `${page.body}\n${line}\n`
  return { ...page, body, raw: page.raw.replace(page.body, body), links: page.links }
}

function appendIndex(page: WikiPage, created: WikiPage): WikiPage {
  const heading =
    created.type === "concept"
      ? "## Concepts"
      : created.type === "entity"
        ? "## Entities"
        : created.type === "synthesis"
          ? "## Synthesis"
          : created.type === "source"
            ? "## Sources"
            : "## Ops"
  const bullet = `- [[${created.id}]] — fixture ingest`
  if (page.body.includes(`[[${created.id}]]`)) {
    return page
  }
  const nextBody = page.body.includes(heading)
    ? page.body.replace(heading, `${heading}\n\n${bullet}`)
    : `${page.body}\n\n${heading}\n\n${bullet}\n`
  return {
    ...page,
    body: nextBody,
    raw: page.raw.replace(page.body, nextBody),
    links: page.links.includes(created.id) ? page.links : [...page.links, created.id],
  }
}

export function ingestRaw(
  raw: string,
  pages: WikiPage[],
  date = today(),
): { pages: WikiPage[]; createdId: string; kind: FixtureKind } {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error("Paste or drop a short source first.")
  }
  const kind = matchFixture(trimmed)
  const spec = specFor(kind, trimmed)
  const id = uniqueId(spec.slugBase, pages)
  const path = `${spec.folder}/${id}.md`
  const markdown = `---
title: ${spec.title}
type: ${spec.type}
created: ${date}
updated: ${date}
---

# ${spec.title}

${spec.body}`
  const created: WikiPage = {
    ...pageFromMarkdown(path, markdown),
    ingested: true,
  }
  const logLine = `${date} ingest fixture:${kind} -> [[${id}]]`
  const next = pages.map((page) => {
    if (page.id === "log") {
      return appendLog(page, logLine)
    }
    if (page.id === "index") {
      return appendIndex(page, created)
    }
    return page
  })
  next.push(created)
  return { pages: next, createdId: id, kind }
}
