import assert from "node:assert/strict"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { test } from "node:test"
import { buildExplainerSpec } from "../shared/build-spec.ts"
import { FIXTURES } from "../shared/fixtures.ts"
import { parseRentRoll } from "../shared/parse.ts"
import type { ExplainerSpec } from "../shared/spec.ts"
import { explainRentRoll, type ExplainResponse } from "./explain.ts"
import { createHandler } from "./http.ts"

const maple = FIXTURES[0]
if (!maple) throw new Error("missing fixture")

function isExplain(body: unknown): body is ExplainResponse {
  return Boolean(body && typeof body === "object" && "spec" in body && "source" in body)
}

function baseline() {
  const parsed = parseRentRoll(maple.csv, { propertyName: maple.propertyName })
  if (!parsed.ok) throw new Error(parsed.error)
  return { metrics: parsed.metrics, spec: buildExplainerSpec(parsed.metrics) }
}

test("fixture mode never calls Anthropic and hides the key", async () => {
  let called = false
  const result = await explainRentRoll({
    mode: "fixture",
    text: maple.csv,
    propertyName: maple.propertyName,
    apiKey: "sk-ant-test-secret",
    fetchImpl: async () => {
      called = true
      throw new Error("should not be called")
    },
  })
  assert.equal(called, false)
  assert.equal(result.status, 200)
  assert.equal(isExplain(result.body), true)
  if (!isExplain(result.body)) return
  assert.equal(result.body.source, "fixture")
  assert.equal(result.body.mode, "fixture")
  assert.equal(result.body.model, null)
  assert.equal(JSON.stringify(result.body).includes("sk-ant-test-secret"), false)
  assert.equal(result.body.metrics.propertyName, "Maple Court Plaza")
})

test("live mode locks figures and keeps rewritten copy", async () => {
  const { spec } = baseline()
  const rewritten = structuredClone(spec) as ExplainerSpec
  const title = rewritten.scenes.find((scene) => scene.type === "title")
  const occupancy = rewritten.scenes.find((scene) => scene.type === "occupancy")
  if (title?.type === "title") {
    title.subtitle = "A quieter read"
    title.propertyName = "Secret Tower"
  }
  if (occupancy?.type === "occupancy") occupancy.bySqft = 1

  let sawKey = false
  const result = await explainRentRoll({
    mode: "live",
    text: maple.bullets,
    propertyName: maple.propertyName,
    apiKey: "sk-ant-test-secret",
    model: "claude-sonnet-5-5",
    fetchImpl: async (url, init) => {
      const headers = new Headers(init?.headers)
      sawKey = headers.get("x-api-key") === "sk-ant-test-secret"
      const raw = typeof init?.body === "string" ? init.body : ""
      assert.equal(String(url), "https://api.anthropic.com/v1/messages")
      assert.equal(raw.includes("sk-ant-test-secret"), false)
      assert.equal(raw.includes("Maple Court Plaza"), true)
      assert.equal(raw.includes("Northwind Coffee"), true)
      return new Response(
        JSON.stringify({ content: [{ type: "text", text: JSON.stringify(rewritten) }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    },
  })

  assert.equal(sawKey, true)
  assert.equal(result.status, 200)
  if (!isExplain(result.body)) return
  assert.equal(result.body.source, "live")
  assert.equal(result.body.model, "claude-sonnet-5-5")
  const nextTitle = result.body.spec.scenes.find((scene) => scene.type === "title")
  const nextOccupancy = result.body.spec.scenes.find((scene) => scene.type === "occupancy")
  assert.equal(nextTitle?.type === "title" ? nextTitle.subtitle : "", "A quieter read")
  assert.equal(nextTitle?.type === "title" ? nextTitle.propertyName : "", "Maple Court Plaza")
  assert.equal(nextOccupancy?.type === "occupancy" ? nextOccupancy.bySqft : 0, 82.5)
  assert.equal(JSON.stringify(result.body).includes("sk-ant-test-secret"), false)
})

test("invalid model output falls back to the fixture-style spec", async () => {
  const { spec } = baseline()
  const result = await explainRentRoll({
    mode: "live",
    text: maple.csv,
    propertyName: maple.propertyName,
    apiKey: "sk-ant-test-secret",
    fetchImpl: async () =>
      new Response(JSON.stringify({ content: [{ type: "text", text: "sure thing" }] }), {
        status: 200,
      }),
  })
  assert.equal(result.status, 200)
  if (!isExplain(result.body)) return
  assert.equal(result.body.source, "fallback")
  assert.match(result.body.warning ?? "", /fixture-style/)
  assert.deepEqual(result.body.spec, spec)
})

test("a partial scene list falls back", async () => {
  const { spec } = baseline()
  const partial = { ...spec, scenes: spec.scenes.slice(0, 3) }
  const result = await explainRentRoll({
    mode: "live",
    text: maple.csv,
    apiKey: "sk-ant-test-secret",
    fetchImpl: async () =>
      new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(partial) }] }), {
        status: 200,
      }),
  })
  if (!isExplain(result.body)) return
  assert.equal(result.body.source, "fallback")
  assert.equal(result.body.spec.scenes.length, 7)
})

test("auth and network failures stay errors", async () => {
  const denied = await explainRentRoll({
    mode: "live",
    text: maple.csv,
    apiKey: "sk-ant-test-secret",
    fetchImpl: async () => new Response("no", { status: 401 }),
  })
  assert.equal(denied.status, 502)
  assert.equal("error" in denied.body && denied.body.error.includes("API key"), true)

  const offline = await explainRentRoll({
    mode: "live",
    text: maple.csv,
    apiKey: "sk-ant-test-secret",
    fetchImpl: async () => {
      throw new Error("connect ECONNREFUSED")
    },
  })
  assert.equal(offline.status, 502)
  assert.equal("error" in offline.body ? offline.body.error : "", "Could not reach Anthropic.")
  assert.equal(JSON.stringify(offline.body).includes("sk-ant-test-secret"), false)
})

test("live mode without a key and bad requests are rejected", async () => {
  const missing = await explainRentRoll({ mode: "live", text: maple.csv, apiKey: "  " })
  assert.equal(missing.status, 400)
  const badMode = await explainRentRoll({ mode: "auto", text: maple.csv })
  assert.equal(badMode.status, 400)
  const empty = await explainRentRoll({ mode: "fixture", text: "   " })
  assert.equal(empty.status, 400)
})

async function withServer(
  apiKey: string | undefined,
  run: (base: string) => Promise<void>,
) {
  const handler = createHandler({ apiKey })
  const server = createServer((req, res) => {
    void handler(req, res)
  })
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })
  const address = server.address() as AddressInfo
  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test("HTTP fixture explain and health", async () => {
  await withServer(undefined, async (base) => {
    const health = await fetch(`${base}/api/health`)
    assert.deepEqual(await health.json(), { ok: true, liveReady: false })
    const response = await fetch(`${base}/api/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "fixture",
        text: maple.csv,
        propertyName: maple.propertyName,
      }),
    })
    assert.equal(response.status, 200)
    const body = (await response.json()) as ExplainResponse
    assert.equal(body.source, "fixture")
    assert.equal(body.metrics.totalMonthlyRent, 30000)
    const missing = await fetch(`${base}/api/missing`)
    assert.equal(missing.status, 404)
    const live = await fetch(`${base}/api/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "live", text: maple.csv }),
    })
    assert.equal(live.status, 400)
  })

  await withServer("sk-ant-test-secret", async (base) => {
    const health = await fetch(`${base}/api/health`)
    const payload = (await health.json()) as { liveReady: boolean }
    assert.equal(payload.liveReady, true)
    assert.equal(JSON.stringify(payload).includes("sk-ant-test-secret"), false)
  })
})
