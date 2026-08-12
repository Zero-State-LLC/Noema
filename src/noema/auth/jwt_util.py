"""Minimal JWT HS256 verify (stdlib) for Supabase access tokens."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any


class JwtError(ValueError):
    """Invalid or untrusted JWT."""


def _b64url_decode(segment: str) -> bytes:
    pad = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + pad)


def verify_hs256(token: str, secret: str, *, audience: str | None = None) -> dict[str, Any]:
    """Verify a compact HS256 JWT and return claims.

    Supabase Auth access tokens are HS256-signed with the project JWT secret
    (legacy) or may use asymmetric keys in newer projects — this helper covers
    the common HS256 free-tier path. Asymmetric JWKS can be added later.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise JwtError("malformed token")
    header_b64, payload_b64, sig_b64 = parts
    try:
        header = json.loads(_b64url_decode(header_b64))
        payload = json.loads(_b64url_decode(payload_b64))
        signature = _b64url_decode(sig_b64)
    except Exception as exc:  # noqa: BLE001
        raise JwtError("malformed token encoding") from exc

    alg = header.get("alg")
    if alg != "HS256":
        raise JwtError(f"unsupported alg {alg}")

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(expected, signature):
        raise JwtError("bad signature")

    now = int(time.time())
    exp = payload.get("exp")
    if exp is not None and int(exp) < now:
        raise JwtError("token expired")
    nbf = payload.get("nbf")
    if nbf is not None and int(nbf) > now + 5:
        raise JwtError("token not yet valid")
    if audience is not None:
        aud = payload.get("aud")
        if isinstance(aud, list):
            if audience not in aud:
                raise JwtError("audience mismatch")
        elif aud != audience:
            raise JwtError("audience mismatch")
    return payload


def mint_hs256(claims: dict[str, Any], secret: str, *, headers: dict[str, Any] | None = None) -> str:
    """Mint an HS256 JWT (tests and local controller tokens)."""
    header = {"alg": "HS256", "typ": "JWT"}
    if headers:
        header.update(headers)
    header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(claims, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
    return f"{header_b64}.{payload_b64}.{sig_b64}"
