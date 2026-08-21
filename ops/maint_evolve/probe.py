from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

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


def parse_probe_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="maint_evolve.probe")
    p.add_argument("--world-id", default=os.environ.get("NOEMA_PROBE_WORLD_ID"))
    p.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    p.add_argument("--token-kind", default="player", choices=("player",))
    return p.parse_args(argv)


def main(
    argv: list[str] | None = None,
    *,
    client=None,
    token_kind: str | None = None,
    pack: dict | None = None,
) -> int:
    ns = parse_probe_args(argv)
    root = Path(ns.root)
    root.mkdir(parents=True, exist_ok=True)
    try:
        wid = guard_world_id(ns.world_id)
    except ProbeRefuse:
        return 2
    kind = token_kind or ns.token_kind
    if client is None:
        return 2
    result = run_probe(world_id=wid, token_kind=kind, pack=pack or {}, client=client)
    (root / "last-probe.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return 0 if result.get("pass") else 1


if __name__ == "__main__":
    raise SystemExit(main())
