"""Trajectory/0.3 validation and identity."""

from __future__ import annotations

from typing import Any

from noema.research.errors import INSUFFICIENT_RESEARCH_INPUT, INVALID_GENOME, ResearchError
from noema.world.digest import sha256_digest

SCHEMA = "trajectory/0.3"
KINDS = ("bounded_window", "session", "experiment", "export")


def trajectory_body(traj: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in traj.items() if k != "digest"}


def trajectory_digest(traj: dict[str, Any]) -> str:
    return sha256_digest(trajectory_body(traj))


def validate_trajectory_v03(traj: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]:
    if not isinstance(traj, dict):
        raise ResearchError(INVALID_GENOME, "trajectory must be object")
    if traj.get("schema_version") != SCHEMA:
        raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, f"unsupported trajectory schema {traj.get('schema_version')}")
    for field in (
        "trajectory_id",
        "world_id",
        "world_version",
        "agent_id",
        "start_cycle",
        "end_cycle",
        "consent_basis",
        "feature_version",
        "kind",
    ):
        if traj.get(field) in (None, ""):
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, f"trajectory missing {field}")
    if traj.get("kind") not in KINDS and traj.get("kind") != "bounded_window":
        # accept known fixture kind primarily
        if traj.get("kind") not in ("bounded_window",):
            pass  # allow other kinds if present
    # refs only — event_refs must be ids not full bodies
    for key in ("event_refs", "observation_refs", "action_refs", "message_refs"):
        refs = traj.get(key) or []
        for ref in refs:
            if not isinstance(ref, str):
                raise ResearchError(INVALID_GENOME, f"{key} must be string refs not full bodies")
    dig = trajectory_digest(traj)
    if require_digest:
        recorded = traj.get("digest")
        if not recorded:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "trajectory digest required")
        if recorded != dig:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "trajectory digest mismatch")
    out = dict(traj)
    out["digest"] = dig
    return out


def upgrade_v01_capture_to_v03(
    capture: dict[str, Any],
    *,
    agent_id: str,
    agent_version: str = "agentver.runtime.1",
    consent_basis: str = "consent.research.runtime",
    frontier_genome_id: str | None = None,
) -> dict[str, Any]:
    """Project Phase 2A trajectory/1.0 capture into trajectory/0.3 research shape."""
    event_refs = []
    for e in capture.get("event_refs") or []:
        if isinstance(e, dict):
            event_refs.append(str(e.get("event_id") or e.get("digest") or ""))
        else:
            event_refs.append(str(e))
    event_refs = [x for x in event_refs if x]
    traj = {
        "schema_version": SCHEMA,
        "trajectory_id": capture.get("trajectory_id") or f"traj.runtime.{agent_id}",
        "trajectory_version": "1",
        "world_id": capture.get("world_id"),
        "world_version": capture.get("world_version") or "world/v1",
        "agent_id": agent_id,
        "agent_version": agent_version,
        "start_cycle": int(capture.get("from_cycle") or capture.get("start_cycle") or 0),
        "end_cycle": int(capture.get("to_cycle") or capture.get("end_cycle") or 0),
        "event_refs": event_refs,
        "observation_refs": [
            (r.get("observation_id") if isinstance(r, dict) else str(r))
            for r in (capture.get("observation_refs") or [])
        ],
        "action_refs": [
            (r.get("action_id") if isinstance(r, dict) else str(r)) for r in (capture.get("action_refs") or [])
        ],
        "message_refs": [
            (r.get("message_id") if isinstance(r, dict) else str(r)) for r in (capture.get("message_refs") or [])
        ],
        "tool_call_refs": [],
        "world_context_refs": [],
        "experiment_id": None,
        "frontier_genome_id": frontier_genome_id,
        "consent_basis": consent_basis,
        "visibility_partition": "research",
        "feature_version": "behavior-features/0.3",
        "kind": "bounded_window",
        "missing_intervals": [],
    }
    traj["digest"] = trajectory_digest(traj)
    return traj
