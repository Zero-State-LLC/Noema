"""Minimal stdlib HTTP gateway for Chamber MVP + operator/WATCH HTML shells."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.gateway.ui import index_html, play_html, study_html, watch_html
from noema.protocol.agent_v1 import AgentProtocolV1


def make_handler(runtime: NoemaRuntime) -> type[BaseHTTPRequestHandler]:
    protocol = AgentProtocolV1(runtime)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: Any) -> None:  # quieter tests
            pass

        def _json(self, code: int, body: dict[str, Any]) -> None:
            raw = json.dumps(body, sort_keys=True).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def _html(self, code: int, body: str) -> None:
            raw = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def _read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0:
                return {}
            data = self.rfile.read(length)
            return json.loads(data.decode("utf-8") or "{}")

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
                if path in {"/study", "/study/"}:
                    return self._html(200, study_html())
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
                if path == "/admin/start":
                    seed = body.get("seed_path") or str(Path.cwd() / "fixtures" / "v01-seed" / "world-seed.json")
                    result = runtime.start_world(seed)
                    return self._json(200, result)
                if path == "/admin/genesis/preview":
                    session_id = self.headers.get("X-Session-Id") or body.get("session_id")
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
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
                    if not session_id:
                        return self._json(401, {"error": {"code": "NOT_AUTHORIZED", "message": "session required"}})
                    return self._json(200, runtime.genesis_activate(session_id, body.get("genesis_id") or ""))
                if path == "/session":
                    role = Role(body.get("role") or "PLAYER")
                    sess = runtime.create_session(role=role, agent_id=body.get("agent_id"))
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
            except ActionError as exc:
                return self._json(400, {"error": exc.as_dict()})
            except Exception as exc:  # pragma: no cover
                return self._json(500, {"error": {"code": "INTERNAL", "message": str(type(exc).__name__)}})


    return Handler


def serve(runtime: NoemaRuntime, host: str = "127.0.0.1", port: int = 8080) -> ThreadingHTTPServer:
    handler = make_handler(runtime)
    httpd = ThreadingHTTPServer((host, port), handler)
    return httpd
