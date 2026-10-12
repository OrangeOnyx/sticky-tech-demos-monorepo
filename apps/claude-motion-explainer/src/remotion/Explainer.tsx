import { AbsoluteFill, interpolate, Series, useCurrentFrame, useVideoConfig } from "remotion"
import { formatInt, formatMoney, formatPct, formatRentPerSqft } from "../../shared/format.ts"
import {
  SCENE_LABELS,
  sceneAccent,
  type ExplainerSpec,
  type Scene,
} from "../../shared/spec.ts"

const font = '"Geist Variable", Geist, sans-serif'

function shift(frame: number, delay = 0) {
  const y = interpolate(frame - delay, [0, 16], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  return { transform: `translateY(${y}px)` }
}

function grow(frame: number, delay: number, from: number, to: number) {
  return interpolate(frame, [delay, delay + 28], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
}

function Eyebrow({
  index,
  total,
  label,
  color,
}: {
  index: number
  total: number
  label: string
  color: string
}) {
  const frame = useCurrentFrame()
  return (
    <div
      style={{
        ...shift(frame),
        color,
        fontSize: 14,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {label}
    </div>
  )
}

function TitleScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "title" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const bar = grow(frame, 0, 48, 220)
  const size = scene.propertyName.length > 24 ? 52 : 76
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "flex-end" }}>
      <div style={{ width: bar, height: 4, background: scene.accent, marginBottom: 28 }} />
      <Eyebrow index={index} total={total} label="Rent roll" color={spec.muted} />
      <div
        data-testid="scene-title"
        style={{
          ...shift(frame, 4),
          marginTop: 16,
          maxWidth: 1080,
          fontSize: size,
          lineHeight: 0.96,
          fontWeight: 560,
          letterSpacing: -1.5,
        }}
      >
        {scene.propertyName}
      </div>
      <div style={{ ...shift(frame, 10), marginTop: 20, fontSize: 28, color: spec.muted }}>
        {scene.subtitle}
      </div>
    </AbsoluteFill>
  )
}

function KpiScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "kpi" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const shown = interpolate(frame, [4, 40], [0, scene.value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "center" }}>
      <Eyebrow index={index} total={total} label={SCENE_LABELS.kpi} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 28, fontSize: 28, color: spec.muted }}>
        {scene.label}
      </div>
      <div
        data-testid="scene-kpi"
        style={{
          marginTop: 8,
          fontSize: 168,
          lineHeight: 0.9,
          fontWeight: 560,
          letterSpacing: -4,
          fontVariantNumeric: "tabular-nums",
          color: scene.accent,
        }}
      >
        {shown.toFixed(scene.decimals)}
        {scene.suffix}
      </div>
      <div style={{ ...shift(frame, 12), marginTop: 24, maxWidth: 820, fontSize: 26, color: spec.muted }}>
        {scene.caption}
      </div>
    </AbsoluteFill>
  )
}

function OccupancyScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "occupancy" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const radius = 96
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, scene.bySqft))
  const progress = interpolate(frame, [6, 46], [0, pct / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const shown = interpolate(frame, [6, 46], [0, scene.bySqft], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "center" }}>
      <Eyebrow index={index} total={total} label={SCENE_LABELS.occupancy} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 18, fontSize: 42, fontWeight: 560 }}>{scene.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 72, marginTop: 28 }}>
        <div style={{ position: "relative", width: 280, height: 280 }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r={radius} fill="none" stroke={scene.vacantColor} strokeWidth="18" />
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke={scene.occupiedColor}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 140 140)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 560,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {shown.toFixed(1)}%
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Stat label="By area" value={formatPct(scene.bySqft)} color={scene.occupiedColor} muted={spec.muted} />
          <Stat label="By suite" value={formatPct(scene.byUnit)} color={spec.ink} muted={spec.muted} />
          <div style={{ maxWidth: 420, fontSize: 22, color: spec.muted }}>{scene.caption}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Stat({
  label,
  value,
  color,
  muted,
}: {
  label: string
  value: string
  color: string
  muted: string
}) {
  return (
    <div>
      <div style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>
        {label}
      </div>
      <div style={{ fontSize: 64, lineHeight: 1, fontWeight: 560, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  )
}

function VacanciesScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "vacancies" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ padding: 72 }}>
      <Eyebrow index={index} total={total} label={SCENE_LABELS.vacancies} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 18, fontSize: 42, fontWeight: 560 }}>{scene.title}</div>
      {scene.units.length === 0 ? (
        <div style={{ marginTop: 48, fontSize: 36, color: spec.muted }}>{scene.emptyLabel}</div>
      ) : (
        <div style={{ marginTop: 28 }}>
          {scene.units.map((unit, row) => (
            <div
              key={`${unit.unit}-${row}`}
              style={{
                ...shift(frame, 8 + row * 5),
                display: "grid",
                gridTemplateColumns: "160px 1fr auto",
                gap: 24,
                alignItems: "baseline",
                padding: "16px 0",
                borderTop: `1px solid ${spec.muted}55`,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 560 }}>{unit.unit}</div>
              <div style={{ fontSize: 24, color: spec.muted }}>{unit.note}</div>
              <div style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }}>
                {formatInt(unit.sqft)} sqft
              </div>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  )
}

function ExpirationsScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "expirations" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const max = Math.max(1, ...scene.bars.map((bar) => bar.count))
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "center" }}>
      <Eyebrow index={index} total={total} label={SCENE_LABELS.expirations} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 18, fontSize: 42, fontWeight: 560 }}>{scene.title}</div>
      <div style={{ marginTop: 12, fontSize: 22, color: spec.muted }}>{scene.caption}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 36 }}>
        {scene.bars.map((bar, row) => {
          const width = grow(frame, 8 + row * 6, 0, (bar.count / max) * 100)
          return (
            <div key={bar.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 72px", gap: 18, alignItems: "center" }}>
              <div style={{ fontSize: 24 }}>{bar.label}</div>
              <div style={{ height: 28, borderRadius: 999, background: `${spec.muted}33`, overflow: "hidden" }}>
                <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: scene.accent }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 560, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {bar.count}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function RentScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "rent" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const max = Math.max(0.01, ...scene.bars.map((bar) => bar.rentPerSqft))
  return (
    <AbsoluteFill style={{ padding: 72 }}>
      <Eyebrow index={index} total={total} label={SCENE_LABELS.rent} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 18, fontSize: 42, fontWeight: 560 }}>{scene.title}</div>
      <div style={{ marginTop: 8, fontSize: 22, color: spec.muted }}>{scene.caption}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
        {scene.bars.length === 0 ? (
          <div style={{ fontSize: 28, color: spec.muted }}>No leased area on this roll.</div>
        ) : (
          scene.bars.map((bar, row) => {
            const width = grow(frame, 6 + row * 4, 0, (bar.rentPerSqft / max) * 100)
            return (
              <div key={`${bar.label}-${row}`} style={{ display: "grid", gridTemplateColumns: "280px 1fr 110px", gap: 16, alignItems: "center" }}>
                <div style={{ fontSize: 22, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {bar.label}
                </div>
                <div style={{ height: 18, borderRadius: 999, background: `${spec.muted}33`, overflow: "hidden" }}>
                  <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: scene.accent }} />
                </div>
                <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 22 }}>
                  {formatRentPerSqft(bar.rentPerSqft)}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 64, display: "flex", gap: 32, fontSize: 28 }}>
        <div>
          <span style={{ color: spec.muted }}>In place </span>
          <strong>{formatMoney(scene.totalMonthlyRent)}</strong>
          <span style={{ color: spec.muted }}> / mo</span>
        </div>
        <div>
          <span style={{ color: spec.muted }}>Average </span>
          <strong style={{ color: scene.accent }}>{formatRentPerSqft(scene.avgRentPerSqft)}</strong>
          <span style={{ color: spec.muted }}> / sqft</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function OutroScene({
  scene,
  spec,
  index,
  total,
}: {
  scene: Extract<Scene, { type: "outro" }>
  spec: ExplainerSpec
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ padding: 72, justifyContent: "flex-end" }}>
      <div style={{ width: 160, height: 4, background: scene.accent, marginBottom: 28 }} />
      <Eyebrow index={index} total={total} label={SCENE_LABELS.outro} color={spec.muted} />
      <div style={{ ...shift(frame, 4), marginTop: 16, fontSize: 68, lineHeight: 0.98, fontWeight: 560 }}>
        {scene.headline}
      </div>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {scene.lines.map((line, row) => (
          <div key={`${row}-${line}`} style={{ ...shift(frame, 10 + row * 6), fontSize: 28, color: spec.muted }}>
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

function SceneView({
  scene,
  spec,
  index,
  total,
}: {
  scene: Scene
  spec: ExplainerSpec
  index: number
  total: number
}) {
  switch (scene.type) {
    case "title":
      return <TitleScene scene={scene} spec={spec} index={index} total={total} />
    case "kpi":
      return <KpiScene scene={scene} spec={spec} index={index} total={total} />
    case "occupancy":
      return <OccupancyScene scene={scene} spec={spec} index={index} total={total} />
    case "vacancies":
      return <VacanciesScene scene={scene} spec={spec} index={index} total={total} />
    case "expirations":
      return <ExpirationsScene scene={scene} spec={spec} index={index} total={total} />
    case "rent":
      return <RentScene scene={scene} spec={spec} index={index} total={total} />
    case "outro":
      return <OutroScene scene={scene} spec={spec} index={index} total={total} />
    default: {
      const neverScene: never = scene
      return neverScene
    }
  }
}

function accentAt(spec: ExplainerSpec, frame: number): string {
  let cursor = 0
  for (const scene of spec.scenes) {
    if (!scene.enabled) continue
    if (frame < cursor + scene.durationInFrames) return sceneAccent(scene)
    cursor += scene.durationInFrames
  }
  const last = [...spec.scenes].reverse().find((scene) => scene.enabled)
  return last ? sceneAccent(last) : spec.ink
}

function Progress({ spec }: { spec: ExplainerSpec }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const width = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const accent = accentAt(spec, frame)
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: `${accent}33` }}>
      <div style={{ width: `${width}%`, height: "100%", background: accent }} />
    </div>
  )
}

export function Explainer({ spec }: { spec: ExplainerSpec }) {
  const scenes = spec.scenes.filter((scene) => scene.enabled)
  return (
    <AbsoluteFill style={{ background: spec.background, color: spec.ink, fontFamily: font, overflow: "hidden" }}>
      {scenes.length === 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          All scenes are off.
        </AbsoluteFill>
      ) : (
        <Series>
          {scenes.map((scene, index) => (
            <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
              <SceneView scene={scene} spec={spec} index={index} total={scenes.length} />
            </Series.Sequence>
          ))}
        </Series>
      )}
      <Progress spec={spec} />
    </AbsoluteFill>
  )
}
