# src/noema/research/observatory/baselines.py

- baseline_body · function · L20-L21 — def baseline_body(baseline: dict[str, Any]) -> dict[str, Any]
- baseline_digest · function · L24-L25 — def baseline_digest(baseline: dict[str, Any]) -> str
- validate_baseline · function · L28-L56 — def validate_baseline(baseline: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]
- build_self_history_baseline · function · L59-L98 — def build_self_history_baseline( *, baseline_id: str, agent_id: str, start_cycle: int, end_cycle: int, feature_summary: dict[str, int], evidence_count: int, minimum_evidence: int = 5, world_version: str = "world/v1", risk_regime_band: str = "stable", ) -> dict[str, Any]
- forbid_silent_rebuild · function · L101-L108 — def forbid_silent_rebuild(existing: dict[str, Any], rebuilt: dict[str, Any]) -> None
