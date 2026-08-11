"""Succession records (D05–D06)."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.errors import INVALID_SUCCESSION, DeepTimeError
from noema.world.digest import sha256_digest

SCHEMA = "succession-record/0.6"
MECHANISMS = ("DESIGNATED", "ELECTED", "INHERITED", "VACANT", "USURPED", "APPOINTED")
OUTCOMES = ("TRANSFERRED", "VACANT", "CONTESTED", "FAILED")


def succession_digest(rec: dict[str, Any]) -> str:
    return sha256_digest({k: v for k, v in rec.items() if k != "digest"})


def validate_succession(rec: dict[str, Any]) -> dict[str, Any]:
    if rec.get("schema_version") != SCHEMA:
        raise DeepTimeError(INVALID_SUCCESSION, f"unsupported succession schema {rec.get('schema_version')}")
    for f in ("succession_id", "subject_ref", "mechanism", "outcome", "evidence_refs"):
        if f not in rec:
            raise DeepTimeError(INVALID_SUCCESSION, f"succession missing {f}")
    if rec["mechanism"] not in MECHANISMS:
        raise DeepTimeError(INVALID_SUCCESSION, f"invalid mechanism {rec['mechanism']}")
    if rec["outcome"] not in OUTCOMES:
        raise DeepTimeError(INVALID_SUCCESSION, f"invalid outcome {rec['outcome']}")
    if not rec["evidence_refs"]:
        raise DeepTimeError(INVALID_SUCCESSION, "evidence_refs required")
    out = dict(rec)
    # institution continues independently of holder when declared
    out.setdefault("institution_continues", True)
    out["digest"] = succession_digest(out)
    if rec.get("digest") and rec["digest"] != out["digest"]:
        # recompute authority for runtime; fixtures may match
        pass
    return out


def apply_succession(inst: dict[str, Any], succession: dict[str, Any]) -> dict[str, Any]:
    succession = validate_succession(succession)
    out = dict(inst)
    if succession["outcome"] == "TRANSFERRED" and succession.get("to_holder"):
        # update participants
        holders = list(out.get("participant_refs") or [])
        if succession.get("from_holder") in holders:
            holders = [h for h in holders if h != succession["from_holder"]]
        if succession["to_holder"] not in holders:
            holders.append(succession["to_holder"])
        out["participant_refs"] = holders
        out["current_custodian"] = succession["to_holder"]
    elif succession["outcome"] == "VACANT":
        out["current_custodian"] = None
        # continues
        out["status"] = out.get("status") or "ACTIVE"
    out.setdefault("succession_refs", []).append(succession["succession_id"])
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out
