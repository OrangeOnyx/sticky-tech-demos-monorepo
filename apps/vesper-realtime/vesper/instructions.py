from __future__ import annotations

from pathlib import Path

from vesper.config import EXAMPLE_INSTRUCTIONS, PRIVATE_INSTRUCTIONS


class InstructionsError(FileNotFoundError):
    """Neither the private persona file nor the shipped example exists."""


def resolve_instructions_path(
    private_path: Path = PRIVATE_INSTRUCTIONS,
    example_path: Path = EXAMPLE_INSTRUCTIONS,
) -> Path:
    """Prefer the local private file; fall back to the PG example."""
    if private_path.is_file():
        return private_path
    if example_path.is_file():
        return example_path
    raise InstructionsError(
        f"No instructions file found. Copy {example_path.name} to {private_path.name} "
        "and paste the private persona locally. Do not commit the private file."
    )


def load_instructions(
    private_path: Path = PRIVATE_INSTRUCTIONS,
    example_path: Path = EXAMPLE_INSTRUCTIONS,
) -> str:
    path = resolve_instructions_path(private_path, example_path)
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise InstructionsError(f"Instructions file is empty: {path}")
    return text
