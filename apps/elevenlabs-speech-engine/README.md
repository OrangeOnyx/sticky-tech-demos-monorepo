# ElevenLabs Speech Engine

Single-user voice chat demo. The browser microphone goes to ElevenLabs Speech Engine for speech-to-text, turn-taking, barge-in, and text-to-speech. A tiny local stub stands in for the LLM.

```bash
cd apps/elevenlabs-speech-engine
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The Bun API listens on port `3001`.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | `ELEVENLABS_API_KEY` is missing | UI still runs. Transcripts, stub replies, barge-in, and spoken audio are local (browser `speechSynthesis`, or a short tone if synthesis is unavailable). |
| **Live** | `ELEVENLABS_API_KEY` plus `ELEVENLABS_SPEECH_ENGINE_ID` | `@elevenlabs/react` starts a WebRTC session. ElevenLabs transcribes the mic, this server answers with the stub LLM, and Speech Engine speaks the reply. |

`bun install && bun run dev` is enough to see the page. Fixture mode is the default in this repo because no key is committed.

## Environment

Copy `.env.example` to `.env` in this folder.

| Variable | Required | Notes |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | Live only | Server-side. Never expose it to the browser. |
| `ELEVENLABS_SPEECH_ENGINE_ID` | Live only | From `bun run speech-engine:create`. |
| `PUBLIC_WS_URL` | Creating an engine | Public `wss://…/ws` URL, usually ngrok on port `3001`. |
| `OPENAI_API_KEY` | No | Not used. The assistant is a local stub. |

## Live setup

Speech Engine needs a public WebSocket so ElevenLabs can reach this machine.

1. `ngrok http 3001`
2. Set `PUBLIC_WS_URL` to `wss://<ngrok-host>/ws`
3. `bun run speech-engine:create` and copy the printed ID into `.env`
4. Restart `bun run dev`
5. Click **Start conversation**, allow the microphone, and talk

Barge-in is native in live mode: a new user transcript aborts the in-flight stub reply.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Vite UI + Bun API together |
| `bun run build` | Production client build |
| `bun test` | Stub LLM and env-mode tests |
| `bun run speech-engine:create` | Create a Speech Engine resource |

## Stack

Vite + React + shadcn/ui, Bun, `@elevenlabs/react`, `@elevenlabs/elevenlabs-js`. Official ElevenLabs samples also show Next.js; this demo stays on Vite because the React SDK does not require Next.
