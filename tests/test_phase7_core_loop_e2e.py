"""Phase 7 — Full frozen core-loop E2E + isolation matrix.

Proves one modular monolith can run:

  Genesis → PLAY → Frontier → Observatory → Lab → CAPTURE → LEARN → Deep Time

without production-world corruption or role leakage.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import POLICY_DENIED, ResearchError
from noema.research.frontier.genomes import genome_content_digest, validate_genome
from noema.research.genesis.errors import GenesisError
from noema.replay.runner import replay_v01_seed
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
V01 = ROOT / "fixtures" / "v01-seed"
V02 = ROOT / "fixtures" / "v02-frontier"
V04 = ROOT / "fixtures" / "v04-lab"
V05 = ROOT / "fixtures" / "v05-compiler"
V06 = ROOT / "fixtures" / "v06-deep-time"


def _j(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_seed_replay_still_equivalent():
    r = replay_v01_seed(V01)
    assert r.ok and r.status == "EQUIVALENT"


def test_role_isolation_matrix(tmp_path: Path):
    """Players cannot operate research/admin; researchers cannot Genesis."""
    rt = NoemaRuntime(db_path=tmp_path / "iso.db")
    admin = rt.create_session(role=Role.ADMIN)
    player = rt.create_session(role=Role.AGENT, agent_id="agent.p")
    researcher = rt.create_session(role=Role.RESEARCHER)
    spectator = rt.create_session(role=Role.SPECTATOR)

    with pytest.raises(GenesisError):
        rt.genesis_preview(player["session_id"], world_name="X", world_seed="s", profile_id="YOUNG_FRONTIER")
    with pytest.raises(GenesisError):
        rt.genesis_preview(researcher["session_id"], world_name="X", world_seed="s", profile_id="YOUNG_FRONTIER")

    # activate requires world via admin genesis
    prev = rt.genesis_preview(
        admin["session_id"],
        world_name="Iso",
        world_seed="seed.iso",
        profile_id="YOUNG_FRONTIER",
    )
    rt.genesis_activate(admin["session_id"], prev["result"]["genesis_id"])

    with pytest.raises(ResearchError) as e1:
        rt.run_frontier(player["session_id"], _j(V02 / "frontier-request.json"), {})
    assert e1.value.code == POLICY_DENIED

    with pytest.raises(ResearchError):
        rt.run_observatory(player["session_id"])

    with pytest.raises(ResearchError):
        rt.capture_as_test(
            player["session_id"],
            intent=_j(V05 / "capture-intent.json"),
            lab_result=_j(V05 / "source-lab-result-ready.json"),
        )

    with pytest.raises(ResearchError):
        rt.learn_view(spectator["session_id"])

    # player may still play
    r = rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.p",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    assert r["results"][0]["status"] == "APPLIED"

    # watch is ok for spectator
    live = rt.watch_live(spectator["session_id"])
    assert live["read_only"] is True
    blob = json.dumps(live)
    assert "novelty_vector" not in blob
    assert "anomaly_score" not in blob


def test_full_core_loop_e2e(tmp_path: Path):
    """Deterministic full-stack walkthrough of the frozen product loop."""
    rt = NoemaRuntime(db_path=tmp_path / "core.db")
    trail: list[str] = []

    # --- G: Admin Genesis ---
    admin = rt.create_session(role=Role.ADMIN)
    prev = rt.genesis_preview(
        admin["session_id"],
        world_name="Core Loop Reach",
        world_seed="seed.core-loop.e2e",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["DAMAGED_RELAY", "DORMANT_INSTITUTION", "INCOMPLETE_ARCHIVE"],
    )
    assert prev["result"]["status"] == "PREVIEW"
    assert prev["player_view"]["presentation"]["no_genesis_controls"] is True
    act = rt.genesis_activate(admin["session_id"], prev["result"]["genesis_id"])
    assert act["config_frozen"] is True
    assert act["world"]["ordinary_world_valid"] is True
    trail.append("GENESIS")
    world_id = act["result"]["world_id"]
    seq_after_genesis = rt.store.get_state().sequence

    # --- PLAY ---
    player = rt.create_session(role=Role.AGENT, agent_id="agent.core")
    for seq, verb, params in [
        (1, "ENTER_WORLD", {}),
        (2, "LOOK", {"attention_spent": 1}),
        (3, "WAIT", {"cycles": 1}),
        (4, "LOOK", {"attention_spent": 1}),
    ]:
        out = rt.apply_player_action(
            player["session_id"],
            {
                "verb": verb,
                "agent_id": "agent.core",
                "client_action_sequence": seq,
                "action_id": f"act.{seq}",
                "idempotency_key": f"idem.{seq}",
                "parameters": params,
            },
        )
        assert out["results"][0]["status"] == "APPLIED"
    assert rt.list_trajectories()
    trail.append("PLAY")
    seq_after_play = rt.store.get_state().sequence
    assert seq_after_play > seq_after_genesis

    # --- NOTICE: Frontier pressure via canonical injection ---
    researcher = rt.create_session(role=Role.RESEARCHER)
    state = rt.store.get_state()
    genome = dict(validate_genome(_j(V02 / "parent-genome.json")))
    genome["affected_rooms"] = [state.active_agents["agent.core"]["room_id"]]
    genome["content_digest"] = genome_content_digest(genome)
    request = dict(_j(V02 / "frontier-request.json"))
    request["request_id"] = "fdrq.core-loop.e2e"
    f_out = rt.run_frontier(
        researcher["session_id"],
        request,
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
        ],
    )
    assert f_out["injection_events"]
    assert any(e["event_type"] == "SITUATION_INJECTED" for e in f_out["injection_events"])
    trail.append("FRONTIER")
    seq_after_frontier = rt.store.get_state().sequence
    assert seq_after_frontier > seq_after_play

    # player still chooses independently after pressure
    wait = rt.apply_player_action(
        player["session_id"],
        {
            "verb": "WAIT",
            "agent_id": "agent.core",
            "client_action_sequence": 5,
            "action_id": "act.5",
            "idempotency_key": "idem.5",
            "parameters": {"cycles": 1},
        },
    )
    assert any(e["event_type"] == "WAIT" for e in wait["events"])

    # --- NOTICE: Observatory (no world mutation) ---
    o_seq = rt.store.get_state().sequence
    o_out = rt.run_observatory(researcher["session_id"])
    assert o_out["world_mutation"] is False
    assert o_out["world_sequence_unchanged"] is True
    assert rt.store.get_state().sequence == o_seq
    trail.append("OBSERVATORY")

    # --- TEST: Lab (isolated forks) ---
    l_seq = rt.store.get_state().sequence
    lab_out = rt.run_lab(
        researcher["session_id"],
        intent=_j(V04 / "experiment-intent.json"),
        interventions=[_j(V04 / "intervention-ablation.json")],
        agent_id="agent.core",
    )
    assert lab_out["production_isolated"] is True
    assert rt.store.get_state().sequence == l_seq
    assert lab_out["result"]["world_truth"] is False
    trail.append("LAB")

    # --- CAPTURE: requires READY Lab result (fixture admission path) ---
    ready_lab = _j(V05 / "source-lab-result-ready.json")
    assert ready_lab["compiler_readiness"] == "READY"
    c_seq = rt.store.get_state().sequence
    cap = rt.capture_as_test(
        researcher["session_id"],
        intent=_j(V05 / "capture-intent.json"),
        lab_result=ready_lab,
        unit_manifest=_j(V05 / "unit-manifest.json"),
    )
    assert cap["status"] == "COMPILED"
    assert cap["production_isolated"] is True
    assert cap["world_truth"] is False
    assert rt.store.get_state().sequence == c_seq
    assert cap["captured_test"]
    assert cap["simple_view"]["presentation"]["title"] == "CAPTURED TEST"
    trail.append("CAPTURE")

    # --- LEARN ---
    learn = rt.rebuild_learn(
        researcher["session_id"],
        sources=[
            {
                "captured_test": cap["captured_test"],
                "lab_result": ready_lab,
                "source_ref": cap["captured_test"]["captured_test_id"],
                "not_tested": [
                    {
                        "context_ref": "context.social.topology.alternate",
                        "simple_label": "different social topology",
                    }
                ],
            }
        ],
    )
    assert learn["rebuildable"] is True
    assert learn["mutates_world"] is False
    assert learn["simple_views"]
    assert learn["simple_views"][0]["canonical_claim_label"] in ("INFERRED", "OBSERVED")
    assert learn["simple_views"][0]["canonical_claim_label"] != "PROVEN"
    trail.append("LEARN")

    # --- Deep Time history ---
    dt = rt.deep_time_ingest(
        researcher["session_id"],
        {
            "institutions": [_j(V06 / "institution.json")],
            "successions": [_j(V06 / "succession.json")],
            "artifacts": [_j(V06 / "artifact-archive.json")],
            "scars": [_j(V06 / "world-scar.json")],
            "names": [_j(V06 / "name-relay-south.json")],
        },
    )
    assert dt["ledger_unchanged"] is True
    assert dt["lore_is_not_truth"] is True
    play_hist = rt.deep_time_play_view(player["session_id"])
    assert play_hist["mode"] == "PLAY"
    assert play_hist["lore_is_not_world_truth"] is True
    trail.append("DEEP_TIME")

    # --- WATCH redaction ---
    spectator = rt.create_session(role=Role.SPECTATOR)
    live = rt.watch_live(spectator["session_id"])
    blob = json.dumps(live)
    for banned in ("novelty_vector", "anomaly_score", "selection_rationale", "target_capability"):
        assert banned not in blob
    trail.append("WATCH")

    # research view aggregates layers
    view = rt.research_view(researcher["session_id"])
    assert view["trajectories"] or view["captured_tests"] or view["learn_behaviors"]

    # final integrity
    assert trail == [
        "GENESIS",
        "PLAY",
        "FRONTIER",
        "OBSERVATORY",
        "LAB",
        "CAPTURE",
        "LEARN",
        "DEEP_TIME",
        "WATCH",
    ]
    problems = rt.store.verify_consistency()
    assert problems == []
    # world still playable
    obs = rt.observe(player["session_id"])
    assert obs.get("agent_id") == "agent.core" or obs.get("LOCATION") or obs.get("status")


def test_ready_endpoint_ignores_optional_research(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "r.db")
    rt.start_world(V01 / "world-seed.json")
    rt.research._failures.append("synthetic")
    ready = rt.ready()
    assert ready["ready"] is True
    assert ready["research_optional"]["required_for_play"] is False


def test_version_manifest_pins_full_loop():
    data = json.loads((ROOT / "spec-compat.json").read_text(encoding="utf-8"))
    versions = data["versions"]
    for key in (
        "event_catalog",
        "canonicalization",
        "frontier_director",
        "observatory",
        "lab",
        "compiler",
        "capability_graph",
        "deep_time",
    ):
        assert key in versions, f"missing version pin {key}"
    assert data.get("core_loop_status") == "complete"
    # Phase 7 freezes the loop; later phases (e.g. postgres) may advance the pin.
    assert data["implementation_phase"] in {
        "phase-7-core-loop-e2e",
        "phase-8-postgres",
        "phase-9-ops-ci",
        "phase-10-config-ui",
        "phase-11-evidence-receipts",
        "phase-12-identity-connect",
    }
    assert (ROOT / "docs" / "CORE-LOOP-RUNTIME.md").is_file()
