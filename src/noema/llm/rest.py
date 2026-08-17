"""REST HELLO / AUTH against hosted /protocol/v1."""

from __future__ import annotations

from typing import Any, Callable

HttpFn = Callable[..., dict[str, Any]]


def protocol_hello(base: str, http: HttpFn, request_id: str = "req.hello") -> dict[str, Any]:
    return http(
        "POST",
        f"{base.rstrip('/')}/protocol/v1",
        {
            "protocol": "agent-protocol/v1",
            "type": "HELLO",
            "request_id": request_id,
            "body": {"supported_protocols": ["agent-protocol/v1"]},
        },
        None,
    )


def protocol_auth(base: str, token: str, http: HttpFn, request_id: str = "req.auth") -> dict[str, Any]:
    return http(
        "POST",
        f"{base.rstrip('/')}/protocol/v1",
        {
            "protocol": "agent-protocol/v1",
            "type": "AUTH",
            "request_id": request_id,
            "body": {"access_token": token},
        },
        None,
    )
