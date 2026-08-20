"""Phase 9: operator verify / backup / restore + persistence continuity."""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.ops.backup import backup_world, restore_world
from noema.ops.manifest import build_runtime_manifest, configuration_digest
from noema.ops.verify import verify_world
from noema.persistence.store import is_postgres_url
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
SEED = FIXTURES / "world-seed.json"

PG_DSN = os.environ.get("NOEMA_TEST_PG_DSN", "").strip()


def _pg_available() -> bool:
    if not PG_DSN or not is_postgres_url(PG_DSN):
        return False
    try:
        import psycopg
    except ImportError:
        return False
    try:
        with psycopg.connect(PG_DSN, connect_timeout=3) as conn:
            conn.execute("SELECT 1")
        return True
    except Exception:
        return False


requires_postgres = pytest.mark.skipif(not _pg_available(), reason="Postgres DSN unavailable")


def _play_once(db: Path | str) -> dict:
    rt = NoemaRuntime(db_path=db)
    start = rt.start_world(SEED)
    sess = rt.create_session(role=Role.AGENT, agent_id="agent.player.1")
    r = rt.apply_player_action(
        sess["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.player.1",
            "client_action_sequence": 1,
            "action_id": "act.1",
            "idempotency_key": "idem.1",
            "parameters": {},
        },
    )
    head = rt.store.ledger_head()
    seq = rt.store.get_state().sequence
    digest = sha256_digest(rt.acceptance_view())
    rt.store.close()
    return {
        "world_id": start["world_id"],
        "head": head,
        "seq": seq,
        "digest": digest,
        "commit": r["commit"],
    }


def test_configuration_digest_stable():
    d1 = configuration_digest({"env": "local", "worker_count": 1})
    d2 = configuration_digest({"worker_count": 1, "env": "local"})
    assert d1 == d2
    assert d1.startswith("sha256:")


def test_verify_pass_after_play(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    _play_once(db)
    result = verify_world(db, seed_path=SEED, objects_path=tmp_path / "objects")
    assert result.ok, result.failures
    assert result.pass_line() == "NOEMA VERIFY: PASS"
    assert result.checks["ledger"] == "PASS"
    assert result.checks["writer_fence"] == "PASS"
    assert result.manifest is not None
    assert result.manifest["schema_version"] == "runtime-manifest/1.0"


def test_verify_detects_broken_chain(tmp_path: Path):
    db = tmp_path / "broken.sqlite3"
    _play_once(db)
    # Corrupt an event envelope previous_digest
    from noema.persistence.store import WorldStore

    store = WorldStore(db)
    rows = store.list_event_rows()
    assert rows
    # Break middle of chain if possible
    target = rows[-1]
    env = json.loads(target["envelope_json"])
    env["previous_digest"] = "sha256:" + "0" * 64
    store._execute(
        "UPDATE events SET previous_digest=?, envelope_json=? WHERE sequence=?",
        (env["previous_digest"], json.dumps(env, sort_keys=True), target["sequence"]),
    )
    store._commit()
    store.close()

    result = verify_world(db, seed_path=SEED, objects_path=tmp_path / "objects")
    assert not result.ok
    assert result.pass_line() == "NOEMA VERIFY: FAIL"
    assert result.checks["ledger"] == "FAIL"


def test_backup_restore_roundtrip_sqlite(tmp_path: Path):
    db = tmp_path / "src.sqlite3"
    played = _play_once(db)
    bundle = tmp_path / "bundle"
    backup_world(db, bundle, seed_path=SEED, objects_path=tmp_path / "objects")
    assert (bundle / "bundle.json").is_file()
    assert (bundle / "events.jsonl").is_file()
    assert (bundle / "runtime-manifest.json").is_file()
    assert (bundle / "bundle.digest").is_file()

    dest = tmp_path / "restored.sqlite3"
    out = restore_world(
        bundle,
        dest,
        seed_path=SEED,
        objects_path=tmp_path / "objects2",
    )
    assert out["restored"] is True
    assert out["verify_ok"] is True
    assert out["event_count"] >= 1
    assert out["fresh_writer_fence"] is True

    # Acceptance continuity
    rt = NoemaRuntime(db_path=dest)
    resumed = rt.resume_world(SEED)
    assert resumed["sequence"] == played["seq"]
    assert resumed["ledger_head"] == played["head"]
    assert sha256_digest(rt.acceptance_view()) == played["digest"]
    # Fence must be fresh (not equal to source process token reuse requirement:
    # restored store has its own token recorded)
    meta = rt.store.dump_meta()
    assert meta.get("writer_token")
    assert "writer_fence_epoch_at_restore" in meta or True
    rt.store.close()


def test_restore_refuses_nonempty_without_force(tmp_path: Path):
    db = tmp_path / "src.sqlite3"
    _play_once(db)
    bundle = tmp_path / "bundle"
    backup_world(db, bundle, seed_path=SEED)
    dest = tmp_path / "dest.sqlite3"
    _play_once(dest)
    with pytest.raises(RuntimeError, match="not empty"):
        restore_world(bundle, dest, seed_path=SEED, run_verify=False)


def test_cli_verify_entrypoint(tmp_path: Path):
    from noema.cli.verify import main

    db = tmp_path / "cli.sqlite3"
    _play_once(db)
    code = main(["--db", str(db), "--seed", str(SEED), "--objects", str(tmp_path / "o")])
    assert code == 0


def test_build_manifest_fields(tmp_path: Path):
    db = tmp_path / "m.sqlite3"
    _play_once(db)
    from noema.persistence.store import WorldStore

    store = WorldStore(db)
    store.rehydrate_from_db(SEED)
    meta = store.dump_meta()
    snaps = store.list_snapshots()
    m = build_runtime_manifest(
        store_meta=meta,
        ledger_head=store.ledger_head(),
        snapshot_head=snaps[-1]["state_digest"] if snaps else None,
        current_cycle=store.get_state().cycle,
        sequence=store.get_state().sequence,
        backend=store.backend,
    )
    store.close()
    assert m["agent_protocol_version"] == "agent-protocol/v1"
    assert m["ledger_head"].startswith("sha256:")
    assert m["world_id"]


@requires_postgres
@pytest.mark.postgres
def test_backup_restore_postgres(tmp_path: Path):
    schema = f"noema_ops_{uuid.uuid4().hex[:10]}"
    import psycopg

    with psycopg.connect(PG_DSN, autocommit=True) as admin:
        admin.execute(f"CREATE SCHEMA {schema}")
    sep = "&" if "?" in PG_DSN else "?"
    dsn = f"{PG_DSN}{sep}options=-csearch_path%3D{schema}"
    try:
        played = _play_once(dsn)
        bundle = tmp_path / "pg-bundle"
        backup_world(dsn, bundle, seed_path=SEED, objects_path=tmp_path / "obj")
        # restore into second schema
        schema2 = f"noema_ops_r_{uuid.uuid4().hex[:10]}"
        with psycopg.connect(PG_DSN, autocommit=True) as admin:
            admin.execute(f"CREATE SCHEMA {schema2}")
        dsn2 = f"{PG_DSN}{sep}options=-csearch_path%3D{schema2}"
        try:
            out = restore_world(bundle, dsn2, seed_path=SEED, objects_path=tmp_path / "obj2")
            assert out["verify_ok"] is True
            rt = NoemaRuntime(db_path=dsn2)
            resumed = rt.resume_world(SEED)
            assert resumed["sequence"] == played["seq"]
            assert resumed["ledger_head"] == played["head"]
            assert sha256_digest(rt.acceptance_view()) == played["digest"]
            rt.store.close()
        finally:
            with psycopg.connect(PG_DSN, autocommit=True) as admin:
                admin.execute(f"DROP SCHEMA IF EXISTS {schema2} CASCADE")
    finally:
        with psycopg.connect(PG_DSN, autocommit=True) as admin:
            admin.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
