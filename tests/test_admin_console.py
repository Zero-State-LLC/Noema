"""Focused acceptance coverage for the graphical ADMIN management console."""

from __future__ import annotations

import json
import threading
import urllib.error
import urllib.request
import http.cookiejar
from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.gateway.http_server import serve
from noema.gateway.ui import admin_html, admin_login_html, play_html, study_html, watch_html
from noema.research.genesis.engine import profile_ids

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "fixtures" / "v01-seed" / "world-seed.json"


def _request(opener, url: str, *, method: str = "GET", body: dict | None = None, headers: dict[str, str] | None = None):
    raw = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=raw, method=method, headers=headers or {})
    if raw is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with opener.open(request, timeout=5) as response:
            return response.status, dict(response.headers), json.loads(response.read().decode("utf-8")) if "json" in response.headers.get("Content-Type", "") else response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        payload = error.read().decode("utf-8")
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            pass
        return error.code, dict(error.headers), payload


@pytest.fixture
def running_runtime(tmp_path: Path):
    runtime = NoemaRuntime(db_path=tmp_path / "admin.db", admin_token="operator-test-token")
    runtime.start_world(SEED)
    httpd = serve(runtime, host="127.0.0.1", port=0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    base = f"http://{httpd.server_address[0]}:{httpd.server_address[1]}"
    try:
        yield runtime, base
    finally:
        httpd.shutdown()
        runtime.store.close()


def test_admin_shell_is_graphical_and_keeps_player_ontology_unified():
    html = admin_html()
    assert "management console" in html
    for section in ("Overview", "World", "Genesis", "Players", "Research", "Backups", "Evidence", "System", "Audit"):
        assert section in html
    assert "Human-controlled" in html
    assert "Agent-controlled" in html
    assert "Total players" in html
    assert "world-start" in html
    assert "/admin/start" in html
    assert "Restore unavailable" in html
    assert "I understand that activation is consequential" in html
    assert "PlayersAgents" not in html
    assert "<h2>Agents</h2>" not in html
    assert "operator token" in admin_login_html().lower()


def test_public_surfaces_remain_text_first_and_admin_free():
    for html in (play_html(), watch_html(), study_html()):
        assert "/admin/start" not in html
        assert "management console" not in html
    assert "command-form" in play_html()
    assert "map-list" in watch_html()
    assert "Rebuild LEARN" in study_html()


def test_admin_http_authorization_and_cookie_login(running_runtime):
    runtime, base = running_runtime
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    status, _, body = _request(opener, base + "/admin")
    assert status == 401
    assert body["error"]["code"] == "NOT_AUTHORIZED"

    status, _, body = _request(opener, base + "/session", method="POST", body={"role": "ADMIN"})
    assert status == 400
    assert body["error"]["code"] == "NOT_AUTHORIZED"

    for role in (Role.PLAYER, Role.AGENT, Role.SPECTATOR, Role.RESEARCHER):
        session = runtime.create_session(role=role, agent_id="human.player" if role == Role.PLAYER else None)
        status, _, body = _request(opener, base + "/admin", headers={"X-Session-Id": session["session_id"]})
        assert status == 403
        assert body["error"]["details"]["required_role"] == "ADMIN"
        status, _, body = _request(
            opener,
            base + "/admin/overview",
            headers={"X-Session-Id": session["session_id"]},
        )
        assert status == 403
        assert body["error"]["code"] == "NOT_AUTHORIZED"

    status, headers, session = _request(opener, base + "/admin/session", method="POST", body={"admin_token": "operator-test-token"})
    assert status == 200
    assert session["role"] == "ADMIN"
    assert "operator-test-token" not in json.dumps(session)
    assert "noema_admin_session=" in headers.get("Set-Cookie", "")

    status, _, html = _request(opener, base + "/admin")
    assert status == 200
    assert "management console" in html

    status, _, overview = _request(opener, base + "/admin/overview")
    assert status == 200
    assert overview["schema_version"] == "admin-overview/1.0"
    assert "configuration" in overview
    assert "operator-test-token" not in json.dumps(overview)


def test_admin_overview_counts_agents_inside_total_players(running_runtime):
    runtime, base = running_runtime
    from noema.auth.roles import Role

    runtime.create_session(role=Role.PLAYER, agent_id="human.controller")
    runtime.create_session(role=Role.AGENT, agent_id="agent.controller")
    admin = runtime.create_admin_session("operator-test-token")

    status, _, overview = _request(
        urllib.request.build_opener(),
        base + "/admin/overview",
        headers={"X-Session-Id": admin["session_id"]},
    )
    assert status == 200
    assert overview["players"] == {"total": 2, "human_controlled": 1, "agent_controlled": 1}
    assert {item["world_ontology"] for item in overview["sessions"] if item["is_player"]} == {"PLAYER"}
    assert {item["controller"] for item in overview["sessions"] if item["is_player"]} == {"HUMAN", "AGENT"}
    assert "agents" not in overview["players"]


def test_genesis_and_verification_are_admin_gated(running_runtime):
    runtime, base = running_runtime
    from noema.auth.roles import Role

    player = runtime.create_session(role=Role.PLAYER, agent_id="player.one")
    admin = runtime.create_admin_session("operator-test-token")
    profile = profile_ids()[0]
    opener = urllib.request.build_opener()

    status, _, body = _request(
        opener,
        base + "/admin/genesis/preview",
        method="POST",
        body={"session_id": player["session_id"], "profile_id": profile},
    )
    assert status == 403
    assert body["error"]["code"] == "NOT_AUTHORIZED"

    status, _, body = _request(
        opener,
        base + "/admin/start",
        method="POST",
        body={"session_id": player["session_id"]},
    )
    assert status == 403
    assert body["error"]["code"] == "NOT_AUTHORIZED"

    status, _, preview = _request(
        opener,
        base + "/admin/genesis/preview",
        method="POST",
        body={
            "session_id": admin["session_id"],
            "world_name": "Operator Preview",
            "world_seed": "seed.admin-test",
            "profile_id": profile,
            "story_seed_ids": [],
        },
    )
    assert status == 200
    assert preview["result"]["status"] == "PREVIEW"
    assert preview["result"]["config_frozen"] is False

    status, _, verification = _request(
        opener,
        base + "/admin/verify",
        headers={"X-Session-Id": admin["session_id"]},
    )
    assert status == 200
    assert verification["scope"] == "in_process_runtime_checks"
    assert "Evidence" in verification["checks"]
    assert verification["checks"]["Evidence"] == "CLI_ONLY"


def test_empty_runtime_admin_projection_is_explicit(tmp_path: Path):
    runtime = NoemaRuntime(db_path=tmp_path / "empty-admin.db", admin_token="operator-test-token")
    admin = runtime.create_admin_session("operator-test-token")
    try:
        overview = runtime.admin_overview(admin["session_id"])
        assert overview["world"] is None
        assert overview["readiness"]["ready"] is False
        assert overview["players"]["total"] == 0
        assert overview["capabilities"]["backup"] is False
    finally:
        runtime.store.close()


def test_direct_runtime_admin_token_rejects_invalid_values(tmp_path: Path):
    runtime = NoemaRuntime(db_path=tmp_path / "token.db", admin_token="operator-test-token")
    try:
        with pytest.raises(ActionError, match="invalid ADMIN"):
            runtime.create_admin_session("wrong")
        with pytest.raises(ActionError, match="not configured"):
            NoemaRuntime(db_path=tmp_path / "no-token.db").create_admin_session("operator-test-token")
    finally:
        runtime.store.close()
