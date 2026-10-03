import { describe, expect, test } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { pageFromMarkdown } from "./vault"
import { parseWikilinks } from "./wikilinks"

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listMarkdown(path)))
    } else if (entry.name.endsWith(".md")) {
      files.push(path)
    }
  }
  return files
}

describe("sample vault", () => {
  test("ships at least 8 linked markdown pages", async () => {
    const root = join(import.meta.dirname, "../../public/vault")
    const files = await listMarkdown(root)
    expect(files.length).toBeGreaterThanOrEqual(8)
    const pages = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(file, "utf8")
        return pageFromMarkdown(file, raw)
      }),
    )
    const withLinks = pages.filter((page) => parseWikilinks(page.body).length > 0)
    expect(withLinks.length).toBeGreaterThanOrEqual(8)
  })
})
