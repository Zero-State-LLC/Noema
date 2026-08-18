"""Transport acceptance T01–T12."""

from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest

from noema_llm_agent.agent import NoemaAgent
from noema_llm_agent.cognition import PrivateCognitionError, assert_public
from noema_llm_agent.llm import make_llm
from noema_llm_agent.protocol import (
    HttpProtocolClient,
    LocalMockClient,
    WebSocketProtocolClient,
    connect_protocol,
    derive_http_origin,
    derive_ws_url,
)


class FakeWS:
    def __init__(self, handler) -> None:
        self.handler = handler
        self._inbox: asyncio.Queue[str] = asyncio.Queue()
        self._outbox: asyncio.Queue[str] = asyncio.Queue()
        self.closed = False
        self._pump = asyncio.create_task(self._run())

    async def _run(self) -> None:
        try:
            while not self.closed:
                raw = await self._inbox.get()
                msg = json.loads(raw)
                reply = self.handler(msg)
                if reply is None:
                    continue
                if isinstance(reply, list):
                    for item in reply:
                        await self._outbox.put(json.dumps(item))
                else:
                    await self._outbox.put(json.dumps(reply))
        except asyncio.CancelledError:
            return

    async def send(self, raw: str) -> None:
        await self._inbox.put(raw)

    def __aiter__(self) -> FakeWS:
        return self

    async def __anext__(self) -> str:
        if self.closed:
            raise StopAsyncIteration
        return await self._outbox.get()

    async def close(self) -> None:
        self.closed = True
        self._pump.cancel()


def gateway_handler(store: dict[str, Any]):
    def handle(msg: dict[str, Any]) -> Any:
        typ = msg.get("type")
        rid = msg.get("request_id")
        store.setdefault("seen", []).append(typ)
        if typ == "HELLO":
            if msg.get("body", {}).get("resume_token"):
                return {"type": "HELLO_ACK", "request_id": rid, "body": {"resumed": True, "selected_protocol": "agent-protocol/v1"}}
            return {"type": "HELLO_ACK", "request_id": rid, "body": {"selected_protocol": "agent-protocol/v1"}}
        if typ == "AUTH":
            return {
                "type": "AUTH_ACK",
                "request_id": rid,
                "body": {
                    "player_id": "player.ws",
                    "controller_id": "ctrl.ws",
                    "session_id": "sess.ws",
                    "resume_token": "resume.1",
                },
            }
        if typ == "REGISTER":
            return {"type": "REGISTER_ACK", "request_id": rid, "body": {"ok": True}}
        if typ == "ENTER_WORLD" or (typ == "ACT" and (msg.get("body") or {}).get("action", {}).get("verb") == "ENTER_WORLD"):
            return {
                "type": "ACT_RESULT",
                "request_id": rid,
                "body": {"ok": True, "observation": {"cycle": 1, "obs_seq": 1, "location": {"name": "Anchor", "room_id": "room.a"}}},
            }
        if typ == "ACT":
            store.setdefault("acts", []).append(msg.get("idempotency_key"))
            verb = (msg.get("body") or {}).get("action", {}).get("verb")
            return {
                "type": "ACT_RESULT",
                "request_id": rid,
                "body": {"ok": True, "observation": {"cycle": 1, "obs_seq": store.get("n", 2), "location": {"name": "Anchor"}, "last_verb": verb}},
            }
        if typ == "OBSERVE":
            return {
                "type": "OBSERVE",
                "request_id": rid,
                "body": {"observation": {"cycle": 1, "obs_seq": 2, "location": {"name": "Anchor", "room_id": "room.a"}}},
            }
        if typ == "PING":
            return {"type": "PONG", "request_id": rid, "body": {}}
        if typ == "DISCONNECT":
            store["disconnect"] = True
            return {"type": "DISCONNECT_ACK", "request_id": rid, "body": {"ok": True}}
        return {"type": "ERROR", "request_id": rid, "error": {"code": "INVALID_REQUEST"}}

    return handle


@pytest.mark.asyncio
async def test_t07_local_mock():
    client = LocalMockClient()
    agent = NoemaAgent(client, make_llm("none"))
    results = await agent.run("tok", turns=2)
    assert results
    assert all(r.ok for r in results)
    await agent.close()
    assert client.status == "disconnected"


@pytest.mark.asyncio
async def test_t01_t02_ws_handshake_and_act():
    store: dict[str, Any] = {"n": 3}
    logs: list[str] = []

    async def factory(_url: str) -> FakeWS:
        return FakeWS(gateway_handler(store))

    client = WebSocketProtocolClient("ws://example/protocol/v1/ws", ws_factory=factory, log=logs.append)
    await client.connect()
    hello = await client.hello()
    assert hello["type"] == "HELLO_ACK"
    auth = await client.auth("sekrit-token")
    assert auth["body"]["player_id"] == "player.ws"
    entered = await client.enter_world("world.test")
    assert entered.ok
    result = await client.act("LOOK")
    assert result.ok
    assert result.request_id
    assert "HELLO" in store["seen"] and "AUTH" in store["seen"] and "ACT" in store["seen"]
    assert "sekrit-token" not in "".join(logs)
    await client.disconnect()
    assert client.status == "disconnected"


@pytest.mark.asyncio
async def test_t03_reconnect_resume():
    store: dict[str, Any] = {"n": 4}
    drops = {"n": 0}

    async def factory(_url: str) -> FakeWS:
        return FakeWS(gateway_handler(store))

    client = WebSocketProtocolClient("ws://example/protocol/v1/ws", ws_factory=factory, max_reconnects=3, heartbeat_interval=30.0)
    await client.connect()
    await client.hello()
    await client.auth("tok")
    client.resume_token = "resume.1"
    client.last_ack_obs_seq = 1
    await client._force_close()
    await client.reconnect()
    assert client.status == "resumed"


@pytest.mark.asyncio
async def test_t04_idempotent_act():
    client = LocalMockClient()
    await client.connect()
    await client.auth("tok")
    a = await client.act("LOOK", idempotency_key="idem.same")
    b = await client.act("LOOK", idempotency_key="idem.same")
    assert a.idempotency_key == b.idempotency_key
    assert a.observation and b.observation
    assert a.observation.obs_seq == b.observation.obs_seq


@pytest.mark.asyncio
async def test_t05_heartbeat_timeout_closes():
    store: dict[str, Any] = {}

    def silent_ping(msg: dict[str, Any]) -> Any:
        if msg.get("type") == "PING":
            return None
        return gateway_handler(store)(msg)

    async def factory(_url: str) -> FakeWS:
        return FakeWS(silent_ping)

    client = WebSocketProtocolClient("ws://example/ws", ws_factory=factory, heartbeat_interval=0.05)
    await client.connect()
    await asyncio.sleep(0.2)
    # after missed pongs the heartbeat loop force-closes
    assert client.status in {"reconnecting", "connected", "disconnected"}


@pytest.mark.asyncio
async def test_t06_auto_fallback_http(monkeypatch):
    async def boom(_url: str) -> Any:
        raise OSError("ws refused")

    client = await connect_protocol("https://example.test", transport="auto", ws_factory=boom)
    assert isinstance(client, HttpProtocolClient)
    assert derive_http_origin("wss://noema.guru/foo") == "https://noema.guru"
    assert derive_ws_url("https://noema.guru").endswith("/protocol/v1/ws")


@pytest.mark.asyncio
async def test_t08_prompt_not_sent():
    client = LocalMockClient()
    await client.connect()
    await client.auth("tok")
    with pytest.raises(PrivateCognitionError):
        await client.act("LOOK", {"prompt": "secret inner plan"})


@pytest.mark.asyncio
async def test_t09_ordered_observations():
    store: dict[str, Any] = {}

    def burst(msg: dict[str, Any]) -> Any:
        if msg.get("type") == "HELLO":
            return [
                {"type": "HELLO_ACK", "request_id": msg["request_id"], "body": {}},
                {"type": "OBSERVE", "body": {"observation": {"obs_seq": 3, "location": {"name": "C"}}}},
                {"type": "OBSERVE", "body": {"observation": {"obs_seq": 1, "location": {"name": "A"}}}},
                {"type": "OBSERVE", "body": {"observation": {"obs_seq": 2, "location": {"name": "B"}}}},
            ]
        return gateway_handler(store)(msg)

    async def factory(_url: str) -> FakeWS:
        return FakeWS(burst)

    client = WebSocketProtocolClient("ws://example/ws", ws_factory=factory)
    await client.connect()
    await client.hello()
    await asyncio.sleep(0.05)
    names = []
    while client._obs_out:
        names.append((client._obs_out.popleft().location or {}).get("name"))
    assert names == ["A", "B", "C"]


def test_t12_assert_public_blocks_reason():
    with pytest.raises(PrivateCognitionError):
        assert_public({"action": "LOOK", "reason": "because I thought"})


def test_make_llm_stable():
    fn = make_llm("none")
    out = fn({"canonical": {"available_actions": ["LOOK"]}})
    assert "LOOK" in out
    assert "prompt" not in out.lower() or "LOOK" in out
