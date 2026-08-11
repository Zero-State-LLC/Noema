"""Trajectory material derived from canonical world artifacts."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from noema.world.digest import sha256_digest


@dataclass
class TrajectoryRecord:
    """Minimal trajectory representation for Frontier / future Observatory."""

    schema_version: str
    trajectory_id: str
    world_id: str
    agent_ids: list[str]
    from_cycle: int
    to_cycle: int
    world_version: str
    protocol_versions: list[str]
    seed: str
    event_refs: list[dict[str, Any]] = field(default_factory=list)
    action_refs: list[dict[str, Any]] = field(default_factory=list)
    observation_refs: list[dict[str, Any]] = field(default_factory=list)
    message_refs: list[dict[str, Any]] = field(default_factory=list)
    snapshot_refs: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    provenance: dict[str, Any] = field(default_factory=dict)
    content_digest: str = ""

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        body = {k: v for k, v in d.items() if k != "content_digest"}
        d["content_digest"] = sha256_digest(body)
        return d


def build_trajectory(
    *,
    world_id: str,
    world_version: str,
    seed: str,
    events: list[dict[str, Any]],
    agent_ids: list[str] | None = None,
    from_cycle: int | None = None,
    to_cycle: int | None = None,
    protocol_versions: list[str] | None = None,
    action_refs: list[dict[str, Any]] | None = None,
    observation_refs: list[dict[str, Any]] | None = None,
    message_refs: list[dict[str, Any]] | None = None,
    snapshot_refs: list[dict[str, Any]] | None = None,
    trajectory_id: str | None = None,
) -> TrajectoryRecord:
    """Build a trajectory that *references* world truth rather than duplicating it."""
    cycles = [int(e.get("cycle", 0)) for e in events] or [0]
    start = from_cycle if from_cycle is not None else min(cycles)
    end = to_cycle if to_cycle is not None else max(cycles)
    agents = list(agent_ids or [])
    if not agents:
        seen: set[str] = set()
        for e in events:
            actor = e.get("actor_id")
            if actor and actor not in ("system", "frontier.director") and not str(actor).startswith("frontier."):
                seen.add(str(actor))
            payload = e.get("payload") or {}
            for key in ("agent_id", "sender_id", "recipient_id", "proposer_id", "counterparty_id"):
                if payload.get(key):
                    seen.add(str(payload[key]))
        agents = sorted(seen)

    event_refs = [
        {
            "event_id": e["event_id"],
            "event_type": e["event_type"],
            "sequence": e["sequence"],
            "cycle": e["cycle"],
            "digest": e.get("digest"),
        }
        for e in events
    ]
    tid = trajectory_id or f"traj.{world_id}.{start}.{end}.{len(event_refs)}"
    rec = TrajectoryRecord(
        schema_version="trajectory/1.0",
        trajectory_id=tid,
        world_id=world_id,
        agent_ids=agents,
        from_cycle=int(start),
        to_cycle=int(end),
        world_version=world_version,
        protocol_versions=list(protocol_versions or ["agent-protocol/v1"]),
        seed=seed,
        event_refs=event_refs,
        action_refs=list(action_refs or []),
        observation_refs=list(observation_refs or []),
        message_refs=list(message_refs or []),
        snapshot_refs=list(snapshot_refs or []),
        # Compact event envelopes for offline Frontier fixture use; rebuild prefers refs.
        events=[{"event_id": e["event_id"], "event_type": e["event_type"], "sequence": e["sequence"]} for e in events],
        provenance={
            "source": "canonical_ledger",
            "rebuildable": True,
            "canonicalization": "noema-jcs/1",
            "claim_label": "OBSERVED",
        },
    )
    dig = sha256_digest({k: v for k, v in rec.to_dict().items() if k != "content_digest"})
    rec.content_digest = dig
    return rec
