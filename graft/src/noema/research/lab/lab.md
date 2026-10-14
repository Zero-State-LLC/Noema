# src/noema/research/lab/lab.py

- LabSessionResult · class · L21-L31 — class LabSessionResult
- Lab · class · L34-L247 — class Lab
- run_from_intent · method · L37-L66 — def run_from_intent( self, *, intent: dict[str, Any], source_state: WorldState, interventions: list[dict[str, Any]], agent_id: str | None = None, trajectory_id: str | None = None, plan: dict[str, Any] | None = None, confounds: list[str] | None = None, max_runs: int | None = None, ) -> LabSessionResult
- run_experiment · method · L68-L235 — def run_experiment( self, *, experiment: dict[str, Any], source_state: WorldState, interventions: list[dict[str, Any]], agent_id: str, plan: dict[str, Any] | None = None, confounds: list[str] | None = None, max_runs: int | None = None, source_intent_id: str | None = None, counterevidence: list[str] | None = None, ) -> LabSessionResult
- capture_gate · method · L237-L238 — def capture_gate(self, result: dict[str, Any]) -> dict[str, Any]
- study_view · method · L240-L247 — def study_view(self, session: LabSessionResult) -> dict[str, Any]
