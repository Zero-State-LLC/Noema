# src/noema/research/observatory/audit.py

- make_observatory_audit · function · L10-L37 — def make_observatory_audit( *, analysis_run_id: str, record_index: int, operation: str, input_digest: str, feature_result_digest: str | None = None, baseline_result_digest: str | None = None, detector_result: dict[str, Any] | None = None, previous_record_digest: str | None = None, extra: dict[str, Any] | None = None, ) -> dict[str, Any]
