import type { DesignSummary, PaletteRole, TypeStep } from "./types.ts"

function section(markdown: string, heading: string): string {
  const pattern = new RegExp(`## ${heading}\\n+([\\s\\S]*?)(?=\\n## |$)`)
  return markdown.match(pattern)?.[1]?.trim() ?? ""
}

function paletteRoles(block: string): PaletteRole[] {
  const roles: PaletteRole[] = []
  for (const line of block.split("\n")) {
    const match = line.match(/\|\s*`?(#[0-9a-fA-F]{3,8})`?\s*\|\s*([^|]+)\|/)
    if (!match) continue
    const hex = match[1]
    const role = match[2]
    if (!hex || !role || role.toLowerCase().includes("role")) continue
    roles.push({ hex, role: role.trim() })
  }
  return roles
}

function typeSteps(block: string): TypeStep[] {
  const steps: TypeStep[] = []
  for (const line of block.split("\n")) {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
    if (cells.length < 4) continue
    const [role, family, size, weight] = cells
    if (!role || !family || !size || !weight) continue
    if (role.toLowerCase() === "role" || role.startsWith("---")) continue
    steps.push({ role, family, size, weight })
  }
  return steps
}

function inlineCodeList(block: string): string | null {
  const codes = [...block.matchAll(/`([^`]+)`/g)].map((match) => match[1]).filter(Boolean)
  if (codes.length === 0) return null
  return codes.join(" · ")
}

export function summarizeDesign(markdown: string): DesignSummary {
  return {
    paletteRoles: paletteRoles(section(markdown, "Colors")),
    typeSteps: typeSteps(section(markdown, "Typography")),
    spacing: inlineCodeList(section(markdown, "Spacing scale")),
    radii: inlineCodeList(section(markdown, "Border radius")),
  }
}
