# Vesper realtime

Single-user voice + face agent.

| Layer | What it does | What it must not do |
| --- | --- | --- |
| **xAI Grok Voice Agent API** | **The brain.** Speech-to-speech LLM using Adam’s `XAI_API_KEY`. This is the only path that keeps an unhinged / NSFW persona intact. | Do not replace with Anam, ElevenLabs, Tavus, OpenAI Realtime, or LiveKit Inference. Those stacks sanitize. |
| **Anam Cara-3** | **The face.** Lip-sync and video for avatar `35069738-6eb1-4eaf-8b56-43d21b67e78d` (env override). | Not an LLM. Anam never sees your private instructions as a chat model. |
| **LiveKit Agents** | **Transport / glue.** `console` (local mic) and `dev` (room + Anam video). | Not a second brain. |

If you wire Vesper through any other program’s model, the persona will get filtered. That is the product constraint.

## Setup (Windows or Unix)

Core runtime is **Python**. npm/bun are not required.

```bat
cd apps\vesper-realtime
copy .env.example .env
copy persona\vesper_instructions.example.txt persona\vesper_instructions.txt
```

```bash
cd apps/vesper-realtime
cp .env.example .env
cp persona/vesper_instructions.example.txt persona/vesper_instructions.txt
```

Paste keys into `.env`. Paste the **private** persona into `persona/vesper_instructions.txt` (gitignored). The example file in git is a PG placeholder on purpose.

### Install with uv (preferred)

```bat
uv sync
uv run python agent.py check
```

### Install with pip

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
python agent.py check
```

On Unix, activate with `source .venv/bin/activate`.

## Run modes

| Command | What happens |
| --- | --- |
| `python agent.py check` | Prints brain/face wiring, masked keys, instructions path. No network to Grok. |
| `python agent.py console` | Local microphone → **Grok Voice**. Anam is skipped (no room video). |
| `python agent.py dev` | Joins LiveKit. Grok Voice is the brain. Anam publishes the Cara-3 face. |

```bat
uv run python agent.py console
uv run python agent.py dev
```

`XAI_VOICE` defaults to `eve`. Unknown or empty values fall back to `ara`.

## One agent only

The worker registers as LiveKit agent name **`vesper`** (`VESPER_AGENT_NAME`).

- Run **exactly one** `python agent.py dev` (or `console`) against a project.
- A second worker is a second Vesper in the room.
- Do not also run an Anam-hosted agent, an ElevenLabs agent, or a LiveKit Inference agent on the same room.
- The HTML token mints `RoomAgentDispatch(agent_name="vesper")` so only this worker is dispatched.

## Browser and phone

**Option A — HTML client in this folder**

1. `uv run python agent.py dev`
2. In another terminal: `uv run python client/token_server.py`
3. Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/)
4. Click **Connect**, allow the mic. The Anam video track appears when Grok speaks.

**Option B — LiveKit playground (desktop or phone browser)**

1. `uv run python agent.py dev`
2. Open [https://agents-playground.livekit.io/](https://agents-playground.livekit.io/)
3. Use this project’s LiveKit URL / API key / secret
4. Set **agent name** to `vesper`
5. Start a session

LiveKit Meet and the official [agent-starter-react](https://github.com/livekit-examples/agent-starter-react) app work the same way: same project, agent name `vesper`.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `XAI_API_KEY` | Yes | Grok Voice brain. From [console.x.ai](https://console.x.ai/). |
| `XAI_VOICE` | No | Prefer `eve`. Falls back to `ara`. |
| `ANAM_API_KEY` | `dev` video | Face only. From [lab.anam.ai](https://lab.anam.ai/). |
| `ANAM_AVATAR_ID` | No | Default `35069738-6eb1-4eaf-8b56-43d21b67e78d`. |
| `LIVEKIT_URL` | `dev` + HTML | `wss://…livekit.cloud` |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | `dev` + HTML | Project keys. |
| `LIVEKIT_ROOM` | No | Default `vesper-room`. |
| `VESPER_AGENT_NAME` | No | Default `vesper`. |

`.env` and `persona/vesper_instructions.txt` are gitignored.

## Key rotation

Rotate each secret independently, then restart the worker (and token server if it is running):

1. **xAI** — [console.x.ai](https://console.x.ai/) → API keys → revoke the old key, put the new value in `XAI_API_KEY`. This is the brain key. If it leaks, the persona and Grok usage leak with it.
2. **Anam** — [lab.anam.ai](https://lab.anam.ai/) → API keys. Rotating Anam does **not** change the persona; it only cuts the face.
3. **LiveKit** — Cloud project settings → API keys. Rotating LiveKit keys kicks rooms and the HTML client until `.env` is updated.

Never put keys in the persona file, the HTML page, or git.

## What this repo will not ship

- Filthy / NSFW custom instructions (keep those in the gitignored local file)
- An OpenAI / ElevenLabs / Tavus / Anam LLM path
- A second Vesper process

## Tests

```bat
uv run pytest
```

## Docs used

- [Grok Voice Agent API + LiveKit](https://docs.livekit.io/agents/models/realtime/plugins/spacexai/)
- [Anam avatar plugin](https://docs.livekit.io/agents/models/avatar/plugins/anam/)
- [Anam LiveKit cookbook](https://anam.ai/cookbook/getting-started-with-livekit) (uses OpenAI as the brain — we do **not**)
- [xAI voice overview](https://docs.x.ai/docs/guides/voice)
