import type { A11yNode } from "./types.ts"
import { isQualifiedRef } from "./commands.ts"

export type TreeItem = {
  path: string
  depth: number
  node: A11yNode
}

export function flattenTree(root: A11yNode): TreeItem[] {
  const items: TreeItem[] = []

  function visit(node: A11yNode, path: string, depth: number) {
    items.push({ path, depth, node })
    node.children?.forEach((child, index) => {
      visit(child, `${path}.${index}`, depth + 1)
    })
  }

  visit(root, "0", 0)
  return items
}

export function interactiveItems(root: A11yNode): TreeItem[] {
  return flattenTree(root).filter((item) => isQualifiedRef(item.node.ref_id ?? ""))
}

export function countRefs(root: A11yNode): number {
  return flattenTree(root).filter((item) => item.node.ref_id).length
}
