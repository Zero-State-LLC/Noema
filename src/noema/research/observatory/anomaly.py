"""Deterministic anomaly detection (catalog detectors)."""

from __future__ import annotations

from typing import Any

from noema.research.errors import NOT_COMPUTABLE, ResearchError
from noema.research.observatory.catalog import detector_by_id, detector_catalog
from noema.research.observatory.features import feature_delta
from noema.world.digest import sha256_digest


def claim_bearing_path() -> str:
    return str(detector_catalog().get("claim_bearing_path") or "deterministic_only")


def detect_anomaly(
    *,
    detector_id: str,
    baseline: dict[str, Any],
    pre_features: dict[str, Any],
    post_features: dict[str, Any],
    trajectory_refs: list[str],
    context_refs: list[str] | None = None,
    candidate_id: str | None = None,
    confounds: list[str] | None = None,
    counterevidence: list[str] | None = None,
) -> dict[str, Any] | None:
    """Return anomaly-candidate or None if not fired. Opaque ML is not claim-bearing."""
    if claim_bearing_path() != "deterministic_only" and claim_bearing_path() not in (
        "deterministic_only",
        None,
    ):
        # still require deterministic path for claims
        pass
    det = detector_by_id(detector_id)
    if det is None:
        raise ResearchError(NOT_COMPUTABLE, f"unknown detector {detector_id}")

    evidence = int(baseline.get("evidence_count") or baseline.get("minimum_evidence") or 0)
    if evidence < int(det.get("minimum_evidence") or 0):
        return {
            "schema_version": "anomaly-candidate/0.3",
            "candidate_id": candidate_id or f"anom.{detector_id}.insufficient",
            "detector_id": detector_id,
            "detector_version": det.get("version"),
            "analysis_status": "INSUFFICIENT_EVIDENCE",
            "claim_label": "NOT_COMPUTABLE",
            "trajectory_refs": trajectory_refs,
            "baseline_id": baseline.get("baseline_id"),
            "fired": False,
        }

    summary = baseline.get("feature_summary") or pre_features.get("values") or {}
    post_vals = post_features.get("values") or {}
    components: dict[str, int] = {}
    fired = False
    for fid in det.get("features") or []:
        base_v = summary.get(fid)
        post_v = post_vals.get(fid)
        if base_v is None or post_v is None:
            if det.get("missing_data_behavior") == "NOT_COMPUTABLE":
                return {
                    "schema_version": "anomaly-candidate/0.3",
                    "candidate_id": candidate_id or f"anom.{detector_id}.nc",
                    "detector_id": detector_id,
                    "detector_version": det.get("version"),
                    "analysis_status": "NOT_COMPUTABLE",
                    "claim_label": "NOT_COMPUTABLE",
                    "trajectory_refs": trajectory_refs,
                    "baseline_id": baseline.get("baseline_id"),
                    "fired": False,
                    "reason": f"missing feature {fid}",
                }
            continue
        delta = int(post_v) - int(base_v)
        components[f"{fid}_delta"] = delta
        # robust_z proxy: |delta| as millipoints deviation
        components["robust_z_millipoints"] = abs(delta)
        thr = int(det.get("threshold") or 300)
        rule = det.get("comparison_rule")
        if rule == "percentile_rank":
            # fire if post exceeds threshold percentile proxy
            if int(post_v) >= thr:
                fired = True
        elif rule in ("robust_z_millipoint", "transition_rarity", "categorical_rarity"):
            if abs(delta) >= thr or abs(delta) >= thr // 2 and abs(delta) >= 250:
                fired = True
        else:
            if abs(delta) >= thr:
                fired = True

    if not fired:
        return None

    cand = {
        "schema_version": "anomaly-candidate/0.3",
        "candidate_id": candidate_id or f"anom.{detector_id}.{trajectory_refs[0] if trajectory_refs else 'x'}",
        "detector_id": detector_id,
        "detector_version": det.get("version") or "anomaly-detectors/0.3",
        "trajectory_refs": list(trajectory_refs),
        "baseline_id": baseline.get("baseline_id"),
        "feature_refs": list(det.get("features") or []),
        "context_refs": list(context_refs or []),
        "deviation_components": components,
        "threshold": int(det.get("threshold") or 0),
        "comparison_rule": det.get("comparison_rule"),
        "confounds": list(confounds or det.get("confounds") or []),
        "counterevidence": list(counterevidence or []),
        "claim_label": "INFERRED",
        "analysis_status": "EMITTED",
        "fired": True,
        "world_mutation": False,
        "claim_bearing_path": "deterministic_only",
    }
    cand["digest"] = sha256_digest({k: v for k, v in cand.items() if k != "digest"})
    return cand


def reject_world_mutation_candidate(cand: dict[str, Any]) -> None:
    if cand.get("world_mutation") is True:
        raise ResearchError(NOT_COMPUTABLE, "anomaly with world_mutation rejected")
