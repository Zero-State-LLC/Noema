"""In-memory Deep Time registry of derived historical records."""

from __future__ import annotations

from typing import Any

from noema.research.deep_time.artifacts import apply_decay, validate_artifact
from noema.research.deep_time.claims import retain_conflict, validate_claim
from noema.research.deep_time.institutions import (
    founder_departs,
    set_lifecycle,
    validate_institution,
    validate_lineage,
)
from noema.research.deep_time.projections import play_history_view, study_longitudinal, watch_timeline
from noema.research.deep_time.reconstruction import filter_hidden_evidence, validate_reconstruction
from noema.research.deep_time.scars_names import rename_surface, validate_name, validate_scar
from noema.research.deep_time.succession import apply_succession, validate_succession


class DeepTimeRegistry:
    """Derived historical records. Does not rewrite event ledger."""

    def __init__(self) -> None:
        self.institutions: dict[str, dict[str, Any]] = {}
        self.successions: dict[str, dict[str, Any]] = {}
        self.artifacts: dict[str, dict[str, Any]] = {}
        self.claims: dict[str, dict[str, Any]] = {}
        self.scars: dict[str, dict[str, Any]] = {}
        self.names: dict[str, dict[str, Any]] = {}
        self.reconstructions: dict[str, dict[str, Any]] = {}
        self.lineages: dict[str, dict[str, Any]] = {}

    def put_institution(self, inst: dict[str, Any]) -> dict[str, Any]:
        v = validate_institution(inst)
        self.institutions[v["institution_id"]] = v
        return v

    def put_succession(self, rec: dict[str, Any]) -> dict[str, Any]:
        v = validate_succession(rec)
        self.successions[v["succession_id"]] = v
        subj = v.get("subject_ref")
        if subj and subj in self.institutions:
            self.institutions[subj] = apply_succession(self.institutions[subj], v)
        return v

    def put_artifact(self, art: dict[str, Any]) -> dict[str, Any]:
        v = validate_artifact(art)
        self.artifacts[v["artifact_id"]] = v
        return v

    def put_claim(self, claim: dict[str, Any]) -> dict[str, Any]:
        v = validate_claim(claim)
        self.claims[v["historical_claim_id"]] = v
        return v

    def put_scar(self, scar: dict[str, Any]) -> dict[str, Any]:
        v = validate_scar(scar)
        self.scars[v["scar_id"]] = v
        return v

    def put_name(self, name: dict[str, Any]) -> dict[str, Any]:
        v = validate_name(name)
        self.names[v["name_record_id"]] = v
        return v

    def put_reconstruction(self, recon: dict[str, Any]) -> dict[str, Any]:
        v = validate_reconstruction(recon)
        # Gate B deepen (Galadriel task / Prabu workload): explicitly preserve fidelity + controllers
        # from multi-controller reconstructions (ties to validate, reconstructionFidelity, reduce observation_digests)
        if "fidelity" in recon:
            v["fidelity"] = recon["fidelity"]
        if "controllers" in recon:
            v["controllers"] = recon["controllers"]
        self.reconstructions[v["reconstruction_id"]] = v
        return v

    def put_lineage(self, lineage: dict[str, Any]) -> dict[str, Any]:
        v = validate_lineage(lineage)
        self.lineages[v["lineage_id"]] = v
        return v

    def snapshot(self) -> dict[str, Any]:
        return {
            "institutions": list(self.institutions.values()),
            "successions": list(self.successions.values()),
            "artifacts": list(self.artifacts.values()),
            "claims": list(self.claims.values()),
            "scars": list(self.scars.values()),
            "names": list(self.names.values()),
            "reconstructions": list(self.reconstructions.values()),
            "lineages": list(self.lineages.values()),
            "ledger_is_canonical": True,
            "lore_is_not_truth": True,
        }


# re-export helpers for tests
__all__ = [
    "DeepTimeRegistry",
    "founder_departs",
    "set_lifecycle",
    "apply_decay",
    "retain_conflict",
    "filter_hidden_evidence",
    "rename_surface",
    "play_history_view",
    "watch_timeline",
    "study_longitudinal",
]
