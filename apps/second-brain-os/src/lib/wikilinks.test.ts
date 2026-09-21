import { describe, expect, test } from "bun:test"
import {
  normalizeTarget,
  parseFrontmatter,
  parseWikilinks,
  slugify,
} from "./wikilinks"

describe("slugify", () => {
  test("normalizes titles to ids", () => {
    expect(slugify("LLM Wiki")).toBe("llm-wiki")
    expect(slugify("Raw vs wiki")).toBe("raw-vs-wiki")
  })
})

describe("parseWikilinks", () => {
  test("extracts unique targets and aliases", () => {
    const md = "See [[llm-wiki]] and [[llm-wiki|the pattern]] plus [[wiki/entities/obsidian]]."
    expect(parseWikilinks(md)).toEqual(["llm-wiki", "obsidian"])
  })

  test("ignores empty", () => {
    expect(parseWikilinks("no links here")).toEqual([])
  })
})

describe("normalizeTarget", () => {
  test("uses the last path segment", () => {
    expect(normalizeTarget("wiki/concepts/Compounding Wiki")).toBe(
      "compounding-wiki",
    )
  })
})

describe("parseFrontmatter", () => {
  test("splits yaml and body", () => {
    const { data, body } = parseFrontmatter(
      "---\ntitle: Index\ntype: index\n---\n\n# Index\n",
    )
    expect(data.title).toBe("Index")
    expect(data.type).toBe("index")
    expect(body.startsWith("# Index")).toBe(true)
  })
})
