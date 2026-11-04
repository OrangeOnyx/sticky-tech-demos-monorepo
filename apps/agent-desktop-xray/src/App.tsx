import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BridgePanel } from "@/components/bridge-panel"
import { ReplayTab } from "@/components/replay-tab"
import { TreeTab } from "@/components/tree-tab"

export default function App() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3 px-4 py-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-medium tracking-tight">Agent Desktop X-ray</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Sample accessibility trees for the observe, act, verify loop. Click a node to
              copy the CLI command.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Sample data</Badge>
            <Badge variant="outline">contract 2.6</Badge>
            <a
              className="text-sm underline underline-offset-4"
              href="https://github.com/vercel-labs/agent-desktop"
            >
              agent-desktop
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">
        <Tabs defaultValue="tree">
          <TabsList>
            <TabsTrigger value="tree">Tree</TabsTrigger>
            <TabsTrigger value="replay">Replay</TabsTrigger>
          </TabsList>
          <TabsContent value="tree" className="pt-4">
            <TreeTab />
          </TabsContent>
          <TabsContent value="replay" className="pt-4">
            <ReplayTab />
          </TabsContent>
        </Tabs>
        <Separator />
        <BridgePanel />
      </main>
    </div>
  )
}
