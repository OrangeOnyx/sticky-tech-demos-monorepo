const REQUIRED = "Node ^24.22.1 or >=26.12.1"

export function isSupportedNodeVersion(version: string): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  if (major === 24) return minor > 22 || (minor === 22 && patch >= 1)
  if (major > 26) return true
  if (major === 26) return minor > 12 || (minor === 12 && patch >= 1)
  return false
}

export function nodeVersionMessage(version = process.versions.node): string {
  return [
    `REA X-ray needs ${REQUIRED}. This process is v${version}.`,
    "Install Node 24.22.1 from .nvmrc and start again.",
    "SQLite inspection uses DatabaseSync.limits from Node 24.15+ and current Node 26.",
  ].join("\n")
}

export function assertSupportedNode(): void {
  if (isSupportedNodeVersion(process.versions.node)) return
  console.error(nodeVersionMessage())
  process.exit(1)
}
