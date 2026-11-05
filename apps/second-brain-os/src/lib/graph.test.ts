import { describe, expect, test } from "vitest"
import { buildGraph, pageFromMarkdown } from "./vault"

const index = pageFromMarkdown(
  "wiki/index.md",
  "---\ntitle: Index\ntype: index\n---\n\n# Index\n\n- [[llm-wiki]]\n- [[missing-page]]\n",
)
const concept = pageFromMarkdown(
  "wiki/concepts/llm-wiki.md",
  "---\ntitle: LLM Wiki\ntype: concept\n---\n\n# LLM Wiki\n\nSee [[index]].\n",
)

describe("buildGraph", () => {
  test("nodes are pages; edges are resolved wikilinks", () => {
    const graph = buildGraph([index, concept])
    expect(graph.nodes.map((node) => node.id).sort()).toEqual(["index", "llm-wiki"])
    expect(graph.links).toEqual([
      { source: "index", target: "llm-wiki" },
      { source: "llm-wiki", target: "index" },
    ])
  })

  test("drops dangling wikilinks", () => {
    const graph = buildGraph([index])
    expect(graph.links).toEqual([])
  })
})
