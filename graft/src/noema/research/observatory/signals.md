# src/noema/research/observatory/signals.py

- external_cognition_signal · function · L8-L26 — def external_cognition_signal( *, signal_id: str, signal_type: str, artifact_entity_id: str, participants: list[str], evidence_refs: list[str], ) -> dict[str, Any]
- coordination_signal · function · L29-L51 — def coordination_signal( *, coordination_signal_id: str, signal_type: str, participants: list[str], evidence_refs: list[str], possible_interpretations: list[str] | None = None, confounds: list[str] | None = None, ) -> dict[str, Any]
- contradiction_analysis · function · L54-L70 — def contradiction_analysis( *, contradiction_set: dict[str, Any], agent_behavior_refs: list[str] | None = None, ) -> dict[str, Any]
