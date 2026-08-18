"""Published sealed prompt. Official client sends the hash, never operator goals."""

from __future__ import annotations

import hashlib
from pathlib import Path

PROMPT_PATH = Path(__file__).with_name("sealed-prompt-s0.txt")
FORBIDDEN_FLAG_NAMES = ("goal", "prompt", "system", "brief")
SEAL_HEADER = "X-Noema-Seal"


def sealed_prompt_text() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def sealed_prompt_hash() -> str:
    return "sha256:" + hashlib.sha256(PROMPT_PATH.read_bytes()).hexdigest()


def refused_play_flag(namespace: object) -> str | None:
    for name in FORBIDDEN_FLAG_NAMES:
        if getattr(namespace, name, None):
            return name
    return None
