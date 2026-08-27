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



class RoomsBundle:
    """Bundle for room-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def rooms(self) -> dict[str, dict[str, Any]]:
        return self._state.rooms
    
    @property
    def exits(self) -> dict[str, dict[str, Any]]:
        return self._state.exits

    def link_entity(self, room_id: str, entity_or_agent_id: str) -> None:
        """High-value mutation helper: link an entity/agent into a room's entity_ids list."""
        room = self._state.rooms[room_id]
        ids = list(room.get("entity_ids") or [])
        if entity_or_agent_id not in ids:
            ids.append(entity_or_agent_id)
            room["entity_ids"] = ids

    def unlink_entity(self, room_id: str, entity_or_agent_id: str) -> None:
        """High-value mutation helper: remove from room's entity_ids."""
        room = self._state.rooms[room_id]
        ids = [x for x in (room.get("entity_ids") or []) if x != entity_or_agent_id]
        room["entity_ids"] = ids
    
    def room_entity_ids(self, room_id: str) -> list[str]:
        room = self._state.rooms[room_id]
        return list(room.get('entity_ids') or [])


class EntitiesBundle:
    """Bundle for entity-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def entities(self) -> dict[str, dict[str, Any]]:
        return self._state.entities
    
    def entity_ids(self) -> list[str]:
        return list(self._state.entities.keys())

    def create(self, entity_id: str, data: dict[str, Any]) -> None:
        """High-value mutation helper: create a new entity."""
        self._state.entities[entity_id] = data

    def remove(self, entity_id: str) -> None:
        """High-value mutation helper: remove an entity (caller manages destroyed list)."""
        self._state.entities.pop(entity_id, None)


class OrganizationsBundle:
    """Bundle for organization-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def organizations(self) -> dict[str, dict[str, Any]]:
        return self._state.organizations
    
    def organization_member_ids(self, org_id: str) -> list[str]:
        org = self._state.organizations[org_id]
        return [m['agent_id'] for m in org.get('members', [])]

    def create(self, org_id: str, data: dict[str, Any]) -> None:
        """High-value mutation helper: create a new organization."""
        self._state.organizations[org_id] = data

    def add_member(self, org_id: str, agent_id: str, role: str) -> None:
        """High-value mutation helper: add member to org."""
        org = self._state.organizations[org_id]
        existing = {m["agent_id"] for m in org.get("members", [])}
        if agent_id not in existing:
            org.setdefault("members", []).append({"agent_id": agent_id, "role": role})

    def remove_member(self, org_id: str, agent_id: str) -> None:
        """High-value mutation helper: remove member from org."""
        org = self._state.organizations[org_id]
        org["members"] = [m for m in org.get("members", []) if m["agent_id"] != agent_id]


class MessagesBundle:
    """Bundle for message-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def messages(self) -> dict:
        return self._state.messages


class TradesBundle:
    """Bundle for trade-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def trades(self) -> dict[str, dict[str, Any]]:
        return self._state.trades


# Core entity — the stable, minimal WorldState interface (v3.2.1)
# Contains only the fields that must remain unchanged across all implementations.
_core_entity_fields = ['world_id', 'world_version', 'seed', 'catalog_version', 'cycle', 'sequence']


def get_core_entity(state: 'WorldState') -> dict[str, Any]:
    """Extract the core 6-field entity from WorldState (v3.2.1)."""
    return {
        'world_id': state.world_id,
        'world_version': state.world_version,
        'seed': state.seed,
        'catalog_version': state.catalog_version,
        'cycle': state.cycle,
        'sequence': state.sequence,
    }


# Updated acceptance projection (v3.2.1)
# Delegates to state_bundles + core_entity (no longer a flat 36-field shape).
def acceptance_projection(state: 'WorldState') -> dict[str, Any]:
    """Project state into the v0.1 acceptance comparison shape (v3.2.1).

    Delegates to state_bundles for organizations and entities, and get_core_entity
    for the stable 6-field core. This is the deepened form of the module.
    """
    core = get_core_entity(state)
    org_bundle = OrganizationsBundle(state)
    ent_bundle = EntitiesBundle(state)

    active = {}
    for agent_id, agent in state.active_agents.items():
        budgets = {
            k: int(agent['budgets'][k])
            for k in ('attention', 'compute', 'energy', 'influence', 'storage')
            if k in agent['budgets']
        }
        active[agent_id] = {
            'room_id': agent['room_id'],
            'budgets': budgets,
        }

    # via OrganizationsBundle
    organizations = {}
    for org_id, org in org_bundle.organizations.items():
        members = [{'agent_id': m['agent_id'], 'role': m['role']} for m in org.get('members', [])]
        organizations[org_id] = {
            'name': org.get('name', ''),
            'status': org.get('status', ''),
            'members': members,
        }

    # via EntitiesBundle
    present = [
        eid for eid, ent in ent_bundle.entities.items() 
        if ent.get('status', 'LIVE') == 'LIVE'
    ]
    destroyed = list(getattr(state, 'destroyed_entities', []))

    return {
        'schema_version': 'world-state/1.0',
        'world_id': core['world_id'],
        'cycle': core['cycle'],
        'sequence': core['sequence'],
        'active_agents': active,
        'organizations': organizations,
        'entities_present': present,
        'destroyed_entities': destroyed,
        'last_event_digest': getattr(state, 'last_event_digest', None),
        'event_count': getattr(state, 'event_count', 0),
        'world_version': core['world_version'],
        'status': 'ACTIVE',
        'catalog_version': core['catalog_version'],
        'state_revision': int(core['sequence']),
        'canonicalization_version': 'noema-jcs/1',
        'hash_algorithm': 'sha256',
    }
