"""Experiment design validation and identity digests."""

from __future__ import annotations

from typing import Any

from noema.research.lab.catalog import SEED_POLICIES
from noema.research.lab.errors import INVALID_EXPERIMENT, LabError
from noema.world.digest import sha256_digest

SCHEMA = "experiment/0.4"


def validate_experiment(exp: dict[str, Any]) -> dict[str, Any]:
    if exp.get("schema_version") != SCHEMA and exp.get("experiment_design_version") != "experiment-design/0.4":
        if exp.get("schema_version") != SCHEMA:
            raise LabError(INVALID_EXPERIMENT, f"unsupported experiment schema {exp.get('schema_version')}")
    required = (
        "experiment_id",
        "question",
        "hypothesis",
        "identity",
    )
    for f in required:
        if f not in exp:
            raise LabError(INVALID_EXPERIMENT, f"experiment missing {f}")
    ident = exp["identity"]
    for f in ("world_version", "source_candidate_ids", "seed_policy"):
        if f not in ident and f != "seed_policy":
            # seed may be top-level in some fixtures
            pass
    seed = ident.get("seed_policy") or exp.get("seed_policy")
    if seed and seed not in SEED_POLICIES:
        raise LabError(INVALID_EXPERIMENT, f"invalid seed_policy {seed}")
    if exp.get("live_world_experiment") is True:
        raise LabError(INVALID_EXPERIMENT, "live_world_experiment forbidden")
    return dict(exp)


def experiment_identity_digest(exp: dict[str, Any]) -> str:
    ident = dict(exp.get("identity") or {})
    ident.pop("input_digest", None)
    return sha256_digest(ident)


def experiment_input_digest(exp: dict[str, Any]) -> str:
    body = {k: v for k, v in exp.items() if k not in ("input_digest", "digest")}
    return sha256_digest(body)
