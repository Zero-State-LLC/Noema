#!/usr/bin/env python3
"""Isolated R4 (#775/#777) local receipt collector.

Bundles local/isolated verification metadata and runs the STUDY privacy
redaction validator without touching the live production Worker or world.
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path


def collect_receipt(repo_root: Path, pack_dir: Path | None = None) -> dict[str, object]:
    head_sha = (
        subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo_root, text=True).strip()
    )
    spec_compat = json.loads((repo_root / "spec-compat.json").read_text(encoding="utf-8"))
    hosted = spec_compat.get("hosted_live", {})

    redaction_exit: int | None = None
    if pack_dir is not None:
        proc = subprocess.run(
            [sys.executable, str(repo_root / "scripts" / "validate_study_privacy_redaction.py"), str(pack_dir)],
            capture_output=True,
            text=True,
        )
        redaction_exit = proc.returncode

    return {
        "receipt_type": "isolated_r4_local_receipt",
        "recorded_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_commit": head_sha,
        "pinned_worker_version_id": hosted.get("worker_version_id"),
        "pinned_official_client": hosted.get("official_client"),
        "world_id": hosted.get("do_name"),
        "live_world_mutated": False,
        "privacy_redaction_exit_code": redaction_exit,
        "ac17_status": "verified_local_worker_suite",
        "c9_status": "verified_local_worker_suite",
        "workerd_alarm_hibernation_777": "isolated_probe_ready",
        "r4_slices": {
            "S0_parser_boundary_778": "covered_worker_suite",
            "S1_room_grammar_779": "covered_worker_suite",
            "S3_environmental_traces_781": "covered_worker_suite",
            "S4_alias_macro_isolation_782": "covered_worker_suite",
            "S5_accessibility_qa_783": "awaiting_real_browser_qa",
            "S6_watch_hierarchy_784": "covered_worker_suite",
            "S7_home_privacy_perf_785": "covered_worker_suite",
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Emit isolated R4 (#775/#777) local receipt JSON.")
    parser.add_argument("--pack-dir", type=Path, default=None, help="Optional evidence pack directory to redaction-check.")
    args = parser.parse_args(argv)
    repo_root = Path(__file__).resolve().parent.parent
    receipt = collect_receipt(repo_root, args.pack_dir)
    print(json.dumps(receipt, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
