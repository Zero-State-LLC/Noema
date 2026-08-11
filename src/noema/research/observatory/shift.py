"""Behavior-shift candidates (magnitude + persistence rules)."""

from __future__ import annotations

from typing import Any

from noema.research.errors import NOT_COMPUTABLE, ResearchError
from noema.research.observatory.catalog import shift_config
from noema.research.observatory.context import blocks_claim
from noema.research.observatory.features import feature_delta
from noema.world.digest import sha256_digest


def detect_shift(
    *,
    pre_features: dict[str, Any],
    post_features: dict[str, Any],
    feature_id: str = "cooperation_signal",
    trajectory_refs: list[str],
    comparability: str | dict[str, Any],
    supporting_evidence: list[str] | None = None,
    persistence_cycles: int | None = None,
    shift_type: str = "cooperation_shift",
    candidate_id: str | None = None,
) -> dict[str, Any] | None:
    cfg = shift_config()
    min_mag = int(cfg.get("min_magnitude_millipoints") or 250)
    min_pers = int(cfg.get("min_persistence_cycles") or 10)
    if blocks_claim(comparability):
        raise ResearchError(NOT_COMPUTABLE, "NOT_COMPARABLE blocks shift claim")

    delta = feature_delta(pre_features, post_features, feature_id)
    if delta is None:
        return {
            "schema_version": "behavior-shift-candidate/0.3",
            "candidate_id": candidate_id or "shift.nc",
            "analysis_status": "NOT_COMPUTABLE",
            "claim_label": "NOT_COMPUTABLE",
            "fired": False,
        }

    mag = abs(int(delta))
    pre_w = pre_features.get("window") or {}
    post_w = post_features.get("window") or {}
    pers = persistence_cycles
    if pers is None:
        pers = int(post_w.get("end_cycle", 0)) - int(post_w.get("start_cycle", 0)) + 1

    if mag < min_mag:
        return None  # temporary / below magnitude
    if pers < min_pers:
        return {
            "schema_version": "behavior-shift-candidate/0.3",
            "candidate_id": candidate_id or "shift.temp",
            "shift_type": shift_type,
            "form": "temporary_response",
            "magnitude_millipoints": mag,
            "persistence_cycles": pers,
            "fired": False,
            "claim_label": "INFERRED",
            "analysis_status": "BELOW_PERSISTENCE",
        }

    comp = comparability if isinstance(comparability, str) else comparability.get("result")
    cand = {
        "schema_version": "behavior-shift-candidate/0.3",
        "candidate_id": candidate_id or f"shift.{feature_id}.{trajectory_refs[0] if trajectory_refs else 'x'}",
        "shift_type": shift_type,
        "pre_window": dict(pre_w),
        "post_window": dict(post_w),
        "magnitude_millipoints": mag,
        "persistence_cycles": int(pers),
        "context_comparability": comp,
        "trajectory_refs": list(trajectory_refs),
        "form": "regime_shift",
        "supporting_evidence": list(supporting_evidence or []),
        "feature_id": feature_id,
        "claim_label": "INFERRED",
        "analysis_status": "EMITTED",
        "fired": True,
        "world_mutation": False,
    }
    cand["digest"] = sha256_digest({k: v for k, v in cand.items() if k != "digest"})
    return cand
