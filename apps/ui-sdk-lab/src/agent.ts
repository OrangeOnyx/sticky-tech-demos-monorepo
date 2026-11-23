import { createAgent } from "@ui-sdk/react/agent"

const agent = createAgent()

if (typeof window !== "undefined") {
  Object.assign(window, { agent })
}

export { agent }
