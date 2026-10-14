# src/noema/research/trajectories.py

- TrajectoryRecord · class · L12-L37 — class TrajectoryRecord
- to_dict · method · L33-L37 — def to_dict(self) -> dict[str, Any]
- build_trajectory · function · L40-L110 — def build_trajectory( *, world_id: str, world_version: str, seed: str, events: list[dict[str, Any]], agent_ids: list[str] | None = None, from_cycle: int | None = None, to_cycle: int | None = None, protocol_versions: list[str] | None = None, action_refs: list[dict[str, Any]] | None = None, observation_refs: list[dict[str, Any]] | None = None, message_refs: list[dict[str, Any]] | None = None, snapshot_refs: list[dict[str, Any]] | None = None, trajectory_id: str | None = None, ) -> TrajectoryRecord
