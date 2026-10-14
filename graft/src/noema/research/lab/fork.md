# src/noema/research/lab/fork.py

- fork_body · function · L14-L15 — def fork_body(fork: dict[str, Any]) -> dict[str, Any]
- fork_digest · function · L18-L19 — def fork_digest(fork: dict[str, Any]) -> str
- validate_fork · function · L22-L55 — def validate_fork(fork: dict[str, Any]) -> dict[str, Any]
- create_fork · function · L58-L90 — def create_fork( *, experiment_id: str, source_state: WorldState, source_snapshot_id: str | None = None, fork_point: str = "CYCLE_BOUNDARY", fork_id: str | None = None, ) -> dict[str, Any]
- clone_state_for_fork · function · L93-L97 — def clone_state_for_fork(source: WorldState, experimental_world_id: str) -> WorldState
- ExperimentalWorld · class · L100-L122 — class ExperimentalWorld
- __init__ · method · L103-L110 — def __init__(self, fork: dict[str, Any], state: WorldState)
- append_experimental_event · method · L112-L119 — def append_experimental_event(self, event: dict[str, Any]) -> None
- tool_available · method · L121-L122 — def tool_available(self, tool_id: str) -> bool
