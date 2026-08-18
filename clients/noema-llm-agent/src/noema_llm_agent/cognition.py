"""Private cognition must never appear on the wire."""

from __future__ import annotations

from typing import Any

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

MAX_DEPTH = 16


class PrivateCognitionError(RuntimeError):
    def __init__(self, message: str = "private cognition must not cross the gateway") -> None:
        super().__init__(message)


def contains_private(value: Any, depth: int = 0, *, in_arguments: bool = False) -> bool:
    if depth > MAX_DEPTH:
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


def assert_public(value: Any, *, allow_auth_token: bool = False) -> None:
    if allow_auth_token and isinstance(value, dict):
        clone = dict(value)
        clone.pop("access_token", None)
        nested = clone.get("body")
        if isinstance(nested, dict):
            nested = dict(nested)
            nested.pop("access_token", None)
            clone["body"] = nested
        if contains_private(clone):
            raise PrivateCognitionError()
        return
    if contains_private(value):
        raise PrivateCognitionError()
