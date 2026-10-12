import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const children = []

function start(args, env) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env,
  })
  children.push(child)
  return child
}

function shutdown() {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill("SIGTERM")
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
], process.env)

const uiEnv = { ...process.env }
delete uiEnv.ANTHROPIC_API_KEY

const ui = start([
  path.join(root, "node_modules/vite/bin/vite.js"),
  "--host",
  "127.0.0.1",
  "--port",
  "5173",
], uiEnv)

api.on("exit", (code) => {
  if (ui.exitCode === null) ui.kill("SIGTERM")
  process.exit(code ?? 0)
})

ui.on("exit", (code) => {
  if (api.exitCode === null) api.kill("SIGTERM")
  process.exit(code ?? 0)
})
