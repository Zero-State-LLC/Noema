"""Tenant tester: resolve, smells, A+ debug, report sanitize, CLI refuse."""

from __future__ import annotations

import json
from pathlib import Path

from noema.cli import agent as agent_cli
from noema.harness.auth import StaticTokenProvider
from noema.harness.debug import DebugAdapter
from noema.harness.loop import HeadlessHarness
from noema.harness.policy import HarnessPolicy
from noema.harness.report import classify_with_model, write_report
from noema.harness.smell import detect_smell
from noema.harness.tenant import TenantError, resolve_tenant
from noema.harness.transport import GatewayClient
from noema.harness.types import ActionProposal, CommandResult, FailureClass, TurnResult


TOKEN = "sekrit-tester-token"
FIXTURE = Path(__file__).parent / "fixtures" / "harness" / "look-observation.json"


def _obs(**overrides) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    data.update(overrides)
    return data


def test_missing_tenant_refuses():
    try:
        resolve_tenant(None, live=False, env={})
    except TenantError as exc:
        assert exc.code == "TENANT_REQUIRED"
    else:
        raise AssertionError("expected TenantError")


def test_perihelion_without_live_refuses():
    try:
        resolve_tenant("perihelion", live=False, env={})
    except TenantError as exc:
        assert exc.code == "LIVE_TENANT_REQUIRED"
    else:
        raise AssertionError("expected TenantError")


def test_isolated_tenant_uses_test_world_path():
    t = resolve_tenant("test.hosted-canonical.ack-s3", live=False, env={})
    assert t.world_id == "test.hosted-canonical.ack-s3"
    assert t.isolated is True
    assert t.live is False
    assert t.command_path == "/v1/operator/test-world/command"


def test_perihelion_with_live_uses_play_command():
    t = resolve_tenant("perihelion", live=True, env={})
    assert t.world_id == "world.perihelion-reach"
    assert t.live is True
    assert t.command_path == "/v1/command"


def test_env_tenant_and_live_flag():
    t = resolve_tenant(None, live=False, env={"NOEMA_TENANT": "test.hosted-canonical.foo"})
    assert t.world_id == "test.hosted-canonical.foo"
    try:
        resolve_tenant(None, live=False, env={"NOEMA_TENANT": "world.perihelion-reach"})
    except TenantError as exc:
        assert exc.code == "LIVE_TENANT_REQUIRED"
    else:
        raise AssertionError("expected TenantError")
    t2 = resolve_tenant(None, live=False, env={"NOEMA_TENANT": "perihelion", "NOEMA_LIVE_TENANT": "1"})
    assert t2.world_id == "world.perihelion-reach"
    assert t2.live is True


def _turn(ok, command="LOOK", failure=None, http=None, error=None, room="room.a", inspect_missing=False):
    loc = {"room_id": room, "entities": [] if inspect_missing else [{"entity_id": "entity.x"}]}
    obs = {"location": loc, "cycle": 1, "sequence": 2}
    result = CommandResult(
        ok=ok,
        observation=obs,
        error=error,
        settled=ok,
        provenance=None,
        http_status=http,
        failure=failure,
        idempotency_key="i",
        request_id="r",
    )
    return TurnResult(
        ok=ok,
        proposal=ActionProposal(action=command, target_id="entity.x"),
        result=result,
        failure=failure,
    )


def test_quiet_wait_is_not_a_smell():
    assert detect_smell(_turn(True, "WAIT"), "room.a") is None


def test_hard_fail_is_a_smell():
    smell = detect_smell(
        _turn(False, "LOOK", FailureClass.ACTION_REJECTED, 400, {"code": "FORBIDDEN"}),
        "room.a",
    )
    assert smell is not None
    assert smell.kind == "command_rejected"


def test_move_same_room_is_contradiction():
    smell = detect_smell(_turn(True, "MOVE", room="room.a"), previous_room="room.a")
    assert smell is not None
    assert smell.kind == "contradiction"


def test_debug_adapter_never_moves():
    adapter = DebugAdapter(failed=ActionProposal(action="LOOK"))
    ctx = {"canonical": {"affordances": [{"action": "MOVE", "available": True, "cmd": "move east"}]}}
    seen = []
    for _ in range(6):
        proposal = adapter.decide(ctx)
        if proposal is None:
            break
        seen.append(proposal.action)
    assert "MOVE" not in seen
    assert seen[0] == "LOOK"


def test_model_down_unclassified(tmp_path: Path):
    def boom(_ctx):
        raise RuntimeError("down")

    kind, summary = classify_with_model({"last_command": "LOOK"}, boom)
    assert kind == "unclassified"
    assert summary == ""
    path = write_report(
        tmp_path / "r.json",
        {
            "tenant_id": "test.hosted-canonical.ack-s3",
            "live": False,
            "mode_at_stop": "debug",
            "last_command": "LOOK",
            "error_code": "FORBIDDEN",
            "contradiction": None,
            "cycle": 1,
            "sequence": 2,
            "room_id": "room.a",
            "probes": ["LOOK"],
            "classification": kind,
            "summary": summary,
        },
    )
    text = path.read_text()
    assert "unclassified" in text
    assert TOKEN not in text


def test_model_move_is_discarded():
    def fake(_ctx):
        return "classification: contradiction\nMOVE east\nexport TOKEN=sekrit"

    kind, summary = classify_with_model({"last_command": "MOVE"}, fake)
    assert "MOVE" not in summary
    assert "TOKEN" not in summary
    assert "sekrit" not in summary
    assert kind == "contradiction"


def test_cli_perihelion_without_live_sends_no_command():
    calls: list[str] = []

    def http(method, url, body=None, token=None):
        calls.append(url)
        return {"status": "ok", "service": "noema-gateway", "stage": "0"}

    rc = agent_cli.main(["--tenant", "perihelion", "run"], http=http)
    assert rc != 0
    assert not any("/v1/command" in u for u in calls)


class SequentialHttp:
    def __init__(self, responses: list[dict]) -> None:
        self.responses = list(responses)
        self.posts: list[dict] = []

    def __call__(self, method, url, body=None, token=None):
        self.posts.append({"method": method, "url": url, "body": body, "token": token})
        if url.endswith("/health"):
            return {"status": "ok", "service": "noema-gateway", "stage": "0"}
        if self.responses:
            return self.responses.pop(0)
        return {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"}


def test_play_then_debug_on_hard_fail():
    look_fail = {
        "ok": False,
        "error": {"code": "FORBIDDEN", "message": "no"},
        "_http_status": 400,
        "world_status": "ACTIVE",
        "observation": _obs(),
    }
    http = SequentialHttp(
        [
            {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"},
            {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"},
            look_fail,
            {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"},
            {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"},
        ]
    )
    client = GatewayClient("https://noema.guru", StaticTokenProvider(TOKEN), http=http)
    from noema.harness.adapters import ScriptedAdapter

    harness = HeadlessHarness(
        client,
        ScriptedAdapter([ActionProposal(action="LOOK")]),
        HarnessPolicy(cooldown_seconds=0),
    )
    run = harness.run_unattended(max_turns=8)
    cmds = [p["body"]["command"] for p in http.posts if p.get("body")]
    assert "ENTER_WORLD" in cmds
    assert run.report
    assert run.report["mode_at_stop"] == "debug"
    after_fail = cmds[cmds.index("LOOK") + 1 :] if "LOOK" in cmds else cmds
    assert "MOVE" not in after_fail


def test_isolated_client_posts_test_world_path():
    posts: list[dict] = []

    def http(method, url, body=None, token=None, headers=None):
        posts.append({"url": url, "body": body, "headers": headers})
        return {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"}

    client = GatewayClient(
        "https://noema.guru",
        StaticTokenProvider(TOKEN),
        http=http,
        command_path="/v1/operator/test-world/command",
        world_id="test.hosted-canonical.ack-s3",
        admin_token="admin.jwt.token",
    )
    result = client.send_command("LOOK", {})
    assert result.ok
    assert posts[0]["url"].endswith("/v1/operator/test-world/command")
    assert posts[0]["body"]["world_id"] == "test.hosted-canonical.ack-s3"
    assert posts[0]["headers"]["X-Noema-Admin-Token"] == "admin.jwt.token"


def test_no_agent_player_still_absent():
    import noema.harness as harness
    import noema.harness.types as types

    exported = set(types.__dict__) | set(harness.__dict__)
    assert "AGENT_PLAYER" not in exported
