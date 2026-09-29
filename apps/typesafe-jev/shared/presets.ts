import type { Candidate } from "./types.ts"

export type Preset = {
  id: string
  label: string
  candidate: Candidate
}

export const PRESETS: Preset[] = [
  {
    id: "strong-sticky",
    label: "Strong sticky MVP",
    candidate: {
      title: "Bookmark triage for one person",
      url: "https://example.com/bookmark-triage",
      blurb:
        "Single-user web MVP. Paste a bookmark and see a keep-or-drop verdict in the browser. Self-contained Vite app under apps/. Fixture mode needs no API key.",
    },
  },
  {
    id: "listicle",
    label: "Listicle / near miss",
    candidate: {
      title: "50 AI tools to bookmark this week",
      url: "https://example.com/50-ai-tools",
      blurb:
        "A listicle roundup of trending tools plus a prompt pack. Not a product you can run. Interesting links, no single-user loop to demo.",
    },
  },
  {
    id: "heavy-infra",
    label: "Heavy infra",
    candidate: {
      title: "Local GPU multiplayer world",
      url: "https://example.com/gpu-world",
      blurb:
        "Heavy realtime multiplayer that needs a local CUDA GPU and a native client. Not a self-contained web MVP.",
    },
  },
  {
    id: "already-built",
    label: "Already built",
    candidate: {
      title: "USGS LiDAR elevation viewer",
      url: "https://example.com/lidar-viewer",
      blurb:
        "Already built in this monorepo as an existing demo. Search an address and crossfade hillshade. Interesting, but it is a duplicate of an app that already exists.",
    },
  },
]
