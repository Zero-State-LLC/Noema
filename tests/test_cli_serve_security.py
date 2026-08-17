"""Security boundaries for the noema-serve network bind."""

from __future__ import annotations

import pytest

from noema.cli import serve as serve_cli


def test_default_host_is_loopback(monkeypatch, tmp_path):
    observed: dict[str, object] = {}

    class FakeServer:
        def serve_forever(self) -> None:
            return None

        def server_close(self) -> None:
            return None

    def fake_serve(runtime, *, host: str, port: int):
        observed.update(host=host, port=port)
        return FakeServer()

    monkeypatch.setattr(serve_cli, "serve", fake_serve)

    assert serve_cli.main(["--db", str(tmp_path / "default.sqlite3"), "--no-autoload"]) == 0
    assert observed == {"host": "127.0.0.1", "port": 8080}


def test_non_loopback_local_bind_requires_explicit_unsafe_opt_in(monkeypatch, tmp_path):
    class FakeServer:
        def serve_forever(self) -> None:
            return None

        def server_close(self) -> None:
            return None

    monkeypatch.setattr(serve_cli, "serve", lambda runtime, *, host, port: FakeServer())
    monkeypatch.delenv("NOEMA_ENV", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)

    with pytest.raises(SystemExit) as exc:
        serve_cli.main(
            [
                "--host",
                "0.0.0.0",
                "--db",
                str(tmp_path / "blocked.sqlite3"),
                "--no-autoload",
            ]
        )

    assert exc.value.code == 2


def test_explicit_unsafe_opt_in_preserves_local_network_development(monkeypatch, tmp_path):
    observed: dict[str, object] = {}

    class FakeServer:
        def serve_forever(self) -> None:
            return None

        def server_close(self) -> None:
            return None

    def fake_serve(runtime, *, host: str, port: int):
        observed.update(host=host, port=port)
        return FakeServer()

    monkeypatch.delenv("NOEMA_ENV", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.setattr(serve_cli, "serve", fake_serve)

    assert (
        serve_cli.main(
            [
                "--host",
                "0.0.0.0",
                "--allow-insecure-dev-bind",
                "--db",
                str(tmp_path / "allowed.sqlite3"),
                "--no-autoload",
            ]
        )
        == 0
    )
    assert observed["host"] == "0.0.0.0"


def test_configured_production_bind_preserves_public_deployment(monkeypatch, tmp_path):
    observed: dict[str, object] = {}

    class FakeServer:
        def serve_forever(self) -> None:
            return None

        def server_close(self) -> None:
            return None

    def fake_serve(runtime, *, host: str, port: int):
        observed.update(host=host, port=port)
        return FakeServer()

    monkeypatch.setenv("NOEMA_ENV", "production")
    monkeypatch.setenv("TOKEN_SIGNING_SECRET", "test-signing-secret")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(serve_cli, "serve", fake_serve)

    assert (
        serve_cli.main(
            [
                "--host",
                "0.0.0.0",
                "--db",
                str(tmp_path / "production.sqlite3"),
                "--no-autoload",
            ]
        )
        == 0
    )
    assert observed["host"] == "0.0.0.0"
