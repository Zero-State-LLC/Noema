"""Repo policy for tool calls. Kept out of generated wrappers so regeneration never drops it.

Cloudflare: AGENTS.md says the Cloudflare MCP can list and read Workers and is
not a production deploy path. `execute` runs arbitrary JavaScript against the
Cloudflare API, so only code whose every request is a literal GET or HEAD is
allowed. This is a seatbelt; the real boundary is a read-only API token or
read-only OAuth scopes.
"""

from __future__ import annotations

import os
import re
from typing import Any


class PolicyError(PermissionError):
    pass


_READ_METHODS = {"GET", "HEAD"}
# Any quoted HTTP write verb anywhere in the code, and any `method` key or assignment in any quoting.
_WRITE_LITERAL = re.compile(r"""(['"`])\s*(POST|PUT|PATCH|DELETE)\s*\1""", re.I)
_METHOD_KEY = re.compile(r"""(?:\bmethod\b|(['"`])method\1)\s*(?::|=(?!=))\s*(?:(['"`])\s*([A-Za-z]+)\s*\2|([^\s,;})]+))""", re.I)


def _cloudflare_execute(arguments: dict[str, Any]) -> None:
    """Fail closed: refuse unless every request method can be read as a literal GET or HEAD."""
    code = str(arguments.get("code", ""))
    m = _WRITE_LITERAL.search(code)
    if m:
        raise PolicyError(
            f"cloudflare_api.execute: {m.group(2).upper()} refused. Code mode is read-only on Cloudflare; "
            "deploys go through the dispatch-only pin workflow and only when the user says deploy."
        )
    for m in _METHOD_KEY.finditer(code):
        literal = m.group(3)
        if literal is None:
            raise PolicyError(
                f"cloudflare_api.execute: request method {m.group(4)!r} is not a string literal, "
                "so it cannot be checked as read-only. Write method: \"GET\"."
            )
        if literal.upper() not in _READ_METHODS:
            raise PolicyError(f"cloudflare_api.execute: method {literal!r} refused; only GET and HEAD are allowed.")


def require(action: str) -> None:
    """Agent-state gate (.agents/machine.json). run.py passes the current state's allowed actions."""
    allowed = os.environ.get("CODEMODE_AGENT_ALLOWED")
    if allowed is None:  # not started by run.py (unit tests, direct imports)
        return
    if action not in allowed.split(","):
        state = os.environ.get("CODEMODE_AGENT_STATE", "?")
        raise PolicyError(
            f"{action} is not allowed in agent state {state} (allowed: {allowed or 'nothing'}). "
            "See `python3 .agents/machine.py status`; move with `go STATE`."
        )


_GITHUB_WRITES = [
    # (method regex, path regex, action) — first match wins
    (r"PUT", r"/pulls/\d+/merge$", "merge"),
    (r"POST", r"/actions/(workflows/[^/]+/dispatches|runs/\d+/rerun)", "DISPATCH"),
    (r"POST|PATCH|PUT|DELETE", r"/pulls(/|$)|/requested_reviewers", "pr"),
    (r"POST|PATCH|PUT|DELETE", r"/issues(/|$)|/labels(/|$)|/milestones(/|$)", "docs_board"),
    (r"POST|PATCH", r"/git/refs", "branch"),
    (r"DELETE", r"/git/refs", "delete"),
]


def github_action(method: str, path: str) -> str:
    """Map a GitHub REST write to an agent-machine action, or refuse unmapped writes."""
    bare = path.split("?", 1)[0]
    for m_rx, p_rx, action in _GITHUB_WRITES:
        if re.fullmatch(m_rx, method.upper()) and re.search(p_rx, bare):
            if action == "DISPATCH":
                # Re-running CI is fixing CI on a PR; any other dispatch may be the deploy workflow.
                return "pr" if bare.endswith("/rerun") else "prod_change"
            return action
    raise PolicyError(f"github {method} {bare}: no agent-machine action mapping; add one in codemode/runtime/policy.py")


_CHECKS = {
    ("cloudflare_api", "execute"): _cloudflare_execute,
}


def check(server: str, tool: str, arguments: dict[str, Any]) -> None:
    fn = _CHECKS.get((server, tool))
    if fn is not None:
        fn(arguments)
