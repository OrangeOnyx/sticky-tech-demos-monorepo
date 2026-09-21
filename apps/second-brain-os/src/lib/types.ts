export const PAGE_TYPES = [
  "index",
  "log",
  "source",
  "entity",
  "concept",
  "synthesis",
] as const

export type PageType = (typeof PAGE_TYPES)[number]

export type WikiPage = {
  id: string
  path: string
  title: string
  type: PageType
  body: string
  raw: string
  links: string[]
  ingested?: boolean
}

export type GraphNode = {
  id: string
  title: string
  type: PageType
  ingested?: boolean
}

export type GraphLink = {
  source: string
  target: string
}

export type WikiGraph = {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function isPageType(value: string): value is PageType {
  return (PAGE_TYPES as readonly string[]).includes(value)
}
