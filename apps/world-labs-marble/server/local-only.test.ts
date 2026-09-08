import assert from "node:assert/strict"
import { spawn, type ChildProcess } from "node:child_process"
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createServer as createNetServer } from "node:net"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function expectLoopbackListener(port: number) {
  if (process.platform !== "linux") return
  const listeners = ["/proc/net/tcp", "/proc/net/tcp6"].flatMap((file) =>
    readFileSync(file, "utf8")
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter(
        (fields) =>
          fields[3] === "0A" && parseInt(fields[1].split(":")[1], 16) === port,
      ),
  )
  assert.ok(listeners.length > 0)
  for (const fields of listeners) {
    assert.equal(fields[1].split(":")[0], "0100007F")
  }
}

async function freePort() {
  const server = createNetServer()
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
    } catch {
      /* Server is still starting. */
    }
    await sleep(50)
  }
  throw new Error(`Server did not start: ${url}`)
}

async function withApp(
  envFile: string,
  inheritedPort: string | undefined,
  run: (start: (script: string) => void) => Promise<void>,
  overrides: Record<string, string> = {},
) {
  const dir = mkdtempSync(path.join(tmpdir(), "marble-local-test-"))
  const children: ChildProcess[] = []
  try {
    for (const file of ["server", "shared", "vite.config.ts", "package.json"]) {
      cpSync(path.join(appDir, file), path.join(dir, file), { recursive: true })
    }
    symlinkSync(path.join(appDir, "node_modules"), path.join(dir, "node_modules"), "dir")
    writeFileSync(path.join(dir, ".env"), envFile)
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      WLT_API_KEY: "",
      MARBLE_API_BASE: "http://127.0.0.1:1",
      NODE_ENV: "development",
      ...overrides,
    }
    delete env.PORT
    if (inheritedPort !== undefined) env.PORT = inheritedPort
    await run((script) => {
      children.push(
        spawn("npm", ["run", script], {
          cwd: dir,
          env,
          stdio: ["ignore", "ignore", "inherit"],
          shell: process.platform === "win32",
        }),
      )
    })
  } finally {
    for (const child of children) child.kill()
    await Promise.all(
      children.map(
        (child) =>
          new Promise<void>((resolve) => {
            if (child.exitCode !== null || child.signalCode) {
              resolve()
              return
            }
            child.once("exit", () => resolve())
          }),
      ),
    )
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
        method: "POST",
        headers,
        body: JSON.stringify({ text_prompt: "test" }),
      })
      assert.equal(response.status, 403)
      assert.equal(response.headers.has("access-control-allow-origin"), false)
    }
    const preflight = await fetch(`${base}/api/generate`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://attacker.example",
        "Access-Control-Request-Method": "POST",
      },
    })
    assert.equal(preflight.status, 403)
    const response = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_prompt: "test" }),
    })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).source, "fixture")
    expectLoopbackListener(port)
  })
})

for (const scenario of ["missing", "blank", "dotenv", "inherited"] as const) {
  test(`Vite proxies to the API with ${scenario} PORT and stays on loopback`, async () => {
    const port =
      scenario === "missing" || scenario === "blank" ? 3001 : await freePort()
    const envFile =
      scenario === "missing"
        ? ""
        : `PORT=${scenario === "blank" ? "" : scenario === "inherited" ? await freePort() : port}\n`
    await withApp(
      envFile,
      scenario === "inherited" ? String(port) : undefined,
      async (start) => {
        start(scenario === "missing" ? "dev" : "dev:api")
        await waitFor(`http://127.0.0.1:${port}/api/health`)
        if (scenario !== "missing") start("dev:ui")
        const config = await waitFor("http://127.0.0.1:5173/api/config")
        assert.equal((await config.json()).mode, "fixture")
        const response = await fetch("http://127.0.0.1:5173/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://127.0.0.1:5173",
          },
          body: JSON.stringify({ text_prompt: "test via Vite" }),
        })
        assert.equal(response.status, 200)
        const operation = await response.json()
        assert.equal(operation.source, "fixture")
        assert.equal(
          (
            await fetch(
              `http://127.0.0.1:5173/api/operations/${operation.operation_id}`,
            )
          ).status,
          200,
        )
        const rejected = await fetch("http://127.0.0.1:5173/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Origin: "https://attacker.example",
          },
          body: JSON.stringify({ text_prompt: "must reject" }),
        })
        assert.equal(rejected.status, 403)
        expectLoopbackListener(5173)
      },
    )
  })
}

test("live-mode guard blocks untrusted requests before calling a local mock upstream", async () => {
  let calls = 0
  const upstream = createHttpServer((req, res) => {
    calls++
    assert.equal(req.url, "/worlds:generate")
    assert.equal(req.headers["wlt-api-key"], "local-test-key")
    res.statusCode = 200
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ operation_id: "mock-operation", done: false }))
  })
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  const upstreamPort = (upstream.address() as { port: number }).port
  try {
    const port = await freePort()
    await withApp(
      `PORT=${port}\n`,
      undefined,
      async (start) => {
        start("dev:api")
        const base = `http://127.0.0.1:${port}`
        const health = await waitFor(`${base}/api/health`)
        assert.equal((await health.json()).mode, "live")
        const blocked = await fetch(`${base}/api/generate`, {
          method: "POST",
          headers: {
            Origin: "https://attacker.example",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text_prompt: "must not spend" }),
        })
        assert.equal(blocked.status, 403)
        assert.equal(calls, 0)
        const allowed = await fetch(`${base}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text_prompt: "local mock only" }),
        })
        assert.equal(allowed.status, 200)
        assert.equal((await allowed.json()).source, "live")
        assert.equal(calls, 1)
      },
      {
        WLT_API_KEY: "local-test-key",
        MARBLE_API_BASE: `http://127.0.0.1:${upstreamPort}`,
      },
    )
  } finally {
    await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})
