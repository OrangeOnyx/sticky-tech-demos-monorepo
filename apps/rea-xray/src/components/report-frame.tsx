import type { ReactNode } from "react"
import type { InspectResponse } from "../../shared/types.ts"
import { ErrorCard } from "@/components/error-card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes, limitations, providers } from "@/lib/evidence"

const kindLabel: Record<InspectResponse["kind"], string> = {
  sqlite: "SQLite",
  model: "Model",
  wasm: "WASM",
  binary: "Binary",
  unknown: "Unrecognized",
}

export function ReportFrame({
  result,
  detail,
  children,
}: {
  result: InspectResponse
  detail?: InspectResponse | null
  children?: ReactNode
}) {
  const reports = [...result.reports, ...(detail?.reports ?? [])]
  const notes = limitations(reports)
  const names = providers(reports).filter((provider, index, all) => {
    const key = `${provider.name}\0${provider.version}`
    return all.findIndex((item) => `${item.name}\0${item.version}` === key) === index
  })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="break-all">{result.file.name}</CardTitle>
          <CardDescription>
            {formatBytes(result.file.size)} · {kindLabel[result.kind]}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {names.length === 0 ? <Badge variant="outline">REA</Badge> : null}
            {names.map((provider) => (
              <Badge key={`${provider.name}-${provider.version}`} variant="secondary">
                {provider.name}
                {provider.version ? ` ${provider.version}` : ""}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">SHA-256</p>
            <p className="font-mono text-xs break-all">{result.file.sha256}</p>
          </div>
        </CardContent>
      </Card>

      {result.error ? <ErrorCard error={result.error} title="Unrecognized file" /> : null}
      {children}

      <Accordion type="multiple">
        <AccordionItem value="limitations">
          <AccordionTrigger>Limitations ({notes.length})</AccordionTrigger>
          <AccordionContent>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">REA did not attach limitations.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {notes.map((note) => (
                  <li key={note} className="text-sm text-muted-foreground">
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="raw">
          <AccordionTrigger>Raw JSON</AccordionTrigger>
          <AccordionContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {JSON.stringify(detail ? { inventory: result, table: detail } : result, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
