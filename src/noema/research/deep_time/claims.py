"""Historical claims + contested claims (D14–D15)."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.errors import INVALID_CLAIM, DeepTimeError
from noema.world.digest import sha256_digest

SCHEMA = "historical-claim/0.6"
EVIDENCE_STATUS = ("SUPPORTED", "CONTESTED", "INSUFFICIENT", "REFUTED")


def claim_digest(claim: dict[str, Any]) -> str:
    return sha256_digest({k: v for k, v in claim.items() if k != "digest"})


def validate_claim(claim: dict[str, Any]) -> dict[str, Any]:
    if claim.get("schema_version") != SCHEMA:
        raise DeepTimeError(INVALID_CLAIM, f"unsupported claim schema {claim.get('schema_version')}")
    for f in ("historical_claim_id", "claim", "evidence_status", "claim_label", "source_refs"):
        if f not in claim:
            raise DeepTimeError(INVALID_CLAIM, f"claim missing {f}")
    if claim["evidence_status"] not in EVIDENCE_STATUS:
        raise DeepTimeError(INVALID_CLAIM, f"invalid evidence_status {claim['evidence_status']}")
    if claim["evidence_status"] == "CONTESTED" and not claim.get("contradicting_claim_refs"):
        raise DeepTimeError(INVALID_CLAIM, "CONTESTED claims require contradicting_claim_refs")
    out = dict(claim)
    out["forced_resolution"] = False
    out["digest"] = claim_digest(out)
    return out


def retain_conflict(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """Keep both claims CONTESTED without forced resolution."""
    a = validate_claim(a)
    b = validate_claim(b)
    return {
        "status": "CONTESTED",
        "claims": [a["historical_claim_id"], b["historical_claim_id"]],
        "forced_resolution": False,
        "both_retained": True,
    }
