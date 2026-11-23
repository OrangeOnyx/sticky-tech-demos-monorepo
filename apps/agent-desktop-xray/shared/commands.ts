import type { A11yNode, CommandLine } from "./types.ts"

const QUALIFIED_REF = /^@[A-Za-z0-9]+:e[1-9][0-9]*$/
const BARE_REF = /^@e[0-9]+$/

export class InvalidRefError extends Error {
  readonly code = "INVALID_ARGS"

  constructor(ref: string) {
    super(
      `Invalid ref_id '${ref}': expected @<snapshot_id>:e<N>. A bare @eN ref is not accepted.`,
    )
    this.name = "InvalidRefError"
  }
}

export function isQualifiedRef(ref: string): boolean {
  return QUALIFIED_REF.test(ref)
}

export function isBareRef(ref: string): boolean {
  return BARE_REF.test(ref)
}

export function refSnapshotId(ref: string): string | null {
  if (!isQualifiedRef(ref)) return null
  return ref.slice(1, ref.lastIndexOf(":"))
}

function requireQualified(ref: string): string {
  if (!isQualifiedRef(ref)) throw new InvalidRefError(ref)
  return ref
}

function quoteRef(ref: string): string {
  return `'${requireQualified(ref)}'`
}

function quoteValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`
}

export function formatClickCmd(ref: string): string {
  return `agent-desktop click ${quoteRef(ref)}`
}

export function formatSetValueCmd(ref: string, value: string): string {
  return `agent-desktop set-value ${quoteRef(ref)} ${quoteValue(value)}`
}

export function formatCheckCmd(ref: string): string {
  return `agent-desktop check ${quoteRef(ref)}`
}

export function formatUncheckCmd(ref: string): string {
  return `agent-desktop uncheck ${quoteRef(ref)}`
}

function sampleValue(node: A11yNode): string {
  if (node.value && node.value.length > 0) return node.value
  if (node.name === "Title") return "Launch checklist"
  return "Launch checklist"
}

export function commandsForNode(node: A11yNode): CommandLine[] {
  const ref = node.ref_id
  if (!ref || !isQualifiedRef(ref)) return []

  const role = node.role.toLowerCase()
  if (
    role === "textfield" ||
    role === "textarea" ||
    role === "combobox" ||
    role === "searchbox"
  ) {
    return [
      {
        label: "Set value",
        command: formatSetValueCmd(ref, sampleValue(node)),
      },
    ]
  }

  if (role === "checkbox" || role === "switch") {
    const checked = node.states?.includes("checked") ?? false
    return checked
      ? [{ label: "Uncheck", command: formatUncheckCmd(ref) }]
      : [{ label: "Check", command: formatCheckCmd(ref) }]
  }

  return [{ label: "Click", command: formatClickCmd(ref) }]
}

export function detectStaleRef(envelope: unknown): boolean {
  if (typeof envelope !== "object" || envelope === null) return false
  const record = envelope as { ok?: unknown; error?: unknown }
  if (record.ok !== false) return false
  if (typeof record.error !== "object" || record.error === null) return false
  return (record.error as { code?: unknown }).code === "STALE_REF"
}

export function containsBareRef(command: string): boolean {
  return /(?:^|\s)'?@e\d+'?(?:\s|$)/.test(command)
}
