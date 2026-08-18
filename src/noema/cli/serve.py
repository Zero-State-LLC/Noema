"""CLI: noema-serve — start Chamber modular monolith HTTP gateway."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.gateway.http_server import serve
from noema.persistence.store import is_postgres_url


_LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}


def _validate_network_bind(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
    if args.host.lower() in _LOOPBACK_HOSTS:
        return

    env = (os.environ.get("NOEMA_ENV") or "local").lower()
    if env in {"local", "test", "dev"}:
        if args.allow_insecure_dev_bind:
            return
        parser.error(
            "non-loopback local development binds require --allow-insecure-dev-bind; "
            "the development identity route issues credentials without external authentication"
        )

    missing = [
        name
        for name in ("TOKEN_SIGNING_SECRET",)
        if not os.environ.get(name)
    ]
    if not (os.environ.get("SUPABASE_JWT_SECRET") or os.environ.get("SUPABASE_URL")):
        missing.append("SUPABASE_JWT_SECRET or SUPABASE_URL")
    if missing:
        parser.error(
            f"non-loopback {env} bind requires production authentication configuration: "
            f"missing {', '.join(missing)}"
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Serve NOEMA Chamber MVP")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument(
        "--db",
        default="data/noema.sqlite3",
        help="SQLite path or PostgreSQL DSN (postgresql://user:pass@host/db)",
    )
    parser.add_argument("--seed", type=Path, default=Path("fixtures/v01-seed/world-seed.json"))
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Non-secret deployment config JSON (Specs deployment-config/1.0)",
    )
    parser.add_argument("--no-autoload", action="store_true")
    parser.add_argument(
        "--allow-insecure-dev-bind",
        action="store_true",
        help="allow local development authentication on a non-loopback interface (unsafe)",
    )
    args = parser.parse_args(argv)
    _validate_network_bind(parser, args)
    if not (os.environ.get("TOKEN_SIGNING_SECRET") or os.environ.get("AUTH_SECRET")):
        print(
            "warning: TOKEN_SIGNING_SECRET unset; using the built-in local development secret",
            file=sys.stderr,
        )

    if not is_postgres_url(args.db):
        Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    runtime = NoemaRuntime(db_path=args.db, deployment_config=args.config)
    if not args.no_autoload and args.seed.is_file():
        runtime.start_world(args.seed)
        print(f"loaded seed {args.seed}")
    httpd = serve(runtime, host=args.host, port=args.port)
    print(f"noema listening on http://{args.host}:{args.port}")
    print(f"configuration_digest={runtime.configuration_digest}")
    print("UI: /  /play  /watch  /study  /admin/login  /admin")
    print(
        "API: /health /auth/human /auth/device /auth/device/token /auth/token/refresh "
        "/session /play/action /protocol/v1 …"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("shutting down")
    finally:
        httpd.server_close()
        runtime.store.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
