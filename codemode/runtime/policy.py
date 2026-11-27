"""Repo policy for tool calls. Kept out of generated wrappers so regeneration never drops it.

Cloudflare: AGENTS.md says the Cloudflare MCP can list and read Workers and is
not a production deploy path. `execute` runs arbitrary JavaScript against the
Cloudflare API, so only code whose every request is a literal GET or HEAD is
allowed. This is a seatbelt; the real boundary is a read-only API token or
read-only OAuth scopes.
"""

from __future__ import annotations

import re
from typing import Any


class PolicyError(PermissionError):
    pass


_METHOD = re.compile(r"""\bmethod\s*:\s*(?:(['"`])([A-Za-z]+)\1|([^\s,}]+))""")
_READ_METHODS = {"GET", "HEAD"}


def _cloudflare_execute(arguments: dict[str, Any]) -> None:
    code = str(arguments.get("code", ""))
    for m in _METHOD.finditer(code):
        literal = m.group(2)
        if literal is None:
            raise PolicyError(
                f"cloudflare_api.execute: request method {m.group(3)!r} is not a string literal, "
                "so it cannot be checked as read-only. Write method: \"GET\"."
            )
        if literal.upper() not in _READ_METHODS:
            raise PolicyError(
                f"cloudflare_api.execute: {literal.upper()} refused. Code mode is read-only on Cloudflare; "
                "deploys go through the dispatch-only pin workflow and only when the user says deploy."
            )


_CHECKS = {
    ("cloudflare_api", "execute"): _cloudflare_execute,
}


def check(server: str, tool: str, arguments: dict[str, Any]) -> None:
    fn = _CHECKS.get((server, tool))
    if fn is not None:
        fn(arguments)
