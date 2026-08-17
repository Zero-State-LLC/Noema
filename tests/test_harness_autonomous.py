"""Unattended harness loop — ENTER → first OBSERVE (S0) → advertised acts."""

from __future__ import annotations

import json
from pathlib import Path

from noema.cli.agent import main
from noema.harness.adapters import FirstValidAffordanceAdapter, ScriptedAdapter
from noema.harness.auth import StaticTokenProvider
from noema.harness.loop import HeadlessHarness
from noema.harness.orientation import check_orientation_s0
from noema.harness.policy import HarnessPolicy
from noema.harness.transport import GatewayClient
from noema.harness.types import ActionProposal

LOOK = Path(__file__).parent / "fixtures" / "harness" / "look-observation.json"
TOKEN = "sekrit-NOEMA_TOKEN-value"


def quiet_obs() -> dict:
    return {
        "cycle": 0,
        "sequence": 1,
        "world_name": "Perihelion Reach",
        "location": {
            "room_id": "room.grid-anchor",
            "name": "Grid Anchor",
            "description": "A frontier anchor.",
            "exits": [{"direction": "east", "to_room_id": "room.east"}],
            "entities": [],
        },
        "situation": {"place": "Grid Anchor"},
        "player_id": "player.nacre",
        "budgets": {"energy": 10, "attention": 6},
        "available_actions": ["LOOK", "WAIT", "MOVE", "OBSERVE"],
        "affordances": [
            {"action": "WAIT", "available": True, "label": "wait", "cmd": "wait"},
            {"action": "MOVE", "target_id": "east", "available": True, "label": "move east", "cmd": "move east"},
        ],
        "consequence": "You take in Grid Anchor.",
        "messages": [],
    }


def strained_obs() -> dict:
    data = json.loads(LOOK.read_text(encoding="utf-8"))
    data["situation"] = {"place": "Grid Anchor", "strain": "Relay Trunk is damaged."}
    return data


def thesis_obs() -> dict:
    q = quiet_obs()
    q["location"]["description"] = "Welcome, traveler. You should choose your class."
    return q


def hosted_report_obs() -> dict:
    """Live first OBSERVE: last_report copied into situation.strain; MOVE has cmd only."""
    return {
        "cycle": 72,
        "sequence": 210,
        "world_name": "Perihelion Reach",
        "location": {
            "room_id": "room.grid-anchor",
            "name": "Grid Anchor",
            "description": "A frontier anchor.",
            "condition": "Open ground — routes lead outward.",
            "exits": [{"direction": "west", "to_room_id": "room.coldline", "to_room_name": "Coldline"}],
            "entities": [],
        },
        "situation": {"place": "Grid Anchor", "strain": "An organization acted"},
        "player_id": "player.nacre",
        "budgets": {"energy": 10, "attention": 6},
        "available_actions": ["LOOK", "WAIT", "MOVE", "OBSERVE"],
        "affordances": [
            {
                "action": "MOVE",
                "verb": "MOVE",
                "label": "Move west · Coldline",
                "cmd": "move west",
                "available": True,
                "kind": "move",
            }
        ],
        "consequence": "You take in Grid Anchor.",
        "messages": [],
    }


def hosted_worn_obs() -> dict:
    """Server SITUATION_STRAIN_BELOW=70: condition 60 is live strain."""
    return {
        "cycle": 1,
        "sequence": 2,
        "world_name": "Perihelion Reach",
        "location": {
            "room_id": "room.grid-anchor",
            "name": "Grid Anchor",
            "description": "A frontier anchor.",
            "exits": [{"direction": "west", "to_room_id": "room.coldline"}],
            "entities": [
                {
                    "entity_id": "entity.relay-trunk",
                    "label": "Relay Trunk",
                    "entity_type": "INFRASTRUCTURE",
                    "condition": 60,
                    "repairable": True,
                    "harvestable": False,
                }
            ],
        },
        "situation": {"place": "Grid Anchor", "strain": "Relay Trunk condition 60."},
        "player_id": "player.nacre",
        "budgets": {"energy": 10, "attention": 6},
        "available_actions": ["LOOK", "WAIT", "MOVE", "OBSERVE", "REPAIR", "INSPECT"],
        "affordances": [
            {
                "action": "REPAIR",
                "verb": "COMMIT",
                "operation": "REPAIR",
                "label": "Repair Relay Trunk",
                "cmd": "repair Relay Trunk",
                "target_id": "entity.relay-trunk",
                "available": True,
            },
            {
                "action": "MOVE",
                "verb": "MOVE",
                "label": "Move west · Coldline",
                "cmd": "move west",
                "available": True,
                "kind": "move",
            },
        ],
        "consequence": "You look around.",
        "messages": [],
    }


def hosted_west_move_obs() -> dict:
    """Worn room whose first advertised act is MOVE with live deriveAffordances shape."""
    data = hosted_worn_obs()
    data["affordances"] = [
        {
            "action": "MOVE",
            "verb": "MOVE",
            "label": "Move west · Coldline",
            "cmd": "move west",
            "available": True,
            "kind": "move",
        }
    ]
    return data


class FakeGateway:
    def __init__(self, observation: dict) -> None:
        self.observation = observation
        self.posts: list[dict] = []

    def __call__(self, method, url, body=None, token=None):
        self.posts.append({"method": method, "url": url, "body": body, "token": token})
        if method == "GET" and str(url).endswith("/health"):
            return {"status": "ok", "service": "noema-gateway", "stage": "0"}
        cmd = (body or {}).get("command")
        if cmd in ("ENTER_WORLD", "LOOK", "OBSERVE", "MOVE", "INSPECT", "WAIT", "COMMIT"):
            return {
                "ok": True,
                "observation": self.observation,
                "settled": True,
                "world_status": "ACTIVE",
                "provenance": {"player_id": "player.nacre", "controller_id": "ctrl.1"},
            }
        return {"ok": False, "error": {"code": "UNKNOWN"}, "_http_status": 400}


def test_orientation_s0_accepts_location_only_and_live_strain():
    assert check_orientation_s0(quiet_obs()).ok
    assert check_orientation_s0(strained_obs()).ok
    bad = check_orientation_s0(thesis_obs())
    assert not bad.ok
    assert bad.reason in {"YOU_SHOULD", "THESIS", "CLASS", "ARRIVAL"}


def test_orientation_s0_rejects_forbidden_copy_only():
    cases = [
        ("The point of the game is to persist.", "THESIS"),
        ("You should inspect the relay.", "YOU_SHOULD"),
        ("Choose your class before you begin.", "CLASS"),
        ("This is a research objective.", "RESEARCH"),
        ("Welcome, traveler. The chamber opens.", "ARRIVAL"),
        ("The world remembers every scar.", "MEMORY_LECTURE"),
        ("Available commands: LOOK MOVE INSPECT then contest and agreement and access.", "VERB_DUMP"),
    ]
    for text, why in cases:
        obs = quiet_obs()
        obs["location"]["description"] = text
        got = check_orientation_s0(obs)
        assert not got.ok, text
        assert got.reason == why, (text, got.reason)


def test_orientation_s0_accepts_hosted_report_and_midband_strain():
    assert check_orientation_s0(hosted_report_obs()).ok
    assert check_orientation_s0(hosted_worn_obs()).ok
    report_only = quiet_obs()
    report_only["situation"] = {"place": "Grid Anchor", "strain": "An organization acted"}
    assert check_orientation_s0(report_only).ok
    worn_line = quiet_obs()
    worn_line["location"]["condition"] = "The floor is worn thin."
    worn_line["situation"] = {"place": "Grid Anchor", "strain": "The floor is worn thin."}
    assert check_orientation_s0(worn_line).ok


def test_unattended_hosted_report_strain_still_plays():
    http = FakeGateway(hosted_report_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(client, FirstValidAffordanceAdapter(), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=4)
    cmds = [p["body"]["command"] for p in http.posts if p.get("body")]
    assert run.orientation_ok, run.orientation_reason
    assert cmds[:2] == ["ENTER_WORLD", "OBSERVE"]
    assert "WAIT" in cmds
    assert not any((p.get("body") or {}).get("command") == "MOVE" for p in http.posts)


def test_move_parses_direction_from_live_cmd_not_east():
    from noema.harness.observe import prepare_context, to_state
    from noema.harness.memory import WorkingMemory

    state = to_state(hosted_west_move_obs())
    ctx = prepare_context(state, WorkingMemory(), HarnessPolicy())
    proposal = FirstValidAffordanceAdapter().decide(ctx)
    assert proposal is not None
    assert proposal.action == "MOVE"
    assert proposal.arguments.get("direction") == "west"
    assert proposal.arguments.get("direction") != "east"

    http = FakeGateway(hosted_west_move_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(
        client,
        FirstValidAffordanceAdapter(),
        HarnessPolicy(cooldown_seconds=0),
        initial_observation=hosted_west_move_obs(),
    )
    turn = harness.run_turn()
    assert turn.ok
    assert http.posts[0]["body"]["command"] == "MOVE"
    assert http.posts[0]["body"]["arguments"]["direction"] == "west"


def test_quiet_room_waits_instead_of_inventing_pressure():
    http = FakeGateway(quiet_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(
        client,
        FirstValidAffordanceAdapter(),
        HarnessPolicy(cooldown_seconds=0),
        initial_observation=quiet_obs(),
    )
    turn = harness.run_turn()
    assert turn.ok
    assert turn.proposal and turn.proposal.action == "WAIT"
    assert http.posts[0]["body"]["command"] == "WAIT"


def test_strained_room_selects_advertised_repair():
    http = FakeGateway(strained_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(
        client,
        FirstValidAffordanceAdapter(),
        HarnessPolicy(cooldown_seconds=0),
        initial_observation=strained_obs(),
    )
    turn = harness.run_turn()
    assert turn.ok
    assert turn.proposal and turn.proposal.action == "REPAIR"
    assert http.posts[0]["body"]["command"] == "COMMIT"


def test_unattended_enter_observe_then_advertised_acts():
    http = FakeGateway(quiet_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider(TOKEN), http=http)
    harness = HeadlessHarness(client, FirstValidAffordanceAdapter(), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=4)
    cmds = [p["body"]["command"] for p in http.posts if p["body"]]
    assert cmds[:2] == ["ENTER_WORLD", "OBSERVE"]
    assert "WAIT" in cmds
    assert run.orientation_ok
    assert run.first_observe and run.first_observe["location"]["name"] == "Grid Anchor"
    invented = {"HACK_RELAY", "QUEST", "ASCEND"}
    assert invented.isdisjoint(set(cmds))
    blob = json.dumps(http.posts)
    assert TOKEN not in blob or all(
        (p.get("token") == TOKEN and "NOEMA_TOKEN" not in json.dumps(p.get("body") or {})) for p in http.posts
    )


def test_unattended_rejects_thesis_first_observe():
    http = FakeGateway(thesis_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(client, ScriptedAdapter([]), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=4)
    assert run.orientation_ok is False
    cmds = [p["body"]["command"] for p in http.posts if p["body"]]
    assert cmds == ["ENTER_WORLD", "OBSERVE"]


def test_unattended_strained_room_uses_advertised_repair():
    http = FakeGateway(strained_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(client, FirstValidAffordanceAdapter(), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=4)
    cmds = [p["body"]["command"] for p in http.posts if p["body"]]
    assert cmds[:2] == ["ENTER_WORLD", "OBSERVE"]
    assert "COMMIT" in cmds
    assert any((p["body"] or {}).get("arguments", {}).get("operation") == "REPAIR" for p in http.posts if p.get("body"))
    assert run.orientation_ok
    invented = {"HACK_RELAY", "QUEST", "ASCEND"}
    assert invented.isdisjoint(set(cmds))


def test_unattended_paused_stops_mutation():
    class PausedAfterObserve(FakeGateway):
        def __call__(self, method, url, body=None, token=None):
            rec = {"method": method, "url": url, "body": body, "token": token}
            self.posts.append(rec)
            if method == "GET" and str(url).endswith("/health"):
                return {"status": "ok", "service": "noema-gateway", "stage": "0"}
            cmd = (body or {}).get("command")
            status = "ACTIVE" if cmd == "ENTER_WORLD" else "PAUSED"
            if cmd in ("ENTER_WORLD", "LOOK", "OBSERVE", "MOVE", "INSPECT", "WAIT", "COMMIT"):
                obs = strained_obs()
                obs["world_status"] = status
                return {
                    "ok": True,
                    "observation": obs,
                    "settled": True,
                    "world_status": status,
                    "provenance": {"player_id": "player.nacre", "controller_id": "ctrl.1"},
                }
            return {"ok": False, "error": {"code": "UNKNOWN"}, "_http_status": 400}

    http = PausedAfterObserve(strained_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(client, FirstValidAffordanceAdapter(), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=5)
    cmds = [p["body"]["command"] for p in http.posts if p.get("body")]
    assert cmds[:2] == ["ENTER_WORLD", "OBSERVE"]
    assert "COMMIT" not in cmds
    assert run.stopped
    assert any(t.failure and t.failure.value == "WORLD_PAUSED" for t in run.turns)


def test_cli_run_unattended_against_fake_twice():
    http = FakeGateway(quiet_obs())
    code1 = main(["--base", "https://noema.guru", "--token", "tok", "--turns", "3", "run"], http=http)
    http2 = FakeGateway(quiet_obs())
    code2 = main(["--base", "https://noema.guru", "--token", "tok", "--turns", "3", "run"], http=http2)
    assert code1 == 0 and code2 == 0
    for gw in (http, http2):
        cmds = [p["body"]["command"] for p in gw.posts if p.get("body")]
        assert cmds[0] == "ENTER_WORLD"
        assert "OBSERVE" in cmds
        assert "WAIT" in cmds
        assert all("NOEMA_TOKEN" not in json.dumps(p.get("body") or {}) for p in gw.posts)
