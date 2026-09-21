import { isPageType, type WikiGraph, type WikiPage } from "./types"
import { parseFrontmatter, parseWikilinks, slugify } from "./wikilinks"

export function idFromPath(path: string): string {
  const file = path.split("/").pop() ?? path
  return slugify(file.replace(/\.md$/i, ""))
}

export function pageFromMarkdown(path: string, raw: string): WikiPage {
  const { data, body } = parseFrontmatter(raw)
  const id = idFromPath(path)
  const title = data.title || id
  const type = isPageType(data.type) ? data.type : "source"
  return {
    id,
    path,
    title,
    type,
    body,
    raw,
    links: parseWikilinks(body),
  }
}

export function resolveLink(
  target: string,
  pages: WikiPage[],
): WikiPage | undefined {
  return (
    pages.find((page) => page.id === target) ??
    pages.find((page) => slugify(page.title) === target)
  )
}

export function buildGraph(pages: WikiPage[]): WikiGraph {
  const nodes = pages.map((page) => ({
    id: page.id,
    title: page.title,
    type: page.type,
    ingested: page.ingested,
  }))
  const links: WikiGraph["links"] = []
  const seen = new Set<string>()
  for (const page of pages) {
    for (const targetId of page.links) {
      const target = resolveLink(targetId, pages)
      if (!target || target.id === page.id) {
        continue
      }
      const key = `${page.id}->${target.id}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      links.push({ source: page.id, target: target.id })
    }
  }
  return { nodes, links }
}

type Manifest = { pages: string[] }

export async function loadVault(baseUrl = "/vault"): Promise<WikiPage[]> {
  const manifestRes = await fetch(`${baseUrl}/manifest.json`)
  if (!manifestRes.ok) {
    throw new Error(`Vault manifest failed: ${manifestRes.status}`)
  }
  const manifest = (await manifestRes.json()) as Manifest
  const paths = manifest.pages ?? []
  const pages = await Promise.all(
    paths.map(async (path) => {
      const res = await fetch(`${baseUrl}/${path}`)
      if (!res.ok) {
        throw new Error(`Missing vault page: ${path}`)
      }
      const raw = await res.text()
      return pageFromMarkdown(path, raw)
    }),
  )
  return pages
}

export function findPage(
  pages: WikiPage[],
  id: string | null,
): WikiPage | undefined {
  if (!id) {
    return undefined
  }
  return pages.find((page) => page.id === id)
}
