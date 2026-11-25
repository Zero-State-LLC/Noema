#!/usr/bin/env python3
"""Deterministic natural-play STUDY pack exporter with SHA-256 manifest (#423, ADR-0009)."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def export_study_pack(source_dir: Path, output_dir: Path, world_id: str, worker_version_id: str) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    files: list[dict[str, Any]] = []
    for src in sorted(p for p in source_dir.rglob("*") if p.is_file()):
        rel = src.relative_to(source_dir).as_posix()
        raw = src.read_bytes()
        dest = output_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        files.append({"path": rel, "bytes": len(raw), "sha256": sha256_bytes(raw)})

    manifest = {
        "pack_schema": "noema.study_pack.v1",
        "world_id": world_id,
        "worker_version_id": worker_version_id,
        "file_count": len(files),
        "files": files,
    }
    manifest_bytes = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")
    (output_dir / "manifest.json").write_bytes(manifest_bytes)
    manifest["manifest_sha256"] = sha256_bytes(manifest_bytes)
    return manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export deterministic STUDY pack with SHA-256 manifest.")
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--world-id", default="world.perihelion-reach-3")
    parser.add_argument("--worker-version-id", required=True)
    args = parser.parse_args(argv)
    manifest = export_study_pack(args.source_dir, args.output_dir, args.world_id, args.worker_version_id)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
