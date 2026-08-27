from __future__ import annotations

PINNED = {
    "world_id": "world.perihelion-reach-3",
    "genesis_id": "genesis.94d0961984b2b4f8",
}


def parse_ready(body: dict) -> dict:
    world = body.get("world") or {}
    return {
        "world_id": world.get("world_id"),
        "genesis_id": world.get("genesis_id"),
    }


def identity_ok(ready: dict) -> bool:
    return (
        ready.get("world_id") == PINNED["world_id"]
        and ready.get("genesis_id") == PINNED["genesis_id"]
    )
