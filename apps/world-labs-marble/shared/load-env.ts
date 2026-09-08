import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

export function parseDotenv(text: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

export function applyDotenv(
  values: Record<string, string>,
  env: NodeJS.ProcessEnv = process.env,
): void {
  for (const [key, value] of Object.entries(values)) {
    if (env[key] === undefined) env[key] = value
  }
}

/** Load `.env` from the app root. Existing process.env values win. */
export function loadDotenv(appRoot: string): void {
  const envPath = resolve(appRoot, ".env")
  if (!existsSync(envPath)) return
  applyDotenv(parseDotenv(readFileSync(envPath, "utf8")))
}
