"""Parse a model proposal. Private cognition never becomes a command."""

from __future__ import annotations

import json
import re
from typing import Any

from noema.harness.types import ActionProposal

PRIVATE_KEYS = frozenset(
    {
        "cognition",
        "prompt",
        "plan",
        "thought",
        "inner_monologue",
        "system_prompt",
        "private_cognition",
        "api_key",
        "secret",
        "access_token",
        "device_code",
        "chain_of_thought",
        "cot",
        "reason",
    }
)

MAX_PRIVATE_DEPTH = 16

ALLOWED_ACTIONS = frozenset(
    {
        "LOOK",
        "MOVE",
        "INSPECT",
        "WAIT",
        "OBSERVE",
        "ENTER_WORLD",
        "LEAVE_WORLD",
        "REPAIR",
        "HARVEST",
        "MESSAGE",
        "TRADE",
    }
)

_PROSE_CMD = re.compile(
    r"^\s*(MOVE|LOOK|WAIT|INSPECT|HARVEST|TRADE|REPAIR|ENTER_WORLD|OBSERVE|POST\s|/v1/command)",
    re.IGNORECASE,
)


class ProposalError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def contains_private(value: Any, depth: int = 0, *, in_arguments: bool = False) -> bool:
    if depth > MAX_PRIVATE_DEPTH:
        return True
    if isinstance(value, dict):
        for key, child in value.items():
            lowered = str(key).lower()
            if lowered in PRIVATE_KEYS and not (in_arguments and lowered == "reason"):
                return True
            nested_args = in_arguments or lowered == "arguments"
            if contains_private(child, depth + 1, in_arguments=nested_args):
                return True
        return False
    if isinstance(value, (list, tuple)):
        return any(contains_private(item, depth + 1, in_arguments=in_arguments) for item in value)
    return False


def parse_proposal(raw: str | dict[str, Any]) -> ActionProposal:
    if isinstance(raw, str):
        text = raw.strip()
        if _PROSE_CMD.match(text) and not text.startswith("{"):
            raise ProposalError("PROSE_COMMAND", "model emitted a command line, not a proposal object")
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            fence = re.search(r"\{[\s\S]*\}", text)
            if not fence:
                raise ProposalError("INVALID_JSON", "model output is not a proposal object") from exc
            try:
                data = json.loads(fence.group(0))
            except json.JSONDecodeError as exc2:
                raise ProposalError("INVALID_JSON", "model output is not a proposal object") from exc2
    else:
        data = raw
    if not isinstance(data, dict):
        raise ProposalError("INVALID_JSON", "proposal must be an object")
    if contains_private(data):
        raise ProposalError("PRIVATE_COGNITION", "proposal contains private cognition fields")
    action = str(data.get("action") or "").upper()
    if action not in ALLOWED_ACTIONS:
        raise ProposalError("UNKNOWN_ACTION", f"action {action or '<empty>'} is not a v0.1 proposal")
    args = data.get("arguments") if isinstance(data.get("arguments"), dict) else {}
    if contains_private(args):
        raise ProposalError("PRIVATE_COGNITION", "arguments contain private cognition fields")
    target = data.get("target_id")
    return ActionProposal(action=action, target_id=str(target) if target else None, arguments=dict(args))
