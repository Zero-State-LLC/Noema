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


class FirstValidAffordanceAdapter:
    def decide(self, context: dict[str, Any]) -> ActionProposal | None:
        canonical = context.get("canonical") or {}
        policy = (context.get("system") or {}).get("permits") or {}
        for aff in canonical.get("affordances") or []:
            if not aff.get("available", True):
                continue
            action = str(aff.get("action") or aff.get("operation") or "").upper()
            if not action:
                continue
            if action in {"CONTEST", "AGREEMENT", "ACCESS"} and not policy.get("contest") and action != "REPAIR":
                if action == "CONTEST" and not policy.get("contest"):
                    continue
                if action == "ACCESS" and not policy.get("access"):
                    continue
            if action == "REPAIR" and policy.get("repair") is False:
                continue
            return ActionProposal(action=action, target_id=aff.get("target_id"), arguments={})
        available = list(canonical.get("available_actions") or [])
        if "LOOK" in available or not available:
            return ActionProposal(action="LOOK")
        return ActionProposal(action=str(available[0]))
