"""JWT verify/mint: HS256 (shared secret) and ES256 (Supabase JWKS)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import urllib.error
import urllib.request
from typing import Any, Callable

# NIST P-256
_P = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
_N = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
_A = _P - 3
_GX = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296
_GY = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5

JWKS_TTL_S = 10 * 60
_JWKS_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}


class JwtError(ValueError):
    """Invalid or untrusted JWT."""


def reset_jwks_cache() -> None:
    _JWKS_CACHE.clear()


def supabase_jwks_url(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def supabase_issuer(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1"


def _b64url_decode(segment: str) -> bytes:
    pad = "=" * (-len(segment) % 4)
    try:
        return base64.urlsafe_b64decode(segment + pad)
    except Exception as exc:  # noqa: BLE001
        raise JwtError("malformed token encoding") from exc


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _parse_compact(token: str) -> tuple[str, str, str, dict[str, Any], dict[str, Any]]:
    parts = token.split(".")
    if len(parts) != 3:
        raise JwtError("malformed token")
    header_b64, payload_b64, sig_b64 = parts
    try:
        header = json.loads(_b64url_decode(header_b64))
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as exc:  # noqa: BLE001
        raise JwtError("malformed token encoding") from exc
    if not isinstance(header, dict) or not isinstance(payload, dict):
        raise JwtError("malformed token encoding")
    return header_b64, payload_b64, sig_b64, header, payload


def _assert_claims(payload: dict[str, Any], *, audience: str | None, issuer: str | None) -> None:
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
    if issuer is not None and payload.get("iss") != issuer:
        raise JwtError("issuer mismatch")


def verify_hs256(token: str, secret: str, *, audience: str | None = None, issuer: str | None = None) -> dict[str, Any]:
    """Verify a compact HS256 JWT and return claims.

    Legacy Supabase Auth access tokens are HS256-signed with the project JWT secret.
    Newer projects sign with ES256 — use verify_jwt / JWKS for those.
    """
    header_b64, payload_b64, sig_b64, header, payload = _parse_compact(token)
    alg = header.get("alg")
    if alg != "HS256":
        raise JwtError(f"unsupported alg {alg}")

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature = _b64url_decode(sig_b64)
    if not hmac.compare_digest(expected, signature):
        raise JwtError("bad signature")
    _assert_claims(payload, audience=audience, issuer=issuer)
    return payload


def mint_hs256(claims: dict[str, Any], secret: str, *, headers: dict[str, Any] | None = None) -> str:
    """Mint an HS256 JWT (tests and local controller tokens)."""
    header = {"alg": "HS256", "typ": "JWT"}
    if headers:
        header.update(headers)
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(sig)}"


def _inv(x: int, m: int) -> int:
    return pow(x, -1, m)


def _point_add(p1: tuple[int, int] | None, p2: tuple[int, int] | None) -> tuple[int, int] | None:
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    x1, y1 = p1
    x2, y2 = p2
    if x1 == x2:
        if (y1 + y2) % _P == 0:
            return None
        lam = (3 * x1 * x1 + _A) * _inv((2 * y1) % _P, _P) % _P
    else:
        lam = (y2 - y1) * _inv((x2 - x1) % _P, _P) % _P
    x3 = (lam * lam - x1 - x2) % _P
    y3 = (lam * (x1 - x3) - y1) % _P
    return x3, y3


def _point_mul(k: int, point: tuple[int, int]) -> tuple[int, int] | None:
    result: tuple[int, int] | None = None
    acc: tuple[int, int] | None = point
    while k:
        if k & 1:
            result = _point_add(result, acc)
        acc = _point_add(acc, acc)
        k >>= 1
    return result


def _int_from_b64url(segment: str) -> int:
    return int.from_bytes(_b64url_decode(segment), "big")


def mint_es256(claims: dict[str, Any], d: int, kid: str) -> str:
    """Mint an ES256 JWT (tests). ``d`` is the P-256 private scalar."""
    import secrets

    header = {"alg": "ES256", "typ": "JWT", "kid": kid}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode())
    data = f"{header_b64}.{payload_b64}".encode("ascii")
    z = int.from_bytes(hashlib.sha256(data).digest(), "big")
    while True:
        k = secrets.randbelow(_N - 1) + 1
        r_point = _point_mul(k, (_GX, _GY))
        if r_point is None:
            continue
        r = r_point[0] % _N
        if r == 0:
            continue
        s = (_inv(k, _N) * (z + r * d)) % _N
        if s == 0:
            continue
        if s > _N // 2:
            s = _N - s
        sig = r.to_bytes(32, "big") + s.to_bytes(32, "big")
        return f"{header_b64}.{payload_b64}.{_b64url_encode(sig)}"


def generate_es256_pair() -> tuple[int, dict[str, Any], str]:
    """Return (private_scalar, public_jwk, kid) for tests."""
    import secrets
    import uuid

    d = secrets.randbelow(_N - 1) + 1
    pub = _point_mul(d, (_GX, _GY))
    if pub is None:
        raise RuntimeError("degenerate P-256 key")
    kid = f"test-{uuid.uuid4().hex[:8]}"
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "alg": "ES256",
        "kid": kid,
        "x": _b64url_encode(pub[0].to_bytes(32, "big")),
        "y": _b64url_encode(pub[1].to_bytes(32, "big")),
    }
    return d, jwk, kid


def _verify_es256_sig(jwk: dict[str, Any], data: bytes, signature: bytes) -> bool:
    if jwk.get("kty") != "EC" or jwk.get("crv") not in (None, "P-256"):
        raise JwtError("jwks key is not ES256 P-256")
    if jwk.get("alg") not in (None, "ES256"):
        raise JwtError("jwks key is not ES256 P-256")
    if "x" not in jwk or "y" not in jwk:
        raise JwtError("jwks key is not ES256 P-256")
    if len(signature) != 64:
        return False
    r = int.from_bytes(signature[:32], "big")
    s = int.from_bytes(signature[32:], "big")
    if not (1 <= r < _N and 1 <= s < _N):
        return False
    pub = (_int_from_b64url(str(jwk["x"])), _int_from_b64url(str(jwk["y"])))
    z = int.from_bytes(hashlib.sha256(data).digest(), "big")
    w = _inv(s, _N)
    u1 = (z * w) % _N
    u2 = (r * w) % _N
    p = _point_add(_point_mul(u1, (_GX, _GY)), _point_mul(u2, pub))
    if p is None:
        return False
    return (p[0] % _N) == r


def _fetch_jwks(url: str, fetch: Callable[[str], Any] | None) -> list[dict[str, Any]]:
    if fetch is not None:
        try:
            body = fetch(url)
            if isinstance(body, (bytes, str)):
                parsed = json.loads(body)
            else:
                parsed = body
        except JwtError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise JwtError("jwks fetch failed") from exc
    else:
        try:
            req = urllib.request.Request(url, headers={"accept": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                parsed = json.loads(resp.read().decode())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            raise JwtError("jwks fetch failed") from exc
    keys = parsed.get("keys") if isinstance(parsed, dict) else None
    if not isinstance(keys, list):
        raise JwtError("jwks fetch failed")
    return keys


def _resolve_jwk(
    kid: str,
    *,
    jwks: dict[str, Any] | None,
    jwks_url: str,
    fetch: Callable[[str], Any] | None,
) -> dict[str, Any]:
    if jwks:
        for key in jwks.get("keys") or []:
            if isinstance(key, dict) and key.get("kid") == kid:
                return key
    if not jwks_url:
        raise JwtError("unknown kid")
    now = time.time()
    cached = _JWKS_CACHE.get(jwks_url)
    if cached and now - cached[0] < JWKS_TTL_S:
        for key in cached[1]:
            if key.get("kid") == kid:
                return key
    keys = _fetch_jwks(jwks_url, fetch)
    _JWKS_CACHE[jwks_url] = (now, keys)
    for key in keys:
        if isinstance(key, dict) and key.get("kid") == kid:
            return key
    raise JwtError("unknown kid")


def verify_jwt(
    token: str,
    *,
    secret: str = "",
    jwks_url: str = "",
    audience: str | None = None,
    issuer: str | None = None,
    jwks: dict[str, Any] | None = None,
    fetch: Callable[[str], Any] | None = None,
) -> dict[str, Any]:
    """Verify HS256 (legacy secret) or ES256 (JWKS) access tokens."""
    header_b64, payload_b64, sig_b64, header, payload = _parse_compact(token)
    alg = header.get("alg")
    if alg == "HS256":
        if not secret:
            raise JwtError("hs256 secret not configured")
        return verify_hs256(token, secret, audience=audience, issuer=issuer)
    if alg == "ES256":
        if not jwks and not jwks_url:
            raise JwtError("ES256 requires JWKS (SUPABASE_URL)")
        kid = header.get("kid")
        if not isinstance(kid, str) or not kid:
            raise JwtError("missing kid")
        jwk = _resolve_jwk(kid, jwks=jwks, jwks_url=jwks_url, fetch=fetch)
        data = f"{header_b64}.{payload_b64}".encode("ascii")
        if not _verify_es256_sig(jwk, data, _b64url_decode(sig_b64)):
            raise JwtError("bad signature")
        _assert_claims(payload, audience=audience, issuer=issuer)
        return payload
    raise JwtError(f"unsupported alg {alg}")
