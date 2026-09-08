import { expect, test } from "bun:test"
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"

const appDir = path.resolve(import.meta.dirname, "..")

function expectLoopbackListener(port: number) {
  // On Linux, inspect the socket itself without probing a network peer.
  if (process.platform !== "linux") return
  const listeners = ["/proc/net/tcp", "/proc/net/tcp6"].flatMap((file) =>
    readFileSync(file, "utf8").trim().split("\n").slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((fields) => fields[3] === "0A" && parseInt(fields[1].split(":")[1], 16) === port),
  )
  expect(listeners.length).toBeGreaterThan(0)
  for (const fields of listeners) expect(fields[1].split(":")[0]).toBe("0100007F")
}

async function freePort() {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const port = (server.address() as { port: number }).port
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return port
}

async function waitFor(url: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch { /* Server is still starting. */ }
    await Bun.sleep(50)
  }
  throw new Error(`Server did not start: ${url}`)
}

// Isolate .env files and keys from the operator's app. No real upstream calls.
async function withApp(
  envFile: string,
  inheritedPort: string | undefined,
  run: (start: (script: string) => void) => Promise<void>,
  overrides: Record<string, string> = {},
) {
  const dir = mkdtempSync(path.join(tmpdir(), "marble-local-test-"))
  const children: ReturnType<typeof Bun.spawn>[] = []
  try {
    for (const file of ["server", "shared", "vite.config.ts", "package.json"])
      cpSync(path.join(appDir, file), path.join(dir, file), { recursive: true })
    symlinkSync(path.join(appDir, "node_modules"), path.join(dir, "node_modules"), "dir")
    writeFileSync(path.join(dir, ".env"), envFile)
    const env: Record<string, string | undefined> = { ...process.env, WLT_API_KEY: "", MARBLE_API_BASE: "http://127.0.0.1:1", NODE_ENV: "development", ...overrides }
    delete env.PORT
    if (inheritedPort !== undefined) env.PORT = inheritedPort
    await run((script) => children.push(Bun.spawn({
      cmd: [process.execPath, "run", script], cwd: dir, env,
      stdout: "ignore", stderr: "inherit",
    })))
  } finally {
    for (const child of children) child.kill()
    await Promise.all(children.map((child) => child.exited))
    rmSync(dir, { recursive: true, force: true })
  }
}

test("API rejects foreign origins and hosts before generating and binds only to loopback", async () => {
  const port = await freePort()
  await withApp(`PORT=${port}\n`, undefined, async (start) => {
    start("dev:api")
    const base = `http://127.0.0.1:${port}`
    await waitFor(`${base}/api/health`)
    for (const headers of [
      { Origin: "https://attacker.example", "Content-Type": "text/plain" },
      { Origin: "null", "Content-Type": "application/json" },
      { Host: `attacker.example:${port}`, "Content-Type": "application/json" },
    ]) {
      const response = await fetch(`${base}/api/generate`, {
        method: "POST", headers, body: JSON.stringify({ text_prompt: "test" }),
      })
      expect(response.status).toBe(403)
      expect(response.headers.has("access-control-allow-origin")).toBe(false)
    }
    const preflight = await fetch(`${base}/api/generate`, {
      method: "OPTIONS", headers: { Origin: "https://attacker.example", "Access-Control-Request-Method": "POST" },
    })
    expect(preflight.status).toBe(403)
    const response = await fetch(`${base}/api/generate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_prompt: "test" }),
    })
    expect(response.status).toBe(200)
    expect((await response.json()).source).toBe("fixture")
    expectLoopbackListener(port)
  })
}, 15000)

for (const scenario of ["missing", "blank", "dotenv", "inherited"] as const) {
  test(`Vite proxies to the API with ${scenario} PORT and stays on loopback`, async () => {
    const port = scenario === "missing" || scenario === "blank" ? 3001 : await freePort()
    const envFile = scenario === "missing" ? "" : `PORT=${scenario === "blank" ? "" : scenario === "inherited" ? await freePort() : port}\n`
    await withApp(envFile, scenario === "inherited" ? String(port) : undefined, async (start) => {
      start(scenario === "missing" ? "dev" : "dev:api")
      await waitFor(`http://127.0.0.1:${port}/api/health`)
      if (scenario !== "missing") start("dev:ui")
      const config = await waitFor("http://127.0.0.1:5173/api/config")
      expect((await config.json()).mode).toBe("fixture")
      const response = await fetch("http://127.0.0.1:5173/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:5173" },
        body: JSON.stringify({ text_prompt: "test via Vite" }),
      })
      expect(response.status).toBe(200)
      const operation = await response.json()
      expect(operation.source).toBe("fixture")
      expect((await fetch(`http://127.0.0.1:5173/api/operations/${operation.operation_id}`)).status).toBe(200)
      const rejected = await fetch("http://127.0.0.1:5173/api/generate", {
        method: "POST", headers: { "Content-Type": "text/plain", Origin: "https://attacker.example" },
        body: JSON.stringify({ text_prompt: "must reject" }),
      })
      expect(rejected.status).toBe(403)
      expectLoopbackListener(5173)
    })
  }, 20000)
}

test("live-mode guard blocks untrusted requests before calling a local mock upstream", async () => {
  let calls = 0
  const upstream = Bun.serve({
    hostname: "127.0.0.1", port: 0,
    fetch(req) {
      calls++
      expect(new URL(req.url).pathname).toBe("/worlds:generate")
      expect(req.headers.get("WLT-Api-Key")).toBe("local-test-key")
      return Response.json({ operation_id: "mock-operation", done: false })
    },
  })
  try {
    const port = await freePort()
    await withApp(`PORT=${port}\n`, undefined, async (start) => {
      start("dev:api")
      const base = `http://127.0.0.1:${port}`
      const health = await waitFor(`${base}/api/health`)
      expect((await health.json()).mode).toBe("live")
      const blocked = await fetch(`${base}/api/generate`, {
        method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" },
        body: JSON.stringify({ text_prompt: "must not spend" }),
      })
      expect(blocked.status).toBe(403)
      expect(calls).toBe(0)
      const allowed = await fetch(`${base}/api/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_prompt: "local mock only" }),
      })
      expect(allowed.status).toBe(200)
      expect((await allowed.json()).source).toBe("live")
      expect(calls).toBe(1)
    }, { WLT_API_KEY: "local-test-key", MARBLE_API_BASE: `http://127.0.0.1:${upstream.port}` })
  } finally {
    upstream.stop(true)
  }
}, 15000)
