# src/noema/actions/router.py

- ActionRouter · class · L30-L424 — class ActionRouter
- __init__ · method · L49-L52 — def __init__(self, world_id: str)
- validate_action · method · L54-L80 — def validate_action(self, action: dict[str, Any], *, principal_agent_id: str | None) -> dict[str, Any]
- actions_to_events · method · L82-L94 — def actions_to_events(self, state: WorldState, actions: list[dict[str, Any]]) -> list[dict[str, Any]]
- apply_actions · method · L96-L137 — def apply_actions( self, state: WorldState, actions: list[dict[str, Any]], *, principal_agent_id: str | None = None, ) -> tuple[WorldState, list[dict[str, Any]], list[dict[str, Any]]]: # Initialize bundles for this mutation cycle
- _action_to_events · method · L139-L424 — def _action_to_events( # Router now routes most state access through bundle_seams (RoomsBundle, # EntitiesBundle, AgentsBundle) for greater depth + locality. self, state: WorldState, action: dict[str, Any], *, cycle: int, start_seq: int, previous_digest: str | None, ) -> list[dict[str, Any]]
- emit · function · L158-L174 — def emit(event_type: str, payload: dict[str, Any]) -> dict[str, Any]
