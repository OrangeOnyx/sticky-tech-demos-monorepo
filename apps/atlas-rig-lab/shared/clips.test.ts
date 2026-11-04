import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { matchClip, matchPrimaryClips } from "./clips.ts"

const ROBOT = [
  "Dance",
  "Death",
  "Idle",
  "Jump",
  "No",
  "Punch",
  "Running",
  "Sitting",
  "Standing",
  "ThumbsUp",
  "Walking",
  "WalkJump",
  "Wave",
  "Yes",
]

describe("clip matching", () => {
  it("maps the bundled robot clips case-insensitively", () => {
    assert.equal(matchClip(ROBOT, "idle"), "Idle")
    assert.equal(matchClip(ROBOT, "walk"), "Walking")
    assert.equal(matchClip(ROBOT, "run"), "Running")
  })

  it("prefers the shortest name when several clips match", () => {
    assert.equal(matchClip(["WalkJump", "Walking", "walk"], "walk"), "walk")
    assert.equal(matchClip(["RunningFast", "run"], "run"), "run")
  })

  it("matches mixed case and leaves misses empty", () => {
    assert.equal(matchClip(["iDlE_loop"], "idle"), "iDlE_loop")
    assert.equal(matchClip(["Dance", "Wave"], "run"), null)
    assert.deepEqual(matchPrimaryClips([]), { idle: null, walk: null, run: null })
  })
})
