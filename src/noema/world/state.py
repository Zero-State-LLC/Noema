"""WorldState model and seed loading for NOEMA v0.1."""

from __future__ import annotations

import copy
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class WorldState:
    world_id: str
    world_version: str
    seed: str
    catalog_version: str
    cycle: int
    sequence: int
    budget_defaults: dict[str, float]
    rooms: dict[str, dict[str, Any]]
    exits: dict[str, dict[str, Any]]
    entities: dict[str, dict[str, Any]]
    registered_agents: dict[str, dict[str, Any]]
    active_agents: dict[str, dict[str, Any]] = field(default_factory=dict)
    organizations: dict[str, dict[str, Any]] = field(default_factory=dict)
    messages: dict[str, dict[str, Any]] = field(default_factory=dict)
    trades: dict[str, dict[str, Any]] = field(default_factory=dict)
    pending_observations: dict[str, dict[str, Any]] = field(default_factory=dict)
    observation_digests: dict[str, str] = field(default_factory=dict)
    situations: dict[str, dict[str, Any]] = field(default_factory=dict)
    audit: list[dict[str, Any]] = field(default_factory=list)
    destroyed_entities: list[str] = field(default_factory=list)
    last_event_digest: str | None = None
    event_count: int = 0

    def clone(self) -> WorldState:
        return copy.deepcopy(self)

    def room_entity_ids(self, room_id: str) -> list[str]:
        room = self.rooms[room_id]
        return list(room.get("entity_ids") or [])


def load_seed(path: Path | str) -> WorldState:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    rooms = {r["room_id"]: dict(r) for r in data["rooms"]}
    exits = {e["exit_id"]: dict(e) for e in data["exits"]}
    entities = {e["entity_id"]: dict(e) for e in data["entities"]}
    registered = {a["agent_id"]: dict(a) for a in data.get("registered_agents", [])}
    return WorldState(
        world_id=data["world_id"],
        world_version=data["world_version"],
        seed=data["seed"],
        catalog_version=data["catalog_version"],
        cycle=int(data.get("cycle", 0)),
        sequence=int(data.get("sequence", 0)),
        budget_defaults=dict(data["budget_defaults"]),
        rooms=rooms,
        exits=exits,
        entities=entities,
        registered_agents=registered,
        active_agents=dict(data.get("active_agents") or {}),
        organizations=dict(data.get("organizations") or {}),
        messages=dict(data.get("messages") or {}),
        trades=dict(data.get("trades") or {}),
    )


def _json_number(value: float | int) -> float | int:
    """Normalize whole floats to int for stable acceptance digests."""
    if isinstance(value, bool):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, int):
        return value
    return float(value)


def acceptance_projection(state: WorldState) -> dict[str, Any]:
    """Project state into the v0.1 acceptance comparison shape."""
    active = {}
    for agent_id, agent in state.active_agents.items():
        budgets = {
            k: _json_number(agent["budgets"][k])
            for k in ("attention", "compute", "energy", "influence", "storage")
            if k in agent["budgets"]
        }
        # include any extra resources deterministically
        for k in sorted(agent["budgets"]):
            if k not in budgets:
                budgets[k] = _json_number(agent["budgets"][k])
        active[agent_id] = {
            "room_id": agent["room_id"],
            "budgets": budgets,
        }

    organizations = {}
    for org_id, org in state.organizations.items():
        members = [{"agent_id": m["agent_id"], "role": m["role"]} for m in org["members"]]
        organizations[org_id] = {
            "name": org["name"],
            "status": org["status"],
            "members": members,
        }

    # Preserve creation/insertion order of live entities (not alpha-sorted).
    present = [
        eid for eid, ent in state.entities.items() if ent.get("status", "LIVE") == "LIVE"
    ]
    destroyed = list(state.destroyed_entities)

    return {
        "schema_version": "world-state/1.0",
        "world_id": state.world_id,
        "cycle": state.cycle,
        "sequence": state.sequence,
        "active_agents": active,
        "organizations": organizations,
        "entities_present": present,
        "destroyed_entities": destroyed,
        "last_event_digest": state.last_event_digest,
        "event_count": state.event_count,
        # RFC-0003 lineage fields required by Noema-Specs acceptance fixtures
        "world_version": state.world_version,
        "status": "ACTIVE",
        "catalog_version": state.catalog_version,
        "state_revision": int(state.sequence),
        "canonicalization_version": "noema-jcs/1",
        "hash_algorithm": "sha256",
    }
