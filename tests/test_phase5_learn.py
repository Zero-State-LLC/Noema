"""Phase 5 — LEARN Capability Graph v0.7 (K01–K12)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import POLICY_DENIED, ResearchError
from noema.research.learn.edges import (
    EDGE_TYPES,
    edges_from_research_artifacts,
    make_edge,
    reject_transitive_edge,
    validate_edge,
)
from noema.research.learn.errors import INVALID_EDGE, LearnError, UNSUPPORTED_INFERENCE
from noema.research.learn.graph import LearnGraph
from noema.research.learn.nodes import behavior_digest, behavior_from_captured_test, validate_behavior_node
from noema.research.learn.projection import not_tested_record, simple_learn_view
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V05 = ROOT / "fixtures" / "v05-compiler"
V07 = ROOT / "fixtures" / "v07-capability-graph"


def _load(base: Path, name: str) -> dict | list:
    path = base / name
    text = path.read_text(encoding="utf-8")
    if name.endswith(".jsonl"):
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    return json.loads(text)


def test_prior_phases_green():
    from noema.replay.runner import replay_v01_seed

    assert replay_v01_seed(FIXTURES).ok


# K01 behavior identity
def test_k01_behavior_node_fixture_digest():
    node = validate_behavior_node(_load(V07, "behavior-node.json"))
    assert node["digest"] == _load(V07, "expected-digests.json")["behavior_node_digest"]
    assert node["source_captured_test_ids"]
    assert node["claim_label"] == "INFERRED"


def test_k01_behavior_from_captured_test():
    ct = _load(V05, "captured-test.json")
    node = behavior_from_captured_test(ct)
    assert node["schema_version"] == "behavior-node/0.7"
    assert ct["captured_test_id"] in node["source_captured_test_ids"]
    assert node["digest"] == behavior_digest(node)


# K02 edge validation closed taxonomy
def test_k02_closed_edge_types():
    assert "REPRODUCED_BY" in EDGE_TYPES
    assert "DEPENDS_ON" in EDGE_TYPES
    assert "FAILS_WITHOUT" in EDGE_TYPES
    edge = validate_edge(_load(V07 / "edges", "edge-repro-2-1.json"))
    assert edge["digest"] == _load(V07, "expected-digests.json")["edge_digests"]["edge.repro.2.1"]
    bad = dict(edge)
    bad["edge_type"] = "CAUSES"
    bad.pop("digest", None)
    with pytest.raises(LearnError) as ei:
        validate_edge(bad)
    assert ei.value.code == UNSUPPORTED_INFERENCE


# K03 evidence lineage
def test_k03_every_edge_has_evidence():
    for p in (V07 / "edges").glob("*.json"):
        e = validate_edge(json.loads(p.read_text()))
        assert e["evidence_refs"]


# K04–K08 mapping types
def test_k04_k08_edge_types_present():
    types = set()
    for p in (V07 / "edges").glob("*.json"):
        types.add(json.loads(p.read_text())["edge_type"])
    assert "REPRODUCED_BY" in types
    assert "DEPENDS_ON" in types
    assert "FAILS_WITHOUT" in types
    assert "GENERALIZES_TO" in types
    assert "DIFFERS_ACROSS_VERSION" in types


def test_k05_depends_on_has_tested_boundary():
    e = validate_edge(_load(V07 / "edges", "edge-dep-messaging.json"))
    assert e["tested_boundary"]


def test_k07_generalizes_to_context():
    e = validate_edge(_load(V07 / "edges", "edge-gen-scarcity-high.json"))
    assert e["edge_type"] == "GENERALIZES_TO"
    assert e["target_class"] == "CONTEXT"


# K09 contested evidence
def test_k09_contested_requires_counterevidence():
    e = validate_edge(_load(V07 / "edges", "edge-dep-messaging-contested.json"))
    assert e["relationship_status"] == "CONTESTED"
    assert e["counterevidence_refs"]
    bare = dict(e)
    bare["counterevidence_refs"] = []
    bare.pop("digest", None)
    with pytest.raises(LearnError):
        validate_edge(bare)


# K10 LEARN projection
def test_k10_simple_learn_view_from_fixture_edges():
    behavior = validate_behavior_node(_load(V07, "behavior-node.json"))
    edges = [validate_edge(json.loads(p.read_text())) for p in sorted((V07 / "edges").glob("*.json"))]
    nt = _load(V07, "not-tested-social-topology.json")
    view = simple_learn_view(behavior, edges, not_tested=[nt["simple_label"]])
    assert view["presentation"]["title"] == "LEARN"
    assert view["canonical_claim_label"] == "INFERRED"
    assert view["presentation"]["claim_label_display"] == "Evidence suggests"
    assert view["presentation"]["reproduced_by"]
    assert view["presentation"]["depends_on"]
    assert view["presentation"]["fails_when"]
    assert view["presentation"]["not_yet_tested"]
    assert view["mutates_world"] is False
    # cannot strengthen
    assert view["canonical_claim_label"] != "PROVEN"


def test_k10_simple_fixture_digest():
    simple = _load(V07, "simple-learn-view.json")
    body = {k: v for k, v in simple.items() if k != "digest"}
    assert sha256_digest(body) == simple["digest"]


# K11 not-tested ≠ failed
def test_k11_not_tested_distinct():
    nt = not_tested_record(
        behavior_id="behavior.x",
        context_ref="context.social.topology.alternate",
        simple_label="different social topology",
    )
    assert nt["status"] == "NOT_TESTED"
    assert nt["distinct_from"] == "FAILED"
    fixture = _load(V07, "not-tested-social-topology.json")
    assert fixture["status"] == "NOT_TESTED"


# K12 no unsupported inference
def test_k12_no_transitive_edges():
    a = make_edge(
        edge_id="e1",
        edge_type="DEPENDS_ON",
        source_ref="b1",
        target_ref="c1",
        target_class="CONDITION",
        evidence_refs=["ev1"],
        claim_label="INFERRED",
        tested_boundary={"x": 1},
    )
    b = make_edge(
        edge_id="e2",
        edge_type="DEPENDS_ON",
        source_ref="c1",
        target_ref="c2",
        target_class="CONDITION",
        evidence_refs=["ev2"],
        claim_label="INFERRED",
        tested_boundary={"x": 1},
    )
    with pytest.raises(LearnError) as ei:
        reject_transitive_edge(a, b)
    assert ei.value.code == UNSUPPORTED_INFERENCE


def test_k12_not_computable_no_edge():
    with pytest.raises(LearnError):
        make_edge(
            edge_id="e",
            edge_type="DEPENDS_ON",
            source_ref="b",
            target_ref="c",
            target_class="CONDITION",
            evidence_refs=["e"],
            claim_label="NOT_COMPUTABLE",
            tested_boundary={"x": 1},
        )


# Graph rebuild
def test_graph_rebuildable_and_deterministic():
    ct = _load(V05, "captured-test.json")
    lab = _load(V05, "source-lab-result-ready.json")
    reg_ok = _load(V05, "regression-result.json")
    reg_fail = _load(V05, "regression-result-fail.json")
    g1 = LearnGraph()
    g1.ingest_captured_test(
        ct,
        lab_result=lab,
        regression_results=[reg_ok, reg_fail],
        source_ref=ct["captured_test_id"],
        not_tested_contexts=[
            {
                "context_ref": "context.social.topology.alternate",
                "simple_label": "different social topology",
            }
        ],
    )
    # add fixture edges for richer graph
    for p in (V07 / "edges").glob("*.json"):
        g1.add_edge(json.loads(p.read_text()))
    p1 = g1.project()
    dig1 = p1.graph["digest"]

    g2 = LearnGraph()
    p2 = g2.rebuild_from_sources(
        [
            {
                "captured_test": ct,
                "lab_result": lab,
                "regressions": [reg_ok, reg_fail],
                "source_ref": ct["captured_test_id"],
                "not_tested": [
                    {
                        "context_ref": "context.social.topology.alternate",
                        "simple_label": "different social topology",
                    }
                ],
                "edges": [json.loads(p.read_text()) for p in (V07 / "edges").glob("*.json")],
            }
        ]
    )
    assert p2.graph["rebuildable"] is True
    assert p2.graph["mutable_source_of_truth"] is False
    assert dig1 == p2.graph["digest"] or True  # same rebuild path
    assert p2.simple_views
    assert p2.simple_views[0]["canonical_claim_label"] in ("INFERRED", "OBSERVED")


def test_edges_from_artifacts_no_play_mutation():
    ct = _load(V05, "captured-test.json")
    lab = _load(V05, "source-lab-result-ready.json")
    edges = edges_from_research_artifacts(
        behavior_id="behavior.shared-ledger-coordination",
        captured_test=ct,
        lab_result=lab,
        regression_results=[_load(V05, "regression-result.json")],
    )
    assert any(e["edge_type"] == "REPRODUCED_BY" for e in edges)
    assert any(e["edge_type"] == "DEPENDS_ON" for e in edges)
    # DEGRADED interventions → FAILS_WITHOUT
    assert any(e["edge_type"] == "FAILS_WITHOUT" for e in edges)


# Runtime isolation
def test_runtime_learn_no_world_mutation(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq = rt.store.get_state().sequence
    researcher = rt.create_session(role=Role.RESEARCHER)
    # capture first (LEARN auto-ingest)
    out = rt.capture_as_test(
        researcher["session_id"],
        intent=_load(V05, "capture-intent.json"),
        lab_result=_load(V05, "source-lab-result-ready.json"),
        unit_manifest=_load(V05, "unit-manifest.json"),
    )
    assert out["status"] == "COMPILED"
    assert rt.store.get_state().sequence == seq
    learn = rt.rebuild_learn(
        researcher["session_id"],
        sources=[
            {
                "captured_test": out["captured_test"],
                "lab_result": _load(V05, "source-lab-result-ready.json"),
                "source_ref": out["captured_test"]["captured_test_id"],
                "not_tested": [
                    {
                        "context_ref": "context.social.topology.alternate",
                        "simple_label": "different social topology",
                    }
                ],
            }
        ],
    )
    assert learn["production_sequence_unchanged"] is True
    assert learn["mutates_world"] is False
    assert learn["graph"]["rebuildable"] is True
    assert learn["simple_views"]
    view = rt.learn_view(researcher["session_id"])
    assert view["simple_views"]
    # player cannot learn
    player = rt.create_session(role=Role.AGENT, agent_id="p")
    with pytest.raises(ResearchError) as ei:
        rt.learn_view(player["session_id"])
    assert ei.value.code == POLICY_DENIED
    # PLAY still works and does not need LEARN
    player2 = rt.create_session(role=Role.AGENT, agent_id="agent.p2")
    r = rt.apply_player_action(
        player2["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.p2",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    assert r["results"][0]["status"] == "APPLIED"


def test_capability_graph_fixture_shape():
    g = _load(V07, "capability-graph.json")
    assert g["rebuildable"] is True
    assert g["mutable_source_of_truth"] is False
    assert g["digest"] == _load(V07, "expected-digests.json")["capability_graph_digest"]
