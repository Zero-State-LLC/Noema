from pathlib import Path

import pytest

from noema.replay.runner import replay_v01_seed
from noema.world.digest import sha256_digest
from noema.world.reduce import ReduceError, apply_event, require_seed_stream
from noema.world.state import load_seed

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "v01-seed"


def test_v01_golden_replay_is_equivalent_twice():
    first = replay_v01_seed(FIXTURES)
    second = replay_v01_seed(FIXTURES)
    assert first.ok, "\n".join(first.divergences)
    assert second.ok, "\n".join(second.divergences)
    assert first.final_state_digest == second.final_state_digest
    assert first.final_state_digest == first.expected_final_state_digest
    assert first.status == "EQUIVALENT"


def test_unknown_seed_stream_hard_fails():
    with pytest.raises(ReduceError, match="unknown seed stream"):
        require_seed_stream("not.a.registered.stream")
    with pytest.raises(ReduceError, match="unknown seed stream"):
        require_seed_stream("")
    require_seed_stream("noise.stream.v01")


def test_unknown_stream_on_event_aborts_reduce():
    state = load_seed(FIXTURES / "world-seed.json")
    event = {
        "event_type": "NOISE_APPLIED",
        "sequence": 1,
        "cycle": 0,
        "digest": "sha256:dead",
        "previous_digest": None,
        "payload": {
            "noise_id": "noise.bad",
            "observation_id": "obs.missing",
            "agent_id": "agent.nacre",
            "level": 0.1,
            "fields_affected": [],
            "operations": [],
            "seed_stream_id": "invented.stream",
        },
    }
    with pytest.raises(ReduceError, match="unknown seed stream"):
        apply_event(state, event)


def test_acceptance_view_digest_excludes_unrelated_watch_bytes():
    first = replay_v01_seed(FIXTURES)
    assert first.ok
    watch_only = {"watch": "not world truth", "nodes": 99}
    assert sha256_digest(first.acceptance_view) == first.final_state_digest
    assert sha256_digest({**first.acceptance_view, **watch_only}) != first.final_state_digest
