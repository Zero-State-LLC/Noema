"""World scars + historical names (D22–D24)."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.errors import INVALID_ARTIFACT, DeepTimeError
from noema.world.digest import sha256_digest


def validate_scar(scar: dict[str, Any]) -> dict[str, Any]:
    if scar.get("schema_version") != "world-scar/0.6":
        raise DeepTimeError(INVALID_ARTIFACT, "unsupported scar schema")
    if not scar.get("derived_from_event_refs"):
        raise DeepTimeError(INVALID_ARTIFACT, "scar must derive from event evidence")
    out = dict(scar)
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out


def validate_name(name: dict[str, Any]) -> dict[str, Any]:
    if name.get("schema_version") != "historical-name/0.6":
        raise DeepTimeError(INVALID_ARTIFACT, "unsupported name schema")
    if name.get("canonical_id_immutable") is not True:
        raise DeepTimeError(INVALID_ARTIFACT, "canonical_id must be immutable")
    out = dict(name)
    out["canonical_id_immutable"] = True
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out


def rename_surface(name: dict[str, Any], new_surface: str, *, cycle: int) -> dict[str, Any]:
    """Rename surface label only; canonical_id never changes."""
    name = validate_name(name)
    out = dict(name)
    out.setdefault("name_history", []).append(
        {"surface_name": out.get("surface_name"), "to_cycle": cycle - 1}
    )
    out["surface_name"] = new_surface
    out["from_cycle"] = cycle
    out["canonical_id_immutable"] = True
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out
