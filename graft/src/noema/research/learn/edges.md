# src/noema/research/learn/edges.py

- edge_body · function · L24-L25 — def edge_body(edge: dict[str, Any]) -> dict[str, Any]
- edge_digest · function · L28-L29 — def edge_digest(edge: dict[str, Any]) -> str
- validate_edge · function · L32-L75 — def validate_edge(edge: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]
- make_edge · function · L78-L109 — def make_edge( *, edge_id: str, edge_type: str, source_ref: str, target_ref: str, target_class: str, evidence_refs: list[str], claim_label: str, tested_boundary: dict[str, Any], relationship_status: str = "SUPPORTED", simple_label: str | None = None, counterevidence_refs: list[str] | None = None, known_confounds: list[str] | None = None, ) -> dict[str, Any]
- reject_transitive_edge · function · L112-L117 — def reject_transitive_edge(a_to_b: dict[str, Any], b_to_c: dict[str, Any]) -> None
- edges_from_research_artifacts · function · L120-L230 — def edges_from_research_artifacts( *, behavior_id: str, captured_test: dict[str, Any] | None = None, lab_result: dict[str, Any] | None = None, regression_results: list[dict[str, Any]] | None = None, ) -> list[dict[str, Any]]
- _slug · function · L233-L234 — def _slug(value: str) -> str
