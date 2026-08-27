from pathlib import Path

from maint_evolve.plugins import load_enabled_hints, write_proposed


def test_proposed_not_imported(tmp_path: Path):
    src = "def after_look(obs):\n    raise RuntimeError('should not run')\n"
    write_proposed(tmp_path / "proposed", "evil", src, "test")
    hints = load_enabled_hints(tmp_path / "enabled", {})
    assert hints == []


def test_enabled_after_look(tmp_path: Path):
    enabled = tmp_path / "enabled"
    enabled.mkdir()
    (enabled / "hint.py").write_text(
        "def after_look(obs):\n    return ['scar here']\n", encoding="utf-8"
    )
    assert load_enabled_hints(enabled, {}) == ["scar here"]
