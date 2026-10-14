# src/noema/research/capture.py

- ResearchStore · class · L11-L18 — class ResearchStore(Protocol)
- save_trajectory · method · L12-L12 — def save_trajectory(self, record: dict[str, Any]) -> None
- list_events · method · L14-L14 — def list_events(self, *, after_sequence: int = 0, limit: int = 100_000) -> list[dict[str, Any]]
- list_trajectories · method · L16-L16 — def list_trajectories(self) -> list[dict[str, Any]]
- clear_research_indexes · method · L18-L18 — def clear_research_indexes(self) -> None
- ResearchCapture · class · L21-L107 — class ResearchCapture
- __init__ · method · L24-L28 — def __init__(self, store: ResearchStore, *, enabled: bool = True)
- degraded · method · L31-L32 — def degraded(self) -> bool
- capture_after_commit · method · L34-L81 — def capture_after_commit( self, state: WorldState, events: list[dict[str, Any]], *, commit_meta: dict[str, Any] | None = None, ) -> TrajectoryRecord | None
- rebuild_from_ledger · method · L83-L107 — def rebuild_from_ledger( self, *, world_id: str, world_version: str, seed: str, events: list[dict[str, Any]] | None = None, ) -> list[TrajectoryRecord]
