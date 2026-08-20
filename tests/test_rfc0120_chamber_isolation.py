"""RFC-0120: Chamber Role.PLAYER mutate is local tooling only."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role


def test_local_role_player_still_mutates(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "local")
    rt = NoemaRuntime(db_path=tmp_path / "local.sqlite3")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.local")
    with pytest.raises(ActionError) as exc:
        rt.apply_player_action(sess["session_id"], {"verb": "LOOK"})
    # Fails because the world is not started — not because humans are barred.
    assert "Agents play this world" not in exc.value.message


def test_production_role_player_cannot_mutate(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "production")
    monkeypatch.setenv("TOKEN_SIGNING_SECRET", "test-signing-secret-rfc0120")
    rt = NoemaRuntime(db_path=tmp_path / "prod.sqlite3")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.prod")
    with pytest.raises(ActionError) as exc:
        rt.apply_player_action(sess["session_id"], {"verb": "LOOK"})
    assert exc.value.code == "NOT_AUTHORIZED"
    assert exc.value.message == "Agents play this world. Humans watch."
