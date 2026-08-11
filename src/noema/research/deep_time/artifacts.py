"""Historical artifacts, integrity, decay (D10–D13)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from noema.research.deep_time.errors import INVALID_ARTIFACT, DeepTimeError
from noema.world.digest import sha256_digest

SCHEMA = "historical-artifact/0.6"
INTEGRITY = ("INTACT", "DEGRADED", "FRAGMENTARY", "CORRUPTED", "DESTROYED")

ROOT = Path(__file__).resolve().parents[4]


@lru_cache(maxsize=2)
def decay_catalog() -> dict[str, Any]:
    for p in (
        ROOT / "fixtures" / "v06-catalogs" / "historical-decay.v06.json",
        Path("/home/scrimshawlife/Noema-Specs/specs/historical-decay.v06.json"),
    ):
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    return {"profiles": [], "notes": "Only in-world evidence decays. Canonical event ledger never decays."}


def artifact_digest(art: dict[str, Any]) -> str:
    return sha256_digest({k: v for k, v in art.items() if k != "digest"})


def validate_artifact(art: dict[str, Any]) -> dict[str, Any]:
    if art.get("schema_version") != SCHEMA:
        raise DeepTimeError(INVALID_ARTIFACT, f"unsupported artifact schema {art.get('schema_version')}")
    for f in ("artifact_id", "artifact_class", "title", "integrity"):
        if f not in art:
            raise DeepTimeError(INVALID_ARTIFACT, f"artifact missing {f}")
    if art["integrity"] not in INTEGRITY:
        raise DeepTimeError(INVALID_ARTIFACT, f"invalid integrity {art['integrity']}")
    if art.get("claims_are_not_world_truth") is not True:
        raise DeepTimeError(INVALID_ARTIFACT, "claims_are_not_world_truth must be true")
    out = dict(art)
    # DESTROYED preserves existence fact
    if out["integrity"] == "DESTROYED":
        out["existed_fact_preserved"] = True
    else:
        out.setdefault("existed_fact_preserved", True)
    out["digest"] = artifact_digest(out)
    return out


def apply_decay(art: dict[str, Any], *, cycles_elapsed: int) -> dict[str, Any]:
    """Evidence-only decay; never mutates canonical ledger."""
    art = validate_artifact(art)
    if art["integrity"] == "DESTROYED":
        return art
    # deterministic thresholds from catalog or defaults
    thresholds = {"DEGRADED": 1000, "FRAGMENTARY": 2500, "CORRUPTED": 5000}
    for profile in decay_catalog().get("profiles") or []:
        if profile.get("applies_to") == "ARTIFACT":
            thresholds.update(profile.get("cycle_thresholds") or {})
            break
    integrity = "INTACT"
    for level in ("DEGRADED", "FRAGMENTARY", "CORRUPTED"):
        if cycles_elapsed >= int(thresholds.get(level, 10**9)):
            integrity = level
    out = dict(art)
    out["integrity"] = integrity
    out["decay_cycles_elapsed"] = cycles_elapsed
    out["ledger_mutated"] = False
    out["digest"] = artifact_digest(out)
    return out
