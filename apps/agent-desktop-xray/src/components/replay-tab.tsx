import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { A11yTree } from "@/components/a11y-tree"
import { CommandBlock } from "@/components/command-panel"
import { JsonBlock } from "@/components/json-block"
import { replaySteps } from "@/fixtures/demo-notes.ts"
import { detectStaleRef, refSnapshotId } from "../../shared/commands.ts"

export function ReplayTab() {
  const [index, setIndex] = useState(0)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const step = replaySteps[index] ?? replaySteps[0]
  const stale = detectStaleRef(step.response)
  const commandSnapshot = refSnapshotId(step.command.match(/@[A-Za-z0-9]+:e[1-9][0-9]*/)?.[0] ?? "")

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>Refs are snapshot-qualified</AlertTitle>
        <AlertDescription>
          A ref looks like @s8f3k2p9:e8. Bare @e8 is INVALID_ARGS. After the UI changes, an old
          ref comes back as STALE_REF or AMBIGUOUS_TARGET instead of hitting whatever now sits
          in that spot. Take a new snapshot and use its refs. agent-desktop has no model inside;
          this loop belongs to the agent.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="replay-prev"
            disabled={index === 0}
            onClick={() => {
              setIndex((current) => Math.max(0, current - 1))
              setSelectedPath(null)
            }}
          >
            Prev
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="replay-next"
            disabled={index === replaySteps.length - 1}
            onClick={() => {
              setIndex((current) => Math.min(replaySteps.length - 1, current + 1))
              setSelectedPath(null)
            }}
          >
            Next
          </Button>
        </div>
        <p className="text-sm" data-testid="replay-step">
          Step {index + 1} of {replaySteps.length} — {step.title}
        </p>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Command</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CommandBlock label="This step" command={step.command} />
              {step.followUpCommand ? (
                <CommandBlock label="Working ref" command={step.followUpCommand} />
              ) : null}
              <p className="text-sm text-muted-foreground">{step.caption}</p>
            </CardContent>
          </Card>

          {stale ? (
            <Alert variant="destructive" data-testid="stale-error">
              <TriangleAlert />
              <AlertTitle>STALE_REF</AlertTitle>
              <AlertDescription>
                {commandSnapshot
                  ? `Ref snapshot ${commandSnapshot} is not the active tree ${step.snapshot.data.snapshot_id}. `
                  : null}
                The action was not delivered. The next step is a fresh snapshot.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Response</CardTitle>
                <Badge variant={stale ? "destructive" : "secondary"}>
                  {step.response.ok ? step.response.command : step.response.error.code}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <JsonBlock value={step.response} />
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Tree after this step</CardTitle>
              <Badge variant="outline" className="font-mono">
                {step.snapshot.data.snapshot_id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(28rem,calc(100svh-18rem))]">
              <A11yTree
                key={step.id}
                root={step.snapshot.data.tree}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
