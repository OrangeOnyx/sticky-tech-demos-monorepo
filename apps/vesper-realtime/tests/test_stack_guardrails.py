from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent

BANNED_LLM_IMPORTS = (
    "livekit.plugins.openai",
    "livekit.plugins.elevenlabs",
    "livekit.plugins.tavus",
    "openai.realtime",
    "inference.LLM",
)


def _agent_sources() -> str:
    chunks = [
        (APP_ROOT / "agent.py").read_text(encoding="utf-8"),
        (APP_ROOT / "vesper" / "session.py").read_text(encoding="utf-8"),
    ]
    return "\n".join(chunks)


def test_brain_is_xai_realtime() -> None:
    text = _agent_sources()
    assert "xai.realtime.RealtimeModel" in text
    assert "Agent(instructions=" in text or "instructions=instructions" in text


def test_no_sanitizing_llm_stack() -> None:
    text = _agent_sources()
    for banned in BANNED_LLM_IMPORTS:
        assert banned not in text, f"must not route the brain through {banned}"


def test_anam_is_avatar_only() -> None:
    text = (APP_ROOT / "vesper" / "session.py").read_text(encoding="utf-8")
    assert "anam.AvatarSession" in text
    assert "PersonaConfig" in text
