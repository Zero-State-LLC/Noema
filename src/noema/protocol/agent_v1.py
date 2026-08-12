"""Minimal agent-protocol/v1 handler (JSON request/response)."""

from __future__ import annotations

from typing import Any

from noema.actions.errors import ActionError
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role


class AgentProtocolV1:
    PROTOCOL = "agent-protocol/v1"

    def __init__(self, runtime: NoemaRuntime):
        self.runtime = runtime

    def handle(self, message: dict[str, Any], *, session_id: str | None = None) -> dict[str, Any]:
        if message.get("protocol") != self.PROTOCOL:
            return self._error(message, "NO_COMPATIBLE_PROTOCOL", "unsupported protocol", retryable=False)
        mtype = message.get("type")
        try:
            if mtype == "HELLO":
                return self._hello(message)
            if mtype == "AUTH":
                return self._auth(message)
            if not session_id:
                return self._error(message, "NOT_AUTHORIZED", "session required after AUTH")
            if mtype == "ENTER_WORLD":
                return self._enter(message, session_id)
            if mtype == "OBSERVE":
                return self._observe(message, session_id)
            if mtype == "ACT":
                return self._act(message, session_id)
            if mtype == "PING":
                return {
                    "protocol": self.PROTOCOL,
                    "type": "PONG",
                    "request_id": message.get("request_id"),
                    "body": {},
                }
            if mtype == "DISCONNECT":
                return {
                    "protocol": self.PROTOCOL,
                    "type": "DISCONNECT_ACK",
                    "request_id": message.get("request_id"),
                    "body": {"ok": True},
                }
            return self._error(message, "INVALID_ACTION", f"unsupported type {mtype}")
        except ActionError as exc:
            return self._error(message, exc.code, exc.message, retryable=exc.retryable, details=exc.details)

    def _hello(self, message: dict[str, Any]) -> dict[str, Any]:
        body = message.get("body") or {}
        supported = body.get("supported_protocols") or [self.PROTOCOL]
        if self.PROTOCOL not in supported:
            return self._error(message, "NO_COMPATIBLE_PROTOCOL", "no compatible protocol")
        return {
            "protocol": self.PROTOCOL,
            "type": "HELLO_ACK",
            "request_id": message.get("request_id"),
            "body": {
                "selected_protocol": self.PROTOCOL,
                "agent_protocol": "agent-protocol/v1",
                "supported_verbs": sorted(self.runtime.router.SUPPORTED_VERBS) if self.runtime.router else [],
                "auth_methods": ["controller-token", "dev-token"],
                "versions": self.runtime.version().get("versions"),
            },
        }

    def _auth(self, message: dict[str, Any]) -> dict[str, Any]:
        body = message.get("body") or {}
        token = body.get("access_token") or body.get("token") or body.get("controller_token")
        if token:
            session = self.runtime.create_session_from_controller_token(str(token))
            agent_id = session.get("agent_id")
            # Client-supplied agent_id must match server binding
            claimed = body.get("agent_id") or message.get("agent_id")
            if claimed and agent_id and claimed != agent_id:
                return self._error(message, "FORBIDDEN", "agent_id does not match credential", retryable=False)
            return {
                "protocol": self.PROTOCOL,
                "type": "AUTH_ACK",
                "request_id": message.get("request_id"),
                "agent_id": agent_id,
                "body": {
                    "session_id": session["session_id"],
                    "agent_id": agent_id,
                    "player_id": session.get("player_id"),
                    "controller_id": session.get("controller_id"),
                    "scopes": session.get("scopes") or [],
                },
            }
        # Dev path: unauthenticated agent_id bind (local tests / fixtures only)
        if not self.runtime.identity.allow_dev_protocol_auth:
            return self._error(
                message,
                "NOT_AUTHORIZED",
                "controller access_token required",
                retryable=False,
            )
        agent_id = body.get("agent_id") or message.get("agent_id")
        session = self.runtime.create_session(role=Role.AGENT, agent_id=agent_id)
        return {
            "protocol": self.PROTOCOL,
            "type": "AUTH_ACK",
            "request_id": message.get("request_id"),
            "agent_id": agent_id,
            "body": {"session_id": session["session_id"], "agent_id": agent_id, "auth_method": "dev-token"},
        }

    def _enter(self, message: dict[str, Any], session_id: str) -> dict[str, Any]:
        body = message.get("body") or {}
        action_body = body.get("action") or body
        agent_id = action_body.get("agent_id") or message.get("agent_id")
        result = self.runtime.apply_player_action(
            session_id,
            {
                "verb": "ENTER_WORLD",
                "agent_id": agent_id,
                "action_id": action_body.get("action_id"),
                "client_action_sequence": action_body.get("client_action_sequence") or 1,
                "idempotency_key": message.get("idempotency_key") or action_body.get("idempotency_key"),
                "parameters": action_body.get("parameters") or {"room_id": action_body.get("room_id")},
            },
        )
        return {
            "protocol": self.PROTOCOL,
            "type": "ENTER_WORLD_ACK",
            "request_id": message.get("request_id"),
            "agent_id": agent_id,
            "world_id": message.get("world_id"),
            "body": result,
        }

    def _observe(self, message: dict[str, Any], session_id: str) -> dict[str, Any]:
        agent_id = message.get("agent_id")
        obs = self.runtime.observe(session_id, agent_id)
        return {
            "protocol": self.PROTOCOL,
            "type": "OBSERVE",
            "request_id": message.get("request_id"),
            "agent_id": agent_id,
            "body": {"observation": obs},
        }

    def _act(self, message: dict[str, Any], session_id: str) -> dict[str, Any]:
        body = message.get("body") or {}
        action = body.get("action") or body
        if "verb" not in action and "action" in action:
            action = action["action"]
        result = self.runtime.apply_player_action(session_id, action)
        return {
            "protocol": self.PROTOCOL,
            "type": "ACT_RESULT",
            "request_id": message.get("request_id"),
            "agent_id": action.get("agent_id"),
            "body": result,
        }

    def _error(
        self,
        message: dict[str, Any],
        code: str,
        msg: str,
        *,
        retryable: bool = False,
        details: dict | None = None,
    ) -> dict[str, Any]:
        return {
            "protocol": self.PROTOCOL,
            "type": "ERROR",
            "request_id": message.get("request_id"),
            "error": {
                "code": code,
                "message": msg,
                "retryable": retryable,
                "details": details or {},
                "caused_by_request_id": message.get("request_id"),
            },
        }
