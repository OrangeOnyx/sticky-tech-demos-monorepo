import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  containsBareRef,
  detectStaleRef,
  formatCheckCmd,
  formatClickCmd,
  formatSetValueCmd,
  formatUncheckCmd,
  InvalidRefError,
  commandsForNode,
  isBareRef,
  isQualifiedRef,
  refSnapshotId,
} from "./commands.ts"
import { countRefs, flattenTree, interactiveItems } from "./tree.ts"
import {
  clickNewOk,
  recoverySnapshot,
  replaySteps,
  staleBody,
  treeFixtures,
  untitledSnapshot,
  welcomeSnapshot,
} from "../src/fixtures/demo-notes.ts"
import type { A11yNode } from "./types.ts"

describe("qualified refs", () => {
  it("formats a snapshot-qualified click", () => {
    assert.equal(
      formatClickCmd("@s8f3k2p9:e8"),
      "agent-desktop click '@s8f3k2p9:e8'",
    )
  })

  it("rejects a bare @eN ref as INVALID_ARGS", () => {
    assert.equal(isBareRef("@e8"), true)
    assert.equal(isQualifiedRef("@e8"), false)
    assert.throws(
      () => formatClickCmd("@e8"),
      (error: unknown) => {
        assert.ok(error instanceof InvalidRefError)
        assert.equal(error.code, "INVALID_ARGS")
        assert.match(error.message, /@e8/)
        return true
      },
    )
    assert.throws(() => formatSetValueCmd("@e3", "Launch checklist"), InvalidRefError)
    assert.throws(() => formatCheckCmd("@e1"), InvalidRefError)
  })

  it("rejects refs that are not snapshot-qualified", () => {
    for (const ref of ["", "e8", "s8f3k2p9:e8", "@s8f3k2p9:", "@s8f3k2p9:e", "@:e1"]) {
      assert.equal(isQualifiedRef(ref), false, ref)
      assert.throws(() => formatClickCmd(ref), InvalidRefError)
    }
  })

  it("quotes set-value text and prefers it over type", () => {
    assert.equal(
      formatSetValueCmd("@s8f3k2p9:e3", "Launch checklist"),
      `agent-desktop set-value '@s8f3k2p9:e3' "Launch checklist"`,
    )
    assert.equal(
      formatSetValueCmd("@s8f3k2p9:e3", 'say "hi"'),
      `agent-desktop set-value '@s8f3k2p9:e3' "say \\"hi\\""`,
    )
  })

  it("uses check and uncheck for checkbox roles", () => {
    const pin: A11yNode = {
      role: "checkbox",
      name: "Pin",
      ref_id: "@s8f3k2p9:e7",
    }
    assert.deepEqual(commandsForNode(pin), [
      { label: "Check", command: formatCheckCmd("@s8f3k2p9:e7") },
    ])
    assert.deepEqual(
      commandsForNode({ ...pin, states: ["checked"] }),
      [{ label: "Uncheck", command: formatUncheckCmd("@s8f3k2p9:e7") }],
    )
  })

  it("never suggests a bare ref or the type command", () => {
    const nodes = treeFixtures.flatMap((fixture) =>
      flattenTree(fixture.snapshot.data.tree).map((item) => item.node),
    )
    for (const node of nodes) {
      for (const line of commandsForNode(node)) {
        assert.equal(containsBareRef(line.command), false, line.command)
        assert.equal(line.command.includes(" type "), false, line.command)
        if (node.role === "textfield") {
          assert.match(line.command, /^agent-desktop set-value /)
        }
        if (node.role === "button") {
          assert.match(line.command, /^agent-desktop click /)
        }
      }
    }
  })
})

describe("STALE_REF envelopes", () => {
  it("detects STALE_REF and ignores a successful click", () => {
    assert.equal(detectStaleRef(staleBody), true)
    assert.equal(detectStaleRef(clickNewOk), false)
    assert.equal(detectStaleRef(welcomeSnapshot), false)
    assert.equal(detectStaleRef({ ok: false, error: { code: "INVALID_ARGS" } }), false)
    assert.equal(detectStaleRef(null), false)
  })

  it("plays a stale ref from an older snapshot, then a recovery read", () => {
    const stale = replaySteps.find((step) => detectStaleRef(step.response))
    assert.ok(stale)
    assert.equal(stale.command, formatSetValueCmd("@s8f3k2p9:e6", "Launch checklist"))
    assert.equal(refSnapshotId("@s8f3k2p9:e6"), "s8f3k2p9")
    assert.notEqual(stale.snapshot.data.snapshot_id, "s8f3k2p9")
    const staleIndex = replaySteps.indexOf(stale)
    const recovery = replaySteps[staleIndex + 1]
    assert.ok(recovery)
    assert.equal(recovery.snapshot.data.snapshot_id, "r3cov8k1")
    assert.equal(
      recovery.followUpCommand,
      formatSetValueCmd("@r3cov8k1:e7", "Launch checklist"),
    )
    assert.equal(detectStaleRef(recovery.response), false)
  })
})

describe("DemoNotes fixtures", () => {
  it("keeps every ref inside its snapshot id and counts them", () => {
    for (const snapshot of [welcomeSnapshot, untitledSnapshot, recoverySnapshot]) {
      const refs = flattenTree(snapshot.data.tree).flatMap((item) =>
        item.node.ref_id ? [item.node.ref_id] : [],
      )
      assert.equal(refs.length, snapshot.data.ref_count)
      assert.equal(countRefs(snapshot.data.tree), snapshot.data.ref_count)
      assert.equal(snapshot.version, "2.6")
      assert.equal(snapshot.data.app, "DemoNotes")
      for (const ref of refs) {
        assert.equal(isQualifiedRef(ref), true, ref)
        assert.equal(refSnapshotId(ref), snapshot.data.snapshot_id)
      }
    }
  })

  it("lists interactive nodes in document order", () => {
    const names = interactiveItems(welcomeSnapshot.data.tree).map(
      (item) => item.node.name,
    )
    assert.deepEqual(names, [
      "New note",
      "Save",
      "Welcome",
      "Grocery list",
      "Title",
      "Body",
      "Pin",
    ])
  })
})
