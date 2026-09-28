import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { judgeFixture } from "./fixture.ts"
import { PRESETS } from "./presets.ts"
import { QUESTIONS, buildSystemOneBody } from "./questions.ts"
import type { Candidate } from "./types.ts"

function byId(id: string): Candidate {
  const preset = PRESETS.find((item) => item.id === id)
  assert.ok(preset, id)
  return preset.candidate
}

describe("fixture presets", () => {
  it("approves a strong sticky MVP and keeps the API-key noul low", () => {
    const answers = judgeFixture(byId("strong-sticky"))
    assert.equal(answers.verdict.choice, "approve")
    assert.equal(answers.sticky_fit.legend["2"], "Strong sticky MVP fit")
    assert.ok(answers.sticky_fit.score > 1.5)
    assert.ok(answers.needs_api_key.noul < 0.2)
    assert.ok(answers.is_near_miss.noul < 0.2)
  })

  it("skips a listicle as a near miss", () => {
    const answers = judgeFixture(byId("listicle"))
    assert.equal(answers.verdict.choice, "skip")
    assert.ok((answers.sticky_fit.probabilities["0"] ?? 0) > 0.7)
    assert.ok(answers.is_near_miss.noul > 0.8)
  })

  it("skips heavy infra", () => {
    const answers = judgeFixture(byId("heavy-infra"))
    assert.equal(answers.verdict.choice, "skip")
    assert.ok(answers.is_near_miss.noul > 0.8)
    assert.ok((answers.sticky_fit.probabilities["0"] ?? 0) > 0.7)
  })

  it("skips an idea that is already built, with partial fit", () => {
    const answers = judgeFixture(byId("already-built"))
    assert.equal(answers.verdict.choice, "skip")
    assert.ok(answers.is_near_miss.noul > 0.8)
    assert.ok((answers.sticky_fit.probabilities["1"] ?? 0) > 0.5)
  })

  it("tweaks a vague browser tool that is not yet a sticky slice", () => {
    const answers = judgeFixture({
      title: "Bookmark brief",
      url: "https://example.com/brief",
      blurb:
        "Browser tool that turns a bookmark into a short brief. Useful, but the blurb also wants accounts and a second user before the core loop is clear.",
    })
    assert.equal(answers.verdict.choice, "tweak")
    assert.ok((answers.sticky_fit.probabilities["1"] ?? 0) > 0.5)
  })

  it("raises needs_api_key when the blurb requires a third-party key", () => {
    const answers = judgeFixture({
      title: "Inbox summarizer",
      url: "",
      blurb: "Requires an OpenAI API key before the demo shows anything.",
    })
    assert.ok(answers.needs_api_key.noul > 0.8)
  })
})

describe("question contract", () => {
  it("uses the same ids the live request sends", () => {
    assert.deepEqual(Object.keys(QUESTIONS), [
      "verdict",
      "sticky_fit",
      "needs_api_key",
      "is_near_miss",
    ])
    assert.equal(QUESTIONS.verdict.type, "choice")
    assert.deepEqual(Object.keys(QUESTIONS.verdict.criteria), ["approve", "tweak", "skip"])
    assert.equal(QUESTIONS.sticky_fit.type, "score")
    assert.deepEqual(QUESTIONS.sticky_fit.criteria, [
      "Poor",
      "Partial",
      "Strong sticky MVP fit",
    ])
    assert.equal(QUESTIONS.needs_api_key.type, "noul")
    assert.equal(QUESTIONS.is_near_miss.type, "noul")
  })

  it("builds a jev-latest systemone body", () => {
    const body = buildSystemOneBody(byId("strong-sticky"))
    assert.equal(body.model, "jev-latest")
    assert.match(body.state, /Bookmark triage/)
    assert.equal(body.questions.verdict.type, "choice")
  })

  it("keeps choice and score probabilities at 1", () => {
    for (const preset of PRESETS) {
      const answers = judgeFixture(preset.candidate)
      const choiceSum = Object.values(answers.verdict.probabilities).reduce((sum, value) => sum + value, 0)
      const scoreSum = Object.values(answers.sticky_fit.probabilities).reduce((sum, value) => sum + value, 0)
      assert.ok(Math.abs(choiceSum - 1) < 0.001, preset.id)
      assert.ok(Math.abs(scoreSum - 1) < 0.001, preset.id)
    }
  })
})
