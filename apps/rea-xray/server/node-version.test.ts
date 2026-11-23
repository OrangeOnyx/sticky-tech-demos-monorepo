import assert from "node:assert/strict"
import { test } from "node:test"
import { isSupportedNodeVersion } from "./node-version.ts"

test("accepts the Node ranges REA X-ray actually runs on", () => {
  assert.equal(isSupportedNodeVersion("24.22.1"), true)
  assert.equal(isSupportedNodeVersion("24.23.0"), true)
  assert.equal(isSupportedNodeVersion("26.12.1"), true)
  assert.equal(isSupportedNodeVersion("26.13.0"), true)
  assert.equal(isSupportedNodeVersion("27.0.0"), true)

  assert.equal(isSupportedNodeVersion("24.22.0"), false)
  assert.equal(isSupportedNodeVersion("24.21.9"), false)
  assert.equal(isSupportedNodeVersion("22.23.4"), false)
  assert.equal(isSupportedNodeVersion("20.19.0"), false)
  assert.equal(isSupportedNodeVersion("25.0.0"), false)
  assert.equal(isSupportedNodeVersion("26.12.0"), false)
})
