"""Load frozen v0.5 Compiler catalogs."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
FIXTURES = ROOT / "fixtures" / "v05-catalogs"
SPECS = Path("/home/scrimshawlife/Noema-Specs/specs")


def _load(name: str) -> dict[str, Any]:
    for base in (FIXTURES, SPECS):
        p = base / name
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    raise FileNotFoundError(name)


@lru_cache(maxsize=4)
def capture_defaults() -> dict[str, Any]:
    return _load("capture-defaults.v05.json")


@lru_cache(maxsize=4)
def reason_catalog() -> dict[str, Any]:
    return _load("compiler-reason-catalog.v05.json")


LAYER_ORDER = (
    "WORLD_CONFIGURATION",
    "ENTITIES_AGENTS",
    "EVENTS_ACTIONS",
    "OBSERVATIONS_MESSAGES",
    "TOOLS_RESOURCES",
    "METADATA",
)


def reason_message(code: str) -> dict[str, str]:
    for r in reason_catalog().get("reasons") or []:
        if r.get("reason_code") == code:
            return {
                "reason_code": code,
                "simple_message": r.get("simple_message") or code,
                "next_action": r.get("next_action") or "INSPECT",
            }
    return {"reason_code": code, "simple_message": code, "next_action": "INSPECT"}
