"""Identity plane: Player/Controller, Supabase-style JWT, device enrollment."""

from __future__ import annotations

import json
import time
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.auth.jwt_util import (
    JwtError,
    generate_es256_pair,
    mint_es256,
    mint_hs256,
    reset_jwks_cache,
    verify_hs256,
    verify_jwt,
)
from noema.gateway.http_server import make_handler
from noema.protocol.agent_v1 import AgentProtocolV1


def test_jwt_roundtrip():
    secret = "test-secret"
    token = mint_hs256({"sub": "u1", "exp": int(time.time()) + 60}, secret)
    claims = verify_hs256(token, secret)
    assert claims["sub"] == "u1"


def test_jwt_es256_jwks_accept_and_reject():
    reset_jwks_cache()
    d, jwk, kid = generate_es256_pair()
    claims_in = {
        "sub": "user-es256",
        "aud": "authenticated",
        "iss": "https://example.supabase.co/auth/v1",
        "exp": int(time.time()) + 60,
    }
    token = mint_es256(claims_in, d, kid)
    claims = verify_jwt(token, jwks={"keys": [jwk]}, audience="authenticated")
    assert claims["sub"] == "user-es256"

    hs = mint_hs256({"sub": "hs", "aud": "authenticated", "exp": int(time.time()) + 60}, "legacy")
    assert verify_jwt(hs, secret="legacy", audience="authenticated")["sub"] == "hs"

    try:
        verify_hs256(token, "legacy")
        assert False, "HS256-only helper must still reject ES256"
    except JwtError as exc:
        assert str(exc) == "unsupported alg ES256"

    bad_parts = token.split(".")
    sig = list(bad_parts[2])
    sig[0] = "A" if sig[0] != "A" else "B"
    bad_parts[2] = "".join(sig)
    try:
        verify_jwt(".".join(bad_parts), jwks={"keys": [jwk]}, audience="authenticated")
        assert False, "bad signature must fail"
    except JwtError as exc:
        assert str(exc) == "bad signature"

    none_header = mint_hs256({"sub": "n", "exp": int(time.time()) + 60}, "x")
    none = none_header.split(".")
    import base64
    import json as _json

    none[0] = base64.urlsafe_b64encode(_json.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    try:
        verify_jwt(".".join(none), secret="x", jwks={"keys": [jwk]})
        assert False, "alg none must fail"
    except JwtError as exc:
        assert "unsupported alg none" in str(exc)

    junk_sig = token.rsplit(".", 1)[0] + ".%%%not-base64%%%"
    try:
        verify_jwt(junk_sig, jwks={"keys": [jwk]}, audience="authenticated")
        assert False, "illegal signature encoding must be JwtError"
    except JwtError as exc:
        assert str(exc) == "malformed token encoding"

    reset_jwks_cache()

    def boom(_url: str):
        raise TimeoutError("jwks timed out")

    try:
        verify_jwt(token, jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json", fetch=boom)
        assert False, "JWKS fetch failure must be JwtError"
    except JwtError as exc:
        assert str(exc) == "jwks fetch failed"


def test_bind_human_from_supabase_es256_jwks(tmp_path: Path):
    reset_jwks_cache()
    d, jwk, kid = generate_es256_pair()
    token = mint_es256(
        {
            "sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "aud": "authenticated",
            "iss": "https://example.supabase.co/auth/v1",
            "email": "ada@example.com",
            "exp": int(time.time()) + 60,
        },
        d,
        kid,
    )
    fetches = {"n": 0}

    def fetch(url: str):
        fetches["n"] += 1
        assert url.endswith("/auth/v1/.well-known/jwks.json")
        return {"keys": [jwk]}

    rt = NoemaRuntime(db_path=tmp_path / "es256.sqlite3")
    rt.identity.supabase_url = "https://example.supabase.co"
    rt.identity.supabase_jwt_secret = "legacy-unused-for-es256"
    rt.identity._jwks_fetch = fetch
    bound = rt.identity.bind_human_from_supabase_token(token)
    assert bound["player_id"].startswith("player.")
    assert bound["agent_id"]
    assert "noema.action.submit" in bound["scopes"]
    assert "noema.world.admin" not in bound["scopes"]
    assert fetches["n"] == 1
    rt.identity.bind_human_from_supabase_token(token)
    assert fetches["n"] == 1


def test_bind_human_from_supabase_hs256_still_works(tmp_path: Path):
    secret = "legacy-jwt-secret"
    token = mint_hs256(
        {
            "sub": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
            "aud": "authenticated",
            "email": "hs@example.com",
            "exp": int(time.time()) + 60,
        },
        secret,
    )
    rt = NoemaRuntime(db_path=tmp_path / "hs256.sqlite3")
    rt.identity.supabase_jwt_secret = secret
    bound = rt.identity.bind_human_from_supabase_token(token)
    assert bound["player_id"].startswith("player.")
    assert "noema.world.admin" not in bound["scopes"]


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

    preview = rt.identity.preview_device(device["user_code"])
    assert preview["status"] == "pending"
    assert preview["framework"] == "hermes"

    approved = rt.identity.approve_device(
        user_code=device["user_code"],
        approver_access_token=human["access_token"],
    )
    assert approved["status"] == "approved"
    assert approved["controller_id"].startswith("ctrl.")
    assert approved["player_id"] == human["player_id"]

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

    # revoke controller — owner token required
    rt.identity.revoke_controller(approved["controller_id"], access_token=human["access_token"])
    try:
        rt.identity.resolve_access_token(refreshed["access_token"])
        assert False, "expected revoke"
    except Exception as exc:
        assert "revoked" in str(exc).lower() or "controller" in str(exc).lower() or "NOT_AUTHORIZED" in str(exc)


def test_approve_requires_human_token_when_not_dev(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "production")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "prod-secret")
    rt = NoemaRuntime(db_path=tmp_path / "prod.sqlite3")
    # force non-dev path
    rt.identity.allow_dev_human = False
    device = rt.identity.start_device_enrollment()
    try:
        rt.identity.approve_device(user_code=device["user_code"], player_id="player.x")
        assert False, "expected auth failure"
    except Exception as exc:
        assert "token" in str(exc).lower() or "NOT_AUTHORIZED" in str(exc)


def test_protocol_auth_with_controller_token(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "p.sqlite3")
    seed = Path("fixtures/v01-seed/world-seed.json")
    if seed.is_file():
        rt.start_world(seed)
    human = rt.identity.bind_human_dev("bob")
    device = rt.identity.start_device_enrollment()
    rt.identity.approve_device(
        user_code=device["user_code"],
        approver_access_token=human["access_token"],
    )
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
            {
                "user_code": dev["user_code"],
                "access_token": human["access_token"],
            },
        )
        tok = post("/auth/device/token", {"device_code": dev["device_code"]})
        assert tok["access_token"]
        sess = post("/session", {"access_token": tok["access_token"]})
        assert sess["controller_id"] == tok["controller_id"]

        # connect page is public HTML and paints untrusted scopes via textContent
        req = urllib.request.Request(base + "/connect")
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode()
            assert "Approve an agent connection" in html
            assert "user-code" in html
            assert ".innerHTML" not in html
            assert "e.preview.replaceChildren" in html
            assert "scopes.textContent" in html
    finally:
        httpd.shutdown()


def test_http_session_requires_credentials(tmp_path: Path):
    from http.server import ThreadingHTTPServer
    import threading
    import urllib.error
    import urllib.request

    rt = NoemaRuntime(db_path=tmp_path / "sess.sqlite3")
    handler = make_handler(rt)
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        req = urllib.request.Request(
            base + "/session",
            data=json.dumps({"role": "PLAYER", "agent_id": "agent.x"}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req)
            assert False, "unauthenticated privileged session must fail"
        except urllib.error.HTTPError as exc:
            assert exc.code == 401
            body = json.loads(exc.read().decode())
            assert body["error"]["code"] == "NOT_AUTHORIZED"
    finally:
        httpd.shutdown()


def test_http_controller_revoke_requires_credentials(tmp_path: Path):
    from http.server import ThreadingHTTPServer
    import threading
    import urllib.error
    import urllib.request

    rt = NoemaRuntime(db_path=tmp_path / "revoke.sqlite3")
    handler = make_handler(rt)
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        req = urllib.request.Request(
            base + "/auth/controller/revoke",
            data=json.dumps({"controller_id": "controller.missing"}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req)
            assert False, "unauthenticated controller revocation must fail"
        except urllib.error.HTTPError as exc:
            assert exc.code == 401
            body = json.loads(exc.read().decode())
            assert body["error"]["code"] == "NOT_AUTHORIZED"
    finally:
        httpd.shutdown()


def test_http_rejects_oversized_request_body(tmp_path: Path):
    from http.server import ThreadingHTTPServer
    import threading
    import urllib.error
    import urllib.request

    from noema.gateway.http_server import MAX_REQUEST_BODY

    rt = NoemaRuntime(db_path=tmp_path / "big.sqlite3")
    handler = make_handler(rt)
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        payload = b"{" + b"a" * (MAX_REQUEST_BODY + 8) + b"}"
        req = urllib.request.Request(
            base + "/auth/human",
            data=payload,
            headers={"Content-Type": "application/json", "Content-Length": str(len(payload))},
            method="POST",
        )
        try:
            urllib.request.urlopen(req)
            assert False, "oversized body must fail"
        except urllib.error.HTTPError as exc:
            assert exc.code == 413
            body = json.loads(exc.read().decode())
            assert body["error"]["code"] == "PAYLOAD_TOO_LARGE"
    finally:
        httpd.shutdown()


def test_revoke_requires_owner_token(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "rev.sqlite3")
    owner = rt.identity.bind_human_dev("owner@example.com", handle="owner")
    other = rt.identity.bind_human_dev("other@example.com", handle="other")
    device = rt.identity.start_device_enrollment()
    approved = rt.identity.approve_device(
        user_code=device["user_code"],
        approver_access_token=owner["access_token"],
    )
    try:
        rt.identity.revoke_controller(approved["controller_id"])
        assert False, "missing token must fail"
    except Exception as exc:
        assert "token" in str(exc).lower() or "NOT_AUTHORIZED" in str(exc)
    try:
        rt.identity.revoke_controller(approved["controller_id"], access_token=other["access_token"])
        assert False, "cross-player revoke must fail"
    except Exception as exc:
        assert "NOT_AUTHORIZED" in str(exc) or "another" in str(exc).lower()
    out = rt.identity.revoke_controller(approved["controller_id"], access_token=owner["access_token"])
    assert out["revoked"] is True


def test_deny_device_requires_owner_authorization(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "deny.sqlite3")
    owner = rt.identity.bind_human_dev("denial-owner@example.com", handle="downer")
    other = rt.identity.bind_human_dev("denial-other@example.com", handle="dother")
    device = rt.identity.start_device_enrollment()
    rec = rt.identity._find_device_by_user_code(device["user_code"])
    assert rec is not None
    rec["player_id"] = owner["player_id"]
    rt.identity.store.identity_upsert_device_code(rec)
    try:
        rt.identity.deny_device(user_code=device["user_code"])
        assert False, "unauthenticated deny must fail"
    except Exception as exc:
        assert "token" in str(exc).lower() or "NOT_AUTHORIZED" in str(exc)
    try:
        rt.identity.deny_device(user_code=device["user_code"], approver_access_token=other["access_token"])
        assert False, "cross-user deny must fail"
    except Exception as exc:
        assert "NOT_AUTHORIZED" in str(exc) or "another" in str(exc).lower()
    denied = rt.identity.deny_device(
        user_code=device["user_code"],
        approver_access_token=owner["access_token"],
    )
    assert denied["status"] == "denied"
