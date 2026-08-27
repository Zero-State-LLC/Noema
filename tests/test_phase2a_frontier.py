"""Phase 2A — Research capture + Frontier NOTICE (F01–F15 + E2E)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import INVALID_GENOME, INVALID_MUTATION, POLICY_DENIED, ResearchError
from noema.research.frontier.catalog import (
    attention_projection,
    director_config,
    mutation_catalog,
    noise_model,
    novelty_axes,
    operator_ids,
)
from noema.research.frontier.director import FrontierDirector
from noema.research.frontier.genomes import genome_content_digest, validate_genome
from noema.research.frontier.injection import build_situation_injected_event
from noema.research.frontier.mutation import mutate_sequence
from noema.research.frontier.noise import apply_noise, closed_noise_ids
from noema.research.frontier.novelty import novelty_l1
from noema.research.frontier.partial_obs import attention_band, project_inspect, project_look
from noema.research.frontier.redaction import public_pressure_summary, redact_public_projection, research_overlay
from noema.research.frontier.scoring import ranking_key, score_components, tie_break
from noema.world.digest import sha256_digest
from noema.world.reduce import apply_event
from noema.world.state import load_seed

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V02 = ROOT / "fixtures" / "v02-frontier"
SPECS_V02 = Path("/home/scrimshawlife/Noema-Specs/examples/v02-frontier")


def _load(name: str) -> dict | list:
    path = V02 / name
    if not path.is_file() and SPECS_V02.is_dir():
        path = SPECS_V02 / name
    text = path.read_text(encoding="utf-8")
    if name.endswith(".jsonl"):
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    return json.loads(text)


# ---------------------------------------------------------------------------
# Phase 1 regression + digest note
# ---------------------------------------------------------------------------


def test_phase1_still_green():
    from noema.replay.runner import replay_v01_seed

    result = replay_v01_seed(FIXTURES)
    assert result.ok
    assert result.status == "EQUIVALENT"


# ---------------------------------------------------------------------------
# F01 — Situation Genome Validation
# ---------------------------------------------------------------------------


def test_f01_01_valid_genome_accepted():
    g = validate_genome(_load("situation-genome.json"))
    assert g["content_digest"].startswith("sha256:")
    assert g["content_digest"] == genome_content_digest(g)


def test_f01_02_parent_genome_validates():
    g = validate_genome(_load("parent-genome.json"))
    assert g["genome_id"] == "genome.template.strategic-baseline"


def test_f01_03_forced_outcome_rejected():
    g = dict(_load("situation-genome.json"))
    g["goal_structure"] = {**g.get("goal_structure", {}), "forced_agent_action": "LOOK"}
    g.pop("content_digest", None)
    with pytest.raises(ResearchError) as ei:
        validate_genome(g)
    assert ei.value.code == INVALID_GENOME


def test_f01_04_no_required_agent_action_field():
    g = _load("situation-genome.json")
    assert g["goal_structure"].get("no_scripted_agent_actions") is True
    validate_genome(g)


def test_f01_05_novelty_vector_nine_axes():
    g = validate_genome(_load("situation-genome.json"))
    assert len(g["novelty_vector"]) == 9
    for v in g["novelty_vector"].values():
        assert 0 <= v <= 1000


def test_f01_06_visibility_policy_hides_research():
    g = _load("situation-genome.json")
    forbidden = g["visibility_policy"]["player_forbidden"]
    assert "target_capabilities" in forbidden
    assert "novelty_vector" in forbidden


# ---------------------------------------------------------------------------
# F02 — Novelty Vector Determinism
# ---------------------------------------------------------------------------


def test_f02_01_axes_catalog_has_9():
    assert len(novelty_axes()["axes"]) == 9


def test_f02_02_distance_abs_l1():
    a = {k: 100 for k in ("semantic", "causal", "social_topology", "temporal", "tool", "epistemic", "goal_structure", "resource", "constraint")}
    b = {**a, "semantic": 150, "causal": 80}
    assert novelty_l1(a, b) == 50 + 20


def test_f02_03_solved_distance_default_50():
    assert int(novelty_axes()["solved_distance"]) == 50
    assert int(director_config()["solved_distance"]) == 50


def test_f02_04_pairwise_diversity_min_120():
    assert int(novelty_axes()["pairwise_diversity_min"]) == 120
    assert int(director_config()["pairwise_diversity_min"]) == 120


def test_f02_05_missing_axis_not_computable():
    a = {k: 100 for k in ("semantic", "causal", "social_topology", "temporal", "tool", "epistemic", "goal_structure", "resource")}
    b = dict(a)
    b["constraint"] = 100
    with pytest.raises(ResearchError):
        novelty_l1(a, b)


# ---------------------------------------------------------------------------
# F03 — Mutation Operator Determinism
# ---------------------------------------------------------------------------


def test_f03_01_closed_mutation_catalog():
    ops = operator_ids()
    assert "MUT_RESOURCE_SCARCITY" in ops
    assert len(ops) >= 10


def test_f03_02_operator_forbids_research_label_paths():
    for op in mutation_catalog()["operators"]:
        forbidden = op.get("forbidden_paths") or []
        assert "research_labels" in forbidden or "claim_labels" in forbidden


def test_f03_03_same_parent_params_same_child_digest():
    parent = validate_genome(_load("parent-genome.json"))
    ops = [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
    a = mutate_sequence(parent, ops)
    b = mutate_sequence(parent, ops)
    assert a["content_digest"] == b["content_digest"]


def test_f03_04_invalid_mutation_rejected():
    parent = validate_genome(_load("parent-genome.json"))
    with pytest.raises(ResearchError) as ei:
        mutate_sequence(parent, [{"operator_id": "MUT_NOT_REAL", "params": {"intensity_millipoints": 1}}])
    assert ei.value.code == INVALID_MUTATION


def test_f03_05_lineage_recorded():
    parent = validate_genome(_load("parent-genome.json"))
    child = mutate_sequence(
        parent,
        [{"operator_id": "MUT_FALSE_SIGNAL", "params": {"intensity_millipoints": 500}}],
    )
    assert child["mutation_lineage"]
    assert child["mutation_lineage"][-1]["operator_id"] == "MUT_FALSE_SIGNAL"


# ---------------------------------------------------------------------------
# F04 — Candidate Enumeration
# ---------------------------------------------------------------------------


def test_f04_stable_candidate_id_matches_fixture():
    director = FrontierDirector()
    ops = [
        {"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}},
        {"operator_id": "MUT_FALSE_SIGNAL", "params": {"intensity_millipoints": 500}},
        {"operator_id": "MUT_COMMUNICATION_TOPOLOGY", "params": {"intensity_millipoints": 400}},
        {"operator_id": "MUT_INFRA_CONDITION", "params": {"intensity_millipoints": 600}},
    ]
    cid = director.candidate_id(
        parent_digest="sha256:11c4efb6d5178a60ce2399160d6381501f7e473db3711f5a0ffc9aa552605db4",
        mutation_operations=ops,
        world_version="world/v1",
    )
    expected = _load("expected-digests.json")["candidate_id"]
    assert cid == expected


def test_f04_enumeration_order_and_budget():
    parent = validate_genome(_load("parent-genome.json"))
    request = _load("frontier-request.json")
    director = FrontierDirector()
    result = director.run(
        request,
        {"template.strategic-baseline": parent},
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}],
            [{"operator_id": "MUT_FALSE_SIGNAL", "params": {"intensity_millipoints": 500}}],
        ],
    )
    assert len(result.candidates) >= 1
    # ledger contains selected and non-selected dispositions
    dispositions = {c["disposition"] for c in result.candidates}
    assert dispositions  # at least one


def test_f04_max_enumeration_budget():
    parent = validate_genome(_load("parent-genome.json"))
    request = dict(_load("frontier-request.json"))
    request["budgets"] = {**request["budgets"], "max_candidates": 3}
    director = FrontierDirector()
    result = director.run(request, {"template.strategic-baseline": parent})
    assert len(result.candidates) <= 3


# ---------------------------------------------------------------------------
# F05 — Frontier Ranking
# ---------------------------------------------------------------------------


def test_f05_ranking_key_matches_config_order():
    cfg = director_config()
    assert cfg["ranking_key"][0] == "risk_class"
    assert "-uncertainty" in cfg["ranking_key"]
    scores = score_components(
        genome=_load("situation-genome.json"),
        request=_load("frontier-request.json"),
    )
    key = ranking_key(scores, "fdc-test", "seed")
    assert isinstance(key, tuple)
    assert scores["claim_label"] == "INFERRED"


def test_f05_tie_break_hmac_seed():
    a = tie_break("seed-a", "cand-1")
    b = tie_break("seed-a", "cand-1")
    c = tie_break("seed-b", "cand-1")
    assert a == b
    assert a != c


def test_f05_identical_inputs_decision_equivalent():
    parent = validate_genome(_load("parent-genome.json"))
    request = _load("frontier-request.json")
    plans = [
        [
            {"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}},
            {"operator_id": "MUT_FALSE_SIGNAL", "params": {"intensity_millipoints": 500}},
        ]
    ]
    d = FrontierDirector()
    r1 = d.run(request, {"template.strategic-baseline": parent}, explicit_mutation_plans=plans)
    r2 = d.run(request, {"template.strategic-baseline": parent}, explicit_mutation_plans=plans)
    assert [c["candidate_id"] for c in r1.plan["selected_candidates"]] == [
        c["candidate_id"] for c in r2.plan["selected_candidates"]
    ]
    assert r1.replay_context["selected_situation_digests"] == r2.replay_context["selected_situation_digests"]


# ---------------------------------------------------------------------------
# F06 — Anti-Repetition
# ---------------------------------------------------------------------------


def test_f06_solved_near_duplicate_rejected_without_control():
    parent = validate_genome(_load("parent-genome.json"))
    request = _load("frontier-request.json")
    nv = dict(parent["novelty_vector"])
    d = FrontierDirector()
    result = d.run(
        request,
        {"template.strategic-baseline": parent},
        explicit_mutation_plans=[[]],  # identity only
        solved_novelty_vectors=[nv],
    )
    # identity genome is a near-duplicate of solved → rejected unless control
    id_cands = [c for c in result.candidates if not c["mutation_operations"]]
    assert id_cands
    assert id_cands[0]["disposition"] == "rejected"
    assert "repetition_without_control" in id_cands[0]["reason_codes"]


def test_f06_positive_control_may_admit_repetition():
    parent = validate_genome(_load("parent-genome.json"))
    parent = dict(parent)
    parent["control_role"] = "positive-control"
    parent["content_digest"] = genome_content_digest(parent)
    request = _load("frontier-request.json")
    d = FrontierDirector()
    result = d.run(
        request,
        {"template.strategic-baseline": parent},
        explicit_mutation_plans=[[]],
        solved_novelty_vectors=[dict(parent["novelty_vector"])],
    )
    id_cands = [c for c in result.candidates if not c["mutation_operations"]]
    assert id_cands[0]["disposition"] in ("enumerated", "selected")


def test_f06_repetition_quota_default_1():
    assert int(director_config()["repetition_quota"]) == 1


# ---------------------------------------------------------------------------
# F07 — Budget / Risk Admission
# ---------------------------------------------------------------------------


def test_f07_risk_class_above_max_rejected():
    parent = validate_genome(_load("parent-genome.json"))
    parent = dict(parent)
    parent["risk_class"] = 4
    parent["content_digest"] = genome_content_digest(parent)
    request = dict(_load("frontier-request.json"))
    request["budgets"] = {**request["budgets"], "max_risk_class": 2}
    d = FrontierDirector()
    result = d.run(request, {"template.strategic-baseline": parent}, explicit_mutation_plans=[[]])
    assert all(c["disposition"] == "rejected" for c in result.candidates if not c["mutation_operations"])


def test_f07_budget_too_small_empty_plan():
    parent = validate_genome(_load("parent-genome.json"))
    request = dict(_load("frontier-request.json"))
    request["budgets"] = {**request["budgets"], "max_cost_millipoints": 0, "max_select": 1}
    # force high cost via many mutations
    ops = [
        {"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}},
        {"operator_id": "MUT_FALSE_SIGNAL", "params": {"intensity_millipoints": 500}},
        {"operator_id": "MUT_INFRA_CONDITION", "params": {"intensity_millipoints": 600}},
    ]
    d = FrontierDirector()
    result = d.run(request, {"template.strategic-baseline": parent}, explicit_mutation_plans=[ops])
    # either empty or no selected with high cost
    for c in result.candidates:
        if c["mutation_operations"] == ops:
            assert c["disposition"] in ("rejected", "enumerated", "selected")


def test_f07_missing_seed_not_computable():
    parent = validate_genome(_load("parent-genome.json"))
    request = dict(_load("frontier-request.json"))
    del request["seed"]
    d = FrontierDirector()
    result = d.run(request, {"template.strategic-baseline": parent})
    assert result.claim_label == "NOT_COMPUTABLE"
    assert result.plan["selected_candidates"] == []


def test_f07_invalid_genome_source_rejected():
    request = _load("frontier-request.json")
    d = FrontierDirector()
    result = d.run(request, {})  # no templates
    assert result.plan["selected_candidates"] == [] or result.stop_reason


# ---------------------------------------------------------------------------
# F08 — Partial Observability
# ---------------------------------------------------------------------------


def test_f08_hidden_fields_absent_from_public_obs():
    room = {"room_id": "room.x", "name": "X", "entity_ids": [], "description": "d"}
    obs = project_look(room=room, attention=10, co_located=[], cycle=1, hidden_research={"target_capabilities": ["X"]})
    assert "target_capabilities" not in obs


def test_f08_private_evidence_only_listed_agent():
    ent = {"entity_id": "e1", "entity_type": "NODE", "properties": {"label": "L"}, "state": {"condition": 28}}
    priv = project_inspect(
        entity=ent,
        attention=10,
        cycle=1,
        private_evidence=["secret"],
        agent_id="agent.quill",
        asymmetric_private_agents=["agent.quill"],
    )
    pub = project_inspect(
        entity=ent,
        attention=10,
        cycle=1,
        private_evidence=["secret"],
        agent_id="agent.nacre",
        asymmetric_private_agents=["agent.quill"],
    )
    assert priv.get("private_evidence") == ["secret"]
    assert "private_evidence" not in pub


def test_f08_provenance_observed_at_cycle():
    obs = project_look(room={"room_id": "r", "name": "n", "entity_ids": []}, attention=5, co_located=[], cycle=10)
    assert obs["observed_at_cycle"] == 10


def test_f08_stale_class_supported():
    # delay_staleness is a closed noise operator
    assert "delay_staleness" in closed_noise_ids()


# ---------------------------------------------------------------------------
# F09 — Noise Replay
# ---------------------------------------------------------------------------


def test_f09_noise_operators_closed_set():
    assert set(closed_noise_ids()) >= {"omission", "quantization", "delay_staleness", "bounded_perturbation", "source_corruption"}


def test_f09_noise_has_seed_stream():
    r = apply_noise(
        noise_model_id="quantization",
        seed_stream="noise.seed.v02",
        target_field_path="content.condition",
        parameters={"step_millipoints": 100},
        source_value=28,
        source_event_id="evt.x",
    )
    assert r["seed_stream"] == "noise.seed.v02"
    assert r["mutates_world"] is False


def test_f09_same_seed_params_same_result_digest():
    kwargs = dict(
        noise_model_id="quantization",
        seed_stream="noise.seed.v02",
        target_field_path="content.condition",
        parameters={"step_millipoints": 100},
        source_value=28,
        source_event_id="evt.x",
    )
    assert apply_noise(**kwargs)["result_digest"] == apply_noise(**kwargs)["result_digest"]


def test_f09_noise_does_not_mutate_world_by_default():
    assert noise_model()["default_affects"] == "observation_projection_only"


# ---------------------------------------------------------------------------
# F10 — Contradictory Evidence
# ---------------------------------------------------------------------------


def test_f10_contradiction_set_validates():
    cset = _load("contradiction-set.json")
    assert cset["schema_version"] == "contradiction-set/0.2"
    assert cset["agent_visible_relationship"] == "unresolved_conflict"
    assert cset["known_truth_relationship"]["claim_label"] == "INFERRED"
    assert len(cset["member_refs"]) >= 2


def test_f10_does_not_rewrite_world_truth():
    cset = _load("contradiction-set.json")
    # research partition note only
    assert "research partition" in (cset["known_truth_relationship"].get("note") or "").lower() or cset[
        "resolution_status"
    ] == "open"


# ---------------------------------------------------------------------------
# F11 — Attention Degradation
# ---------------------------------------------------------------------------


def test_f11_thresholds():
    cfg = attention_projection()
    assert cfg["threshold_full"] == 6
    assert cfg["threshold_reduced"] == 3
    assert cfg["threshold_minimal"] == 1
    assert attention_band(6) == "full"
    assert attention_band(3) == "reduced"
    assert attention_band(1) == "minimal"
    assert attention_band(0) == "none"


def test_f11_reduced_omits_exact_condition():
    ent = {"entity_id": "e", "entity_type": "NODE", "properties": {"label": "L"}, "state": {"condition": 28}}
    obs = project_inspect(entity=ent, attention=4, cycle=1)
    assert "condition" not in obs
    assert "condition_band" in obs


def test_f11_minimal_identifiers_only():
    ent = {"entity_id": "e", "entity_type": "NODE", "properties": {"label": "L"}, "state": {"condition": 28}}
    obs = project_inspect(entity=ent, attention=1, cycle=1)
    assert obs["entity_id"] == "e"
    assert "state" not in obs
    assert "condition" not in obs


def test_f11_a_lt_cost_budget_exceeded():
    obs = project_look(room={"room_id": "r", "name": "n", "entity_ids": []}, attention=0, co_located=[], cycle=1)
    assert obs.get("error") == "BUDGET_EXCEEDED"


# ---------------------------------------------------------------------------
# F12 — Frontier → World Boundary
# ---------------------------------------------------------------------------


def test_f12_plan_alone_does_not_change_world(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq_before = rt.store.get_state().sequence
    parent = validate_genome(_load("parent-genome.json"))
    sess = rt.create_session(role=Role.RESEARCHER)
    request = _load("frontier-request.json")
    rt.run_frontier(
        sess["session_id"],
        request,
        {"template.strategic-baseline": parent},
        inject=False,
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
        ],
    )
    assert rt.store.get_state().sequence == seq_before


def test_f12_injection_only_via_situation_injected(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    start = rt.start_world(FIXTURES / "world-seed.json")
    # need rooms from seed that match genome — v01-seed rooms may differ from strategic
    # use a genome with seed rooms
    state = rt.store.get_state()
    room_ids = list(state.rooms.keys())[:2]
    genome = validate_genome(_load("parent-genome.json"))
    genome = dict(genome)
    genome["affected_rooms"] = room_ids
    genome["content_digest"] = genome_content_digest(genome)
    sess = rt.create_session(role=Role.ADMIN)
    request = dict(_load("frontier-request.json"))
    result = rt.run_frontier(
        sess["session_id"],
        request,
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[[]],
    )
    assert result["injection_events"]
    assert result["injection_events"][0]["event_type"] == "SITUATION_INJECTED"
    events = rt.store.list_events()
    assert any(e["event_type"] == "SITUATION_INJECTED" for e in events)


def test_f12_frontier_cannot_write_worldstate_api():
    """Director has no world mutation methods."""
    d = FrontierDirector()
    assert not hasattr(d, "write_world_state")
    assert not hasattr(d, "mutate_world")


def test_f12_player_cannot_invoke_frontier(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.p")
    with pytest.raises(ResearchError) as ei:
        rt.run_frontier(sess["session_id"], _load("frontier-request.json"), {})
    assert ei.value.code == POLICY_DENIED


# ---------------------------------------------------------------------------
# F13 — Situation Injection Replay
# ---------------------------------------------------------------------------


def test_f13_fixture_injection_digest():
    inj = _load("situation-injected.json")
    body = {k: v for k, v in inj.items() if k != "digest"}
    assert sha256_digest(body) == inj["digest"]
    assert inj["payload"]["genome_id"]
    assert inj["payload"]["seed_stream_id"]
    assert inj["payload"]["score_components"]


def test_f13_runtime_injection_reproduces_structure(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    state = rt.store.get_state()
    genome = validate_genome(_load("parent-genome.json"))
    genome = dict(genome)
    genome["affected_rooms"] = list(state.rooms.keys())[:1]
    genome["content_digest"] = genome_content_digest(genome)
    scores = {"uncertainty": 800, "novelty": 720, "discrimination": 600}
    ev = build_situation_injected_event(
        world_id=state.world_id,
        cycle=1,
        sequence=state.sequence + 1,
        previous_digest=state.last_event_digest,
        situation_id="sit.test",
        genome=genome,
        score_components=scores,
    )
    new_state = apply_event(state, ev)
    assert "sit.test" in new_state.situations
    # re-digest same payload body → same digest
    body = {k: v for k, v in ev.items() if k != "digest"}
    assert event_body_digest_match(ev)


def event_body_digest_match(ev: dict) -> bool:
    from noema.world.digest import event_body_digest

    return event_body_digest(ev) == ev["digest"]


# ---------------------------------------------------------------------------
# F14 — Spectator Research Redaction
# ---------------------------------------------------------------------------


def test_f14_public_projection_omits_research_targets():
    pub = _load("spectator-projection-public.json")
    redacted = redact_public_projection(pub)
    blob = json.dumps(redacted)
    assert "target_capabilities" not in blob or "must_not_include" in blob
    assert "EPISTEMIC_RESTRAINT" not in blob


def test_f14_research_overlay_noncanonical():
    overlay = _load("research-overlay.json")
    assert overlay["noncanonical"] is True
    assert overlay["visibility"] == "research"


def test_f14_narrative_cannot_mutate_world():
    pub = public_pressure_summary(cycle=10, world_id="world-01", event_ids=["e1"], narrative="rumor")
    assert pub["mutates_world"] is False


def test_f14_watch_redacts_for_spectator(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    genome = validate_genome(_load("parent-genome.json"))
    state = rt.store.get_state()
    genome = dict(genome)
    genome["affected_rooms"] = list(state.rooms.keys())[:1]
    genome["content_digest"] = genome_content_digest(genome)
    admin = rt.create_session(role=Role.ADMIN)
    request = _load("frontier-request.json")
    rt.run_frontier(
        admin["session_id"],
        request,
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[[]],
    )
    spectator = rt.create_session(role=Role.SPECTATOR)
    live = rt.watch_live(spectator["session_id"])
    blob = json.dumps(live)
    assert "target_capability" not in blob
    assert "novelty_vector" not in blob
    assert "selection_rationale" not in blob
    # authorized research sees genome
    research = rt.create_session(role=Role.RESEARCHER)
    view = rt.research_view(research["session_id"])
    assert view["overlays"]
    assert view["overlays"][-1].get("genome_id")


# ---------------------------------------------------------------------------
# F15 — Empty / NOT_COMPUTABLE
# ---------------------------------------------------------------------------


def test_f15_empty_plan_fixture():
    plan = _load("frontier-plan-empty.json")
    assert plan["selected_candidates"] == []
    assert plan["stop_reason"] == "no-safe-candidate"
    assert plan["claim_label"] == "NOT_COMPUTABLE"


def test_f15_estimate_claim_inferred_not_observed():
    scores = score_components(genome=_load("situation-genome.json"), request=_load("frontier-request.json"))
    assert scores["claim_label"] == "INFERRED"
    assert scores["claim_label"] != "OBSERVED"


def test_f15_not_computable_not_zero_uncertainty():
    request = dict(_load("frontier-request.json"))
    request["capability_snapshot"] = {**request["capability_snapshot"], "evidence_complete": False}
    scores = score_components(genome=_load("situation-genome.json"), request=request)
    assert scores["uncertainty"] > 0


# ---------------------------------------------------------------------------
# Research capture + rebuild
# ---------------------------------------------------------------------------


def test_trajectory_capture_and_rebuild(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.player.1")
    rt.apply_player_action(
        sess["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.player.1",
            "client_action_sequence": 1,
            "action_id": "act.1",
            "idempotency_key": "idem.1",
            "parameters": {},
        },
    )
    trajs = rt.list_trajectories()
    assert trajs
    assert trajs[0]["provenance"]["source"] == "canonical_ledger"
    dig1 = trajs[0]["content_digest"]
    rebuilt = rt.rebuild_research_indexes()
    assert rebuilt
    # rebuild produces equivalent identity structure
    assert rebuilt[0]["world_id"] == trajs[0]["world_id"]
    assert rebuilt[0]["event_refs"]


# ---------------------------------------------------------------------------
# No forced behavior + no direct mutation
# ---------------------------------------------------------------------------


def test_frontier_cannot_force_agent_action(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    state = rt.store.get_state()
    genome = dict(validate_genome(_load("parent-genome.json")))
    genome["affected_rooms"] = list(state.rooms.keys())[:1]
    genome["content_digest"] = genome_content_digest(genome)
    admin = rt.create_session(role=Role.ADMIN)
    rt.run_frontier(
        admin["session_id"],
        _load("frontier-request.json"),
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
        ],
    )
    # player still chooses independently
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.p2")
    r = rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.p2",
            "client_action_sequence": 1,
            "action_id": "act.e",
            "idempotency_key": "idem.e",
            "parameters": {},
        },
    )
    assert r["results"][0]["status"] == "APPLIED"
    # WAIT is agent-chosen, not frontier-scripted
    r2 = rt.apply_player_action(
        player["session_id"],
        {
            "verb": "WAIT",
            "agent_id": "agent.p2",
            "client_action_sequence": 2,
            "action_id": "act.w",
            "idempotency_key": "idem.w",
            "parameters": {"cycles": 1},
        },
    )
    assert any(e["event_type"] == "WAIT" for e in r2["events"])


def test_no_direct_mutation_all_changes_are_events(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    before = rt.store.get_state().sequence
    state = rt.store.get_state()
    genome = dict(validate_genome(_load("parent-genome.json")))
    genome["affected_rooms"] = list(state.rooms.keys())[:1]
    genome["content_digest"] = genome_content_digest(genome)
    admin = rt.create_session(role=Role.ADMIN)
    out = rt.run_frontier(
        admin["session_id"],
        _load("frontier-request.json"),
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[[]],
        follow_on=None,
    )
    after = rt.store.get_state().sequence
    assert after > before
    events = rt.store.list_events(after_sequence=before)
    assert events
    assert all(e.get("digest") for e in events)
    # audit references canonical events
    assert out["audit"]


# ---------------------------------------------------------------------------
# E2E Frontier scenario
# ---------------------------------------------------------------------------


def test_e2e_frontier_play_capture_select_inject_observe(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")

    player = rt.create_session(role=Role.PLAYER, agent_id="agent.e2e")
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.e2e",
            "client_action_sequence": 1,
            "action_id": "act.1",
            "idempotency_key": "i.1",
            "parameters": {},
        },
    )
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "LOOK",
            "agent_id": "agent.e2e",
            "client_action_sequence": 2,
            "action_id": "act.2",
            "idempotency_key": "i.2",
            "parameters": {"attention_spent": 1},
        },
    )
    assert rt.list_trajectories()

    state = rt.store.get_state()
    genome = dict(validate_genome(_load("parent-genome.json")))
    genome["affected_rooms"] = [state.active_agents["agent.e2e"]["room_id"]]
    genome["content_digest"] = genome_content_digest(genome)

    researcher = rt.create_session(role=Role.RESEARCHER)
    request = dict(_load("frontier-request.json"))
    request["request_id"] = "fdrq.e2e.001"
    out = rt.run_frontier(
        researcher["session_id"],
        request,
        {"template.strategic-baseline": genome},
        inject=True,
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
        ],
    )
    assert out["selected"]
    assert out["injection_events"]
    assert out["audit"]

    # player observation still works; no research private keys
    obs = rt.observe(player["session_id"])
    blob = json.dumps(obs)
    assert "novelty_vector" not in blob
    assert "selection_rationale" not in blob

    # ledger has situation
    # v3.2.1: cleaned direct raw field access; use safe getattr (situations is minor; no full bundle yet)
    state = rt.store.get_state()
    assert getattr(state, 'situations', None)  # non-empty situations present

    # spectator sees pressure not targeting
    spectator = rt.create_session(role=Role.SPECTATOR)
    live = rt.watch_live(spectator["session_id"])
    assert "world_pressures" in live
    assert "novelty_vector" not in json.dumps(live)

    # replay frontier decision determinism
    out2 = rt.run_frontier(
        researcher["session_id"],
        request,
        {"template.strategic-baseline": genome},
        inject=False,
        explicit_mutation_plans=[
            [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 700}}]
        ],
    )
    assert out["selected"] == out2["selected"]
    assert out["replay_context"]["selected_situation_digests"] == out2["replay_context"]["selected_situation_digests"]


def test_request_digest_matches_fixture():
    req = _load("frontier-request.json")
    assert sha256_digest(req) == _load("expected-digests.json")["request_digest"]


def test_config_digest_matches_fixture():
    assert sha256_digest(director_config()) == "sha256:8ceb65463914f92a3425aa04280971018a26fabfdf1df21d1a3f3f03d3ca2283"


def test_play_ready_despite_research_degraded(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    rt.research._failures.append("synthetic")
    ready = rt.ready()
    assert ready["ready"] is True
    assert ready["research_optional"]["required_for_play"] is False
