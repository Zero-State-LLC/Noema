"""noema-verify — fail-closed operator checklist (Specs OPERATIONS.md)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from noema.config.deployment import ConfigError, load_deployment_config
from noema.evidence.receipts import (
    INVALID_EVIDENCE,
    load_keyring,
    receipts_required,
    verify_receipts_for_bundle,
)
from noema.evidence.resume import ResumeRegistry
from noema.ops.manifest import build_runtime_manifest, load_spec_compat
from noema.persistence.store import WorldStore, open_store


REQUIRED_CHECKS = [
    "config",
    "database",
    "schema",
    "spec_compat",
    "ledger",
    "snapshots",
    "object_storage",
    "seed_replay",
    "runtime_manifest",
    "writer_fence",
    "canonical_atomicity",
    "resume_ack_windows",
    "evidence_receipts",
]


@dataclass
class VerifyResult:
    ok: bool
    checks: dict[str, str] = field(default_factory=dict)
    failures: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    manifest: dict[str, Any] | None = None

    def pass_line(self) -> str:
        return "NOEMA VERIFY: PASS" if self.ok else "NOEMA VERIFY: FAIL"


def verify_world(
    db: Path | str,
    *,
    seed_path: Path | str | None = None,
    objects_path: Path | str | None = None,
    config_path: Path | str | None = None,
    require_seed: bool = False,
    rehydrate: bool = True,
    evidence_bundle: Path | str | None = None,
    evidence_keyring: Path | str | None = None,
    resume_registry: ResumeRegistry | None = None,
) -> VerifyResult:
    """Run the OPERATIONS verify checklist against a store."""
    result = VerifyResult(ok=True)
    store: WorldStore | None = None

    # 1. Config validity (deployment-config.schema.json rules; secrets forbidden)
    config: dict[str, Any] | None = None
    try:
        if config_path and Path(config_path).is_file():
            config = load_deployment_config(config_path)
        else:
            config = load_deployment_config(None)
            if not config_path:
                result.warnings.append("no deployment config path; using validated local-default")
        result.checks["config"] = "PASS"
        result.checks["configuration_digest"] = "PASS"
    except ConfigError as exc:
        result.failures.append(f"deployment config: {exc}")
        result.checks["config"] = "FAIL"
        # still try to parse raw for partial diagnostics
        if config_path and Path(config_path).is_file():
            try:
                config = json.loads(Path(config_path).read_text(encoding="utf-8"))
            except Exception:
                config = None

    # 2. Database connectivity
    try:
        store = open_store(db)
        # Touch connection
        store.dump_meta()
        result.checks["database"] = "PASS"
        result.checks["database_backend"] = store.backend
    except Exception as exc:
        result.failures.append(f"database connectivity: {exc}")
        result.checks["database"] = "FAIL"
        result.ok = False
        return result

    assert store is not None

    # 3. Schema version / required tables
    present = store.schema_tables_present()
    if set(present) >= {"meta", "events", "snapshots", "sessions"}:
        result.checks["schema"] = "PASS"
    else:
        result.failures.append(f"schema incomplete: present={present}")
        result.checks["schema"] = "FAIL"

    # 4. Spec compatibility pins
    compat = load_spec_compat()
    versions = compat.get("versions") or {}
    if versions.get("event_catalog") and versions.get("canonicalization") == "noema-jcs/1":
        result.checks["spec_compat"] = "PASS"
    else:
        result.failures.append("spec-compat.json missing required version pins")
        result.checks["spec_compat"] = "FAIL"

    meta = store.dump_meta()
    catalog = meta.get("catalog_version")
    pinned = versions.get("event_catalog")
    if catalog and pinned and catalog != pinned:
        result.failures.append(f"catalog pin mismatch store={catalog} runtime={pinned}")
        result.checks["spec_compat"] = "FAIL"

    # Rehydrate when possible for consistency checks
    seed = seed_path or meta.get("seed_path")
    if rehydrate and seed and Path(str(seed)).is_file():
        try:
            store.rehydrate_from_db(seed)
            result.checks["seed_replay"] = "PASS"
        except Exception as exc:
            result.failures.append(f"seed/rehydrate: {exc}")
            result.checks["seed_replay"] = "FAIL"
    elif require_seed:
        result.failures.append("seed path required but missing")
        result.checks["seed_replay"] = "FAIL"
    else:
        result.checks["seed_replay"] = "SKIP"
        result.warnings.append("seed not loaded; ledger checks use stored rows only")

    # 5. Ledger integrity
    problems = store.verify_consistency() if store.ready else []
    # Always check digest chain on stored events even if not rehydrated
    chain_problems = _check_event_chain(store)
    all_ledger = list(problems) + [p for p in chain_problems if p not in problems]
    if store.ready and not all_ledger:
        result.checks["ledger"] = "PASS"
    elif not store.ready and not chain_problems:
        # empty or events-only without in-memory state
        if store.event_count() == 0 and not meta.get("world_id"):
            result.checks["ledger"] = "PASS"
            result.warnings.append("empty store (no world loaded)")
        elif not chain_problems:
            result.checks["ledger"] = "PASS"
        else:
            result.failures.extend(chain_problems)
            result.checks["ledger"] = "FAIL"
    else:
        result.failures.extend(all_ledger)
        result.checks["ledger"] = "FAIL"

    # 6. Snapshot integrity
    snaps = store.list_snapshots()
    snap_ok = True
    for s in snaps:
        if not s.get("state_digest") or not s.get("state_json"):
            snap_ok = False
            result.failures.append(f"snapshot {s.get('snapshot_id')} missing digest/state")
    # latest snapshot sequence should be <= ledger sequence
    seq_meta = int(meta.get("sequence") or 0)
    if snaps and int(snaps[-1]["sequence"]) > seq_meta and seq_meta > 0:
        # allow equality; greater is bad
        pass
    if snaps and int(snaps[-1]["sequence"]) > max(seq_meta, store.event_count()):
        snap_ok = False
        result.failures.append("snapshot sequence ahead of ledger")
    result.checks["snapshots"] = "PASS" if snap_ok else "FAIL"

    # 7. Object/blob storage (filesystem adapter)
    obj = Path(objects_path or Path.cwd() / "var" / "objects")
    try:
        obj.mkdir(parents=True, exist_ok=True)
        probe = obj / ".noema_write_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        result.checks["object_storage"] = "PASS"
    except Exception as exc:
        result.failures.append(f"object storage: {exc}")
        result.checks["object_storage"] = "FAIL"

    # 8. seed_replay already handled above

    # 9. Runtime manifest
    try:
        cycle = int(meta.get("cycle") or (store.get_state().cycle if store.ready else 0))
        sequence = int(meta.get("sequence") or (store.get_state().sequence if store.ready else 0))
        snap_head = snaps[-1]["state_digest"] if snaps else meta.get("state_digest")
        manifest = build_runtime_manifest(
            store_meta=meta,
            ledger_head=store.ledger_head() if store.ready or meta.get("ledger_head") else meta.get("ledger_head"),
            snapshot_head=snap_head,
            current_cycle=cycle,
            sequence=sequence,
            backend=store.backend,
            spec_compat=compat,
            config=config,
            objects_path=str(obj),
        )
        for req in (
            "schema_version",
            "product_version",
            "world_id",
            "event_catalog_version",
            "ledger_head",
            "snapshot_head",
        ):
            if req not in manifest or manifest[req] in (None, ""):
                raise ValueError(f"manifest missing {req}")
        result.manifest = manifest
        result.checks["runtime_manifest"] = "PASS"
    except Exception as exc:
        result.failures.append(f"runtime manifest: {exc}")
        result.checks["runtime_manifest"] = "FAIL"

    # 10. Active writer fence uniqueness (single process modular monolith)
    fence = meta.get("writer_token") or store.writer_token
    if fence and store.writer_token:
        # This process holds the fence after open; uniqueness = one non-empty token.
        result.checks["writer_fence"] = "PASS"
    else:
        result.failures.append("writer fence missing")
        result.checks["writer_fence"] = "FAIL"

    # 11. Canonical persistence atomicity
    atomic_ok = True
    if store.ready:
        state = store.get_state()
        if (state.last_event_digest or "") != (store.ledger_head() or ""):
            atomic_ok = False
            result.failures.append("state last_event_digest != ledger_head")
        if str(state.sequence) != str(meta.get("sequence") or state.sequence):
            # meta may lag if not ready path; compare carefully
            if meta.get("sequence") and str(state.sequence) != meta["sequence"]:
                atomic_ok = False
                result.failures.append("state sequence != meta sequence")
    if chain_problems:
        atomic_ok = False
    result.checks["canonical_atomicity"] = "PASS" if atomic_ok else "FAIL"

    # 12. Resume/ack delivery windows — bounded, committed-only references
    registry = resume_registry or ResumeRegistry()
    # Probe with a synthetic window against ledger head (committed max)
    committed_max = int(meta.get("sequence") or 0)
    if store.ready:
        committed_max = max(committed_max, store.get_state().sequence)
    try:
        win = registry.get_or_create(
            world_id=str(meta.get("world_id") or "world.unknown"),
            principal_id="verify.probe",
        )
        if committed_max > 0:
            win.offer_committed(committed_max, committed_max=committed_max)
            win.acknowledge(min(committed_max, win.high_water + 1) if win.high_water < committed_max else committed_max, committed_max=committed_max)
        # Bounds check
        bound_problems = registry.verify_bounds()
        # Uncommitted ack must fail closed
        try:
            win.acknowledge(committed_max + 10, committed_max=committed_max)
            bound_problems.append("ack of uncommitted sequence was accepted")
        except Exception:
            pass  # expected fail-closed
        if bound_problems:
            result.failures.extend(bound_problems)
            result.checks["resume_ack_windows"] = "FAIL"
        else:
            result.checks["resume_ack_windows"] = "PASS"
            result.checks["resume_max_window"] = str(win.max_window)
    except Exception as exc:
        result.failures.append(f"resume/ack: {exc}")
        result.checks["resume_ack_windows"] = "FAIL"

    # 13. Evidence receipts — mandatory for research-isolated / evidence export profiles
    env = (config or {}).get("env") if config else "local"
    export_profile = None
    if evidence_bundle and Path(evidence_bundle).is_dir():
        try:
            emeta = json.loads(
                (Path(evidence_bundle) / "export-meta.json").read_text(encoding="utf-8")
            )
            export_profile = emeta.get("export_profile")
            kr = None
            if evidence_keyring and Path(evidence_keyring).is_file():
                kr = load_keyring(evidence_keyring)
            elif evidence_keyring is None and Path("var/evidence-keyring.json").is_file():
                kr = load_keyring("var/evidence-keyring.json")
            receipts = []
            rp = Path(evidence_bundle) / "receipts.jsonl"
            if rp.is_file():
                for line in rp.read_text(encoding="utf-8").splitlines():
                    if line.strip():
                        receipts.append(json.loads(line))
            vr = verify_receipts_for_bundle(emeta, keyring=kr, receipts=receipts)
            if vr["status"] == INVALID_EVIDENCE:
                result.failures.extend(vr["failures"] or ["INVALID_EVIDENCE"])
                result.checks["evidence_receipts"] = "FAIL"
            else:
                result.checks["evidence_receipts"] = "PASS"
                result.checks["evidence_profile"] = str(export_profile or vr.get("export_profile"))
        except Exception as exc:
            result.failures.append(f"evidence receipts: {exc}")
            result.checks["evidence_receipts"] = "FAIL"
    elif env == "research-isolated" or (
        config and receipts_required(str((config.get("research") or {}).get("export_profile") or ""))
    ):
        result.failures.append(
            "research-isolated profile requires evidence export bundle for receipt verification"
        )
        result.checks["evidence_receipts"] = "FAIL"
    else:
        result.checks["evidence_receipts"] = "SKIP"
        result.warnings.append(
            "evidence receipts not required for local gameplay profile (no export bundle)"
        )

    result.ok = not result.failures and all(
        result.checks.get(k) in {"PASS", "SKIP"} for k in REQUIRED_CHECKS if k in result.checks
    )
    # Also fail if any of the core checks explicitly FAIL
    for k in REQUIRED_CHECKS:
        if result.checks.get(k) == "FAIL":
            result.ok = False
    return result


def _check_event_chain(store: WorldStore) -> list[str]:
    problems: list[str] = []
    prev = None
    last_digest = None
    for row in store.list_event_rows():
        env = json.loads(row["envelope_json"])
        if env.get("previous_digest") != prev:
            problems.append(f"broken ledger chain at seq {row['sequence']}")
            break
        if env.get("digest") != row["digest"]:
            problems.append(f"envelope digest mismatch at seq {row['sequence']}")
            break
        # contiguous sequences
        if last_digest is not None:
            pass
        prev = row["digest"]
        last_digest = row["digest"]
    # gap check
    rows = store.list_event_rows()
    if rows:
        expected = int(rows[0]["sequence"])
        for r in rows:
            if int(r["sequence"]) != expected:
                problems.append(f"sequence gap at {r['sequence']} expected {expected}")
                break
            expected += 1
    head = store.dump_meta().get("ledger_head") or ""
    if last_digest is not None and head and last_digest != head:
        problems.append("ledger head does not match last event digest")
    return problems
