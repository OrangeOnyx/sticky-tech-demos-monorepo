from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

from vesper.config import APP_ROOT, EXAMPLE_INSTRUCTIONS, PRIVATE_INSTRUCTIONS, Settings
from vesper.instructions import InstructionsError, load_instructions, resolve_instructions_path


def _masked(value: str) -> str:
    if not value:
        return "(missing)"
    if len(value) <= 8:
        return "set (short)"
    return f"set ({value[:4]}…{value[-2:]}, len={len(value)})"


def main() -> int:
    load_dotenv(APP_ROOT / ".env")
    load_dotenv(APP_ROOT / ".env.local")
    settings = Settings.from_env()

    print("Vesper realtime — preflight")
    print("===========================")
    print("Brain:  xAI Grok Voice Agent API (XAI_API_KEY)")
    print("Face:   Anam Cara-3 lip-sync only (not an LLM)")
    print("Glue:   LiveKit transport")
    print()

    try:
        path = resolve_instructions_path()
        instructions = load_instructions()
        source = "private" if path.resolve() == PRIVATE_INSTRUCTIONS.resolve() else "example (PG)"
        print(f"Instructions: {path} [{source}, {len(instructions)} chars]")
    except InstructionsError as exc:
        print(f"Instructions: ERROR — {exc}")
        return 1

    if not PRIVATE_INSTRUCTIONS.is_file():
        print(
            f"Note: {PRIVATE_INSTRUCTIONS.name} is absent. "
            f"Copy {EXAMPLE_INSTRUCTIONS.name} locally to use a private persona."
        )

    print(f"Voice:        {settings.voice} (prefer eve, fallback ara)")
    print(f"Realtime:     {settings.realtime_model}")
    print(f"Agent name:   {settings.agent_name}  ← run exactly one worker with this name")
    print(f"Room:         {settings.room}")
    print(f"Avatar id:    {settings.avatar_id}")
    print(f"Avatar name:  {settings.avatar_name}")
    print(f"Anam video:   {'on (dev/room)' if settings.enable_anam else 'off (console or no ANAM_API_KEY)'}")
    print()
    print(f"XAI_API_KEY:         {_masked(settings.xai_api_key)}")
    print(f"ANAM_API_KEY:        {_masked(settings.anam_api_key)}")
    print(f"LIVEKIT_URL:         {settings.livekit_url or '(missing)'}")
    print(f"LIVEKIT_API_KEY:     {_masked(settings.livekit_api_key)}")
    print(f"LIVEKIT_API_SECRET:  {_masked(settings.livekit_api_secret)}")
    print()

    missing_grok = settings.missing_for_grok()
    missing_room = settings.missing_for_room()
    if missing_grok:
        print(f"console mode blocked until you set: {', '.join(missing_grok)}")
    else:
        print("console mode: ready (local mic → Grok Voice). Anam face is skipped.")

    if missing_room:
        print(f"dev / HTML client blocked until you set: {', '.join(missing_room)}")
    else:
        print("dev mode: ready (LiveKit room + Grok Voice + Anam face).")

    print()
    print("One-agent-only: do not start a second `python agent.py dev` against the same project.")
    print("Key rotation: replace XAI_API_KEY / ANAM_API_KEY / LIVEKIT_API_* independently, then restart.")
    print(f"App root: {APP_ROOT}")
    print(f"CWD:      {Path.cwd()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
