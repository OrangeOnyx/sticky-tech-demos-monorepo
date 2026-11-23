import { useState } from "react"
import { Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { commandsForNode } from "../../shared/commands.ts"
import type { A11yNode, CommandLine } from "../../shared/types.ts"

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.setAttribute("readonly", "")
      document.body.append(area)
      area.select()
      const ok = document.execCommand("copy")
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

type CommandPanelProps = {
  snapshotId: string
  node: A11yNode | null
}

export function CommandPanel({ snapshotId, node }: CommandPanelProps) {
  const lines = node ? commandsForNode(node) : []

  return (
    <Card data-testid="command-panel" className="h-fit">
      <CardHeader>
        <CardTitle>Command</CardTitle>
        <CardDescription>
          Snapshot <span className="font-mono">{snapshotId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {node ? (
          <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{node.role}</dd>
            <dt className="text-muted-foreground">Name</dt>
            <dd>{node.name ?? "—"}</dd>
            {node.value ? (
              <>
                <dt className="text-muted-foreground">Value</dt>
                <dd>{node.value}</dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">Actions</dt>
            <dd>{node.available_actions?.join(", ") || "—"}</dd>
            <dt className="text-muted-foreground">States</dt>
            <dd>{node.states?.join(", ") || "—"}</dd>
            <dt className="text-muted-foreground">Ref</dt>
            <dd className="font-mono text-xs break-all">{node.ref_id ?? "none"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Select a node in the tree.</p>
        )}
        {node && lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This node has no ref. Static text and inert containers are not actionable.
          </p>
        ) : null}
        {lines.map((line) => (
          <CommandRow key={line.command} line={line} />
        ))}
        <p className="text-xs text-muted-foreground">
          Commands use the snapshot-qualified ref. A bare @eN is rejected as INVALID_ARGS.
          Text fields use set-value.
        </p>
      </CardContent>
    </Card>
  )
}

function CommandRow({ line }: { line: CommandLine }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const ok = await writeClipboard(line.command)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{line.label}</Badge>
        <Button type="button" variant="outline" size="sm" data-testid="copy-command" onClick={() => void copy()}>
          <Copy data-icon="inline-start" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="font-mono text-xs break-all whitespace-pre-wrap" data-testid="command-line">
        {line.command}
      </pre>
    </div>
  )
}

export function CommandBlock({
  label,
  command,
}: {
  label: string
  command: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const ok = await writeClipboard(command)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button type="button" variant="outline" size="sm" data-testid="copy-command" onClick={() => void copy()}>
          <Copy data-icon="inline-start" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="rounded-lg bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap" data-testid="command-line">
        {command}
      </pre>
    </div>
  )
}
