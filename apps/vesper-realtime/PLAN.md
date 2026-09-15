# PLAN — vesper-realtime

## Goal
Single-user voice+face agent: **xAI Grok Voice Agent API** is the brain (Adam’s `XAI_API_KEY`), LiveKit is transport, Anam Cara-3 is lip-sync only.

## Single-user MVP
- Python LiveKit Agents worker: `xai.realtime.RealtimeModel` with `instructions=` loaded from a **local file**
- Voice `eve` by default, `ara` if unset/invalid (`XAI_VOICE`)
- Anam avatar default id `35069738-6eb1-4eaf-8b56-43d21b67e78d` (env override); **not** an LLM
- Modes: `console` (local mic, no face) and `dev` (LiveKit room + Anam video)
- Ship PG placeholder instructions only; gitignore private persona + `.env`
- Minimal HTML client + token mint, plus documented LiveKit playground/phone path
- Windows-friendly: `uv` or `pip`; npm not required

## Explicitly out of scope
- Routing the LLM through Anam, ElevenLabs, Tavus, OpenAI, or LiveKit Inference
- Committing NSFW / unhinged custom instructions
- Multi-user, billing, Cloudflare Pages
- A second Vesper worker (one agent name, one process)

## Outcome-oriented tasks
1. Scaffold `apps/vesper-realtime/` with `pyproject.toml` (`uv`/`pip`), `.env.example`, gitignore
2. Load instructions from `persona/vesper_instructions.txt` (else example) into `Agent(instructions=)`
3. Wire `xai.realtime.RealtimeModel` + Anam `AvatarSession` (room/`dev` only)
4. Minimal HTML client + stdlib token server; document playground/Meet
5. README: brain vs face, key rotation, one-agent-only
6. Tests for config/instructions; screenshot + video for the PR

## Stack (one-line rationale)
- **LiveKit Agents (Python) `>=1.5`** — official `console` / `dev` worker
- **`livekit-plugins-xai` RealtimeModel** — Grok Voice Agent API with Adam’s key (does not sanitize via a third-party LLM)
- **`livekit-plugins-anam`** — Cara-3 face/lip-sync only
- **uv or pip** — Windows-friendly; bun/npm not required for the agent
- **Static HTML + `livekit-api` token mint** — browser/phone without a JS toolchain

## Cookbook notes (investigated)
- LiveKit: `llm=xai.realtime.RealtimeModel(voice=...)`, `XAI_API_KEY`, default model `grok-voice-think-fast-1.0`
- Anam docs/cookbook use OpenAI Realtime as the brain — **do not copy that**. Swap in xAI. Start `AvatarSession` before `session.start` (LiveKit Anam Python guide)
- xAI voices include `eve` (default on xAI) and `ara` (LiveKit plugin default). We prefer `eve`.

## Deferred
- SIP telephony
- LiveKit Cloud agent deploy
- Extra tools (XSearch / WebSearch)
