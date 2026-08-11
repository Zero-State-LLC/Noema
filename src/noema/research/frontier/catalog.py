"""Load frozen v0.2 Frontier catalogs (bundled fixtures or Specs path)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
FIXTURE_CATALOGS = ROOT / "fixtures" / "v02-catalogs"
SPECS_SPECS = Path("/home/scrimshawlife/Noema-Specs/specs")


def _load(name: str) -> dict[str, Any]:
    for base in (FIXTURE_CATALOGS, SPECS_SPECS):
        path = base / name
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    raise FileNotFoundError(f"catalog not found: {name}")


@lru_cache(maxsize=8)
def director_config() -> dict[str, Any]:
    return _load("frontier-director-config.v02.json")


@lru_cache(maxsize=8)
def mutation_catalog() -> dict[str, Any]:
    return _load("mutation-catalog.v02.json")


@lru_cache(maxsize=8)
def novelty_axes() -> dict[str, Any]:
    return _load("novelty-axes.v02.json")


@lru_cache(maxsize=8)
def noise_model() -> dict[str, Any]:
    return _load("noise-model.v02.json")


@lru_cache(maxsize=8)
def attention_projection() -> dict[str, Any]:
    return _load("attention-projection.v02.json")


def operator_ids() -> list[str]:
    return [op["operator_id"] for op in mutation_catalog()["operators"]]


def operator_by_id(operator_id: str) -> dict[str, Any] | None:
    for op in mutation_catalog()["operators"]:
        if op["operator_id"] == operator_id:
            return op
    return None
