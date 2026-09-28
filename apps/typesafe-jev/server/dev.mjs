import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadEnv(file) {
  if (!existsSync(file)) return
  for (const rawLine of readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnv(path.join(root, ".env"))

const children = []

function start(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  })
  children.push(child)
  return child
}

function shutdown() {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill("SIGTERM")
    }
  }
}

process.on("SIGINT", () => {
  shutdown()
  process.exit(0)
})
process.on("SIGTERM", () => {
  shutdown()
  process.exit(0)
})

const api = start([
  "--disable-warning=ExperimentalWarning",
  "--experimental-strip-types",
  path.join(root, "server/index.ts"),
])

const ui = start([
  path.join(root, "node_modules/vite/bin/vite.js"),
  "--host",
  "127.0.0.1",
  "--port",
  "5173",
])

api.on("exit", (code) => {
  if (ui.exitCode === null) ui.kill("SIGTERM")
  process.exit(code ?? 0)
})

ui.on("exit", (code) => {
  if (api.exitCode === null) api.kill("SIGTERM")
  process.exit(code ?? 0)
})
