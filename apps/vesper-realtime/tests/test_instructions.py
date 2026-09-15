from pathlib import Path

import pytest

from vesper.config import APP_ROOT
from vesper.instructions import InstructionsError, load_instructions, resolve_instructions_path


def test_prefers_private_file(tmp_path: Path) -> None:
    private = tmp_path / "vesper_instructions.txt"
    example = tmp_path / "vesper_instructions.example.txt"
    example.write_text("example persona", encoding="utf-8")
    private.write_text("private persona", encoding="utf-8")
    assert resolve_instructions_path(private, example) == private
    assert load_instructions(private, example) == "private persona"


def test_falls_back_to_example(tmp_path: Path) -> None:
    private = tmp_path / "vesper_instructions.txt"
    example = tmp_path / "vesper_instructions.example.txt"
    example.write_text("  example only  \n", encoding="utf-8")
    assert load_instructions(private, example) == "example only"


def test_shipped_example_is_pg() -> None:
    text = (APP_ROOT / "persona" / "vesper_instructions.example.txt").read_text(encoding="utf-8")
    lowered = text.lower()
    assert "vesper" in lowered
    assert "placeholder" in lowered
    for banned in ("nsfw", "explicit", "unhinged"):
        assert banned not in lowered


def test_empty_file_errors(tmp_path: Path) -> None:
    example = tmp_path / "vesper_instructions.example.txt"
    example.write_text("   \n", encoding="utf-8")
    with pytest.raises(InstructionsError):
        load_instructions(tmp_path / "missing.txt", example)


def test_missing_both_errors(tmp_path: Path) -> None:
    with pytest.raises(InstructionsError):
        resolve_instructions_path(tmp_path / "a.txt", tmp_path / "b.txt")
