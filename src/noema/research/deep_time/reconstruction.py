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
