import os

from livekit import api

from vesper.config import Settings


def test_room_dispatch_is_named_vesper() -> None:
    dispatch = api.RoomAgentDispatch(agent_name="vesper")
    assert dispatch.agent_name == "vesper"


def test_mint_token_includes_jwt(monkeypatch) -> None:
    monkeypatch.setenv("LIVEKIT_API_KEY", "devkey")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "secretsecretsecretsecretsecretsecret12")
    monkeypatch.setenv("LIVEKIT_URL", "wss://example.livekit.cloud")
    monkeypatch.setenv("XAI_API_KEY", "xai-test")
    # Import after env so the helper sees Settings.from_env
    from client.token_server import mint_token

    settings = Settings.from_env(argv=["dev"])
    token = mint_token(settings, "tester")
    assert token.count(".") == 2
    assert settings.agent_name == "vesper"
