"""AGENT-ORIENTATION-S0 — first OBSERVE withhold. RFC-0106."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

# workers/noema/src/orientation.ts — liveStrainLine uses this cutoff.
SITUATION_STRAIN_BELOW = 70

_FORBIDDEN: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\byou should\b"), "YOU_SHOULD"),
    (re.compile(r"\b(win condition|the point of the game|world thesis)\b"), "THESIS"),
    (re.compile(r"\b(choose your class|class picker|you are an? (explorer|surveyor|broker|engineer) class)\b"), "CLASS"),
    (re.compile(r"\b(research objective|being tested|capability evaluation)\b"), "RESEARCH"),
    (re.compile(r"\b(welcome, traveler|arrival speech|you have been summoned)\b"), "ARRIVAL"),
    (re.compile(r"\bthe world remembers\b"), "MEMORY_LECTURE"),
    (re.compile(r"\bavailable commands:\s*(look|move|inspect).{0,80}(contest|agreement|access)\b"), "VERB_DUMP"),
]


@dataclass
class OrientationCheck:
    ok: bool
    reason: str | None = None


def _blob(observation: dict[str, Any] | None) -> str:
    obs = observation or {}
    loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
    sit = obs.get("situation") if isinstance(obs.get("situation"), dict) else {}
    parts = [
        str(loc.get("name") or ""),
        str(loc.get("description") or ""),
        str(sit.get("place") or ""),
        str(sit.get("strain") or ""),
        str(obs.get("consequence") or ""),
        " ".join(str(x) for x in (obs.get("orientation_lines") or [])),
    ]
    return " ".join(parts).lower()


def room_has_strain(observation: dict[str, Any] | None) -> bool:
    """Entity-backed live work. Report lines in situation.strain are not this."""
    obs = observation or {}
    loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
    ents = list(loc.get("entities") or obs.get("entities") or [])
    for ent in ents:
        if not isinstance(ent, dict):
            continue
        if ent.get("repairable") or ent.get("harvestable"):
            return True
        cond = ent.get("condition")
        if isinstance(cond, (int, float)) and cond < SITUATION_STRAIN_BELOW:
            return True
    return False


def check_orientation_s0(observation: dict[str, Any] | None) -> OrientationCheck:
    """Withhold thesis/quest/class/verb-dump. Server-authored strain stays legal."""
    loc = (observation or {}).get("location") if isinstance((observation or {}).get("location"), dict) else {}
    name = str(loc.get("name") or "").strip()
    if not name:
        return OrientationCheck(False, "MISSING_PLACE")
    blob = _blob(observation)
    for rx, why in _FORBIDDEN:
        if rx.search(blob):
            return OrientationCheck(False, why)
    return OrientationCheck(True, None)
