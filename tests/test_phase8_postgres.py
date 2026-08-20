"""Phase 8: dual-backend persistence (SQLite local + PostgreSQL production)."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.persistence.store import WorldStore, is_postgres_url, open_store
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"

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


requires_postgres = pytest.mark.skipif(
    not _pg_available(),
    reason="NOEMA_TEST_PG_DSN not set or PostgreSQL unreachable (optional for local PLAY)",
)


def test_is_postgres_url_detection():
    assert is_postgres_url("postgresql://noema:noema@localhost/noema")
    assert is_postgres_url("postgres://u:p@h/db")
    assert is_postgres_url("postgresql+psycopg://u:p@h/db")
    assert not is_postgres_url(":memory:")
    assert not is_postgres_url("data/noema.sqlite3")
    assert not is_postgres_url("/tmp/world.db")


def test_open_store_sqlite_default(tmp_path: Path):
    store = open_store(tmp_path / "local.db")
    assert store.backend == "sqlite"
    assert store.writer_token
    store.close()


def test_sqlite_serializable_cycle_and_restart(tmp_path: Path):
    db = tmp_path / "world.sqlite3"
    rt = NoemaRuntime(db_path=db)
    assert rt.store.backend == "sqlite"
    start = rt.start_world(FIXTURES / "world-seed.json")
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
    assert r["commit"]["backend"] == "sqlite"
    head = rt.store.ledger_head()
    seq = rt.store.get_state().sequence
    digest = sha256_digest(rt.acceptance_view())
    rt.store.close()

    rt2 = NoemaRuntime(db_path=db)
    resumed = rt2.resume_world(FIXTURES / "world-seed.json")
    assert resumed["sequence"] == seq
    assert resumed["ledger_head"] == head
    assert sha256_digest(rt2.acceptance_view()) == digest
    assert rt2.store.verify_consistency() == []
    rt2.store.close()


def test_stale_revision_rejected(tmp_path: Path):
    store = WorldStore(tmp_path / "fence.db")
    store.load_from_seed(FIXTURES / "world-seed.json")
    state = store.get_state()
    # Corrupt expected sequence in DB to simulate concurrent writer head move.
    store._set_meta("sequence", "999")
    store._commit()
    with pytest.raises(RuntimeError, match="STALE_REVISION"):
        store.commit_cycle(state, [], snapshot=True)
    store.close()


@requires_postgres
@pytest.mark.postgres
def test_postgres_backend_play_restart_and_serializable():
    # Isolate each run with a unique schema to avoid cross-test pollution.
    schema = f"noema_t_{uuid.uuid4().hex[:12]}"
    import psycopg

    with psycopg.connect(PG_DSN, autocommit=True) as admin:
        admin.execute(f"CREATE SCHEMA {schema}")

    # Schema-qualified DSN via options search_path
    sep = "&" if "?" in PG_DSN else "?"
    dsn = f"{PG_DSN}{sep}options=-csearch_path%3D{schema}"

    try:
        rt = NoemaRuntime(db_path=dsn)
        assert rt.store.backend == "postgres"
        start = rt.start_world(FIXTURES / "world-seed.json")
        assert start["catalog_version"] == "event-catalog/0.1"

        sess = rt.create_session(role=Role.AGENT, agent_id="agent.player.1")
        sid = sess["session_id"]

        def act(verb: str, seq: int, **params):
            return rt.apply_player_action(
                sid,
                {
                    "verb": verb,
                    "agent_id": "agent.player.1",
                    "client_action_sequence": seq,
                    "action_id": f"act.{seq}",
                    "idempotency_key": f"idem.{seq}",
                    "parameters": params,
                },
            )

        r1 = act("ENTER_WORLD", 1)
        assert r1["results"][0]["status"] == "APPLIED"
        assert r1["commit"]["backend"] == "postgres"
        act("LOOK", 2, attention_spent=1)
        act("WAIT", 3, cycles=1)

        head = rt.store.ledger_head()
        seq = rt.store.get_state().sequence
        digest = sha256_digest(rt.acceptance_view())
        assert head
        assert seq >= 2
        assert rt.store.verify_consistency() == []

        # research index path also works on PG
        trajs = rt.store.list_trajectories()
        assert isinstance(trajs, list)

        rt.store.close()

        rt2 = NoemaRuntime(db_path=dsn)
        resumed = rt2.resume_world(FIXTURES / "world-seed.json")
        assert resumed["sequence"] == seq
        assert resumed["ledger_head"] == head
        assert sha256_digest(rt2.acceptance_view()) == digest
        assert rt2.store.verify_consistency() == []
        assert rt2.store.backend == "postgres"
        # writer fence reclaimed by new process
        assert rt2.store.writer_token
        rt2.store.close()
    finally:
        with psycopg.connect(PG_DSN, autocommit=True) as admin:
            admin.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")


@requires_postgres
@pytest.mark.postgres
def test_postgres_stale_writer_fence():
    schema = f"noema_f_{uuid.uuid4().hex[:12]}"
    import psycopg

    with psycopg.connect(PG_DSN, autocommit=True) as admin:
        admin.execute(f"CREATE SCHEMA {schema}")
    sep = "&" if "?" in PG_DSN else "?"
    dsn = f"{PG_DSN}{sep}options=-csearch_path%3D{schema}"
    try:
        store = open_store(dsn)
        store.load_from_seed(FIXTURES / "world-seed.json")
        state = store.get_state()
        store._set_meta("writer_token", "other-writer")
        store._commit()
        with pytest.raises(RuntimeError, match="STALE_WRITER_FENCE"):
            store.commit_cycle(state, [], snapshot=True)
        store.close()
    finally:
        with psycopg.connect(PG_DSN, autocommit=True) as admin:
            admin.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
