import { QUESTIONS } from "../../shared/questions.ts"
import type { ChoiceAnswer, JudgeResponse, NoulAnswer, ScoreAnswer } from "../../shared/types.ts"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const VERDICT_LABEL: Record<string, string> = {
  approve: "Approve",
  tweak: "Tweak",
  skip: "Skip",
}

const VERDICT_TONE: Record<string, string> = {
  approve: "bg-emerald-700 text-white",
  tweak: "bg-amber-500 text-amber-950",
  skip: "bg-zinc-800 text-white",
}

function percent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return `${Math.round(value * 100)}%`
}

function Meter({
  label,
  value,
  tone = "bg-foreground",
}: {
  label: string
  value: number
  tone?: string
}) {
  const width = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-xs text-muted-foreground">{percent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function ChoiceBars({ answer }: { answer: ChoiceAnswer }) {
  const order = ["approve", "tweak", "skip"]
  const extras = Object.keys(answer.probabilities).filter((key) => !order.includes(key))
  return (
    <div className="flex flex-col gap-2">
      {[...order, ...extras].map((key) => (
        <Meter
          key={key}
          label={VERDICT_LABEL[key] ?? key}
          value={answer.probabilities[key] ?? 0}
          tone={key === answer.choice ? "bg-foreground" : "bg-foreground/40"}
        />
      ))}
    </div>
  )
}

function ScoreLegend({ answer }: { answer: ScoreAnswer }) {
  const levels = Object.entries(answer.legend).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  )
  const top = [...levels].sort(
    (a, b) => (answer.probabilities[b[0]] ?? 0) - (answer.probabilities[a[0]] ?? 0),
  )[0]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{top?.[1] ?? "Score"}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          score {answer.score.toFixed(2)} · {percent(answer.confidence)} confident
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {levels.map(([key, label]) => (
          <Meter key={key} label={label} value={answer.probabilities[key] ?? 0} />
        ))}
      </div>
    </div>
  )
}

function NoulGauge({
  title,
  question,
  answer,
}: {
  title: string
  question: string
  answer: NoulAnswer
}) {
  const yes = answer.noul >= 0.5
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{question}</p>
        </div>
        <Badge variant={yes ? "default" : "secondary"}>{yes ? "Yes" : "No"}</Badge>
      </div>
      <Meter label="P(yes)" value={answer.noul} />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>No</span>
        <span>Yes</span>
      </div>
    </div>
  )
}

export function VerdictPanel({ result }: { result: JudgeResponse | null }) {
  if (!result) {
    return (
      <Card className="min-h-80">
        <CardHeader>
          <CardTitle>Verdict</CardTitle>
          <CardDescription>
            Judge a candidate to see Approve, Tweak, or Skip, with fit and yes/no signals.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const verdict = result.answers.verdict
  const label = VERDICT_LABEL[verdict.choice] ?? verdict.choice
  const rubric =
    QUESTIONS.verdict.criteria[verdict.choice as keyof typeof QUESTIONS.verdict.criteria]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verdict</CardTitle>
        <CardDescription>
          {result.mode === "live" ? "Live TypeSafe response" : "Fixture response"} · model{" "}
          {result.model}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3" aria-live="polite">
          <div
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-3xl font-semibold tracking-tight",
              VERDICT_TONE[verdict.choice] ?? "bg-foreground text-background",
            )}
          >
            {label}
          </div>
          <p className="text-sm tabular-nums text-muted-foreground">
            {percent(verdict.confidence)} confident
          </p>
        </div>
        {rubric ? <p className="text-sm text-muted-foreground">{rubric}</p> : null}

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Choice
          </h2>
          <ChoiceBars answer={verdict} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Sticky fit
          </h2>
          <ScoreLegend answer={result.answers.sticky_fit} />
        </section>

        <section className="grid gap-3">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Noul
          </h2>
          <NoulGauge
            title="Needs an API key"
            question={QUESTIONS.needs_api_key.instructions}
            answer={result.answers.needs_api_key}
          />
          <NoulGauge
            title="Near miss"
            question={QUESTIONS.is_near_miss.instructions}
            answer={result.answers.is_near_miss}
          />
        </section>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Latency</dt>
            <dd className="tabular-nums">
              {result.latencyMs < 1 ? "<1 ms" : `${result.latencyMs} ms`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tokens</dt>
            <dd className="tabular-nums">
              {result.usage
                ? `${result.usage.input_tokens} in / ${result.usage.output_tokens} out`
                : result.mode === "live"
                  ? "—"
                  : "Fixture"}
            </dd>
          </div>
        </dl>

        <details className="group rounded-lg border border-border">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium">
            Raw JSON
          </summary>
          <pre className="max-h-72 overflow-auto border-t border-border px-3 py-2 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}
