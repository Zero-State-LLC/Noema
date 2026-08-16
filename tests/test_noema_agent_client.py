"""Reference client uses hosted /v1/auth/device, not PLAY or production dev-token."""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest


def load_client():
    path = Path(__file__).resolve().parents[1] / "scripts" / "noema_agent_client.py"
    spec = importlib.util.spec_from_file_location("noema_agent_client", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_start_device_posts_runtime_and_returns_no_token():
    client = load_client()
    calls: list[tuple] = []

    def http_json(method, url, body=None, token=None):
        calls.append((method, url, body, token))
        return {
            "device_code": "secret-device",
            "user_code": "AB12-CD34",
            "verification_uri": "https://noema.guru/connect",
            "expires_in": 600,
            "interval": 5,
            "scopes": [
                "noema.player.read",
                "noema.world.observe",
                "noema.action.submit",
            ],
        }

    started = client.start_device("https://noema.guru", runtime="openclaw", http=http_json)
    assert calls == [
        (
            "POST",
            "https://noema.guru/v1/auth/device",
            {"metadata": {"runtime": "openclaw"}},
            None,
        )
    ]
    assert started["user_code"] == "AB12-CD34"
    assert started["verification_uri"] == "https://noema.guru/connect"
    assert "access_token" not in started


def test_enroll_polls_until_approved_and_does_not_echo_device_code():
    client = load_client()
    polls = {"n": 0}

    def http_json(method, url, body=None, token=None):
        if url.endswith("/v1/auth/device"):
            return {
                "device_code": "secret-device",
                "user_code": "9C4D-AA49",
                "verification_uri": "https://noema.guru/connect",
                "expires_in": 600,
                "interval": 0,
            }
        polls["n"] += 1
        assert url.endswith("/v1/auth/device/token")
        assert body == {"device_code": "secret-device"}
        if polls["n"] == 1:
            return {"status": "authorization_pending", "interval": 0}
        return {
            "status": "approved",
            "access_token": "tok.agent",
            "token_type": "bearer",
            "player_id": "player.prabu",
        }

    shown: list[str] = []
    token = client.enroll_device(
        "https://noema.guru",
        runtime="openclaw",
        http=http_json,
        sleep=lambda _s: None,
        announce=shown.append,
    )
    assert token == "tok.agent"
    assert polls["n"] == 2
    blob = "\n".join(shown)
    assert "9C4D-AA49" in blob
    assert "https://noema.guru/connect" in blob
    assert "secret-device" not in blob
    assert "tok.agent" not in blob


def test_resolve_token_uses_device_not_dev_token_when_missing():
    client = load_client()
    urls: list[str] = []

    def http_json(method, url, body=None, token=None):
        urls.append(url)
        if url.endswith("/v1/auth/device"):
            return {
                "device_code": "secret-device",
                "user_code": "1111-2222",
                "verification_uri": "https://noema.guru/connect",
                "expires_in": 600,
                "interval": 0,
            }
        return {"status": "approved", "access_token": "from-device"}

    token = client.resolve_token(
        "https://noema.guru",
        existing=None,
        runtime="openclaw",
        http=http_json,
        sleep=lambda _s: None,
        announce=lambda _m: None,
    )
    assert token == "from-device"
    assert any(u.endswith("/v1/auth/device") for u in urls)
    assert not any("dev-token" in u for u in urls)


def test_resolve_token_keeps_supplied_bearer():
    client = load_client()

    def http_json(*_a, **_k):
        raise AssertionError("must not call the network when a token is already set")

    token = client.resolve_token(
        "https://noema.guru",
        existing="already",
        runtime="openclaw",
        http=http_json,
    )
    assert token == "already"
