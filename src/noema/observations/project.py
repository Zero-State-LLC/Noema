"""Permissioned observation projections (never mutate world)."""

from __future__ import annotations

from typing import Any

from noema.world.state import WorldState


def project_agent_observation(state: WorldState, agent_id: str) -> dict[str, Any]:
    agent = state.active_agents.get(agent_id)
    if not agent:
        return {
            "agent_id": agent_id,
            "status": "NOT_IN_WORLD",
            "LOCATION": None,
            "STATUS": {},
            "VISIBLE_EVENTS": [],
            "AVAILABLE_ACTIONS": ["ENTER_WORLD"],
            "MESSAGES": [],
        }
    room_id = agent["room_id"]
    room = state.rooms[room_id]
    visible_entities = []
    for eid in room.get("entity_ids") or []:
        if eid == agent_id:
            continue
        ent = state.entities.get(eid)
        if ent and ent.get("status", "LIVE") == "LIVE":
            visible_entities.append(
                {
                    "entity_id": eid,
                    "entity_type": ent.get("entity_type"),
                    "label": (ent.get("properties") or {}).get("label") or eid,
                }
            )
        elif eid in state.active_agents:
            visible_entities.append({"entity_id": eid, "entity_type": "AGENT"})

    exits = [
        {"exit_id": e["exit_id"], "to_room_id": e["to_room_id"]}
        for e in state.exits.values()
        if e.get("from_room_id") == room_id
    ]
    messages = [
        {
            "message_id": m["message_id"],
            "sender_id": m["sender_id"],
            "text": m["text"],
            "status": m["status"],
        }
        for m in state.messages.values()
        if m.get("recipient_id") == agent_id and m.get("status") == "DELIVERED"
    ]
    return {
        "agent_id": agent_id,
        "world_id": state.world_id,
        "cycle": state.cycle,
        "sequence": state.sequence,
        "LOCATION": {
            "room_id": room_id,
            "name": room.get("name"),
            "description": room.get("description"),
            "exits": exits,
            "entities": visible_entities,
        },
        "STATUS": {
            "budgets": dict(agent.get("budgets") or {}),
            "wait_until": agent.get("wait_until"),
        },
        "VISIBLE_EVENTS": [],
        "AVAILABLE_ACTIONS": [
            "LOOK",
            "MOVE",
            "INSPECT",
            "MESSAGE",
            "WAIT",
            "HARVEST",
            "REPAIR",
            "TRADE_PROPOSE",
            "ORG_CREATE",
            "LEAVE_WORLD",
        ],
        "MESSAGES": messages,
    }


def project_spectator_live(state: WorldState, *, limit: int = 20) -> dict[str, Any]:
    """WATCH-safe public projection — no research metadata."""
    orgs = [
        {"org_id": oid, "name": o.get("name"), "status": o.get("status"), "member_count": len(o.get("members") or [])}
        for oid, o in state.organizations.items()
        if o.get("status") == "ACTIVE"
    ]
    agents = [
        {"agent_id": aid, "room_id": a.get("room_id")}
        for aid, a in state.active_agents.items()
    ]
    rooms = [
        {"room_id": rid, "name": r.get("name"), "entity_count": len(r.get("entity_ids") or [])}
        for rid, r in list(state.rooms.items())[:limit]
    ]
    return {
        "surface": "LIVE",
        "world_id": state.world_id,
        "cycle": state.cycle,
        "sequence": state.sequence,
        "ledger_head": state.last_event_digest,
        "agents": agents,
        "organizations": orgs,
        "rooms": rooms,
        "read_only": True,
    }
