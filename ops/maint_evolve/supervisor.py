from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from maint_evolve.pack import PackError, atomic_replace, derive_candidate, load_pack, validate_pack
from maint_evolve.probe import ProbeRefuse, guard_world_id
from maint_evolve.prompt import build_prompt_packet
from maint_evolve.pulse import identity_ok, parse_ready


def _write_proposed_reason(root: Path, exc: BaseException) -> None:
    proposed = root / "packs" / "proposed"
    proposed.mkdir(parents=True, exist_ok=True)
    (proposed / "reason.txt").write_text(str(exc) + "\n", encoding="utf-8")


def apply_candidate(root: Path, candidate) -> bool:
    """Validate then atomically replace current.json. PackError → packs/proposed/, current untouched."""
    root = Path(root)
    current = root / "packs" / "current.json"
    try:
        valid = validate_pack(candidate)
    except PackError as exc:
        proposed = root / "packs" / "proposed"
        proposed.mkdir(parents=True, exist_ok=True)
        payload = candidate if isinstance(candidate, dict) else {"invalid": candidate}
        (proposed / "candidate.json").write_text(
            json.dumps(payload, indent=2, default=str) + "\n",
            encoding="utf-8",
        )
        (proposed / "reason.txt").write_text(str(exc) + "\n", encoding="utf-8")
        return False
    atomic_replace(current, valid)
    return True


def run_shift(
    *,
    root: Path,
    ready: dict,
    look: dict,
    spawn_patrol: bool,
    digest: dict | None = None,
    sar: dict | None = None,
) -> dict:
    """Pulse identity, load pack, derive/apply candidate, return flags. Never spawns patrol."""
    root = Path(root)
    halt = not identity_ok(parse_ready(ready or {}))
    spawn = False if halt else bool(spawn_patrol)

    pack_path = root / "packs" / "current.json"
    look = look if isinstance(look, dict) else {}
    pack = validate_pack({})

    try:
        pack = load_pack(pack_path)
        if not halt:
            candidate = derive_candidate(look, sar, digest, pack)
            if candidate != pack:
                if apply_candidate(root, candidate):
                    pack = load_pack(pack_path)
    except PackError as exc:
        _write_proposed_reason(root, exc)

    return {
        "halt_inhabit": halt,
        "pack": pack,
        "prompt_packet": build_prompt_packet(look, digest, pack),
        "spawn_patrol": spawn,
    }


def parse_supervisor_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="maint_evolve.supervisor")
    p.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    p.add_argument("--probe", action="store_true")
    p.add_argument("--world-id", default=os.environ.get("NOEMA_PROBE_WORLD_ID"))
    p.add_argument(
        "--spawn-patrol",
        action="store_true",
        help="Opt-in. Never implied. Still blocked if PLAY identity drifted.",
    )
    p.add_argument("--server", default=os.environ.get("NOEMA_SERVER") or "https://noema.guru")
    return p.parse_args(argv)


def fetch_ready(server: str, opener=None) -> dict:
    """Public GET /ready. No Admin JWT. No inhabit."""
    import urllib.request

    url = server.rstrip("/") + "/ready"
    req = urllib.request.Request(url, headers={"User-Agent": "noema-maint-evolve/1.0", "Accept": "application/json"})
    open_fn = opener or urllib.request.urlopen
    with open_fn(req, timeout=20) as resp:
        return json.loads(resp.read().decode())


def run_supervisor(
    *,
    argv: list[str] | None = None,
    ready: dict | None = None,
    look: dict | None = None,
    spawn_patrol_cb=None,
    probe_cb=None,
) -> dict:
    ns = parse_supervisor_args(argv)
    root = Path(ns.root)
    root.mkdir(parents=True, exist_ok=True)
    body = ready if ready is not None else fetch_ready(ns.server)
    out = run_shift(
        root=root,
        ready=body,
        look=look if isinstance(look, dict) else {},
        spawn_patrol=bool(ns.spawn_patrol),
    )
    if ns.probe:
        guard_world_id(ns.world_id)
        if probe_cb:
            probe_cb(ns)
    if out["spawn_patrol"] and spawn_patrol_cb:
        spawn_patrol_cb(ns)
    return out


def main(argv: list[str] | None = None) -> int:
    try:
        out = run_supervisor(argv=argv)
    except ProbeRefuse:
        return 2
    print(json.dumps({k: out[k] for k in ("halt_inhabit", "spawn_patrol") if k in out}))
    return 0 if not out.get("halt_inhabit") else 1


if __name__ == "__main__":
    raise SystemExit(main())
