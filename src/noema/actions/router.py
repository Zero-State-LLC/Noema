"""Single validated action entrypoint → events → fenced world mutation."""

from __future__ import annotations

import uuid
from typing import Any, Callable

from noema.actions.errors import (
    FORBIDDEN,
    INVALID_ACTION,
    PRECONDITION_FAILED,
    ActionError,
)
from noema.scheduler.order import sort_actions
from noema.world.digest import event_body_digest, sha256_digest
from noema.world.reduce import ReduceError, apply_event
from noema.world.state import (
    WorldState,
    RoomsBundle,
    EntitiesBundle,
    AgentsBundle,
)


EventEmitter = Callable[[WorldState, dict[str, Any]], WorldState]


class ActionRouter:
    """Validate and apply player/agent actions through one mutation path."""

    SUPPORTED_VERBS = {
        "LOOK",
        "MOVE",
        "INSPECT",
        "MESSAGE",
        "WAIT",
        "TRADE_PROPOSE",
        "TRADE_ACCEPT",
        "TRADE_REJECT",
        "ORG_CREATE",
        "HARVEST",
        "REPAIR",
        "ENTER_WORLD",
        "LEAVE_WORLD",
    }

    def __init__(self, world_id: str):
        self.world_id = world_id
        self._sequences: dict[str, int] = {}  # agent_id -> last client_action_sequence
        self._idempotency: dict[str, dict[str, Any]] = {}

    def validate_action(self, action: dict[str, Any], *, principal_agent_id: str | None) -> dict[str, Any]:
        if not isinstance(action, dict):
            raise ActionError(INVALID_ACTION, "action must be an object")
        verb = str(action.get("verb") or "").upper()
        if verb not in self.SUPPORTED_VERBS:
            raise ActionError(INVALID_ACTION, f"unsupported verb: {verb}", details={"verb": verb})
        agent_id = action.get("agent_id")
        if not agent_id:
            raise ActionError(INVALID_ACTION, "agent_id required")
        if principal_agent_id and agent_id != principal_agent_id:
            raise ActionError(FORBIDDEN, "ACT agent_id does not match authenticated principal")
        if not action.get("action_id"):
            action = {**action, "action_id": f"act.{uuid.uuid4().hex[:12]}"}
        if not action.get("idempotency_key"):
            action = {**action, "idempotency_key": action["action_id"]}
        seq = int(action.get("client_action_sequence") or 0)
        if seq < 1:
            raise ActionError(INVALID_ACTION, "client_action_sequence must be >= 1")
        last = self._sequences.get(agent_id, 0)
        if seq <= last:
            # idempotent replay of same key is allowed
            prior = self._idempotency.get(action["idempotency_key"])
            if prior is not None:
                return {"idempotent_replay": True, "prior": prior, "action": action}
            raise ActionError(INVALID_ACTION, "client_action_sequence not monotonic")
        action = {**action, "verb": verb, "client_action_sequence": seq}
        return {"idempotent_replay": False, "action": action}

    def actions_to_events(self, state: WorldState, actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        ordered = sort_actions(actions)
        events: list[dict[str, Any]] = []
        cycle = int(state.cycle)
        seq = int(state.sequence)
        prev = state.last_event_digest
        for action in ordered:
            built = self._action_to_events(state, action, cycle=cycle, start_seq=seq + 1, previous_digest=prev)
            for ev in built:
                events.append(ev)
                seq = int(ev["sequence"])
                prev = ev["digest"]
        return events

    def apply_actions(
        self,
        state: WorldState,
        actions: list[dict[str, Any]],
        *,
        principal_agent_id: str | None = None,
    ) -> tuple[WorldState, list[dict[str, Any]], list[dict[str, Any]]]:
        validated: list[dict[str, Any]] = []
        results: list[dict[str, Any]] = []
        for raw in actions:
            v = self.validate_action(raw, principal_agent_id=principal_agent_id)
            if v.get("idempotent_replay"):
                results.append({"status": "IDEMPOTENT", "result": v["prior"]})
                continue
            validated.append(v["action"])
        if not validated:
            return state, [], results

        events = self.actions_to_events(state, validated)
        next_state = state
        try:
            for event in events:
                next_state = apply_event(next_state, event)
        except ReduceError as exc:
            raise ActionError(PRECONDITION_FAILED, str(exc)) from exc

        for action in validated:
            self._sequences[action["agent_id"]] = int(action["client_action_sequence"])
            summary = {
                "action_id": action["action_id"],
                "verb": action["verb"],
                "cycle": next_state.cycle,
                "sequence": next_state.sequence,
            }
            self._idempotency[action["idempotency_key"]] = summary
            results.append({"status": "APPLIED", "result": summary})
        return next_state, events, results

    def _action_to_events(
    # Router now routes most state access through bundle_seams (RoomsBundle,
    # EntitiesBundle, AgentsBundle) for greater depth + locality.
    
        self,
        state: WorldState,
        action: dict[str, Any],
        *,
        cycle: int,
        start_seq: int,
        previous_digest: str | None,
    ) -> list[dict[str, Any]]:
        verb = action["verb"]
        agent_id = action["agent_id"]
        params = dict(action.get("parameters") or {})
        seq = start_seq
        prev = previous_digest
        events: list[dict[str, Any]] = []

        def emit(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
            nonlocal seq, prev
            event = {
                "schema_version": "world-event/1.0",
                "event_id": f"evt.{uuid.uuid4().hex[:16]}",
                "event_type": event_type,
                "world_id": self.world_id,
                "cycle": cycle,
                "sequence": seq,
                "previous_digest": prev,
                "payload": payload,
            }
            event["digest"] = event_body_digest(event)
            events.append(event)
            prev = event["digest"]
            seq += 1
            return event

        if verb == "ENTER_WORLD":
            rooms = RoomsBundle(state)
            agents = AgentsBundle(state)
            room_id = params.get("room_id")
            if not room_id:
                # default first room via bundle seam
                room_id = rooms.first_room_id()
            budgets = params.get("budgets") or dict(state.budget_defaults)  # core field (stable)
            reg = agents.registered_agent(agent_id) or {"agent_id": agent_id}
            emit(
                "AGENT_ENTERED_WORLD",
                {
                    "agent_id": agent_id,
                    "room_id": room_id,
                    "budgets": budgets,
                    "manifest_id": reg.get("manifest_id") or f"manifest.{agent_id}",
                },
            )
        elif verb == "LEAVE_WORLD":
            agents = AgentsBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            emit(
                "AGENT_LEFT_WORLD",
                {"agent_id": agent_id, "room_id": agent["room_id"], "reason": params.get("reason") or "LEFT"},
            )
        elif verb == "LOOK":
            agents = AgentsBundle(state)
            rooms = RoomsBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            room_id = agent["room_id"]
            obs_id = params.get("observation_id") or f"obs.{action['action_id']}"
            spend = float(params.get("attention_spent", 1))
            look_ev = emit(
                "LOOK",
                {
                    "agent_id": agent_id,
                    "room_id": room_id,
                    "attention_spent": spend,
                    "observation_id": obs_id,
                },
            )
            # deterministic observation digest from room projection via bundle seam
            room = rooms.room(room_id) or {}
            body = {
                "kind": "LOOK",
                "room_id": room_id,
                "name": room.get("name"),
                "entity_ids": rooms.room_entity_ids(room_id),
            }
            obs_digest = sha256_digest(body)
            emit(
                "OBSERVATION_GENERATED",
                {
                    "observation_id": obs_id,
                    "agent_id": agent_id,
                    "observation_digest": obs_digest,
                    "source_event_ids": [look_ev["event_id"]],
                    "redactions": [],
                    "noise_id": None,
                },
            )
        elif verb == "MOVE":
            agents = AgentsBundle(state)
            rooms = RoomsBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            exit_id = params.get("exit_id")
            if not exit_id:
                raise ActionError(INVALID_ACTION, "exit_id required")
            exit_rec = rooms.exit(exit_id)
            if not exit_rec:
                raise ActionError(PRECONDITION_FAILED, "unknown exit")
            cost = params.get("cost_paid") or {"energy": 1}
            emit(
                "MOVE",
                {
                    "agent_id": agent_id,
                    "from_room_id": agent["room_id"],
                    "to_room_id": exit_rec["to_room_id"],
                    "exit_id": exit_id,
                    "cost_paid": cost,
                },
            )
        elif verb == "INSPECT":
            agents = AgentsBundle(state)
            rooms = RoomsBundle(state)
            ents = EntitiesBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            entity_id = params.get("entity_id") or params.get("target")
            if not entity_id:
                raise ActionError(INVALID_ACTION, "entity_id required")
            obs_id = params.get("observation_id") or f"obs.{action['action_id']}"
            spend = float(params.get("attention_spent", 1))
            inspect_ev = emit(
                "INSPECT",
                {
                    "agent_id": agent_id,
                    "room_id": agent["room_id"],
                    "entity_id": entity_id,
                    "attention_spent": spend,
                    "observation_id": obs_id,
                },
            )
            ent = ents.entity(entity_id) or {}
            body = {"kind": "INSPECT", "entity_id": entity_id, "entity_type": ent.get("entity_type")}
            emit(
                "OBSERVATION_GENERATED",
                {
                    "observation_id": obs_id,
                    "agent_id": agent_id,
                    "observation_digest": sha256_digest(body),
                    "source_event_ids": [inspect_ev["event_id"]],
                    "redactions": [],
                    "noise_id": None,
                },
            )
        elif verb == "MESSAGE":
            recipient = params.get("recipient_id")
            text = params.get("text") or ""
            if not recipient:
                raise ActionError(INVALID_ACTION, "recipient_id required")
            msg_id = params.get("message_id") or f"msg.{action['action_id']}"
            cost = params.get("cost_paid") or {"attention": 1}
            emit(
                "MESSAGE",
                {
                    "message_id": msg_id,
                    "sender_id": agent_id,
                    "recipient_id": recipient,
                    "text": text,
                    "cost_paid": cost,
                },
            )
            # same-cycle delivery: MESSAGE_DELIVERED before observation projection (RFC-0003)
            emit(
                "MESSAGE_DELIVERED",
                {
                    "message_id": msg_id,
                    "recipient_id": recipient,
                    "delivered_cycle": cycle,
                },
            )
        elif verb == "WAIT":
            cycles = int(params.get("cycles") or 1)
            emit("WAIT", {"agent_id": agent_id, "cycles": cycles})
        elif verb == "ORG_CREATE":
            org_id = params.get("org_id") or f"org.{action['action_id']}"
            name = params.get("name") or "Unnamed Org"
            charter = params.get("charter") or ""
            members = params.get("initial_members") or [{"agent_id": agent_id, "role": "founder"}]
            emit(
                "ORG_CREATE",
                {
                    "org_id": org_id,
                    "name": name,
                    "charter": charter,
                    "creator_id": agent_id,
                    "initial_members": members,
                },
            )
        elif verb == "HARVEST":
            # map to BUDGET / RESOURCE_TRANSFER from entity stock when possible
            agents = AgentsBundle(state)
            ents = EntitiesBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            entity_id = params.get("entity_id")
            resource = params.get("resource") or "energy"
            amount = float(params.get("amount") or 1)
            if not entity_id:
                raise ActionError(INVALID_ACTION, "entity_id required for HARVEST")
            emit(
                "RESOURCE_TRANSFER",
                {
                    "from_id": entity_id,
                    "to_id": agent_id,
                    "resource": resource,
                    "amount": amount,
                },
            )
        elif verb == "REPAIR":
            agents = AgentsBundle(state)
            ents = EntitiesBundle(state)
            agent = agents.active_agent(agent_id)
            if not agent:
                raise ActionError(PRECONDITION_FAILED, "agent not in world")
            entity_id = params.get("entity_id")
            if not entity_id:
                raise ActionError(INVALID_ACTION, "entity_id required for REPAIR")
            # spend energy and bump condition if present
            cost = params.get("cost_paid") or {"energy": 1}
            budgets = agents.agent_budgets(agent_id)
            emit(
                "BUDGET_CONSUMED",
                {
                    "agent_id": agent_id,
                    "resource": "energy",
                    "amount": float(cost.get("energy", 1)),
                    "remaining": float(budgets.get("energy", 0)) - float(cost.get("energy", 1)),
                    "action_id": action["action_id"],
                },
            )
            ent = ents.entity(entity_id) or {}
            condition = float((ent.get("state") or {}).get("condition", 50))
            emit(
                "ENTITY_UPDATE",
                {
                    "entity_id": entity_id,
                    "set": {"condition": min(100.0, condition + float(params.get("repair_amount", 5)))},
                    "unset": [],
                },
            )
        elif verb == "TRADE_PROPOSE":
            emit(
                "TRADE_PROPOSED",
                {
                    "trade_id": params.get("trade_id") or f"trade.{action['action_id']}",
                    "proposer_id": agent_id,
                    "counterparty_id": params.get("counterparty_id"),
                    "offered": params.get("offered") or {},
                    "requested": params.get("requested") or {},
                    "expires_cycle": params.get("expires_cycle"),
                },
            )
        elif verb == "TRADE_ACCEPT":
            emit(
                "TRADE_ACCEPTED",
                {"trade_id": params.get("trade_id"), "accepted_by": agent_id},
            )
        elif verb == "TRADE_REJECT":
            emit(
                "TRADE_REJECTED",
                {
                    "trade_id": params.get("trade_id"),
                    "rejected_by": agent_id,
                    "reason": params.get("reason") or "REJECTED",
                },
            )
        else:
            raise ActionError(INVALID_ACTION, f"unhandled verb {verb}")
        return events
