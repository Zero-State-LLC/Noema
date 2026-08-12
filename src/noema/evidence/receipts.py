"""Signed evidence receipts for research-isolated / public export profiles.

RFC-0003 + docs/SECURITY.md:
- optional for local gameplay
- mandatory for research-isolated, reproducibility, and public evidence export
- missing/invalid required receipt → INVALID_EVIDENCE (never silently unsigned)

Reference algorithm: HMAC-SHA256 over noema-jcs/1 canonical bytes of the signed body.
Private key material stays in an out-of-band keyring file and MUST NOT enter public bundles.
Historical verification uses the keyring entry for the receipt's key_id (rotation-safe).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from noema.world.digest import canonical_json, sha256_digest

INVALID_EVIDENCE = "INVALID_EVIDENCE"
RECEIPT_VERSION = "evidence-receipt/1.0"
ALGORITHM = "hmac-sha256"
VERIFICATION_POLICY = "noema-evidence-hmac/1"
EXPORT_PROFILES = frozenset(
    {
        "local-gameplay",
        "research-isolated",
        "reproducibility",
        "public-evidence-export",
    }
)
# Profiles that MUST carry valid signed receipts
MANDATORY_RECEIPT_PROFILES = frozenset(
    {
        "research-isolated",
        "reproducibility",
        "public-evidence-export",
    }
)

ReceiptStatus = Literal["VALID", "INVALID_EVIDENCE", "OPTIONAL_UNSIGNED"]


class EvidenceError(ValueError):
    """Evidence receipt or export failed closed."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

    def as_dict(self) -> dict[str, str]:
        return {"code": self.code, "message": self.message}


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hex_hmac(key: bytes, body: bytes) -> str:
    return hmac.new(key, body, hashlib.sha256).hexdigest()


def load_keyring(path: Path | str) -> dict[str, Any]:
    p = Path(path)
    if not p.is_file():
        raise EvidenceError("KEYRING_MISSING", f"keyring not found: {p}")
    data = json.loads(p.read_text(encoding="utf-8"))
    if data.get("schema_version") != "noema-evidence-keyring/1.0":
        raise EvidenceError("KEYRING_INVALID", "unsupported keyring schema")
    return data


def save_keyring(path: Path | str, keyring: dict[str, Any]) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    # Restrictive mode when possible
    p.write_text(json.dumps(keyring, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    try:
        p.chmod(0o600)
    except OSError:
        pass


def generate_keyring(
    *,
    key_id: str = "key.research.1",
    label: str = "research-isolated default",
) -> dict[str, Any]:
    """Create a new keyring with one HMAC key (hex-encoded secret)."""
    secret = secrets.token_hex(32)
    return {
        "schema_version": "noema-evidence-keyring/1.0",
        "algorithm": ALGORITHM,
        "active_key_id": key_id,
        "keys": {
            key_id: {
                "key_id": key_id,
                "algorithm": ALGORITHM,
                "secret_hex": secret,
                "status": "active",
                "label": label,
                "created_at": _utc_now(),
            }
        },
    }


def rotate_key(keyring: dict[str, Any], *, new_key_id: str, label: str = "rotated") -> dict[str, Any]:
    """Add a new active key; previous keys remain for historical verification."""
    secret = secrets.token_hex(32)
    keys = dict(keyring.get("keys") or {})
    prev = keyring.get("active_key_id")
    if prev and prev in keys:
        keys[prev] = {**keys[prev], "status": "retired"}
    keys[new_key_id] = {
        "key_id": new_key_id,
        "algorithm": ALGORITHM,
        "secret_hex": secret,
        "status": "active",
        "label": label,
        "created_at": _utc_now(),
        "replaces": prev,
    }
    return {
        **keyring,
        "active_key_id": new_key_id,
        "keys": keys,
    }


def _key_bytes(keyring: dict[str, Any], key_id: str) -> bytes:
    keys = keyring.get("keys") or {}
    entry = keys.get(key_id)
    if not entry:
        raise EvidenceError("KEY_UNKNOWN", f"key_id not in keyring: {key_id}")
    secret_hex = entry.get("secret_hex") or ""
    try:
        return bytes.fromhex(secret_hex)
    except ValueError as exc:
        raise EvidenceError("KEY_INVALID", f"bad secret for {key_id}") from exc


def evidence_payload_digest(payload: Any) -> str:
    """Digest of evidence bytes / export payload (claim-bearing content)."""
    return sha256_digest(payload)


def create_receipt(
    *,
    evidence_digest: str,
    world_id: str,
    export_profile: str,
    keyring: dict[str, Any],
    version_lineage: dict[str, Any],
    consent_policy_id: str = "consent.default",
    exclusion_policy_id: str = "exclusion.default",
    key_id: str | None = None,
    issued_at: str | None = None,
    extra_scope: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Sign an evidence receipt. Never embeds private key material."""
    if export_profile not in EXPORT_PROFILES:
        raise EvidenceError("PROFILE_UNKNOWN", f"unknown export profile: {export_profile}")
    kid = key_id or keyring.get("active_key_id")
    if not kid:
        raise EvidenceError("KEY_MISSING", "no active_key_id in keyring")
    key = _key_bytes(keyring, kid)

    scope = {
        "world_id": world_id,
        "export_profile": export_profile,
        "consent_policy_id": consent_policy_id,
        "exclusion_policy_id": exclusion_policy_id,
        "version_lineage": version_lineage,
        "evidence_digest": evidence_digest,
    }
    if extra_scope:
        scope = {**scope, **extra_scope}

    signed_body = {
        "receipt_version": RECEIPT_VERSION,
        "algorithm": ALGORITHM,
        "key_id": kid,
        "verification_policy": VERIFICATION_POLICY,
        "scope": scope,
        "issued_at": issued_at or _utc_now(),
    }
    # Signature covers canonical body without the signature field.
    body_bytes = canonical_json(signed_body).encode("utf-8")
    signature = _hex_hmac(key, body_bytes)
    receipt = {
        **signed_body,
        "signed_digest": sha256_digest(signed_body),
        "signature": signature,
    }
    return receipt


def verify_receipt(
    receipt: dict[str, Any],
    *,
    keyring: dict[str, Any],
    expected_world_id: str | None = None,
    expected_profile: str | None = None,
    expected_evidence_digest: str | None = None,
) -> ReceiptStatus:
    """Verify a single receipt. Returns VALID or raises/returns INVALID_EVIDENCE semantics."""
    try:
        status = _verify_receipt_inner(
            receipt,
            keyring=keyring,
            expected_world_id=expected_world_id,
            expected_profile=expected_profile,
            expected_evidence_digest=expected_evidence_digest,
        )
        return status
    except EvidenceError:
        return INVALID_EVIDENCE  # type: ignore[return-value]


def _verify_receipt_inner(
    receipt: dict[str, Any],
    *,
    keyring: dict[str, Any],
    expected_world_id: str | None,
    expected_profile: str | None,
    expected_evidence_digest: str | None,
) -> ReceiptStatus:
    if not isinstance(receipt, dict):
        raise EvidenceError(INVALID_EVIDENCE, "receipt not an object")
    if receipt.get("receipt_version") != RECEIPT_VERSION:
        raise EvidenceError(INVALID_EVIDENCE, "unsupported receipt_version")
    if receipt.get("algorithm") != ALGORITHM:
        raise EvidenceError(INVALID_EVIDENCE, "unsupported algorithm")
    if receipt.get("verification_policy") != VERIFICATION_POLICY:
        raise EvidenceError(INVALID_EVIDENCE, "unsupported verification_policy")

    kid = receipt.get("key_id")
    if not kid:
        raise EvidenceError(INVALID_EVIDENCE, "missing key_id")
    sig = receipt.get("signature")
    if not sig or not isinstance(sig, str):
        raise EvidenceError(INVALID_EVIDENCE, "missing signature")

    scope = receipt.get("scope") or {}
    if expected_world_id and scope.get("world_id") != expected_world_id:
        raise EvidenceError(INVALID_EVIDENCE, "world_id scope mismatch")
    if expected_profile and scope.get("export_profile") != expected_profile:
        raise EvidenceError(INVALID_EVIDENCE, "export_profile scope mismatch")
    if expected_evidence_digest and scope.get("evidence_digest") != expected_evidence_digest:
        raise EvidenceError(INVALID_EVIDENCE, "evidence_digest mismatch")

    # Recompute signature over body without signature/signed_digest
    body = {
        k: v
        for k, v in receipt.items()
        if k not in {"signature", "signed_digest"}
    }
    key = _key_bytes(keyring, str(kid))
    body_bytes = canonical_json(body).encode("utf-8")
    expected_sig = _hex_hmac(key, body_bytes)
    if not hmac.compare_digest(expected_sig, sig):
        raise EvidenceError(INVALID_EVIDENCE, "signature mismatch")

    # signed_digest integrity (optional field but required by our profile)
    if receipt.get("signed_digest") != sha256_digest(body):
        raise EvidenceError(INVALID_EVIDENCE, "signed_digest mismatch")

    return "VALID"


def receipts_required(export_profile: str) -> bool:
    return export_profile in MANDATORY_RECEIPT_PROFILES


def verify_receipts_for_bundle(
    bundle_meta: dict[str, Any],
    *,
    keyring: dict[str, Any] | None,
    receipts: list[dict[str, Any]] | None,
) -> dict[str, Any]:
    """Verify bundle-level evidence receipts per export profile.

    Returns:
      {
        "status": "VALID" | "INVALID_EVIDENCE" | "OPTIONAL_UNSIGNED",
        "required": bool,
        "checked": int,
        "failures": [...]
      }
    """
    profile = (
        bundle_meta.get("export_profile")
        or (bundle_meta.get("runtime_manifest") or {}).get("export_profile")
        or "local-gameplay"
    )
    required = receipts_required(str(profile))
    recs = list(receipts or bundle_meta.get("evidence_receipts") or [])
    world_id = bundle_meta.get("world_id")
    evidence_digest = bundle_meta.get("evidence_digest") or bundle_meta.get("bundle_digest")

    if not required:
        if not recs:
            return {
                "status": "OPTIONAL_UNSIGNED",
                "required": False,
                "checked": 0,
                "failures": [],
                "export_profile": profile,
            }
        # If present, still verify

    if required and not recs:
        return {
            "status": INVALID_EVIDENCE,
            "required": True,
            "checked": 0,
            "failures": ["missing required evidence receipt"],
            "export_profile": profile,
        }

    if required and keyring is None:
        return {
            "status": INVALID_EVIDENCE,
            "required": True,
            "checked": 0,
            "failures": ["keyring required to verify research/evidence receipts"],
            "export_profile": profile,
        }

    failures: list[str] = []
    checked = 0
    for rec in recs:
        checked += 1
        if keyring is None:
            failures.append("no keyring for receipt verification")
            continue
        st = verify_receipt(
            rec,
            keyring=keyring,
            expected_world_id=str(world_id) if world_id else None,
            expected_profile=str(profile) if required else None,
            expected_evidence_digest=str(evidence_digest) if evidence_digest else None,
        )
        if st != "VALID":
            failures.append(f"receipt key_id={rec.get('key_id')}: {INVALID_EVIDENCE}")

    if failures:
        return {
            "status": INVALID_EVIDENCE,
            "required": required,
            "checked": checked,
            "failures": failures,
            "export_profile": profile,
        }
    return {
        "status": "VALID",
        "required": required,
        "checked": checked,
        "failures": [],
        "export_profile": profile,
    }


def sign_export_bundle(
    *,
    payload: dict[str, Any],
    world_id: str,
    export_profile: str,
    keyring: dict[str, Any],
    version_lineage: dict[str, Any],
    consent_policy_id: str = "consent.default",
    exclusion_policy_id: str = "exclusion.default",
    dest: Path | str,
) -> dict[str, Any]:
    """Write a research/evidence export directory with signed receipt(s)."""
    dest_path = Path(dest)
    dest_path.mkdir(parents=True, exist_ok=True)
    evidence_digest = evidence_payload_digest(payload)
    receipt = create_receipt(
        evidence_digest=evidence_digest,
        world_id=world_id,
        export_profile=export_profile,
        keyring=keyring,
        version_lineage=version_lineage,
        consent_policy_id=consent_policy_id,
        exclusion_policy_id=exclusion_policy_id,
    )
    meta = {
        "schema_version": "noema-evidence-export/1.0",
        "export_profile": export_profile,
        "world_id": world_id,
        "evidence_digest": evidence_digest,
        "bundle_digest": evidence_digest,
        "consent_policy_id": consent_policy_id,
        "exclusion_policy_id": exclusion_policy_id,
        "version_lineage": version_lineage,
        "evidence_receipts": [receipt],
        "created_at": _utc_now(),
        # Never embed secrets
        "signing": {
            "algorithm": ALGORITHM,
            "key_id": receipt["key_id"],
            "verification_policy": VERIFICATION_POLICY,
        },
    }
    (dest_path / "export-meta.json").write_text(
        json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (dest_path / "evidence-payload.json").write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (dest_path / "receipts.jsonl").write_text(
        json.dumps(receipt, sort_keys=True) + "\n", encoding="utf-8"
    )
    # Public verification note — no secrets
    (dest_path / "VERIFY.txt").write_text(
        "Verify with noema-verify-evidence and the operator keyring for key_id "
        f"{receipt['key_id']}. Missing/invalid receipt ⇒ INVALID_EVIDENCE.\n",
        encoding="utf-8",
    )
    return meta


@dataclass
class ExportVerifyResult:
    ok: bool
    status: str
    failures: list[str]
    export_profile: str

    def line(self) -> str:
        if self.ok:
            return "NOEMA EVIDENCE: VALID"
        return f"NOEMA EVIDENCE: {INVALID_EVIDENCE}"


def verify_export_dir(
    path: Path | str,
    *,
    keyring_path: Path | str | None = None,
) -> ExportVerifyResult:
    root = Path(path)
    meta = json.loads((root / "export-meta.json").read_text(encoding="utf-8"))
    payload = json.loads((root / "evidence-payload.json").read_text(encoding="utf-8"))
    # Recompute digest
    expected = evidence_payload_digest(payload)
    failures: list[str] = []
    if meta.get("evidence_digest") != expected:
        failures.append("evidence_digest does not match payload")
    receipts = []
    rp = root / "receipts.jsonl"
    if rp.is_file():
        for line in rp.read_text(encoding="utf-8").splitlines():
            if line.strip():
                receipts.append(json.loads(line))
    keyring = load_keyring(keyring_path) if keyring_path else None
    vr = verify_receipts_for_bundle(
        {**meta, "evidence_digest": expected},
        keyring=keyring,
        receipts=receipts or meta.get("evidence_receipts"),
    )
    failures.extend(vr["failures"])
    if meta.get("evidence_digest") != expected:
        status = INVALID_EVIDENCE
    else:
        status = vr["status"]
    ok = status == "VALID" or (
        status == "OPTIONAL_UNSIGNED" and not receipts_required(str(meta.get("export_profile")))
    )
    if failures and status != "OPTIONAL_UNSIGNED":
        ok = False
        status = INVALID_EVIDENCE
    return ExportVerifyResult(
        ok=ok,
        status=status,
        failures=failures,
        export_profile=str(meta.get("export_profile") or "local-gameplay"),
    )
