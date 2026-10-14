# src/noema/research/frontier/audit.py

- make_audit_record · function · L10-L42 — def make_audit_record( *, request_id: str, record_index: int, record_type: str, input_digest: str, director_implementation_digest: str, candidate_id: str | None, score_components: dict[str, Any] | None, constraint_decisions: list[dict[str, Any]], reason_codes: list[str], previous_record_digest: str | None, extra: dict[str, Any] | None = None, ) -> dict[str, Any]
