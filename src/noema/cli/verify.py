"""CLI: noema-verify — operator verification checklist."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from noema.ops.verify import verify_world


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="NOEMA operator verify (OPERATIONS.md)")
    parser.add_argument(
        "--db",
        default="data/noema.sqlite3",
        help="SQLite path or PostgreSQL DSN",
    )
    parser.add_argument("--seed", type=Path, default=None, help="World seed for rehydrate checks")
    parser.add_argument("--objects", type=Path, default=Path("var/objects"))
    parser.add_argument("--config", type=Path, default=None, help="Non-secret deployment config JSON")
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    parser.add_argument("--require-seed", action="store_true")
    args = parser.parse_args(argv)

    result = verify_world(
        args.db,
        seed_path=args.seed,
        objects_path=args.objects,
        config_path=args.config,
        require_seed=args.require_seed,
    )
    if args.json:
        print(
            json.dumps(
                {
                    "ok": result.ok,
                    "line": result.pass_line(),
                    "checks": result.checks,
                    "failures": result.failures,
                    "warnings": result.warnings,
                    "manifest": result.manifest,
                },
                indent=2,
                sort_keys=True,
            )
        )
    else:
        for name, status in sorted(result.checks.items()):
            print(f"  [{status}] {name}")
        for w in result.warnings:
            print(f"  warn: {w}", file=sys.stderr)
        for f in result.failures:
            print(f"  fail: {f}", file=sys.stderr)
        print(result.pass_line())
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
