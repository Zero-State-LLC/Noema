"""Capability candidates — research hypotheses only (SPECULATIVE)."""

from __future__ import annotations

from typing import Any

from noema.world.digest import sha256_digest


def build_capability_candidate(
    *,
    candidate_id: str,
    capability_id: str,
    trajectory_refs: list[str],
    anomaly_refs: list[str] | None = None,
    shift_refs: list[str] | None = None,
    observed_conditions: dict[str, Any] | None = None,
    novel_unknown_marker: str | None = None,
    confounds: list[str] | None = None,
) -> dict[str, Any]:
    cand = {
        "schema_version": "capability-candidate/0.3",
        "candidate_id": candidate_id,
        "candidate_capability_id": capability_id,
        "capability_primitive_id": capability_id if not novel_unknown_marker else None,
        "novel_unknown_marker": novel_unknown_marker,
        "supporting_anomaly_refs": list(anomaly_refs or []),
        "behavior_shift_refs": list(shift_refs or []),
        "trajectory_refs": list(trajectory_refs),
        "observed_conditions": dict(observed_conditions or {}),
        "replication_required": True,
        "validated": False,
        "claim_label": "SPECULATIVE",
        "world_truth": False,
        "confounds": list(confounds or []),
        "analysis_status": "EMITTED",
    }
    cand["digest"] = sha256_digest({k: v for k, v in cand.items() if k != "digest"})
    return cand


def build_unknown_candidate(
    *,
    unknown_id: str,
    minimal_description: str,
    evidence_refs: list[str],
    open_questions: list[str] | None = None,
    known_non_explanations: list[str] | None = None,
    kind: str = "UNKNOWN_BEHAVIOR",
) -> dict[str, Any]:
    """Preserve unmapped UNKNOWN_* markers without forcing a primitive."""
    return {
        "schema_version": "unknown-candidate/0.3",
        "unknown_id": unknown_id,
        "kind": kind,
        "minimal_description": minimal_description,
        "evidence_refs": list(evidence_refs),
        "reproduction_status": "unreproduced",
        "similarity_links": [],
        "known_non_explanations": list(known_non_explanations or []),
        "open_questions": list(open_questions or []),
        "claim_label": "SPECULATIVE",
        "maps_to_primitive": False,
    }
