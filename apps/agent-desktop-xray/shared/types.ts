export const CONTRACT_VERSION = "2.6"

export type Disposition = {
  delivery:
    | "not_delivered"
    | "delivery_uncertain"
    | "delivered_unverified"
    | "delivered_verified"
    | "unknown"
  retry: "safe" | "unsafe" | "unknown"
}

export type NativeId = {
  kind: string
  value: string
}

export type A11yNode = {
  role: string
  name?: string
  value?: string
  description?: string
  ref_id?: string
  available_actions?: string[]
  states?: string[]
  native_id?: NativeId
  children?: A11yNode[]
}

export type SnapshotData = {
  app: string
  snapshot_id: string
  ref_count: number
  complete: boolean
  window?: {
    id: string
    title: string
  }
  tree: A11yNode
}

export type SnapshotEnvelope = {
  version: typeof CONTRACT_VERSION
  ok: true
  command: "snapshot"
  data: SnapshotData
}

export type ActionEnvelope = {
  version: typeof CONTRACT_VERSION
  ok: true
  command: string
  data: {
    action: string
    disposition: Disposition
  }
}

export type ErrorEnvelope = {
  version: typeof CONTRACT_VERSION
  ok: false
  command: string
  error: {
    code: string
    message: string
    suggestion?: string
    recovery?: {
      strategy: string
      retryable: boolean
      requires_fresh_snapshot: boolean
    }
    disposition: Disposition
    details?: {
      kind?: string
    }
  }
}

export type Envelope = SnapshotEnvelope | ActionEnvelope | ErrorEnvelope

export type CommandLine = {
  label: string
  command: string
}
