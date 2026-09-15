"""Vesper realtime worker.

Brain: xAI Grok Voice Agent API (XAI_API_KEY) via livekit.plugins.xai.realtime
Face:  Anam Cara-3 lip-sync only
Glue:  LiveKit Agents (console / dev)

    uv sync
    uv run python agent.py check
    uv run python agent.py console
    uv run python agent.py dev
"""

from __future__ import annotations

import logging
import sys

from dotenv import load_dotenv
from livekit.agents import AgentServer, JobContext, cli

from vesper.check import main as check_main
from vesper.config import APP_ROOT, Settings
from vesper.session import attach_avatar, build_agent, build_session

logger = logging.getLogger("vesper")

load_dotenv(APP_ROOT / ".env")
load_dotenv(APP_ROOT / ".env.local")

# Bound at import so `python agent.py dev` and `lk agent dev` share one name.
# Run exactly one worker — a second process will spawn a second Vesper.
_BOOT_SETTINGS = Settings.from_env()
server = AgentServer()


@server.rtc_session(agent_name=_BOOT_SETTINGS.agent_name)
async def vesper_agent(ctx: JobContext) -> None:
    settings = Settings.from_env()
    ctx.log_context_fields = {
        "room": ctx.room.name,
        "agent": settings.agent_name,
        "brain": "xai-grok-voice",
        "face": "anam" if settings.enable_anam else "none",
    }

    missing = settings.missing_for_grok()
    if missing:
        raise RuntimeError(
            f"Missing {', '.join(missing)}. "
            "Grok Voice Agent API is the brain — set XAI_API_KEY from the xAI console."
        )

    session = build_session(settings)
    # LiveKit Anam Python guide: start the avatar before session.start so
    # Grok audio is piped into lip-sync, not published as a second speaker.
    await attach_avatar(session, ctx.room, settings)
    await session.start(room=ctx.room, agent=build_agent())
    await ctx.connect()
    await session.generate_reply(
        instructions="Greet the user briefly in character, then wait for them to speak."
    )


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        raise SystemExit(check_main())
    logger.info(
        "Starting Vesper worker agent_name=%s voice=%s anam=%s — one worker only",
        _BOOT_SETTINGS.agent_name,
        _BOOT_SETTINGS.voice,
        _BOOT_SETTINGS.enable_anam,
    )
    cli.run_app(server)
