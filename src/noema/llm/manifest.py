"""Agent manifest 1.1 — declared metadata only."""

from __future__ import annotations

import re
from typing import Any

from noema.llm.proposal import PRIVATE_KEYS, contains_private

REQUIRED = ("schema_version", "display_name", "runtime", "protocol_version", "controller_kind")
HASH_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


class ManifestError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def validate_manifest(doc: dict[str, Any]) -> dict[str, Any]:
    if contains_private(doc):
        raise ManifestError("PRIVATE_COGNITION", "manifest must not contain private cognition")
    blob = str(doc).lower()
    for banned in ("api_key", "bearer ", "sk-", "secret"):
        if banned in blob and banned != "secret":
            raise ManifestError("SECRET", "manifest must not contain secrets")
        if banned == "secret" and "secret" in blob:
            raise ManifestError("SECRET", "manifest must not contain secrets")
    for key in REQUIRED:
        if key not in doc:
            raise ManifestError("INVALID_MANIFEST", f"{key} required")
    if doc.get("schema_version") not in {"agent-manifest/1.1", "agent-manifest/1.0"}:
        raise ManifestError("INVALID_MANIFEST", "unsupported schema_version")
    if doc.get("protocol_version") != "agent-protocol/v1":
        raise ManifestError("INVALID_MANIFEST", "protocol_version must be agent-protocol/v1")
    if doc.get("schema_version") == "agent-manifest/1.1" and doc.get("controller_kind") != "llm":
        raise ManifestError("INVALID_MANIFEST", "controller_kind must be llm")
    name = str(doc.get("display_name") or "")
    if not (2 <= len(name) <= 64):
        raise ManifestError("INVALID_MANIFEST", "display_name length")
    runtime = doc.get("runtime")
    if not isinstance(runtime, dict) or not runtime.get("name") or not runtime.get("version"):
        raise ManifestError("INVALID_MANIFEST", "runtime.name and runtime.version required")
    digest = doc.get("prompt_version_hash")
    if digest is not None and not HASH_RE.match(str(digest)):
        raise ManifestError("INVALID_MANIFEST", "prompt_version_hash must be sha256:<64 hex>")
    flags = doc.get("research_consent_flags") or []
    if any(f not in {"capture_actions", "capture_messages"} for f in flags):
        raise ManifestError("INVALID_MANIFEST", "unknown research_consent_flags")
    extra = set(doc) - {
        "schema_version",
        "display_name",
        "runtime",
        "protocol_version",
        "controller_kind",
        "model",
        "prompt_version_hash",
        "research_consent_flags",
        "declared_constraints",
        "agent_id",
        "owner_id",
        "memory_system",
        "tool_manifest",
        "subagent_architecture",
        "compute_budget",
        "metadata_policy",
    }
    # 1.0 sample fields are allowed; secrets already rejected
    _ = extra
    return doc
