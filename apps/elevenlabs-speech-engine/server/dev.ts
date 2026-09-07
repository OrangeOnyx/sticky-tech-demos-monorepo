const api = Bun.spawn({
  cmd: ["bun", "run", "server/index.ts"],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
})

const ui = Bun.spawn({
  cmd: ["bunx", "--bun", "vite", "--host"],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
})

function shutdown() {
  api.kill()
  ui.kill()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

const [apiCode, uiCode] = await Promise.all([api.exited, ui.exited])

if (api.exitCode !== null && ui.exitCode === null) {
  ui.kill()
}

if (ui.exitCode !== null && api.exitCode === null) {
  api.kill()
}

process.exit(apiCode || uiCode)
