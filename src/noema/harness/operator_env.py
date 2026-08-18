"""Load ~/.config/noema/operator.env. Never log values."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

KEY_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")
DEFAULT_OPERATOR_ENV = Path.home() / ".config/noema/operator.env"


def parse_operator_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if KEY_RE.match(key) and val:
            out[key] = val
    return out


def operator_env_paths(cwd: Path | None = None, env: Mapping[str, str] | None = None) -> list[Path]:
    env = env or os.environ
    extra = env.get("NOEMA_OPERATOR_ENV")
    if extra:
        return [Path(extra)]
    paths = [DEFAULT_OPERATOR_ENV]
    if cwd:
        paths.append(Path(cwd) / ".env")
    return paths


def load_operator_env(cwd: Path | None = None, env: Mapping[str, str] | None = None) -> dict[str, str]:
    values: dict[str, str] = {}
    for path in operator_env_paths(cwd, env):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        parsed = parse_operator_env(text)
        for key, val in parsed.items():
            values.setdefault(key, val)
    return values


def classify_admin_material(raw: str) -> str | None:
    token = (raw or "").strip()
    if not token:
        return None
    parts = token.split(".")
    if len(parts) == 3 and all(parts):
        return "admin_jwt"
    if len(token) >= 8:
        return "operator_secret"
    return None


@dataclass(frozen=True)
class IsolatedAttach:
    player_token: str
    admin_jwt: str
    source: str


class AttachError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def resolve_isolated_attach(
    base: str,
    *,
    env: Mapping[str, str] | None = None,
    cwd: Path | None = None,
    http=None,
    handle: str = "tester",
) -> IsolatedAttach:
    """Player token + signed admin JWT. Mints from operator.env when needed."""
    from noema.harness.transport import default_http

    env = dict(env or os.environ)
    files = load_operator_env(cwd, env)
    player = env.get("NOEMA_TOKEN") or files.get("NOEMA_TOKEN") or ""
    admin = (
        env.get("NOEMA_ADMIN_TOKEN")
        or env.get("ADMIN_TOKEN")
        or env.get("ADMIN_OPERATOR_TOKEN")
        or files.get("NOEMA_ADMIN_TOKEN")
        or files.get("ADMIN_TOKEN")
        or files.get("ADMIN_OPERATOR_TOKEN")
        or ""
    )
    kind = classify_admin_material(admin)
    if not kind:
        raise AttachError("UNCONFIGURED", "put ADMIN_OPERATOR_TOKEN in ~/.config/noema/operator.env")
    from noema.harness.transport import call_http

    raw_http = http or default_http

    def transport(method, url, body=None, token=None):
        return call_http(
            raw_http,
            method,
            url,
            body,
            token,
            {"user-agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"},
        )
    if kind == "admin_jwt":
        admin_jwt = admin
        source = "admin_jwt"
    else:
        sess = transport(
            "POST",
            f"{base.rstrip('/')}/v1/admin/session",
            {"admin_token": admin},
            None,
        )
        admin_jwt = str(sess.get("access_token") or "")
        if not admin_jwt:
            raise AttachError("ADMIN_SESSION_FAILED", "admin session did not return access_token")
        source = "operator_secret"
    if not player:
        minted = transport(
            "POST",
            f"{base.rstrip('/')}/v1/admin/controller-token",
            {"handle": handle, "controller_type": "agent", "expires_in": 1800},
            admin_jwt,
        )
        player = str(minted.get("access_token") or "")
        if not player:
            raise AttachError("PLAYER_MINT_FAILED", "controller-token did not return access_token")
        source = source + "+mint"
    return IsolatedAttach(player_token=player, admin_jwt=admin_jwt, source=source)
