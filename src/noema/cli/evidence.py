"""CLI: noema-keygen-evidence / noema-export-evidence / noema-verify-evidence."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from noema.evidence.receipts import (
    generate_keyring,
    load_keyring,
    rotate_key,
    save_keyring,
    sign_export_bundle,
    verify_export_dir,
)
from noema.ops.manifest import load_spec_compat
from noema.persistence.store import open_store


def main_keygen(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate or rotate evidence keyring")
    parser.add_argument("--out", type=Path, default=Path("var/evidence-keyring.json"))
    parser.add_argument("--key-id", default="key.research.1")
    parser.add_argument("--rotate", action="store_true", help="Rotate existing keyring")
    parser.add_argument("--new-key-id", default=None)
    args = parser.parse_args(argv)

    if args.rotate and args.out.is_file():
        kr = load_keyring(args.out)
        nid = args.new_key_id or f"key.research.{len(kr.get('keys') or {}) + 1}"
        kr = rotate_key(kr, new_key_id=nid)
        save_keyring(args.out, kr)
        print(f"NOEMA KEYRING: rotated active={kr['active_key_id']} path={args.out}")
        return 0

    kr = generate_keyring(key_id=args.key_id)
    save_keyring(args.out, kr)
    print(f"NOEMA KEYRING: created active={kr['active_key_id']} path={args.out}")
    print("Keep this file secret; never commit or embed in public bundles.", file=sys.stderr)
    return 0


def main_export(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sign research/evidence export bundle")
    parser.add_argument("--db", default="data/noema.sqlite3")
    parser.add_argument("--keyring", type=Path, default=Path("var/evidence-keyring.json"))
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--profile",
        default="research-isolated",
        choices=["local-gameplay", "research-isolated", "reproducibility", "public-evidence-export"],
    )
    parser.add_argument("--consent-policy", default="consent.default")
    parser.add_argument("--exclusion-policy", default="exclusion.default")
    parser.add_argument("--seed", type=Path, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    store = open_store(args.db)
    try:
        meta = store.dump_meta()
        if args.seed and not store.ready:
            store.rehydrate_from_db(args.seed)
        elif meta.get("seed_path") and not store.ready:
            try:
                store.rehydrate_from_db(meta["seed_path"])
            except Exception:
                pass
        events = store.list_event_rows()
        snaps = store.list_snapshots()
        world_id = meta.get("world_id") or "world.unknown"
        compat = load_spec_compat()
        payload = {
            "world_id": world_id,
            "meta": {k: v for k, v in meta.items() if k != "writer_token"},
            "events": events,
            "snapshots": [
                {k: s[k] for k in ("snapshot_id", "cycle", "sequence", "state_digest") if k in s}
                for s in snaps
            ],
            "export_note": "research derivation export; not world truth mutation",
        }
        lineage = {
            "product_version": compat.get("runtime_version"),
            "event_catalog_version": (compat.get("versions") or {}).get("event_catalog"),
            "world_version": meta.get("world_version"),
            "world_rules_version": (compat.get("versions") or {}).get("world_rules"),
            "agent_protocol_version": (compat.get("versions") or {}).get("agent_protocol"),
        }
        keyring = load_keyring(args.keyring)
        result = sign_export_bundle(
            payload=payload,
            world_id=world_id,
            export_profile=args.profile,
            keyring=keyring,
            version_lineage=lineage,
            consent_policy_id=args.consent_policy,
            exclusion_policy_id=args.exclusion_policy,
            dest=args.out,
        )
    finally:
        store.close()

    if args.json:
        print(json.dumps({"ok": True, "export": str(args.out), "meta": result}, indent=2, sort_keys=True))
    else:
        print(f"NOEMA EXPORT: {args.out} profile={args.profile} digest={result['evidence_digest']}")
    return 0


def main_verify(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify signed evidence export bundle")
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--keyring", type=Path, default=Path("var/evidence-keyring.json"))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    result = verify_export_dir(args.bundle, keyring_path=args.keyring if args.keyring.is_file() else None)
    if args.json:
        print(
            json.dumps(
                {
                    "ok": result.ok,
                    "status": result.status,
                    "failures": result.failures,
                    "export_profile": result.export_profile,
                    "line": result.line(),
                },
                indent=2,
                sort_keys=True,
            )
        )
    else:
        for f in result.failures:
            print(f"  fail: {f}", file=sys.stderr)
        print(result.line())
    return 0 if result.ok else 1


# Entry aliases for setuptools
def main() -> int:
    """Dispatch: prefer dedicated entry points; default to verify for safety."""
    return main_verify()
