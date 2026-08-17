"""Local tester report. No tokens, no device_code, no operator secrets."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Callable

CLASSIFICATIONS = frozenset(
    {"command_rejected", "settlement", "incident", "auth", "contradiction", "ok", "unclassified"}
)

_VERB_LINE = re.compile(
    r"^\s*(MOVE|LOOK|WAIT|INSPECT|HARVEST|TRADE|REPAIR|ENTER_WORLD|OBSERVE|POST\s|export\s+TOKEN=)",
    re.IGNORECASE,
)


def sanitize_model_text(text: str) -> str:
    kept: list[str] = []
    for line in str(text or "").splitlines():
        if _VERB_LINE.match(line):
            continue
        if "TOKEN=" in line or "device_code" in line.lower() or "ADMIN_OPERATOR" in line:
            continue
        kept.append(line)
    return "\n".join(kept).strip()


def classify_with_model(
    context: dict[str, Any],
    call_model: Callable[[dict[str, Any]], str] | None,
) -> tuple[str, str]:
    if call_model is None:
        return "unclassified", ""
    try:
        raw = call_model(context)
    except Exception:
        return "unclassified", ""
    text = str(raw or "")
    kind = "unclassified"
    labeled = re.search(
        r"\b(command_rejected|settlement|incident|auth|contradiction|unclassified|ok)\b",
        text,
        re.IGNORECASE,
    )
    if labeled:
        kind = labeled.group(1).lower()
    return kind, sanitize_model_text(text)


def write_report(path: Path, payload: dict[str, Any]) -> Path:
    allowed = {
        "tenant_id",
        "live",
        "mode_at_stop",
        "last_command",
        "error_code",
        "contradiction",
        "cycle",
        "sequence",
        "room_id",
        "probes",
        "classification",
        "summary",
    }
    body = {k: payload.get(k) for k in allowed}
    path = Path(path)
    path.write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8")
    return path
