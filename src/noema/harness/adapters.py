"""Deterministic controllers. No vendor model SDK."""

from __future__ import annotations

from typing import Any

from noema.harness.types import ActionProposal


class ScriptedAdapter:
    def __init__(self, steps: list[ActionProposal]) -> None:
        self._steps = list(steps)

    def decide(self, _context: dict[str, Any]) -> ActionProposal | None:
        if not self._steps:
            return None
        return self._steps.pop(0)


def _quiet_room(canonical: dict[str, Any]) -> bool:
    sit = canonical.get("situation") or {}
    if str(sit.get("strain") or "").strip():
        return False
    for ent in canonical.get("entities") or []:
        if not isinstance(ent, dict):
            continue
        if ent.get("repairable") or ent.get("harvestable"):
            return False
        cond = ent.get("condition")
        if isinstance(cond, (int, float)) and cond < 50:
            return False
    return True


class FirstValidAffordanceAdapter:
    """Prefer live-room work. Quiet rooms WAIT — do not invent pressure."""

    def decide(self, context: dict[str, Any]) -> ActionProposal | None:
        canonical = context.get("canonical") or {}
        policy = (context.get("system") or {}).get("permits") or {}
        if _quiet_room(canonical):
            return ActionProposal(action="WAIT")
        for aff in canonical.get("affordances") or []:
            if not aff.get("available", True):
                continue
            action = str(aff.get("action") or aff.get("operation") or "").upper()
            if not action:
                continue
            if action in {"CONTEST", "AGREEMENT", "ACCESS"}:
                if action.startswith("CONTEST") and not policy.get("contest"):
                    continue
                if action.startswith("ACCESS") and not policy.get("access"):
                    continue
                if action.startswith("AGREEMENT") and not policy.get("contest"):
                    continue
            if action == "REPAIR" and policy.get("repair") is False:
                continue
            if action == "HARVEST" and policy.get("harvest") is False:
                continue
            if action == "MOVE" and not (aff.get("target_id") or (aff.get("cmd") or "").startswith("move")):
                continue
            args: dict[str, Any] = {}
            if action == "MOVE":
                args["direction"] = aff.get("target_id") or "east"
            return ActionProposal(action=action, target_id=aff.get("target_id"), arguments=args)
        available = list(canonical.get("available_actions") or [])
        if "WAIT" in available or _quiet_room(canonical):
            return ActionProposal(action="WAIT")
        if "LOOK" in available or not available:
            return ActionProposal(action="LOOK")
        return ActionProposal(action=str(available[0]))
