export type ImageUpload = {
  name: string
  mime: string
  extension: string
  data_base64: string
}

export type GenerateRequest = {
  text_prompt?: string
  display_name?: string
  draft?: boolean
  auto_enhance?: boolean
  images?: ImageUpload[]
}

export type WorldPrompt =
  | {
      type: "text"
      text_prompt: string
      disable_recaption?: boolean
    }
  | {
      type: "image"
      text_prompt?: string | null
      disable_recaption?: boolean
      image_prompt: {
        source: "data_base64"
        data_base64: string
        extension?: string
      }
    }
  | {
      type: "multi-image"
      text_prompt?: string | null
      disable_recaption?: boolean
      multi_image_prompt: Array<{
        azimuth: number
        content: {
          source: "data_base64"
          data_base64: string
          extension?: string
        }
      }>
    }

export type OperationProgress = {
  status: string
  description: string
  percent?: number
}

export type WorldAssets = {
  caption?: string | null
  thumbnail_url?: string | null
  splats?: {
    spz_urls?: Record<string, string> | null
    semantics_metadata?: {
      metric_scale_factor?: number
      ground_plane_offset?: number
    } | null
  } | null
  mesh?: {
    collider_mesh_url?: string | null
    hq_mesh_url?: string | null
    full_res_mesh_url?: string | null
  } | null
  imagery?: {
    pano_url?: string | null
  } | null
}

export type World = {
  id: string
  display_name?: string | null
  world_marble_url?: string | null
  assets?: WorldAssets | null
  created_at?: string | null
  updated_at?: string | null
  world_prompt?: unknown
  model?: string | null
  source?: "fixture" | "live"
}

export type Operation = {
  operation_id: string
  created_at?: string | null
  updated_at?: string | null
  expires_at?: string | null
  done: boolean
  error?: { message?: string; code?: string } | null
  metadata?: {
    progress?: OperationProgress
    world_id?: string
  } | null
  response?: World | null
  source?: "fixture" | "live"
}
