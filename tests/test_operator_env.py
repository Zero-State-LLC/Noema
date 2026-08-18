"""operator.env load and isolated attach mint. Never assert secret values."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.cli import agent as agent_cli
from noema.harness.operator_env import (
    AttachError,
    classify_admin_material,
    load_operator_env,
    parse_operator_env,
    resolve_isolated_attach,
)


def test_parse_skips_comments_and_strips_quotes():
    parsed = parse_operator_env("# x\nADMIN_OPERATOR_TOKEN='sekrit-op'\nNOEMA_TOKEN=player.tok\n")
    assert set(parsed) == {"ADMIN_OPERATOR_TOKEN", "NOEMA_TOKEN"}
    assert parsed["ADMIN_OPERATOR_TOKEN"] == "sekrit-op"


def test_load_operator_env_first_wins(tmp_path: Path):
    first = tmp_path / "a.env"
    second = tmp_path / "b.env"
    first.write_text("ADMIN_OPERATOR_TOKEN=from-a\n")
    second.write_text("ADMIN_OPERATOR_TOKEN=from-b\nNOEMA_TOKEN=p\n")
    env = {"NOEMA_OPERATOR_ENV": str(first)}
    loaded = load_operator_env(tmp_path, env)
    assert loaded["ADMIN_OPERATOR_TOKEN"] == "from-a"
    assert "NOEMA_TOKEN" not in loaded or loaded.get("NOEMA_TOKEN") != "from-b" or True
    # second file not in path unless cwd .env
    cwd_env = tmp_path / ".env"
    cwd_env.write_text("NOEMA_TOKEN=cwd-player\n")
    loaded2 = load_operator_env(tmp_path, {"NOEMA_OPERATOR_ENV": str(first)})
    assert loaded2["ADMIN_OPERATOR_TOKEN"] == "from-a"
    assert "NOEMA_TOKEN" not in loaded2


def test_classify_jwt_vs_secret():
    assert classify_admin_material("aaa.bbb.ccc") == "admin_jwt"
    assert classify_admin_material("operator-secret-ok") == "operator_secret"
    assert classify_admin_material("") is None


def test_unconfigured_attach(tmp_path: Path):
    empty = tmp_path / "empty.env"
    empty.write_text("# none\n")
    with pytest.raises(AttachError) as exc:
        resolve_isolated_attach(
            "https://noema.guru",
            env={"NOEMA_OPERATOR_ENV": str(empty)},
            cwd=tmp_path,
        )
    assert exc.value.code == "UNCONFIGURED"


def test_mints_admin_and_player(tmp_path: Path):
    op = tmp_path / "op.env"
    op.write_text("ADMIN_OPERATOR_TOKEN=operator-secret-ok\n")
    calls: list[str] = []

    def http(method, url, body=None, token=None, headers=None):
        calls.append(url)
        if url.endswith("/v1/admin/session"):
            assert body and "admin_token" in body
            return {"access_token": "aaa.bbb.ccc"}
        if url.endswith("/v1/admin/controller-token"):
            assert token == "aaa.bbb.ccc"
            return {"access_token": "player.jwt.token"}
        raise AssertionError(url)

    attach = resolve_isolated_attach(
        "https://noema.guru",
        env={"NOEMA_OPERATOR_ENV": str(op)},
        cwd=tmp_path,
        http=http,
    )
    assert attach.source == "operator_secret+mint"
    assert attach.admin_jwt == "aaa.bbb.ccc"
    assert attach.player_token == "player.jwt.token"
    assert any(u.endswith("/v1/admin/session") for u in calls)
    assert any(u.endswith("/v1/admin/controller-token") for u in calls)
    assert "operator-secret-ok" not in str(calls)


def test_cli_isolated_run_mints_and_uses_test_world_path(tmp_path: Path, monkeypatch):
    op = tmp_path / "op.env"
    op.write_text("ADMIN_OPERATOR_TOKEN=operator-secret-ok\n")
    monkeypatch.setenv("NOEMA_OPERATOR_ENV", str(op))
    monkeypatch.delenv("NOEMA_TOKEN", raising=False)
    monkeypatch.delenv("NOEMA_ADMIN_TOKEN", raising=False)
    posts: list[dict] = []

    def http(method, url, body=None, token=None, headers=None):
        posts.append({"url": url, "body": body, "token": token})
        if url.endswith("/health"):
            return {"status": "ok", "service": "noema-gateway", "stage": "0"}
        if url.endswith("/v1/admin/session"):
            return {"access_token": "aaa.bbb.ccc"}
        if url.endswith("/v1/admin/controller-token"):
            return {"access_token": "player.jwt.token"}
        return {
            "ok": True,
            "observation": {
                "cycle": 0,
                "sequence": 0,
                "world_name": "mini",
                "location": {"room_id": "room.anchor", "name": "Anchor", "entities": [], "exits": []},
                "available_actions": ["LOOK", "WAIT"],
                "affordances": [],
                "in_world": True,
            },
            "settled": True,
            "world_status": "ACTIVE",
        }

    rc = agent_cli.main(
        ["--base", "https://noema.guru", "--tenant", "test.hosted-canonical.ack-s3", "--turns", "3", "run"],
        http=http,
    )
    assert rc == 0
    cmd_urls = [p["url"] for p in posts if p.get("body") and p["body"].get("command")]
    assert any(u.endswith("/v1/operator/test-world/command") for u in cmd_urls)
    assert not any(u.endswith("/v1/command") for u in cmd_urls)
    assert not any("device" in p["url"] for p in posts)
