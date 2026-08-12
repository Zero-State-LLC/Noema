"""Identity plane: Player/Controller, Supabase-style JWT, device enrollment."""

from __future__ import annotations

import json
import time
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.auth.jwt_util import mint_hs256, verify_hs256
from noema.gateway.http_server import make_handler
from noema.protocol.agent_v1 import AgentProtocolV1


def test_jwt_roundtrip():
    secret = "test-secret"
    token = mint_hs256({"sub": "u1", "exp": int(time.time()) + 60}, secret)
    claims = verify_hs256(token, secret)
    assert claims["sub"] == "u1"


def test_human_dev_bind_and_device_enrollment(tmp_path: Path):
    db = tmp_path / "id.sqlite3"
    rt = NoemaRuntime(db_path=db)
    human = rt.identity.bind_human_dev("alice@example.com", handle="alice")
    assert human["player_id"].startswith("player.")
    assert human["agent_id"] == "agent.alice"
    assert human["access_token"]
    assert "noema.action.submit" in human["scopes"]

    device = rt.identity.start_device_enrollment(
        metadata={"framework": "hermes", "model": "local"},
    )
    assert device["user_code"]
    assert device["device_code"]

    approved = rt.identity.approve_device(
        user_code=device["user_code"],
        player_id=human["player_id"],
    )
    assert approved["status"] == "approved"
    assert approved["controller_id"].startswith("ctrl.")

    pending = rt.identity.poll_device_token(device["device_code"])
    assert pending["status"] == "approved"
    assert pending["access_token"]
    agent_token = pending["access_token"]

    bound = rt.identity.resolve_access_token(agent_token)
    assert bound["player_id"] == human["player_id"]
    assert bound["controller_id"] == approved["controller_id"]

    # refresh rotates
    refreshed = rt.identity.refresh(pending["refresh_token"])
    assert refreshed["access_token"] != agent_token

    # revoke controller
    rt.identity.revoke_controller(approved["controller_id"])
    try:
        rt.identity.resolve_access_token(refreshed["access_token"])
        assert False, "expected revoke"
    except Exception as exc:
        assert "revoked" in str(exc).lower() or "controller" in str(exc).lower() or "NOT_AUTHORIZED" in str(exc)


def test_protocol_auth_with_controller_token(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "p.sqlite3")
    seed = Path("fixtures/v01-seed/world-seed.json")
    if seed.is_file():
        rt.start_world(seed)
    human = rt.identity.bind_human_dev("bob")
    device = rt.identity.start_device_enrollment()
    rt.identity.approve_device(user_code=device["user_code"], player_id=human["player_id"])
    tokens = rt.identity.poll_device_token(device["device_code"])

    proto = AgentProtocolV1(rt)
    hello = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "HELLO",
            "request_id": "r1",
            "body": {"supported_protocols": ["agent-protocol/v1"]},
        }
    )
    assert hello["type"] == "HELLO_ACK"
    assert "controller-token" in hello["body"]["auth_methods"]

    auth = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "AUTH",
            "request_id": "r2",
            "body": {"access_token": tokens["access_token"]},
        }
    )
    assert auth["type"] == "AUTH_ACK"
    assert auth["body"]["player_id"] == human["player_id"]
    assert auth["body"]["controller_id"] == tokens["controller_id"]
    assert auth["body"]["agent_id"] == human["agent_id"]

    # player switch denied
    bad = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "AUTH",
            "request_id": "r3",
            "body": {"access_token": tokens["access_token"], "agent_id": "agent.other"},
        }
    )
    assert bad["type"] == "ERROR"
    assert bad.get("error", {}).get("code") in ("FORBIDDEN", "NOT_AUTHORIZED") or "FORBIDDEN" in json.dumps(bad)


def test_http_auth_routes(tmp_path: Path):
    from http.server import ThreadingHTTPServer
    import threading
    import urllib.request

    rt = NoemaRuntime(db_path=tmp_path / "h.sqlite3")
    handler = make_handler(rt)
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{port}"

    def post(path: str, body: dict) -> dict:
        req = urllib.request.Request(
            base + path,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    try:
        human = post("/auth/human", {"dev_subject": "carol", "handle": "carol"})
        assert human["player_id"]
        dev = post("/auth/device", {"metadata": {"framework": "openclaw"}})
        post(
            "/auth/device/approve",
            {"user_code": dev["user_code"], "player_id": human["player_id"]},
        )
        tok = post("/auth/device/token", {"device_code": dev["device_code"]})
        assert tok["access_token"]
        sess = post("/session", {"access_token": tok["access_token"]})
        assert sess["controller_id"] == tok["controller_id"]
    finally:
        httpd.shutdown()
