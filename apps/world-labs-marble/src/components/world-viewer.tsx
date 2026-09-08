import { proxyAssetUrl } from "@/lib/api"
import type { World } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { pickSplatUrl } from "@shared/world-assets"
import { OTB_REFERENCE_ASSETS } from "@shared/otb"
import { BoxIcon, ExternalLinkIcon } from "lucide-react"
import { lazy, Suspense, useMemo } from "react"

const SparkViewer = lazy(async () => {
  const module = await import("@/components/spark-viewer")
  return { default: module.SparkViewer }
})

const FixtureScene = lazy(async () => {
  const module = await import("@/components/fixture-scene")
  return { default: module.FixtureScene }
})

type Props = {
  world: World | null
}

export function WorldViewer({ world }: Props) {
  const splatUrl = useMemo(() => (world ? pickSplatUrl(world) : null), [world])
  const pano = world?.assets?.imagery?.pano_url
  const thumbnail = world?.assets?.thumbnail_url
  const marbleUrl = world?.world_marble_url
  const openUrl =
    marbleUrl && marbleUrl.startsWith("http") ? marbleUrl : null

  return (
    <Card className="min-h-[28rem]">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{world?.display_name || "Viewer"}</CardTitle>
          <CardDescription>
            {world?.assets?.caption ||
              "Gaussian splat via Spark when an SPZ is present. Fixture mode stands in with an On The Boulevard strip."}
          </CardDescription>
        </div>
        {world ? (
          <Badge variant="outline">{world.source ?? "world"}</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!world ? (
          <Empty className="min-h-80 border border-dashed">
            <EmptyHeader>
              <BoxIcon className="size-8 text-muted-foreground" />
              <EmptyTitle>On The Boulevard</EmptyTitle>
              <EmptyDescription>
                Floor plan, nadir aerial, and isometric look are prefilled.
                Generate to poll a mock (or live) job, then orbit the strip.
              </EmptyDescription>
            </EmptyHeader>
            <div className="grid w-full max-w-lg grid-cols-3 gap-2 px-4 pb-4">
              {OTB_REFERENCE_ASSETS.map((asset) => (
                <img
                  key={asset.url}
                  src={asset.url}
                  alt={asset.label}
                  className="h-24 w-full rounded-md object-cover ring-1 ring-foreground/10"
                />
              ))}
            </div>
          </Empty>
        ) : (
          <>
            <div className="relative min-h-80 overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-foreground/10">
              {world.source === "fixture" ? (
                <Suspense fallback={<ViewerFallback />}>
                  <FixtureScene />
                </Suspense>
              ) : splatUrl ? (
                <Suspense fallback={<ViewerFallback />}>
                  <SparkViewer url={proxyAssetUrl(splatUrl)} />
                </Suspense>
              ) : (
                <FallbackStill
                  pano={pano}
                  thumbnail={thumbnail}
                  title={world.display_name || world.id}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {openUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={openUrl} target="_blank" rel="noreferrer">
                    Open in Marble
                    <ExternalLinkIcon />
                  </a>
                </Button>
              ) : null}
              {thumbnail ? (
                <img
                  src={proxyAssetUrl(thumbnail)}
                  alt="World thumbnail"
                  className="h-12 w-20 rounded-md object-cover ring-1 ring-foreground/10"
                />
              ) : null}
              {pano && pano !== thumbnail ? (
                <img
                  src={proxyAssetUrl(pano)}
                  alt="Floor plan"
                  className="h-12 w-20 rounded-md object-cover ring-1 ring-foreground/10"
                />
              ) : null}
              <p className="font-mono text-xs text-muted-foreground">
                {world.id}
              </p>
              {world.model ? (
                <Badge variant="secondary">{world.model}</Badge>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ViewerFallback() {
  return (
    <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
      Loading viewer…
    </div>
  )
}

function FallbackStill({
  pano,
  thumbnail,
  title,
}: {
  pano?: string | null
  thumbnail?: string | null
  title: string
}) {
  const src = pano || thumbnail
  if (!src) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-400">
          No splat URL yet. Use Open in Marble if the world page is available.
        </p>
      </div>
    )
  }
  return (
    <img
      src={proxyAssetUrl(src)}
      alt={title}
      className="min-h-80 w-full object-cover"
    />
  )
}
