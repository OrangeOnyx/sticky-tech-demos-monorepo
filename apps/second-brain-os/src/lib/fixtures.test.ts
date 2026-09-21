import { describe, expect, test } from "bun:test"
import { ingestRaw, matchFixture, SAMPLE_SOURCES } from "./fixtures"
import { buildGraph, pageFromMarkdown } from "./vault"
import type { WikiPage } from "./types"

function seed(): WikiPage[] {
  return [
    pageFromMarkdown(
      "wiki/index.md",
      "---\ntitle: Index\ntype: index\n---\n\n# Index\n\n## Sources\n\n- [[llm-wiki]]\n",
    ),
    pageFromMarkdown(
      "wiki/log.md",
      "---\ntitle: Log\ntype: log\n---\n\n# Log\n",
    ),
    pageFromMarkdown(
      "wiki/concepts/llm-wiki.md",
      "---\ntitle: LLM Wiki\ntype: concept\n---\n\n# LLM Wiki\n",
    ),
    pageFromMarkdown(
      "wiki/concepts/raw-vs-wiki.md",
      "---\ntitle: Raw vs wiki\ntype: concept\n---\n\n# Raw vs wiki\n",
    ),
    pageFromMarkdown(
      "wiki/synthesis/retrieval-vs-maintenance.md",
      "---\ntitle: Retrieval vs maintenance\ntype: synthesis\n---\n\n# Retrieval vs maintenance\n",
    ),
    pageFromMarkdown(
      "wiki/concepts/compounding-wiki.md",
      "---\ntitle: Compounding wiki\ntype: concept\n---\n\n# Compounding wiki\n",
    ),
    pageFromMarkdown(
      "wiki/entities/obsidian.md",
      "---\ntitle: Obsidian\ntype: entity\n---\n\n# Obsidian\n",
    ),
    pageFromMarkdown(
      "wiki/sources/second-brain-os.md",
      "---\ntitle: second-brain-os\ntype: source\n---\n\n# second-brain-os\n",
    ),
  ]
}

describe("matchFixture", () => {
  test("is deterministic from keywords", () => {
    expect(matchFixture(SAMPLE_SOURCES[0].text)).toBe("rag")
    expect(matchFixture(SAMPLE_SOURCES[1].text)).toBe("obsidian")
    expect(matchFixture(SAMPLE_SOURCES[2].text)).toBe("zettel")
    expect(matchFixture("A shopping list for oat milk.")).toBe("generic")
  })
})

describe("ingestRaw", () => {
  test("adds a page and resolved edges without an API", () => {
    const before = seed()
    const { pages, createdId, kind } = ingestRaw(SAMPLE_SOURCES[0].text, before, "2026-09-21")
    expect(kind).toBe("rag")
    expect(createdId).toBe("rag-is-enough")
    const created = pages.find((page) => page.id === createdId)
    expect(created?.ingested).toBe(true)
    const graph = buildGraph(pages)
    const newEdges = graph.links.filter(
      (link) => link.source === createdId || link.target === createdId,
    )
    expect(newEdges.length).toBeGreaterThan(0)
    const log = pages.find((page) => page.id === "log")
    expect(log?.body).toContain("rag-is-enough")
  })

  test("suffixes ids when the same fixture is ingested twice", () => {
    const once = ingestRaw(SAMPLE_SOURCES[2].text, seed(), "2026-09-21")
    const twice = ingestRaw(SAMPLE_SOURCES[2].text, once.pages, "2026-09-21")
    expect(once.createdId).toBe("zettelkasten")
    expect(twice.createdId).toBe("zettelkasten-2")
  })

  test("rejects empty input", () => {
    expect(() => ingestRaw("   ", seed())).toThrow()
  })
})
