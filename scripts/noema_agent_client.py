#!/usr/bin/env python3
"""Thin wrapper over the headless harness library. Same argv as Stage 0."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from noema.cli.agent import main, print_obs  # noqa: E402
from noema.harness.auth import enroll_device, poll_device_token, resolve_token, start_device  # noqa: E402
from noema.harness.transport import GatewayClient, default_http  # noqa: E402
from noema.harness.auth import StaticTokenProvider  # noqa: E402

http_json = default_http


def mint_token(base: str, handle: str, controller_type: str) -> dict:
    return http_json(
        "POST",
        f"{base.rstrip('/')}/v1/auth/dev-token",
        {"handle": handle, "controller_type": controller_type},
    )


def command(base: str, token: str, cmd: str, arguments: dict | None = None, runtime: str = "python-ref") -> dict:
    client = GatewayClient(base, StaticTokenProvider(token), runtime=runtime)
    result = client.send_command(cmd, arguments or {})
    return result.raw or {"ok": result.ok, "error": result.error}


if __name__ == "__main__":
    raise SystemExit(main())
