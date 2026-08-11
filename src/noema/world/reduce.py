"""Pure reducers for the closed v0.1 event catalog."""

from __future__ import annotations

from typing import Any, Callable

from noema.world.state import WorldState


class ReduceError(Exception):
    """Deterministic reducer rejection."""


Reducer = Callable[[WorldState, dict[str, Any]], WorldState]


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise ReduceError(msg)


def _agent(state: WorldState, agent_id: str) -> dict[str, Any]:
    _require(agent_id in state.active_agents, f"agent not active: {agent_id}")
    return state.active_agents[agent_id]


def _holder_resource_slot(state: WorldState, holder_id: str, resource: str) -> tuple[dict[str, Any], str]:
    """Return the mutable balance bucket and key for a holder.

    Holders can be active agents or live entities. Agents use ``budgets`` with
    per-resource keys. Entities store a resource bucket in ``state`` and often
    use ``available`` for the active amount.
    """

    if holder_id in state.active_agents:
        return state.active_agents[holder_id]["budgets"], ""

    ent = state.entities.get(holder_id)
    _require(ent is not None, f"holder missing: {holder_id}")
    _require(ent.get("status", "LIVE") == "LIVE", f"holder inactive: {holder_id}")

    props = ent.get("properties") or {}
    state_bucket = ent.setdefault("state", {})

    # Most entities in v0.1 use a single ``available`` slot, constrained by
    # a declared resource kind in properties.
    if "resource" in props:
        _require(props.get("resource") == resource, f"holder resource mismatch: {holder_id}")
        _require("available" in state_bucket, f"holder missing available: {holder_id}")
        return state_bucket, "available"

    # Fall back to a direct resource key for other entity shapes.
    _require(resource in state_bucket, f"holder missing resource {resource}: {holder_id}")
    return state_bucket, resource


def _debit(budgets: dict[str, float], costs: dict[str, float]) -> None:
    for resource, amount in costs.items():
        avail = float(budgets.get(resource, 0))
        _require(amount >= 0, f"negative cost for {resource}")
        _require(avail >= amount, f"insufficient {resource}: need {amount} have {avail}")
        budgets[resource] = avail - amount


def _set_nested(target: dict[str, Any], dotted: str, value: Any) -> None:
    parts = dotted.split(".")
    cur: dict[str, Any] = target
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            cur[part] = nxt
        cur = nxt
    cur[parts[-1]] = value


def _unset_nested(target: dict[str, Any], dotted: str) -> None:
    parts = dotted.split(".")
    cur: dict[str, Any] = target
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            return
        cur = nxt
    cur.pop(parts[-1], None)


def reduce_AGENT_ENTERED_WORLD(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent_id = p["agent_id"]
    room_id = p["room_id"]
    _require(agent_id in state.registered_agents, f"unknown agent {agent_id}")
    _require(agent_id not in state.active_agents, f"already active {agent_id}")
    _require(room_id in state.rooms, f"unknown room {room_id}")
    budgets = {k: float(v) for k, v in p["budgets"].items()}
    state.active_agents[agent_id] = {
        "agent_id": agent_id,
        "room_id": room_id,
        "budgets": budgets,
        "manifest_id": p.get("manifest_id"),
        "wait_until": None,
    }
    room = state.rooms[room_id]
    ids = list(room.get("entity_ids") or [])
    if agent_id not in ids:
        ids.append(agent_id)
        room["entity_ids"] = ids
    return state


def reduce_AGENT_LEFT_WORLD(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent_id = p["agent_id"]
    room_id = p["room_id"]
    agent = _agent(state, agent_id)
    _require(agent["room_id"] == room_id, "location mismatch on leave")
    room = state.rooms[room_id]
    room["entity_ids"] = [x for x in (room.get("entity_ids") or []) if x != agent_id]
    del state.active_agents[agent_id]
    state.audit.append({"type": "AGENT_LEFT", "agent_id": agent_id, "reason": p["reason"]})
    return state


def reduce_MOVE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent_id = p["agent_id"]
    agent = _agent(state, agent_id)
    _require(agent["room_id"] == p["from_room_id"], "stale location")
    exit_rec = state.exits.get(p["exit_id"])
    _require(exit_rec is not None, "exit not found")
    assert exit_rec is not None
    _require(exit_rec["from_room_id"] == p["from_room_id"], "exit source mismatch")
    _require(exit_rec["to_room_id"] == p["to_room_id"], "exit dest mismatch")
    conditions = exit_rec.get("conditions") or []
    _require(not conditions, "exit conditions unmet")
    _debit(agent["budgets"], p["cost_paid"])
    src = state.rooms[p["from_room_id"]]
    dst = state.rooms[p["to_room_id"]]
    src["entity_ids"] = [x for x in (src.get("entity_ids") or []) if x != agent_id]
    dst_ids = list(dst.get("entity_ids") or [])
    if agent_id not in dst_ids:
        dst_ids.append(agent_id)
    dst["entity_ids"] = dst_ids
    agent["room_id"] = p["to_room_id"]
    return state


def reduce_MOVE_REJECTED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    _require(agent["room_id"] == p["from_room_id"], "stale location on reject")
    state.audit.append(
        {
            "type": "MOVE_REJECTED",
            "agent_id": p["agent_id"],
            "exit_id": p.get("exit_id"),
            "reason": p["reason"],
        }
    )
    return state


def reduce_LOOK(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    _require(agent["room_id"] == p["room_id"], "stale location")
    spend = float(p["attention_spent"])
    _require(spend >= 0, "negative attention")
    _require(agent["budgets"].get("attention", 0) >= spend, "insufficient attention")
    obs_id = p["observation_id"]
    _require(obs_id not in state.pending_observations, "duplicate observation id")
    agent["budgets"]["attention"] = float(agent["budgets"]["attention"]) - spend
    state.pending_observations[obs_id] = {
        "observation_id": obs_id,
        "agent_id": p["agent_id"],
        "kind": "LOOK",
        "room_id": p["room_id"],
        "source_event_id": event["event_id"],
        "noise_id": None,
        "status": "PENDING",
    }
    return state


def reduce_INSPECT(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    _require(agent["room_id"] == p["room_id"], "stale location")
    _require(p["entity_id"] in state.entities, "unknown entity")
    ent = state.entities[p["entity_id"]]
    loc = ent.get("location") or {}
    if isinstance(loc, dict) and loc.get("kind") == "ROOM":
        _require(loc.get("room_id") == p["room_id"], "entity not co-located")
    spend = float(p["attention_spent"])
    _require(agent["budgets"].get("attention", 0) >= spend, "insufficient attention")
    obs_id = p["observation_id"]
    _require(obs_id not in state.pending_observations, "duplicate observation id")
    agent["budgets"]["attention"] = float(agent["budgets"]["attention"]) - spend
    state.pending_observations[obs_id] = {
        "observation_id": obs_id,
        "agent_id": p["agent_id"],
        "kind": "INSPECT",
        "room_id": p["room_id"],
        "entity_id": p["entity_id"],
        "source_event_id": event["event_id"],
        "noise_id": None,
        "status": "PENDING",
    }
    return state


def reduce_MESSAGE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    sender = _agent(state, p["sender_id"])
    _require(p["recipient_id"] in state.active_agents, "recipient not active")
    _require(p["message_id"] not in state.messages, "duplicate message")
    _debit(sender["budgets"], p["cost_paid"])
    state.messages[p["message_id"]] = {
        "message_id": p["message_id"],
        "sender_id": p["sender_id"],
        "recipient_id": p["recipient_id"],
        "text": p["text"],
        "status": "QUEUED",
        "delivered_cycle": None,
    }
    return state


def reduce_MESSAGE_DELIVERED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    msg = state.messages.get(p["message_id"])
    _require(msg is not None, "unknown message")
    assert msg is not None
    _require(msg["status"] == "QUEUED", "message not queued")
    _require(msg["recipient_id"] == p["recipient_id"], "recipient mismatch")
    _require(int(p["delivered_cycle"]) == int(event["cycle"]), "delivery cycle mismatch")
    msg["status"] = "DELIVERED"
    msg["delivered_cycle"] = p["delivered_cycle"]
    return state


def reduce_TRADE_PROPOSED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    _require(p["proposer_id"] in state.active_agents, "proposer inactive")
    _require(p["counterparty_id"] in state.active_agents, "counterparty inactive")
    _require(p["trade_id"] not in state.trades, "duplicate trade")
    proposer = state.active_agents[p["proposer_id"]]
    for resource, amount in p["offered"].items():
        _require(float(proposer["budgets"].get(resource, 0)) >= float(amount), "offer underfunded")
    # reserve offered
    reservations = {k: float(v) for k, v in p["offered"].items()}
    for resource, amount in reservations.items():
        proposer["budgets"][resource] = float(proposer["budgets"][resource]) - amount
    state.trades[p["trade_id"]] = {
        "trade_id": p["trade_id"],
        "proposer_id": p["proposer_id"],
        "counterparty_id": p["counterparty_id"],
        "offered": {k: float(v) for k, v in p["offered"].items()},
        "requested": {k: float(v) for k, v in p["requested"].items()},
        "status": "OPEN",
        "reserved": reservations,
        "expires_cycle": p.get("expires_cycle"),
    }
    return state


def reduce_TRADE_ACCEPTED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    trade = state.trades.get(p["trade_id"])
    _require(trade is not None, "unknown trade")
    assert trade is not None
    _require(trade["status"] == "OPEN", "trade not open")
    _require(p["accepted_by"] == trade["counterparty_id"], "wrong accepter")
    counter = state.active_agents[trade["counterparty_id"]]
    for resource, amount in trade["requested"].items():
        _require(float(counter["budgets"].get(resource, 0)) >= float(amount), "request underfunded")
    trade["status"] = "ACCEPTED_PENDING_TRANSFER"
    return state


def reduce_TRADE_REJECTED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    trade = state.trades.get(p["trade_id"])
    _require(trade is not None, "unknown trade")
    assert trade is not None
    _require(trade["status"] == "OPEN", "trade not open")
    # release reservations
    proposer = state.active_agents.get(trade["proposer_id"])
    if proposer is not None:
        for resource, amount in (trade.get("reserved") or {}).items():
            proposer["budgets"][resource] = float(proposer["budgets"].get(resource, 0)) + float(amount)
    trade["status"] = "REJECTED"
    trade["reason"] = p["reason"]
    trade["reserved"] = {}
    return state


def reduce_RESOURCE_TRANSFER(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    from_id = p["from_id"]
    to_id = p["to_id"]
    _require(from_id != to_id, "self-transfer")
    amount = float(p["amount"])
    resource = p["resource"]

    from_bucket, from_key = _holder_resource_slot(state, from_id, resource)
    to_bucket, to_key = _holder_resource_slot(state, to_id, resource)

    if from_key:
        _require(from_key in from_bucket, "from missing resource")
        src_avail = float(from_bucket[from_key])
    else:
        src_avail = float(from_bucket.get(resource, 0))

    if to_key:
        # to_bucket may be a fresh map, but recipient must support the resource.
        _require(to_key in to_bucket or to_key == "", "to missing resource")

    trade_id = p.get("trade_id")
    if trade_id:
        trade = state.trades.get(trade_id)
        _require(trade is not None, "unknown trade")
        assert trade is not None
        _require(trade["status"] == "ACCEPTED_PENDING_TRANSFER", "trade not accepted")
        # transfers against reservation: offered already reserved from proposer
        if from_id == trade["proposer_id"] and resource in trade.get("reserved", {}):
            reserved = float(trade["reserved"].get(resource, 0))
            _require(reserved >= amount, "reservation insufficient")
            trade["reserved"][resource] = reserved - amount
            # reserved already debited at propose time — credit counterparty only
            to_bucket[to_key if to_key else resource] = float(to_bucket.get(to_key if to_key else resource, 0)) + amount
        else:
            # requested side: debit accepter free balance
            _require(src_avail >= amount, "insufficient funds")
            from_bucket[from_key if from_key else resource] = float(from_bucket.get(from_key if from_key else resource, 0)) - amount
            to_bucket[to_key if to_key else resource] = float(to_bucket.get(to_key if to_key else resource, 0)) + amount
        # close trade when both sides settled (simple: after any pair of transfers leave status)
        if all(v <= 0 for v in (trade.get("reserved") or {}).values()):
            # still may need requested transfer; mark settled only if both directions done via audit count
            trade.setdefault("transfers", 0)
            trade["transfers"] = int(trade["transfers"]) + 1
            if trade["transfers"] >= 2:
                trade["status"] = "SETTLED"
    else:
        _require(src_avail >= amount, "insufficient funds")
        from_bucket[from_key if from_key else resource] = float(from_bucket.get(from_key if from_key else resource, 0)) - amount
        to_bucket[to_key if to_key else resource] = float(to_bucket.get(to_key if to_key else resource, 0)) + amount
    return state


def reduce_ORG_CREATE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    _require(p["org_id"] not in state.organizations, "duplicate org")
    _require(p["creator_id"] in state.active_agents, "creator inactive")
    members = p["initial_members"]
    _require(len(members) >= 1, "empty members")
    ids = [m["agent_id"] for m in members]
    _require(len(ids) == len(set(ids)), "duplicate member")
    _require(p["creator_id"] in ids, "creator not in members")
    state.organizations[p["org_id"]] = {
        "org_id": p["org_id"],
        "name": p["name"],
        "charter": p["charter"],
        "status": "ACTIVE",
        "creator_id": p["creator_id"],
        "members": [{"agent_id": m["agent_id"], "role": m["role"]} for m in members],
        "created_cycle": event["cycle"],
    }
    return state


def reduce_ORG_MEMBER_ADD(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    org = state.organizations.get(p["org_id"])
    _require(org is not None and org["status"] == "ACTIVE", "org inactive")
    assert org is not None
    _require(p["agent_id"] in state.active_agents or p["agent_id"] in state.registered_agents, "unknown agent")
    existing = {m["agent_id"] for m in org["members"]}
    _require(p["agent_id"] not in existing, "already member")
    org["members"].append({"agent_id": p["agent_id"], "role": p["role"]})
    return state


def reduce_ORG_MEMBER_REMOVE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    org = state.organizations.get(p["org_id"])
    _require(org is not None and org["status"] == "ACTIVE", "org inactive")
    assert org is not None
    before = len(org["members"])
    org["members"] = [m for m in org["members"] if m["agent_id"] != p["agent_id"]]
    _require(len(org["members"]) < before, "member not present")
    state.audit.append(
        {
            "type": "ORG_MEMBER_REMOVE",
            "org_id": p["org_id"],
            "agent_id": p["agent_id"],
            "reason": p["reason"],
        }
    )
    return state


def reduce_ENTITY_CREATE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    eid = p["entity_id"]
    _require(eid not in state.entities, "duplicate entity")
    loc = p["location"]
    ent = {
        "entity_id": eid,
        "entity_type": p["entity_type"],
        "location": loc,
        "owner_id": p.get("owner_id"),
        "properties": dict(p.get("properties") or {}),
        "inventory": list(p.get("inventory") or []),
        "state": dict(p.get("state") or {}),
        "status": "LIVE",
        "created_cycle": event["cycle"],
    }
    state.entities[eid] = ent
    if isinstance(loc, dict) and loc.get("kind") == "ROOM":
        room_id = loc["room_id"]
        _require(room_id in state.rooms, "unknown room")
        ids = list(state.rooms[room_id].get("entity_ids") or [])
        if eid not in ids:
            ids.append(eid)
        state.rooms[room_id]["entity_ids"] = ids
    elif isinstance(loc, str):
        _require(loc in state.rooms, "unknown room string location")
        ids = list(state.rooms[loc].get("entity_ids") or [])
        if eid not in ids:
            ids.append(eid)
        state.rooms[loc]["entity_ids"] = ids
    return state


def reduce_ENTITY_DESTROY(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    eid = p["entity_id"]
    ent = state.entities.get(eid)
    _require(ent is not None, "unknown entity")
    assert ent is not None
    _require(ent.get("status", "LIVE") == "LIVE", "already destroyed")
    ent["status"] = "ARCHIVED"
    ent["destroyed_cycle"] = event["cycle"]
    ent["destroy_reason"] = p["reason"]
    loc = ent.get("location")
    if isinstance(loc, dict) and loc.get("kind") == "ROOM":
        room_id = loc["room_id"]
        if room_id in state.rooms:
            state.rooms[room_id]["entity_ids"] = [
                x for x in (state.rooms[room_id].get("entity_ids") or []) if x != eid
            ]
    if eid not in state.destroyed_entities:
        state.destroyed_entities.append(eid)
    return state


def reduce_ENTITY_UPDATE(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    ent = state.entities.get(p["entity_id"])
    _require(ent is not None and ent.get("status", "LIVE") == "LIVE", "entity not live")
    assert ent is not None
    set_map = p.get("set") or {}
    unset_list = p.get("unset") or []
    _require(len(set_map) + len(unset_list) >= 1, "empty update")
    for key in sorted(set_map):
        if key.startswith("state."):
            _set_nested(ent, key, set_map[key])
        elif key.startswith("properties."):
            _set_nested(ent, key, set_map[key])
        else:
            # treat as state key by default for fixture compatibility
            if key in ent.get("state", {}) or key.startswith("status") or "." not in key:
                if key == "state.status" or key.endswith(".status"):
                    _set_nested(ent, key if "." in key else f"state.{key}", set_map[key])
                else:
                    ent.setdefault("state", {})
                    # support "state.status" style already handled
                    if "." in key:
                        _set_nested(ent, key, set_map[key])
                    else:
                        ent["state"][key] = set_map[key]
            else:
                _set_nested(ent, key, set_map[key])
    for key in unset_list:
        if "." in key:
            _unset_nested(ent, key)
        else:
            ent.get("state", {}).pop(key, None)
            ent.get("properties", {}).pop(key, None)
    return state


def reduce_WAIT(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    cycles = int(p["cycles"])
    _require(cycles >= 1, "invalid wait")
    agent["wait_until"] = int(event["cycle"]) + cycles
    return state


def reduce_BUDGET_CONSUMED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    resource = p["resource"]
    amount = float(p["amount"])
    remaining = float(p["remaining"])
    current = float(agent["budgets"].get(resource, 0))
    _require(current >= amount, "insufficient for consume")
    expected = current - amount
    _require(abs(expected - remaining) < 1e-9, f"remaining mismatch {expected} != {remaining}")
    agent["budgets"][resource] = remaining
    state.audit.append(
        {
            "type": "BUDGET_CONSUMED",
            "agent_id": p["agent_id"],
            "resource": resource,
            "amount": amount,
            "action_id": p["action_id"],
        }
    )
    return state


def reduce_BUDGET_EXCEEDED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    agent = _agent(state, p["agent_id"])
    available = float(p["available"])
    requested = float(p["requested"])
    current = float(agent["budgets"].get(p["resource"], 0))
    _require(abs(current - available) < 1e-9, "stale available")
    _require(requested > available, "not an exceed")
    state.audit.append(
        {
            "type": "BUDGET_EXCEEDED",
            "agent_id": p["agent_id"],
            "resource": p["resource"],
            "requested": requested,
            "available": available,
            "action_id": p["action_id"],
        }
    )
    return state


def reduce_SITUATION_INJECTED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    _require(p["situation_id"] not in state.situations, "duplicate situation")
    for room_id in p["target_room_ids"]:
        _require(room_id in state.rooms, f"unknown target room {room_id}")
    state.situations[p["situation_id"]] = {
        "situation_id": p["situation_id"],
        "genome_id": p["genome_id"],
        "genome_version": p["genome_version"],
        "target_room_ids": list(p["target_room_ids"]),
        "selection_score": float(p["selection_score"]),
        "score_components": dict(p["score_components"]),
        "seed_stream_id": p["seed_stream_id"],
        "status": "ACTIVE",
    }
    return state


def reduce_NOISE_APPLIED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    pending = state.pending_observations.get(p["observation_id"])
    _require(pending is not None, "unknown pending observation")
    assert pending is not None
    _require(pending["agent_id"] == p["agent_id"], "agent mismatch")
    _require(pending["status"] == "PENDING", "observation not pending")
    pending["noise_id"] = p["noise_id"]
    pending["noise"] = {
        "level": p["level"],
        "fields_affected": list(p["fields_affected"]),
        "operations": list(p["operations"]),
        "seed_stream_id": p["seed_stream_id"],
    }
    return state


def reduce_OBSERVATION_GENERATED(state: WorldState, event: dict[str, Any]) -> WorldState:
    p = event["payload"]
    pending = state.pending_observations.get(p["observation_id"])
    _require(pending is not None, "unknown pending observation")
    assert pending is not None
    _require(pending["agent_id"] == p["agent_id"], "agent mismatch")
    _require(pending["status"] == "PENDING", "already generated")
    if p.get("noise_id") is not None:
        _require(pending.get("noise_id") == p["noise_id"], "noise mismatch")
    pending["status"] = "GENERATED"
    pending["observation_digest"] = p["observation_digest"]
    pending["redactions"] = list(p.get("redactions") or [])
    pending["source_event_ids"] = list(p["source_event_ids"])
    state.observation_digests[p["observation_id"]] = p["observation_digest"]
    return state


REDUCERS: dict[str, Reducer] = {
    "AGENT_ENTERED_WORLD": reduce_AGENT_ENTERED_WORLD,
    "AGENT_LEFT_WORLD": reduce_AGENT_LEFT_WORLD,
    "MOVE": reduce_MOVE,
    "MOVE_REJECTED": reduce_MOVE_REJECTED,
    "LOOK": reduce_LOOK,
    "INSPECT": reduce_INSPECT,
    "MESSAGE": reduce_MESSAGE,
    "MESSAGE_DELIVERED": reduce_MESSAGE_DELIVERED,
    "TRADE_PROPOSED": reduce_TRADE_PROPOSED,
    "TRADE_ACCEPTED": reduce_TRADE_ACCEPTED,
    "TRADE_REJECTED": reduce_TRADE_REJECTED,
    "RESOURCE_TRANSFER": reduce_RESOURCE_TRANSFER,
    "ORG_CREATE": reduce_ORG_CREATE,
    "ORG_MEMBER_ADD": reduce_ORG_MEMBER_ADD,
    "ORG_MEMBER_REMOVE": reduce_ORG_MEMBER_REMOVE,
    "ENTITY_CREATE": reduce_ENTITY_CREATE,
    "ENTITY_DESTROY": reduce_ENTITY_DESTROY,
    "ENTITY_UPDATE": reduce_ENTITY_UPDATE,
    "WAIT": reduce_WAIT,
    "BUDGET_CONSUMED": reduce_BUDGET_CONSUMED,
    "BUDGET_EXCEEDED": reduce_BUDGET_EXCEEDED,
    "SITUATION_INJECTED": reduce_SITUATION_INJECTED,
    "NOISE_APPLIED": reduce_NOISE_APPLIED,
    "OBSERVATION_GENERATED": reduce_OBSERVATION_GENERATED,
}


def apply_event(state: WorldState, event: dict[str, Any]) -> WorldState:
    event_type = event["event_type"]
    reducer = REDUCERS.get(event_type)
    if reducer is None:
        raise ReduceError(f"unknown event type: {event_type}")
    # sequence continuity
    expected_seq = state.sequence + 1
    _require(int(event["sequence"]) == expected_seq, f"sequence gap: want {expected_seq} got {event['sequence']}")
    if state.last_event_digest is None:
        _require(event.get("previous_digest") in (None, ""), "first event previous_digest must be null")
    else:
        _require(event.get("previous_digest") == state.last_event_digest, "digest chain break")

    next_state = state.clone()
    next_state = reducer(next_state, event)
    next_state.cycle = int(event["cycle"])
    next_state.sequence = int(event["sequence"])
    next_state.last_event_digest = event["digest"]
    next_state.event_count = int(event["sequence"])
    return next_state
