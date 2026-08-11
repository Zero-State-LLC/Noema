"""Deterministic information-gain / ranking components (fixed-point millipoints)."""

from __future__ import annotations

import hashlib
import hmac
from typing import Any

from noema.research.frontier.catalog import director_config
from noema.research.frontier.genomes import NOVELTY_AXES


def tie_break(seed: str, candidate_id: str) -> int:
    """uint256-style HMAC; returned as int for ranking (full 256-bit via hex)."""
    mac = hmac.new(seed.encode("utf-8"), candidate_id.encode("utf-8"), hashlib.sha256).hexdigest()
    return int(mac, 16)


def score_components(
    *,
    genome: dict[str, Any],
    request: dict[str, Any],
    is_repetition: bool = False,
    control_value: int = 0,
) -> dict[str, Any]:
    """Bounded, inspectable estimates. claim_label is always INFERRED."""
    nv = genome.get("novelty_vector") or {}
    novelty = 0
    for axis in NOVELTY_AXES:
        novelty += int(nv.get(axis) or 0)
    novelty = min(1000, novelty // len(NOVELTY_AXES))

    targets = request.get("targets") or []
    uncertainty = 0
    for t in targets:
        uncertainty += int(t.get("priority_weight") or 0)
    uncertainty = min(1000, uncertainty // max(1, len(targets) or 1))

    cap = request.get("capability_snapshot") or {}
    if cap.get("evidence_complete") is False:
        # incomplete evidence → higher uncertainty estimate, never coerced to zero
        uncertainty = max(uncertainty, 500)

    discrimination = min(1000, 200 * len(targets) + (100 if genome.get("contradictory_evidence") else 0))
    coverage_gain = min(1000, 100 * len(targets) + novelty // 2)
    failure_relevance = 0
    tw = request.get("trajectory_window") or {}
    if tw.get("recent_failure_digests"):
        failure_relevance = min(1000, 100 * len(tw["recent_failure_digests"]))

    cost = min(1000, 100 * len(genome.get("mutation_lineage") or []) + int(genome.get("risk_class") or 0) * 50)
    risk = min(1000, int(genome.get("risk_class") or 0) * 100)
    repetition = 1 if is_repetition else 0

    return {
        "uncertainty": int(uncertainty),
        "discrimination": int(discrimination),
        "novelty": int(novelty),
        "failure_relevance": int(failure_relevance),
        "coverage_gain": int(coverage_gain),
        "control_value": int(control_value),
        "cost": int(cost),
        "risk": int(risk),
        "repetition": int(repetition),
        "risk_class": int(genome.get("risk_class") or 0),
        "claim_label": "INFERRED",
    }


def ranking_key(components: dict[str, Any], candidate_id: str, seed: str) -> tuple:
    """Lexicographic key per frontier-director-config ranking_key (ascending)."""
    cfg = director_config()
    order = cfg.get("ranking_key") or []
    tb = tie_break(seed, candidate_id)
    values = {
        "risk_class": int(components.get("risk_class") or 0),
        "control_value": int(components.get("control_value") or 0),
        "uncertainty": int(components.get("uncertainty") or 0),
        "discrimination": int(components.get("discrimination") or 0),
        "coverage_gain": int(components.get("coverage_gain") or 0),
        "novelty": int(components.get("novelty") or 0),
        "failure_relevance": int(components.get("failure_relevance") or 0),
        "repetition": int(components.get("repetition") or 0),
        "cost": int(components.get("cost") or 0),
        "tie_break": tb,
        "candidate_id": candidate_id,
    }
    key: list[Any] = []
    for item in order:
        if item.startswith("-"):
            name = item[1:]
            key.append(-values[name])
        else:
            key.append(values[item])
    return tuple(key)
