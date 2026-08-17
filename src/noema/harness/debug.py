"""In-room A+ debug. Never MOVE / harvest / trade / repair."""

from __future__ import annotations

from typing import Any

from noema.harness.types import ActionProposal

_RETRYABLE = frozenset({"LOOK", "INSPECT", "WAIT", "OBSERVE"})
_FORBIDDEN = frozenset({"MOVE", "HARVEST", "TRADE", "REPAIR", "COMMIT.HARVEST", "COMMIT.REPAIR"})


class DebugAdapter:
    def __init__(self, failed: ActionProposal | None = None) -> None:
        steps: list[ActionProposal] = []
        if failed and (failed.action or "").upper() in _RETRYABLE:
            steps.append(
                ActionProposal(
                    action=failed.action.upper(),
                    target_id=failed.target_id,
                    arguments=dict(failed.arguments or {}),
                )
            )
        if not steps or steps[0].action != "LOOK":
            steps.append(ActionProposal(action="LOOK"))
        steps.append(ActionProposal(action="WAIT"))
        self._steps = steps

    def remaining(self) -> int:
        return len(self._steps)

    def decide(self, _context: dict[str, Any]) -> ActionProposal | None:
        while self._steps:
            nxt = self._steps.pop(0)
            if (nxt.action or "").upper() in _FORBIDDEN:
                continue
            return nxt
        return None
