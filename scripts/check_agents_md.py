#!/usr/bin/env python3
"""Fail if root AGENTS.md is missing or larger than the contract ceiling."""

from __future__ import annotations

import sys
from pathlib import Path

# Router contract, not the gotcha novel. Prior AGENTS.md was ~16 KiB.
MAX_BYTES = 10_000

ROOT = Path(__file__).resolve().parents[1]
AGENTS = ROOT / "AGENTS.md"


def main() -> int:
    if not AGENTS.is_file():
        print(f"missing {AGENTS}", file=sys.stderr)
        return 1
    size = AGENTS.stat().st_size
    if size > MAX_BYTES:
        print(
            f"{AGENTS} is {size} bytes; ceiling is {MAX_BYTES}. "
            "Keep AGENTS.md a short router; put gotchas in docs/AGENT-GOTCHAS.md.",
            file=sys.stderr,
        )
        return 1
    print(f"AGENTS.md ok ({size} bytes <= {MAX_BYTES})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
