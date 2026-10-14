# src/noema/research/compiler/projection.py

- simple_capture_view · function · L11-L69 — def simple_capture_view( *, captured_test: dict[str, Any] | None, compiler_result: dict[str, Any], required_labels: list[str], removed_labels: list[str], reason_codes: list[str] | None = None, ) -> dict[str, Any]
- advanced_capture_view · function · L72-L105 — def advanced_capture_view( *, captured_test: dict[str, Any] | None, compiler_result: dict[str, Any], request: dict[str, Any], lab_result_id: str, confounds: list[str], ) -> dict[str, Any]
- reproducibility_view · function · L108-L141 — def reproducibility_view( *, captured_test: dict[str, Any] | None, compiler_result: dict[str, Any], receipt: dict[str, Any], audit_root_digest: str, ) -> dict[str, Any]
- regression_result · function · L144-L163 — def regression_result( *, captured_test_id: str, subject_agent_version: str, oracle_result: str, claim_label: str = "INFERRED", ) -> dict[str, Any]
