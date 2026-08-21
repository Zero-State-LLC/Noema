from __future__ import annotations

from maint_evolve.legalize import assert_player_command, veto_action

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


def _observation(resp: object) -> dict:
    if not isinstance(resp, dict):
        return {}
    obs = resp.get("observation")
    return obs if isinstance(obs, dict) else {}


def _scar_count(obs: dict) -> int:
    scars = obs.get("scars") or []
    return len(scars) if isinstance(scars, list) else 0


def run_probe(*, world_id, token_kind, pack, client) -> dict:
    """Isolated inhabit: player token only; never PLAY. Injected client, no live HTTP."""
    assert_player_command(token_kind)
    wid = guard_world_id(world_id)
    admin_token = token_kind == "admin"
    calls: list[str] = []

    def send(verb: str, args=None):
        reason = veto_action(verb, pack, admin_token=admin_token)
        if reason:
            raise ProbeRefuse(reason)
        resp = client.command(verb, args)
        if not isinstance(resp, dict) or resp.get("ok") is not True:
            raise ProbeRefuse("probe command not ok")
        calls.append(verb)
        return resp

    send("ENTER_WORLD")
    last = send("LOOK")

    caution = float((pack or {}).get("harvest_caution") or 0)
    if caution >= 1.0:
        return {
            "pass": False,
            "world_id": wid,
            "scar_count": _scar_count(_observation(last)),
            "calls": list(calls),
            "reason": "harvest_skipped",
        }

    for _ in range(3):
        send("HARVEST")
    last = send("LOOK")
    scar_count = _scar_count(_observation(last))
    return {
        "pass": scar_count > 0,
        "world_id": wid,
        "scar_count": scar_count,
        "calls": list(calls),
    }
