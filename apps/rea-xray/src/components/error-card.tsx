import type { ApiMessage } from "../../shared/types.ts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ErrorCard({
  error,
  title,
}: {
  error: ApiMessage
  title?: string
}) {
  return (
    <Alert variant={error.code === "capability_unavailable" ? "default" : "destructive"}>
      <AlertTitle>{title ?? error.code ?? "Inspection failed"}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.remediation ? <p>{error.remediation}</p> : null}
      </AlertDescription>
    </Alert>
  )
}
