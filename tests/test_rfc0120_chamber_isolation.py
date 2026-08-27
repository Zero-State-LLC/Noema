"""RFC-0120: Chamber Role.PLAYER never mutates. Role.AGENT inhabits."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Principal, Role


def test_role_player_never_mutates(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "local")
    rt = NoemaRuntime(db_path=tmp_path / "local.sqlite3")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.local")
    with pytest.raises(ActionError) as exc:
        rt.apply_player_action(sess["session_id"], {"verb": "LOOK"})
    assert exc.value.code == "NOT_AUTHORIZED"
    assert exc.value.message == "Agents play this world. Humans watch."
    assert Principal("p", Role.PLAYER, "agent.x").can_mutate_world() is False


def test_production_role_player_cannot_mutate(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "production")
    monkeypatch.setenv("TOKEN_SIGNING_SECRET", "test-signing-secret-rfc0120")
    rt = NoemaRuntime(db_path=tmp_path / "prod.sqlite3")
    sess = rt.create_session(role=Role.PLAYER, agent_id="agent.prod")
    with pytest.raises(ActionError) as exc:
        rt.apply_player_action(sess["session_id"], {"verb": "LOOK"})
    assert exc.value.code == "NOT_AUTHORIZED"
    assert exc.value.message == "Agents play this world. Humans watch."


def test_production_controller_token_only_creates_agent_sessions(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("NOEMA_ENV", "production")
    monkeypatch.setenv("TOKEN_SIGNING_SECRET", "test-signing-secret-rfc0120")
    rt = NoemaRuntime(db_path=tmp_path / "prod-token.sqlite3")
    human_binding = {
        "player_id": "player.human",
        "controller_id": "controller.human",
        "controller": {"type": "human"},
        "scopes": ["noema.action.submit"],
    }
    monkeypatch.setattr(rt.identity, "resolve_access_token", lambda _token: human_binding)

    with pytest.raises(ActionError) as exc:
        rt.create_session_from_controller_token("human-token")
    assert exc.value.code == "NOT_AUTHORIZED"
    assert exc.value.message == "Agents play this world. Humans watch."

    agent_binding = {
        **human_binding,
        "player_id": "player.agent",
        "controller_id": "controller.agent",
        "controller": {"type": "agent"},
        "agent_id": "agent.prod",
    }
    monkeypatch.setattr(rt.identity, "resolve_access_token", lambda _token: agent_binding)
    session = rt.create_session_from_controller_token("agent-token")
    assert session["role"] == Role.AGENT.value
    assert session["agent_id"] == "agent.prod"


def test_role_agent_can_mutate_world():
    assert Principal("a", Role.AGENT, "agent.x").can_mutate_world() is True
    assert Principal("admin", Role.ADMIN).can_mutate_world() is False
