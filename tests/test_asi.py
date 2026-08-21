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
