# src/noema/research/lab/audit.py

- make_lab_audit · function · L10-L39 — def make_lab_audit( *, audit_id: str, experiment_id: str, event_kind: str, previous_state: str | None, new_state: str, reason_code: str, actor: str = "system.lab", evidence_refs: list[str] | None = None, previous_digest: str | None = None, cycle: int | None = None, ) -> dict[str, Any]
