# PLAN — elevenlabs-speech-engine

## Goal
Single-user MVP that shows ElevenLabs Speech Engine as a voice layer on a chat agent: mic in, spoken reply out, with live transcript and barge-in — without rebuilding the LLM stack.

## Single-user MVP
- One browser page: hold-to-talk or always-listen mic, live transcript, assistant text + audio reply
- Speech Engine (or ElevenLabs Conversational / Agents voice APIs as documented) for STT + TTS + turn-taking / interruption
- Tiny stub LLM (local Bun handler or fixture replies) so the demo works without a full RAG stack
- Env: `ELEVENLABS_API_KEY` required for live voice; optional LLM key; **fixture/demo mode** when keys are missing so `bun run dev` still shows UI
- Self-contained under `apps/elevenlabs-speech-engine/`: `bun install && bun run dev`

## Explicitly out of scope
- Multi-user auth, accounts, billing
- Production RAG / real agent memory
- Mobile native apps
- New GitHub repository (stay in this monorepo folder only)
- Cloudflare Pages deploy (optional later)

## Outcome-oriented tasks
1. Scaffold with `bunx create-vite` (or Next if Speech Engine React SDK needs it) + `bunfig.toml` (`minimumReleaseAge = 259200`) + shadcn minimal UI
2. Wire Speech Engine client: connect session, stream mic, show partial/final transcript
3. Stub LLM turn: map user utterance → short assistant text (fixture or one API call)
4. Speak reply via Speech Engine TTS; support barge-in cancel
5. README: env vars, `bun run dev`, fixture mode notes
6. Validation: run the app, capture **at least one screenshot AND one video** of the running UI for the PR

## Stack (one-line rationale)
- **Bun** — monorepo default runtime/PM
- **Vite + React** — fast single-page voice UI (switch to Next only if official ElevenLabs samples require it)
- **shadcn/ui** — minimalist controls (mic button, transcript list)
- **ElevenLabs Speech Engine** — the demo subject (STT/TTS/turn-taking)

## Deferred
- Real LLM/RAG behind the stub
- Voice picker / multi-voice
- Durable Cloudflare Pages preview
- Auth / multi-session
