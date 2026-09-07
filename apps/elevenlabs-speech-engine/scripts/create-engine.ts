import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
const wsUrl = process.env.PUBLIC_WS_URL?.trim()

if (!apiKey) {
  throw new Error("Set ELEVENLABS_API_KEY before creating a Speech Engine.")
}

if (!wsUrl) {
  throw new Error(
    "Set PUBLIC_WS_URL to a public wss:// URL that ends with /ws (ngrok of port 3001).",
  )
}

const elevenlabs = new ElevenLabsClient({ apiKey })

const engine = await elevenlabs.speechEngine.create({
  name: "sticky-tech-demos speech engine",
  speechEngine: { wsUrl },
  overrides: { firstMessage: true },
})

console.log("Created Speech Engine")
console.log(`ELEVENLABS_SPEECH_ENGINE_ID=${engine.engineId}`)
