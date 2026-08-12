"""CLI: noema-serve — start Chamber modular monolith HTTP gateway."""

from __future__ import annotations

import argparse
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.gateway.http_server import serve
from noema.persistence.store import is_postgres_url


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Serve NOEMA Chamber MVP")
    parser.add_argument("--host", default="0.0.0.0")
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
    args = parser.parse_args(argv)

    if not is_postgres_url(args.db):
        Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    runtime = NoemaRuntime(db_path=args.db, deployment_config=args.config)
    if not args.no_autoload and args.seed.is_file():
        runtime.start_world(args.seed)
        print(f"loaded seed {args.seed}")
    httpd = serve(runtime, host=args.host, port=args.port)
    print(f"noema listening on http://{args.host}:{args.port}")
    print(f"configuration_digest={runtime.configuration_digest}")
    print("UI: /  /watch  /play")
    print("API: /health /ready /version /manifest /config /admin/start /session /play/action /play/observe /watch/live /protocol/v1")
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
