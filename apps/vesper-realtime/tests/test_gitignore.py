from vesper.config import APP_ROOT


def test_gitignore_keeps_secrets_and_private_persona_out() -> None:
    text = (APP_ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "persona/vesper_instructions.txt" in text
    assert ".env" in text
    assert "!.env.example" in text
