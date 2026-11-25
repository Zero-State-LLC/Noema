#!/usr/bin/env python3
"""Aggregate Controller run logs into a `psr1_cohort_summary` receipt (#422, ADR-0009)."""

from __future__ import annotations

import argparse
import datetime
import json
from pathlib import Path
from typing import Any


def aggregate_cohort(records: list[dict[str, Any]], worker_version_id: str, world_id: str) -> dict[str, Any]:
    controllers = {str(r["controller_id"]): r for r in records if r.get("controller_id")}
    styles = sorted({str(r.get("integration_style", "")) for r in controllers.values() if r.get("integration_style")})
    non_first_party = [r for r in controllers.values() if r.get("operator_tier") in {"tier-2", "tier-3"}]
    tier3_count = sum(1 for r in controllers.values() if r.get("operator_tier") == "tier-3")
    total_actions = sum(int(r.get("actions_completed", 0)) for r in controllers.values())
    min_actions = min((int(r.get("actions_completed", 0)) for r in controllers.values()), default=0)
    cycles = [int(r.get("start_cycle", 0)) for r in controllers.values() if "start_cycle" in r]
    end_cycles = [int(r.get("end_cycle", 0)) for r in controllers.values() if "end_cycle" in r]
    delta_cycle = (max(end_cycles) - min(cycles)) if (cycles and end_cycles) else 0
    regressions = sum(int(r.get("protocol_regressions", 0)) for r in controllers.values())

    return {
        "receipt_type": "psr1_cohort_summary",
        "recorded_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "world_id": world_id,
        "worker_version_id": worker_version_id,
        "controller_count": len(controllers),
        "non_first_party_count": len(non_first_party),
        "tier3_operator_count": tier3_count,
        "integration_styles": styles,
        "delta_cycle": delta_cycle,
        "min_actions_per_player": min_actions,
        "total_actions": total_actions,
        "protocol_regressions": regressions,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Aggregate PSR-1 cohort controller JSON logs.")
    parser.add_argument("input_json", type=Path, help="JSON file containing list of controller run summaries.")
    parser.add_argument("--worker-version-id", required=True)
    parser.add_argument("--world-id", default="world.perihelion-reach-3")
    args = parser.parse_args(argv)
    records = json.loads(args.input_json.read_text(encoding="utf-8"))
    summary = aggregate_cohort(records, args.worker_version_id, args.world_id)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
