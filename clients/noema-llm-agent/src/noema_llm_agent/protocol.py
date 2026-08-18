"""Agent Protocol v1 transports: WebSocket primary, HTTP fallback, LocalMock."""

from __future__ import annotations

import asyncio
import json
import random
import time
import uuid
from abc import ABC, abstractmethod
from collections import deque
from typing import Any, Awaitable, Callable
from urllib.parse import urlparse, urlunparse

import httpx
from rich.console import Console

from noema_llm_agent.cognition import assert_public
from noema_llm_agent.errors import FATAL_CODES, ProtocolError, RESUME_CODES
from noema_llm_agent.schemas import ActResult, Observation

console = Console(stderr=True)

Envelope = dict[str, Any]
WsFactory = Callable[[str], Awaitable[Any]]


def _rid() -> str:
    return f"req.{uuid.uuid4().hex[:12]}"


def _redact(text: str, token: str | None) -> str:
    if token and token in text:
        return text.replace(token, "<redacted>")
    return text


def derive_ws_url(endpoint: str) -> str:
    parsed = urlparse(endpoint)
    scheme = "wss" if parsed.scheme in {"https", "wss"} else "ws"
    path = parsed.path or ""
    if path.endswith("/protocol/v1/ws"):
        ws_path = path
    elif path.endswith("/protocol/v1"):
        ws_path = path + "/ws"
    elif path in {"", "/"}:
        ws_path = "/protocol/v1/ws"
    else:
        ws_path = path.rstrip("/") + "/protocol/v1/ws"
    return urlunparse((scheme, parsed.netloc, ws_path, "", "", ""))


def derive_http_origin(endpoint: str) -> str:
    parsed = urlparse(endpoint)
    scheme = parsed.scheme
    if scheme == "wss":
        scheme = "https"
    elif scheme == "ws":
        scheme = "http"
    elif scheme not in {"http", "https"}:
        scheme = "https"
    return urlunparse((scheme, parsed.netloc, "", "", "", "")).rstrip("/")


class ProtocolClient(ABC):
    transport_name: str = "base"

    def __init__(self) -> None:
        self.agent_id: str | None = None
        self.controller_id: str | None = None
        self.session_id: str | None = None
        self.world_id: str | None = None
        self.status: str = "idle"
        self.client_action_sequence: int = 0
        self.last_ack_obs_seq: int = 0
        self.resume_token: str | None = None
        self.resume_enabled: bool = True
        self.session_epoch: str = uuid.uuid4().hex[:8]

    def store_resume_token(self, token: Any) -> None:
        if self.resume_enabled and token:
            self.resume_token = str(token)
        elif not self.resume_enabled:
            self.resume_token = None

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def hello(self) -> Envelope: ...

    @abstractmethod
    async def auth(self, access_token: str) -> Envelope: ...

    @abstractmethod
    async def register(self, manifest: dict[str, Any] | None = None) -> Envelope: ...

    @abstractmethod
    async def enter_world(self, world_id: str | None = None) -> ActResult: ...

    @abstractmethod
    async def observe(self) -> Observation: ...

    @abstractmethod
    async def act(
        self,
        action: str,
        arguments: dict[str, Any] | None = None,
        *,
        target_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> ActResult: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    async def next_observation(self) -> Observation:
        return await self.observe()

    def next_mutating_meta(self, idempotency_key: str | None = None) -> tuple[int, str]:
        self.client_action_sequence += 1
        seq = self.client_action_sequence
        key = idempotency_key or f"idem.{self.session_epoch}.{seq:06d}"
        return seq, key

    def envelope(self, typ: str, body: dict[str, Any], *, mutating: bool = False, idempotency_key: str | None = None) -> Envelope:
        assert_public(body, allow_auth_token=typ == "AUTH")
        msg: Envelope = {
            "protocol": "agent-protocol/v1",
            "type": typ,
            "request_id": _rid(),
            "schema_version": "agent-action/1.0",
            "body": body,
        }
        if self.agent_id:
            msg["agent_id"] = self.agent_id
        if self.world_id:
            msg["world_id"] = self.world_id
        if mutating or idempotency_key:
            seq, key = self.next_mutating_meta(idempotency_key)
            msg["idempotency_key"] = key
            action = body.get("action")
            if isinstance(action, dict):
                action["client_action_sequence"] = seq
                action["idempotency_key"] = key
        assert_public(msg, allow_auth_token=typ == "AUTH")
        return msg


class LocalMockClient(ProtocolClient):
    transport_name = "mock"

    def __init__(self) -> None:
        super().__init__()
        self.seen_idem: dict[str, ActResult] = {}
        self.in_world = False
        self._obs_seq = 0
        self.connected = False

    async def connect(self) -> None:
        self.connected = True
        self.status = "connected"

    async def hello(self) -> Envelope:
        return {
            "protocol": "agent-protocol/v1",
            "type": "HELLO_ACK",
            "body": {"selected_protocol": "agent-protocol/v1", "auth_methods": ["controller-token"]},
        }

    async def auth(self, access_token: str) -> Envelope:
        if not access_token:
            raise ProtocolError("NOT_AUTHORIZED", "access_token required")
        self.agent_id = "player.mock"
        self.controller_id = "ctrl.mock"
        self.session_id = "sess.mock"
        self.store_resume_token("resume.mock")
        return {
            "type": "AUTH_ACK",
            "body": {
                "player_id": self.agent_id,
                "controller_id": self.controller_id,
                "session_id": self.session_id,
                "resume_token": self.resume_token,
            },
        }

    async def register(self, manifest: dict[str, Any] | None = None) -> Envelope:
        if manifest:
            assert_public(manifest)
        return {"type": "REGISTER_ACK", "body": {"ok": True}}

    def _observation(self) -> Observation:
        self._obs_seq += 1
        return Observation(
            cycle=1,
            sequence=self._obs_seq,
            obs_seq=self._obs_seq,
            world_name="mock",
            location={"room_id": "room.anchor", "name": "Anchor", "entities": [], "exits": []},
            available_actions=["LOOK", "WAIT", "OBSERVE"],
            in_world=self.in_world,
            world_status="ACTIVE",
        )

    async def enter_world(self, world_id: str | None = None) -> ActResult:
        self.world_id = world_id or "world.mock"
        self.in_world = True
        obs = self._observation()
        return ActResult(ok=True, request_id=_rid(), observation=obs)

    async def observe(self) -> Observation:
        return self._observation()

    async def act(
        self,
        action: str,
        arguments: dict[str, Any] | None = None,
        *,
        target_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> ActResult:
        body = {"action": {"verb": action.upper(), "parameters": arguments or {}, "target": target_id}}
        env = self.envelope("ACT", body, mutating=True, idempotency_key=idempotency_key)
        key = str(env["idempotency_key"])
        if key in self.seen_idem:
            return self.seen_idem[key]
        obs = self._observation()
        result = ActResult(ok=True, request_id=str(env["request_id"]), observation=obs, idempotency_key=key)
        self.seen_idem[key] = result
        return result

    async def disconnect(self) -> None:
        self.connected = False
        self.status = "disconnected"


class HttpProtocolClient(ProtocolClient):
    transport_name = "http"

    def __init__(self, origin: str, *, token: str | None = None, timeout: float = 30.0) -> None:
        super().__init__()
        self.origin = origin.rstrip("/")
        self.token = token
        self._client = httpx.AsyncClient(timeout=timeout, headers={"user-agent": "noema-llm-agent/1.1"})
        self._rate_pause_until = 0.0

    async def connect(self) -> None:
        self.status = "connected"

    async def _post(self, path: str, payload: dict[str, Any], *, bearer: bool = False) -> Envelope:
        assert_public(payload)
        await self._wait_rate()
        headers: dict[str, str] = {"content-type": "application/json"}
        if bearer and self.token:
            headers["authorization"] = f"Bearer {self.token}"
        resp = await self._client.post(f"{self.origin}{path}", json=payload, headers=headers)
        if resp.status_code == 429:
            retry = float(resp.headers.get("retry-after") or 1)
            self._rate_pause_until = time.monotonic() + retry
            raise ProtocolError("RATE_LIMITED", "rate limited", retryable=True, retry_after=retry)
        data = resp.json() if resp.content else {}
        if resp.status_code >= 400:
            err = data.get("error") if isinstance(data, dict) else {}
            code = str((err or {}).get("code") or "HTTP_ERROR")
            raise ProtocolError(code, str((err or {}).get("message") or resp.text), retryable=resp.status_code >= 500)
        return data if isinstance(data, dict) else {}

    async def _wait_rate(self) -> None:
        delay = self._rate_pause_until - time.monotonic()
        if delay > 0:
            await asyncio.sleep(delay)

    async def hello(self) -> Envelope:
        return await self._post(
            "/protocol/v1",
            {
                "protocol": "agent-protocol/v1",
                "type": "HELLO",
                "request_id": _rid(),
                "body": {"supported_protocols": ["agent-protocol/v1"]},
            },
        )

    async def auth(self, access_token: str) -> Envelope:
        self.token = access_token
        ack = await self._post(
            "/protocol/v1",
            {
                "protocol": "agent-protocol/v1",
                "type": "AUTH",
                "request_id": _rid(),
                "body": {"access_token": access_token},
            },
        )
        body = ack.get("body") or {}
        self.agent_id = str(body.get("player_id") or ack.get("agent_id") or "") or None
        self.controller_id = str(body.get("controller_id") or "") or None
        self.session_id = str(body.get("session_id") or "") or None
        self.store_resume_token(body.get("resume_token"))
        return ack

    async def register(self, manifest: dict[str, Any] | None = None) -> Envelope:
        if manifest:
            assert_public(manifest)
        try:
            return await self._post(
                "/protocol/v1",
                self.envelope("REGISTER", {"manifest": manifest or {}}),
            )
        except ProtocolError as exc:
            if exc.code in {"INVALID_REQUEST", "NOT_FOUND"}:
                return {"type": "REGISTER_SKIP", "body": {"ok": True, "reason": exc.code}}
            raise

    async def enter_world(self, world_id: str | None = None) -> ActResult:
        if world_id:
            self.world_id = world_id
        return await self.act("ENTER_WORLD", {})

    async def observe(self) -> Observation:
        result = await self.act("OBSERVE", {}, idempotency_key=f"obs.{_rid()}")
        if result.observation:
            return result.observation
        return Observation()

    async def act(
        self,
        action: str,
        arguments: dict[str, Any] | None = None,
        *,
        target_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> ActResult:
        args = dict(arguments or {})
        if target_id and "entity_id" not in args and action.upper() == "INSPECT":
            args["entity_id"] = target_id
        if target_id and action.upper() == "MOVE" and "direction" not in args:
            args["direction"] = target_id
        env = self.envelope(
            "ACT",
            {"action": {"verb": action.upper(), "parameters": args, "target": target_id}},
            mutating=action.upper() not in {"OBSERVE", "LOOK", "PING"},
            idempotency_key=idempotency_key,
        )
        payload = {
            "request_id": env["request_id"],
            "idempotency_key": env.get("idempotency_key") or f"idem.{env['request_id']}",
            "command": action.upper(),
            "arguments": args,
            "client": {"type": "agent", "runtime": "noema-llm-agent"},
        }
        if self.world_id and "/test-world/" in (self.origin or ""):
            payload["world_id"] = self.world_id
        assert_public(payload)
        data = await self._post("/v1/command", payload, bearer=True)
        obs_raw = data.get("observation") if isinstance(data.get("observation"), dict) else None
        obs = Observation.model_validate(obs_raw) if obs_raw else None
        if obs and obs.obs_seq:
            self.last_ack_obs_seq = max(self.last_ack_obs_seq, int(obs.obs_seq))
        ok = bool(data.get("ok", True)) if "ok" in data else data.get("type") != "ERROR"
        return ActResult(
            ok=ok,
            request_id=str(env["request_id"]),
            observation=obs,
            error=data.get("error") if isinstance(data.get("error"), dict) else None,
            idempotency_key=str(payload["idempotency_key"]),
            raw=data,
        )

    async def disconnect(self) -> None:
        await self._client.aclose()
        self.status = "disconnected"


class WebSocketProtocolClient(ProtocolClient):
    transport_name = "websocket"

    def __init__(
        self,
        url: str,
        *,
        token: str | None = None,
        heartbeat_interval: float = 25.0,
        max_reconnects: int = 8,
        ws_factory: WsFactory | None = None,
        log: Callable[[str], None] | None = None,
        resume: bool = True,
    ) -> None:
        super().__init__()
        self.resume_enabled = resume
        self.url = url
        self.token = token
        self.heartbeat_interval = heartbeat_interval
        self.max_reconnects = max_reconnects
        self._ws_factory = ws_factory
        self._log = log or (lambda m: console.log(_redact(m, self.token)))
        self._ws: Any = None
        self._reader: asyncio.Task[None] | None = None
        self._heart: asyncio.Task[None] | None = None
        self._pending: dict[str, asyncio.Future[Envelope]] = {}
        self._obs_buf: dict[int, Observation] = {}
        self._obs_out: deque[Observation] = deque()
        self._obs_waiters: list[asyncio.Future[Observation]] = []
        self._last_pong = time.monotonic()
        self._closed = False
        self._lock = asyncio.Lock()

    def _info(self, msg: str) -> None:
        self._log(msg)

    async def connect(self) -> None:
        await self._open_socket()
        self.status = "connected"

    async def _open_socket(self) -> None:
        if self._ws_factory:
            self._ws = await self._ws_factory(self.url)
        else:
            import websockets

            self._ws = await websockets.connect(self.url, max_size=2**20)
        self._last_pong = time.monotonic()
        self._closed = False
        self._reader = asyncio.create_task(self._read_loop())
        self._heart = asyncio.create_task(self._heartbeat_loop())

    async def _send(self, msg: Envelope) -> None:
        assert_public(msg, allow_auth_token=msg.get("type") == "AUTH")
        raw = json.dumps(msg)
        await self._ws.send(raw)

    async def _read_loop(self) -> None:
        ws = self._ws
        try:
            async for raw in ws:
                if isinstance(raw, bytes):
                    raw = raw.decode()
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if not isinstance(msg, dict):
                    continue
                await self._dispatch(msg)
        except Exception as exc:
            if not self._closed and self._ws is ws:
                self._info(f"socket dropped: {type(exc).__name__}")
                self.status = "reconnecting"
        finally:
            if self._ws is not ws:
                return
            for fut in list(self._pending.values()):
                if not fut.done():
                    fut.set_exception(ProtocolError("TRANSPORT", "socket closed", retryable=True))
            self._pending.clear()

    async def _dispatch(self, msg: Envelope) -> None:
        typ = str(msg.get("type") or "")
        rid = str(msg.get("request_id") or "")
        if typ == "PONG":
            self._last_pong = time.monotonic()
        if typ == "OBSERVE":
            body = msg.get("body") or {}
            obs_raw = body.get("observation") if isinstance(body.get("observation"), dict) else body
            if isinstance(obs_raw, dict):
                obs = Observation.model_validate(obs_raw)
                seq = int(obs.obs_seq or obs.sequence or 0)
                if seq:
                    self._obs_buf[seq] = obs
                    self._flush_obs()
                else:
                    self._deliver_obs(obs)
        if rid and rid in self._pending:
            fut = self._pending.pop(rid)
            if not fut.done():
                fut.set_result(msg)

    def _flush_obs(self) -> None:
        expect = self.last_ack_obs_seq + 1
        while expect in self._obs_buf:
            self._deliver_obs(self._obs_buf.pop(expect))
            self.last_ack_obs_seq = expect
            expect += 1
        if self._obs_buf and min(self._obs_buf) > expect + 8:
            nxt = min(self._obs_buf)
            self._info(f"observation gap skip to {nxt}")
            self.last_ack_obs_seq = nxt - 1
            self._flush_obs()
        while len(self._obs_out) > 256:
            self._obs_out.popleft()
            self._info("backpressure_drop")

    def _deliver_obs(self, obs: Observation) -> None:
        if self._obs_waiters:
            fut = self._obs_waiters.pop(0)
            if not fut.done():
                fut.set_result(obs)
            return
        self._obs_out.append(obs)

    async def _heartbeat_loop(self) -> None:
        try:
            while not self._closed:
                await asyncio.sleep(self.heartbeat_interval)
                if self._closed:
                    return
                if time.monotonic() - self._last_pong > self.heartbeat_interval * 2:
                    self._info("heartbeat timeout")
                    await self._force_close()
                    return
                try:
                    await self._send({"protocol": "agent-protocol/v1", "type": "PING", "request_id": _rid(), "body": {}})
                except Exception:
                    self._info("heartbeat send failed")
                    await self._force_close()
                    return
        except asyncio.CancelledError:
            return

    async def _force_close(self) -> None:
        self.status = "reconnecting"
        try:
            if self._ws:
                await self._ws.close()
        except Exception:
            pass

    async def _request(self, msg: Envelope, timeout: float = 30.0) -> Envelope:
        assert_public(msg, allow_auth_token=msg.get("type") == "AUTH")
        rid = str(msg["request_id"])
        loop = asyncio.get_running_loop()
        fut: asyncio.Future[Envelope] = loop.create_future()
        self._pending[rid] = fut
        await self._send(msg)
        try:
            return await asyncio.wait_for(fut, timeout=timeout)
        except TimeoutError as exc:
            self._pending.pop(rid, None)
            raise ProtocolError("TIMEOUT", "request timed out", retryable=True) from exc

    async def hello(self) -> Envelope:
        body: dict[str, Any] = {"supported_protocols": ["agent-protocol/v1"]}
        if self.resume_enabled and self.resume_token:
            body["resume_token"] = self.resume_token
            body["last_ack_obs_seq"] = self.last_ack_obs_seq
        msg = self.envelope("HELLO", body)
        ack = await self._request(msg)
        if ack.get("type") == "ERROR":
            err = ack.get("error") or {}
            raise ProtocolError(str(err.get("code") or "ERROR"), str(err.get("message") or "hello failed"))
        return ack

    async def auth(self, access_token: str) -> Envelope:
        self.token = access_token
        msg = self.envelope("AUTH", {"access_token": access_token})
        # AUTH body carries token by protocol; strip from logs only
        ack = await self._request(msg)
        if ack.get("type") == "ERROR":
            err = ack.get("error") or {}
            raise ProtocolError(str(err.get("code") or "NOT_AUTHORIZED"), str(err.get("message") or "auth failed"))
        body = ack.get("body") or {}
        self.agent_id = str(body.get("player_id") or ack.get("agent_id") or self.agent_id or "") or None
        self.controller_id = str(body.get("controller_id") or self.controller_id or "") or None
        self.session_id = str(body.get("session_id") or self.session_id or "") or None
        self.store_resume_token(body.get("resume_token") or self.resume_token)
        return ack

    async def register(self, manifest: dict[str, Any] | None = None) -> Envelope:
        if manifest:
            assert_public(manifest)
        msg = self.envelope("REGISTER", {"manifest": manifest or {}}, mutating=True)
        try:
            ack = await self._request(msg)
        except ProtocolError:
            return {"type": "REGISTER_SKIP", "body": {"ok": True}}
        if ack.get("type") == "ERROR":
            return {"type": "REGISTER_SKIP", "body": ack.get("error")}
        return ack

    async def enter_world(self, world_id: str | None = None) -> ActResult:
        if world_id:
            self.world_id = world_id
        return await self.act("ENTER_WORLD", {})

    async def observe(self) -> Observation:
        if self._obs_out:
            return self._obs_out.popleft()
        msg = self.envelope("OBSERVE", {})
        ack = await self._request(msg)
        body = ack.get("body") or {}
        raw = body.get("observation") if isinstance(body.get("observation"), dict) else body
        if isinstance(raw, dict) and (raw.get("location") or raw.get("cycle") is not None):
            obs = Observation.model_validate(raw)
            if obs.obs_seq:
                self.last_ack_obs_seq = max(self.last_ack_obs_seq, int(obs.obs_seq))
            return obs
        return await self.next_observation()

    async def next_observation(self) -> Observation:
        if self._obs_out:
            return self._obs_out.popleft()
        loop = asyncio.get_running_loop()
        fut: asyncio.Future[Observation] = loop.create_future()
        self._obs_waiters.append(fut)
        try:
            return await asyncio.wait_for(fut, timeout=30.0)
        except TimeoutError:
            if fut in self._obs_waiters:
                self._obs_waiters.remove(fut)
            return await self.observe()

    async def act(
        self,
        action: str,
        arguments: dict[str, Any] | None = None,
        *,
        target_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> ActResult:
        args = dict(arguments or {})
        body = {"action": {"verb": action.upper(), "parameters": args, "target": target_id}}
        mutating = action.upper() not in {"OBSERVE", "LOOK", "PING"}
        env = self.envelope("ACT", body, mutating=mutating, idempotency_key=idempotency_key)
        ack = await self._request(env)
        if ack.get("type") == "ERROR":
            err = ack.get("error") if isinstance(ack.get("error"), dict) else {"message": "act failed"}
            return ActResult(ok=False, request_id=str(env["request_id"]), error=err, idempotency_key=env.get("idempotency_key"), raw=ack)
        payload = ack.get("body") if isinstance(ack.get("body"), dict) else ack
        obs_raw = payload.get("observation") if isinstance(payload.get("observation"), dict) else None
        obs = Observation.model_validate(obs_raw) if obs_raw else None
        if obs and obs.obs_seq:
            self.last_ack_obs_seq = max(self.last_ack_obs_seq, int(obs.obs_seq))
        return ActResult(
            ok=bool(payload.get("ok", True)),
            request_id=str(env["request_id"]),
            observation=obs,
            error=payload.get("error") if isinstance(payload.get("error"), dict) else None,
            idempotency_key=env.get("idempotency_key"),
            raw=ack,
        )

    async def reconnect(self) -> None:
        async with self._lock:
            for attempt in range(1, self.max_reconnects + 1):
                self.status = "reconnecting"
                self._info(f"reconnecting… attempt {attempt}/{self.max_reconnects}")
                delay = min(15.0, 0.4 * (2 ** (attempt - 1))) + random.random() * 0.25
                await asyncio.sleep(delay)
                try:
                    await self._cancel_bg()
                    await self._open_socket()
                    hello = await self.hello()
                    if hello.get("type") == "RESUME_ACK" or (hello.get("body") or {}).get("resumed"):
                        self.status = "resumed"
                        self._info("resumed")
                        return
                    if self.token:
                        await self.auth(self.token)
                    self.status = "resumed"
                    self._info("resumed")
                    return
                except Exception as exc:
                    self._info(f"reconnect failed: {type(exc).__name__}")
            self.status = "failed"
            raise ProtocolError("TRANSPORT", "reconnect exhausted", retryable=False)

    async def _cancel_bg(self) -> None:
        for task in (self._reader, self._heart):
            if task:
                task.cancel()
        self._reader = None
        self._heart = None

    async def disconnect(self) -> None:
        self._closed = True
        try:
            if self._ws:
                msg = self.envelope("DISCONNECT", {})
                await self._send(msg)
        except Exception:
            pass
        await self._cancel_bg()
        try:
            if self._ws:
                await self._ws.close()
        except Exception:
            pass
        self.status = "disconnected"

    async def ensure(self) -> None:
        if self.status in {"failed", "disconnected"} or self._ws is None:
            await self.reconnect()


async def connect_protocol(
    endpoint: str,
    *,
    transport: str = "auto",
    token: str | None = None,
    heartbeat_interval: float = 25.0,
    max_reconnects: int = 8,
    ws_factory: WsFactory | None = None,
    resume: bool = True,
) -> ProtocolClient:
    mode = (transport or "auto").lower()
    if mode == "mock" or endpoint in {"mock", "local"}:
        client = LocalMockClient()
        client.resume_enabled = resume
        await client.connect()
        return client
    if mode == "http":
        http = HttpProtocolClient(derive_http_origin(endpoint), token=token)
        http.resume_enabled = resume
        await http.connect()
        return http
    if mode == "websocket":
        ws = WebSocketProtocolClient(
            derive_ws_url(endpoint),
            token=token,
            heartbeat_interval=heartbeat_interval,
            max_reconnects=max_reconnects,
            ws_factory=ws_factory,
            resume=resume,
        )
        await ws.connect()
        return ws
    # auto
    ws_url = derive_ws_url(endpoint)
    ws = WebSocketProtocolClient(
        ws_url,
        token=token,
        heartbeat_interval=heartbeat_interval,
        max_reconnects=max_reconnects,
        ws_factory=ws_factory,
        resume=resume,
    )
    try:
        await ws.connect()
        return ws
    except Exception:
        console.log("websocket unavailable; falling back to HTTP")
        http = HttpProtocolClient(derive_http_origin(endpoint), token=token)
        http.resume_enabled = resume
        await http.connect()
        return http
