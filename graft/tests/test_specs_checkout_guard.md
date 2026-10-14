# tests/test_specs_checkout_guard.py

- test_present_artifact_is_a_no_op · function · L18-L20 — def test_present_artifact_is_a_no_op(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None
- test_missing_artifact_skips_locally · function · L23-L27 — def test_missing_artifact_skips_locally(monkeypatch: pytest.MonkeyPatch) -> None
- test_missing_artifact_fails_under_ci · function · L30-L34 — def test_missing_artifact_fails_under_ci(monkeypatch: pytest.MonkeyPatch) -> None
- test_failure_names_the_artifact_and_the_likely_cause · function · L37-L45 — def test_failure_names_the_artifact_and_the_likely_cause(monkeypatch: pytest.MonkeyPatch) -> None
