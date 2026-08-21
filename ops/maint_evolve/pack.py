from __future__ import annotations
import json, os, tempfile
from pathlib import Path

SCHEMA_VERSION = 1
DEFAULT_PACK = {
    "schema_version": SCHEMA_VERSION,
    "energy_floor": 12,
    "harvest_caution": 0.0,
    "inspect_skip": [],
    "room_priority": [],
    "legalize_blocks": [],
    "wait_before_look": True,
    "prompt_goals": [],
}


class PackError(ValueError):
    pass


def validate_pack(data: object) -> dict:
    if not isinstance(data, dict):
        raise PackError("pack must be an object")
    try:
        ver = int(data.get("schema_version") or SCHEMA_VERSION)
        if ver != SCHEMA_VERSION:
            raise PackError(f"unsupported schema_version {ver}")
        out = dict(DEFAULT_PACK)
        out.update({k: data[k] for k in DEFAULT_PACK if k in data})
        out["schema_version"] = SCHEMA_VERSION
        out["energy_floor"] = int(out["energy_floor"])
        out["harvest_caution"] = float(out["harvest_caution"])
        out["inspect_skip"] = list(out["inspect_skip"] or [])
        out["room_priority"] = list(out["room_priority"] or [])
        out["legalize_blocks"] = [str(x).upper() for x in (out["legalize_blocks"] or [])]
        out["wait_before_look"] = bool(out["wait_before_look"])
        out["prompt_goals"] = [str(x) for x in (out["prompt_goals"] or [])]
        return out
    except PackError:
        raise
    except (TypeError, ValueError) as exc:
        raise PackError(str(exc)) from exc


def load_pack(path: Path | None) -> dict:
    if path is None or not path.is_file():
        return validate_pack({})
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
        raise PackError(f"invalid pack json: {exc}") from exc
    return validate_pack(raw)


def atomic_replace(path: Path, data: dict) -> None:
    valid = validate_pack(data)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(valid, fh, indent=2)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def derive_candidate(look: dict, sar: dict | None, digest: dict | None, current: dict) -> dict:
    cand = validate_pack(current)
    look = look if isinstance(look, dict) else {}
    try:
        scars = look.get("scars") or []
        strengths = [
            float(s.get("strength") or 0)
            for s in scars
            if isinstance(s, dict) and s.get("visibility") == "public"
        ]
        pressure = float(
            ((look.get("location") or {}).get("co_evolution") or {}).get("harvest_pressure") or 0
        )
        caution = max(strengths + [0.0])
        if pressure > 4:
            caution = max(caution, 0.4)
        cand["harvest_caution"] = max(float(cand["harvest_caution"]), caution)
        return cand
    except PackError:
        raise
    except (TypeError, ValueError) as exc:
        raise PackError(str(exc)) from exc
