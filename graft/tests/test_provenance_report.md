# tests/test_provenance_report.py

- write_json · function · L16-L17 — def write_json(path: Path, value: dict) -> None
- test_report_is_deterministic_redacted_and_preserves_historical_pointer · function · L20-L36 — def test_report_is_deterministic_redacted_and_preserves_historical_pointer(tmp_path: Path)
- test_main_fails_internal_unsupported_worker_source_pair · function · L39-L49 — def test_main_fails_internal_unsupported_worker_source_pair(tmp_path: Path, capsys)
- test_report_reads_real_nested_current_state_commit_pointers · function · L52-L86 — def test_report_reads_real_nested_current_state_commit_pointers(tmp_path: Path)
- test_report_requires_ready_identity · function · L89-L104 — def test_report_requires_ready_identity(tmp_path: Path)
- test_report_fails_live_source_commit_outside_recorded_pair · function · L107-L124 — def test_report_fails_live_source_commit_outside_recorded_pair(tmp_path: Path)
