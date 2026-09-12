from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent

PREFERRED_VOICE = "eve"
FALLBACK_VOICE = "ara"
# Grok Voice Agent built-ins we accept without falling back. Case-insensitive.
KNOWN_VOICES = frozenset(
    {
        "eve",
        "ara",
        "leo",
        "rex",
        "sal",
        "carina",
        "zagan",
        "helix",
        "orion",
        "luna",
        "iris",
        "altair",
        "zenith",
        "perseus",
        "helios",
        "lux",
        "kepler",
        "rigel",
        "cosmo",
        "celeste",
        "ursa",
        "sirius",
        "lumen",
        "castor",
        "naksh",
        "atlas",
        "aurora",
        "liora",
    }
)

DEFAULT_AVATAR_ID = "35069738-6eb1-4eaf-8b56-43d21b67e78d"
DEFAULT_AVATAR_NAME = "Vesper"
DEFAULT_AGENT_NAME = "vesper"
DEFAULT_ROOM = "vesper-room"
DEFAULT_REALTIME_MODEL = "grok-voice-think-fast-1.0"

PRIVATE_INSTRUCTIONS = APP_ROOT / "persona" / "vesper_instructions.txt"
EXAMPLE_INSTRUCTIONS = APP_ROOT / "persona" / "vesper_instructions.example.txt"


def resolve_voice(raw: str | None) -> str:
    """Prefer eve. Empty or unknown values fall back to ara."""
    voice = (raw or "").strip()
    if not voice:
        return PREFERRED_VOICE
    if voice.lower() not in KNOWN_VOICES:
        return FALLBACK_VOICE
    return voice.lower()


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    xai_api_key: str
    voice: str
    realtime_model: str
    anam_api_key: str
    avatar_id: str
    avatar_name: str
    avatar_model: str
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    room: str
    agent_name: str
    enable_anam: bool

    @classmethod
    def from_env(cls, argv: list[str] | None = None) -> Settings:
        args = argv if argv is not None else sys.argv[1:]
        voice = resolve_voice(os.getenv("XAI_VOICE", PREFERRED_VOICE))
        anam_key = os.getenv("ANAM_API_KEY", "").strip()
        # Console mode is local mic only — Anam needs a LiveKit room for video.
        in_console = "console" in args
        enable_anam = bool(anam_key) and not in_console and not _env_flag("VESPER_DISABLE_ANAM")
        return cls(
            xai_api_key=os.getenv("XAI_API_KEY", "").strip(),
            voice=voice,
            realtime_model=os.getenv("XAI_REALTIME_MODEL", DEFAULT_REALTIME_MODEL).strip()
            or DEFAULT_REALTIME_MODEL,
            anam_api_key=anam_key,
            avatar_id=os.getenv("ANAM_AVATAR_ID", DEFAULT_AVATAR_ID).strip() or DEFAULT_AVATAR_ID,
            avatar_name=os.getenv("ANAM_AVATAR_NAME", DEFAULT_AVATAR_NAME).strip()
            or DEFAULT_AVATAR_NAME,
            avatar_model=os.getenv("ANAM_AVATAR_MODEL", "").strip(),
            livekit_url=os.getenv("LIVEKIT_URL", "").strip(),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", "").strip(),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", "").strip(),
            room=os.getenv("LIVEKIT_ROOM", DEFAULT_ROOM).strip() or DEFAULT_ROOM,
            agent_name=os.getenv("VESPER_AGENT_NAME", DEFAULT_AGENT_NAME).strip()
            or DEFAULT_AGENT_NAME,
            enable_anam=enable_anam,
        )

    def missing_for_grok(self) -> list[str]:
        missing: list[str] = []
        if not self.xai_api_key:
            missing.append("XAI_API_KEY")
        return missing

    def missing_for_room(self) -> list[str]:
        missing = self.missing_for_grok()
        for name, value in (
            ("LIVEKIT_URL", self.livekit_url),
            ("LIVEKIT_API_KEY", self.livekit_api_key),
            ("LIVEKIT_API_SECRET", self.livekit_api_secret),
        ):
            if not value:
                missing.append(name)
        if self.enable_anam and not self.anam_api_key:
            missing.append("ANAM_API_KEY")
        return missing
