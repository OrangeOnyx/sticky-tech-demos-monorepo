from __future__ import annotations

import logging

from livekit.agents import Agent, AgentSession
from livekit.plugins import anam, xai

from vesper.config import Settings
from vesper.instructions import load_instructions

logger = logging.getLogger("vesper")


class Vesper(Agent):
    """Voice agent whose instructions come from a local file, not Anam/OpenAI."""

    def __init__(self, instructions: str) -> None:
        super().__init__(instructions=instructions)


def build_realtime_model(settings: Settings) -> xai.realtime.RealtimeModel:
    """Grok Voice Agent API — the only LLM in this stack.

    Must use Adam's XAI_API_KEY. Do not substitute OpenAI, Anam, ElevenLabs,
    Tavus, or LiveKit Inference models; those stacks sanitize the persona.
    """
    if not settings.xai_api_key:
        raise RuntimeError(
            "XAI_API_KEY is required. Grok Voice Agent API is the brain; "
            "do not route the LLM through Anam or another provider."
        )
    return xai.realtime.RealtimeModel(
        model=settings.realtime_model,
        voice=settings.voice,
        api_key=settings.xai_api_key,
    )


def build_agent() -> Vesper:
    return Vesper(instructions=load_instructions())


def build_session(settings: Settings) -> AgentSession:
    return AgentSession(llm=build_realtime_model(settings))


def build_avatar(settings: Settings) -> anam.AvatarSession:
    """Anam is face/lip-sync only. It does not see or rewrite instructions."""
    persona_kwargs: dict[str, str] = {
        "name": settings.avatar_name,
        "avatarId": settings.avatar_id,
    }
    if settings.avatar_model:
        persona_kwargs["avatarModel"] = settings.avatar_model
    return anam.AvatarSession(
        persona_config=anam.PersonaConfig(**persona_kwargs),
        api_key=settings.anam_api_key,
    )


async def attach_avatar(session: AgentSession, room, settings: Settings) -> None:
    if not settings.enable_anam:
        logger.info("Anam avatar skipped (console mode or ANAM_API_KEY unset)")
        return
    logger.info(
        "Starting Anam face (lip-sync only) avatar_id=%s name=%s",
        settings.avatar_id,
        settings.avatar_name,
    )
    avatar = build_avatar(settings)
    await avatar.start(session, room=room)
