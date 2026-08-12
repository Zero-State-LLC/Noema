"""CLI: noema-restore — restore portable world bundle into clean store."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.ops.backup import restore_world


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="NOEMA operator restore (OPERATIONS.md)")
    parser.add_argument("bundle", type=Path, help="Path to backup bundle directory")
    parser.add_argument("--db", default="data/noema.restored.sqlite3")
    parser.add_argument("--seed", type=Path, default=None)
    parser.add_argument("--objects", type=Path, default=Path("var/objects"))
    parser.add_argument(
        "--force",
        action="store_true",
        help="Wipe non-empty target store before restore",
    )
    parser.add_argument("--no-verify", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    try:
        result = restore_world(
            args.bundle,
            args.db,
            seed_path=args.seed,
            objects_path=args.objects,
            force=args.force,
            run_verify=not args.no_verify,
        )
    except Exception as exc:
        if args.json:
            print(json.dumps({"ok": False, "error": str(exc)}, indent=2, sort_keys=True))
        else:
            print(f"NOEMA RESTORE: FAIL — {exc}")
        return 1

    if args.json:
        print(json.dumps({"ok": True, **result}, indent=2, sort_keys=True))
    else:
        print(
            f"NOEMA RESTORE: OK world_id={result.get('world_id')} "
            f"events={result.get('event_count')} verify={result.get('verify')}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
