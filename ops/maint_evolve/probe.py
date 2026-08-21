from __future__ import annotations

PLAY = "world.perihelion-reach-3"
FROZEN = "world-01"
PRIOR = "world.perihelion-reach-2"
FORBIDDEN_WORLDS = frozenset({PLAY, FROZEN, PRIOR})


class ProbeRefuse(RuntimeError):
    pass


def guard_world_id(world_id: str | None) -> str:
    wid = (world_id or "").strip()
    if not wid or wid in FORBIDDEN_WORLDS or not wid.startswith("test."):
        raise ProbeRefuse(f"probe refuses world_id={wid!r}")
    return wid
