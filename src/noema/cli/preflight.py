"""Read-only LCA-2 Gate B preflight and redacted run-record projection."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "noema-lca2-gate-b-preflight/1.0"
_SECRET = re.compile(r"(token|secret|password|credential|private.?key|bearer|email|prompt|cognition)", re.I)


def _clean(value: Any, key: str = "") -> Any:
    if _SECRET.search(key):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {k: _clean(value[k], k) for k in sorted(value)}
    if isinstance(value, list):
        return [_clean(v, key) for v in value]
    return value


def _truth(value: Any) -> bool:
    return value is True or str(value).lower() in {"pass", "passed", "ok", "green", "healthy", "approved", "clean", "true"}


def _repo_clean(root: Path) -> bool:
    try:
        return not bool(subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True, check=True).stdout.strip())
    except (OSError, subprocess.SubprocessError):
        return False


def build_preflight(source: dict[str, Any], *, repository: Path | str = ".") -> dict[str, Any]:
    """Build a stable, secret-free Gate B record without mutating runtime state."""
    src = source.get("run") if isinstance(source.get("run"), dict) else source
    pins = src.get("pins") or {}
    versions = src.get("versions") or {}
    worker = src.get("worker") or {}
    world = src.get("world") or {}
    health = src.get("health") or {}
    tests = src.get("test_evidence") or src.get("tests") or {}
    participants = src.get("participants") or src.get("participant_slots") or []
    receipts = src.get("operator_receipts") or src.get("enrollment_receipts") or []

    reasons: list[str] = []
    if not _truth(tests.get("worker_tests") or tests.get("worker_test")):
        reasons.append("worker_tests_not_green")
    if not _truth(tests.get("worker_typecheck") or tests.get("typecheck")):
        reasons.append("worker_typecheck_not_green")
    pin_values = [pins.get(k) or src.get(k) for k in ("worker_source", "worker_version", "specs_commit")]
    expected = src.get("expected_pins") or {}
    pin_disagree = any(expected.get(k) and expected.get(k) != pins.get(k) for k in expected)
    pin_disagree = pin_disagree or (
        pins.get("worker_source")
        and worker.get("source_pin")
        and pins["worker_source"] != worker["source_pin"]
    ) or (
        pins.get("worker_version")
        and worker.get("version_pin")
        and pins["worker_version"] != worker["version_pin"]
    )
    if any(not v for v in pin_values) or pin_disagree:
        reasons.append("pins_missing_or_disagree")
    if str(world.get("status") or health.get("status") or "").upper() in {"BLOCKED", "INCIDENT", "BLOCKING"} or str(health.get("settlement") or health.get("settlement_health") or "").upper() in {"BLOCKED", "INCIDENT", "BLOCKING", "DEGRADED"}:
        reasons.append("world_blocked")
    independent = [
        p for p in participants
        if isinstance(p, dict)
        and bool(p.get("independent_control_receipt") or p.get("independent_receipt"))
    ]
    if len(independent) < 3:
        reasons.append("fewer_than_three_independent_participant_receipts")
    if len(independent) >= 3 and any(not _truth(p.get("reconnect_tested")) for p in independent):
        reasons.append("participant_reconnect_evidence_incomplete")
    if not receipts or not any(_truth(r.get("approved") or r.get("approval_evidence")) for r in receipts if isinstance(r, dict)):
        reasons.append("enrollment_approval_evidence_absent")
    clean = _repo_clean(Path(repository))
    if not clean:
        reasons.append("repository_dirty")

    canonical = src.get("canonical_head") or {}
    if not isinstance(canonical, dict) or canonical.get("sequence") is None or not canonical.get("digest"):
        reasons.append("canonical_head_incomplete")
    record = {
        "schema_version": SCHEMA_VERSION,
        "run_id": src.get("run_id"),
        "runtime": {"version": versions.get("runtime") or src.get("runtime_version"), "spec_version": versions.get("spec") or src.get("spec_version"), "client_versions": versions.get("clients") or src.get("controller_versions") or {}},
        "worker": {"source_pin": worker.get("source_pin") or pins.get("worker_source"), "version_pin": worker.get("version_pin") or pins.get("worker_version")},
        "source_pins": {"worker_source": pins.get("worker_source"), "worker_version": pins.get("worker_version"), "specs_commit": pins.get("specs_commit")},
        "world": {"world_id": world.get("world_id") or src.get("world_id"), "genesis": world.get("genesis") or src.get("genesis_id"), "seal": world.get("seal") or src.get("seal"), "room": world.get("room") or src.get("room_bound")},
        "canonical_head": canonical,
        "health_settlement": health,
        "participant_slots": [{k: p.get(k) for k in ("label", "onboarding_path", "client_version", "player_reference", "controller_reference", "independent_control_receipt", "reconnect_tested") if k in p} for p in participants if isinstance(p, dict)],
        "redaction_policy": src.get("redaction_policy") or {"mode": "strict", "secrets": "never emitted", "identity": "opaque labels only"},
        "repository": {"clean": clean},
        "test_evidence": tests,
        "verdict": "BLOCKED" if reasons else "OPEN",
        "verdict_reasons": sorted(reasons),
    }
    if not record["run_id"]:
        material = json.dumps(_clean(record), sort_keys=True, separators=(",", ":"))
        record["run_id"] = "run.lca2." + hashlib.sha256(material.encode()).hexdigest()[:16]
    return _clean(record)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Read-only LCA-2 Gate B preflight")
    parser.add_argument("--input", type=Path, required=True, help="Non-secret candidate run JSON")
    parser.add_argument("--repository", type=Path, default=Path("."))
    args = parser.parse_args(argv)
    result = build_preflight(json.loads(args.input.read_text(encoding="utf-8")), repository=args.repository)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["verdict"] == "OPEN" else 1


if __name__ == "__main__":
    raise SystemExit(main())
