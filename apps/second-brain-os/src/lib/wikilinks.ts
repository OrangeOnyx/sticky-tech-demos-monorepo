const WIKILINK = /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g

export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug.slice(0, 48)
}

export function normalizeTarget(target: string): string {
  const leaf = target.split("/").pop() ?? target
  return slugify(leaf)
}

export function parseWikilinks(markdown: string): string[] {
  const seen = new Set<string>()
  const links: string[] = []
  WIKILINK.lastIndex = 0
  for (const match of markdown.matchAll(WIKILINK)) {
    const id = normalizeTarget(match[1] ?? "")
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    links.push(id)
  }
  return links
}

export function parseFrontmatter(raw: string): {
  data: Record<string, string>
  body: string
} {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw }
  }
  const end = raw.indexOf("\n---", 3)
  if (end < 0) {
    return { data: {}, body: raw }
  }
  const yaml = raw.slice(4, end).trim()
  const body = raw.slice(end + 4).replace(/^(?:\r?\n){1,2}/, "")
  const data: Record<string, string> = {}
  for (const line of yaml.split("\n")) {
    const idx = line.indexOf(":")
    if (idx < 0) {
      continue
    }
    const key = line.slice(0, idx).trim()
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^\[|\]$/g, "")
      .replace(/^["']|["']$/g, "")
    if (key) {
      data[key] = value
    }
  }
  return { data, body }
}
