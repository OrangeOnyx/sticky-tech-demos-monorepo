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
import {
  OTB_AERIAL_PREVIEW,
  OTB_DRIVE_FEATURED_ASSETS,
  OTB_DROPBOX_ASSETS,
} from "@shared/otb"
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
              "Gaussian splat via Spark when an SPZ is present. Fixture mode stands in with an On The Boulevard strip. Empty state shows Dropbox stills plus live Drive / PostShot media."}
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
                Generate defaults are Dropbox 53 / 70 / 80. The library also
                has live Drive floorplan, nadir, drone, and PostShot stills —
                not Atlas stand-ins. The aerial clip is a reference only.
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex w-full max-w-xl flex-col gap-3 px-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground">
                Drive + PostShot
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {OTB_DRIVE_FEATURED_ASSETS.map((asset) => (
                  <figure key={asset.url} className="space-y-1">
                    <img
                      src={asset.url}
                      alt={asset.label}
                      className="h-20 w-full rounded-md object-cover ring-1 ring-foreground/10"
                    />
                    <figcaption className="truncate text-[10px] leading-tight text-muted-foreground">
                      {asset.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {OTB_AERIAL_PREVIEW.label}
              </p>
              <video
                className="aspect-video w-full rounded-md bg-zinc-950 object-cover ring-1 ring-foreground/10"
                controls
                muted
                loop
                playsInline
                preload="metadata"
                src={OTB_AERIAL_PREVIEW.url}
                aria-label={OTB_AERIAL_PREVIEW.label}
              />
              <p className="text-xs font-medium text-muted-foreground">
                Dropbox stills (Nov 2020)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {OTB_DROPBOX_ASSETS.map((asset) => (
                  <img
                    key={asset.url}
                    src={asset.url}
                    alt={asset.label}
                    className="h-20 w-full rounded-md object-cover ring-1 ring-foreground/10"
                  />
                ))}
              </div>
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
                  alt="Pink Paisley storefront"
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
