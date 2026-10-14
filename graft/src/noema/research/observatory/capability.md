# src/noema/research/observatory/capability.py

- build_capability_candidate · function · L10-L39 — def build_capability_candidate( *, candidate_id: str, capability_id: str, trajectory_refs: list[str], anomaly_refs: list[str] | None = None, shift_refs: list[str] | None = None, observed_conditions: dict[str, Any] | None = None, novel_unknown_marker: str | None = None, confounds: list[str] | None = None, ) -> dict[str, Any]
- build_unknown_candidate · function · L42-L64 — def build_unknown_candidate( *, unknown_id: str, minimal_description: str, evidence_refs: list[str], open_questions: list[str] | None = None, known_non_explanations: list[str] | None = None, kind: str = "UNKNOWN_BEHAVIOR", ) -> dict[str, Any]
