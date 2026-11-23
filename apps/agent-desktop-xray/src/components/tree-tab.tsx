import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { A11yTree } from "@/components/a11y-tree"
import { CommandPanel } from "@/components/command-panel"
import { treeFixtures } from "@/fixtures/demo-notes.ts"
import { flattenTree, interactiveItems } from "../../shared/tree.ts"

export function TreeTab() {
  const [fixtureId, setFixtureId] = useState<string>(treeFixtures[0].id)
  const fixture = treeFixtures.find((item) => item.id === fixtureId) ?? treeFixtures[0]
  const [selectedPath, setSelectedPath] = useState<string | null>(
    () => interactiveItems(treeFixtures[0].snapshot.data.tree)[0]?.path ?? null,
  )
  const selected =
    flattenTree(fixture.snapshot.data.tree).find((item) => item.path === selectedPath)?.node ??
    null

  function chooseFixture(id: string) {
    const next = treeFixtures.find((item) => item.id === id) ?? treeFixtures[0]
    setFixtureId(next.id)
    setSelectedPath(interactiveItems(next.snapshot.data.tree)[0]?.path ?? null)
  }

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Accessibility tree</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{fixture.snapshot.data.app}</Badge>
              <Badge variant="outline" className="font-mono">
                {fixture.snapshot.data.snapshot_id}
              </Badge>
            </div>
          </div>
          <div role="group" aria-label="Sample snapshot" className="flex flex-wrap gap-2">
            {treeFixtures.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={item.id === fixture.id ? "default" : "outline"}
                aria-pressed={item.id === fixture.id}
                onClick={() => chooseFixture(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[min(32rem,calc(100svh-16rem))]">
            <A11yTree
              root={fixture.snapshot.data.tree}
              selectedPath={selectedPath}
              onSelect={(path) => setSelectedPath(path)}
            />
          </ScrollArea>
          <p className="pt-3 text-xs text-muted-foreground">
            Arrow keys move the selection among nodes that have a ref, while the tree has focus.
          </p>
        </CardContent>
      </Card>
      <CommandPanel snapshotId={fixture.snapshot.data.snapshot_id} node={selected} />
    </div>
  )
}
