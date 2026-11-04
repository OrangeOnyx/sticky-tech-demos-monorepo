import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import dagre from "@dagrejs/dagre"
import "@xyflow/react/dist/style.css"

type ModuleData = { label: string; hint: string }
type ModuleNode = Node<ModuleData, "module">

const NODE_WIDTH = 220
const NODE_HEIGHT = 58

function ModuleNodeView({ data }: NodeProps<ModuleNode>) {
  return (
    <div className="flex h-full w-full flex-col justify-center rounded-lg border border-border bg-card px-3 py-2">
      <Handle type="target" position={Position.Left} />
      <div className="truncate text-xs font-medium">{data.label}</div>
      <div className="truncate text-xs text-muted-foreground">{data.hint}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { module: ModuleNodeView }

function layout(nodes: ModuleNode[], edges: Edge[]): ModuleNode[] {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 72 })
  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const edge of edges) graph.setEdge(edge.source, edge.target)
  dagre.layout(graph)
  return nodes.map((node) => {
    const position = graph.node(node.id)
    return {
      ...node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    }
  })
}

export function ModuleGraph({
  nodes,
  edges,
}: {
  nodes: { id: string; label: string; hint: string }[]
  edges: Edge[]
}) {
  const flowNodes: ModuleNode[] = nodes.map((node) => ({
    id: node.id,
    type: "module",
    position: { x: 0, y: 0 },
    data: { label: node.label, hint: node.hint },
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  }))
  const laidOut = layout(flowNodes, edges)
  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-border">
      <ReactFlow
        nodes={laidOut}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
