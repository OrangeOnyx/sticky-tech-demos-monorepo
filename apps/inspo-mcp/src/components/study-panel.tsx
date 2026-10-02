import { useState } from "react"
import type { StudyResponse } from "../../shared/types.ts"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function percent(share: number): string {
  return `${Math.round(share * 100)}%`
}

export function StudyPanel({ result }: { result: StudyResponse | null }) {
  const [copied, setCopied] = useState(false)

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study</CardTitle>
          <CardDescription>Exemplars, palette, and a DESIGN.md snippet land here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run a brief to study the archive.</p>
        </CardContent>
      </Card>
    )
  }

  const design = result.designSystem
  const summary = result.summary

  async function copyDesign() {
    if (!design) return
    await navigator.clipboard.writeText(design.markdown)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={result.match === "weak" ? "outline" : "default"} className="capitalize">
          {result.match} match
        </Badge>
        <Badge variant="secondary" className="capitalize">
          {result.mode}
        </Badge>
        {result.pick ? <Badge variant="outline">{result.pick.macrostructure.label}</Badge> : null}
        <span className="text-xs text-muted-foreground">{result.latencyMs} ms</span>
      </div>
      {result.pick ? (
        <p className="text-sm text-muted-foreground">{result.pick.rationale}</p>
      ) : null}
      {result.evidence ? (
        <p className="text-sm text-muted-foreground">
          {result.evidence.sites} sites · paper {result.evidence.paperBand}{" "}
          {percent(result.evidence.paperShare)} · {result.evidence.displayClass}{" "}
          {percent(result.evidence.displayShare)} · accent {result.evidence.accentHue}{" "}
          {percent(result.evidence.accentShare)}
        </p>
      ) : null}

      {result.exemplars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No exemplars</CardTitle>
            <CardDescription>{result.note}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.exemplars.map((exemplar) => (
            <Card key={exemplar.slug} className="overflow-hidden">
              <a href={exemplar.archiveUrl} target="_blank" rel="noreferrer">
                <img
                  src={exemplar.thumb}
                  alt={`${exemplar.title} screenshot`}
                  className="aspect-[4/3] w-full object-cover object-top"
                />
              </a>
              <CardHeader>
                <CardTitle>{exemplar.title}</CardTitle>
                <CardDescription>{exemplar.northstar}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {exemplar.fonts.join(", ") || "Typeface not listed"} · {exemplar.axes}
                </p>
                <div className="flex flex-wrap gap-1">
                  {exemplar.palette.slice(0, 5).map((hex) => (
                    <span
                      key={hex}
                      className="size-4 rounded-sm border border-border"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <a className="underline underline-offset-4" href={exemplar.sourceUrl} target="_blank" rel="noreferrer">
                    Source
                  </a>
                  <a className="underline underline-offset-4" href={exemplar.archiveUrl} target="_blank" rel="noreferrer">
                    Archive
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result.palette.length > 0 || summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Palette, type, spacing</CardTitle>
            <CardDescription>
              {result.note && result.match !== "weak" ? result.note : "Taken from the top exemplar's DESIGN.md."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.palette.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                {result.palette.map((hex) => (
                  <li key={hex} className="flex items-center gap-2">
                    <span
                      className="size-8 rounded-md border border-border"
                      style={{ backgroundColor: hex }}
                      aria-hidden
                    />
                    <span className="font-mono text-xs">{hex}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {summary && (summary.typeSteps.length > 0 || summary.spacing) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm font-medium">Type</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {summary.typeSteps.slice(0, 4).map((step) => (
                      <li key={`${step.role}-${step.size}`}>
                        <span className="text-foreground">{step.role}</span> {step.family} {step.size} /{" "}
                        {step.weight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium">Spacing</p>
                  <p className="text-sm text-muted-foreground">{summary.spacing ?? "—"}</p>
                  {summary.radii ? (
                    <p className="mt-2 text-sm text-muted-foreground">Radius {summary.radii}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {result.referenceComponents[0] ? (
        <Card>
          <CardHeader>
            <CardTitle>{result.referenceComponents[0].label}</CardTitle>
            <CardDescription>
              {result.referenceComponents[0].type} · {result.referenceComponents[0].note}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {design ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>DESIGN.md</CardTitle>
                <CardDescription>
                  Captured tokens for {design.slug}.{" "}
                  <a className="underline underline-offset-4" href={design.pageUrl} target="_blank" rel="noreferrer">
                    Open on Inspo
                  </a>
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyDesign()}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {design.markdown}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
