# workers/noema/scripts/economic_health.py

- _forman_cascading_risk · function · L21-L55 — def _forman_cascading_risk(edges: List[Any]) -> float
- EconomicHealth · class · L58-L80 — class EconomicHealth
- compute_economic_health · function · L82-L146 — def compute_economic_health(snapshot: Dict[str, Any], agents: List[Dict[str, Any]]) -> EconomicHealth
- apply_asi · function · L148-L200 — def apply_asi(h: EconomicHealth, snapshot: Dict[str, Any], agents: List[Dict[str, Any]]) -> None
- sar_for_ops · function · L203-L216 — def sar_for_ops(health: EconomicHealth) -> Dict[str, Any]
- enrich_observation_with_ewm · function · L218-L239 — def enrich_observation_with_ewm(obs: dict, health: EconomicHealth) -> dict
