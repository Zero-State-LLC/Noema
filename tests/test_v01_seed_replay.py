from pathlib import Path

from noema.replay.runner import replay_v01_seed
from noema.world.digest import event_body_digest
import json


FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "v01-seed"


def test_v01_seed_replay_equivalent():
    result = replay_v01_seed(FIXTURES)
    assert result.divergences == [], "\n".join(result.divergences)
    assert result.status == "EQUIVALENT"
    assert result.ok
    assert result.event_count == 31


def test_event_digest_chain_integrity():
    lines = (FIXTURES / "sample-trajectory.jsonl").read_text(encoding="utf-8").splitlines()
    prev = None
    for line in lines:
        if not line.strip():
            continue
        event = json.loads(line)
        assert event_body_digest(event) == event["digest"]
        assert event.get("previous_digest") == prev
        prev = event["digest"]
