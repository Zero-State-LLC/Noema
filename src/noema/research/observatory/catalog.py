"""Load frozen v0.3 Observatory catalogs."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
FIXTURE_CATALOGS = ROOT / "fixtures" / "v03-catalogs"
SPECS = Path("/home/scrimshawlife/Noema-Specs/specs")


def _load(name: str) -> dict[str, Any]:
    for base in (FIXTURE_CATALOGS, SPECS):
        path = base / name
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    raise FileNotFoundError(f"catalog not found: {name}")


@lru_cache(maxsize=8)
def feature_catalog() -> dict[str, Any]:
    return _load("behavior-feature-catalog.v03.json")


@lru_cache(maxsize=8)
def detector_catalog() -> dict[str, Any]:
    return _load("anomaly-detector-catalog.v03.json")


@lru_cache(maxsize=8)
def shift_config() -> dict[str, Any]:
    return _load("behavior-shift-config.v03.json")


@lru_cache(maxsize=8)
def observatory_config() -> dict[str, Any]:
    return _load("observatory-config.v03.json")


@lru_cache(maxsize=8)
def context_comparability() -> dict[str, Any]:
    return _load("context-comparability.v03.json")


def feature_ids() -> list[str]:
    return [f["feature_id"] for f in feature_catalog()["features"]]


def detector_by_id(detector_id: str) -> dict[str, Any] | None:
    for d in detector_catalog()["detectors"]:
        if d["detector_id"] == detector_id:
            return d
    return None
