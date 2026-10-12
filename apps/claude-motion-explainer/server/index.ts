import { createServer } from "node:http"
import { loadEnvFile } from "./env.ts"
import { createHandler } from "./http.ts"

loadEnvFile()

const PORT = Number(process.env.PORT ?? 3001)
const apiKey = process.env.ANTHROPIC_API_KEY
const handler = createHandler({
  apiKey,
  model: process.env.ANTHROPIC_MODEL,
})

const httpServer = createServer((req, res) => {
  void handler(req, res)
})

httpServer.listen(PORT, "127.0.0.1", () => {
  const liveReady = Boolean(apiKey?.trim())
  console.log(
    `Claude Motion API on http://127.0.0.1:${PORT} (${liveReady ? "live key present" : "fixture only"})`,
  )
})
