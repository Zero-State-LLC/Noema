from __future__ import annotations


def build_prompt_packet(look: dict, digest: dict | None, pack: dict) -> dict:
    """Copy LOOK/digest/pack fields into a secret-free prompt packet."""
    scars = look.get("scars") or []
    if not isinstance(scars, list):
        scars = []
    goals = pack.get("prompt_goals") or []
    if not isinstance(goals, list):
        goals = []
    alerts: list = []
    if digest:
        raw = digest.get("alerts") or []
        if isinstance(raw, list):
            alerts = list(raw)
    return {
        "goals": [str(g) for g in goals],
        "scars": [dict(s) for s in scars if isinstance(s, dict)],
        "protocol_strength": look.get("protocol_strength"),
        "path_dependence_index": look.get("path_dependence_index"),
        "alerts": alerts,
    }
