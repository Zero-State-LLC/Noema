# src/noema/research/observatory/features.py

- _clamp_mp · function · L15-L16 — def _clamp_mp(value: int | float) -> int
- extract_features · function · L19-L93 — def extract_features( events: list[dict[str, Any]], *, agent_id: str, start_cycle: int, end_cycle: int, missing_policy: str = "NOT_COMPUTABLE", ) -> dict[str, Any]
- rate · function · L43-L47 — def rate(types: set[str]) -> int | None
- _event_involves_agent · function · L96-L103 — def _event_involves_agent(event: dict[str, Any], agent_id: str) -> bool
- _latency_mp · function · L106-L112 — def _latency_mp(events: list[dict[str, Any]]) -> int
- _persistence_mp · function · L115-L127 — def _persistence_mp(events: list[dict[str, Any]]) -> int
- _switching_mp · function · L130-L135 — def _switching_mp(events: list[dict[str, Any]]) -> int
- feature_delta · function · L138-L147 — def feature_delta(pre: dict[str, Any], post: dict[str, Any], feature_id: str) -> int | None
- validate_feature_vector · function · L150-L162 — def validate_feature_vector(vector: dict[str, Any]) -> dict[str, Any]
- catalog_family_count · function · L165-L166 — def catalog_family_count() -> int
