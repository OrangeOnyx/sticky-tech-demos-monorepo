import type { ImageUpload } from "@/lib/types"
import { OTB_REFERENCE_ASSETS, type OtbReferenceAsset } from "@shared/otb"

export type SeededImage = ImageUpload & {
  previewUrl: string
  label: string
}

async function assetToUpload(asset: OtbReferenceAsset): Promise<SeededImage> {
  const response = await fetch(asset.url)
  if (!response.ok) {
    throw new Error(`Could not load ${asset.name}`)
  }
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return {
    name: asset.name,
    mime: asset.mime,
    extension: asset.extension,
    data_base64: btoa(binary),
    previewUrl: asset.url,
    label: asset.label,
  }
}

export async function loadOtbReferenceImages(): Promise<SeededImage[]> {
  return Promise.all(OTB_REFERENCE_ASSETS.map(assetToUpload))
}
