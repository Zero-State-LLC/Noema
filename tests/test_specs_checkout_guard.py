"""The cross-repo guard needs its own cover.

Its whole value is behaving differently under CI, and that difference is exactly
what a green local run cannot demonstrate.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from specs_checkout import require_specs

MISSING = Path("/nonexistent/noema-specs/examples/v01-seed")


def test_present_artifact_is_a_no_op(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CI", "true")
    require_specs(tmp_path, "a directory that exists")


def test_missing_artifact_skips_locally(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CI", raising=False)
    with pytest.raises(BaseException) as caught:
        require_specs(MISSING, "published v0.1 seed fixtures")
    assert caught.typename == "Skipped", f"expected a skip locally, got {caught.typename}"


def test_missing_artifact_fails_under_ci(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CI", "true")
    with pytest.raises(BaseException) as caught:
        require_specs(MISSING, "published v0.1 seed fixtures")
    assert caught.typename == "Failed", f"expected a failure in CI, got {caught.typename}"


def test_failure_names_the_artifact_and_the_likely_cause(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CI", "true")
    with pytest.raises(BaseException) as caught:
        require_specs(MISSING, "published v0.1 seed fixtures")
    message = str(caught.value)
    assert "published v0.1 seed fixtures" in message
    assert str(MISSING) in message
    # The lagging pin is the cause that actually bit us in Noema #608.
    assert "advance the pin" in message
