"""Propose functions. Provider keys never go to NOEMA."""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

from noema.harness.seal import sealed_prompt_text


INSTRUCTION = sealed_prompt_text()


class StaticProposer:
    """No LLM. LOOK if advertised else WAIT. Used for --provider none."""

    def __call__(self, context: dict[str, Any]) -> dict[str, Any]:
        canonical = context.get("canonical") or {}
        available = [str(a).upper() for a in (canonical.get("available_actions") or [])]
        if "LOOK" in available or not available:
            return {"action": "LOOK", "arguments": {}}
        return {"action": "WAIT", "arguments": {}}


class OpenAICompatibleProposer:
    def __init__(
        self,
        *,
        base_url: str,
        model: str,
        api_key: str | None = None,
        http_post=None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._key = api_key if api_key is not None else os.environ.get("NOEMA_LLM_KEY", "")
        self._http_post = http_post

    def __call__(self, context: dict[str, Any]) -> str:
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": INSTRUCTION},
                {"role": "user", "content": json.dumps(context, default=str)[:8000]},
            ],
            "temperature": 0,
        }
        if self._http_post:
            payload = self._http_post(f"{self.base_url}/chat/completions", body, self._key)
        else:
            payload = self._post(body)
        choices = payload.get("choices") or []
        msg = (choices[0].get("message") or {}) if choices else {}
        return str(msg.get("content") or "")

    def _post(self, body: dict[str, Any]) -> dict[str, Any]:
        data = json.dumps(body).encode()
        headers = {"content-type": "application/json"}
        if self._key:
            headers["authorization"] = f"Bearer {self._key}"
        req = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=data,
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode() or "{}")
