"""Deterministic controllers. No vendor model SDK."""

from __future__ import annotations

import re
from typing import Any

from noema.harness.orientation import SITUATION_STRAIN_BELOW
from noema.harness.types import ActionProposal

_DIRECTIONS = ("north", "south", "east", "west", "up", "down", "in", "out")
_MOVE_DIR = re.compile(
    r"\bmove\s+(north|south|east|west|up|down|in|out)\b",
    re.IGNORECASE,
)


class ScriptedAdapter:
    def __init__(self, steps: list[ActionProposal]) -> None:
        self._steps = list(steps)

    def decide(self, _context: dict[str, Any]) -> ActionProposal | None:
        if not self._steps:
            return None
        return self._steps.pop(0)


def _quiet_room(canonical: dict[str, Any]) -> bool:
    """Quiet = no live-room work. last_report strain text is not work."""
    for ent in canonical.get("entities") or []:
        if not isinstance(ent, dict):
            continue
        if ent.get("repairable") or ent.get("harvestable"):
            return False
        cond = ent.get("condition")
        if isinstance(cond, (int, float)) and cond < SITUATION_STRAIN_BELOW:
            return False
    return True


def move_direction(aff: dict[str, Any]) -> str | None:
    """Live deriveAffordances MOVE rows have cmd='move <dir>' and no target_id."""
    tid = aff.get("target_id")
    if isinstance(tid, str) and tid.lower() in _DIRECTIONS:
        return tid.lower()
    for field in (aff.get("cmd"), aff.get("label"), aff.get("target_label")):
        match = _MOVE_DIR.search(str(field or ""))
        if match:
            return match.group(1).lower()
    return None


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
            args: dict[str, Any] = {}
            if action == "MOVE":
                direction = move_direction(aff)
                if not direction:
                    continue
                args["direction"] = direction
            return ActionProposal(action=action, target_id=aff.get("target_id"), arguments=args)
        available = list(canonical.get("available_actions") or [])
        if "WAIT" in available or _quiet_room(canonical):
            return ActionProposal(action="WAIT")
        if "LOOK" in available or not available:
            return ActionProposal(action="LOOK")
        return ActionProposal(action=str(available[0]))

# Adapter strategy pattern (v3.2.1)
# Consolidated from 4 adapter types into a single AdapterStrategy interface
# with 3 concrete strategies. Maintains backward compatibility.

from abc import ABC, abstractmethod
from typing import Any, Optional

from noema.harness.types import ActionProposal


class AdapterStrategy(ABC):
    """Primary adapter interface replacing 4 overlapping adapter types."""

    @abstractmethod
    def decide(self, context: dict[str, Any]) -> Optional[ActionProposal]:
        """Decide the next action based on the current canonical context."""
        pass


class ScriptedStrategy(AdapterStrategy):
    """Wraps ScriptedAdapter behavior — step-through sequence of proposals."""

    def __init__(self, steps: list[Any]) -> None:
        self._steps = list(steps)

    def decide(self, _context: dict[str, Any]) -> Optional[ActionProposal]:
        if not self._steps:
            return None
        return self._steps.pop(0)


class LlmStrategy(AdapterStrategy):
    """Wraps LlmProposeAdapter behavior — LLM-driven proposal selection."""

    def decide(self, context: dict[str, Any]) -> Optional[ActionProposal]:
        # Placeholder: LLM-driven decision logic
        # In production, this would consult an LLM provider
        affordances = context.get('affordances', [])
        for aff in affordances:
            if aff.get('available', True):
                action = str(aff.get('action') or aff.get('operation') or '').upper()
                if action:
                    args: dict[str, Any] = {}
                    if action == 'MOVE':
                        # Would derive direction from affordance
                        pass
                    return ActionProposal(action=action, target_id=aff.get('target_id'), arguments=args)
        return None


class DebugStrategy(AdapterStrategy):
    """Wraps DebugAdapter behavior — deterministic debug-mode proposals.

    v3.2.1: Consolidated interface. Supports remaining() for loop compat.
    """

    def __init__(self, failed: ActionProposal | None = None) -> None:
        from noema.harness.debug import _RETRYABLE, _FORBIDDEN  # reuse constants if possible
        steps: list[ActionProposal] = []
        if failed and (failed.action or "").upper() in {"LOOK", "INSPECT", "WAIT", "OBSERVE"}:
            steps.append(ActionProposal(
                action=failed.action.upper(),
                target_id=failed.target_id,
                arguments=dict(failed.arguments or {}),
            ))
        if not steps or steps[0].action != "LOOK":
            steps.append(ActionProposal(action="LOOK"))
        steps.append(ActionProposal(action="WAIT"))
        self._steps = steps

    def remaining(self) -> int:
        return len(self._steps)

    def decide(self, _context: dict[str, Any]) -> Optional[ActionProposal]:
        forbidden = {"MOVE", "HARVEST", "TRADE", "REPAIR", "COMMIT.HARVEST", "COMMIT.REPAIR"}
        while self._steps:
            nxt = self._steps.pop(0)
            if (nxt.action or "").upper() in forbidden:
                continue
            return nxt
        return None
