"""Lightweight research capture seam — post-persist only."""

from __future__ import annotations

from typing import Any, Protocol

from noema.research.trajectories import TrajectoryRecord, build_trajectory
from noema.world.state import WorldState


class ResearchStore(Protocol):
    def save_trajectory(self, record: dict[str, Any]) -> None: ...

    def list_events(self, *, after_sequence: int = 0, limit: int = 100_000) -> list[dict[str, Any]]: ...

    def list_trajectories(self) -> list[dict[str, Any]]: ...

    def clear_research_indexes(self) -> None: ...


class ResearchCapture:
    """Observe settled world batches and derive trajectory material."""

    def __init__(self, store: ResearchStore, *, enabled: bool = True):
        self.store = store
        self.enabled = enabled
        self._last_captured_sequence = 0
        self._failures: list[str] = []

    @property
    def degraded(self) -> bool:
        return bool(self._failures)

    def capture_after_commit(
        self,
        state: WorldState,
        events: list[dict[str, Any]],
        *,
        commit_meta: dict[str, Any] | None = None,
    ) -> TrajectoryRecord | None:
        """Called after the fenced world commit. Never raises into PLAY path."""
        if not self.enabled or not events:
            return None
        try:
            rec = build_trajectory(
                world_id=state.world_id,
                world_version=state.world_version,
                seed=state.seed,
                events=events,
                from_cycle=min(int(e["cycle"]) for e in events),
                to_cycle=max(int(e["cycle"]) for e in events),
                snapshot_refs=(
                    [{"snapshot_id": commit_meta["snapshot_id"], "sequence": state.sequence}]
                    if commit_meta and commit_meta.get("snapshot_id")
                    else []
                ),
                observation_refs=[
                    {"observation_id": oid, "digest": dig}
                    for oid, dig in (state.observation_digests or {}).items()
                    if any(
                        (e.get("payload") or {}).get("observation_id") == oid
                        or e.get("event_type") == "OBSERVATION_GENERATED"
                        for e in events
                    )
                ],
                message_refs=[
                    {"message_id": (e.get("payload") or {}).get("message_id")}
                    for e in events
                    if e.get("event_type") in ("MESSAGE", "MESSAGE_DELIVERED")
                    and (e.get("payload") or {}).get("message_id")
                ],
            )
            payload = rec.to_dict()
            self.store.save_trajectory(payload)
            self._last_captured_sequence = max(
                self._last_captured_sequence, max(int(e["sequence"]) for e in events)
            )
            return rec
        except Exception as exc:  # research is optional for PLAY readiness
            self._failures.append(str(exc))
            return None

    def rebuild_from_ledger(
        self,
        *,
        world_id: str,
        world_version: str,
        seed: str,
        events: list[dict[str, Any]] | None = None,
    ) -> list[TrajectoryRecord]:
        """Drop research indexes and rebuild trajectories from canonical ledger."""
        self.store.clear_research_indexes()
        ledger = events if events is not None else self.store.list_events(limit=1_000_000)
        if not ledger:
            return []
        # One window trajectory for MVP rebuild (all events).
        rec = build_trajectory(
            world_id=world_id,
            world_version=world_version,
            seed=seed,
            events=ledger,
            from_cycle=min(int(e["cycle"]) for e in ledger),
            to_cycle=max(int(e["cycle"]) for e in ledger),
            trajectory_id=f"traj.rebuild.{world_id}.{len(ledger)}",
        )
        self.store.save_trajectory(rec.to_dict())
        return [rec]
