"""HTTP gateway security headers and admin cookie flags."""

from __future__ import annotations

from noema.gateway.http_server import _admin_session_cookie, _security_headers


def test_json_and_html_security_headers():
    json_headers = _security_headers()
    assert json_headers["X-Content-Type-Options"] == "nosniff"
    assert json_headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" not in json_headers
    html_headers = _security_headers(html=True)
    assert "default-src 'self'" in html_headers["Content-Security-Policy"]


def test_admin_cookie_secure_only_in_production(monkeypatch):
    monkeypatch.delenv("NOEMA_ENV", raising=False)
    local = _admin_session_cookie("sess.abc")
    assert "HttpOnly" in local
    assert "SameSite=Strict" in local
    assert "Secure" not in local
    monkeypatch.setenv("NOEMA_ENV", "production")
    prod = _admin_session_cookie("sess.abc")
    assert "Secure" in prod
