import { useState } from "react"
import { SCENE_LABELS, type ExplainerSpec } from "../../shared/spec.ts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function DurationField({
  value,
  label,
  onChange,
}: {
  value: number
  label: string
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(value)

  return (
    <Input
      aria-label={`${label} duration in frames`}
      inputMode="numeric"
      className="w-16 tabular-nums"
      value={shown}
      onFocus={() => setDraft(String(value))}
      onChange={(event) => {
        setDraft(event.target.value)
        const parsed = Number(event.target.value)
        if (Number.isInteger(parsed) && parsed >= 15 && parsed <= 600) onChange(parsed)
      }}
      onBlur={() => {
        const parsed = Number(draft ?? value)
        const next = Number.isInteger(parsed) ? Math.min(600, Math.max(15, parsed)) : value
        onChange(next)
        setDraft(null)
      }}
    />
  )
}

export function Timeline({
  spec,
  selectedId,
  onSelect,
  onDuration,
  onToggle,
  onMove,
}: {
  spec: ExplainerSpec
  selectedId: string
  onSelect: (id: string) => void
  onDuration: (id: string, durationInFrames: number) => void
  onToggle: (id: string) => void
  onMove: (index: number, direction: -1 | 1) => void
}) {
  return (
    <ol className="flex flex-col gap-1" aria-label="Scenes">
      {spec.scenes.map((scene, index) => {
        const label = SCENE_LABELS[scene.type]
        const selected = scene.id === selectedId
        return (
          <li key={scene.id} className={cn("rounded-lg px-1.5 py-1", selected && "bg-muted")}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={cn(
                  "min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm",
                  scene.enabled ? "text-foreground" : "text-muted-foreground line-through",
                )}
                aria-current={selected}
                onClick={() => onSelect(scene.id)}
              >
                {label}
              </button>
              <DurationField
                value={scene.durationInFrames}
                label={label}
                onChange={(duration) => onDuration(scene.id, duration)}
              />
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {(scene.durationInFrames / spec.fps).toFixed(1)}s
              </span>
            </div>
            <div className="mt-1 flex gap-1 pl-1">
              <Button
                type="button"
                size="xs"
                variant="outline"
                aria-label={`Move ${label} up`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                Up
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                aria-label={`Move ${label} down`}
                disabled={index === spec.scenes.length - 1}
                onClick={() => onMove(index, 1)}
              >
                Down
              </Button>
              <Button
                type="button"
                size="xs"
                variant={scene.enabled ? "secondary" : "outline"}
                aria-pressed={scene.enabled}
                aria-label={`${scene.enabled ? "Hide" : "Show"} ${label}`}
                onClick={() => onToggle(scene.id)}
              >
                {scene.enabled ? "On" : "Off"}
              </Button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
