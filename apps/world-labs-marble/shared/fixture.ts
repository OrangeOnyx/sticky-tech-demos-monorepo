import { displayNameFromPrompt } from "./prompt"
import type { GenerateRequest, Operation, World } from "./types"

const FIXTURE_DURATION_MS = 4500

type FixtureJob = {
  operation_id: string
  created_at: number
  request: GenerateRequest
  world_id: string
}

const jobs = new Map<string, FixtureJob>()
const worlds = new Map<string, World>()

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

function captionFor(request: GenerateRequest): string {
  const text = request.text_prompt?.trim()
  const imageCount = request.images?.length ?? 0
  if (text && imageCount) {
    return `Fixture sample of “${text}”, guided by ${imageCount} reference image${imageCount === 1 ? "" : "s"}. Drag to look around the stand-in scene.`
  }
  if (text) {
    return `Fixture sample of “${text}”. Live Marble would return Gaussian splats for this prompt; this local scene stands in so the generate → poll → view loop still runs.`
  }
  return `Fixture sample from ${imageCount} uploaded image${imageCount === 1 ? "" : "s"}. Live Marble would reconstruct a splat world from the photos.`
}

export function createFixtureJob(request: GenerateRequest): Operation {
  const operation_id = crypto.randomUUID()
  const world_id = `fixture-${operation_id.slice(0, 8)}`
  const created_at = Date.now()
  const job: FixtureJob = { operation_id, created_at, request, world_id }
  jobs.set(operation_id, job)

  const world: World = {
    id: world_id,
    display_name: displayNameFromPrompt(
      request.display_name,
      request.text_prompt ?? "",
    ),
    world_marble_url: `/#world=${world_id}`,
    assets: {
      caption: captionFor(request),
      thumbnail_url: "/fixture/thumbnail.svg",
      imagery: { pano_url: "/fixture/pano.svg" },
      splats: { spz_urls: null },
    },
    created_at: iso(created_at),
    updated_at: iso(created_at + FIXTURE_DURATION_MS),
    world_prompt: {
      type: (request.images?.length ?? 0) > 1
        ? "multi-image"
        : (request.images?.length ?? 0) === 1
          ? "image"
          : "text",
      text_prompt: request.text_prompt?.trim() || null,
    },
    model: request.draft ? "marble-1.0-draft" : "marble-1.1",
    source: "fixture",
  }
  worlds.set(world_id, world)

  return getFixtureOperation(operation_id) as Operation
}

function stageFor(elapsed: number): {
  done: boolean
  progress: { status: string; description: string; percent: number }
} {
  if (elapsed < 900) {
    return {
      done: false,
      progress: {
        status: "QUEUED",
        description: "Queued fixture generation",
        percent: 12,
      },
    }
  }
  if (elapsed < 2000) {
    return {
      done: false,
      progress: {
        status: "IN_PROGRESS",
        description: "Captioning prompt and packing references",
        percent: 38,
      },
    }
  }
  if (elapsed < 3400) {
    return {
      done: false,
      progress: {
        status: "IN_PROGRESS",
        description: "Generating sample world",
        percent: 67,
      },
    }
  }
  if (elapsed < FIXTURE_DURATION_MS) {
    return {
      done: false,
      progress: {
        status: "IN_PROGRESS",
        description: "Preparing in-browser viewer",
        percent: 88,
      },
    }
  }
  return {
    done: true,
    progress: {
      status: "SUCCEEDED",
      description: "World generation completed successfully",
      percent: 100,
    },
  }
}

export function getFixtureOperation(operation_id: string): Operation | null {
  const job = jobs.get(operation_id)
  if (!job) return null

  const elapsed = Date.now() - job.created_at
  const stage = stageFor(elapsed)
  const world = worlds.get(job.world_id)

  return {
    operation_id: job.operation_id,
    created_at: iso(job.created_at),
    updated_at: iso(job.created_at + elapsed),
    expires_at: iso(job.created_at + 60 * 60 * 1000),
    done: stage.done,
    error: null,
    metadata: {
      progress: stage.progress,
      world_id: job.world_id,
    },
    response: stage.done ? (world ?? null) : null,
    source: "fixture",
  }
}

export function getFixtureWorld(world_id: string): World | null {
  return worlds.get(world_id) ?? null
}

export function fixtureDurationMs(): number {
  return FIXTURE_DURATION_MS
}

export function resetFixtureStore(): void {
  jobs.clear()
  worlds.clear()
}
