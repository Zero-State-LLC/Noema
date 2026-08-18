"""Provider-agnostic propose function. Keys never go to NOEMA."""

from __future__ import annotations

import json
import os
from typing import Any, Callable, Protocol

ProposeFn = Callable[[dict[str, Any]], str]


class SupportsPropose(Protocol):
    def __call__(self, context: dict[str, Any]) -> str: ...


INSTRUCTION = (
    "You are a NOEMA Controller. Reply with JSON only: "
    '{"action":"LOOK|MOVE|INSPECT|WAIT|OBSERVE","target_id":null,"arguments":{}}. '
    "Do not include prompts, plans, reasons, or secrets."
)


class StaticProposer:
    def __call__(self, context: dict[str, Any]) -> str:
        canonical = context.get("canonical") or context
        available = [str(a).upper() for a in (canonical.get("available_actions") or [])]
        action = "LOOK" if "LOOK" in available or not available else "WAIT"
        return json.dumps({"action": action, "arguments": {}})


class OpenAICompatibleProposer:
    def __init__(self, *, base_url: str, model: str, api_key: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key if api_key is not None else os.environ.get("NOEMA_LLM_KEY", "")

    def __call__(self, context: dict[str, Any]) -> str:
        from openai import OpenAI

        client = OpenAI(base_url=self.base_url, api_key=self.api_key or "local")
        resp = client.chat.completions.create(
            model=self.model,
            temperature=0,
            messages=[
                {"role": "system", "content": INSTRUCTION},
                {"role": "user", "content": json.dumps(context, default=str)[:8000]},
            ],
        )
        return resp.choices[0].message.content or ""


def make_llm(
    provider: str = "none",
    *,
    base_url: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
) -> ProposeFn:
    """Stable factory. provider: none | ollama | groq | openrouter | openai-compatible | custom."""
    name = (provider or "none").lower()
    if name in {"none", "static", "mock"}:
        return StaticProposer()
    defaults = {
        "ollama": ("http://127.0.0.1:11434/v1", "qwen2.5:3b"),
        "groq": ("https://api.groq.com/openai/v1", "llama-3.1-8b-instant"),
        "openrouter": ("https://openrouter.ai/api/v1", "openai/gpt-4.1-mini"),
        "openai-compatible": (os.environ.get("NOEMA_LLM_BASE") or "https://api.openai.com/v1", os.environ.get("NOEMA_LLM_MODEL") or "gpt-4.1-mini"),
        "custom": (os.environ.get("NOEMA_LLM_BASE") or "http://127.0.0.1:11434/v1", os.environ.get("NOEMA_LLM_MODEL") or "qwen2.5:3b"),
        "xai": ("https://api.x.ai/v1", os.environ.get("NOEMA_LLM_MODEL") or "grok-4"),
    }
    url, mid = defaults.get(name, defaults["openai-compatible"])
    return OpenAICompatibleProposer(base_url=base_url or url, model=model or mid, api_key=api_key)
