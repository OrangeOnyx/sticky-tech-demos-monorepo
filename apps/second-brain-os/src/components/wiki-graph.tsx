import { useEffect, useMemo, useRef, useState } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { ForceGraphMethods, NodeObject } from "react-force-graph-2d"
import { TYPE_COLORS, TYPE_LABELS } from "@/lib/graph-style"
import { PAGE_TYPES, type GraphLink, type GraphNode } from "@/lib/types"

type Props = {
  nodes: GraphNode[]
  links: GraphLink[]
  selectedId: string | null
  neighborIds: Set<string>
  onSelect: (id: string) => void
}

export function WikiGraph({
  nodes,
  links,
  selectedId,
  neighborIds,
  onSelect,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const graphData = useMemo(
    () => ({
      nodes: nodes.map((node) => ({ ...node })),
      links: links.map((link) => ({ ...link })),
    }),
    [nodes, links],
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) {
      return
    }
    const apply = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) {
      return
    }
    graph.d3Force("charge")?.strength(-220)
    graph.d3Force("link")?.distance(72)
    const timer = window.setTimeout(() => {
      graph.zoomToFit(400, 48)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [nodes.length, links.length])

  return (
    <div
      ref={wrapRef}
      data-testid="wiki-graph"
      className="relative h-full min-h-[22rem] w-full overflow-hidden bg-background"
    >
      {size.w > 0 && size.h > 0 ? (
        <ForceGraph2D<GraphNode>
          ref={graphRef}
          width={size.w}
          height={size.h}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeId="id"
          nodeLabel={(node) => `${node.title} · ${node.type}`}
          linkColor={() => "rgba(245,245,245,0.18)"}
          linkWidth={(link) => {
            const source = idOf(link.source)
            const target = idOf(link.target)
            if (selectedId && (source === selectedId || target === selectedId)) {
              return 1.8
            }
            return 1
          }}
          cooldownTicks={90}
          onNodeClick={(node) => {
            if (node.id) {
              onSelect(String(node.id))
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) =>
            paintNode(node, ctx, globalScale, selectedId, neighborIds)
          }
          nodePointerAreaPaint={(node, color, ctx) => {
            if (node.x == null || node.y == null) {
              return
            }
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, node.ingested ? 10 : 8, 0, Math.PI * 2)
            ctx.fill()
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
        {PAGE_TYPES.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-foreground/10 backdrop-blur-sm"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: TYPE_COLORS[type] }}
            />
            {TYPE_LABELS[type]}
          </span>
        ))}
      </div>
    </div>
  )
}

function idOf(end: unknown): string {
  if (typeof end === "object" && end && "id" in end) {
    return String((end as { id?: string | number }).id)
  }
  return String(end)
}

function paintNode(
  node: NodeObject<GraphNode>,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  selectedId: string | null,
  neighborIds: Set<string>,
) {
  if (node.x == null || node.y == null) {
    return
  }
  const id = String(node.id)
  const selected = id === selectedId
  const dimmed = Boolean(selectedId) && !neighborIds.has(id)
  const radius = node.ingested ? 7 : selected ? 6.5 : 5
  ctx.globalAlpha = dimmed ? 0.28 : 1
  ctx.beginPath()
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = TYPE_COLORS[node.type]
  ctx.fill()
  if (selected || node.ingested) {
    ctx.lineWidth = 2 / Math.max(globalScale, 0.7)
    ctx.strokeStyle = "#fafafa"
    ctx.stroke()
  }
  const fontSize = 12 / globalScale
  ctx.font = `${fontSize}px "Geist Variable", ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillStyle = dimmed ? "rgba(163,163,163,0.5)" : "#d4d4d4"
  ctx.fillText(node.title, node.x, node.y + radius + 3 / globalScale)
  ctx.globalAlpha = 1
}
