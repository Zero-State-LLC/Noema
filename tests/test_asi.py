"""ASI composite from economic_health.compute_economic_health (Semantic Evolution v0.1)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "workers" / "noema" / "scripts"))
from economic_health import compute_economic_health, sar_for_ops  # noqa: E402


def test_missing_signals_zero_semantic_drift_and_high_asi():
    snap = {"materials": 11.0, "cycle": 2, "max_materials": 18, "co_evolution": {"harvest_pressure": 0}}
    ags = [
        {"influence": 8, "attention": 12, "conversion_rate": 0.6},
        {"influence": 7, "attention": 12, "conversion_rate": 0.6},
    ]
    h = compute_economic_health(snap, ags)
    assert h.semantic_drift == 0.0
    assert h.grounding_pass_rate == 1.0
    assert h.asi_composite >= 0.99
    assert sar_for_ops(h)["patch"] == "no-op"


def test_hearsay_signals_raise_semantic_drift_and_sar_goal():
    snap = {
        "materials": 11.0,
        "cycle": 2,
        "max_materials": 18,
        "co_evolution": {"harvest_pressure": 0},
        "signals": [
            {"grounding": "hearsay"},
            {"grounding": "hearsay"},
            {"grounding": "hearsay"},
        ],
    }
    ags = [{"influence": 8, "attention": 12, "conversion_rate": 0.6}]
    h = compute_economic_health(snap, ags)
    assert h.semantic_drift == 1.0
    assert h.grounding_pass_rate == 0.0
    assert h.asi_composite < 0.7
    assert "HIGH_SEMANTIC_DRIFT" in h.alerts
    sar = sar_for_ops(h)
    assert sar["semantic_goal"] == "Reduce semantic drift while maintaining stock velocity"


def test_dense_low_grounding_graph_raises_cascading_risk():
    snap = {
        "materials": 11.0,
        "cycle": 2,
        "max_materials": 18,
        "signals": [{"grounding": "hearsay"}] * 2,
        "interaction_edges": [{"from": "a", "to": "b", "grounding": "hearsay"} for _ in range(8)],
        "image_scores": [0, 8, 0, 9],
    }
    h = compute_economic_health(snap, [{"influence": 4, "attention": 10, "conversion_rate": 0.5}] * 2)
    assert h.cascading_risk > 0.5
    assert h.reputation_stability < 1.0
    attach = __import__("economic_health", fromlist=["enrich_observation_with_ewm"]).enrich_observation_with_ewm(
        {"cycle": 2, "budgets": {"energy": 1}}, h
    )
    assert "signaling_quality" in attach["ewm_health"]
    assert "cascading_risk" in attach["ewm_health"]
    assert "drift_alerts" in attach["ewm_health"]
    assert "velocity" in attach["ewm_health"]


def test_scar_snapshot_sets_path_dependence_and_alignment():
    snap = {
        "materials": 11.0,
        "cycle": 10,
        "max_materials": 18,
        "scars": [{"strength": 0.8, "cycle_born": 2}],
        "reconstruction_fidelity": 0.6,
    }
    h = compute_economic_health(snap, [{"influence": 4, "attention": 10, "conversion_rate": 0.5}] * 2)
    assert h.path_dependence_index == 0.8
    assert h.scar_persistence == 8.0
    assert h.reconstruction_fidelity == 0.6
    assert h.historical_alignment < 1.0
    attach = __import__("economic_health", fromlist=["enrich_observation_with_ewm"]).enrich_observation_with_ewm(
        {"cycle": 10}, h
    )
    assert "scar_persistence" in attach["ewm_health"]
    assert "historical_alignment" in attach["ewm_health"]


def test_forman_star_graph_raises_cascading_risk():
    snap = {
        "materials": 11.0,
        "cycle": 2,
        "max_materials": 18,
        "interaction_edges": [{"from": "hub", "to": f"leaf.{i}", "grounding": "observed"} for i in range(8)],
    }
    h = compute_economic_health(snap, [{"influence": 4, "attention": 10, "conversion_rate": 0.5}] * 2)
    assert h.cascading_risk > 0.5


def test_observed_signals_pass_grounding():
    snap = {
        "materials": 11.0,
        "cycle": 2,
        "max_materials": 18,
        "signals": [{"grounding": "observed"}, {"grounding": "genesis"}],
    }
    h = compute_economic_health(snap, [{"influence": 4, "attention": 10, "conversion_rate": 0.5}])
    assert h.semantic_drift == 0.0
    assert h.grounding_pass_rate == 1.0
    assert "HIGH_SEMANTIC_DRIFT" not in h.alerts


def test_unobservable_inputs_are_marked_not_reported_as_zero():
    """LOOK cannot see other purses or conversion behaviour; the metrics must say
    so instead of publishing 1/n concentration and 0.0 drift as measurements."""
    from economic_health import compute_economic_health, _forman_cascading_risk

    flat = [
        {"influence": 1.0, "attention": 8, "conversion_rate": 0.5},
        {"influence": 1.0, "attention": 8, "conversion_rate": 0.5},
    ]
    h = compute_economic_health({"occupancy_weighted": True, "conversion_observed": False}, flat)
    assert "HIGH_CONCENTRATION" not in h.alerts
    assert "BEHAVIORAL_DRIFT_UNOBSERVED" in h.alerts
    assert h.uncertainty >= 0.0

    # Real purses and real spread still measure normally.
    real = [
        {"influence": 9.0, "attention": 8, "conversion_rate": 0.2},
        {"influence": 1.0, "attention": 8, "conversion_rate": 0.9},
    ]
    h2 = compute_economic_health({}, real)
    assert "HIGH_CONCENTRATION" in h2.alerts
    assert "BEHAVIORAL_DRIFT_UNOBSERVED" not in h2.alerts
    assert h2.behavioral_drift > 0.0

    # Parity with curvature.ts: malformed edges are not evidence of risk.
    assert _forman_cascading_risk([{"x": 1}, {"from": "a", "to": "a"}]) == 0.0


def test_look_snapshot_gates_on_materials_node_not_a_hardcoded_id():
    from ewm_look_snapshot import look_observation_to_snapshot

    obs = {
        "cycle": 3,
        "budgets": {"influence": 4, "attention": 9},
        "location": {
            "entities": [
                {"entity_id": "entity.other-cache", "stock_resource": "materials", "stock_amount": 5, "max_stock": 9}
            ]
        },
    }
    snap = look_observation_to_snapshot(obs)
    assert snap is not None, "a materials node in any room must produce health"
    assert snap["conversion_observed"] is False
