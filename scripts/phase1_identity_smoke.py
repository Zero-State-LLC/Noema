#!/usr/bin/env python3
"""Local Phase 1 smoke: human bind → device enroll → AUTH → ENTER → LOOK."""

from __future__ import annotations

from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.protocol.agent_v1 import AgentProtocolV1


def main() -> int:
    db = Path("data/smoke-phase1.sqlite3")
    db.parent.mkdir(exist_ok=True)
    if db.exists():
        db.unlink()
    rt = NoemaRuntime(db_path=db)
    seed = Path("fixtures/v01-seed/world-seed.json")
    if not seed.is_file():
        print("FAIL: missing fixtures/v01-seed/world-seed.json")
        return 1
    rt.start_world(seed)

    human = rt.identity.bind_human_dev("smoke-alice", handle="smoke-alice")
    dev = rt.identity.start_device_enrollment(metadata={"framework": "curl-agent"})
    rt.identity.approve_device(
        user_code=dev["user_code"],
        approver_access_token=human["access_token"],
    )
    tok = rt.identity.poll_device_token(dev["device_code"])

    proto = AgentProtocolV1(rt)
    auth = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "AUTH",
            "request_id": "r1",
            "body": {"access_token": tok["access_token"]},
        }
    )
    if auth.get("type") != "AUTH_ACK":
        print("FAIL AUTH", auth)
        return 1
    sid = auth["body"]["session_id"]
    agent_id = tok["agent_id"]

    enter = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "ENTER_WORLD",
            "request_id": "r2",
            "agent_id": agent_id,
            "idempotency_key": "idem-enter-smoke",
            "body": {
                "action": {
                    "agent_id": agent_id,
                    "action_id": "act.smoke.enter",
                    "client_action_sequence": 1,
                    "idempotency_key": "idem-enter-smoke",
                    "parameters": {},
                }
            },
        },
        session_id=sid,
    )
    if enter.get("type") != "ENTER_WORLD_ACK":
        print("FAIL ENTER", enter)
        return 1

    look = proto.handle(
        {
            "protocol": "agent-protocol/v1",
            "type": "ACT",
            "request_id": "r3",
            "agent_id": agent_id,
            "idempotency_key": "idem-look-smoke",
            "body": {
                "action": {
                    "schema_version": "agent-action/1.0",
                    "action_id": "act.smoke.look",
                    "agent_id": agent_id,
                    "world_id": "world-01",
                    "cycle": 0,
                    "client_action_sequence": 2,
                    "verb": "LOOK",
                    "parameters": {},
                    "idempotency_key": "idem-look-smoke",
                }
            },
        },
        session_id=sid,
    )
    if look.get("type") != "ACT_RESULT":
        print("FAIL LOOK", look)
        return 1

    print("PHASE1_IDENTITY_SMOKE_OK")
    print("player", human["player_id"], "agent_controller", tok["controller_id"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
