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

    def to_serializable_dict(self) -> dict[str, Any]:
        """Narrow seam for persistence module: full state for snapshot/rehydrate.
        Delegates grouped sections through bundles (depth, locality, leverage for persistence).
        """
        room_b = RoomsBundle(self)
        ent_b = EntitiesBundle(self)
        org_b = OrganizationsBundle(self)
        msg_b = MessagesBundle(self)
        trade_b = TradesBundle(self)
        return {
            "world_id": self.world_id,
            "world_version": self.world_version,
            "seed": self.seed,
            "catalog_version": self.catalog_version,
            "cycle": self.cycle,
            "sequence": self.sequence,
            "budget_defaults": self.budget_defaults,
            "rooms": dict(room_b.rooms),
            "exits": dict(self.exits),
            "entities": dict(ent_b.entities),
            "registered_agents": dict(self.registered_agents),
            "active_agents": dict(self.active_agents),
            "organizations": dict(org_b.organizations),
            "messages": dict(msg_b.messages),
            "trades": dict(trade_b.trades),
            "pending_observations": dict(self.pending_observations),
            "observation_digests": dict(self.observation_digests),
            "destroyed_entities": list(self.destroyed_entities),
            "situations": dict(self.situations),
            "last_event_digest": self.last_event_digest,
            "event_count": self.event_count,
        }


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

    def room(self, room_id: str) -> dict[str, Any] | None:
        """Narrow seam for router: safe lookup of a room by id."""
        return self._state.rooms.get(room_id)

    def first_room_id(self) -> str | None:
        """Narrow seam for router: default/first room id."""
        if not self._state.rooms:
            return None
        return next(iter(self._state.rooms.keys()))

    def exit(self, exit_id: str) -> dict[str, Any] | None:
        """Narrow seam for router: safe lookup of an exit by id."""
        return self._state.exits.get(exit_id)

    def room_id_for_agent(self, agent_id: str) -> str | None:
        """Narrow seam: find which room an active agent is in (via entity_ids)."""
        for rid, room in self._state.rooms.items():
            ids = room.get("entity_ids") or []
            if agent_id in ids:
                return rid
        return None

    def move_agent(self, from_room_id: str, to_room_id: str, agent_id: str) -> None:
        """Narrow seam for reduce module: atomic room move (unlink + link).
        Increases locality (move logic in bundle) and leverage (single call for MOVE reducer)."""
        self.unlink_entity(from_room_id, agent_id)
        self.link_entity(to_room_id, agent_id)

    # Seams for harness observation/projection paths (agent observation, visible entities)
    def visible_entities(self, room_id: str, exclude_agent_id: str | None = None) -> list[dict[str, Any]]:
        """Narrow seam: entities visible in room (for agent observations / harness NoemaState)."""
        room = self._state.rooms.get(room_id) or {}
        out = []
        for eid in room.get("entity_ids") or []:
            if exclude_agent_id and eid == exclude_agent_id:
                continue
            ent = self._state.entities.get(eid)
            if ent and ent.get("status", "LIVE") == "LIVE":
                out.append({
                    "entity_id": eid,
                    "entity_type": ent.get("entity_type"),
                    "label": (ent.get("properties") or {}).get("label") or eid,
                })
            elif eid in self._state.active_agents:
                out.append({"entity_id": eid, "entity_type": "AGENT"})
        return out

    def exits_from(self, room_id: str) -> list[dict[str, Any]]:
        """Narrow seam: exits leaving a room (for LOCATION in agent observations)."""
        return [
            {"exit_id": e["exit_id"], "to_room_id": e["to_room_id"]}
            for e in self._state.exits.values()
            if e.get("from_room_id") == room_id
        ]


class EntitiesBundle:
    """Bundle for entity-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def entities(self) -> dict[str, dict[str, Any]]:
        return self._state.entities
    
    def entity_ids(self) -> list[str]:
        return list(self._state.entities.keys())

    def entity(self, entity_id: str) -> dict[str, Any] | None:
        """Narrow seam for router: safe lookup of an entity by id."""
        return self._state.entities.get(entity_id)

    def create(self, entity_id: str, data: dict[str, Any]) -> None:
        """High-value mutation helper: create a new entity."""
        self._state.entities[entity_id] = data

    def remove(self, entity_id: str) -> None:
        """High-value mutation helper: remove an entity (caller manages destroyed list)."""
        self._state.entities.pop(entity_id, None)

    # Additional seams for reduce module ENTITY_* reducers (create with room link, update)
    # Deepens the reduce module: mutations now go through bundle interface for locality + leverage.

    def create_and_link(self, entity_id: str, entity: dict[str, Any], room_id: str | None = None) -> None:
        """Narrow seam for reduce: create entity + optional room link."""
        self._state.entities[entity_id] = dict(entity)
        if room_id and room_id in self._state.rooms:
            ids = list(self._state.rooms[room_id].get("entity_ids") or [])
            if entity_id not in ids:
                ids.append(entity_id)
            self._state.rooms[room_id]["entity_ids"] = ids

    def update_entity(self, entity_id: str, set_map: dict[str, Any] | None = None, unset_list: list[str] | None = None) -> None:
        """Narrow seam for reduce: apply updates to entity state/properties."""
        if entity_id not in self._state.entities:
            return
        ent = self._state.entities[entity_id]
        for k, v in (set_map or {}).items():
            if "." in k:
                parts = k.split(".")
                cur = ent
                for p in parts[:-1]:
                    cur = cur.setdefault(p, {})
                cur[parts[-1]] = v
            else:
                ent[k] = v
        for k in (unset_list or []):
            ent.get("state", {}).pop(k, None)
            ent.get("properties", {}).pop(k, None)

    def destroy_entity(self, entity_id: str, reason: str | None = None, cycle: int | None = None) -> None:
        """Narrow seam for reduce: archive entity and clean room links."""
        if entity_id not in self._state.entities:
            return
        ent = self._state.entities[entity_id]
        ent["status"] = "ARCHIVED"
        if cycle is not None:
            ent["destroyed_cycle"] = cycle
        if reason:
            ent["destroy_reason"] = reason
        loc = ent.get("location")
        if isinstance(loc, dict) and loc.get("kind") == "ROOM":
            room_id = loc.get("room_id")
            if room_id in self._state.rooms:
                ids = [x for x in (self._state.rooms[room_id].get("entity_ids") or []) if x != entity_id]
                self._state.rooms[room_id]["entity_ids"] = ids
        if entity_id not in self._state.destroyed_entities:
            self._state.destroyed_entities.append(entity_id)



    def entity_or_raise(self, entity_id: str) -> dict[str, Any]:
        """Narrow seam: return entity or raise (reduce locality)."""
        if entity_id not in self._state.entities:
            raise KeyError(f"unknown entity {entity_id}")
        return self._state.entities[entity_id]

    def get_holder_resource_slot(self, holder_id: str, resource: str) -> tuple[dict[str, Any], str]:
        """Narrow seam for reduce holder logic."""
        if holder_id in self._state.active_agents:
            return self._state.active_agents[holder_id]["budgets"], ""
        ent = self.entity_or_raise(holder_id)
        if ent.get("status", "LIVE") != "LIVE":
            raise KeyError(f"holder inactive: {holder_id}")
        props = ent.get("properties") or {}
        state_bucket = ent.setdefault("state", {})
        if "resource" in props:
            if props.get("resource") != resource:
                raise KeyError("holder resource mismatch")
            if "available" not in state_bucket:
                raise KeyError("holder missing available")
            return state_bucket, "available"
        if resource not in state_bucket:
            raise KeyError(f"holder missing resource {resource}")
        return state_bucket, resource

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



class AgentsBundle:
    """Bundle for active/registered agent state (router deepening)."""

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    @property
    def active_agents(self) -> dict[str, dict[str, Any]]:
        return self._state.active_agents

    @property
    def registered_agents(self) -> dict[str, dict[str, Any]]:
        return self._state.registered_agents

    def active_agent(self, agent_id: str) -> dict[str, Any] | None:
        """Narrow seam for router: safe lookup of an active agent record."""
        return self._state.active_agents.get(agent_id)

    def registered_agent(self, agent_id: str) -> dict[str, Any] | None:
        """Narrow seam for router: safe lookup of a registered agent."""
        return self._state.registered_agents.get(agent_id)

    def agent_room_id(self, agent_id: str) -> str | None:
        """Narrow seam: room an active agent is in."""
        agent = self._state.active_agents.get(agent_id)
        if agent:
            return agent.get("room_id")
        return None

    def agent_budgets(self, agent_id: str) -> dict[str, float]:
        """Narrow seam: budgets for an active agent (copy for safety)."""
        agent = self._state.active_agents.get(agent_id) or {}
        return dict(agent.get("budgets") or {})

    def ensure_registered_agent(self, agent_id: str, display_name: str | None = None) -> dict[str, Any]:
        """Narrow seam for runtime: ensure agent exists in registered_agents.
        Returns the registered agent record (existing or newly created)."""
        if agent_id not in self._state.registered_agents:
            self._state.registered_agents[agent_id] = {
                "agent_id": agent_id,
                "display_name": display_name or agent_id,
            }
        return self._state.registered_agents[agent_id]

    def get_active_agent_or_raise(self, agent_id: str) -> dict[str, Any]:
        """Narrow seam: return active agent or raise (for reduce locality)."""
        if agent_id not in self._state.active_agents:
            raise KeyError(f"agent not active: {agent_id}")
        return self._state.active_agents[agent_id]

    # Mutation seams for reduce module deepening (Phase 1)
    # These provide narrow bundle_seam for the reduce module's hot mutation path,
    # increasing depth, locality (mutation logic concentrates in AgentsBundle),
    # and leverage (one interface for enter/leave/debit across many reducers).

    def enter_active_agent(self, agent_id: str, room_id: str, budgets: dict[str, float], manifest_id: str | None = None) -> None:
        """Narrow seam for reduce: enter agent into active_agents and link to room."""
        if agent_id in self._state.active_agents:
            return  # idempotent safety
        self._state.active_agents[agent_id] = {
            "agent_id": agent_id,
            "room_id": room_id,
            "budgets": {k: float(v) for k, v in budgets.items()},
            "manifest_id": manifest_id,
            "wait_until": None,
        }
        # delegate room link for locality
        RoomsBundle(self._state).link_entity(room_id, agent_id)

    def leave_active_agent(self, agent_id: str) -> None:
        """Narrow seam for reduce: remove from active_agents (room unlink done by caller or separately)."""
        self._state.active_agents.pop(agent_id, None)

    def debit_agent_budgets(self, agent_id: str, costs: dict[str, float]) -> None:
        """Narrow seam for reduce: debit budgets on active agent (in place)."""
        if agent_id not in self._state.active_agents:
            return
        budgets = self._state.active_agents[agent_id].setdefault("budgets", {})
        for resource, amount in costs.items():
            avail = float(budgets.get(resource, 0))
            budgets[resource] = avail - float(amount)

    def update_agent_room(self, agent_id: str, new_room_id: str) -> None:
        """Narrow seam for reduce: update agent's current room_id."""
        if agent_id in self._state.active_agents:
            self._state.active_agents[agent_id]["room_id"] = new_room_id

class MessagesBundle:
    """Bundle for message-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def messages(self) -> dict:
        return self._state.messages

    def add_message(self, message_id: str, msg: dict[str, Any]) -> None:
        """Narrow seam for reduce module: store a message (MESSAGE reducer)."""
        self._state.messages[message_id] = dict(msg)

    def messages_for(self, recipient_id: str, status: str = "DELIVERED") -> list[dict[str, Any]]:
        """Narrow seam for harness observation paths: delivered messages for an agent."""
        return [
            {
                "message_id": m["message_id"],
                "sender_id": m["sender_id"],
                "text": m["text"],
                "status": m["status"],
            }
            for m in self._state.messages.values()
            if m.get("recipient_id") == recipient_id and m.get("status") == status
        ]


class TradesBundle:
    """Bundle for trade-related state (v3.2.1)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def trades(self) -> dict[str, dict[str, Any]]:
        return self._state.trades

    # Mutation seam for reduce module (trade propose/accept paths)
    def propose_trade(self, trade_id: str, trade: dict[str, Any]) -> None:
        """Narrow seam: store a proposed trade."""
        self._state.trades[trade_id] = dict(trade)

class PendingObservationsBundle:
    """Bundle for pending observation state (reduce module deepening)."""
    
    def __init__(self, state: 'WorldState') -> None:
        self._state = state
    
    @property
    def pending_observations(self) -> dict[str, dict[str, Any]]:
        return self._state.pending_observations
    
    def add_pending(self, obs_id: str, obs: dict[str, Any]) -> None:
        """Narrow seam for reduce: add pending observation (LOOK/INSPECT etc)."""
        self._state.pending_observations[obs_id] = dict(obs)

    def get_pending(self, obs_id: str) -> dict[str, Any] | None:
        """Narrow seam for reduce: get pending observation."""
        return self._state.pending_observations.get(obs_id)



class SituationsBundle:
    """Light bundle for situations (reduce/runtime locality)."""

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def get_situation(self, sid: str) -> dict[str, Any] | None:
        """Narrow seam."""
        return (self._state.situations or {}).get(sid)

    def set_situation(self, sid: str, data: dict[str, Any]) -> None:
        """Narrow seam for reduce."""
        if self._state.situations is None:
            self._state.situations = {}
        self._state.situations[sid] = dict(data)

    def get_public_situations(self) -> list[dict[str, Any]]:
        """Narrow seam for public projections."""
        out = []
        for sid, sit in (self._state.situations or {}).items():
            out.append({
                "situation_id": sid,
                "status": sit.get("status"),
                "target_room_ids": list(sit.get("target_room_ids") or []),
            })
        return out

class ValidatorBundle:
    """Bundle for validation logic (budget, authorization, visibility).
    
    Extracts validation concerns from ActionRouter for depth, locality,
    and leverage — validators evolve independently of routing logic.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def check_budget(self, agent_id: str, costs: dict[str, float]) -> bool:
        """Check if agent has sufficient budgets for costs."""
        agent = self._state.active_agents.get(agent_id)
        if not agent:
            return False
        budgets = agent.get("budgets") or {}
        for resource, amount in costs.items():
            if float(budgets.get(resource, 0)) < float(amount):
                return False
        return True

    def check_authorization(self, principal_agent_id: str | None, action_agent_id: str) -> bool:
        """Check if principal is authorized to act for agent."""
        if principal_agent_id is None:
            return True  # no principal = unbounded
        return principal_agent_id == action_agent_id

    def check_visibility(self, agent_id: str, target_id: str) -> bool:
        """Check if agent can see target (same room or direct message)."""
        agent = self._state.active_agents.get(agent_id)
        if not agent:
            return False
        room_id = agent.get("room_id")
        if not room_id:
            return False
        room = self._state.rooms.get(room_id)
        if not room:
            return False
        entity_ids = room.get("entity_ids") or []
        return target_id in entity_ids or target_id in self._state.active_agents


class ActionBundle:
    """Bundle for action-to-event translation (router deepening).
    
    Coordinates action validation, event emission, and reducer dispatch
    through narrow seams — increasing depth and locality of the router.
    """

    def __init__(self, state: 'WorldState', world_id: str) -> None:
        self._state = state
        self._world_id = world_id

    def route_to_reducer(self, verb: str) -> str:
        """Map verb to reducer event type."""
        verb_map = {
            "ENTER_WORLD": "AGENT_ENTERED_WORLD",
            "LEAVE_WORLD": "AGENT_LEFT_WORLD",
            "LOOK": "LOOK",
            "MOVE": "MOVE",
            "INSPECT": "INSPECT",
            "MESSAGE": "MESSAGE",
            "WAIT": "WAIT",
            "ORG_CREATE": "ORG_CREATE",
            "HARVEST": "RESOURCE_TRANSFER",
            "REPAIR": "BUDGET_CONSUMED",  # + ENTITY_UPDATE
            "TRADE_PROPOSE": "TRADE_PROPOSED",
            "TRADE_ACCEPT": "TRADE_ACCEPTED",
            "TRADE_REJECT": "TRADE_REJECTED",
        }
        return verb_map.get(verb, verb)

    def build_event_payload(self, verb: str, agent_id: str, params: dict[str, Any],
                            bundles: dict[str, Any]) -> dict[str, Any]:
        """Build event payload for verb using bundle seams."""
        agents = bundles.get("agents", AgentsBundle(self._state))
        rooms = bundles.get("rooms", RoomsBundle(self._state))
        entities = bundles.get("entities", EntitiesBundle(self._state))
        
        if verb == "ENTER_WORLD":
            room_id = params.get("room_id") or rooms.first_room_id()
            budgets = params.get("budgets") or dict(self._state.budget_defaults)
            reg = agents.registered_agent(agent_id) or {"agent_id": agent_id}
            return {
                "agent_id": agent_id,
                "room_id": room_id,
                "budgets": budgets,
                "manifest_id": reg.get("manifest_id") or f"manifest.{agent_id}",
            }
        elif verb == "LEAVE_WORLD":
            agent = agents.active_agent(agent_id)
            return {
                "agent_id": agent_id,
                "room_id": agent["room_id"] if agent else None,
                "reason": params.get("reason") or "LEFT",
            }
        elif verb == "LOOK":
            agent = agents.active_agent(agent_id)
            room_id = agent["room_id"] if agent else None
            obs_id = params.get("observation_id") or f"obs.{params.get('action_id', 'unknown')}"
            spend = float(params.get("attention_spent", 1))
            return {
                "agent_id": agent_id,
                "room_id": room_id,
                "attention_spent": spend,
                "observation_id": obs_id,
            }
        elif verb == "MOVE":
            agent = agents.active_agent(agent_id)
            exit_id = params.get("exit_id")
            exit_rec = rooms.exit(exit_id) if exit_id else None
            cost = params.get("cost_paid") or {"energy": 1}
            return {
                "agent_id": agent_id,
                "from_room_id": agent["room_id"] if agent else None,
                "to_room_id": exit_rec["to_room_id"] if exit_rec else None,
                "exit_id": exit_id,
                "cost_paid": cost,
            }
        elif verb == "INSPECT":
            agent = agents.active_agent(agent_id)
            entity_id = params.get("entity_id") or params.get("target")
            obs_id = params.get("observation_id") or f"obs.{params.get('action_id', 'unknown')}"
            spend = float(params.get("attention_spent", 1))
            return {
                "agent_id": agent_id,
                "room_id": agent["room_id"] if agent else None,
                "entity_id": entity_id,
                "attention_spent": spend,
                "observation_id": obs_id,
            }
        elif verb == "MESSAGE":
            recipient = params.get("recipient_id")
            text = params.get("text") or ""
            msg_id = params.get("message_id") or f"msg.{params.get('action_id', 'unknown')}"
            cost = params.get("cost_paid") or {"attention": 1}
            return {
                "message_id": msg_id,
                "sender_id": agent_id,
                "recipient_id": recipient,
                "text": text,
                "cost_paid": cost,
            }
        elif verb == "WAIT":
            cycles = int(params.get("cycles") or 1)
            return {"agent_id": agent_id, "cycles": cycles}
        elif verb == "ORG_CREATE":
            org_id = params.get("org_id") or f"org.{params.get('action_id', 'unknown')}"
            name = params.get("name") or "Unnamed Org"
            charter = params.get("charter") or ""
            members = params.get("initial_members") or [{"agent_id": agent_id, "role": "founder"}]
            return {
                "org_id": org_id,
                "name": name,
                "charter": charter,
                "creator_id": agent_id,
                "initial_members": members,
            }
        elif verb == "HARVEST":
            entity_id = params.get("entity_id")
            resource = params.get("resource") or "energy"
            amount = float(params.get("amount") or 1)
            return {
                "from_id": entity_id,
                "to_id": agent_id,
                "resource": resource,
                "amount": amount,
            }
        elif verb == "REPAIR":
            entity_id = params.get("entity_id")
            cost = params.get("cost_paid") or {"energy": 1}
            return {
                "entity_id": entity_id,
                "cost_paid": cost,
                "repair_amount": params.get("repair_amount", 5),
            }
        elif verb == "TRADE_PROPOSE":
            return {
                "trade_id": params.get("trade_id") or f"trade.{params.get('action_id', 'unknown')}",
                "proposer_id": agent_id,
                "counterparty_id": params.get("counterparty_id"),
                "offered": params.get("offered") or {},
                "requested": params.get("requested") or {},
                "expires_cycle": params.get("expires_cycle"),
            }
        elif verb == "TRADE_ACCEPT":
            return {"trade_id": params.get("trade_id"), "accepted_by": agent_id}
        elif verb == "TRADE_REJECT":
            return {
                "trade_id": params.get("trade_id"),
                "rejected_by": agent_id,
                "reason": params.get("reason") or "REJECTED",
            }
        return {}


class ContextBundle:
    """Bundle for LLM context slicing (frontier deepening).
    
    Extracts context assembly from harness/LLM adapter for depth, locality,
    and leverage — context slices evolve independently of callers.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def slice_for_agent(self, agent_id: str, budget_tokens: int = 4000) -> dict[str, Any]:
        """Canonical context slice for a specific agent (LLM proposer)."""
        agent = self._state.active_agents.get(agent_id)
        if not agent:
            return {"canonical": {"available_actions": ["ENTER_WORLD"]}, "system": {}, "world_text": []}
        
        room_bundle = RoomsBundle(self._state)
        room = room_bundle.room(agent["room_id"]) or {}
        visible = room_bundle.visible_entities(agent["room_id"], exclude_agent_id=agent_id)
        exits = room_bundle.exits_from(agent["room_id"])
        
        msg_bundle = MessagesBundle(self._state)
        messages = msg_bundle.messages_for(agent_id, status="DELIVERED")
        
        return {
            "canonical": {
                "world_id": self._state.world_id,
                "cycle": self._state.cycle,
                "sequence": self._state.sequence,
                "agent_id": agent_id,
                "location": {
                    "room_id": agent["room_id"],
                    "name": room.get("name"),
                    "description": room.get("description"),
                    "exits": exits,
                    "entities": visible,
                },
                "resources": dict(agent.get("budgets") or {}),
                "available_actions": [
                    "LOOK", "MOVE", "INSPECT", "MESSAGE", "WAIT",
                    "HARVEST", "REPAIR", "TRADE_PROPOSE", "ORG_CREATE", "LEAVE_WORLD",
                ],
                "affordances": [],  # populated by caller if needed
                "reputation_summary": {"self_image": 4, "self_second_order": 2},
                "active_norms": {},
            },
            "system": {"prompt_version": "sealed-s0"},
            "world_text": [],  # populated by caller from observatory
        }

    def slice_for_spectator(self, limit: int = 20) -> dict[str, Any]:
        """Public spectator context slice."""
        return project_spectator_live(self._state, limit=limit)


class PromptBundle:
    """Bundle for prompt assembly (frontier deepening).
    
    Isolates prompt construction from LLM callers for testability
    and evolution — prompts version independently of context.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def build_system_prompt(self) -> str:
        """Build the sealed system prompt (currently from file)."""
        # This mirrors harness/seal.py sealed_prompt_text()
        # In production, this could be versioned/configurable
        return SEALED_PROMPT_S0

    def build_action_prompt(self, context_slice: dict[str, Any]) -> str:
        """Build the user prompt from context slice."""
        import json
        canonical = context_slice.get("canonical") or {}
        world_text = context_slice.get("world_text") or []
        return json.dumps({
            "canonical": canonical,
            "world_text": world_text,
        }, default=str)[:8000]

    def build_observation_prompt(self, observation: dict[str, Any]) -> str:
        """Build prompt for observation feedback."""
        import json
        return json.dumps(observation, default=str)


# Sealed prompt constant (mirrors harness/seal.py)
SEALED_PROMPT_S0 = """You are an agent in a persistent world. You receive a canonical context slice describing your situation. You must respond with a valid JSON proposal object.

VALID ACTIONS: LOOK, MOVE, INSPECT, WAIT, MESSAGE, TRADE_PROPOSE, HARVEST, REPAIR, ORG_CREATE, LEAVE_WORLD, ENTER_WORLD

PROPOSAL FORMAT:
{
  "action": "ACTION_NAME",
  "target_id": "optional_entity_or_agent_id",
  "arguments": { "param": "value" }
}

RULES:
- Never include private cognition fields (plan, thought, reasoning, etc.)
- Only use actions from available_actions in canonical context
- target_id must reference a visible entity or agent
- arguments must match the action's expected parameters

Respond ONLY with the proposal JSON object."""


class ModuleBundle:
    """Bundle for module discovery, validation, and instantiation (catalog deepening).
    
    Replaces direct ModuleRegistry/catalog calls with narrow seams for depth
    and leverage — modules evolve independently of runtime consumers.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def discover_modules(self, category: str | None = None) -> list[dict[str, Any]]:
        """Discover available modules, optionally filtered by category."""
        # Placeholder — in production this queries the catalog
        return []

    def validate_module(self, module_id: str) -> tuple[bool, str | None]:
        """Validate a module ID exists and is compatible."""
        # Placeholder — in production this checks against catalog
        return True, None

    def instantiate_module(self, module_id: str, config: dict[str, Any] | None = None) -> Any:
        """Instantiate a module by ID with optional config."""
        # Placeholder — in production this loads and constructs the module
        return None


class CatalogBundle:
    """Bundle for catalog access (genesis profiles, story seeds, compiler catalogs).
    
    Isolates catalog loading and validation from callers for locality
    and testability — catalogs version independently of runtime.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def get_genesis_profiles(self) -> list[dict[str, Any]]:
        """Get available genesis profiles."""
        from noema.research.genesis.engine import profile_catalog
        return profile_catalog().get("profiles") or []

    def get_story_seeds(self) -> list[str]:
        """Get canonical story seed IDs."""
        from noema.research.genesis.engine import STORY_SEEDS
        return list(STORY_SEEDS)

    def validate_genesis_profile(self, profile_id: str) -> dict[str, Any] | None:
        """Validate and return genesis profile by ID."""
        from noema.research.genesis.engine import validate_profile_id
        try:
            return validate_profile_id(profile_id)
        except Exception:
            return None

    def validate_story_seeds(self, seeds: list[str]) -> list[str]:
        """Validate story seed IDs."""
        from noema.research.genesis.engine import validate_story_seeds
        return validate_story_seeds(seeds)

    def get_compiler_catalog(self) -> dict[str, Any]:
        """Get compiler reason catalog."""
        from noema.research.compiler.catalog import reason_catalog
        return reason_catalog()

    def get_observatory_catalogs(self) -> dict[str, Any]:
        """Get observatory feature and detector catalogs."""
        from noema.research.observatory.catalog import feature_catalog, detector_catalog
        return {"features": feature_catalog(), "detectors": detector_catalog()}


class EvidenceBundle:
    """Bundle for evidence packing and resume registry (evidence deepening).
    
    Isolates evidence construction from callers for depth and leverage —
    evidence schemas evolve independently of runtime consumers.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def pack_evidence(self, event: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Pack an event into canonical evidence format."""
        from noema.world.digest import sha256_digest
        return {
            "schema_version": "evidence/1.0",
            "event": event,
            "context": context or {},
            "digest": sha256_digest(event),
        }

    def unpack_evidence(self, evidence: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
        """Unpack evidence into event + context."""
        return evidence.get("event", {}), evidence.get("context", {})

    def register_resume(self, resume_id: str, payload: dict[str, Any]) -> None:
        """Register a resume artifact (placeholder for ResumeRegistry integration)."""
        # In production this would delegate to ResumeRegistry
        pass

    def get_resume(self, resume_id: str) -> dict[str, Any] | None:
        """Retrieve a resume artifact."""
        return None


class TelemetryBundle:
    """Bundle for structured telemetry emission (observability deepening).
    
    Provides narrow seam for event emission — telemetry backends
    evolve independently of emitters.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def emit(self, event_type: str, payload: dict[str, Any], *, level: str = "info") -> None:
        """Emit a telemetry event."""
        # Placeholder — in production this routes to OpenTelemetry, log aggregation, etc.
        pass

    def span(self, name: str, attributes: dict[str, Any] | None = None) -> Any:
        """Start a tracing span (returns context manager)."""
        # Placeholder — in production this returns an OpenTelemetry span
        class NoopSpan:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def set_attribute(self, key: str, value: Any): pass
        return NoopSpan()

    def record_metric(self, name: str, value: float, attributes: dict[str, Any] | None = None) -> None:
        """Record a metric."""
        pass


class ScenarioBundle:
    """Bundle for declarative test fixtures (harness deepening).
    
    Replaces raw state construction in tests with composable scenarios —
    test fixtures evolve independently of WorldState internals.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def empty_world(self, world_id: str = "test.world") -> 'WorldState':
        """Create an empty world for testing."""
        from noema.world.state import load_seed
        from pathlib import Path
        seed = Path(__file__).resolve().parents[4] / "fixtures" / "v01-seed" / "world-seed.json"
        state = load_seed(seed)
        state.world_id = world_id
        state.cycle = 0
        return state

    def world_with_agent(self, world_id: str, agent_id: str, room_id: str | None = None) -> 'WorldState':
        """Create a world with one registered agent."""
        state = self.empty_world(world_id)
        agents = AgentsBundle(state)
        agents.ensure_registered_agent(agent_id, "Test Agent")
        if room_id:
            agents.enter_active_agent(agent_id, room_id, {"energy": 100}, "test.manifest")
        return state

    def world_with_situation(self, world_id: str, situation_id: str, data: dict[str, Any]) -> 'WorldState':
        """Create a world with a specific situation."""
        state = self.empty_world(world_id)
        situations = SituationsBundle(state)
        situations.set_situation(situation_id, data)
        return state


class CompileBundle:
    """Bundle for compiler stage isolation (compiler deepening).
    
    Isolates parse → validate → lower → emit stages for testability
    and parallel evolution of compiler passes.
    """

    def __init__(self, state: 'WorldState') -> None:
        self._state = state

    def parse(self, source: str) -> dict[str, Any]:
        """Parse source into AST."""
        # Placeholder — delegates to compiler parser
        return {"ast": source}

    def validate(self, ast: dict[str, Any]) -> tuple[bool, list[str]]:
        """Validate AST against catalog rules."""
        return True, []

    def lower(self, ast: dict[str, Any]) -> dict[str, Any]:
        """Lower AST to intermediate representation."""
        return {"ir": ast}

    def emit(self, ir: dict[str, Any]) -> dict[str, Any]:
        """Emit final artifact from IR."""
        return {"artifact": ir}


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
    def get_pending(self, obs_id: str) -> dict[str, Any] | None:
        """Narrow seam."""
        return self._state.pending_observations.get(obs_id)

    def remove_pending(self, obs_id: str) -> None:
        """Narrow seam."""
        self._state.pending_observations.pop(obs_id, None)
