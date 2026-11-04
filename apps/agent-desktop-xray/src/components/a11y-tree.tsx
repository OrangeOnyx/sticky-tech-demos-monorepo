import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { interactiveItems } from "../../shared/tree.ts"
import type { A11yNode } from "../../shared/types.ts"

type A11yTreeProps = {
  root: A11yNode
  selectedPath: string | null
  onSelect: (path: string, node: A11yNode) => void
}

export function A11yTree({ root, selectedPath, onSelect }: A11yTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!selectedPath) return
    document.getElementById(`node-${selectedPath}`)?.scrollIntoView({ block: "nearest" })
  }, [selectedPath])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = interactiveItems(root)
    if (items.length === 0) return
    const current = items.findIndex((item) => item.path === selectedPath)
    let nextIndex = current
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = current < 0 ? 0 : Math.min(items.length - 1, current + 1)
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = current < 0 ? items.length - 1 : Math.max(0, current - 1)
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = items.length - 1
    } else {
      return
    }
    event.preventDefault()
    const next = items[nextIndex]
    if (next) onSelect(next.path, next.node)
  }

  return (
    <div
      ref={treeRef}
      role="tree"
      tabIndex={0}
      aria-label="Accessibility tree"
      data-testid="a11y-tree"
      className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onKeyDown={onKeyDown}
    >
      <TreeNodes
        nodes={root.children ?? [root]}
        depth={0}
        pathPrefix="0"
        includeRoot={root.children ? { path: "0", node: root, depth: 0 } : null}
        collapsed={collapsed}
        selectedPath={selectedPath}
        onToggle={(path) => {
          setCollapsed((current) => {
            const next = new Set(current)
            if (next.has(path)) next.delete(path)
            else next.add(path)
            return next
          })
        }}
        onSelect={(path, node) => {
          onSelect(path, node)
          treeRef.current?.focus()
        }}
      />
    </div>
  )
}

function TreeNodes({
  nodes,
  depth,
  pathPrefix,
  includeRoot,
  collapsed,
  selectedPath,
  onToggle,
  onSelect,
}: {
  nodes: A11yNode[]
  depth: number
  pathPrefix: string
  includeRoot: { path: string; node: A11yNode; depth: number } | null
  collapsed: ReadonlySet<string>
  selectedPath: string | null
  onToggle: (path: string) => void
  onSelect: (path: string, node: A11yNode) => void
}) {
  const rows = includeRoot
    ? [{ path: includeRoot.path, node: includeRoot.node, depth: includeRoot.depth }]
    : nodes.map((node, index) => ({
        path: `${pathPrefix}.${index}`,
        node,
        depth,
      }))

  return (
    <div role="group" className="flex flex-col">
      {rows.map((row) => {
        const children = row.node.children ?? []
        const hasChildren = children.length > 0
        const isCollapsed = collapsed.has(row.path)
        const selected = row.path === selectedPath
        return (
          <div key={row.path} className="flex flex-col">
            <div
              id={`node-${row.path}`}
              role="treeitem"
              aria-selected={selected}
              aria-expanded={hasChildren ? !isCollapsed : undefined}
              aria-level={row.depth + 1}
              data-testid="a11y-node"
              data-ref={row.node.ref_id ?? ""}
              data-selected={selected ? "true" : "false"}
              className={cn(
                "flex items-center gap-1 rounded-md py-1 pe-2 text-left text-sm",
                selected ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
              style={{ paddingInlineStart: `${row.depth * 12 + 4}px` }}
              onClick={() => onSelect(row.path, row.node)}
            >
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(row.path)
                  }}
                >
                  {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                </Button>
              ) : (
                <span className="size-6 shrink-0" />
              )}
              <Badge variant="outline">{row.node.role}</Badge>
              {row.node.name ? (
                <span className="min-w-0 truncate">{row.node.name}</span>
              ) : null}
              {row.node.ref_id ? (
                <span className="ms-auto shrink-0 font-mono text-xs text-muted-foreground">
                  {row.node.ref_id}
                </span>
              ) : null}
            </div>
            {hasChildren && !isCollapsed ? (
              <TreeNodes
                nodes={children}
                depth={row.depth + 1}
                pathPrefix={row.path}
                includeRoot={null}
                collapsed={collapsed}
                selectedPath={selectedPath}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
