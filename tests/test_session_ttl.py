"""Chamber HTTP session lifetime."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role


def test_new_sessions_carry_expiry(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "sess.sqlite3")
    sess = rt.create_session(role=Role.SPECTATOR)
    assert sess["expires_at"] > sess["created_at"]
    principal = rt.get_principal(sess["session_id"])
    assert principal.role is Role.SPECTATOR


def test_expired_session_is_rejected(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_SESSION_TTL_SECONDS", "1")
    rt = NoemaRuntime(db_path=tmp_path / "sess.sqlite3")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.ttl")
    sess["expires_at"] = sess["created_at"] - 1
    rt.sessions[sess["session_id"]] = sess
    rt.store.save_session(sess["session_id"], sess)
    with pytest.raises(ActionError) as exc:
        rt.get_principal(sess["session_id"])
    assert exc.value.code == "NOT_AUTHORIZED"
    assert "expired" in exc.value.message
