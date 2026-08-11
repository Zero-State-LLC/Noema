"""Frozen baseline construction (research partition only)."""

from __future__ import annotations

from typing import Any

from noema.research.errors import INSUFFICIENT_RESEARCH_INPUT, ResearchError
from noema.world.digest import sha256_digest

BASELINE_TYPES = (
    "self_history",
    "agent_version",
    "peer",
    "scenario",
    "control",
    "world_regime",
)


def baseline_body(baseline: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in baseline.items() if k != "digest"}


def baseline_digest(baseline: dict[str, Any]) -> str:
    return sha256_digest(baseline_body(baseline))


def validate_baseline(baseline: dict[str, Any], *, require_digest: bool = True) -> dict[str, Any]:
    if baseline.get("schema_version") != "baseline/0.3":
        raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "unsupported baseline schema")
    for field in (
        "baseline_id",
        "baseline_type",
        "population_window",
        "inclusion_rules",
        "exclusion_rules",
        "context_constraints",
        "minimum_evidence",
        "feature_version",
        "construction_algorithm",
        "feature_summary",
    ):
        if field not in baseline:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, f"baseline missing {field}")
    if baseline["baseline_type"] not in BASELINE_TYPES:
        raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, f"unknown baseline_type {baseline['baseline_type']}")
    dig = baseline_digest(baseline)
    if require_digest:
        recorded = baseline.get("digest")
        if not recorded:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "baseline digest required")
        if recorded != dig:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "baseline digest mismatch")
    out = dict(baseline)
    out["digest"] = dig
    return out


def build_self_history_baseline(
    *,
    baseline_id: str,
    agent_id: str,
    start_cycle: int,
    end_cycle: int,
    feature_summary: dict[str, int],
    evidence_count: int,
    minimum_evidence: int = 5,
    world_version: str = "world/v1",
    risk_regime_band: str = "stable",
) -> dict[str, Any]:
    if evidence_count < minimum_evidence:
        raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "minimum_evidence not met")
    baseline = {
        "schema_version": "baseline/0.3",
        "baseline_id": baseline_id,
        "baseline_type": "self_history",
        "population_window": {
            "start_cycle": start_cycle,
            "end_cycle": end_cycle,
            "agent_id": agent_id,
        },
        "inclusion_rules": ["same agent_id", "COMPARABLE context"],
        "exclusion_rules": ["redacted trajectories"],
        "context_constraints": {
            "world_version": world_version,
            "feature_version": "behavior-features/0.3",
            "risk_regime_band": risk_regime_band,
        },
        "minimum_evidence": minimum_evidence,
        "evidence_count": evidence_count,
        "feature_version": "behavior-features/0.3",
        "construction_algorithm": "mean_millipoint_self_history/0.3",
        "feature_summary": feature_summary,
        "claim_label": "INFERRED",
        "frozen": True,
    }
    baseline["digest"] = baseline_digest(baseline)
    return baseline


def forbid_silent_rebuild(existing: dict[str, Any], rebuilt: dict[str, Any]) -> None:
    """Claim-bearing runs must not silently rebuild baselines under same id with new content."""
    if existing.get("baseline_id") == rebuilt.get("baseline_id"):
        if baseline_digest(existing) != baseline_digest(rebuilt):
            raise ResearchError(
                INSUFFICIENT_RESEARCH_INPUT,
                "silent baseline rebuild forbidden; allocate new baseline_id",
            )
