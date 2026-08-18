"""noema-agent CLI over the headless harness library."""

from __future__ import annotations

import argparse
import json
import os
import sys

from noema.harness.auth import StaticTokenProvider, enroll_device, resolve_token
from noema.harness.observe import to_state
from noema.harness.policy import HarnessPolicy
from noema.harness.report import write_report
from noema.harness.tenant import TenantError, resolve_tenant
from noema.harness.transport import GatewayClient, default_http
from noema.harness.types import ActionProposal
from noema.harness.validate import validate_proposal


def print_obs(result) -> None:
    payload = result.raw if hasattr(result, "raw") and result.raw is not None else result
    if isinstance(payload, dict) and not payload.get("ok") and not getattr(result, "ok", False):
        err = payload.get("error") or payload
        print("ERROR", json.dumps(err, indent=2))
        return
    if hasattr(result, "ok") and not result.ok:
        err = result.error or {"message": result.failure.value if result.failure else "failed"}
        print("ERROR", json.dumps(err, indent=2))
        return
    obs = (result.observation if hasattr(result, "observation") else None) or (payload.get("observation") if isinstance(payload, dict) else {}) or {}
    loc = obs.get("location") or {}
    print(f"[{obs.get('cycle')}/{obs.get('sequence')}] {loc.get('name')} ({loc.get('room_id')})")
    print(loc.get("description") or "")
    exits = loc.get("exits") or []
    if exits:
        print("Exits:", ", ".join(f"{e.get('direction')}→{e.get('to_room_id')}" for e in exits))
    ents = loc.get("entities") or []
    if ents:
        print("Here:", ", ".join(f"{e.get('label')}[{e.get('entity_id')}]" for e in ents))
    if getattr(result, "settled", None) is not None:
        print("settled:", result.settled)
    elif isinstance(payload, dict) and payload.get("settled") is not None:
        print("settled:", payload.get("settled"))
    prov = getattr(result, "provenance", None) or (payload.get("provenance") if isinstance(payload, dict) else None) or {}
    if prov:
        print("player:", prov.get("player_id"), "controller:", prov.get("controller_id"))


def _client(args, http=None) -> GatewayClient:
    token = resolve_token(args.base, existing=args.token, runtime=args.runtime, http=http)
    return GatewayClient(args.base, StaticTokenProvider(token), runtime=args.runtime, http=http)


def _send(client: GatewayClient, action: str, arg: str | None):
    last = client.send_command("OBSERVE", {})
    state = to_state(last.observation, world_status=last.world_status)
    args: dict = {}
    if action == "MOVE":
        args["direction"] = arg or "east"
    proposal = ActionProposal(action=action, target_id=arg, arguments=args)
    try:
        validated = validate_proposal(proposal, state, HarnessPolicy())
    except Exception as exc:
        print("ERROR", str(exc))
        return 1
    result = client.send_command(validated.command, validated.arguments)
    print_obs(result)
    return 0 if result.ok else 1


def main(argv: list[str] | None = None, http=None) -> int:
    p = argparse.ArgumentParser(description="NOEMA headless agent harness")
    p.add_argument("--base", default=os.environ.get("NOEMA_BASE", "https://noema.guru"))
    p.add_argument("--token", default=os.environ.get("NOEMA_TOKEN"))
    p.add_argument("--handle", default="ref-agent")
    p.add_argument("--controller-type", default="agent", choices=["agent", "human"])
    p.add_argument("--runtime", default="openclaw")
    p.add_argument("--turns", type=int, default=8, help="unattended run length (ENTER + OBSERVE count)")
    p.add_argument("--tenant", default=None, help="test.hosted-canonical.<suffix> or perihelion")
    p.add_argument("--live-tenant", action="store_true", help="allow Perihelion Reach (live tenant)")
    p.add_argument("--report", default=None, help="write local tester report JSON here")
    p.add_argument("--adapter", default="first-valid", choices=["first-valid", "scripted", "llm"])
    p.add_argument(
        "action",
        nargs="?",
        default="tour",
        help="enroll|tour|enter|look|move|inspect|wait|observe|repair|inspect-status|run",
    )
    p.add_argument("arg", nargs="?", help="direction, target, or script path")
    args = p.parse_args(argv)

    transport = http or default_http
    base = args.base.rstrip("/")
    tenant = None
    action = args.action.lower()
    if action == "run":
        try:
            tenant = resolve_tenant(args.tenant, live=args.live_tenant, env=os.environ)
        except TenantError as exc:
            print("tenant refused", exc.code, exc.message)
            return 2

    health = transport("GET", f"{base}/health")
    if health.get("status") != "ok":
        print("health failed", health)
        return 1
    print("health", health.get("service"), "stage", health.get("stage"), "via", base)
    if action == "enroll":
        try:
            token = enroll_device(base, runtime=args.runtime, http=transport)
        except Exception as exc:
            print("enroll failed", exc)
            return 1
        print("export NOEMA_BASE=" + base)
        print("export NOEMA_TOKEN=" + token)
        return 0

    isolated = None
    if tenant is not None and tenant.isolated:
        from noema.harness.operator_env import AttachError, resolve_isolated_attach

        try:
            isolated = resolve_isolated_attach(base, env=os.environ, http=transport, handle=args.handle)
        except AttachError as exc:
            print("attach refused", exc.code, exc.message)
            return 2
        args.token = isolated.player_token
        print("attach", isolated.source)

    try:
        client = _client(args, http=transport)
    except Exception as exc:
        print("enroll failed", exc)
        return 1
    if tenant is not None:
        client.command_path = tenant.command_path
        client.world_id = tenant.world_id
        if isolated:
            client.admin_token = isolated.admin_jwt

    if action == "inspect-status":
        result = client.send_command("OBSERVE", {})
        state = to_state(result.observation, world_status=result.world_status)
        loc = state.location or {}
        print("Player", state.self_id)
        print("Controller", "<harness>")
        print("World", state.world)
        print("Cycle", state.cycle)
        print("Location", loc.get("name"), loc.get("room_id"))
        print("Resources", state.resources)
        print("Available actions", state.available_actions)
        print("Last consequence", state.last_consequence)
        print("Session status", state.world_status or "ACTIVE")
        return 0 if result.ok else 1

    if action == "run":
        from noema.harness.adapters import FirstValidAffordanceAdapter, ScriptedAdapter
        from noema.harness.loop import HeadlessHarness

        if args.adapter == "scripted":
            steps: list[ActionProposal] = []
            if args.arg:
                data = json.loads(PathRead(args.arg))
                for item in data:
                    steps.append(ActionProposal(**item))
            adapter = ScriptedAdapter(steps)
        elif args.adapter == "llm":
            from noema.llm.adapter import LlmProposeAdapter
            from noema.llm.providers import OpenAICompatibleProposer, StaticProposer

            if os.environ.get("NOEMA_LLM_KEY"):
                propose = OpenAICompatibleProposer(
                    base_url=os.environ.get("NOEMA_LLM_BASE", "https://api.openai.com/v1"),
                    model=os.environ.get("NOEMA_LLM_MODEL", "gpt-4.1-mini"),
                )
            else:
                propose = StaticProposer()
            adapter = LlmProposeAdapter(propose)
        else:
            adapter = FirstValidAffordanceAdapter()
        harness = HeadlessHarness(client, adapter, HarnessPolicy(cooldown_seconds=0))
        run = harness.run_unattended(max_turns=max(2, args.turns))
        for turn in run.turns:
            label = turn.proposal.action if turn.proposal else (turn.reason or "stop")
            print("---", label)
            if turn.result:
                print_obs(turn.result)
        if run.report:
            report = dict(run.report)
            report["tenant_id"] = tenant.world_id if tenant else None
            report["live"] = bool(tenant.live) if tenant else False
            dest = args.report or os.environ.get("NOEMA_TESTER_REPORT")
            if dest:
                write_report(dest, report)
            print("report", report.get("classification"), report.get("mode_at_stop"))
        if not run.orientation_ok:
            print("ORIENTATION", run.orientation_reason)
            return 1
        return 0 if all(t.ok or t.stopped for t in run.turns) else 1

    if action == "tour":
        for step, payload in [
            ("ENTER_WORLD", {}),
            ("LOOK", {}),
            ("MOVE", {"direction": "east"}),
            ("LOOK", {}),
            ("MOVE", {"direction": "west"}),
            ("INSPECT", {"entity_id": "entity.relay-7"}),
        ]:
            print("---", step)
            res = client.send_command(step, payload)
            print_obs(res)
            if not res.ok and step != "INSPECT":
                return 1
        print("TOUR_OK")
        return 0

    mapping = {
        "enter": "ENTER_WORLD",
        "look": "LOOK",
        "wait": "WAIT",
        "observe": "OBSERVE",
        "move": "MOVE",
        "inspect": "INSPECT",
        "repair": "REPAIR",
        "harvest": "HARVEST",
    }
    if action not in mapping:
        print("unknown action", action)
        return 1
    if action in {"enter", "look", "wait", "observe"}:
        res = client.send_command(mapping[action], {})
        print_obs(res)
        return 0 if res.ok else 1
    return _send(client, mapping[action], args.arg)


def PathRead(path: str) -> str:
    from pathlib import Path

    return Path(path).read_text(encoding="utf-8")
