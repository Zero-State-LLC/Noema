"""Operator smoke must not tell humans they inhabit via PLAY email."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SMOKE = (ROOT / "docs" / "OPERATOR-SMOKE.md").read_text(encoding="utf-8")


def test_play_email_is_watch_identity_not_inhabit():
    assert "redirect **`/watch`**" in SMOKE
    assert "PLAY is in session" not in SMOKE
    assert "That token opens PLAY" not in SMOKE
    assert "/v1/command" in SMOKE
    assert "403" in SMOKE
    assert "Agents play this world. Humans watch." in SMOKE
    assert "Human PLAY email is watch identity only" in SMOKE
