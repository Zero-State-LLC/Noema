#!/usr/bin/env python3
"""Verify deterministic SHA-256 manifest reconstruction of an exported STUDY pack (Item 14)."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


def verify_pack(pack_dir: Path) -> dict[str, Any]:
    manifest_path = pack_dir / "manifest.json"
    if not manifest_path.is_file():
        return {"ok": False, "errors": ["manifest.json missing"]}

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    files = manifest.get("files") or []
    for entry in files:
        rel = entry.get("path")
        expected_sha = entry.get("sha256")
        target = pack_dir / str(rel)
        if not target.is_file():
            errors.append(f"missing file: {rel}")
            continue
        actual_sha = hashlib.sha256(target.read_bytes()).hexdigest()
        if actual_sha != expected_sha:
            errors.append(f"sha256 mismatch for {rel}: expected {expected_sha}, got {actual_sha}")

    return {
        "ok": len(errors) == 0,
        "pack_dir": str(pack_dir),
        "verified_files": len(files),
        "errors": errors,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify exported STUDY pack SHA-256 manifest integrity.")
    parser.add_argument("pack_dir", type=Path)
    args = parser.parse_args(argv)
    result = verify_pack(args.pack_dir)
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
