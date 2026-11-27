"""Tokenize personal data and secrets before anything reaches model context.

Emails, phone numbers and registered names become stable placeholders like
[EMAIL_1], [PHONE_1], [NAME_1]. The mapping lives in codemode/.work/vault.json
(gitignored, 0600) so a later script can map placeholders back when it sends
data to another tool. Secrets (tokens, JWTs, keys, passwords, cookies) become
[SECRET] and are never stored, so they can never be mapped back.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from . import WORK

SECRET = "[SECRET]"
PLACEHOLDER = re.compile(r"\[(EMAIL|PHONE|NAME)_(\d+)\]")

_EXAMPLE_DOMAINS = re.compile(
    r"(?:^|\.)(?:example\.(?:com|org|net)|example|test|invalid|localhost)$", re.I
)
_EMAIL = re.compile(r"(?<![\w.%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}(?![\w-])")
_PHONE = re.compile(
    r"(?<![\w.+-])(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]\d{4}(?![\w-])"
    r"|(?<![\w+])\+\d{10,14}(?!\d)"
)
_SECRET_WHOLE = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,}"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),
]
_SECRET_KEEP_PREFIX = [
    # (pattern, group to keep)
    (re.compile(r"(?i)\b((?:bearer|token)\s+)[A-Za-z0-9._~+/=-]{20,}"), 1),
    (re.compile(r"(?i)\b((?:set-)?cookie\s*:\s*)[^\n]+"), 1),
    (re.compile(r"(?i)\b((?:postgres(?:ql)?|mysql|redis|amqps?)://[^\s:@/]+:)[^\s@/]+(?=@)"), 1),
]
_SECRET_KV_QUOTED = re.compile(
    r"(?i)(?<![\w/.\\-])([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE_KEY|DSN|COOKIE)[A-Z0-9_]*[\"']?\s*[=:]\s*)"
    r"([\"'])((?:\\.|(?!\2)[^\\\r\n])+)\2"
)
_SECRET_KV = re.compile(
    r"(?i)(?<![\w/.\\-])([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE_KEY|DSN|COOKIE)[A-Z0-9_]*[\"']?\s*[=:]\s*)"
    r"([^\s\"',}\]]{6,})"
)
_NOT_PEOPLE = {"claude", "github", "github actions", "copilot", "dependabot", "renovate", "web-flow"}
_SECRET_ENV_NAME = re.compile(r"TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE|DSN|COOKIE|CREDENTIAL", re.I)


class Vault:
    """Placeholder <-> value map, persisted between runs in the workspace."""

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or WORK / "vault.json"
        self.by_value: dict[str, dict[str, int]] = {"EMAIL": {}, "PHONE": {}, "NAME": {}}
        self.next: dict[str, int] = {"EMAIL": 1, "PHONE": 1, "NAME": 1}
        if self.path.is_file():
            with open(self.path, encoding="utf-8") as fh:
                data = json.load(fh)
            for kind in self.by_value:
                self.by_value[kind].update(data.get("by_value", {}).get(kind, {}))
                self.next[kind] = int(data.get("next", {}).get(kind, 1))
        self._by_token = {
            f"[{kind}_{n}]": value for kind, values in self.by_value.items() for value, n in values.items()
        }

    def token(self, kind: str, value: str) -> str:
        known = self.by_value[kind].get(value)
        if known is None:
            known = self.next[kind]
            self.next[kind] = known + 1
            self.by_value[kind][value] = known
            self._by_token[f"[{kind}_{known}]"] = value
        return f"[{kind}_{known}]"

    def value(self, placeholder: str) -> str | None:
        return self._by_token.get(placeholder)

    def names(self) -> list[str]:
        return sorted(self.by_value["NAME"], key=len, reverse=True)

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump({"by_value": self.by_value, "next": self.next}, fh, indent=1, sort_keys=True)
        os.replace(tmp, self.path)


def secret_values(environ: dict[str, str] | None = None) -> list[str]:
    """Values of secret-looking env vars, so exact copies can be scrubbed from output."""
    env = os.environ if environ is None else environ
    return [v for k, v in env.items() if _SECRET_ENV_NAME.search(k) and len(v) >= 8]


def _scrub_secrets(text: str, secrets: list[str]) -> str:
    for value in sorted(set(secrets), key=len, reverse=True):
        text = text.replace(value, SECRET)
    for pattern in _SECRET_WHOLE:
        text = pattern.sub(SECRET, text)
    for pattern, keep in _SECRET_KEEP_PREFIX:
        text = pattern.sub(lambda m, k=keep: m.group(k) + SECRET, text)

    def _kv_quoted(m: re.Match[str]) -> str:
        value = m.group(3)
        if value.isdigit() or value.startswith(("$", "<", "*", "[")):
            return m.group(0)
        return m.group(1) + m.group(2) + SECRET + m.group(2)

    def _kv(m: re.Match[str]) -> str:
        value = m.group(2)
        if value.isdigit() or value.startswith(("$", "<", "*", "[")):
            return m.group(0)
        return m.group(1) + SECRET

    text = _SECRET_KV_QUOTED.sub(_kv_quoted, text)
    return _SECRET_KV.sub(_kv, text)


def tokenize(text: str, vault: Vault | None = None, secrets: list[str] | None = None) -> str:
    """Replace secrets with [SECRET] and personal data with stable placeholders."""
    own_vault = vault is None
    vault = vault or Vault()
    text = _scrub_secrets(text, secrets if secrets is not None else secret_values())

    def _email(m: re.Match[str]) -> str:
        address = m.group(0)
        local, domain = address.rsplit("@", 1)
        if _EXAMPLE_DOMAINS.search(domain) or local == "git":  # git@github.com is a remote, not a person
            return address
        return vault.token("EMAIL", address)

    text = _EMAIL.sub(_email, text)
    text = _PHONE.sub(lambda m: vault.token("PHONE", m.group(0)), text)
    for name in vault.names():
        text = re.sub(rf"(?<!\w){re.escape(name)}(?!\w)", vault.token("NAME", name), text)
    if own_vault:
        vault.save()
    return text


def register_names(names: list[str], vault: Vault | None = None) -> None:
    """Mark people's names seen in structured fields so output tokenizes them.

    Names have no reliable pattern, so wrappers that know a field holds a
    person's name (commit author, profile name) register it here. Data stays
    raw inside the script; only printed output is tokenized.
    """
    own_vault = vault is None
    vault = vault or Vault()
    for name in names:
        name = (name or "").strip()
        if name.endswith("[bot]") or name.lower() in _NOT_PEOPLE:
            continue
        # Short single tokens ("Dan", "ci") would mangle unrelated output.
        if (len(name) >= 4 and " " in name) or len(name) >= 6:
            vault.token("NAME", name)
    if own_vault:
        vault.save()


def detokenize(obj: Any, vault: Vault | None = None) -> Any:
    """Map placeholders back to real values. Call only when sending to another tool."""
    vault = vault or Vault()
    if isinstance(obj, str):
        return PLACEHOLDER.sub(lambda m: vault.value(m.group(0)) or m.group(0), obj)
    if isinstance(obj, list):
        return [detokenize(v, vault) for v in obj]
    if isinstance(obj, tuple):
        return tuple(detokenize(v, vault) for v in obj)
    if isinstance(obj, dict):
        return {k: detokenize(v, vault) for k, v in obj.items()}
    return obj


def has_placeholders(text: str) -> bool:
    return bool(PLACEHOLDER.search(text))
