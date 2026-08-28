#!/usr/bin/env python3
"""Build a deterministic, redacted Specs/runtime/live provenance report."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SECRET_KEYS = re.compile(r"(?:secret|token|password|email|device.?code|private.?prompt|private.?cognition)", re.I)


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_state(path: Path) -> dict:
    # Deliberately parse only the scalar authority pointers. This avoids adding a
    # YAML dependency and, more importantly, never rewrites or normalizes the file.
    text = path.read_text(encoding="utf-8")
    out = {"source": str(path)}
    for key in ("as_of", "production_specs_baseline", "production_implements_specs",
                "production_successor_runtime", "live_worker_version_id", "advanced_worker_runtime"):
        m = re.search(rf"^\s*{re.escape(key)}:\s*([^#\n]+)", text, re.M)
        if m:
            out[key] = m.group(1).strip().strip('"\'')
    return out


def redact(value):
    if isinstance(value, dict):
        return {k: "[REDACTED]" if SECRET_KEYS.search(k) else redact(v) for k, v in sorted(value.items())}
    if isinstance(value, list):
        return [redact(v) for v in value]
    return value


def required(obj, path):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            raise ValueError(f"missing required evidence field: {path}")
        cur = cur[part]
    if cur in (None, ""):
        raise ValueError(f"empty required evidence field: {path}")
    return cur


def build_report(specs_path: Path, compat_path: Path, version_path: Path, ready_path: Path) -> dict:
    specs = load_state(specs_path)
    compat = load_json(compat_path)
    version = load_json(version_path)
    ready = load_json(ready_path)
    worker = str(required(version, "worker_version_id"))
    source = compat.get("hosted_live", {}).get("source_commit")
    pinned_worker = compat.get("hosted_live", {}).get("worker_version_id")
    live_world = version.get("world_id") or ready.get("world_id") or ready.get("world", {}).get("world_id")
    live_genesis = ready.get("genesis_id") or ready.get("world", {}).get("genesis_id")
    evidence = compat.get("hosted_live", {}).get("version_evidence", {})
    unsupported = (
        (evidence.get("worker_version_id") and pinned_worker and evidence["worker_version_id"] != pinned_worker)
        or (evidence.get("source_commit") and source and evidence["source_commit"] != source)
    )
    relationship = "unsupported_worker_source_relationship" if unsupported else (
        "supported_recorded_pair" if source else "worker_source_unrecorded"
    )
    mismatches = []
    checks = [
        ("worker_version_id", pinned_worker, worker, "current_deployment_pointer"),
        ("world_id", compat.get("hosted_live", {}).get("world_id"), live_world, "current_deployment_pointer"),
        ("genesis_id", compat.get("hosted_live", {}).get("genesis_id"), live_genesis, "current_deployment_pointer"),
        ("specs_git", compat.get("hosted_live", {}).get("specs_git"), specs.get("production_implements_specs"), "historical_vs_current_authority"),
        ("worker_version_id", specs.get("live_worker_version_id"), worker, "historical_vs_current_deployment"),
    ]
    for field, left, right, classification in checks:
        if left is not None and right is not None and left != right:
            mismatches.append({"field": field, "left": left, "right": right, "classification": classification})
    return redact({
        "schema_version": "noema-provenance-report/1.0",
        "sources": {
            "specs_current_state": {"path": str(specs_path), "kind": "historical_authority_evidence", "pointers": specs},
            "runtime_spec_compat": {"path": str(compat_path), "kind": "current_repository_pointer", "pointers": {"hosted_live": compat.get("hosted_live", {})}},
            "live_version": {"path": str(version_path), "kind": "current_deployment_evidence", "value": version},
            "live_ready": {"path": str(ready_path), "kind": "current_deployment_evidence", "value": ready},
        },
        "relationship": relationship,
        "mismatches": mismatches,
        "status": "FAIL" if relationship == "unsupported_worker_source_relationship" else ("MISMATCH" if mismatches else "ALIGNED"),
    })


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--specs", required=True, type=Path)
    p.add_argument("--compat", required=True, type=Path)
    p.add_argument("--version", required=True, type=Path)
    p.add_argument("--ready", required=True, type=Path)
    p.add_argument("--output", type=Path)
    args = p.parse_args(argv)
    try:
        report = build_report(args.specs, args.compat, args.version, args.ready)
        if report["status"] == "FAIL":
            raise ValueError("candidate claims an unsupported Worker/source relationship")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"provenance-report: error: {exc}", file=sys.stderr)
        return 2
    rendered = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
