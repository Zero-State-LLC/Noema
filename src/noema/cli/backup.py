"""CLI: noema-backup — portable world bundle."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from noema.ops.backup import backup_world


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="NOEMA operator backup (OPERATIONS.md)")
    parser.add_argument("--db", default="data/noema.sqlite3")
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: backups/noema-<timestamp>)",
    )
    parser.add_argument("--seed", type=Path, default=None)
    parser.add_argument("--objects", type=Path, default=Path("var/objects"))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    out = args.out
    if out is None:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out = Path("backups") / f"noema-{ts}"

    path = backup_world(args.db, out, seed_path=args.seed, objects_path=args.objects)
    if args.json:
        print(json.dumps({"ok": True, "bundle": str(path)}, indent=2, sort_keys=True))
    else:
        print(f"NOEMA BACKUP: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
