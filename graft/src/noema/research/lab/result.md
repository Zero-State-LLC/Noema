# src/noema/research/lab/result.py

- classify_intervention_outcome · function · L23-L31 — def classify_intervention_outcome(baseline_measure: int | None, intervention_measure: int | None, *, threshold: int = 150) -> str
- classify_replication · function · L34-L41 — def classify_replication(a: int | None, b: int | None, *, band: int = 50) -> str
- build_lab_result · function · L44-L154 — def build_lab_result( *, lab_result_id: str, experiment_id: str, source_candidate_ids: list[str], runs: list[dict[str, Any]], measure_feature: str = "cooperation_signal", confounds: list[str] | None = None, counterevidence: list[str] | None = None, source_intent_id: str | None = None, required_controls_pass: bool = True, budget_partial: bool = False, ) -> dict[str, Any]
- measure · function · L61-L65 — def measure(role: str) -> int | None
- simple_result_projection · function · L157-L198 — def simple_result_projection(result: dict[str, Any], *, question: str | None = None) -> dict[str, Any]
- gate_capture_as_test · function · L201-L215 — def gate_capture_as_test(result: dict[str, Any]) -> dict[str, Any]
