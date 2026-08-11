"""Isolated experimental world forks — never mutate production ledger."""

from __future__ import annotations

import copy
from typing import Any

from noema.research.lab.catalog import FORK_POINTS
from noema.research.lab.errors import INVALID_FORK, PRODUCTION_MUTATION_FORBIDDEN, LabError
from noema.world.digest import sha256_digest
from noema.world.state import WorldState


def fork_body(fork: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in fork.items() if k not in ("digest", "fork_digest")}


def fork_digest(fork: dict[str, Any]) -> str:
    return sha256_digest(fork_body(fork))


def validate_fork(fork: dict[str, Any]) -> dict[str, Any]:
    if fork.get("schema_version") != "experiment-fork/0.4":
        raise LabError(INVALID_FORK, f"unsupported fork schema {fork.get('schema_version')}")
    for f in (
        "fork_id",
        "experiment_id",
        "source_world_id",
        "source_world_version",
        "source_snapshot_id",
        "source_ledger_head",
        "fork_cycle",
        "fork_event_boundary",
        "experimental_world_id",
        "fork_point",
    ):
        if f not in fork:
            raise LabError(INVALID_FORK, f"fork missing {f}")
    if fork.get("mutates_production") is not False:
        raise LabError(PRODUCTION_MUTATION_FORBIDDEN, "mutates_production must be false")
    if fork.get("mid_reducer_fork_forbidden") is False:
        raise LabError(INVALID_FORK, "mid-reducer forks forbidden")
    fp = fork["fork_point"]
    if fp not in FORK_POINTS and fp != "FORK_BOUNDARY":
        raise LabError(INVALID_FORK, f"illegal fork_point {fp}")
    dig = fork_digest(fork)
    recorded = fork.get("fork_digest") or fork.get("digest")
    if recorded and recorded != dig:
        raise LabError(INVALID_FORK, "fork_digest mismatch")
    out = dict(fork)
    out["fork_digest"] = dig
    out["digest"] = dig
    out["mutates_production"] = False
    out["mid_reducer_fork_forbidden"] = True
    return out


def create_fork(
    *,
    experiment_id: str,
    source_state: WorldState,
    source_snapshot_id: str | None = None,
    fork_point: str = "CYCLE_BOUNDARY",
    fork_id: str | None = None,
) -> dict[str, Any]:
    if fork_point not in FORK_POINTS and fork_point != "FORK_BOUNDARY":
        raise LabError(INVALID_FORK, f"illegal fork_point {fork_point}")
    fid = fork_id or f"fork.{experiment_id}"
    exp_world = f"{source_state.world_id}.exp.{experiment_id}"
    fork = {
        "schema_version": "experiment-fork/0.4",
        "fork_id": fid,
        "experiment_id": experiment_id,
        "source_world_id": source_state.world_id,
        "source_world_version": source_state.world_version,
        "source_snapshot_id": source_snapshot_id or f"snap.{source_state.world_id}.c{source_state.cycle}",
        "source_ledger_head": source_state.last_event_digest or "",
        "fork_cycle": int(source_state.cycle),
        "fork_event_boundary": int(source_state.sequence),
        "experimental_world_id": exp_world,
        "fork_point": fork_point,
        "mutates_production": False,
        "mid_reducer_fork_forbidden": True,
        "experimental_ledger_id": f"ledger.{exp_world}",
        "storage_namespace": f"research/lab/{experiment_id}",
    }
    dig = fork_digest(fork)
    fork["fork_digest"] = dig
    fork["digest"] = dig
    return fork


def clone_state_for_fork(source: WorldState, experimental_world_id: str) -> WorldState:
    """Deep-copy production state into an isolated experimental WorldState."""
    exp = source.clone()
    exp.world_id = experimental_world_id
    return exp


class ExperimentalWorld:
    """In-memory experimental world; writes never touch production store."""

    def __init__(self, fork: dict[str, Any], state: WorldState):
        self.fork = validate_fork(fork)
        self.state = state
        self.events: list[dict[str, Any]] = []
        self.ablated_tools: set[str] = set()
        self.perturbations: list[dict[str, Any]] = []
        self.restored = False
        self.namespace = self.fork["storage_namespace"]

    def append_experimental_event(self, event: dict[str, Any]) -> None:
        """Experimental ledger only — caller must not write production store."""
        if event.get("world_id") == self.fork["source_world_id"] and not str(event.get("world_id", "")).endswith(
            self.fork["experiment_id"]
        ):
            # force experimental world id
            event = {**event, "world_id": self.fork["experimental_world_id"]}
        self.events.append(event)

    def tool_available(self, tool_id: str) -> bool:
        return tool_id not in self.ablated_tools
