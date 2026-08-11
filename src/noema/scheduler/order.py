"""Deterministic action ordering (RFC-0003 aligned).

Canonical same-cycle order:
  (action_priority, agent_id, client_action_sequence, action_id)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


DEFAULT_VERB_PRIORITY: dict[str, int] = {
    "WAIT": 10,
    "LOOK": 20,
    "INSPECT": 30,
    "MESSAGE": 40,
    "MOVE": 50,
    "HARVEST": 60,
    "PRODUCE": 60,
    "REPAIR": 70,
    "TRADE": 80,
    "ORG_CREATE": 90,
    "ORG_MEMBER_ADD": 90,
    "ORG_MEMBER_REMOVE": 90,
    "ACT": 100,
}


@dataclass(frozen=True, order=True)
class ActionOrderKey:
    action_priority: int
    agent_id: str
    client_action_sequence: int
    action_id: str


def order_key(action: dict[str, Any]) -> ActionOrderKey:
    verb = str(action.get("verb") or action.get("type") or "ACT").upper()
    priority = int(action.get("action_priority", DEFAULT_VERB_PRIORITY.get(verb, 100)))
    return ActionOrderKey(
        action_priority=priority,
        agent_id=str(action.get("agent_id") or ""),
        client_action_sequence=int(action.get("client_action_sequence") or 0),
        action_id=str(action.get("action_id") or action.get("idempotency_key") or ""),
    )


def sort_actions(actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(actions, key=order_key)
