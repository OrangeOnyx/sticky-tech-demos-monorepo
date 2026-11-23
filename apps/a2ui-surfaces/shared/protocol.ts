export const PROPERTY_CATALOG_ID =
  "https://cypresscommand.example/a2ui/property-ops/v0.9"

export const PROTOCOL_VERSION = "v0.9" as const

export const ENVELOPE_KEYS = [
  "createSurface",
  "updateComponents",
  "updateDataModel",
  "deleteSurface",
] as const

export type EnvelopeKey = (typeof ENVELOPE_KEYS)[number]

export type ComponentDef = {
  id: string
  component: string
} & Record<string, unknown>

export type A2uiMessage = {
  version: typeof PROTOCOL_VERSION
  createSurface?: { surfaceId: string; catalogId: string }
  updateComponents?: { surfaceId: string; components: ComponentDef[] }
  updateDataModel?: { surfaceId: string; path?: string; value?: unknown }
  deleteSurface?: { surfaceId: string }
}

export function messageKind(message: A2uiMessage): EnvelopeKey | "invalid" {
  const present = ENVELOPE_KEYS.filter((key) => message[key] !== undefined)
  if (present.length !== 1) return "invalid"
  return present[0]
}

export function surfaceIdOf(message: A2uiMessage): string | undefined {
  const kind = messageKind(message)
  if (kind === "invalid") return undefined
  return message[kind]?.surfaceId
}

export function messageSummary(message: A2uiMessage): string {
  const kind = messageKind(message)
  if (kind === "createSurface") {
    return `createSurface · ${message.createSurface?.surfaceId ?? ""}`
  }
  if (kind === "deleteSurface") {
    return `deleteSurface · ${message.deleteSurface?.surfaceId ?? ""}`
  }
  if (kind === "updateDataModel") {
    return `updateDataModel · ${message.updateDataModel?.path ?? "/"}`
  }
  if (kind === "updateComponents") {
    const ids = (message.updateComponents?.components ?? [])
      .map((component) => component.id)
      .join(", ")
    return `updateComponents · ${ids}`
  }
  return "invalid message"
}

export function fixtureProblems(messages: readonly A2uiMessage[]): string[] {
  const problems: string[] = []
  if (messages.length === 0) {
    problems.push("fixture is empty")
    return problems
  }

  const firstKind = messageKind(messages[0])
  if (firstKind !== "createSurface") {
    problems.push("first message must be createSurface")
  }

  const expectedSurface = surfaceIdOf(messages[0])
  let sawRoot = false

  messages.forEach((message, index) => {
    const label = `message ${index + 1}`
    if (message.version !== PROTOCOL_VERSION) {
      problems.push(`${label} version must be ${PROTOCOL_VERSION}`)
    }
    const kind = messageKind(message)
    if (kind === "invalid") {
      problems.push(`${label} must have exactly one envelope key`)
      return
    }
    const surfaceId = surfaceIdOf(message)
    if (!surfaceId) problems.push(`${label} is missing surfaceId`)
    if (expectedSurface && surfaceId && surfaceId !== expectedSurface) {
      problems.push(`${label} surfaceId ${surfaceId} does not match ${expectedSurface}`)
    }
    if (kind === "createSurface" && message.createSurface?.catalogId !== PROPERTY_CATALOG_ID) {
      problems.push(`${label} catalogId must be the property catalog`)
    }
    if (kind === "updateComponents") {
      for (const component of message.updateComponents?.components ?? []) {
        if (!component.id) problems.push(`${label} has a component without id`)
        if (!component.component) problems.push(`${label} has a component without component`)
        if (component.id === "root") sawRoot = true
      }
    }
  })

  if (!sawRoot) problems.push("no component with id root")
  return problems
}
