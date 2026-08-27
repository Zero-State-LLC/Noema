"""RFC-0120 P12: Deep Time STUDY is not a Player mutation path."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.errors import POLICY_DENIED, ResearchError


def test_player_and_spectator_cannot_ingest_deep_time(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "dt.sqlite3")
    player = rt.create_session(role=Role.PLAYER, agent_id="agent.local")
    spectator = rt.create_session(role=Role.SPECTATOR)
    for sess in (player, spectator):
        with pytest.raises(ResearchError) as exc:
            rt.deep_time_ingest(sess["session_id"], {"scars": []})
        assert exc.value.code == POLICY_DENIED
        assert "RESEARCHER" in exc.value.message


def test_researcher_ingest_does_not_mutate_the_ledger(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "dt-research.sqlite3")
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.deep_time_ingest(researcher["session_id"], {"scars": []})
    assert out["mutates_world"] is False
    assert out["ledger_unchanged"] is True
    assert out["lore_is_not_truth"] is True
