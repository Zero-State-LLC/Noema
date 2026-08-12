"""noema-backup / noema-restore — portable world bundles (Specs OPERATIONS.md)."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from noema.ops.manifest import build_runtime_manifest, configuration_digest, load_spec_compat
from noema.ops.verify import verify_world
from noema.persistence.store import open_store
from noema.world.digest import sha256_digest


BUNDLE_SCHEMA = "noema-backup-bundle/1.0"


def backup_world(
    db: Path | str,
    dest: Path | str,
    *,
    seed_path: Path | str | None = None,
    objects_path: Path | str | None = None,
    config: dict[str, Any] | None = None,
    include_research: bool = False,
) -> Path:
    """Write a portable backup directory; returns path to bundle root."""
    dest_path = Path(dest)
    if dest_path.exists() and any(dest_path.iterdir()):
        raise FileExistsError(f"backup destination not empty: {dest_path}")
    dest_path.mkdir(parents=True, exist_ok=True)

    store = open_store(db)
    try:
        meta = store.dump_meta()
        seed = seed_path or meta.get("seed_path")
        if seed and Path(str(seed)).is_file() and not store.ready:
            store.rehydrate_from_db(seed)

        events = store.list_event_rows()
        snapshots = store.list_snapshots()
        cycle = int(meta.get("cycle") or 0)
        sequence = int(meta.get("sequence") or 0)
        if store.ready:
            st = store.get_state()
            cycle = st.cycle
            sequence = st.sequence

        snap_head = snapshots[-1]["state_digest"] if snapshots else meta.get("state_digest")
        manifest = build_runtime_manifest(
            store_meta=meta,
            ledger_head=store.ledger_head() or meta.get("ledger_head"),
            snapshot_head=snap_head,
            current_cycle=cycle,
            sequence=sequence,
            backend=store.backend,
            config=config,
            objects_path=str(objects_path or "./var/objects"),
        )

        # Writer fence at backup is audit-only (OPERATIONS.md).
        fence_at_backup = meta.get("writer_token") or store.writer_token

        bundle = {
            "schema_version": BUNDLE_SCHEMA,
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "world_id": meta.get("world_id"),
            "world_version": meta.get("world_version"),
            "catalog_version": meta.get("catalog_version"),
            "seed": meta.get("seed"),
            "seed_path": meta.get("seed_path"),
            "configuration_digest": configuration_digest(config),
            "writer_fence_epoch_at_backup": fence_at_backup,
            "pins": load_spec_compat().get("versions") or {},
            "runtime_manifest": manifest,
            "meta": {k: v for k, v in meta.items() if k != "writer_token"},
            "event_count": len(events),
            "snapshot_count": len(snapshots),
            "include_research": include_research,
        }

        (dest_path / "bundle.json").write_text(
            json.dumps(bundle, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (dest_path / "runtime-manifest.json").write_text(
            json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (dest_path / "meta.json").write_text(
            json.dumps(bundle["meta"], indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (dest_path / "events.jsonl").write_text(
            "".join(json.dumps(e, sort_keys=True) + "\n" for e in events),
            encoding="utf-8",
        )
        (dest_path / "snapshots.jsonl").write_text(
            "".join(json.dumps(s, sort_keys=True) + "\n" for s in snapshots),
            encoding="utf-8",
        )

        # Object/blob references (filesystem adapter): copy if present
        obj_src = Path(objects_path or Path.cwd() / "var" / "objects")
        obj_refs: list[str] = []
        if obj_src.is_dir():
            obj_dest = dest_path / "objects"
            for p in obj_src.rglob("*"):
                if p.is_file():
                    rel = p.relative_to(obj_src)
                    target = obj_dest / rel
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(p, target)
                    obj_refs.append(str(rel))
        (dest_path / "object-refs.json").write_text(
            json.dumps({"adapter": "filesystem", "refs": obj_refs}, indent=2, sort_keys=True)
            + "\n",
            encoding="utf-8",
        )

        # Bundle integrity digest over canonical files (no secrets)
        digest_body = {
            "bundle": bundle,
            "events_sha": sha256_digest([json.loads(line) for line in (dest_path / "events.jsonl").read_text(encoding="utf-8").splitlines() if line]),
            "snapshots_sha": sha256_digest(
                [json.loads(line) for line in (dest_path / "snapshots.jsonl").read_text(encoding="utf-8").splitlines() if line]
            ),
        }
        (dest_path / "bundle.digest").write_text(sha256_digest(digest_body) + "\n", encoding="utf-8")
        return dest_path
    finally:
        store.close()


def restore_world(
    bundle: Path | str,
    db: Path | str,
    *,
    seed_path: Path | str | None = None,
    objects_path: Path | str | None = None,
    force: bool = False,
    run_verify: bool = True,
) -> dict[str, Any]:
    """Restore a backup bundle into a clean target store.

    Refuses if target already has a ledger unless force=True.
    Acquires a fresh writer fence; does not reuse backup fence token.
    """
    root = Path(bundle)
    if not root.is_dir():
        raise FileNotFoundError(f"bundle not found: {root}")
    bundle_meta = json.loads((root / "bundle.json").read_text(encoding="utf-8"))
    if bundle_meta.get("schema_version") != BUNDLE_SCHEMA:
        raise ValueError(f"unsupported bundle schema: {bundle_meta.get('schema_version')}")

    # Version lineage compatibility
    compat = load_spec_compat()
    pins = compat.get("versions") or {}
    b_pins = bundle_meta.get("pins") or {}
    catalog = b_pins.get("event_catalog") or bundle_meta.get("catalog_version")
    if catalog and pins.get("event_catalog") and catalog != pins["event_catalog"]:
        raise RuntimeError(
            f"incompatible event_catalog: bundle={catalog} runtime={pins['event_catalog']} "
            "(explicit migration required)"
        )

    store = open_store(db)
    try:
        existing = store.event_count()
        if existing and not force:
            raise RuntimeError(
                f"target store not empty ({existing} events); use force=True for wipe restore"
            )

        events = [
            json.loads(line)
            for line in (root / "events.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        snapshots = [
            json.loads(line)
            for line in (root / "snapshots.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        meta = json.loads((root / "meta.json").read_text(encoding="utf-8"))
        if seed_path:
            meta["seed_path"] = str(seed_path)
        elif bundle_meta.get("seed_path"):
            meta.setdefault("seed_path", bundle_meta["seed_path"])

        store.import_canonical(meta=meta, events=events, snapshots=snapshots)

        # Restore filesystem objects if present
        obj_src = root / "objects"
        obj_dest = Path(objects_path or Path.cwd() / "var" / "objects")
        if obj_src.is_dir():
            obj_dest.mkdir(parents=True, exist_ok=True)
            for p in obj_src.rglob("*"):
                if p.is_file():
                    rel = p.relative_to(obj_src)
                    target = obj_dest / rel
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(p, target)

        seed = seed_path or meta.get("seed_path")
        if seed and Path(str(seed)).is_file():
            store.rehydrate_from_db(seed)

        verify_result = None
        if run_verify:
            store.close()
            store = None
            verify_result = verify_world(db, seed_path=seed, objects_path=obj_dest)
            if not verify_result.ok:
                raise RuntimeError(
                    "restore completed but verify failed: " + "; ".join(verify_result.failures)
                )

        return {
            "restored": True,
            "world_id": bundle_meta.get("world_id"),
            "event_count": len(events),
            "snapshot_count": len(snapshots),
            "fresh_writer_fence": True,
            "verify": verify_result.pass_line() if verify_result else "SKIPPED",
            "verify_ok": verify_result.ok if verify_result else None,
        }
    finally:
        if store is not None:
            store.close()
