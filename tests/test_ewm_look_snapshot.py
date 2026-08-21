"""LOOK JSON → EWM snapshot. Drives workers/noema/scripts/ewm_look_snapshot.py."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "workers" / "noema" / "scripts"))
from ewm_look_snapshot import is_canned_snapshot, look_observation_to_snapshot  # noqa: E402


def _look(*, salvage_amount: float = 7, extra_ents=None, budgets=None, **obs_extra):
    ents = [
        {
            "entity_id": "entity.salvage-cache",
            "stock_resource": "materials",
            "stock_amount": salvage_amount,
        },
        {"entity_id": "entity.old-market-post", "entity_type": "INFRASTRUCTURE"},
        {
            "entity_id": "entity.production-node-ewm",
            "stock_resource": "materials",
            "stock_amount": 3,
        },
    ]
    if extra_ents:
        ents.extend(extra_ents)
    obs = {
        "ok": True,
        "observation": {
            "cycle": 0,
            "sequence": 4,
            "in_world": True,
            "budgets": budgets or {"attention": 6, "compute": 63, "energy": 78, "influence": 40, "storage": 15},
            "location": {
                "name": "Civic Exchange",
                "entities": ents,
                "co_evolution": {"harvest_pressure": 0.8, "regen_mod": 0},
            },
            "affordances": [{"operation": "HARVEST", "available": True}],
            **obs_extra,
        },
    }
    return obs


def test_missing_salvage_fail_closed():
    payload = _look()
    payload["observation"]["location"]["entities"] = [
        {"entity_id": "entity.old-market-post", "entity_type": "INFRASTRUCTURE"}
    ]
    assert look_observation_to_snapshot(payload) is None
    assert look_observation_to_snapshot({}) is None
    assert look_observation_to_snapshot(None) is None


def test_live_look_is_not_canned_and_sums_materials():
    snap = look_observation_to_snapshot(_look(salvage_amount=7))
    assert snap is not None
    assert snap["source"] == "look"
    assert snap["materials"] == pytest.approx(10.0)  # 7 salvage + 3 production node
    assert snap["salvage_stock"] == pytest.approx(7.0)
    assert snap["cycle"] == 0
    assert snap["co_evolution"]["harvest_pressure"] == pytest.approx(0.8)
    assert snap["agents"][0]["influence"] == pytest.approx(40)
    assert not is_canned_snapshot(snap)
    # canned triple from the old verifier must not match live Civic Exchange
    assert not (
        snap["materials"] == 12.0 and snap["cycle"] == 15 and snap["org_threshold"] == 3.8
    )


def test_is_canned_snapshot_detects_old_hardcoded_triple():
    assert is_canned_snapshot({"materials": 12.0, "cycle": 15, "org_threshold": 3.8})
    assert not is_canned_snapshot({"materials": 10.0, "cycle": 0, "org_threshold": 5.0})
