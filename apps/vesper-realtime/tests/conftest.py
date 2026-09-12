from pathlib import Path

import pytest

APP_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(autouse=True)
def _app_cwd(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(APP_ROOT)
