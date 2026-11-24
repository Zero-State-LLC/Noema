#!/usr/bin/env python3
"""Deterministic privacy-redaction validator for hosted STUDY evidence packs.

Implements Noema-Specs docs/STUDY-PRIVACY-REDACTION-SPEC.md (#362):
- Exit code 0: zero forbidden patterns detected.
- Exit code 1: one or more blocking privacy findings detected.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable

ALLOWED_EMAIL_DOMAINS = {"example.com", "users.noreply.github.com"}

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b")
TOKEN_RE = re.compile(
    r"(?:token_hash=|connect_code=|Authorization:\s*Bearer\s+\S+|noema\.play\.token|"
    r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b)"
)
PRIVATE_INBOX_RE = re.compile(r'"(?:private_inbox|inbox_messages)"\s*:\s*(?!null\b|"\[REDACTED\]"|\[\])')
UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
)

TEXT_SUFFIXES = {".json", ".jsonl", ".ndjson", ".txt", ".md", ".csv", ".log", ".yaml", ".yml"}


def scan_text(text: str, rel_path: str) -> list[dict[str, object]]:
    findings: list[dict[str, object]] = []
    is_public_surface = any(tok in rel_path.lower() for tok in ("watch", "spectator", "public"))

    for lineno, line in enumerate(text.splitlines(), start=1):
        for match in EMAIL_RE.finditer(line):
            domain = match.group(1).lower()
            if domain not in ALLOWED_EMAIL_DOMAINS:
                findings.append({"rule": "raw_email", "path": rel_path, "line": lineno})
                break

        if TOKEN_RE.search(line):
            findings.append({"rule": "session_or_callback_token", "path": rel_path, "line": lineno})

        if PRIVATE_INBOX_RE.search(line):
            findings.append({"rule": "private_inbox_content", "path": rel_path, "line": lineno})

        if is_public_surface and UUID_RE.search(line):
            findings.append({"rule": "public_surface_internal_uuid", "path": rel_path, "line": lineno})

    return findings


def iter_pack_files(root: Path) -> Iterable[Path]:
    if root.is_file():
        yield root
        return
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def validate_pack(root: Path) -> list[dict[str, object]]:
    findings: list[dict[str, object]] = []
    base = root.parent if root.is_file() else root
    for path in iter_pack_files(root):
        rel = path.relative_to(base).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")
        findings.extend(scan_text(text, rel))
    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate hosted STUDY evidence pack privacy redaction.")
    parser.add_argument("target", type=Path, help="Evidence pack directory or file to scan.")
    parser.add_argument("--json", action="store_true", help="Emit JSON report.")
    args = parser.parse_args(argv)

    if not args.target.exists():
        print(f"error: target does not exist: {args.target}", file=sys.stderr)
        return 2

    findings = validate_pack(args.target)
    if args.json:
        print(json.dumps({"ok": len(findings) == 0, "findings": findings}, indent=2))
    else:
        if findings:
            for item in findings:
                print(f"FAIL [{item['rule']}] {item['path']}:{item['line']}")
        else:
            print("OK: zero privacy redaction findings")
    return 0 if not findings else 1


if __name__ == "__main__":
    raise SystemExit(main())
