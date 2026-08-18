"""HTTP gateway security headers and admin cookie flags."""

from __future__ import annotations

from pathlib import Path

import pytest

from noema.actions.errors import ActionError
from noema.gateway.http_server import _admin_session_cookie, _security_headers, resolve_admin_seed_path


def test_json_and_html_security_headers():
    json_headers = _security_headers()
    assert json_headers["X-Content-Type-Options"] == "nosniff"
    assert json_headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" not in json_headers
    html_headers = _security_headers(html=True)
    assert "default-src 'self'" in html_headers["Content-Security-Policy"]


def test_admin_cookie_secure_outside_local_dev(monkeypatch):
    monkeypatch.delenv("NOEMA_ENV", raising=False)
    local = _admin_session_cookie("sess.abc")
    assert "HttpOnly" in local
    assert "SameSite=Strict" in local
    assert "Secure" not in local
    monkeypatch.setenv("NOEMA_ENV", "dev")
    assert "Secure" not in _admin_session_cookie("sess.abc")
    monkeypatch.setenv("NOEMA_ENV", "staging")
    assert "Secure" in _admin_session_cookie("sess.abc")
    monkeypatch.setenv("NOEMA_ENV", "production")
    prod = _admin_session_cookie("sess.abc")
    assert "Secure" in prod


def test_resolve_admin_seed_path_confines_to_fixtures(tmp_path: Path):
    fixtures = tmp_path / "fixtures" / "v01-seed"
    fixtures.mkdir(parents=True)
    seed = fixtures / "world-seed.json"
    seed.write_text("{}", encoding="utf-8")
    secret = tmp_path / "secret.json"
    secret.write_text("{}", encoding="utf-8")
    assert resolve_admin_seed_path("fixtures/v01-seed/world-seed.json", cwd=tmp_path) == seed.resolve()
    assert resolve_admin_seed_path(str(seed), cwd=tmp_path) == seed.resolve()
    with pytest.raises(ActionError, match="fixtures"):
        resolve_admin_seed_path(str(secret), cwd=tmp_path)
    with pytest.raises(ActionError, match="fixtures"):
        resolve_admin_seed_path("../secret.json", cwd=fixtures)
    with pytest.raises(ActionError, match="fixtures"):
        resolve_admin_seed_path("fixtures/missing.json", cwd=tmp_path)
