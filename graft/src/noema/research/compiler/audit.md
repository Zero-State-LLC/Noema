# src/noema/research/compiler/audit.py

- make_compiler_audit · function · L10-L39 — def make_compiler_audit( *, compile_id: str, record_index: int, phase: str, previous_digest: str | None, proposal_id: str | None = None, removed_unit_ids: list[str] | None = None, oracle_result: str | None = None, decision: str | None = None, extra: dict[str, Any] | None = None, ) -> dict[str, Any]
- audit_root · function · L42-L45 — def audit_root(records: list[dict[str, Any]]) -> str
