# src/noema/research/lab/runs.py

- validate_run · function · L15-L21 — def validate_run(run: dict[str, Any]) -> dict[str, Any]
- run_identity_digest · function · L24-L34 — def run_identity_digest(run: dict[str, Any]) -> str
- execute_run · function · L37-L115 — def execute_run( *, run_spec: dict[str, Any], source_state: WorldState, interventions: list[dict[str, Any]] | None = None, agent_id: str, measure_feature: str = "cooperation_signal", seed: str | None = None, ) -> dict[str, Any]
- _role_proxy · function · L118-L133 — def _role_proxy(role: str, feature: str, applied: list[dict[str, Any]]) -> int
