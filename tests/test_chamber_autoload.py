"""Chamber serve must resume an existing ledger instead of reseeding it."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.actions.errors import CONFLICT, ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "fixtures" / "v01-seed" / "world-seed.json"


def _enter(rt: NoemaRuntime, handle: str, seq: int = 1) -> dict:
    agent_id = f"agent.{handle}"
    sess = rt.create_session(role=Role.AGENT, agent_id=agent_id)
    return rt.apply_player_action(
        sess["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": agent_id,
            "client_action_sequence": seq,
            "action_id": f"act.enter.{handle}.{seq}",
            "idempotency_key": f"idem.enter.{handle}.{seq}",
            "parameters": {},
        },
    )


def test_autoload_resumes_ledger_and_new_agent_enters(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    first = rt.autoload_world(SEED)
    assert not first.get("resumed")
    entered = _enter(rt, "kestrel")
    assert entered["results"][0]["status"] == "APPLIED"
    seq = rt.store.get_state().sequence
    assert seq >= 1
    rt.store.close()

    rt2 = NoemaRuntime(db_path=db)
    resumed = rt2.autoload_world(SEED)
    assert resumed["resumed"] is True
    assert resumed["sequence"] == seq
    assert rt2.store.verify_consistency() == []
    again = _enter(rt2, "lyra-new")
    assert again["results"][0]["status"] == "APPLIED"
    assert again["events"][0]["event_type"] == "AGENT_ENTERED_WORLD"
    assert rt2.store.get_state().sequence == seq + 1
    assert "agent.lyra-new" in rt2.store.get_state().active_agents
    rt2.store.close()


def test_start_world_refuses_existing_ledger(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    rt.start_world(SEED)
    _enter(rt, "alice")
    with pytest.raises(ActionError) as exc:
        rt.start_world(SEED)
    assert exc.value.code == CONFLICT
    assert "resume" in exc.value.message
    rt.store.close()


def test_start_world_refuses_seeded_world_with_zero_events(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    first = rt.start_world(SEED)
    assert first.get("resumed") is not True
    assert rt.store.has_started_world() is True
    assert rt.store.committed_event_count() == 0
    with pytest.raises(ActionError) as exc:
        rt.start_world(SEED)
    assert exc.value.code == CONFLICT
    assert "resume" in exc.value.message
    rt.store.close()


def test_rehydrate_syncs_meta_after_stale_seed_reload(tmp_path: Path):
    """Old noema-serve called load_from_seed on every boot and left events behind."""
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    rt.start_world(SEED)
    _enter(rt, "bob")
    played_seq = rt.store.get_state().sequence
    rt.store.load_from_seed(SEED)
    problems = rt.store.verify_consistency()
    assert any("sequence" in p for p in problems)
    rt.store.close()

    rt2 = NoemaRuntime(db_path=db)
    resumed = rt2.resume_world(SEED)
    assert resumed["sequence"] == played_seq
    assert rt2.store.dump_meta().get("sequence") == str(played_seq)
    assert rt2.store.verify_consistency() == []
    entered = _enter(rt2, "new-handle")
    assert entered["results"][0]["status"] == "APPLIED"
    rt2.store.close()


def test_dev_role_agent_session_can_mutate():
    from noema.auth.roles import Principal

    source = Path("src/noema/auth/roles.py").read_text(encoding="utf-8")
    assert "return self.role == Role.AGENT" in source
    assert Principal("p1", Role.PLAYER, "agent.x").can_mutate_world() is False
    assert Principal("a1", Role.AGENT, "agent.x").can_mutate_world() is True
