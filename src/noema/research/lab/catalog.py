"""Load frozen v0.4 Lab catalogs."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "fixtures" / "v04-catalogs"
SPECS = Path("/home/scrimshawlife/Noema-Specs/specs")


def _load(name: str) -> dict[str, Any]:
    for base in (FIXTURES, SPECS):
        p = base / name
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    raise FileNotFoundError(name)


@lru_cache(maxsize=8)
def perturbation_catalog() -> dict[str, Any]:
    return _load("perturbation-catalog.v04.json")


@lru_cache(maxsize=8)
def ablation_catalog() -> dict[str, Any]:
    return _load("ablation-catalog.v04.json")


@lru_cache(maxsize=8)
def intent_catalog() -> dict[str, Any]:
    return _load("experiment-intent-catalog.json")


@lru_cache(maxsize=8)
def variable_registry() -> dict[str, Any]:
    return _load("experiment-variable-registry.v04.json")


FORK_POINTS = (
    "CYCLE_BOUNDARY",
    "BEFORE_OBSERVATION",
    "AFTER_OBSERVATION",
    "BEFORE_ACTION",
    "AFTER_ACTION",
    "BEFORE_SITUATION_INJECTION",
    "AFTER_SITUATION_INJECTION",
    "FORK_BOUNDARY",
)

SEED_POLICIES = ("SAME_SEED", "RESEED", "CROSS_SEED", "DIVERGENCE_RECORDED")

RUN_ROLES = (
    "BASELINE",
    "SHAM_CONTROL",
    "POSITIVE_CONTROL",
    "NEGATIVE_CONTROL",
    "INTERVENTION",
    "REPLICATION",
    "GENERALIZATION",
    "VERSION_DIFFERENTIAL",
)
