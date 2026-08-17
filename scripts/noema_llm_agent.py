#!/usr/bin/env python3
"""Golden-path LLM Controller. Private keys stay in this process."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from noema.cli.agent import print_obs  # noqa: E402
from noema.harness.auth import StaticTokenProvider  # noqa: E402
from noema.harness.loop import HeadlessHarness  # noqa: E402
from noema.harness.policy import HarnessPolicy  # noqa: E402
from noema.harness.tenant import TenantError, resolve_tenant  # noqa: E402
from noema.harness.transport import GatewayClient, default_http  # noqa: E402
from noema.llm.adapter import LlmProposeAdapter  # noqa: E402
from noema.llm.manifest import validate_manifest  # noqa: E402
from noema.llm.providers import OpenAICompatibleProposer, StaticProposer  # noqa: E402
from noema.llm.rest import protocol_auth, protocol_hello  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="NOEMA LLM Controller (v0.1)")
    p.add_argument("--base", default=os.environ.get("NOEMA_BASE", "https://noema.guru"))
    p.add_argument("--token", default=os.environ.get("NOEMA_TOKEN"))
    p.add_argument("--tenant", default=None)
    p.add_argument("--live-tenant", action="store_true")
    p.add_argument("--turns", type=int, default=4)
    p.add_argument("--provider", default="none", choices=["none", "openai-compatible"])
    p.add_argument("--llm-base", default=os.environ.get("NOEMA_LLM_BASE", "https://api.openai.com/v1"))
    p.add_argument("--llm-model", default=os.environ.get("NOEMA_LLM_MODEL", "gpt-4.1-mini"))
    p.add_argument("--runtime", default="noema-llm-agent")
    p.add_argument("--skip-hello", action="store_true")
    args = p.parse_args(argv)

    validate_manifest(
        {
            "schema_version": "agent-manifest/1.1",
            "display_name": "envoy.llm",
            "runtime": {"name": "noema-llm-agent", "version": "0.1.0"},
            "protocol_version": "agent-protocol/v1",
            "controller_kind": "llm",
            "model": {"provider": args.provider if args.provider != "none" else "none"},
        }
    )

    try:
        tenant = resolve_tenant(args.tenant, live=args.live_tenant, env=os.environ)
    except TenantError as exc:
        print("tenant refused", exc.code, exc.message)
        return 2

    http = default_http
    base = args.base.rstrip("/")
    if not args.skip_hello:
        hello = protocol_hello(base, http)
        print("hello", hello.get("type") or hello.get("error"))
        if hello.get("type") == "ERROR":
            return 1

    if not args.token:
        print("AUTH_REQUIRED set NOEMA_TOKEN")
        return 2
    if not args.skip_hello:
        ack = protocol_auth(base, args.token, http)
        print("auth", ack.get("type") or ack.get("error"))

    if args.provider == "openai-compatible":
        propose = OpenAICompatibleProposer(base_url=args.llm_base, model=args.llm_model)
    else:
        propose = StaticProposer()
    adapter = LlmProposeAdapter(propose)
    client = GatewayClient(
        base,
        StaticTokenProvider(args.token),
        runtime=args.runtime,
        command_path=tenant.command_path,
        world_id=tenant.world_id,
        admin_token=os.environ.get("NOEMA_ADMIN_TOKEN") if tenant.isolated else None,
    )
    if tenant.isolated and not client.admin_token:
        print("tenant refused ADMIN_TOKEN_REQUIRED")
        return 2
    harness = HeadlessHarness(client, adapter, HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=max(2, args.turns))
    for turn in run.turns:
        label = turn.proposal.action if turn.proposal else (turn.reason or "stop")
        print("---", label)
        if turn.result:
            print_obs(turn.result)
    if adapter.last_error:
        print("propose_error", adapter.last_error)
    return 0 if run.orientation_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
