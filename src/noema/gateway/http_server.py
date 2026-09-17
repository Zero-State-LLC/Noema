"""Minimal stdlib HTTP gateway for Chamber MVP + operator/WATCH HTML shells."""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from noema.actions.errors import ActionError, NOT_AUTHORIZED
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.gateway.ui import (
    admin_html,
    admin_login_html,
    connect_html,
    index_html,
    play_html,
    study_html,
    watch_html,
)
from noema.protocol.agent_v1 import AgentProtocolV1

MAX_REQUEST_BODY = 256 * 1024

_HTML_CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
)


def _security_headers(*, html: bool = False) -> dict[str, str]:
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
    }
    if html:
        headers["Content-Security-Policy"] = _HTML_CSP
    return headers


_LOCAL_ENVS = {"local", "test", "dev"}
_DEFAULT_ADMIN_SEED = Path("fixtures") / "v01-seed" / "world-seed.json"


def _admin_session_cookie(session_id: str) -> str:
    parts = [f"noema_admin_session={session_id}", "Path=/", "HttpOnly", "SameSite=Strict"]
    env = (os.environ.get("NOEMA_ENV") or "local").lower()
    if env not in _LOCAL_ENVS:
        parts.append("Secure")
    return "; ".join(parts)


def resolve_admin_seed_path(raw: str | None, *, cwd: Path | None = None) -> Path:
    """Confine /admin/start seed_path to files under fixtures/."""
    root = (cwd or Path.cwd()).resolve()
    fixtures_real = os.path.realpath(root / "fixtures")
    if raw is None or not str(raw).strip():
        # Build only under fixtures — no user-controlled path segments.
        safe = Path(fixtures_real) / "v01-seed" / "world-seed.json"
    else:
        given = Path(str(raw))
        # Resolve then re-join under fixtures so file ops use a sanitized path.
        if given.is_absolute():
            candidate = os.path.realpath(given)
        else:
            candidate = os.path.realpath(root / given)
        try:
            if os.path.commonpath([fixtures_real, candidate]) != fixtures_real:
                raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/")
        except ValueError as exc:
            raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/") from exc
        relative = os.path.relpath(candidate, fixtures_real)
        if relative.startswith("..") or os.path.isabs(relative):
            raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/")
        safe = Path(fixtures_real).joinpath(*Path(relative).parts)
    if not safe.is_file():
        raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/")
    return safe
