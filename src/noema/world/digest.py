"""Canonical digest helpers for ledger integrity and acceptance views."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def sha256_digest(value: Any) -> str:
    raw = canonical_json(value).encode("utf-8")
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def event_body_digest(event: dict[str, Any]) -> str:
    """Digest the world-event envelope excluding the digest field itself."""
    body = {k: v for k, v in event.items() if k != "digest"}
    return sha256_digest(body)
