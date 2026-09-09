import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

type CrossfadeSliderProps = {
  value: number
  onValueChange: (value: number) => void
}

export function CrossfadeSlider({ value, onValueChange }: CrossfadeSliderProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <Label htmlFor="crossfade" className="text-xs font-medium text-muted-foreground">
          Satellite
        </Label>
        <span className="tabular-nums text-foreground">{Math.round(value)}% LiDAR</span>
        <span>LiDAR</span>
      </div>
      <Slider
        id="crossfade"
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={(next) => onValueChange(next[0] ?? value)}
        aria-label="Crossfade satellite and LiDAR hillshade"
      />
    </div>
  )
}
