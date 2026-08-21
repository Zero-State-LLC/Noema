from __future__ import annotations

import json
from pathlib import Path

from maint_evolve.pack import PackError, atomic_replace, derive_candidate, load_pack, validate_pack
from maint_evolve.prompt import build_prompt_packet
from maint_evolve.pulse import identity_ok, parse_ready


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


def run_shift(*, root: Path, ready: dict, look: dict, spawn_patrol: bool) -> dict:
    """Pulse identity, load pack, derive/apply candidate, return flags. Never spawns patrol."""
    root = Path(root)
    halt = not identity_ok(parse_ready(ready or {}))
    spawn = False if halt else bool(spawn_patrol)

    pack_path = root / "packs" / "current.json"
    pack = load_pack(pack_path)
    look = look if isinstance(look, dict) else {}

    if not halt:
        candidate = derive_candidate(look, None, None, pack)
        if candidate != pack:
            if apply_candidate(root, candidate):
                pack = load_pack(pack_path)

    return {
        "halt_inhabit": halt,
        "pack": pack,
        "prompt_packet": build_prompt_packet(look, None, pack),
        "spawn_patrol": spawn,
    }
