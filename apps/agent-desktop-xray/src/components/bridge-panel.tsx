import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function BridgePanel() {
  return (
    <Collapsible className="rounded-xl border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Live bridge</p>
          <p className="text-sm text-muted-foreground" data-testid="bridge-status">
            Bridge off — samples only.
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            How a local CLI would attach
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-3 text-sm text-muted-foreground">
        <p>
          This demo does not shell out to <span className="font-mono">agent-desktop</span> and
          does not read the machine&apos;s windows. A later local bridge can set{" "}
          <span className="font-mono">AGENT_DESKTOP_BRIDGE=1</span> and serve{" "}
          <span className="font-mono">GET /api/bridge/status</span>, which only reports whether
          the binary is on <span className="font-mono">PATH</span>. Driving a real desktop needs
          the OS accessibility permission on that machine. See{" "}
          <span className="font-mono">.env.example</span>.
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}
