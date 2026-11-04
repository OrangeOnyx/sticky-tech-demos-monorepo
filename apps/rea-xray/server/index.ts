import { assertSupportedNode } from "./node-version.ts"

assertSupportedNode()
await import("./serve.ts")
