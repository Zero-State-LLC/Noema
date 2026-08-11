"""Institutions, lifecycle, lineage (D01–D09)."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.errors import INVALID_INSTITUTION, DeepTimeError
from noema.world.digest import sha256_digest

SCHEMA = "institution/0.6"
STATUSES = ("EMERGING", "ACTIVE", "DORMANT", "DISSOLVED", "REVIVED")
IDENTITY_CLASSES = ("SAME_ENTITY_EVOLVED", "SUCCESSOR_ENTITY", "NEW_ENTITY")


def institution_body(inst: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in inst.items() if k != "digest"}


def institution_digest(inst: dict[str, Any]) -> str:
    return sha256_digest(institution_body(inst))


def validate_institution(inst: dict[str, Any]) -> dict[str, Any]:
    if inst.get("schema_version") != SCHEMA:
        raise DeepTimeError(INVALID_INSTITUTION, f"unsupported institution schema {inst.get('schema_version')}")
    for f in ("institution_id", "display_name", "origin", "purpose"):
        if not inst.get(f):
            raise DeepTimeError(INVALID_INSTITUTION, f"institution missing {f}")
    if not inst.get("origin", {}).get("source_refs"):
        raise DeepTimeError(INVALID_INSTITUTION, "origin requires source_refs")
    status = inst.get("status") or "ACTIVE"
    if status not in STATUSES:
        raise DeepTimeError(INVALID_INSTITUTION, f"invalid status {status}")
    out = dict(inst)
    out["status"] = status
    out["digest"] = institution_digest(out)
    return out


def founder_departs(inst: dict[str, Any], founder_ref: str, *, cycle: int) -> dict[str, Any]:
    """Founder departure does not auto-delete institutions that survive participants."""
    out = dict(inst)
    participants = [p for p in (out.get("participant_refs") or []) if p != founder_ref]
    out["participant_refs"] = participants
    out.setdefault("history", []).append({"event": "FOUNDER_DEPARTURE", "ref": founder_ref, "cycle": cycle})
    # survives if practices/inheritors remain or explicit continues flag
    if out.get("inheritor_refs") or out.get("persistent_practices") or participants:
        out["status"] = out.get("status") if out.get("status") != "DISSOLVED" else "DORMANT"
        out["survives_founder_departure"] = True
    else:
        out["status"] = "DORMANT"
        out["survives_founder_departure"] = True  # dormant, not deleted
    out["digest"] = institution_digest(out)
    return out


def set_lifecycle(inst: dict[str, Any], status: str, *, cycle: int) -> dict[str, Any]:
    if status not in STATUSES:
        raise DeepTimeError(INVALID_INSTITUTION, f"invalid lifecycle status {status}")
    out = dict(inst)
    out["status"] = status
    out.setdefault("history", []).append({"event": "LIFECYCLE", "status": status, "cycle": cycle})
    # dormant/dissolved remain addressable
    out["addressable"] = True
    out["digest"] = institution_digest(out)
    return out


def validate_lineage(lineage: dict[str, Any]) -> dict[str, Any]:
    if lineage.get("schema_version") != "institution-lineage/0.6":
        raise DeepTimeError(INVALID_INSTITUTION, "unsupported lineage schema")
    for node in lineage.get("nodes") or []:
        ic = node.get("identity_class")
        if ic and ic not in IDENTITY_CLASSES:
            raise DeepTimeError(INVALID_INSTITUTION, f"invalid identity_class {ic}")
    return lineage
