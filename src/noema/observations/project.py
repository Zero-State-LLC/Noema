"""Permissioned observation projections (never mutate world)."""

from __future__ import annotations

from typing import Any

from noema.world.state import WorldState, RoomsBundle, OrganizationsBundle, SituationsBundle


def project_agent_observation(state: WorldState, agent_id: str) -> dict[str, Any]:
    """Agent observation projection feeding harness NoemaState.

    Deepened via bundle_seams (RoomsBundle, MessagesBundle) for harness paths.
    Increases depth, locality (projection logic uses narrow interfaces),
    and leverage (bundles evolve without breaking harness observations).
    """
    from noema.world.state import RoomsBundle, MessagesBundle
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
    room_bundle = RoomsBundle(state)
    room = room_bundle.room(room_id) or {}
    visible_entities = room_bundle.visible_entities(room_id, exclude_agent_id=agent_id)
    exits = room_bundle.exits_from(room_id)

    msg_bundle = MessagesBundle(state)
    messages = msg_bundle.messages_for(agent_id, status="DELIVERED")

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
    """WATCH-safe public projection — no research metadata.

    v3.2.1: Uses state_bundles for rooms and organizations.
    Deepens the spectator projection module by going through the bundle interfaces
    rather than direct state fields (locality: bundle concerns are isolated;
    leverage: bundles can evolve independently of the projection).
    """
    room_bundle = RoomsBundle(state)
    org_bundle = OrganizationsBundle(state)

    orgs = [
        {"org_id": oid, "name": o.get("name"), "status": o.get("status"), "member_count": len(o.get("members") or [])}
        for oid, o in org_bundle.organizations.items()
        if o.get("status") == "ACTIVE"
    ]
    # Use bundle where possible; keep light direct for public snapshot (harness paths benefit upstream)
    room_bundle = RoomsBundle(state)
    agents = [
        {"agent_id": aid, "room_id": a.get("room_id")}
        for aid, a in state.active_agents.items()
    ]
    rooms = [
        {"room_id": rid, "name": r.get("name"), "entity_count": len(r.get("entity_ids") or [])}
        for rid, r in list(room_bundle.rooms.items())[:limit]
    ]
    # Public situations: existence/pressure only
    public_situations = []
    sit_bundle = SituationsBundle(state)
    for sit in sit_bundle.get_public_situations():
        public_situations.append(sit)

    # Gate B (phase2 wiring): forward reconstruction_fidelity + controllers from state reconstructions
    # (matches TS watchSnapshot/buildWatchLive contract; fail-closed defaults)
    recs = getattr(state, "reconstructions", {}) or {}
    rec_list = []
    if isinstance(recs, dict):
        for r in recs.values():
            if isinstance(r, dict):
                rec_list.append({
                    "fidelity": r.get("fidelity", 0),
                    "visibility": r.get("visibility", "PUBLIC"),
                    "controllers": r.get("controllers", 1),
                })
            else:
                rec_list.append({"fidelity": getattr(r, "fidelity", 0), "visibility": getattr(r, "visibility", "PUBLIC"), "controllers": getattr(r, "controllers", 1)})
    public_fids = [r["fidelity"] for r in rec_list if str(r.get("visibility", "")).upper() == "PUBLIC"] or [0]
    reconstruction_fidelity = sum(public_fids) / len(public_fids)
    controllers = max((r.get("controllers", 1) for r in rec_list), default=1)

    return {
        "surface": "LIVE",
        "world_id": state.world_id,
        "cycle": state.cycle,
        "sequence": state.sequence,
        "ledger_head": state.last_event_digest,
        "agents": agents,
        "organizations": orgs,
        "rooms": rooms,
        "world_pressures": public_situations,
        "read_only": True,
        # Gate B fidelity fields for public WATCH projection
        "reconstruction_fidelity": reconstruction_fidelity,
        "controllers": controllers,
        "reconstructions": rec_list,
    }

