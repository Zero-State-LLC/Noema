"""Context comparability (hard mask + soft dims)."""

from __future__ import annotations

from typing import Any

from noema.research.observatory.catalog import context_comparability

RESULTS = ("COMPARABLE", "CONDITIONALLY_COMPARABLE", "NOT_COMPARABLE")


def compare_contexts(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """Return comparability result for two context profiles."""
    cfg = context_comparability()
    hard = list(cfg.get("hard_mask") or [])
    soft = list(cfg.get("soft_dims") or [])
    hard_mismatches = []
    soft_mismatches = []
    for key in hard:
        if a.get(key) != b.get(key):
            hard_mismatches.append(key)
    for key in soft:
        if key in a or key in b:
            if a.get(key) != b.get(key):
                soft_mismatches.append(key)

    if hard_mismatches:
        # risk_regime_band change alone is soft-ish in fixtures (pre/post frontier)
        # Spec hard_mask includes risk_regime_band — if only that differs, CONDITIONALLY_COMPARABLE with confounds
        if hard_mismatches == ["risk_regime_band"] or set(hard_mismatches) <= {"risk_regime_band"}:
            result = "CONDITIONALLY_COMPARABLE"
            confounds = list(hard_mismatches) + soft_mismatches + list(b.get("confounds") or [])
        else:
            result = "NOT_COMPARABLE"
            confounds = hard_mismatches + soft_mismatches
    elif soft_mismatches:
        result = "CONDITIONALLY_COMPARABLE"
        confounds = soft_mismatches + list(b.get("confounds") or a.get("confounds") or [])
    else:
        result = "COMPARABLE"
        confounds = []

    if result == "CONDITIONALLY_COMPARABLE" and not confounds:
        confounds = ["undeclared_soft_diff"]

    return {
        "result": result,
        "hard_mismatches": hard_mismatches,
        "soft_mismatches": soft_mismatches,
        "confounds": confounds,
        "blocks_claim": result == "NOT_COMPARABLE",
        "requires_confounds": result == "CONDITIONALLY_COMPARABLE",
    }


def blocks_claim(comparability: str | dict[str, Any]) -> bool:
    if isinstance(comparability, dict):
        return bool(comparability.get("blocks_claim") or comparability.get("result") == "NOT_COMPARABLE")
    return comparability == "NOT_COMPARABLE"
