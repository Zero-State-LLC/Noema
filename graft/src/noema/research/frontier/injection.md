# src/noema/research/frontier/injection.py

- build_situation_injected_event · function · L10-L67 — def build_situation_injected_event( *, world_id: str, cycle: int, sequence: int, previous_digest: str | None, situation_id: str, genome: dict[str, Any], score_components: dict[str, Any], selection_score: float = 1.0, seed_stream_id: str | None = None, plan_id: str | None = None, actor_id: str = "frontier.director", event_id: str | None = None, occurred_at: str | None = None, ) -> dict[str, Any]
- build_follow_on_entity_update · function · L70-L101 — def build_follow_on_entity_update( *, world_id: str, cycle: int, sequence: int, previous_digest: str | None, entity_id: str, set_map: dict[str, Any], situation_id: str, event_id: str | None = None, ) -> dict[str, Any]
