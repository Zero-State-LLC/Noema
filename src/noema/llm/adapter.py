"""LLM propose adapter. Fail-closed to no proposal (caller may WAIT)."""

from __future__ import annotations

from typing import Any, Callable

from noema.harness.types import ActionProposal
from noema.llm.proposal import ProposalError, parse_proposal

ProposeFn = Callable[[dict[str, Any]], str | dict[str, Any]]


def redacted_context(context: dict[str, Any]) -> dict[str, Any]:
    """Canonical slice only. Never include tokens or LocalMind."""
    return {
        "canonical": context.get("canonical") or {},
        "system": context.get("system") or {},
        "world_text": list(context.get("world_text") or []),
    }


class LlmProposeAdapter:
    def __init__(self, propose: ProposeFn, *, fallback: str = "WAIT") -> None:
        self._propose = propose
        self._fallback = fallback
        self.last_error: str | None = None
        self.calls = 0

    def decide(self, context: dict[str, Any]) -> ActionProposal | None:
        payload = redacted_context(context)
        self.calls += 1
        try:
            raw = self._propose(payload)
            return parse_proposal(raw)
        except (ProposalError, TypeError, ValueError) as exc:
            self.last_error = str(exc)
            if self._fallback:
                return ActionProposal(action=self._fallback)
            return None
