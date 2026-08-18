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


class PrivateCognitionError(RuntimeError):
    def __init__(self, message: str = "private cognition must not cross the gateway") -> None:
        super().__init__(message)


def contains_private(value: Any, depth: int = 0) -> bool:
    if not isinstance(value, dict) or depth > 2:
        return False
    for key, child in value.items():
        if str(key).lower() in PRIVATE_KEYS:
            return True
        if isinstance(child, dict) and contains_private(child, depth + 1):
            return True
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
