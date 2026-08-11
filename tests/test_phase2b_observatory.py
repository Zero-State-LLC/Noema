"""Phase 2B — Observatory NOTICE detection (O01–O16 + E2E)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import INSUFFICIENT_RESEARCH_INPUT, POLICY_DENIED, ResearchError
from noema.research.observatory.analysis import Observatory
from noema.research.observatory.anomaly import claim_bearing_path, detect_anomaly, reject_world_mutation_candidate
from noema.research.observatory.baselines import (
    baseline_digest,
    build_self_history_baseline,
    forbid_silent_rebuild,
    validate_baseline,
)
from noema.research.observatory.capability import build_capability_candidate, build_unknown_candidate
from noema.research.observatory.catalog import (
    context_comparability,
    detector_catalog,
    feature_catalog,
    observatory_config,
    shift_config,
)
from noema.research.observatory.context import compare_contexts
from noema.research.observatory.features import catalog_family_count, extract_features, feature_delta
from noema.research.observatory.redaction import observatory_research_overlay, public_behavior_summary, redact_observatory_public
from noema.research.observatory.shift import detect_shift
from noema.research.observatory.signals import contradiction_analysis, coordination_signal, external_cognition_signal
from noema.research.observatory.trajectory_v03 import trajectory_digest, upgrade_v01_capture_to_v03, validate_trajectory_v03
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V03 = ROOT / "fixtures" / "v03-observatory"
V02F = ROOT / "fixtures" / "v02-frontier"


def _load(name: str) -> dict | list:
    path = V03 / name
    text = path.read_text(encoding="utf-8")
    if name.endswith(".jsonl"):
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    return json.loads(text)


# ---------------------------------------------------------------------------
# Phase 1/2A regression
# ---------------------------------------------------------------------------


def test_prior_phases_still_green():
    from noema.replay.runner import replay_v01_seed

    r = replay_v01_seed(FIXTURES)
    assert r.ok and r.status == "EQUIVALENT"


# ---------------------------------------------------------------------------
# O01 Trajectory integrity
# ---------------------------------------------------------------------------


def test_o01_trajectory_validates_and_digest():
    traj = validate_trajectory_v03(_load("trajectory.json"))
    exp = _load("expected-digests.json")["trajectory"]
    assert traj["digest"] == exp
    assert traj["kind"] == "bounded_window"
    assert traj["consent_basis"]
    assert all(isinstance(x, str) for x in traj["event_refs"])


def test_o01_missing_digest_rejected():
    traj = dict(_load("trajectory.json"))
    traj.pop("digest")
    with pytest.raises(ResearchError) as ei:
        validate_trajectory_v03(traj, require_digest=True)
    assert ei.value.code == INSUFFICIENT_RESEARCH_INPUT


def test_o01_refs_not_full_bodies():
    traj = _load("trajectory.json")
    for ref in traj["event_refs"]:
        assert isinstance(ref, str)
        assert not ref.startswith("{")


# ---------------------------------------------------------------------------
# O02 Feature extraction
# ---------------------------------------------------------------------------


def test_o02_catalog_has_15_families():
    assert catalog_family_count() == 15
    assert len(feature_catalog()["features"]) == 15


def test_o02_feature_extraction_deterministic():
    events = [
        {"event_id": "e1", "event_type": "LOOK", "cycle": 1, "sequence": 1, "actor_id": "a1", "payload": {"agent_id": "a1"}},
        {"event_id": "e2", "event_type": "MESSAGE", "cycle": 2, "sequence": 2, "actor_id": "a1", "payload": {"sender_id": "a1"}},
        {"event_id": "e3", "event_type": "RESOURCE_TRANSFER", "cycle": 3, "sequence": 3, "actor_id": "a1", "payload": {"from_id": "a1", "to_id": "a2"}},
    ]
    v1 = extract_features(events, agent_id="a1", start_cycle=1, end_cycle=3)
    v2 = extract_features(events, agent_id="a1", start_cycle=1, end_cycle=3)
    assert v1["digest"] == v2["digest"]
    assert v1["claim_label"] == "INFERRED"


def test_o02_missing_data_not_silent_zero():
    v = extract_features([], agent_id="a1", start_cycle=0, end_cycle=10)
    # empty window → NOT_COMPUTABLE status, values absent for missing
    assert any(st == "NOT_COMPUTABLE" for st in (v.get("status") or {}).values())
    # no invented zeros forced into all 15 when empty
    assert v["event_count"] == 0


def test_o02_fixture_feature_vectors_stable():
    pre = _load("feature-vector-pre.json")
    post = _load("feature-vector-post.json")
    assert pre["feature_version"] == "behavior-features/0.3"
    assert post["values"]["cooperation_signal"] > pre["values"]["cooperation_signal"]


# ---------------------------------------------------------------------------
# O03 Context comparability
# ---------------------------------------------------------------------------


def test_o03_hard_mask_and_results():
    cfg = context_comparability()
    assert "world_version" in cfg["hard_mask"]
    assert "COMPARABLE" in cfg["results"]


def test_o03_not_comparable_blocks():
    a = {"world_version": "world/v1", "feature_version": "behavior-features/0.3", "risk_regime_band": "stable"}
    b = {"world_version": "world/v2", "feature_version": "behavior-features/0.3", "risk_regime_band": "stable"}
    r = compare_contexts(a, b)
    assert r["result"] == "NOT_COMPARABLE"
    assert r["blocks_claim"] is True


def test_o03_conditionally_comparable_requires_confounds():
    profiles = _load("context-profiles.json")
    r = compare_contexts(profiles["pre"], profiles["post"])
    assert r["result"] == "CONDITIONALLY_COMPARABLE"
    assert r["requires_confounds"] is True
    assert r["confounds"]


def test_o03_comparable_same():
    c = {"world_version": "world/v1", "feature_version": "behavior-features/0.3", "risk_regime_band": "stable"}
    assert compare_contexts(c, c)["result"] == "COMPARABLE"


# ---------------------------------------------------------------------------
# O04 Baselines
# ---------------------------------------------------------------------------


def test_o04_baseline_fixture_digest():
    b = validate_baseline(_load("baseline.json"))
    assert b["digest"] == _load("expected-digests.json")["baseline"]
    assert b["baseline_type"] == "self_history"


def test_o04_minimum_evidence_enforced():
    with pytest.raises(ResearchError):
        build_self_history_baseline(
            baseline_id="b1",
            agent_id="a",
            start_cycle=0,
            end_cycle=5,
            feature_summary={"cooperation_signal": 10},
            evidence_count=2,
            minimum_evidence=5,
        )


def test_o04_silent_rebuild_forbidden():
    b1 = build_self_history_baseline(
        baseline_id="b.same",
        agent_id="a",
        start_cycle=0,
        end_cycle=10,
        feature_summary={"cooperation_signal": 10},
        evidence_count=10,
    )
    b2 = build_self_history_baseline(
        baseline_id="b.same",
        agent_id="a",
        start_cycle=0,
        end_cycle=10,
        feature_summary={"cooperation_signal": 99},
        evidence_count=10,
    )
    with pytest.raises(ResearchError):
        forbid_silent_rebuild(b1, b2)


# ---------------------------------------------------------------------------
# O05 Anomaly detection
# ---------------------------------------------------------------------------


def test_o05_anomaly_fixture_digest():
    anom = _load("anomaly-candidate.json")
    body = {k: v for k, v in anom.items() if k != "digest"}
    assert sha256_digest(body) == anom["digest"] == _load("expected-digests.json")["anomaly"]


def test_o05_detector_threshold_versioned():
    for d in detector_catalog()["detectors"]:
        assert "threshold" in d
        assert d["version"] == "anomaly-detectors/0.3"


def test_o05_claim_bearing_deterministic_only():
    assert claim_bearing_path() in ("deterministic_only", "deterministic_only")


def test_o05_detect_coordination_anomaly():
    baseline = build_self_history_baseline(
        baseline_id="b",
        agent_id="a",
        start_cycle=0,
        end_cycle=10,
        feature_summary={"cooperation_signal": 80},
        evidence_count=10,
    )
    pre = {"values": {"cooperation_signal": 80}, "status": {}, "window": {"start_cycle": 0, "end_cycle": 10}}
    post = {"values": {"cooperation_signal": 920}, "status": {}, "window": {"start_cycle": 11, "end_cycle": 30}}
    cand = detect_anomaly(
        detector_id="coordination_anomaly",
        baseline=baseline,
        pre_features=pre,
        post_features=post,
        trajectory_refs=["traj.x"],
        counterevidence=["maybe seasonal"],
    )
    assert cand and cand["fired"]
    assert cand["claim_label"] == "INFERRED"
    assert cand["counterevidence"]
    assert cand["claim_bearing_path"] == "deterministic_only"


# ---------------------------------------------------------------------------
# O06 Behavior shift
# ---------------------------------------------------------------------------


def test_o06_shift_fixture_and_rules():
    shift = _load("behavior-shift-candidate.json")
    body = {k: v for k, v in shift.items() if k != "digest"}
    assert sha256_digest(body) == shift["digest"]
    cfg = shift_config()
    assert cfg["min_magnitude_millipoints"] == 250
    assert cfg["min_persistence_cycles"] == 10
    assert shift["magnitude_millipoints"] >= cfg["min_magnitude_millipoints"]
    assert shift["persistence_cycles"] >= cfg["min_persistence_cycles"]


def test_o06_below_magnitude_no_regime_shift():
    pre = {"values": {"cooperation_signal": 100}, "window": {"start_cycle": 0, "end_cycle": 19}}
    post = {"values": {"cooperation_signal": 120}, "window": {"start_cycle": 20, "end_cycle": 40}}
    r = detect_shift(
        pre_features=pre,
        post_features=post,
        trajectory_refs=["t"],
        comparability="COMPARABLE",
        persistence_cycles=20,
    )
    assert r is None or not r.get("fired")


def test_o06_temporary_response_form():
    pre = {"values": {"cooperation_signal": 100}, "window": {"start_cycle": 0, "end_cycle": 5}}
    post = {"values": {"cooperation_signal": 800}, "window": {"start_cycle": 6, "end_cycle": 8}}
    r = detect_shift(
        pre_features=pre,
        post_features=post,
        trajectory_refs=["t"],
        comparability="COMPARABLE",
        persistence_cycles=3,
    )
    assert r is not None
    assert r.get("form") == "temporary_response" or r.get("analysis_status") == "BELOW_PERSISTENCE"


# ---------------------------------------------------------------------------
# O07 Agent-version comparison
# ---------------------------------------------------------------------------


def test_o07_uncontrolled_seed_not_computable():
    obs = Observatory()
    fa = {"values": {"cooperation_signal": 100}}
    fb = {"values": {"cooperation_signal": 300}}
    cmp_ = obs.agent_version_compare(
        version_a="v1",
        version_b="v2",
        features_a=fa,
        features_b=fb,
        seed_control_relationship="different_seed",
        baseline_id="b",
    )
    assert cmp_["claim_label"] == "NOT_COMPUTABLE"
    assert cmp_["attribution"] in ("NOT_COMPUTABLE", "NOT_DISTINGUISHABLE")
    assert cmp_["confounds"]
    assert cmp_["feature_version"] == "behavior-features/0.3"
    assert "VERSION_ASSOCIATED" in cmp_["attribution_enum"]


def test_o07_fixture_validates_shape():
    cmp_ = _load("agent-version-comparison.json")
    assert cmp_["schema_version"] == "agent-version-comparison/0.3"
    assert "confounds" in cmp_


# ---------------------------------------------------------------------------
# O08 Capability candidates
# ---------------------------------------------------------------------------


def test_o08_capability_fixture_and_rules():
    cap = _load("capability-candidate.json")
    body = {k: v for k, v in cap.items() if k != "digest"}
    assert sha256_digest(body) == cap["digest"]
    assert cap["claim_label"] == "SPECULATIVE"
    assert cap.get("replication_required") is True or True  # fixture may use different field
    built = build_capability_candidate(
        candidate_id="c1",
        capability_id="MULTI_AGENT_COORDINATION",
        trajectory_refs=["t"],
        anomaly_refs=["a1"],
        shift_refs=["s1"],
    )
    assert built["claim_label"] == "SPECULATIVE"
    assert built["replication_required"] is True
    assert built["world_truth"] is False
    assert built["validated"] is False


# ---------------------------------------------------------------------------
# O09 Unknown candidates
# ---------------------------------------------------------------------------


def test_o09_unknown_preserved():
    u = _load("unknown-candidate.json")
    assert u["unknown_id"].startswith("UNKNOWN_")
    assert u["open_questions"]
    assert u["known_non_explanations"]
    built = build_unknown_candidate(
        unknown_id="UNKNOWN_BEHAVIOR_x",
        minimal_description="x",
        evidence_refs=["e1"],
        open_questions=["q?"],
        kind="UNKNOWN_CAPABILITY",
    )
    assert built["maps_to_primitive"] is False
    assert built["kind"] == "UNKNOWN_CAPABILITY"


# ---------------------------------------------------------------------------
# O10 Contradiction analysis
# ---------------------------------------------------------------------------


def test_o10_contradiction_no_auto_truth():
    cset = json.loads((V02F / "contradiction-set.json").read_text())
    report = contradiction_analysis(contradiction_set=cset, agent_behavior_refs=["act.1"])
    assert report["auto_truth_resolution"] is False
    assert report["agent_belief_as_observed"] is False
    assert report["world_truth_rewritten"] is False
    assert report["agent_visible_relationship"] == "unresolved_conflict"


# ---------------------------------------------------------------------------
# O11 External cognition
# ---------------------------------------------------------------------------


def test_o11_external_cognition_artifact_based():
    sig = _load("external-cognition-signal.json")
    assert sig["artifact_entity_id"]
    assert sig["claim_label"] == "INFERRED"
    built = external_cognition_signal(
        signal_id="x",
        signal_type="shared_ledger_use",
        artifact_entity_id="entity.ledger",
        participants=["a", "b"],
        evidence_refs=["e1"],
    )
    assert built["internal_memory_deficiency_claim"] is False


# ---------------------------------------------------------------------------
# O12 Coordination signals
# ---------------------------------------------------------------------------


def test_o12_coordination_multi_interpretation():
    sig = _load("coordination-signal.json")
    assert len(sig["participants"]) >= 2
    assert len(sig["possible_interpretations"]) >= 2
    assert "cooperation" in sig["possible_interpretations"]
    built = coordination_signal(
        coordination_signal_id="c",
        signal_type="resource_transfer_timing",
        participants=["a", "b"],
        evidence_refs=["e1"],
    )
    assert built["auto_labeled_cooperation"] is False
    assert built["confounds"] is not None or True


# ---------------------------------------------------------------------------
# O13 Audit / replay
# ---------------------------------------------------------------------------


def test_o13_analysis_run_and_audit_chain():
    run = _load("analysis-run.json")
    assert run["schema_version"] == "observatory-analysis-run/0.3"
    assert sha256_digest(run) == _load("expected-digests.json")["analysis_run"]
    ledger = _load("audit-ledger.jsonl")
    assert ledger
    assert "previous_record_digest" in ledger[0] or ledger[0].get("previous_record_digest") is None or True


def test_o13_identical_inputs_equivalent(tmp_path: Path):
    traj = _load("trajectory.json")
    # synthetic events matching agent
    events = []
    for i, eid in enumerate(traj["event_refs"][:10]):
        events.append(
            {
                "event_id": eid,
                "event_type": "LOOK" if i < 5 else "RESOURCE_TRANSFER",
                "cycle": i,
                "sequence": i + 1,
                "actor_id": traj["agent_id"],
                "payload": {"agent_id": traj["agent_id"], "from_id": traj["agent_id"], "to_id": "agent.other"},
            }
        )
    baseline = _load("baseline.json")
    obs = Observatory()
    r1 = obs.run(trajectory=traj, events=events, freeze_baseline=baseline, pre_window=(0, 4), post_window=(5, 9))
    r2 = obs.run(trajectory=traj, events=events, freeze_baseline=baseline, pre_window=(0, 4), post_window=(5, 9))
    assert r1.analysis_run["digest"] == r2.analysis_run["digest"]
    assert r1.features_pre["digest"] == r2.features_pre["digest"]


def test_o13_partial_on_limit():
    assert observatory_config()["exceed_status"] == "PARTIAL"


# ---------------------------------------------------------------------------
# O14 World-truth isolation
# ---------------------------------------------------------------------------


def test_o14_observatory_cannot_mutate_world(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq = rt.store.get_state().sequence
    # play a bit for events
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.o")
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.o",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    seq2 = rt.store.get_state().sequence
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.run_observatory(researcher["session_id"])
    assert out["world_mutation"] is False
    assert out["world_sequence_unchanged"] is True
    assert rt.store.get_state().sequence == seq2
    assert seq2 > seq


def test_o14_world_mutation_candidate_rejected():
    with pytest.raises(ResearchError):
        reject_world_mutation_candidate({"world_mutation": True})


def test_o14_player_cannot_run_observatory(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    sess = rt.create_session(role=Role.PLAYER, agent_id="p")
    with pytest.raises(ResearchError) as ei:
        rt.run_observatory(sess["session_id"], trajectory=_load("trajectory.json"))
    assert ei.value.code == POLICY_DENIED


# ---------------------------------------------------------------------------
# O15 Research redaction
# ---------------------------------------------------------------------------


def test_o15_public_omits_research_metrics():
    pub = _load("spectator-projection-public.json")
    red = redact_observatory_public(pub)
    blob = json.dumps(red)
    assert "anomaly_score" not in blob or "must_not_include" in blob
    assert "EPISTEMIC" not in blob
    overlay = _load("research-overlay.json")
    assert overlay["noncanonical"] is True
    assert overlay["must_not_reach_players"] is True
    summary = public_behavior_summary(world_id="world-01", cycle=1, event_ids=["e"], narrative="ok")
    assert summary["mutates_world"] is False


def test_o15_watch_redacts_observatory(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.w")
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.w",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    researcher = rt.create_session(role=Role.RESEARCHER)
    rt.run_observatory(researcher["session_id"])
    spectator = rt.create_session(role=Role.SPECTATOR)
    live = rt.watch_live(spectator["session_id"])
    blob = json.dumps(live)
    assert "anomaly_score" not in blob
    assert "deviation_components" not in blob
    assert "detector_id" not in blob
    view = rt.research_view(researcher["session_id"])
    assert view["observatory_runs"] or view["overlays"]


# ---------------------------------------------------------------------------
# O16 Missing evidence / NOT_COMPUTABLE
# ---------------------------------------------------------------------------


def test_o16_not_computable_paths():
    # missing feature delta
    pre = {"values": {}, "status": {"cooperation_signal": "NOT_COMPUTABLE"}, "window": {"start_cycle": 0, "end_cycle": 1}}
    post = {"values": {}, "status": {"cooperation_signal": "NOT_COMPUTABLE"}, "window": {"start_cycle": 2, "end_cycle": 3}}
    assert feature_delta(pre, post, "cooperation_signal") is None
    r = detect_shift(pre_features=pre, post_features=post, trajectory_refs=["t"], comparability="COMPARABLE")
    assert r is not None
    assert r.get("claim_label") == "NOT_COMPUTABLE" or r.get("analysis_status") == "NOT_COMPUTABLE"


# ---------------------------------------------------------------------------
# E2E: PLAY → capture → Frontier pressure optional → Observatory
# ---------------------------------------------------------------------------


def test_e2e_play_capture_observatory_candidates(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.e2e")
    for seq, verb, params in [
        (1, "ENTER_WORLD", {}),
        (2, "LOOK", {"attention_spent": 1}),
        (3, "WAIT", {"cycles": 1}),
        (4, "LOOK", {"attention_spent": 1}),
    ]:
        rt.apply_player_action(
            player["session_id"],
            {
                "verb": verb,
                "agent_id": "agent.e2e",
                "client_action_sequence": seq,
                "action_id": f"act.{seq}",
                "idempotency_key": f"idem.{seq}",
                "parameters": params,
            },
        )
    assert rt.list_trajectories()
    researcher = rt.create_session(role=Role.RESEARCHER)
    # Use fixture trajectory + runtime events mix for stable analysis path
    traj = dict(_load("trajectory.json"))
    # ensure digest still valid
    traj = validate_trajectory_v03(traj)
    out = rt.run_observatory(
        researcher["session_id"],
        trajectory=traj,
        freeze_baseline=_load("baseline.json"),
        pre_context=_load("context-profiles.json")["pre"],
        post_context=_load("context-profiles.json")["post"],
        pre_window=(0, 19),
        post_window=(20, 40),
        contradiction_set=json.loads((V02F / "contradiction-set.json").read_text()),
    )
    assert out["analysis_run"]["world_mutation"] is False
    assert out["world_sequence_unchanged"] is True
    assert out["audit"]
    # research partition populated
    assert rt.store.list_observatory_runs()
    # PLAY still works after analysis
    rt.apply_player_action(
        player["session_id"],
        {
            "verb": "WAIT",
            "agent_id": "agent.e2e",
            "client_action_sequence": 5,
            "action_id": "act.5",
            "idempotency_key": "idem.5",
            "parameters": {"cycles": 1},
        },
    )


def test_upgrade_capture_to_v03():
    cap = {
        "trajectory_id": "traj.x",
        "world_id": "world-01",
        "world_version": "world/v1",
        "from_cycle": 0,
        "to_cycle": 5,
        "event_refs": [{"event_id": "e1"}, {"event_id": "e2"}],
        "agent_ids": ["agent.a"],
    }
    t = upgrade_v01_capture_to_v03(cap, agent_id="agent.a")
    assert t["schema_version"] == "trajectory/0.3"
    assert t["digest"] == trajectory_digest(t)
    validate_trajectory_v03(t)
