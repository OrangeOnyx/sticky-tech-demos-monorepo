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
import type { ImageUpload } from "@/lib/types"
import { ImagePlusIcon, XIcon } from "lucide-react"
import { useMemo, useState } from "react"

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

type Preview = ImageUpload & { previewUrl: string }

async function fileToUpload(file: File): Promise<Preview> {
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
  }
}

export function PlaygroundForm({ busy, onGenerate }: Props) {
  const [text, setText] = useState(
    "A grand, ivy-covered castle rises from the shoreline at sunset, its reflection shimmering in the tranquil ocean waves.",
  )
  const [displayName, setDisplayName] = useState("Coastal castle")
  const [draft, setDraft] = useState(true)
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [images, setImages] = useState<Preview[]>([])

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
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return copy
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate</CardTitle>
        <CardDescription>
          Prompt, optional references, then poll until Marble (or the fixture)
          is ready.
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
                placeholder="Coastal castle"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="prompt">Text prompt</FieldLabel>
              <Textarea
                id="prompt"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                placeholder="Describe a navigable 3D world…"
              />
              <FieldDescription>
                Optional if you upload images. Marble recaptions unless you turn
                auto-enhance off.
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
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10"
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="aspect-square w-full object-cover"
                      />
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
