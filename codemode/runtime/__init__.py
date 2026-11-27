"""Shared plumbing for code mode: paths, config and the in-process secret store."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

KIT = Path(__file__).resolve().parents[1]
ROOT = KIT.parent
# Scratch, vault and temp files. Tests point CODEMODE_WORK elsewhere.
WORK = Path(os.environ.get("CODEMODE_WORK") or KIT / ".work").resolve()

_SECRETS: dict[str, str] = {}


@lru_cache(maxsize=1)
def config() -> dict[str, Any]:
    with open(KIT / "config.json", encoding="utf-8") as fh:
        return json.load(fh)


def adopt_secrets(names: list[str]) -> None:
    """Move secret env vars out of os.environ so `print(os.environ)` cannot leak them.

    Tool transports read them back with `secret()`; scripts should never need to.
    """
    for name in names:
        value = os.environ.pop(name, None)
        if value:
            _SECRETS[name] = value


def secret(name: str) -> str | None:
    return _SECRETS.get(name) or os.environ.get(name)


def tool_env(*names: str) -> dict[str, str]:
    """Environment for a tool subprocess: current env plus the named secrets."""
    env = dict(os.environ)
    for name in names:
        value = secret(name)
        if value:
            env[name] = value
    return env
