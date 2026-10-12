import { SCENE_LABELS, type ExplainerSpec, type Scene } from "../../shared/spec.ts"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function TextField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  testId?: string
}) {
  return (
    <Label className="flex flex-col items-stretch gap-1 font-normal">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input value={value} data-testid={testId} onChange={(event) => onChange(event.target.value)} />
    </Label>
  )
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string
  value: number
  step: string
  onChange: (value: number) => void
}) {
  return (
    <Label className="flex flex-col items-stretch gap-1 font-normal">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed)) onChange(parsed)
        }}
      />
    </Label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const swatch = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000"
  return (
    <Label className="flex flex-col items-stretch gap-1 font-normal">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          aria-label={`${label} swatch`}
          type="color"
          value={swatch}
          className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
          onChange={(event) => onChange(event.target.value)}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </Label>
  )
}

function SceneFields({ scene, onChange }: { scene: Scene; onChange: (scene: Scene) => void }) {
  switch (scene.type) {
    case "title":
      return (
        <>
          <TextField
            label="Property"
            value={scene.propertyName}
            testId="prop-property-name"
            onChange={(propertyName) => onChange({ ...scene, propertyName })}
          />
          <TextField label="Subtitle" value={scene.subtitle} onChange={(subtitle) => onChange({ ...scene, subtitle })} />
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    case "kpi":
      return (
        <>
          <TextField label="Label" value={scene.label} onChange={(label) => onChange({ ...scene, label })} />
          <NumberField label="Value" value={scene.value} step="0.1" onChange={(value) => onChange({ ...scene, value })} />
          <TextField label="Suffix" value={scene.suffix} onChange={(suffix) => onChange({ ...scene, suffix })} />
          <TextField label="Caption" value={scene.caption} onChange={(caption) => onChange({ ...scene, caption })} />
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    case "occupancy":
      return (
        <>
          <TextField label="Title" value={scene.title} onChange={(title) => onChange({ ...scene, title })} />
          <NumberField label="By area %" value={scene.bySqft} step="0.1" onChange={(bySqft) => onChange({ ...scene, bySqft })} />
          <NumberField label="By suite %" value={scene.byUnit} step="0.1" onChange={(byUnit) => onChange({ ...scene, byUnit })} />
          <TextField label="Caption" value={scene.caption} onChange={(caption) => onChange({ ...scene, caption })} />
          <ColorField
            label="Leased"
            value={scene.occupiedColor}
            onChange={(occupiedColor) => onChange({ ...scene, occupiedColor })}
          />
          <ColorField
            label="Vacant"
            value={scene.vacantColor}
            onChange={(vacantColor) => onChange({ ...scene, vacantColor })}
          />
        </>
      )
    case "vacancies":
      return (
        <>
          <TextField label="Title" value={scene.title} onChange={(title) => onChange({ ...scene, title })} />
          <TextField
            label="Empty label"
            value={scene.emptyLabel}
            onChange={(emptyLabel) => onChange({ ...scene, emptyLabel })}
          />
          {scene.units.map((unit, index) => (
            <div key={`${unit.unit}-${index}`} className="grid grid-cols-3 gap-2">
              <TextField
                label="Unit"
                value={unit.unit}
                onChange={(next) =>
                  onChange({
                    ...scene,
                    units: scene.units.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, unit: next } : item,
                    ),
                  })
                }
              />
              <NumberField
                label="Sqft"
                value={unit.sqft}
                step="1"
                onChange={(sqft) =>
                  onChange({
                    ...scene,
                    units: scene.units.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, sqft } : item,
                    ),
                  })
                }
              />
              <TextField
                label="Note"
                value={unit.note}
                onChange={(note) =>
                  onChange({
                    ...scene,
                    units: scene.units.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, note } : item,
                    ),
                  })
                }
              />
            </div>
          ))}
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    case "expirations":
      return (
        <>
          <TextField label="Title" value={scene.title} onChange={(title) => onChange({ ...scene, title })} />
          <TextField label="Caption" value={scene.caption} onChange={(caption) => onChange({ ...scene, caption })} />
          {scene.bars.map((bar, index) => (
            <div key={`${bar.label}-${index}`} className="grid grid-cols-2 gap-2">
              <TextField
                label="Window"
                value={bar.label}
                onChange={(label) =>
                  onChange({
                    ...scene,
                    bars: scene.bars.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label } : item,
                    ),
                  })
                }
              />
              <NumberField
                label="Count"
                value={bar.count}
                step="1"
                onChange={(count) =>
                  onChange({
                    ...scene,
                    bars: scene.bars.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, count } : item,
                    ),
                  })
                }
              />
            </div>
          ))}
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    case "rent":
      return (
        <>
          <TextField label="Title" value={scene.title} onChange={(title) => onChange({ ...scene, title })} />
          <TextField label="Caption" value={scene.caption} onChange={(caption) => onChange({ ...scene, caption })} />
          <NumberField
            label="Average $/sqft"
            value={scene.avgRentPerSqft}
            step="0.01"
            onChange={(avgRentPerSqft) => onChange({ ...scene, avgRentPerSqft })}
          />
          <NumberField
            label="Monthly rent"
            value={scene.totalMonthlyRent}
            step="1"
            onChange={(totalMonthlyRent) => onChange({ ...scene, totalMonthlyRent })}
          />
          {scene.bars.map((bar, index) => (
            <div key={`${bar.label}-${index}`} className="grid grid-cols-2 gap-2">
              <TextField
                label="Tenant"
                value={bar.label}
                onChange={(label) =>
                  onChange({
                    ...scene,
                    bars: scene.bars.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label } : item,
                    ),
                  })
                }
              />
              <NumberField
                label="$/sqft"
                value={bar.rentPerSqft}
                step="0.01"
                onChange={(rentPerSqft) =>
                  onChange({
                    ...scene,
                    bars: scene.bars.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, rentPerSqft } : item,
                    ),
                  })
                }
              />
            </div>
          ))}
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    case "outro":
      return (
        <>
          <TextField label="Headline" value={scene.headline} onChange={(headline) => onChange({ ...scene, headline })} />
          {scene.lines.map((line, index) => (
            <TextField
              key={index}
              label={`Line ${index + 1}`}
              value={line}
              onChange={(next) =>
                onChange({
                  ...scene,
                  lines: scene.lines.map((item, itemIndex) => (itemIndex === index ? next : item)),
                })
              }
            />
          ))}
          <ColorField label="Accent" value={scene.accent} onChange={(accent) => onChange({ ...scene, accent })} />
        </>
      )
    default: {
      const neverScene: never = scene
      return neverScene
    }
  }
}

export function PropsPanel({
  spec,
  scene,
  onSceneChange,
  onFrameChange,
}: {
  spec: ExplainerSpec
  scene: Scene | undefined
  onSceneChange: (scene: Scene) => void
  onFrameChange: (patch: Pick<ExplainerSpec, "background" | "ink" | "muted">) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <ColorField
          label="Background"
          value={spec.background}
          onChange={(background) => onFrameChange({ background, ink: spec.ink, muted: spec.muted })}
        />
        <ColorField
          label="Ink"
          value={spec.ink}
          onChange={(ink) => onFrameChange({ background: spec.background, ink, muted: spec.muted })}
        />
        <ColorField
          label="Muted"
          value={spec.muted}
          onChange={(muted) => onFrameChange({ background: spec.background, ink: spec.ink, muted })}
        />
      </div>
      {scene ? (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <p className="text-sm font-medium">{SCENE_LABELS[scene.type]}</p>
          <SceneFields scene={scene} onChange={onSceneChange} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a scene to edit its words and numbers.</p>
      )}
    </div>
  )
}
