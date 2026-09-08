import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { loadOtbAsset, loadOtbReferenceImages, type SeededImage } from "@/lib/otb"
import type { ImageUpload } from "@/lib/types"
import {
  OTB_AERIAL_PREVIEW,
  OTB_ATLAS,
  OTB_DISPLAY_NAME,
  OTB_DRIVE_ASSETS,
  OTB_DROPBOX_ASSETS,
  OTB_PROMPT,
  OTB_ROOF_BRIEF_ASSETS,
  OTB_SITE_REFERENCE_ASSETS,
  type OtbReferenceAsset,
} from "@shared/otb"
import { ImagePlusIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type Props = {
  busy: boolean
  onGenerate: (input: {
    text_prompt: string
    display_name: string
    draft: boolean
    auto_enhance: boolean
    images: ImageUpload[]
  }) => Promise<void>
}

async function fileToUpload(file: File): Promise<SeededImage> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
  return {
    name: file.name,
    mime: file.type || "image/jpeg",
    extension: extension === "jpeg" ? "jpg" : extension,
    data_base64: btoa(binary),
    previewUrl: URL.createObjectURL(file),
    label: file.name,
  }
}

export function PlaygroundForm({ busy, onGenerate }: Props) {
  const [text, setText] = useState(OTB_PROMPT)
  const [displayName, setDisplayName] = useState(OTB_DISPLAY_NAME)
  const [draft, setDraft] = useState(true)
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [images, setImages] = useState<SeededImage[]>([])
  const [seedError, setSeedError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadOtbReferenceImages()
      .then((seeded) => {
        if (!cancelled) setImages(seeded)
      })
      .catch((error) => {
        if (!cancelled) {
          setSeedError(
            error instanceof Error
              ? error.message
              : "Could not prefill OTB reference images.",
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = useMemo(
    () => Boolean(text.trim() || images.length) && !busy,
    [text, images, busy],
  )

  async function onFiles(list: FileList | null) {
    if (!list) return
    const remaining = 3 - images.length
    const nextFiles = [...list].slice(0, remaining)
    const uploaded = await Promise.all(nextFiles.map(fileToUpload))
    setImages((current) => [...current, ...uploaded])
  }

  function removeImage(index: number) {
    setImages((current) => {
      const copy = [...current]
      const [removed] = copy.splice(index, 1)
      if (removed?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return copy
    })
  }

  async function selectLibraryAsset(asset: OtbReferenceAsset) {
    if (images.some((image) => image.name === asset.name)) return
    try {
      const seeded = await loadOtbAsset(asset)
      setImages((current) => {
        if (current.length < 3) return [...current, seeded]
        return [...current.slice(0, 2), seeded]
      })
    } catch (error) {
      setSeedError(
        error instanceof Error
          ? error.message
          : `Could not load ${asset.name}.`,
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate</CardTitle>
        <CardDescription>
          Prefills On The Boulevard from real Nov 2020 Dropbox stills.
          Roof-brief, site plats, and Drive / PostShot stills are in the
          library — click to swap a generate slot (Marble max 3).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            void onGenerate({
              text_prompt: text.trim(),
              display_name: displayName.trim(),
              draft,
              auto_enhance: autoEnhance,
              images: images.map((image) => ({
                name: image.name,
                mime: image.mime,
                extension: image.extension,
                data_base64: image.data_base64,
              })),
            })
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="display-name">Display name</FieldLabel>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={OTB_DISPLAY_NAME}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="prompt">Text prompt</FieldLabel>
              <Textarea
                id="prompt"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                placeholder={OTB_PROMPT}
              />
              <FieldDescription>
                Default generate slots are Dropbox 53 / 70 / 80 (elevated strip,
                Politics, Pink Paisley). Click a library still below to swap.
                The aerial clip is a reference only — not a Marble input.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="images">Reference images (1–3)</FieldLabel>
              <Input
                id="images"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                disabled={images.length >= 3 || busy}
                onChange={(event) => {
                  void onFiles(event.target.files)
                  event.target.value = ""
                }}
              />
              {seedError ? (
                <FieldDescription>{seedError}</FieldDescription>
              ) : null}
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10"
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.label || image.name}
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                        {image.label || image.name}
                      </p>
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove ${image.name}`}
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <LibraryPicker
                title="Dropbox stills"
                assets={OTB_DROPBOX_ASSETS}
                selectedNames={images.map((image) => image.name)}
                disabled={busy}
                onSelect={selectLibraryAsset}
              />
              <LibraryPicker
                title="Drive + PostShot"
                assets={OTB_DRIVE_ASSETS}
                selectedNames={images.map((image) => image.name)}
                disabled={busy}
                onSelect={selectLibraryAsset}
              />
              <LibraryPicker
                title="Roof brief"
                assets={OTB_ROOF_BRIEF_ASSETS}
                selectedNames={images.map((image) => image.name)}
                disabled={busy}
                onSelect={selectLibraryAsset}
              />
              <LibraryPicker
                title="Site reference"
                assets={OTB_SITE_REFERENCE_ASSETS}
                selectedNames={images.map((image) => image.name)}
                disabled={busy}
                onSelect={selectLibraryAsset}
              />
              <p className="pt-2 text-[11px] text-muted-foreground">
                Atlas 3D lives in the viewer: {OTB_ATLAS.splatLabel} and{" "}
                {OTB_ATLAS.meshLabel}. Not Marble generate inputs.
              </p>
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Aerial preview (not a generate input)
                </p>
                <video
                  className="aspect-video w-full rounded-lg bg-zinc-950 object-cover ring-1 ring-foreground/10"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  src={OTB_AERIAL_PREVIEW.url}
                  aria-label={OTB_AERIAL_PREVIEW.label}
                />
                <p className="text-[11px] text-muted-foreground">
                  {OTB_AERIAL_PREVIEW.label} · {OTB_AERIAL_PREVIEW.source}
                </p>
              </div>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="auto-enhance"
                checked={autoEnhance}
                onCheckedChange={(value) => setAutoEnhance(value === true)}
              />
              <FieldLabel htmlFor="auto-enhance">Auto-enhance prompt</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="draft"
                checked={draft}
                onCheckedChange={(value) => setDraft(value === true)}
              />
              <FieldLabel htmlFor="draft">Draft model (faster)</FieldLabel>
            </Field>
          </FieldGroup>
          <CardFooter className="px-0 pb-0">
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {busy ? "Generating…" : "Generate world"}
              <ImagePlusIcon />
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}

function LibraryPicker({
  title,
  assets,
  selectedNames,
  disabled,
  onSelect,
}: {
  title: string
  assets: OtbReferenceAsset[]
  selectedNames: string[]
  disabled: boolean
  onSelect: (asset: OtbReferenceAsset) => void
}) {
  return (
    <div className="space-y-1.5 pt-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {assets.map((asset) => {
          const selected = selectedNames.includes(asset.name)
          return (
            <button
              key={asset.url}
              type="button"
              disabled={disabled || selected}
              onClick={() => onSelect(asset)}
              aria-pressed={selected}
              aria-label={`${selected ? "Selected" : "Use"} ${asset.label}`}
              className={`overflow-hidden rounded-md text-left ring-1 transition-shadow ${
                selected
                  ? "ring-foreground"
                  : "ring-foreground/10 hover:ring-foreground/40"
              } disabled:opacity-70`}
            >
              <img
                src={asset.url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
              <p className="truncate px-1 py-0.5 text-[10px] leading-tight text-muted-foreground">
                {asset.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
