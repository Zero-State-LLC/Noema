"""Pure LOOK observation → EWM health snapshot. No HTTP."""

from __future__ import annotations

from typing import Any


CANNED_MATERIALS = 12.0
CANNED_CYCLE = 15
CANNED_ORG_THRESHOLD = 3.8


def look_observation_to_snapshot(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    """Map a /v1/operator/test-world LOOK body to economic_health snapshot.

    Returns None if salvage-cache is missing (fail closed).
    """
    if not isinstance(payload, dict):
        return None
    obs = payload.get("observation") if isinstance(payload.get("observation"), dict) else payload
    if not isinstance(obs, dict):
        return None
    loc = obs.get("location") if isinstance(obs.get("location"), dict) else {}
    ents = loc.get("entities") or obs.get("entities") or []
    if not isinstance(ents, list):
        ents = []
    salvage = [
        e
        for e in ents
        if isinstance(e, dict) and e.get("entity_id") == "entity.salvage-cache"
    ]
    if not salvage:
        return None

    materials = 0.0
    max_materials = 0.0
    for e in ents:
        if not isinstance(e, dict):
            continue
        if e.get("stock_resource") != "materials":
            continue
        materials += float(e.get("stock_amount") or 0)
        max_materials += float(e.get("max_stock") or 0)
    if max_materials <= 0:
        max_materials = max(materials, 1.0)

    co = loc.get("co_evolution") if isinstance(loc.get("co_evolution"), dict) else {}
    if not co and isinstance(obs.get("co_evolution"), dict):
        co = obs["co_evolution"]
    hp = co.get("harvest_pressure")
    if isinstance(hp, dict):
        hp = sum(float(v or 0) for v in hp.values())
    try:
        harvest_pressure = float(hp or 0)
    except (TypeError, ValueError):
        harvest_pressure = 0.0

    budgets = obs.get("budgets") if isinstance(obs.get("budgets"), dict) else {}
    agents: list[dict[str, float]] = [
        {
            "influence": float(budgets.get("influence") or 0),
            "attention": float(budgets.get("attention") or 0),
            "conversion_rate": 0.5,
        }
    ]
    for p in obs.get("players_here") or []:
        if not isinstance(p, dict):
            continue
        pb = p.get("budgets") if isinstance(p.get("budgets"), dict) else {}
        agents.append(
            {
                "influence": float(pb.get("influence") or 0),
                "attention": float(pb.get("attention") or p.get("attention") or 8),
                "conversion_rate": 0.5,
            }
        )

    unlocked = obs.get("unlocked_affordances") or obs.get("unlocked") or []
    if not isinstance(unlocked, list) or not unlocked:
        unlocked = [
            str(a.get("operation") or a.get("action"))
            for a in (obs.get("affordances") or [])
            if isinstance(a, dict) and a.get("available")
        ]
        unlocked = [u for u in unlocked if u]

    org_th = obs.get("org_threshold")
    if org_th is None:
        beliefs = obs.get("beliefs") if isinstance(obs.get("beliefs"), dict) else {}
        org_th = beliefs.get("org_threshold", 5.0)

    return {
        "materials": materials,
        "cycle": int(obs.get("cycle") or 0),
        "org_threshold": float(org_th),
        "unlocked": unlocked,
        "max_materials": max_materials,
        "co_evolution": {"harvest_pressure": harvest_pressure, "regen_mod": co.get("regen_mod")},
        "agents": agents,
        "source": "look",
        "salvage_stock": float(salvage[0].get("stock_amount") or 0),
    }


def is_canned_snapshot(snap: dict[str, Any] | None) -> bool:
    if not snap:
        return False
    return (
        float(snap.get("materials") or 0) == CANNED_MATERIALS
        and int(snap.get("cycle") or 0) == CANNED_CYCLE
        and float(snap.get("org_threshold") or 0) == CANNED_ORG_THRESHOLD
    )
