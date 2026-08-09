"""Replay runner for v0.1 Chamber acceptance fixtures."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from noema.world.digest import event_body_digest, sha256_digest
from noema.world.reduce import ReduceError, apply_event
from noema.world.state import WorldState, acceptance_projection, load_seed


@dataclass
class ReplayResult:
    status: str
    event_count: int
    final_state_digest: str
    expected_final_state_digest: str
    observation_digests: dict[str, str]
    expected_observation_digests: dict[str, str]
    divergences: list[str] = field(default_factory=list)
    acceptance_view: dict[str, Any] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.status == "EQUIVALENT" and not self.divergences


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def replay_v01_seed(fixture_dir: Path | str) -> ReplayResult:
    root = Path(fixture_dir)
    seed_path = root / "world-seed.json"
    traj_path = root / "sample-trajectory.jsonl"
    expected_final = (root / "expected-final-state-digest.txt").read_text(encoding="utf-8").strip()
    expected_obs = json.loads((root / "expected-observation-digests.json").read_text(encoding="utf-8"))
    expected_events = _load_jsonl(root / "expected-event-digests.jsonl")
    expected_view = json.loads((root / "expected-final-state.json").read_text(encoding="utf-8"))

    state: WorldState = load_seed(seed_path)
    events = _load_jsonl(traj_path)
    divergences: list[str] = []

    # Verify expected event digest table length
    if len(expected_events) != len(events):
        divergences.append(
            f"event count mismatch: trajectory={len(events)} expected_table={len(expected_events)}"
        )

    for idx, event in enumerate(events):
        # Integrity of published digest
        recomputed = event_body_digest(event)
        if recomputed != event.get("digest"):
            divergences.append(
                f"event digest mismatch at {event.get('event_id')}: "
                f"envelope={event.get('digest')} recomputed={recomputed}"
            )
        if idx < len(expected_events):
            row = expected_events[idx]
            if row.get("digest") != event.get("digest"):
                divergences.append(
                    f"expected-event-digests mismatch at seq {event.get('sequence')}"
                )
            if row.get("event_type") != event.get("event_type"):
                divergences.append(
                    f"event type table mismatch at seq {event.get('sequence')}"
                )

        try:
            state = apply_event(state, event)
        except ReduceError as exc:
            divergences.append(f"reducer rejected {event.get('event_id')} {event.get('event_type')}: {exc}")
            break

    view = acceptance_projection(state)
    final_digest = sha256_digest(view)

    if view != expected_view:
        divergences.append("acceptance view != expected-final-state.json")
        # include a short hint
        for key in sorted(set(view) | set(expected_view)):
            if view.get(key) != expected_view.get(key):
                divergences.append(f"  field {key}: got={view.get(key)!r} want={expected_view.get(key)!r}")

    if final_digest != expected_final:
        divergences.append(
            f"final state digest mismatch: got={final_digest} want={expected_final}"
        )

    for obs_id, digest in expected_obs.items():
        got = state.observation_digests.get(obs_id)
        if got != digest:
            divergences.append(
                f"observation digest mismatch {obs_id}: got={got} want={digest}"
            )

    status = "EQUIVALENT" if not divergences else "DIVERGENT"
    return ReplayResult(
        status=status,
        event_count=state.event_count,
        final_state_digest=final_digest,
        expected_final_state_digest=expected_final,
        observation_digests=dict(state.observation_digests),
        expected_observation_digests=dict(expected_obs),
        divergences=divergences,
        acceptance_view=view,
    )
