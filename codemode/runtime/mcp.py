"""Minimal MCP client (JSON-RPC over streamable HTTP or stdio), standard library only.

Generated wrappers in ./servers call `call_tool`. It applies runtime/policy.py,
maps privacy placeholders back to real values on the way out, and returns
structured data so scripts can filter it before printing.
"""

from __future__ import annotations

import atexit
import itertools
import json
import subprocess
import urllib.error
import urllib.request
from typing import Any

from . import config, secret
from .privacy import detokenize

PROTOCOL_VERSION = "2025-06-18"
CLIENT_INFO = {"name": "noema-codemode", "version": "0.1.0"}


class McpError(RuntimeError):
    pass


class McpToolError(McpError):
    """The tool ran and reported isError."""


class _Session:
    def __init__(self, name: str, spec: dict[str, Any]) -> None:
        self.name = name
        self.spec = spec
        self._ids = itertools.count(1)
        self._session_id: str | None = None
        self._proc: subprocess.Popen[str] | None = None
        self._initialize()

    # transport -----------------------------------------------------------
    def _send(self, method: str, params: dict[str, Any] | None = None, *, notify: bool = False) -> Any:
        msg: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            msg["params"] = params
        if not notify:
            msg["id"] = next(self._ids)
        transport = self.spec.get("transport")
        if transport == "http":
            reply = self._http(msg)
        elif transport == "stdio":
            reply = self._stdio(msg)
        else:
            raise McpError(f"{self.name}: unsupported transport {transport!r}")
        if notify:
            return None
        if reply is None:
            raise McpError(f"{self.name}: no reply to {method}")
        if "error" in reply:
            err = reply["error"]
            raise McpError(f"{self.name}: {method} failed: {err.get('code')} {err.get('message')}")
        return reply.get("result")

    def _http(self, msg: dict[str, Any]) -> dict[str, Any] | None:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "MCP-Protocol-Version": PROTOCOL_VERSION,
        }
        if self._session_id:
            headers["Mcp-Session-Id"] = self._session_id
        token_env = self.spec.get("token_env")
        token = secret(token_env) if token_env else None
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(self.spec["url"], data=json.dumps(msg).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=float(self.spec.get("timeout", 120))) as resp:
                self._session_id = resp.headers.get("Mcp-Session-Id") or self._session_id
                body = resp.read().decode("utf-8", "replace")
                ctype = resp.headers.get("Content-Type", "")
        except urllib.error.HTTPError as exc:
            hint = f" (set {token_env} or complete OAuth in your MCP client)" if exc.code in (401, 403) else ""
            raise McpError(f"{self.name}: HTTP {exc.code}{hint}") from None
        except urllib.error.URLError as exc:
            raise McpError(f"{self.name}: cannot reach {self.spec['url']}: {exc.reason}") from None
        if "id" not in msg or not body.strip():
            return None
        if "text/event-stream" in ctype:
            for line in body.splitlines():
                if line.startswith("data:"):
                    data = json.loads(line[5:].strip() or "null")
                    if isinstance(data, dict) and data.get("id") == msg["id"]:
                        return data
            return None
        return json.loads(body)

    def _stdio(self, msg: dict[str, Any]) -> dict[str, Any] | None:
        if self._proc is None:
            cmd = [self.spec["command"], *self.spec.get("args", [])]
            self._proc = subprocess.Popen(
                cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1
            )
        assert self._proc.stdin and self._proc.stdout
        self._proc.stdin.write(json.dumps(msg) + "\n")
        self._proc.stdin.flush()
        if "id" not in msg:
            return None
        for line in self._proc.stdout:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            if data.get("id") == msg["id"] and ("result" in data or "error" in data):
                return data
        raise McpError(f"{self.name}: server closed stdout")

    # protocol ------------------------------------------------------------
    def _initialize(self) -> None:
        self._send(
            "initialize",
            {"protocolVersion": PROTOCOL_VERSION, "capabilities": {}, "clientInfo": CLIENT_INFO},
        )
        self._send("notifications/initialized", notify=True)

    def list_tools(self) -> list[dict[str, Any]]:
        tools: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            result = self._send("tools/list", {"cursor": cursor} if cursor else {})
            tools.extend(result.get("tools", []))
            cursor = result.get("nextCursor")
            if not cursor:
                return tools

    def call(self, tool: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return self._send("tools/call", {"name": tool, "arguments": arguments})

    def close(self) -> None:
        if self._proc is not None:
            if self._proc.stdin:
                self._proc.stdin.close()
            try:
                self._proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._proc.kill()
            self._proc = None


_SESSIONS: dict[str, _Session] = {}


def session(server: str, spec: dict[str, Any] | None = None) -> _Session:
    if server not in _SESSIONS:
        spec = spec or config()["servers"].get(server)
        if not spec:
            raise McpError(f"unknown MCP server {server!r}; see codemode/config.json")
        _SESSIONS[server] = _Session(server, spec)
    return _SESSIONS[server]


@atexit.register
def _close_all() -> None:
    for s in _SESSIONS.values():
        s.close()


def unwrap(result: dict[str, Any]) -> Any:
    """structuredContent if present, else text content parsed as JSON when possible."""
    if result.get("structuredContent") is not None:
        return result["structuredContent"]
    texts = [c.get("text", "") for c in result.get("content", []) if c.get("type") == "text"]
    text = "\n".join(texts)
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return text


def call_tool(server: str, tool: str, arguments: dict[str, Any]) -> Any:
    """Call an MCP tool: policy check, map placeholders back, call, unwrap."""
    from .policy import check

    arguments = {k: v for k, v in arguments.items() if v is not None}
    check(server, tool, arguments)
    result = session(server).call(tool, detokenize(arguments))
    if result.get("isError"):
        raise McpToolError(f"{server}.{tool}: {unwrap(result)}")
    return unwrap(result)
