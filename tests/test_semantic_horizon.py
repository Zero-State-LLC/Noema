"""p5-06: missing signals still 0 semantic drift; Forman risk is deterministic."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "workers" / "noema" / "scripts"))
from economic_health import compute_economic_health  # noqa: E402


def test_missing_signals_zero_drift_control():
    snap = {"materials": 11.0, "cycle": 2, "max_materials": 18, "co_evolution": {"harvest_pressure": 0}}
    ags = [
        {"influence": 8, "attention": 12, "conversion_rate": 0.6},
        {"influence": 7, "attention": 12, "conversion_rate": 0.6},
    ]
    h = compute_economic_health(snap, ags)
    assert h.semantic_drift == 0.0
    assert h.cascading_risk == 0.0


def test_forman_identical_twice():
    snap = {
        "materials": 11.0,
        "cycle": 2,
        "max_materials": 18,
        "interaction_edges": [{"from": "hub", "to": f"leaf.{i}", "grounding": "hearsay"} for i in range(8)],
    }
    ags = [{"influence": 4, "attention": 10, "conversion_rate": 0.5}] * 2
    h1 = compute_economic_health(snap, ags)
    h2 = compute_economic_health(snap, ags)
    assert h1.cascading_risk == h2.cascading_risk
    assert h1.asi_composite == h2.asi_composite
    assert h1.cascading_risk > 0.5
