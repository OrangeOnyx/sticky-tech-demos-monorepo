import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const isWin = process.platform === "win32"
const pathKey = isWin && process.env.Path ? "Path" : "PATH"
const env = {
  ...process.env,
  [pathKey]: `${resolve(appRoot, "node_modules", ".bin")}${isWin ? ";" : ":"}${process.env[pathKey] ?? process.env.PATH ?? ""}`,
}

function run(bin, args) {
  return spawn(bin, args, {
    cwd: appRoot,
    stdio: "inherit",
    shell: isWin,
    env,
    windowsHide: true,
  })
}

const api = run("tsx", ["server/index.ts"])
const ui = run("vite", [])

let shuttingDown = false

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  api.kill()
  ui.kill()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

api.on("exit", (code) => {
  if (shuttingDown) return
  if (code) console.error(`API exited with ${code}`)
  shutdown()
  process.exit(code ?? 0)
})

ui.on("exit", (code) => {
  if (shuttingDown) return
  if (code) console.error(`Vite exited with ${code}`)
  shutdown()
  process.exit(code ?? 0)
})
