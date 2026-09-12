"""Vesper realtime agent: Grok Voice is the brain, Anam is the face."""

from vesper.config import DEFAULT_AVATAR_ID, FALLBACK_VOICE, PREFERRED_VOICE, Settings
from vesper.instructions import load_instructions

__all__ = [
    "DEFAULT_AVATAR_ID",
    "FALLBACK_VOICE",
    "PREFERRED_VOICE",
    "Settings",
    "load_instructions",
]
