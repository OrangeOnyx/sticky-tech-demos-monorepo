from vesper.config import FALLBACK_VOICE, PREFERRED_VOICE, Settings, resolve_voice


def test_prefer_eve_when_unset() -> None:
    assert resolve_voice(None) == PREFERRED_VOICE
    assert resolve_voice("") == PREFERRED_VOICE
    assert resolve_voice("  ") == PREFERRED_VOICE
    assert PREFERRED_VOICE == "eve"


def test_unknown_voice_falls_back_to_ara() -> None:
    assert resolve_voice("not-a-voice") == FALLBACK_VOICE
    assert FALLBACK_VOICE == "ara"


def test_known_voices_normalized() -> None:
    assert resolve_voice("Eve") == "eve"
    assert resolve_voice("ARA") == "ara"


def test_default_avatar_id() -> None:
    settings = Settings.from_env(argv=["dev"])
    assert settings.avatar_id == "35069738-6eb1-4eaf-8b56-43d21b67e78d"
    assert settings.agent_name == "vesper"


def test_console_disables_anam(monkeypatch) -> None:
    monkeypatch.setenv("ANAM_API_KEY", "anam-test-key")
    assert Settings.from_env(argv=["dev"]).enable_anam is True
    assert Settings.from_env(argv=["console"]).enable_anam is False


def test_missing_xai_key(monkeypatch) -> None:
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    settings = Settings.from_env(argv=["console"])
    assert "XAI_API_KEY" in settings.missing_for_grok()
