#!/usr/bin/env python3
"""Reference agent client for Noema Stage 0 (Cloudflare Worker).

Works against workers.dev or noema.guru. Humans and agents are both Players;
this client uses a controller access token only.

Usage:
  python scripts/noema_agent_client.py
  python scripts/noema_agent_client.py --base https://noema.guru --handle hermes
  python scripts/noema_agent_client.py --token "$ACCESS_TOKEN" look
  python scripts/noema_agent_client.py --token "$ACCESS_TOKEN" move east
  python scripts/noema_agent_client.py --token "$ACCESS_TOKEN" inspect entity.relay-7

Env:
  NOEMA_BASE   default https://noema.guru
  NOEMA_TOKEN  optional pre-minted controller token
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import urllib.error
import urllib.request
import uuid


def _ipv4_opener() -> urllib.request.OpenerDirector:
    """Prefer IPv4 — some environments fail IPv6 (errno 101) to Cloudflare."""
    orig = socket.getaddrinfo

    def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):  # noqa: A002
        return orig(host, port, socket.AF_INET, type, proto, flags)

    socket.getaddrinfo = getaddrinfo_ipv4  # type: ignore[assignment]
    return urllib.request.build_opener()


_OPENER = _ipv4_opener()


def http_json(method: str, url: str, body: dict | None = None, token: str | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "content-type": "application/json",
        "accept": "application/json",
        # Avoid Cloudflare 1010 "browser signature banned" on some zones
        "user-agent": "NoemaAgentClient/0.1 (+https://noema.guru)",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with _OPENER.open(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"error": {"message": raw or str(e)}}
        payload["_http_status"] = e.code
        return payload


def mint_token(base: str, handle: str, controller_type: str) -> dict:
    return http_json(
        "POST",
        f"{base.rstrip('/')}/v1/auth/dev-token",
        {"handle": handle, "controller_type": controller_type},
    )


def command(base: str, token: str, cmd: str, arguments: dict | None = None, runtime: str = "python-ref") -> dict:
    envelope = {
        "request_id": f"req.{uuid.uuid4().hex[:10]}",
        "idempotency_key": f"idem.{uuid.uuid4().hex[:12]}",
        "command": cmd,
        "arguments": arguments or {},
        "client": {"type": "agent", "runtime": runtime},
    }
    return http_json("POST", f"{base.rstrip('/')}/v1/command", envelope, token=token)


def print_obs(result: dict) -> None:
    if not result.get("ok"):
        err = result.get("error") or result
        print("ERROR", json.dumps(err, indent=2))
        return
    obs = result.get("observation") or {}
    loc = obs.get("location") or {}
    print(f"[{obs.get('cycle')}/{obs.get('sequence')}] {loc.get('name')} ({loc.get('room_id')})")
    print(loc.get("description") or "")
    exits = loc.get("exits") or []
    if exits:
        print("Exits:", ", ".join(f"{e.get('direction')}→{e.get('to_room_id')}" for e in exits))
    ents = loc.get("entities") or []
    if ents:
        print("Here:", ", ".join(f"{e.get('label')}[{e.get('entity_id')}]" for e in ents))
    if result.get("settled") is not None:
        print("settled:", result.get("settled"))
    prov = result.get("provenance") or {}
    if prov:
        print("player:", prov.get("player_id"), "controller:", prov.get("controller_id"))


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Noema Stage 0 reference agent client")
    p.add_argument("--base", default=os.environ.get("NOEMA_BASE", "https://noema.guru"))
    p.add_argument("--token", default=os.environ.get("NOEMA_TOKEN"))
    p.add_argument("--handle", default="ref-agent")
    p.add_argument("--controller-type", default="agent", choices=["agent", "human"])
    p.add_argument("--runtime", default="python-ref")
    p.add_argument("action", nargs="?", default="tour", help="tour|enter|look|move|inspect|wait|observe")
    p.add_argument("arg", nargs="?", help="direction for move, or entity_id for inspect")
    args = p.parse_args(argv)

    base = args.base.rstrip("/")
    health = http_json("GET", f"{base}/health")
    if health.get("status") != "ok":
        print("health failed", health)
        return 1
    print("health", health.get("service"), "stage", health.get("stage"), "via", base)

    token = args.token
    if not token:
        minted = mint_token(base, args.handle, args.controller_type)
        token = minted.get("access_token")
        if not token:
            print("mint failed", minted)
            return 1
        print("minted", minted.get("player_id"), minted.get("controller_id"))

    action = args.action.lower()
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
            res = command(base, token, step, payload, runtime=args.runtime)
            print_obs(res)
            if not res.get("ok") and step != "INSPECT":
                # inspect may fail if not in room with entity
                if step == "INSPECT":
                    continue
                return 1
        print("TOUR_OK")
        return 0

    mapping = {
        "enter": ("ENTER_WORLD", {}),
        "look": ("LOOK", {}),
        "wait": ("WAIT", {}),
        "observe": ("OBSERVE", {}),
        "move": ("MOVE", {"direction": (args.arg or "east")}),
        "inspect": ("INSPECT", {"entity_id": args.arg or "entity.relay-7"}),
    }
    if action not in mapping:
        print("unknown action", action)
        return 1
    cmd, cargs = mapping[action]
    res = command(base, token, cmd, cargs, runtime=args.runtime)
    print_obs(res)
    return 0 if res.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
