"""CLI: noema-play — simple text PLAY loop against local runtime APIs or in-process."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Text PLAY for NOEMA Chamber")
    parser.add_argument("--seed", type=Path, default=Path("fixtures/v01-seed/world-seed.json"))
    parser.add_argument("--agent-id", default="agent.player.1")
    parser.add_argument(
        "--db",
        default=":memory:",
        help="SQLite path/:memory: (default) or PostgreSQL DSN",
    )
    args = parser.parse_args(argv)

    rt = NoemaRuntime(db_path=args.db)
    start = rt.start_world(args.seed)
    sess = rt.create_session(role=Role.PLAYER, agent_id=args.agent_id)
    print(f"NOEMA // {start['world_id']}  cycle={start['cycle']}")
    print("Type commands: enter | look | move <exit_id> | inspect <entity_id> | message <agent> <text> | wait | quit")
    seq = 1
    # auto enter
    rt.apply_player_action(
        sess["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": args.agent_id,
            "client_action_sequence": seq,
            "action_id": f"act.enter.{seq}",
            "parameters": {},
        },
    )
    seq += 1
    obs = rt.observe(sess["session_id"], args.agent_id)
    _print_obs(obs)

    while True:
        try:
            line = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not line:
            continue
        if line in {"quit", "exit", "q"}:
            break
        action = _parse(line, args.agent_id, seq)
        if action is None:
            print("unknown command")
            continue
        try:
            result = rt.apply_player_action(sess["session_id"], action)
            seq += 1
            _print_obs(result.get("observation") or rt.observe(sess["session_id"], args.agent_id))
        except Exception as exc:
            print(f"error: {exc}")
    return 0


def _parse(line: str, agent_id: str, seq: int) -> dict | None:
    parts = line.split()
    cmd = parts[0].lower()
    base = {
        "agent_id": agent_id,
        "client_action_sequence": seq,
        "action_id": f"act.{seq}",
        "idempotency_key": f"idem.{seq}",
    }
    if cmd == "enter":
        return {**base, "verb": "ENTER_WORLD", "parameters": {}}
    if cmd == "look":
        return {**base, "verb": "LOOK", "parameters": {"attention_spent": 1}}
    if cmd == "move" and len(parts) >= 2:
        return {**base, "verb": "MOVE", "parameters": {"exit_id": parts[1], "cost_paid": {"energy": 1}}}
    if cmd == "inspect" and len(parts) >= 2:
        return {**base, "verb": "INSPECT", "parameters": {"entity_id": parts[1], "attention_spent": 1}}
    if cmd == "message" and len(parts) >= 3:
        return {
            **base,
            "verb": "MESSAGE",
            "parameters": {"recipient_id": parts[1], "text": " ".join(parts[2:]), "cost_paid": {"attention": 1}},
        }
    if cmd == "wait":
        return {**base, "verb": "WAIT", "parameters": {"cycles": 1}}
    if cmd == "repair" and len(parts) >= 2:
        return {**base, "verb": "REPAIR", "parameters": {"entity_id": parts[1]}}
    if cmd == "harvest" and len(parts) >= 2:
        return {**base, "verb": "HARVEST", "parameters": {"entity_id": parts[1], "resource": parts[2] if len(parts) > 2 else "energy", "amount": 1}}
    return None


def _print_obs(obs: dict) -> None:
    loc = obs.get("LOCATION") or {}
    print(f"LOCATION {loc.get('room_id')} — {loc.get('name')}")
    if loc.get("description"):
        print(loc["description"])
    print("EXITS", ", ".join(e["exit_id"] for e in loc.get("exits") or []) or "(none)")
    print("ENTITIES", ", ".join(e.get("entity_id", "") for e in loc.get("entities") or []) or "(none)")
    status = obs.get("STATUS") or {}
    print("STATUS", json.dumps(status.get("budgets") or {}, sort_keys=True))
    msgs = obs.get("MESSAGES") or []
    if msgs:
        print("MESSAGES", len(msgs))


if __name__ == "__main__":
    raise SystemExit(main())
