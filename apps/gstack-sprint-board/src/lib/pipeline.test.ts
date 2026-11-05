import { describe, expect, test } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  advanceCursor,
  FEATURE,
  fixtureFileName,
  isShipped,
  progressLabel,
  progressRatio,
  stageStatus,
  STAGES,
  transcriptPath,
} from "./pipeline"

const fixturesDir = join(import.meta.dirname, "../../public/fixtures", FEATURE.id)

describe("pipeline cursor", () => {
  test("starts at office-hours and finishes after /ship", () => {
    expect(stageStatus(0, 0)).toBe("active")
    expect(stageStatus(1, 0)).toBe("pending")
    expect(isShipped(0)).toBe(false)

    let cursor = 0
    for (let i = 0; i < STAGES.length; i += 1) {
      expect(stageStatus(i, cursor)).toBe("active")
      cursor = advanceCursor(cursor)
      expect(stageStatus(i, cursor)).toBe("done")
    }

    expect(cursor).toBe(STAGES.length)
    expect(isShipped(cursor)).toBe(true)
    expect(advanceCursor(cursor)).toBe(STAGES.length)
    expect(progressLabel(cursor)).toBe("Shipped")
    expect(progressRatio(cursor)).toBe(1)
  })

  test("labels in-flight progress from a 1-based stage number", () => {
    expect(progressLabel(0)).toBe("Stage 1 of 7")
    expect(progressLabel(3)).toBe("Stage 4 of 7")
    expect(progressRatio(0)).toBe(0)
    expect(progressRatio(3)).toBeCloseTo(3 / 7)
  })
})

describe("fixtures", () => {
  test("every demo stage has a transcript markdown file", () => {
    expect(STAGES.map((stage) => stage.command)).toEqual([
      "/office-hours",
      "/plan-ceo-review",
      "/plan-eng-review",
      "/plan-design-review",
      "/review",
      "/qa",
      "/ship",
    ])

    for (const stage of STAGES) {
      const file = join(fixturesDir, fixtureFileName(stage.id))
      expect(existsSync(file)).toBe(true)
      const body = readFileSync(file, "utf8")
      expect(body.length).toBeGreaterThan(200)
      expect(body).toContain(stage.command)
      expect(transcriptPath(stage.id)).toBe(
        `/fixtures/${FEATURE.id}/${stage.id}.md`,
      )
    }
  })
})
