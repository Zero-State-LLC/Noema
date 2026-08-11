"""Phase 0/1 acceptance tests for Chamber modular monolith."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.protocol.agent_v1 import AgentProtocolV1
from noema.replay.runner import replay_v01_seed
from noema.scheduler.order import sort_actions
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
SPECS_FIXTURES = Path("/home/scrimshawlife/Noema-Specs/examples/v01-seed")


def test_phase0_seed_replay_equivalent_local():
    result = replay_v01_seed(FIXTURES)
    assert result.ok, "\n".join(result.divergences)
    assert result.status == "EQUIVALENT"
    assert result.event_count == 31


def test_phase0_seed_replay_equivalent_specs_path():
    if not SPECS_FIXTURES.is_dir():
        pytest.skip("Noema-Specs fixtures not available on disk")
    result = replay_v01_seed(SPECS_FIXTURES)
    assert result.ok, "\n".join(result.divergences)


def test_spec_compat_manifest_present():
    data = json.loads((ROOT / "spec-compat.json").read_text(encoding="utf-8"))
    assert data["versions"]["event_catalog"] == "event-catalog/0.1"
    assert data["versions"]["canonicalization"] == "noema-jcs/1"
    assert data["specs"]["repository"].endswith("Noema-Specs")


def test_scheduler_deterministic_order():
    actions = [
        {"verb": "MOVE", "agent_id": "b", "client_action_sequence": 1, "action_id": "2"},
        {"verb": "LOOK", "agent_id": "a", "client_action_sequence": 1, "action_id": "1"},
        {"verb": "LOOK", "agent_id": "a", "client_action_sequence": 2, "action_id": "3"},
    ]
    ordered = sort_actions(actions)
    assert [a["action_id"] for a in ordered] == ["1", "3", "2"]


def test_playable_chamber_e2e_and_restart(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    start = rt.start_world(FIXTURES / "world-seed.json")
    assert start["catalog_version"] == "event-catalog/0.1"

    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.player.1")
    sid = sess["session_id"]

    def act(verb: str, seq: int, **params):
        return rt.apply_player_action(
            sid,
            {
                "verb": verb,
                "agent_id": "agent.player.1",
                "client_action_sequence": seq,
                "action_id": f"act.{seq}",
                "idempotency_key": f"idem.{seq}",
                "parameters": params,
            },
        )

    r1 = act("ENTER_WORLD", 1)
    assert r1["results"][0]["status"] == "APPLIED"
    obs = r1["observation"]
    assert obs["LOCATION"]["room_id"]

    r2 = act("LOOK", 2, attention_spent=1)
    assert any(e["event_type"] == "OBSERVATION_GENERATED" for e in r2["events"])

    # pick an exit if available
    exits = (obs.get("LOCATION") or {}).get("exits") or []
    if exits:
        act("MOVE", 3, exit_id=exits[0]["exit_id"], cost_paid={"energy": 1})
    else:
        act("WAIT", 3, cycles=1)

    # spectator read-only
    watch_sess = rt.create_session(role=Role.SPECTATOR)
    live = rt.watch_live(watch_sess["session_id"])
    assert live["read_only"] is True
    assert live["world_id"] == start["world_id"]

    head = rt.store.ledger_head()
    seq = rt.store.get_state().sequence
    digest = sha256_digest(rt.acceptance_view())
    assert head
    assert seq >= 2

    # restart from same sqlite file via rehydrate
    rt.store.close()
    rt2 = NoemaRuntime(db_path=db)
    resumed = rt2.resume_world(FIXTURES / "world-seed.json")
    assert resumed["sequence"] == seq
    assert resumed["ledger_head"] == head
    assert sha256_digest(rt2.acceptance_view()) == digest
    problems = rt2.store.verify_consistency()
    assert problems == []


def test_agent_protocol_e2e():
    rt = NoemaRuntime(db_path=":memory:")
    rt.start_world(FIXTURES / "world-seed.json")
    p = AgentProtocolV1(rt)

    hello = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "HELLO",
            "request_id": "r1",
            "body": {"supported_protocols": ["agent-protocol/v1"]},
        }
    )
    assert hello["type"] == "HELLO_ACK"

    auth = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "AUTH",
            "request_id": "r2",
            "body": {"agent_id": "agent.bot.1"},
        }
    )
    assert auth["type"] == "AUTH_ACK"
    session_id = auth["body"]["session_id"]

    enter = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "ENTER_WORLD",
            "request_id": "r3",
            "agent_id": "agent.bot.1",
            "idempotency_key": "idem-enter",
            "body": {
                "action": {
                    "agent_id": "agent.bot.1",
                    "client_action_sequence": 1,
                    "action_id": "act-enter",
                    "parameters": {},
                }
            },
        },
        session_id=session_id,
    )
    assert enter["type"] == "ENTER_WORLD_ACK"

    obs = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "OBSERVE",
            "request_id": "r4",
            "agent_id": "agent.bot.1",
        },
        session_id=session_id,
    )
    assert obs["type"] == "OBSERVE"
    assert obs["body"]["observation"]["LOCATION"]

    act = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "ACT",
            "request_id": "r5",
            "agent_id": "agent.bot.1",
            "idempotency_key": "idem-look",
            "body": {
                "action": {
                    "verb": "LOOK",
                    "agent_id": "agent.bot.1",
                    "client_action_sequence": 2,
                    "action_id": "act-look",
                    "parameters": {"attention_spent": 1},
                }
            },
        },
        session_id=session_id,
    )
    assert act["type"] == "ACT_RESULT"

    # cross-agent forbidden
    bad = p.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "ACT",
            "request_id": "r6",
            "agent_id": "agent.bot.1",
            "idempotency_key": "idem-bad",
            "body": {
                "action": {
                    "verb": "LOOK",
                    "agent_id": "agent.other",
                    "client_action_sequence": 3,
                    "action_id": "act-bad",
                    "parameters": {"attention_spent": 1},
                }
            },
        },
        session_id=session_id,
    )
    assert bad["type"] == "ERROR"
    assert bad["error"]["code"] in {"FORBIDDEN", "NOT_AUTHORIZED", "INVALID_ACTION"}


def test_spectator_cannot_mutate():
    rt = NoemaRuntime(db_path=":memory:")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.SPECTATOR)
    with pytest.raises(ActionError):
        rt.apply_player_action(
            sess["session_id"],
            {
                "verb": "LOOK",
                "agent_id": "agent.x",
                "client_action_sequence": 1,
                "action_id": "a1",
                "parameters": {},
            },
        )


def test_version_endpoints_and_health():
    rt = NoemaRuntime(db_path=":memory:")
    assert rt.health()["status"] == "ok"
    assert rt.ready()["ready"] is False
    rt.start_world(FIXTURES / "world-seed.json")
    assert rt.ready()["ready"] is True
    ver = rt.version()
    assert "versions" in ver
    assert ver["versions"]["event_catalog"] == "event-catalog/0.1"


def test_message_delivery_before_next_action():
    rt = NoemaRuntime(db_path=":memory:")
    rt.start_world(FIXTURES / "world-seed.json")
    a = rt.create_session(role=Role.PLAYER, agent_id="agent.a")
    b = rt.create_session(role=Role.PLAYER, agent_id="agent.b")
    for sid, aid, seq in ((a["session_id"], "agent.a", 1), (b["session_id"], "agent.b", 1)):
        rt.apply_player_action(
            sid,
            {
                "verb": "ENTER_WORLD",
                "agent_id": aid,
                "client_action_sequence": seq,
                "action_id": f"enter.{aid}",
                "parameters": {},
            },
        )
    res = rt.apply_player_action(
        a["session_id"],
        {
            "verb": "MESSAGE",
            "agent_id": "agent.a",
            "client_action_sequence": 2,
            "action_id": "msg1",
            "parameters": {"recipient_id": "agent.b", "text": "hello", "cost_paid": {"attention": 1}},
        },
    )
    types = [e["event_type"] for e in res["events"]]
    assert types == ["MESSAGE", "MESSAGE_DELIVERED"]
    obs_b = rt.observe(b["session_id"], "agent.b")
    assert any(m.get("text") == "hello" for m in obs_b.get("MESSAGES") or [])
