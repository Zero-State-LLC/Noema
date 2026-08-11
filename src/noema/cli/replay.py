"""CLI: noema-replay — run v0.1 Chamber fixture replay."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from noema.replay.runner import replay_v01_seed


def default_fixture_dir() -> Path:
    # package repo layout: <repo>/fixtures/v01-seed
    here = Path(__file__).resolve()
    candidates = [
        here.parents[3] / "fixtures" / "v01-seed",  # src/noema/cli -> repo
        Path.cwd() / "fixtures" / "v01-seed",
    ]
    for path in candidates:
        if path.is_dir():
            return path
    return candidates[0]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Replay NOEMA v0.1 Chamber seed fixtures")
    parser.add_argument(
        "--fixtures",
        type=Path,
        default=default_fixture_dir(),
        help="Path to examples/v01-seed style fixture directory",
    )
    parser.add_argument("--json", action="store_true", help="Emit machine-readable result")
    args = parser.parse_args(argv)

    result = replay_v01_seed(args.fixtures)
    if args.json:
        print(
            json.dumps(
                {
                    "status": result.status,
                    "event_count": result.event_count,
                    "final_state_digest": result.final_state_digest,
                    "expected_final_state_digest": result.expected_final_state_digest,
                    "observation_digests": result.observation_digests,
                    "divergences": result.divergences,
                    "acceptance_view": result.acceptance_view,
                },
                indent=2,
                sort_keys=True,
            )
        )
    else:
        print(f"status: {result.status}")
        print(f"events: {result.event_count}")
        print(f"final_digest: {result.final_state_digest}")
        print(f"expected:     {result.expected_final_state_digest}")
        if result.warnings:
            print("warnings:")
            for w in result.warnings:
                print(f"  - {w}")
        if result.divergences:
            print("divergences:")
            for d in result.divergences:
                print(f"  - {d}")
        else:
            print("EQUIVALENT under v0.1 acceptance boundary")
    return 0 if result.ok else 1


if __name__ == "__main__":
    sys.exit(main())
