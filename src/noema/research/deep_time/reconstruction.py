"""Archaeology / reconstruction without narrative invention (D16–D18)."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.errors import HIDDEN_HISTORY, NARRATIVE_INVENTION, DeepTimeError
from noema.world.digest import sha256_digest


def validate_reconstruction(recon: dict[str, Any]) -> dict[str, Any]:
    if recon.get("schema_version") != "historical-reconstruction/0.6":
        raise DeepTimeError(NARRATIVE_INVENTION, "unsupported reconstruction schema")
    if not recon.get("evidence_set"):
        raise DeepTimeError(NARRATIVE_INVENTION, "reconstruction requires evidence_set")
    # Fidelity is a bounded derived claim. Keep the supplied numeric value
    # unchanged so registry storage and its digest remain lossless.
    if "fidelity" in recon:
        fidelity = recon["fidelity"]
        if (
            isinstance(fidelity, bool)
            or not isinstance(fidelity, (int, float))
            or not 0 <= fidelity <= 1
        ):
            raise DeepTimeError(NARRATIVE_INVENTION, "reconstruction fidelity must be between 0 and 1")
    # Gate B evidence may report how many independent Controllers contributed.
    # This is metadata about the evidence, not a new gameplay authority.  A
    # count of zero is not provenance, and bool is an int subclass in Python,
    # so both need explicit fail-closed handling.
    if "controllers" in recon:
        controllers = recon["controllers"]
        if (
            isinstance(controllers, bool)
            or not isinstance(controllers, int)
            or controllers <= 0
        ):
            raise DeepTimeError(NARRATIVE_INVENTION, "reconstruction controllers must be a positive integer")
    # no narrative invention: every inference must cite sources
    for inf in recon.get("inferences") or []:
        if not inf.get("source_refs") and not inf.get("claim_label"):
            raise DeepTimeError(NARRATIVE_INVENTION, "inference missing sources")
        if inf.get("claim_label") == "OBSERVED" and not inf.get("source_refs"):
            raise DeepTimeError(NARRATIVE_INVENTION, "OBSERVED inference requires sources")
    out = dict(recon)
    out["narrative_invention"] = False
    out["digest"] = sha256_digest({k: v for k, v in out.items() if k != "digest"})
    return out


def filter_hidden_evidence(evidence: dict[str, Any], *, player_visible: bool) -> dict[str, Any]:
    """Archaeology does not expose hidden ledger history to players."""
    hidden = (
        evidence.get("visibility") == "HIDDEN"
        or evidence.get("hidden") is True
        or evidence.get("hidden_from_ordinary_observation") is True
        or evidence.get("accessible_to_agents") is False
    )
    if hidden:
        if player_visible:
            raise DeepTimeError(HIDDEN_HISTORY, "hidden history not exposed to PLAY")
        return {**evidence, "player_visible": False, "redacted": True}
    return {**evidence, "player_visible": True, "redacted": False}
