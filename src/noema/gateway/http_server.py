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
    fixtures = (root / "fixtures").resolve()
    if raw is None or not str(raw).strip():
        candidate = (root / _DEFAULT_ADMIN_SEED).resolve()
    else:
        given = Path(str(raw))
        candidate = given.resolve() if given.is_absolute() else (root / given).resolve()
    try:
        candidate.relative_to(fixtures)
    except ValueError as exc:
        raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/") from exc
    if not candidate.is_file():
        raise ActionError(NOT_AUTHORIZED, "seed_path must be a file under fixtures/")
    return candidate


class RequestEntityTooLarge(Exception):
    """HTTP request body exceeded the gateway cap."""


class InvalidRequest(Exception):
    """HTTP request body was not a JSON object."""


def make_handler(runtime: NoemaRuntime) -> type[BaseHTTPRequestHandler]:
    protocol = AgentProtocolV1(runtime)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: Any) -> None:  # quieter tests
            pass

        def _bearer_token(self) -> str | None:
            auth = self.headers.get("Authorization") or ""
            if auth.lower().startswith("bearer "):
                return auth[7:].strip() or None
            return self.headers.get("X-Noema-Access-Token") or None

        def _json(self, code: int, body: dict[str, Any], *, headers: dict[str, str] | None = None) -> None:
            raw = json.dumps(body, sort_keys=True).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            for key, value in _security_headers().items():
                self.send_header(key, value)
            for key, value in (headers or {}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(raw)

        def _html(self, code: int, body: str) -> None:
            raw = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            for key, value in _security_headers(html=True).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(raw)

        def _read_json(self) -> dict[str, Any]:
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError as exc:
                raise InvalidRequest("invalid Content-Length") from exc
            if length <= 0:
                return {}
            if length > MAX_REQUEST_BODY:
                raise RequestEntityTooLarge()
            data = self.rfile.read(length)
            try:
                body = json.loads(data.decode("utf-8") or "{}")
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise InvalidRequest("request body must be valid JSON") from exc
            if not isinstance(body, dict):
                raise InvalidRequest("request body must be a JSON object")
            return body

        def _require_admin(self, candidate: str | None = None) -> str | None:
            """Enforce the ADMIN role at the HTTP boundary, not in navigation."""
            cookie = self.headers.get("Cookie") or ""
            cookie_session = next(
                (
                    item.split("=", 1)[1]
                    for item in cookie.split(";")
                    if item.strip().startswith("noema_admin_session=")
                ),
                None,
            )
            session_id = self.headers.get("X-Session-Id") or candidate or cookie_session
            if not session_id:
                self._json(
                    401,
                    {
                        "error": {
                            "code": "NOT_AUTHORIZED",
                            "message": "ADMIN session required",
                            "retryable": False,
                            "details": {},
                        }
                    },
                )
                return None
            try:
                principal = runtime.get_principal(session_id)
            except ActionError:
                self._json(
                    401,
                    {
                        "error": {
                            "code": "NOT_AUTHORIZED",
                            "message": "unknown session",
                            "retryable": False,
                            "details": {},
                        }
                    },
                )
                return None
            if principal.role != Role.ADMIN:
                self._json(
                    403,
                    {
                        "error": {
                            "code": "NOT_AUTHORIZED",
                            "message": "ADMIN role required",
                            "retryable": False,
                            "details": {"required_role": "ADMIN", "role": principal.role.value},
                        }
                    },
                )
                return None
            return session_id

        def do_GET(self) -> None:  # noqa: N802
            path = urlparse(self.path).path
            try:
                # Application / spectator HTML surfaces (C14)
                if path in {"/", "/index.html"}:
                    return self._html(200, index_html())
                if path in {"/watch", "/watch/"}:
                    return self._html(200, watch_html())
                if path in {"/play", "/play/"}:
                    return self._html(200, play_html())
                if path in {"/connect", "/connect/"}:
                    return self._html(200, connect_html())
                if path in {"/study", "/study/"}:
                    return self._html(200, study_html())
                if path == "/auth/device/preview":
                    qs = parse_qs(urlparse(self.path).query)
                    code = (qs.get("user_code") or [""])[0]
                    return self._json(200, runtime.identity.preview_device(str(code)))
                if path in {"/admin/login", "/admin/login/"}:
                    return self._html(200, admin_login_html())
                if path in {"/admin", "/admin/"}:
                    if not self._require_admin():
                        return None
                    return self._html(200, admin_html())
                if path == "/admin/overview":
                    session_id = self._require_admin()
                    if not session_id:
                        return None
                    return self._json(200, runtime.admin_overview(session_id))
                if path == "/admin/verify":
                    session_id = self._require_admin()
                    if not session_id:
                        return None
                    return self._json(200, runtime.admin_verification(session_id))
                if path == "/health":
                    return self._json(200, runtime.health())
                if path == "/ready":
                    body = runtime.ready()
                    return self._json(200 if body.get("ready") else 503, body)
                if path == "/version":
                    return self._json(200, runtime.version())
                if path == "/manifest":
                    return self._json(200, runtime.runtime_manifest())
                if path == "/config":
                    # Non-secret resolved deployment config + digest only
                    return self._json(200, runtime.deployment_config_view())
                if path == "/watch/live":
                    session_id = self.headers.get("X-Session-Id")
                    if not session_id:
                        # auto spectator session for MVP convenience
                        session_id = runtime.create_session(role=Role.SPECTATOR)["session_id"]
                    return self._json(200, runtime.watch_live(session_id))
                if path.startswith("/research/frontier/audit/"):
                    session_id = self.headers.get("X-Session-Id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    audit_id = path.rsplit("/", 1)[-1]
                    rec = runtime.get_frontier_audit(audit_id)
                    if not rec:
                        return self._json(404, {"error": {"code": "NOT_FOUND", "message": audit_id}})
                    # permission check via research_view gate
                    runtime.research_view(session_id)
                    return self._json(200, rec)
                if path == "/research/view":
                    session_id = self.headers.get("X-Session-Id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.research_view(session_id))
                if path == "/research/learn/view":
                    session_id = self.headers.get("X-Session-Id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    qs = parse_qs(urlparse(self.path).query)
                    bid = (qs.get("behavior_id") or [None])[0]
                    return self._json(200, runtime.learn_view(session_id, behavior_id=bid))
                return self._json(404, {"error": {"code": "NOT_FOUND", "message": path}})
            except ActionError as exc:
                return self._json(400, {"error": exc.as_dict()})

        def do_POST(self) -> None:  # noqa: N802
            path = urlparse(self.path).path
            try:
                body = self._read_json()
                if path == "/admin/session":
                    session = runtime.create_admin_session(
                        body.get("admin_token") or self.headers.get("X-Noema-Admin-Token"),
                        principal_id=body.get("principal_id"),
                    )
                    return self._json(
                        200,
                        session,
                        headers={
                            "Set-Cookie": _admin_session_cookie(session["session_id"])
                        },
                    )
                if path == "/admin/start":
                    if not self._require_admin(body.get("session_id")):
                        return None
                    seed = resolve_admin_seed_path(body.get("seed_path") if isinstance(body.get("seed_path"), str) else None)
                    result = runtime.start_world(seed)
                    return self._json(200, result)
                if path == "/admin/genesis/preview":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    session_id = self._require_admin(session_id)
                    if not session_id:
                        return None
                    return self._json(
                        200,
                        runtime.genesis_preview(
                            session_id,
                            world_name=body.get("world_name") or "Aster Reach",
                            world_seed=body.get("world_seed") or "seed.default",
                            profile_id=body.get("profile_id") or "FRACTURED_OLD_WORLD",
                            story_seed_ids=body.get("story_seed_ids"),
                        ),
                    )
                if path == "/admin/genesis/activate":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    session_id = self._require_admin(session_id)
                    if not session_id:
                        return None
                    return self._json(200, runtime.genesis_activate(session_id, body.get("genesis_id") or ""))
                if path == "/auth/human":
                    # Supabase access_token, or local {dev_subject} when Supabase unset
                    if body.get("access_token"):
                        return self._json(200, runtime.identity.bind_human_from_supabase_token(str(body["access_token"])))
                    if body.get("dev_subject"):
                        return self._json(
                            200,
                            runtime.identity.bind_human_dev(
                                str(body["dev_subject"]),
                                handle=body.get("handle"),
                            ),
                        )
                    return self._json(
                        400,
                        {"error": {"code": "INVALID_REQUEST", "message": "access_token or dev_subject required"}},
                    )
                if path == "/auth/device":
                    return self._json(
                        200,
                        runtime.identity.start_device_enrollment(
                            scopes=body.get("scopes"),
                            metadata=body.get("metadata") or body.get("controller_metadata"),
                        ),
                    )
                if path == "/auth/device/approve":
                    token = body.get("access_token") or self._bearer_token()
                    return self._json(
                        200,
                        runtime.identity.approve_device(
                            user_code=str(body.get("user_code") or ""),
                            player_id=body.get("player_id"),
                            approver_access_token=str(token) if token else None,
                            approver_account_id=body.get("account_id"),
                        ),
                    )
                if path == "/auth/device/deny":
                    token = body.get("access_token") or self._bearer_token()
                    return self._json(
                        200,
                        runtime.identity.deny_device(
                            user_code=str(body.get("user_code") or ""),
                            approver_access_token=str(token) if token else None,
                        ),
                    )
                if path == "/auth/device/token":
                    return self._json(
                        200,
                        runtime.identity.poll_device_token(str(body.get("device_code") or "")),
                    )
                if path == "/auth/token/refresh":
                    return self._json(
                        200,
                        runtime.identity.refresh(str(body.get("refresh_token") or "")),
                    )
                if path == "/auth/controller/revoke":
                    token = body.get("access_token") or self._bearer_token()
                    if not token:
                        return self._json(
                            401,
                            {
                                "error": {
                                    "code": "NOT_AUTHORIZED",
                                    "message": "controller token required to revoke",
                                    "retryable": False,
                                    "details": {},
                                }
                            },
                        )
                    return self._json(
                        200,
                        runtime.identity.revoke_controller(
                            str(body.get("controller_id") or ""),
                            access_token=str(token) if token else None,
                        ),
                    )
                if path == "/session":
                    role = Role(body.get("role") or "PLAYER")
                    if role == Role.ADMIN:
                        sess = runtime.create_admin_session(
                            body.get("admin_token") or self.headers.get("X-Noema-Admin-Token"),
                        )
                    elif body.get("access_token") or body.get("controller_token"):
                        sess = runtime.create_session_from_controller_token(
                            str(body.get("access_token") or body.get("controller_token"))
                        )
                    elif role == Role.SPECTATOR:
                        sess = runtime.create_session(role=Role.SPECTATOR)
                    else:
                        return self._json(
                            401,
                            {
                                "error": {
                                    "code": "NOT_AUTHORIZED",
                                    "message": "access_token required to mint a privileged session",
                                    "retryable": False,
                                    "details": {},
                                }
                            },
                        )
                    return self._json(200, sess)
                if path == "/play/action":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    result = runtime.apply_player_action(session_id, body.get("action") or body)
                    return self._json(200, result)
                if path == "/play/observe":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.observe(session_id, body.get("agent_id")))
                if path == "/protocol/v1":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    # AUTH establishes session; others need header
                    if body.get("type") == "AUTH":
                        resp = protocol.handle(body)
                        if resp.get("type") == "AUTH_ACK":
                            session_id = resp.get("body", {}).get("session_id")
                        return self._json(200, {**resp, "session_id": session_id})
                    resp = protocol.handle(body, session_id=session_id)
                    return self._json(200, resp)
                if path == "/research/frontier/run":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    templates = body.get("templates") or {}
                    result = runtime.run_frontier(
                        session_id,
                        body.get("request") or body,
                        templates,
                        inject=bool(body.get("inject")),
                        explicit_mutation_plans=body.get("explicit_mutation_plans"),
                        follow_on=body.get("follow_on"),
                    )
                    return self._json(200, result)
                if path == "/research/observatory/run":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    pre_w = body.get("pre_window")
                    post_w = body.get("post_window")
                    result = runtime.run_observatory(
                        session_id,
                        trajectory=body.get("trajectory"),
                        agent_id=body.get("agent_id"),
                        detectors=body.get("detectors"),
                        freeze_baseline=body.get("baseline"),
                        pre_context=body.get("pre_context"),
                        post_context=body.get("post_context"),
                        pre_window=tuple(pre_w) if pre_w else None,
                        post_window=tuple(post_w) if post_w else None,
                        contradiction_set=body.get("contradiction_set"),
                    )
                    return self._json(200, result)
                if path == "/research/lab/run":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    result = runtime.run_lab(
                        session_id,
                        intent=body.get("intent"),
                        experiment=body.get("experiment"),
                        interventions=body.get("interventions"),
                        plan=body.get("plan"),
                        agent_id=body.get("agent_id"),
                        max_runs=body.get("max_runs"),
                        confounds=body.get("confounds"),
                    )
                    return self._json(200, result)
                if path == "/research/lab/capture-gate":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.lab_capture_gate(session_id, body.get("lab_result")))
                if path == "/research/compiler/capture":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    result = runtime.capture_as_test(
                        session_id,
                        intent=body.get("intent") or body,
                        lab_result=body.get("lab_result"),
                        unit_manifest=body.get("unit_manifest"),
                        max_oracle_calls=body.get("max_oracle_calls"),
                    )
                    return self._json(200, result)
                if path == "/research/learn/rebuild":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.rebuild_learn(session_id, sources=body.get("sources")))
                if path == "/research/learn/view":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.learn_view(session_id, behavior_id=body.get("behavior_id")))
                if path == "/research/deep-time/ingest":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.deep_time_ingest(session_id, body.get("records") or body))
                return self._json(404, {"error": {"code": "NOT_FOUND", "message": path}})
            except RequestEntityTooLarge:
                return self._json(
                    413,
                    {
                        "error": {
                            "code": "PAYLOAD_TOO_LARGE",
                            "message": f"request body exceeds {MAX_REQUEST_BODY} bytes",
                            "retryable": False,
                            "details": {},
                        }
                    },
                )
            except InvalidRequest as exc:
                return self._json(
                    400,
                    {
                        "error": {
                            "code": "INVALID_REQUEST",
                            "message": str(exc),
                            "retryable": False,
                            "details": {},
                        }
                    },
                )
            except ActionError as exc:
                return self._json(400, {"error": exc.as_dict()})
            except Exception as exc:  # pragma: no cover
                return self._json(500, {"error": {"code": "INTERNAL", "message": str(type(exc).__name__)}})


    return Handler


def serve(runtime: NoemaRuntime, host: str = "127.0.0.1", port: int = 8080) -> ThreadingHTTPServer:
    handler = make_handler(runtime)
    httpd = ThreadingHTTPServer((host, port), handler)
    return httpd
