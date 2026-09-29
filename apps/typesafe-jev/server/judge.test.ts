import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { PRESETS } from "../shared/presets.ts"
import { QUESTIONS } from "../shared/questions.ts"
import { judgeCandidate } from "./judge.ts"

const strong = PRESETS[0]?.candidate
assert.ok(strong)

describe("judgeCandidate", () => {
  it("returns a fixture without calling the network or a key", async () => {
    let called = false
    const fetchImpl: typeof fetch = async () => {
      called = true
      throw new Error("fixture mode must not call TypeSafe")
    }
    const result = await judgeCandidate({
      mode: "fixture",
      candidate: strong,
      apiKey: undefined,
      fetchImpl,
    })
    assert.equal(called, false)
    assert.equal(result.status, 200)
    assert.ok(!("error" in result.body))
    if ("error" in result.body) return
    assert.equal(result.body.mode, "fixture")
    assert.equal(result.body.model, "fixture")
    assert.equal(result.body.liveReady, false)
    assert.equal(result.body.answers.verdict.choice, "approve")
    assert.equal(result.body.usage, undefined)
    assert.equal(JSON.stringify(result.body).includes("TYPESAFE"), false)
  })

  it("refuses live mode when the key is missing", async () => {
    const result = await judgeCandidate({
      mode: "live",
      candidate: strong,
      apiKey: "  ",
    })
    assert.equal(result.status, 400)
    assert.ok("error" in result.body)
  })

  it("posts jev-latest to systemone and does not echo the key", async () => {
    const secret = "test-key-should-not-leak"
    let seenUrl = ""
    let seenAuth = ""
    let seenBody = ""
    const fetchImpl: typeof fetch = async (input, init) => {
      seenUrl = String(input)
      seenAuth = new Headers(init?.headers).get("authorization") ?? ""
      seenBody = String(init?.body ?? "")
      const answers = {
        verdict: {
          type: "choice",
          choice: "approve",
          probabilities: { approve: 0.7, tweak: 0.2, skip: 0.1 },
          confidence: 0.6,
        },
        sticky_fit: {
          type: "score",
          score: 1.8,
          legend: { "0": "Poor", "1": "Partial", "2": "Strong sticky MVP fit" },
          probabilities: { "0": 0.05, "1": 0.1, "2": 0.85 },
          confidence: 0.8,
        },
        needs_api_key: { type: "noul", noul: 0.2 },
        is_near_miss: { type: "noul", noul: 0.1 },
      }
      return new Response(
        JSON.stringify({
          model: "jev-1.13.0",
          answers,
          usage: { input_tokens: 120, output_tokens: 18 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    }

    const result = await judgeCandidate({
      mode: "live",
      candidate: strong,
      apiKey: secret,
      fetchImpl,
    })

    assert.equal(seenUrl, "https://api.typesafe.ai/v1/systemone")
    assert.equal(seenAuth, `Bearer ${secret}`)
    const parsed = JSON.parse(seenBody) as { model: string; questions: Record<string, unknown> }
    assert.equal(parsed.model, "jev-latest")
    assert.deepEqual(Object.keys(parsed.questions), Object.keys(QUESTIONS))
    assert.equal(result.status, 200)
    assert.ok(!("error" in result.body))
    if ("error" in result.body) return
    assert.equal(result.body.model, "jev-1.13.0")
    assert.equal(result.body.usage?.input_tokens, 120)
    assert.equal(result.body.liveReady, true)
    assert.equal(JSON.stringify(result.body).includes(secret), false)
  })

  it("rejects an empty candidate", async () => {
    const result = await judgeCandidate({
      mode: "fixture",
      candidate: { title: "  ", url: "", blurb: "" },
      apiKey: undefined,
    })
    assert.equal(result.status, 400)
  })
})
