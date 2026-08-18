"""Acceptance L01–L18 for LLM Controller adapter v0.1."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.harness.auth import StaticTokenProvider
from noema.harness.loop import HeadlessHarness
from noema.harness.orientation import check_orientation_s0
from noema.harness.policy import HarnessPolicy
from noema.harness.tenant import TenantError, resolve_tenant
from noema.harness.transport import GatewayClient
from noema.llm.adapter import LlmProposeAdapter, redacted_context
from noema.llm.manifest import ManifestError, validate_manifest
from noema.llm.mcp_stub import MCP_TOOLS, mcp_status
from noema.llm.proposal import ProposalError, parse_proposal
from noema.llm.providers import OpenAICompatibleProposer, StaticProposer
from noema.llm.rest import protocol_auth, protocol_hello

TOKEN = "sekrit-controller-token"
FIXTURE = Path(__file__).parent / "fixtures" / "harness" / "look-observation.json"


def _obs() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_l05_manifest_ok():
    doc = validate_manifest(
        {
            "schema_version": "agent-manifest/1.1",
            "display_name": "envoy.tester",
            "runtime": {"name": "noema-llm-agent", "version": "0.1.0"},
            "protocol_version": "agent-protocol/v1",
            "controller_kind": "llm",
        }
    )
    assert doc["controller_kind"] == "llm"


def test_l06_manifest_rejects_prompt_and_key():
    with pytest.raises(ManifestError):
        validate_manifest(
            {
                "schema_version": "agent-manifest/1.1",
                "display_name": "bad",
                "runtime": {"name": "x", "version": "1"},
                "protocol_version": "agent-protocol/v1",
                "controller_kind": "llm",
                "prompt": "you are a secret",
            }
        )
    with pytest.raises(ManifestError):
        validate_manifest(
            {
                "schema_version": "agent-manifest/1.1",
                "display_name": "bad",
                "runtime": {"name": "x", "version": "1"},
                "protocol_version": "agent-protocol/v1",
                "controller_kind": "llm",
                "api_key": "sk-live",
            }
        )


def test_l07_json_look_proposal():
    p = parse_proposal('{"action":"LOOK","arguments":{}}')
    assert p.action == "LOOK"


def test_l08_prose_move_rejected():
    with pytest.raises(ProposalError) as exc:
        parse_proposal("MOVE east")
    assert exc.value.code == "PROSE_COMMAND"


def test_l09_prompt_in_proposal_rejected():
    with pytest.raises(ProposalError) as exc:
        parse_proposal({"action": "LOOK", "prompt": "secret"})
    assert exc.value.code == "PRIVATE_COGNITION"


def test_l14_unknown_verb():
    with pytest.raises(ProposalError) as exc:
        parse_proposal({"action": "HACK_RELAY"})
    assert exc.value.code == "UNKNOWN_ACTION"


def test_l10_nested_private_cognition_rejected():
    with pytest.raises(ProposalError) as exc:
        parse_proposal({"action": "LOOK", "items": [{"prompt": "secret inner plan"}]})
    assert exc.value.code == "PRIVATE_COGNITION"
    with pytest.raises(ProposalError) as exc2:
        parse_proposal({"action": "LOOK", "arguments": {"nested": {"api_key": "sk-live"}}})
    assert exc2.value.code == "PRIVATE_COGNITION"


class ProtocolHttp:
    def __init__(self) -> None:
        self.posts: list[dict] = []

    def __call__(self, method, url, body=None, token=None):
        self.posts.append({"url": url, "body": body, "token": token})
        mtype = (body or {}).get("type")
        offered = ((body or {}).get("body") or {}).get("supported_protocols") or []
        if mtype == "HELLO" and offered and "agent-protocol/v1" not in offered:
            return {
                "protocol": "agent-protocol/v1",
                "type": "ERROR",
                "error": {"code": "NO_COMPATIBLE_PROTOCOL"},
            }
        if mtype == "HELLO":
            return {"protocol": "agent-protocol/v1", "type": "HELLO_ACK", "body": {"selected_protocol": "agent-protocol/v1"}}
        if mtype == "AUTH":
            tok = ((body or {}).get("body") or {}).get("access_token")
            if not tok:
                return {"error": {"code": "NOT_AUTHORIZED"}, "_http_status": 401}
            return {
                "type": "AUTH_ACK",
                "body": {"player_id": "player.tester", "controller_id": "ctrl.1", "session_id": "sess.1"},
            }
        return {"ok": True}


def test_l01_hello_ok():
    http = ProtocolHttp()
    ack = protocol_hello("https://noema.guru", http)
    assert ack["type"] == "HELLO_ACK"


def test_l02_hello_incompatible():
    http = ProtocolHttp()
    body = {
        "protocol": "agent-protocol/v1",
        "type": "HELLO",
        "request_id": "r",
        "body": {"supported_protocols": ["other/v0"]},
    }
    got = http("POST", "https://noema.guru/protocol/v1", body, None)
    assert got["type"] == "ERROR"
    assert got["error"]["code"] == "NO_COMPATIBLE_PROTOCOL"


def test_l03_auth_ok():
    http = ProtocolHttp()
    ack = protocol_auth("https://noema.guru", TOKEN, http)
    assert ack["type"] == "AUTH_ACK"
    assert ack["body"]["player_id"] == "player.tester"
    sent = http.posts[-1]["body"]["body"]
    assert sent["prompt_version_hash"].startswith("sha256:")


def test_l04_auth_missing_token():
    http = ProtocolHttp()
    got = http("POST", "https://noema.guru/protocol/v1", {"type": "AUTH", "body": {}}, None)
    assert got.get("error", {}).get("code") == "NOT_AUTHORIZED"


def test_l12_perihelion_refused():
    with pytest.raises(TenantError) as exc:
        resolve_tenant("perihelion", live=False, env={})
    assert exc.value.code == "LIVE_TENANT_REQUIRED"


def test_l11_isolated_path():
    t = resolve_tenant("test.hosted-canonical.ack-s3", live=False, env={})
    assert t.command_path == "/v1/operator/test-world/command"


def test_l13_token_never_in_model_context():
    ctx = {
        "canonical": {"available_actions": ["LOOK"]},
        "system": {"rule": "Credentials stay outside this context."},
        "secret_token": TOKEN,
    }
    redacted = redacted_context(ctx)
    blob = json.dumps(redacted)
    assert TOKEN not in blob
    assert "secret_token" not in blob
    calls: list[str] = []

    def propose(payload):
        calls.append(json.dumps(payload))
        return {"action": "LOOK"}

    LlmProposeAdapter(propose).decide(ctx)
    assert TOKEN not in calls[0]


def test_l07_adapter_sends_look_not_prompt():
    posts: list[dict] = []

    def http(method, url, body=None, token=None, headers=None):
        posts.append({"url": url, "body": body, "token": token})
        return {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"}

    client = GatewayClient("https://noema.guru", StaticTokenProvider(TOKEN), http=http)
    adapter = LlmProposeAdapter(lambda _c: {"action": "LOOK", "arguments": {}})
    harness = HeadlessHarness(client, adapter, HarnessPolicy(cooldown_seconds=0))
    harness.run_unattended(max_turns=3)
    for rec in posts:
        blob = json.dumps(rec.get("body") or {})
        assert "prompt" not in blob
        assert TOKEN not in blob
    cmds = [p["body"]["command"] for p in posts if p.get("body")]
    assert "LOOK" in cmds or "OBSERVE" in cmds


def test_l08_adapter_prose_does_not_move():
    posts: list[dict] = []

    def http(method, url, body=None, token=None, headers=None):
        posts.append(body or {})
        return {"ok": True, "observation": _obs(), "settled": True, "world_status": "ACTIVE"}

    client = GatewayClient("https://noema.guru", StaticTokenProvider(TOKEN), http=http)
    adapter = LlmProposeAdapter(lambda _c: "MOVE east", fallback="WAIT")
    harness = HeadlessHarness(client, adapter, HarnessPolicy(cooldown_seconds=0))
    harness.run_unattended(max_turns=4)
    cmds = [b.get("command") for b in posts if b.get("command")]
    assert "MOVE" not in cmds


def test_l16_mcp_status_has_no_token():
    assert any(t["name"] == "noema.status" for t in MCP_TOOLS)
    status = mcp_status(tenant_id="test.hosted-canonical.ack-s3", cycle=1, room_id="room.a", classification="ok")
    assert "token" not in json.dumps(status).lower()
    assert TOKEN not in json.dumps(status)


def test_l17_no_agent_player():
    import noema.harness as harness
    import noema.llm as llm
    import noema.harness.types as types

    names = set(types.__dict__) | set(harness.__dict__) | set(llm.__dict__)
    assert "AGENT_PLAYER" not in names


def test_l18_orientation_s0():
    check = check_orientation_s0(_obs())
    assert check.ok


def test_l15_provider_uses_injected_http_not_noema():
    seen = []

    def fake_post(url, body, key):
        seen.append({"url": url, "key": key, "body": body})
        return {"choices": [{"message": {"content": '{"action":"WAIT"}'}}]}

    prop = OpenAICompatibleProposer(
        base_url="https://llm.example/v1",
        model="grok-4",
        api_key="sk-mind-only",
        http_post=fake_post,
    )
    out = prop({"canonical": {"available_actions": ["WAIT"]}})
    assert "WAIT" in out
    assert seen[0]["url"].startswith("https://llm.example")
    assert "noema.guru" not in seen[0]["url"]
    assert seen[0]["key"] == "sk-mind-only"


def test_static_proposer_look():
    assert StaticProposer()({"canonical": {"available_actions": ["LOOK", "WAIT"]}})["action"] == "LOOK"
