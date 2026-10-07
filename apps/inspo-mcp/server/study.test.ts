import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { PRESETS } from "../shared/presets.ts"
import { buildToolCall, parseMcpBody } from "./mcp.ts"
import { runStudy, type StudyDeps } from "./study.ts"

const pricing = PRESETS.find((item) => item.id === "dark-saas-pricing")
assert.ok(pricing)

describe("study API", () => {
  it("serves the fixture path with no network", async () => {
    let called = false
    const deps: StudyDeps = {
      designLive: false,
      callTool: async () => {
        called = true
        return { text: "" }
      },
    }
    const result = await runStudy({ mode: "fixture", brief: pricing.brief }, deps)
    assert.equal(result.status, 200)
    assert.equal(called, false)
    if ("error" in result.body) assert.fail(result.body.error)
    assert.equal(result.body.mode, "fixture")
    assert.equal(result.body.match, "strong")
    assert.ok(result.body.designSystem?.markdown.includes("Inter"))
  })

  it("rejects an empty brief and an unknown mode", async () => {
    const deps: StudyDeps = { designLive: false, callTool: async () => ({ text: "" }) }
    const empty = await runStudy({ mode: "fixture", brief: "   " }, deps)
    assert.equal(empty.status, 400)
    const mode = await runStudy({ mode: "cloud", brief: "pricing" }, deps)
    assert.equal(mode.status, 400)
  })

  it("live mode calls recommend then get_design_system and keeps remote thumbs", async () => {
    const calls: string[] = []
    const deps: StudyDeps = {
      designLive: false,
      callTool: async (name, args) => {
        calls.push(`${name}:${JSON.stringify(args)}`)
        if (name === "recommend") {
          return {
            text: JSON.stringify({
              pick: {
                macrostructure: { slug: "feature-stack", label: "Feature Stack" },
                rationale: "Picked Feature Stack.",
              },
              paletteSuggestion: ["#0444fb"],
              evidence: {
                sites: 4,
                paperBand: { consensus: "dark", share: 0.9 },
                displayClass: { consensus: "grotesk-sans", share: 0.8 },
                accentHue: { consensus: "cool", share: 0.5 },
                note: "Measured over 4 sites.",
              },
              exemplars: [
                {
                  slug: "dovetail-com--pricing",
                  title: "Dovetail · Pricing",
                  sourceUrl: "https://dovetail.com",
                  thumb: "https://example.test/thumb.webp",
                  northstar: "Dark pricing.",
                  palette: ["#0444fb"],
                  fonts: ["Inter"],
                  mode: "dark",
                  axes: "dark / grotesk-sans / cool",
                  macrostructure: { slug: "feature-stack", label: "Feature Stack" },
                },
              ],
              referenceComponents: [],
              spacingGuidance: "96px between sections.",
            }),
          }
        }
        return { text: "# Dovetail\n\n## Spacing scale\n\n`96px`\n" }
      },
    }
    const result = await runStudy({ mode: "live", brief: "dark pricing page" }, deps)
    assert.equal(result.status, 200)
    if ("error" in result.body) assert.fail(result.body.error)
    assert.equal(result.body.mode, "live")
    assert.equal(result.body.exemplars[0]?.thumb, "https://example.test/thumb.webp")
    assert.match(result.body.designSystem?.markdown ?? "", /96px/)
    assert.equal(calls.length, 2)
    assert.match(calls[0] ?? "", /^recommend:/)
    assert.match(calls[0] ?? "", /"detail":"concise"/)
    assert.match(calls[1] ?? "", /^get_design_system:/)
    assert.match(calls[1] ?? "", /"live":false/)
  })

  it("surfaces a live transport failure", async () => {
    const deps: StudyDeps = {
      designLive: false,
      callTool: async () => {
        throw new Error("Inspo MCP responded 503.")
      },
    }
    const result = await runStudy({ mode: "live", brief: "dark pricing page" }, deps)
    assert.equal(result.status, 502)
    if (!("error" in result.body)) assert.fail("expected error")
    assert.match(result.body.error, /503/)
  })
})

describe("MCP request shape", () => {
  it("builds a tools/call body for the hosted endpoint", () => {
    const body = buildToolCall(1, "recommend", { brief: "calm", detail: "concise" })
    assert.equal(body.method, "tools/call")
    assert.equal(body.params.name, "recommend")
    assert.equal(body.jsonrpc, "2.0")
  })

  it("reads a JSON body and an SSE data line", () => {
    const direct = parseMcpBody('{"jsonrpc":"2.0","id":1,"result":{"content":[]}}')
    assert.equal((direct as { id: number }).id, 1)
    const sse = parseMcpBody('event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{}}\n\n')
    assert.equal((sse as { id: number }).id, 2)
  })
})
