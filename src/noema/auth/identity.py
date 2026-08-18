"""Account / Player / Controller / Credential / device enrollment.

Humans and agents are both Players. Supabase Auth proves human identity;
controller tokens prove external agent Controllers. See Noema-Specs
AUTH-AND-IDENTITY.md.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
import uuid
from typing import Any

from noema.actions.errors import NOT_AUTHORIZED, ActionError
from noema.auth.jwt_util import (
    JwtError,
    mint_hs256,
    supabase_issuer,
    supabase_jwks_url,
    verify_hs256,
    verify_jwt,
)

DEFAULT_AGENT_SCOPES = (
    "noema.player.read",
    "noema.world.observe",
    "noema.action.submit",
)
ADMIN_SCOPES = frozenset(
    {
        "noema.controller.manage",
        "noema.player.manage",
        "noema.world.admin",
        "noema.simulation.admin",
    }
)
DEFAULT_DEV_SECRET = "dev-token-secret-change-me"
_LOCAL_ENVS = frozenset({"local", "test", "dev"})


def resolve_token_secret(token_secret: str | None = None, *, env_name: str | None = None) -> str:
    """Refuse the built-in development secret outside explicit local/test/dev."""
    env = (env_name if env_name is not None else os.environ.get("NOEMA_ENV") or "local").lower()
    secret = token_secret or os.environ.get("TOKEN_SIGNING_SECRET") or os.environ.get("AUTH_SECRET")
    if not secret:
        if env in _LOCAL_ENVS:
            return DEFAULT_DEV_SECRET
        raise RuntimeError("TOKEN_SIGNING_SECRET is required when NOEMA_ENV is not local/test/dev")
    if secret == DEFAULT_DEV_SECRET and env not in _LOCAL_ENVS:
        raise RuntimeError("refusing built-in development signing secret outside local/test/dev")
    return secret


def _new_id(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:12]}"


def _fingerprint(secret: str, pepper: str) -> str:
    return hashlib.sha256(f"{pepper}:{secret}".encode()).hexdigest()


def _now() -> int:
    return int(time.time())


class IdentityService:
    """Identity plane over WorldStore connection."""

    def __init__(
        self,
        store: Any,
        *,
        token_secret: str | None = None,
        supabase_jwt_secret: str | None = None,
        supabase_url: str | None = None,
        allow_dev_human: bool | None = None,
        jwks_fetch: Any | None = None,
    ):
        self.store = store
        self.token_secret = resolve_token_secret(token_secret)
        self.supabase_jwt_secret = supabase_jwt_secret or os.environ.get("SUPABASE_JWT_SECRET") or ""
        self.supabase_url = supabase_url or os.environ.get("SUPABASE_URL") or ""
        self._jwks_fetch = jwks_fetch
        self.pepper = os.environ.get("AGENT_API_KEY_PEPPER") or self.token_secret
        env = (os.environ.get("NOEMA_ENV") or "local").lower()
        self.env = env
        if allow_dev_human is None:
            allow_dev_human = env in ("local", "test", "dev") and not self.supabase_jwt_secret
        self.allow_dev_human = bool(allow_dev_human)
        # Bare protocol AUTH without controller token — local/tests only
        self.allow_dev_protocol_auth = env in ("local", "test", "dev") and not (
            os.environ.get("NOEMA_REQUIRE_CONTROLLER_TOKEN", "").lower() in ("1", "true", "yes")
        )
        # pending device codes in memory + durable store for multi-process later
        self._pending_devices: dict[str, dict[str, Any]] = {}

    # --- human (Supabase) -------------------------------------------------

    def bind_human_from_supabase_token(self, access_token: str) -> dict[str, Any]:
        jwks_url = supabase_jwks_url(self.supabase_url) if self.supabase_url else ""
        if not self.supabase_jwt_secret and not jwks_url:
            raise ActionError(NOT_AUTHORIZED, "Supabase Auth is not configured (SUPABASE_JWT_SECRET or SUPABASE_URL)")
        issuer = supabase_issuer(self.supabase_url) if self.supabase_url else None
        try:
            claims = verify_jwt(
                access_token,
                secret=self.supabase_jwt_secret,
                jwks_url=jwks_url,
                audience="authenticated",
                issuer=issuer,
                fetch=self._jwks_fetch,
            )
        except JwtError as exc:
            # Supabase sometimes uses aud=authenticated; also try without aud
            try:
                claims = verify_jwt(
                    access_token,
                    secret=self.supabase_jwt_secret,
                    jwks_url=jwks_url,
                    issuer=issuer,
                    fetch=self._jwks_fetch,
                )
            except JwtError:
                raise ActionError(NOT_AUTHORIZED, f"invalid Supabase token: {exc}") from exc
        sub = claims.get("sub")
        if not sub:
            raise ActionError(NOT_AUTHORIZED, "Supabase token missing sub")
        email = claims.get("email")
        return self._ensure_human_account(str(sub), handle_hint=email)

    def bind_human_dev(self, subject: str, *, handle: str | None = None) -> dict[str, Any]:
        """Local/test human bind without Supabase."""
        if not self.allow_dev_human:
            raise ActionError(NOT_AUTHORIZED, "dev human bind disabled; configure Supabase Auth")
        return self._ensure_human_account(f"dev:{subject}", handle_hint=handle or subject)

    def _ensure_human_account(self, external_subject: str, *, handle_hint: str | None) -> dict[str, Any]:
        account = self.store.identity_get_account_by_subject(external_subject)
        if not account:
            account_id = _new_id("acct")
            account = {
                "account_id": account_id,
                "status": "active",
                "external_auth_subject": external_subject,
                "created_at": _now(),
            }
            self.store.identity_upsert_account(account)
            handle = self._slug_handle(handle_hint or account_id)
            player = {
                "player_id": _new_id("player"),
                "account_id": account_id,
                "handle": handle,
                "display_name": handle,
                "agent_id": f"agent.{handle}",
                "status": "active",
                "created_at": _now(),
            }
            self.store.identity_upsert_player(player)
        else:
            players = self.store.identity_list_players(account["account_id"])
            player = players[0] if players else None
            if not player:
                handle = self._slug_handle(handle_hint or account["account_id"])
                player = {
                    "player_id": _new_id("player"),
                    "account_id": account["account_id"],
                    "handle": handle,
                    "display_name": handle,
                    "agent_id": f"agent.{handle}",
                    "status": "active",
                    "created_at": _now(),
                }
                self.store.identity_upsert_player(player)

        controller = self._ensure_controller(
            player["player_id"],
            ctype="browser",
            provider="supabase",
            metadata={"kind": "human_browser"},
        )
        access, refresh, scopes = self._issue_tokens(controller["controller_id"], player, DEFAULT_AGENT_SCOPES)
        return {
            "account_id": account["account_id"],
            "player_id": player["player_id"],
            "agent_id": player.get("agent_id") or f"agent.{player['handle']}",
            "controller_id": controller["controller_id"],
            "access_token": access,
            "refresh_token": refresh,
            "scopes": list(scopes),
            "token_type": "bearer",
        }

    @staticmethod
    def _slug_handle(raw: str) -> str:
        s = "".join(c if c.isalnum() or c in "-_" else "-" for c in raw.split("@")[0].lower())
        s = s.strip("-_")[:32] or "player"
        return s

    # --- controllers / tokens --------------------------------------------

    def _ensure_controller(
        self,
        player_id: str,
        *,
        ctype: str,
        provider: str | None,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        existing = self.store.identity_list_controllers(player_id)
        for c in existing:
            if c.get("type") == ctype and c.get("provider") == provider and not c.get("revoked_at"):
                return c
        controller = {
            "controller_id": _new_id("ctrl"),
            "player_id": player_id,
            "type": ctype,
            "provider": provider or "",
            "metadata_json": json.dumps(metadata, sort_keys=True),
            "created_at": _now(),
            "revoked_at": None,
        }
        self.store.identity_upsert_controller(controller)
        return controller

    def _issue_tokens(
        self,
        controller_id: str,
        player: dict[str, Any],
        scopes: tuple[str, ...] | list[str],
        *,
        access_ttl: int = 3600,
        refresh_ttl: int = 60 * 60 * 24 * 30,
    ) -> tuple[str, str, list[str]]:
        scope_list = [s for s in scopes if s not in ADMIN_SCOPES]  # never mint admin by default
        now = _now()
        access_jti = secrets.token_hex(8)
        refresh_raw = secrets.token_urlsafe(32)
        access = mint_hs256(
            {
                "sub": player["player_id"],
                "player_id": player["player_id"],
                "agent_id": player.get("agent_id") or f"agent.{player['handle']}",
                "controller_id": controller_id,
                "scopes": scope_list,
                "typ": "access",
                "jti": access_jti,
                "iat": now,
                "exp": now + access_ttl,
            },
            self.token_secret,
        )
        # store refresh fingerprint
        cred = {
            "credential_id": _new_id("cred"),
            "controller_id": controller_id,
            "kind": "refresh_token",
            "scopes_json": json.dumps(scope_list, sort_keys=True),
            "fingerprint": _fingerprint(refresh_raw, self.pepper),
            "issued_at": now,
            "expires_at": now + refresh_ttl,
            "revoked_at": None,
        }
        self.store.identity_upsert_credential(cred)
        # access credential audit row (fingerprint of jti only)
        self.store.identity_upsert_credential(
            {
                "credential_id": _new_id("cred"),
                "controller_id": controller_id,
                "kind": "access_token",
                "scopes_json": json.dumps(scope_list, sort_keys=True),
                "fingerprint": _fingerprint(access_jti, self.pepper),
                "issued_at": now,
                "expires_at": now + access_ttl,
                "revoked_at": None,
            }
        )
        return access, refresh_raw, scope_list

    def resolve_access_token(self, token: str) -> dict[str, Any]:
        try:
            claims = verify_hs256(token, self.token_secret)
        except JwtError as exc:
            raise ActionError(NOT_AUTHORIZED, f"invalid controller token: {exc}") from exc
        if claims.get("typ") != "access":
            raise ActionError(NOT_AUTHORIZED, "not an access token")
        controller_id = claims.get("controller_id")
        player_id = claims.get("player_id")
        if not controller_id or not player_id:
            raise ActionError(NOT_AUTHORIZED, "token missing controller/player")
        controller = self.store.identity_get_controller(str(controller_id))
        if not controller or controller.get("revoked_at"):
            raise ActionError(NOT_AUTHORIZED, "controller revoked or unknown")
        if controller.get("player_id") != player_id:
            raise ActionError(NOT_AUTHORIZED, "controller/player mismatch")
        player = self.store.identity_get_player(str(player_id))
        if not player or player.get("status") != "active":
            raise ActionError(NOT_AUTHORIZED, "player not active")
        return {
            "player_id": player_id,
            "agent_id": claims.get("agent_id") or player.get("agent_id"),
            "controller_id": controller_id,
            "scopes": list(claims.get("scopes") or []),
            "player": player,
            "controller": controller,
        }

    def refresh(self, refresh_token: str) -> dict[str, Any]:
        fp = _fingerprint(refresh_token, self.pepper)
        cred = self.store.identity_get_credential_by_fingerprint(fp)
        if not cred or cred.get("kind") != "refresh_token" or cred.get("revoked_at"):
            raise ActionError(NOT_AUTHORIZED, "invalid refresh token")
        if cred.get("expires_at") and int(cred["expires_at"]) < _now():
            raise ActionError(NOT_AUTHORIZED, "refresh token expired")
        # rotate: revoke old refresh
        cred["revoked_at"] = _now()
        self.store.identity_upsert_credential(cred)
        controller = self.store.identity_get_controller(cred["controller_id"])
        if not controller or controller.get("revoked_at"):
            raise ActionError(NOT_AUTHORIZED, "controller revoked")
        player = self.store.identity_get_player(controller["player_id"])
        if not player:
            raise ActionError(NOT_AUTHORIZED, "player missing")
        scopes = json.loads(cred.get("scopes_json") or "[]")
        access, refresh, scope_list = self._issue_tokens(controller["controller_id"], player, scopes)
        return {
            "access_token": access,
            "refresh_token": refresh,
            "player_id": player["player_id"],
            "agent_id": player.get("agent_id"),
            "controller_id": controller["controller_id"],
            "scopes": scope_list,
            "token_type": "bearer",
        }

    def revoke_controller(self, controller_id: str, *, access_token: str | None = None) -> dict[str, Any]:
        if not access_token:
            raise ActionError(NOT_AUTHORIZED, "controller token required to revoke")
        caller = self.resolve_access_token(access_token)
        controller = self.store.identity_get_controller(controller_id)
        if not controller:
            raise ActionError(NOT_AUTHORIZED, "unknown controller")
        scopes = caller.get("scopes") or []
        privileged = "noema.controller.manage" in scopes or "noema.player.manage" in scopes
        if controller.get("player_id") != caller.get("player_id") and not privileged:
            raise ActionError(NOT_AUTHORIZED, "cannot revoke another Player's controller")
        controller["revoked_at"] = _now()
        self.store.identity_upsert_controller(controller)
        self.store.identity_revoke_credentials_for_controller(controller_id)
        return {"controller_id": controller_id, "revoked": True}

    # --- device enrollment -----------------------------------------------

    def start_device_enrollment(
        self,
        *,
        scopes: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        requested = [s for s in (scopes or list(DEFAULT_AGENT_SCOPES)) if s not in ADMIN_SCOPES]
        if not requested:
            requested = list(DEFAULT_AGENT_SCOPES)
        device_code = secrets.token_urlsafe(24)
        user_code = f"{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"
        now = _now()
        record = {
            "device_code": device_code,
            "user_code": user_code,
            "scopes_json": json.dumps(requested, sort_keys=True),
            "metadata_json": json.dumps(metadata or {}, sort_keys=True),
            "status": "pending",
            "player_id": None,
            "controller_id": None,
            "created_at": now,
            "expires_at": now + 600,
            "interval": 5,
        }
        self._pending_devices[device_code] = record
        self.store.identity_upsert_device_code(record)
        return {
            "device_code": device_code,
            "user_code": user_code,
            "verification_url": "/connect",
            "expires_in": 600,
            "interval": 5,
            "scopes": requested,
        }

    def preview_device(self, user_code: str) -> dict[str, Any]:
        """Public-safe enrollment preview (no secrets)."""
        rec = self._find_device_by_user_code(user_code)
        if not rec:
            raise ActionError(NOT_AUTHORIZED, "unknown user_code")
        meta = json.loads(rec.get("metadata_json") or "{}")
        scopes = json.loads(rec.get("scopes_json") or "[]")
        return {
            "user_code": rec["user_code"],
            "status": rec.get("status"),
            "scopes": scopes,
            "metadata": meta,
            "expires_at": rec.get("expires_at"),
            "framework": meta.get("framework") or meta.get("provider") or "external",
        }

    def _find_device_by_user_code(self, user_code: str) -> dict[str, Any] | None:
        code = user_code.strip().upper()
        rec = self.store.identity_get_device_by_user_code(code)
        if rec:
            return rec
        return next((r for r in self._pending_devices.values() if r["user_code"] == code), None)

    def approve_device(
        self,
        *,
        user_code: str,
        player_id: str | None = None,
        approver_access_token: str | None = None,
        approver_account_id: str | None = None,
    ) -> dict[str, Any]:
        """Approve enrollment. Requires human controller token (or owned account in local tests)."""
        approver: dict[str, Any] | None = None
        if approver_access_token:
            approver = self.resolve_access_token(approver_access_token)
            if approver["controller"].get("type") not in ("browser", "mobile", "cli"):
                # Allow agent controllers only if they already hold controller.manage (not default)
                if "noema.controller.manage" not in (approver.get("scopes") or []):
                    raise ActionError(NOT_AUTHORIZED, "only a human Controller may approve device enrollment")
            player_id = player_id or approver["player_id"]
            if player_id != approver["player_id"] and "noema.player.manage" not in (
                approver.get("scopes") or []
            ):
                raise ActionError(NOT_AUTHORIZED, "cannot approve for another Player")
            approver_account_id = approver["player"].get("account_id")
        elif not self.allow_dev_human:
            raise ActionError(NOT_AUTHORIZED, "human controller token required to approve")

        if not player_id:
            raise ActionError(NOT_AUTHORIZED, "player_id required")

        rec = self._find_device_by_user_code(user_code)
        if not rec:
            raise ActionError(NOT_AUTHORIZED, "unknown user_code")
        if rec.get("status") != "pending":
            raise ActionError(NOT_AUTHORIZED, f"device enrollment is {rec.get('status')}")
        if int(rec.get("expires_at") or 0) < _now():
            rec["status"] = "expired"
            self.store.identity_upsert_device_code(rec)
            raise ActionError(NOT_AUTHORIZED, "device code expired")
        player = self.store.identity_get_player(player_id)
        if not player or player.get("status") != "active":
            raise ActionError(NOT_AUTHORIZED, "invalid player")
        if approver_account_id and player.get("account_id") != approver_account_id:
            raise ActionError(NOT_AUTHORIZED, "player not owned by approver")
        meta = json.loads(rec.get("metadata_json") or "{}")
        # Always create a fresh agent controller attachment for enrollment
        controller = {
            "controller_id": _new_id("ctrl"),
            "player_id": player_id,
            "type": "agent",
            "provider": str(meta.get("framework") or meta.get("provider") or "external"),
            "metadata_json": json.dumps(meta, sort_keys=True),
            "created_at": _now(),
            "revoked_at": None,
        }
        self.store.identity_upsert_controller(controller)
        scopes = json.loads(rec.get("scopes_json") or "[]")
        rec["status"] = "approved"
        rec["player_id"] = player_id
        rec["controller_id"] = controller["controller_id"]
        rec.pop("access_token", None)
        rec.pop("refresh_token", None)
        rec["scopes_json"] = json.dumps(scopes, sort_keys=True)
        self._pending_devices[rec["device_code"]] = rec
        self.store.identity_upsert_device_code(rec)
        return {
            "status": "approved",
            "user_code": rec["user_code"],
            "player_id": player_id,
            "agent_id": player.get("agent_id"),
            "controller_id": controller["controller_id"],
            "scopes": scopes,
            "framework": controller["provider"],
        }

    def deny_device(self, *, user_code: str, approver_access_token: str | None = None) -> dict[str, Any]:
        if not approver_access_token:
            raise ActionError(NOT_AUTHORIZED, "human controller token required to deny")
        approver = self.resolve_access_token(approver_access_token)
        scopes = approver.get("scopes") or []
        if approver["controller"].get("type") not in ("browser", "mobile", "cli"):
            if "noema.controller.manage" not in scopes:
                raise ActionError(NOT_AUTHORIZED, "only a human Controller may deny device enrollment")
        rec = self._find_device_by_user_code(user_code)
        if not rec:
            raise ActionError(NOT_AUTHORIZED, "unknown user_code")
        bound = rec.get("player_id")
        privileged = "noema.controller.manage" in scopes or "noema.player.manage" in scopes
        if bound and bound != approver.get("player_id") and not privileged:
            raise ActionError(NOT_AUTHORIZED, "cannot deny another Player's enrollment")
        if rec.get("status") != "pending":
            return {"status": rec.get("status"), "user_code": rec["user_code"]}
        rec["status"] = "denied"
        self._pending_devices[rec["device_code"]] = rec
        self.store.identity_upsert_device_code(rec)
        return {"status": "denied", "user_code": rec["user_code"]}

    def poll_device_token(self, device_code: str) -> dict[str, Any]:
        rec = self._pending_devices.get(device_code) or self.store.identity_get_device_by_code(device_code)
        if not rec:
            raise ActionError(NOT_AUTHORIZED, "unknown device_code")
        if int(rec.get("expires_at") or 0) < _now() and rec.get("status") == "pending":
            rec["status"] = "expired"
            self.store.identity_upsert_device_code(rec)
            raise ActionError(NOT_AUTHORIZED, "device code expired")
        status = rec.get("status")
        if status == "pending":
            return {"status": "authorization_pending", "interval": rec.get("interval", 5)}
        if status != "approved":
            raise ActionError(NOT_AUTHORIZED, f"device enrollment {status}")
        player = self.store.identity_get_player(rec["player_id"])
        controller_id = rec.get("controller_id")
        if not player or not controller_id:
            raise ActionError(NOT_AUTHORIZED, "tokens already redeemed")
        scopes = json.loads(rec.get("scopes_json") or "[]")
        access, refresh, scope_list = self._issue_tokens(str(controller_id), player, scopes)
        rec["status"] = "redeemed"
        rec.pop("access_token", None)
        rec.pop("refresh_token", None)
        self.store.identity_upsert_device_code(rec)
        self._pending_devices[device_code] = rec
        return {
            "status": "approved",
            "access_token": access,
            "refresh_token": refresh,
            "player_id": rec["player_id"],
            "agent_id": player.get("agent_id"),
            "controller_id": controller_id,
            "scopes": scope_list,
            "token_type": "bearer",
        }
