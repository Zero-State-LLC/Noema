"""World + research persistence with dual backends.

Local PLAY defaults to SQLite (`BEGIN IMMEDIATE`).
Production reference path uses PostgreSQL with cycle commits under
`SERIALIZABLE` isolation (Noema-Specs DEPLOYMENT / RFC-0003).

One fenced writer per process; research_* tables are rebuildable indexes.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from pathlib import Path
from typing import Any, Literal

from noema.world.digest import sha256_digest
from noema.world.state import WorldState, acceptance_projection, load_seed

Backend = Literal["sqlite", "postgres"]

_PG_URL_PREFIXES = ("postgresql://", "postgres://", "postgresql+", "postgres+")


def is_postgres_url(value: str | Path) -> bool:
    s = str(value).strip()
    return s.startswith(_PG_URL_PREFIXES)


def open_store(path_or_url: Path | str = ":memory:") -> "WorldStore":
    """Open a WorldStore from a filesystem path, `:memory:`, or Postgres DSN."""
    return WorldStore(path_or_url)


def _normalize_pg_dsn(url: str) -> str:
    """Strip SQLAlchemy-style driver suffixes (postgresql+psycopg:// → postgresql://)."""
    s = url.strip()
    if s.startswith("postgresql+"):
        # postgresql+psycopg://host/db → postgresql://host/db
        rest = s.split("://", 1)[1] if "://" in s else s
        return "postgresql://" + rest
    if s.startswith("postgres+"):
        rest = s.split("://", 1)[1] if "://" in s else s
        return "postgresql://" + rest
    if s.startswith("postgres://"):
        return "postgresql://" + s[len("postgres://") :]
    return s


class WorldStore:
    """Single fenced writer store per process (SQLite or PostgreSQL)."""

    def __init__(self, path: Path | str = ":memory:"):
        self.path = str(path)
        self._lock = threading.RLock()
        self._state: WorldState | None = None
        self._ready = False
        self.writer_token = uuid.uuid4().hex
        self.backend: Backend
        self._conn: Any

        if is_postgres_url(self.path):
            self.backend = "postgres"
            self._conn = self._connect_postgres(self.path)
        else:
            self.backend = "sqlite"
            self._conn = sqlite3.connect(self.path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
        self._init_schema()
        self._claim_writer()

    def _connect_postgres(self, url: str) -> Any:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:  # pragma: no cover - optional dep path
            raise RuntimeError(
                "PostgreSQL backend requires psycopg: pip install 'noema[postgres]'"
            ) from exc
        dsn = _normalize_pg_dsn(url)
        # autocommit=True so reads do not leave an open transaction that blocks
        # BEGIN ISOLATION LEVEL SERIALIZABLE on cycle commits.
        return psycopg.connect(dsn, row_factory=dict_row, autocommit=True)

    # --- dialect helpers -------------------------------------------------

    def _sql(self, statement: str) -> str:
        if self.backend == "postgres":
            return statement.replace("?", "%s")
        return statement

    def _execute(self, sql: str, params: tuple[Any, ...] | list[Any] = ()) -> Any:
        return self._conn.execute(self._sql(sql), params)

    def _executemany(self, sql: str, seq: list[tuple[Any, ...]]) -> Any:
        return self._conn.executemany(self._sql(sql), seq)

    def _begin_write(self) -> None:
        """Start a fenced write transaction (SQLite exclusive / PG SERIALIZABLE)."""
        if self.backend == "sqlite":
            self._conn.execute("BEGIN IMMEDIATE")
        else:
            self._conn.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")

    def _commit(self) -> None:
        if self.backend == "sqlite":
            self._conn.commit()
            return
        # Postgres autocommit=True: only COMMIT when an explicit cycle/txn is open.
        if self._pg_in_transaction():
            self._conn.execute("COMMIT")

    def _pg_in_transaction(self) -> bool:
        # psycopg TransactionStatus: 0=IDLE, 1=ACTIVE, 2=INTRANS, 3=INERROR, 4=UNKNOWN
        try:
            from psycopg.pq import TransactionStatus

            return self._conn.info.transaction_status != TransactionStatus.IDLE
        except Exception:
            try:
                return int(self._conn.info.transaction_status) != 0
            except Exception:
                return False

    def _rollback(self) -> None:
        if self.backend == "sqlite":
            self._conn.rollback()
            return
        try:
            if self._pg_in_transaction():
                self._conn.execute("ROLLBACK")
        except Exception:
            pass

    def _upsert(
        self,
        table: str,
        pk: str,
        columns: list[str],
        values: tuple[Any, ...],
        *,
        cur: Any | None = None,
    ) -> None:
        """Portable UPSERT for single-column primary key tables."""
        cols = ", ".join(columns)
        placeholders = ", ".join("?" for _ in columns)
        updates = ", ".join(f"{c}=excluded.{c}" for c in columns if c != pk)
        sql = (
            f"INSERT INTO {table}({cols}) VALUES ({placeholders}) "
            f"ON CONFLICT({pk}) DO UPDATE SET {updates}"
        )
        c = cur or self._conn
        c.execute(self._sql(sql), values)

    def _init_schema(self) -> None:
        ts_default = "datetime('now')" if self.backend == "sqlite" else "NOW()"
        statements = [
            """
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS events (
              sequence INTEGER PRIMARY KEY,
              cycle INTEGER NOT NULL,
              event_id TEXT NOT NULL UNIQUE,
              event_type TEXT NOT NULL,
              digest TEXT NOT NULL,
              previous_digest TEXT,
              envelope_json TEXT NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS snapshots (
              snapshot_id TEXT PRIMARY KEY,
              cycle INTEGER NOT NULL,
              sequence INTEGER NOT NULL,
              state_digest TEXT NOT NULL,
              state_json TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT ({ts_default})
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS sessions (
              session_id TEXT PRIMARY KEY,
              principal_id TEXT NOT NULL,
              role TEXT NOT NULL,
              agent_id TEXT,
              last_request_id TEXT,
              epoch INTEGER NOT NULL DEFAULT 1,
              data_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_trajectories (
              trajectory_id TEXT PRIMARY KEY,
              world_id TEXT NOT NULL,
              from_cycle INTEGER NOT NULL,
              to_cycle INTEGER NOT NULL,
              content_digest TEXT NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_frontier_audit (
              digest TEXT PRIMARY KEY,
              request_id TEXT NOT NULL,
              record_index INTEGER NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_frontier_plans (
              plan_id TEXT PRIMARY KEY,
              request_id TEXT NOT NULL,
              plan_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_observatory_runs (
              analysis_run_id TEXT PRIMARY KEY,
              run_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_observatory_candidates (
              candidate_id TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              analysis_run_id TEXT NOT NULL,
              candidate_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_observatory_audit (
              digest TEXT PRIMARY KEY,
              analysis_run_id TEXT NOT NULL,
              record_index INTEGER NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_lab_experiments (
              experiment_id TEXT PRIMARY KEY,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_lab_results (
              lab_result_id TEXT PRIMARY KEY,
              experiment_id TEXT NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_lab_audit (
              digest TEXT PRIMARY KEY,
              experiment_id TEXT NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_compiler_results (
              compiler_result_id TEXT PRIMARY KEY,
              compile_id TEXT NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_captured_tests (
              captured_test_id TEXT PRIMARY KEY,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_compiler_audit (
              digest TEXT PRIMARY KEY,
              compile_id TEXT NOT NULL,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_learn_behaviors (
              behavior_id TEXT PRIMARY KEY,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_learn_edges (
              edge_id TEXT PRIMARY KEY,
              record_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS research_learn_graphs (
              graph_digest TEXT PRIMARY KEY,
              record_json TEXT NOT NULL
            )
            """,
            # Identity plane (AUTH-AND-IDENTITY) — separate from protocol `sessions`
            """
            CREATE TABLE IF NOT EXISTS id_accounts (
              account_id TEXT PRIMARY KEY,
              status TEXT NOT NULL,
              external_auth_subject TEXT,
              created_at INTEGER NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS id_players (
              player_id TEXT PRIMARY KEY,
              account_id TEXT NOT NULL,
              handle TEXT NOT NULL,
              display_name TEXT,
              agent_id TEXT,
              status TEXT NOT NULL,
              created_at INTEGER NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS id_controllers (
              controller_id TEXT PRIMARY KEY,
              player_id TEXT NOT NULL,
              type TEXT NOT NULL,
              provider TEXT,
              metadata_json TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              revoked_at INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS id_credentials (
              credential_id TEXT PRIMARY KEY,
              controller_id TEXT NOT NULL,
              kind TEXT NOT NULL,
              scopes_json TEXT NOT NULL,
              fingerprint TEXT NOT NULL,
              issued_at INTEGER NOT NULL,
              expires_at INTEGER,
              revoked_at INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS id_device_codes (
              device_code TEXT PRIMARY KEY,
              user_code TEXT NOT NULL,
              scopes_json TEXT NOT NULL,
              metadata_json TEXT NOT NULL,
              status TEXT NOT NULL,
              player_id TEXT,
              controller_id TEXT,
              created_at INTEGER NOT NULL,
              expires_at INTEGER NOT NULL,
              interval_sec INTEGER NOT NULL DEFAULT 5,
              payload_json TEXT
            )
            """,
        ]
        for stmt in statements:
            self._conn.execute(stmt.strip())
        # indexes (ignore if backend lacks IF NOT EXISTS on index — both support it)
        for idx in (
            "CREATE INDEX IF NOT EXISTS idx_id_accounts_subject ON id_accounts(external_auth_subject)",
            "CREATE INDEX IF NOT EXISTS idx_id_players_account ON id_players(account_id)",
            "CREATE INDEX IF NOT EXISTS idx_id_controllers_player ON id_controllers(player_id)",
            "CREATE INDEX IF NOT EXISTS idx_id_credentials_fp ON id_credentials(fingerprint)",
            "CREATE INDEX IF NOT EXISTS idx_id_device_user ON id_device_codes(user_code)",
        ):
            self._conn.execute(idx)
        self._commit()

    def _claim_writer(self) -> None:
        """Record process writer fence token (one active writer per world store)."""
        with self._lock:
            self._set_meta("writer_token", self.writer_token)
            self._set_meta("backend", self.backend)
            self._commit()

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    @property
    def ready(self) -> bool:
        return self._ready and self._state is not None

    def has_started_world(self) -> bool:
        """True once a seed has recorded world identity in meta."""
        with self._lock:
            return bool(self._get_meta("world_id"))

    def committed_event_count(self) -> int:
        with self._lock:
            row = self._execute("SELECT COUNT(*) AS n FROM events").fetchone()
            if row is None:
                return 0
            return int(row["n"])

    def load_from_seed(self, seed_path: Path | str, *, world_id: str | None = None) -> WorldState:
        with self._lock:
            state = load_seed(seed_path)
            if world_id:
                state.world_id = world_id
            self._state = state
            self._ready = True
            self._set_meta("world_id", state.world_id)
            self._set_meta("catalog_version", state.catalog_version)
            self._set_meta("world_version", state.world_version)
            self._set_meta("seed", state.seed)
            self._set_meta("seed_path", str(seed_path))
            self._set_meta("ledger_head", state.last_event_digest or "")
            self._set_meta("sequence", str(state.sequence))
            self._set_meta("cycle", str(state.cycle))
            self._set_meta("writer_token", self.writer_token)
            self._commit()
            return state.clone()

    def rehydrate_from_db(self, seed_path: Path | str | None = None) -> WorldState:
        """Restart recovery: seed + ledger replay, merging registered agents from latest snapshot."""
        from noema.world.reduce import apply_event

        with self._lock:
            seed = seed_path or self._get_meta("seed_path")
            if not seed:
                raise RuntimeError("no seed_path recorded for rehydrate")
            state = load_seed(seed)
            row = self._execute(
                "SELECT state_json FROM snapshots ORDER BY sequence DESC LIMIT 1"
            ).fetchone()
            if row:
                snap = json.loads(row["state_json"])
                for aid, rec in (snap.get("registered_agents") or {}).items():
                    state.registered_agents.setdefault(aid, rec)
            for erow in self._execute(
                "SELECT envelope_json FROM events ORDER BY sequence ASC"
            ):
                state = apply_event(state, json.loads(erow["envelope_json"]))
            self._state = state
            self._ready = True
            # Keep meta revision in lockstep with the replayed ledger. A seed
            # reload that left events in place used to reset sequence to 0 and
            # make the next ENTER_WORLD collide on events.sequence.
            head = state.last_event_digest or ""
            self._set_meta("ledger_head", head)
            self._set_meta("sequence", str(state.sequence))
            self._set_meta("cycle", str(state.cycle))
            self._set_meta("state_digest", sha256_digest(acceptance_projection(state)))
            self._set_meta("writer_token", self.writer_token)
            self._commit()
            return state.clone()

    def _get_meta(self, key: str) -> str | None:
        row = self._execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return row["value"] if row else None

    def get_state(self) -> WorldState:
        with self._lock:
            if not self._state:
                raise RuntimeError("WORLD_NOT_READY")
            return self._state.clone()

    def commit_cycle(
        self,
        new_state: WorldState,
        events: list[dict[str, Any]],
        *,
        snapshot: bool = False,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Atomically append events and replace canonical state (fenced writer).

        PostgreSQL path uses SERIALIZABLE isolation; serialization failures retry
        from the unchanged in-memory head or fail closed (no partial commits).
        """
        with self._lock:
            if not self._state:
                raise RuntimeError("WORLD_NOT_READY")
            last_err: Exception | None = None
            for attempt in range(max_retries):
                try:
                    return self._commit_cycle_once(new_state, events, snapshot=snapshot)
                except Exception as exc:
                    self._rollback()
                    if self.backend == "postgres" and _is_serialization_failure(exc):
                        last_err = exc
                        continue
                    raise
            raise RuntimeError(
                f"SERIALIZATION_FAILURE after {max_retries} attempts: {last_err}"
            )

    def _commit_cycle_once(
        self,
        new_state: WorldState,
        events: list[dict[str, Any]],
        *,
        snapshot: bool,
    ) -> dict[str, Any]:
        prior = self._state
        cur = self._conn.cursor() if self.backend == "sqlite" else self._conn
        try:
            self._begin_write()
            # Expected revision + writer fence (RFC-0003 / DEPLOYMENT).
            db_seq = self._get_meta("sequence")
            expected_seq = str(prior.sequence if prior else 0)
            if db_seq is not None and db_seq != expected_seq:
                raise RuntimeError(
                    f"STALE_REVISION: db sequence={db_seq} expected={expected_seq}"
                )
            fence = self._get_meta("writer_token")
            if fence and fence != self.writer_token:
                raise RuntimeError("STALE_WRITER_FENCE: another writer holds the world")

            for event in events:
                cur.execute(
                    self._sql(
                        """
                        INSERT INTO events(sequence, cycle, event_id, event_type, digest, previous_digest, envelope_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """
                    ),
                    (
                        int(event["sequence"]),
                        int(event["cycle"]),
                        event["event_id"],
                        event["event_type"],
                        event["digest"],
                        event.get("previous_digest"),
                        json.dumps(event, sort_keys=True),
                    ),
                )
            head = new_state.last_event_digest or ""
            self._set_meta("ledger_head", head, cur=cur)
            self._set_meta("sequence", str(new_state.sequence), cur=cur)
            self._set_meta("cycle", str(new_state.cycle), cur=cur)
            self._set_meta("writer_token", self.writer_token, cur=cur)
            view = acceptance_projection(new_state)
            digest = sha256_digest(view)
            self._set_meta("state_digest", digest, cur=cur)
            snap_id = None
            if snapshot or not events:
                snap_id = f"snap.{new_state.sequence}"
                self._upsert(
                    "snapshots",
                    "snapshot_id",
                    ["snapshot_id", "cycle", "sequence", "state_digest", "state_json"],
                    (
                        snap_id,
                        new_state.cycle,
                        new_state.sequence,
                        digest,
                        json.dumps(self._serialize_state(new_state), sort_keys=True),
                    ),
                    cur=cur,
                )
            self._commit()
            self._state = new_state
            return {
                "ledger_head": head,
                "sequence": new_state.sequence,
                "cycle": new_state.cycle,
                "state_digest": digest,
                "snapshot_id": snap_id,
                "event_count": len(events),
                "backend": self.backend,
            }
        except Exception:
            self._state = prior
            self._rollback()
            raise

    def ledger_head(self) -> str | None:
        with self._lock:
            row = self._execute("SELECT value FROM meta WHERE key=?", ("ledger_head",)).fetchone()
            if not row:
                return None
            return row["value"] or None

    def list_events(self, *, after_sequence: int = 0, limit: int = 100) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute(
                "SELECT envelope_json FROM events WHERE sequence > ? ORDER BY sequence ASC LIMIT ?",
                (after_sequence, limit),
            ).fetchall()
            return [json.loads(r["envelope_json"]) for r in rows]

    # --- identity plane ---------------------------------------------------

    def identity_upsert_account(self, row: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "id_accounts",
                "account_id",
                ["account_id", "status", "external_auth_subject", "created_at"],
                (
                    row["account_id"],
                    row.get("status") or "active",
                    row.get("external_auth_subject"),
                    int(row.get("created_at") or 0),
                ),
            )
            self._commit()

    def identity_get_account_by_subject(self, subject: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT account_id, status, external_auth_subject, created_at FROM id_accounts WHERE external_auth_subject=?",
                (subject,),
            ).fetchone()
            return dict(r) if r else None

    def identity_upsert_player(self, row: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "id_players",
                "player_id",
                [
                    "player_id",
                    "account_id",
                    "handle",
                    "display_name",
                    "agent_id",
                    "status",
                    "created_at",
                ],
                (
                    row["player_id"],
                    row["account_id"],
                    row["handle"],
                    row.get("display_name"),
                    row.get("agent_id"),
                    row.get("status") or "active",
                    int(row.get("created_at") or 0),
                ),
            )
            self._commit()

    def identity_get_player(self, player_id: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT player_id, account_id, handle, display_name, agent_id, status, created_at FROM id_players WHERE player_id=?",
                (player_id,),
            ).fetchone()
            return dict(r) if r else None

    def identity_list_players(self, account_id: str) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute(
                "SELECT player_id, account_id, handle, display_name, agent_id, status, created_at FROM id_players WHERE account_id=?",
                (account_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def identity_upsert_controller(self, row: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "id_controllers",
                "controller_id",
                [
                    "controller_id",
                    "player_id",
                    "type",
                    "provider",
                    "metadata_json",
                    "created_at",
                    "revoked_at",
                ],
                (
                    row["controller_id"],
                    row["player_id"],
                    row["type"],
                    row.get("provider") or "",
                    row.get("metadata_json") or "{}",
                    int(row.get("created_at") or 0),
                    row.get("revoked_at"),
                ),
            )
            self._commit()

    def identity_get_controller(self, controller_id: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT controller_id, player_id, type, provider, metadata_json, created_at, revoked_at FROM id_controllers WHERE controller_id=?",
                (controller_id,),
            ).fetchone()
            return dict(r) if r else None

    def identity_list_controllers(self, player_id: str) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute(
                "SELECT controller_id, player_id, type, provider, metadata_json, created_at, revoked_at FROM id_controllers WHERE player_id=?",
                (player_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def identity_upsert_credential(self, row: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "id_credentials",
                "credential_id",
                [
                    "credential_id",
                    "controller_id",
                    "kind",
                    "scopes_json",
                    "fingerprint",
                    "issued_at",
                    "expires_at",
                    "revoked_at",
                ],
                (
                    row["credential_id"],
                    row["controller_id"],
                    row["kind"],
                    row.get("scopes_json") or "[]",
                    row["fingerprint"],
                    int(row.get("issued_at") or 0),
                    row.get("expires_at"),
                    row.get("revoked_at"),
                ),
            )
            self._commit()

    def identity_get_credential_by_fingerprint(self, fingerprint: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT credential_id, controller_id, kind, scopes_json, fingerprint, issued_at, expires_at, revoked_at FROM id_credentials WHERE fingerprint=?",
                (fingerprint,),
            ).fetchone()
            return dict(r) if r else None

    def identity_revoke_credentials_for_controller(self, controller_id: str) -> None:
        import time as _time

        with self._lock:
            self._execute(
                "UPDATE id_credentials SET revoked_at=? WHERE controller_id=? AND revoked_at IS NULL",
                (int(_time.time()), controller_id),
            )
            self._commit()

    def identity_upsert_device_code(self, row: dict[str, Any]) -> None:
        payload = {
            k: row.get(k)
            for k in ("interval",)
            if row.get(k) is not None
        }
        with self._lock:
            self._upsert(
                "id_device_codes",
                "device_code",
                [
                    "device_code",
                    "user_code",
                    "scopes_json",
                    "metadata_json",
                    "status",
                    "player_id",
                    "controller_id",
                    "created_at",
                    "expires_at",
                    "interval_sec",
                    "payload_json",
                ],
                (
                    row["device_code"],
                    row["user_code"],
                    row.get("scopes_json") or "[]",
                    row.get("metadata_json") or "{}",
                    row.get("status") or "pending",
                    row.get("player_id"),
                    row.get("controller_id"),
                    int(row.get("created_at") or 0),
                    int(row.get("expires_at") or 0),
                    int(row.get("interval") or row.get("interval_sec") or 5),
                    json.dumps(payload, sort_keys=True) if payload else None,
                ),
            )
            self._commit()

    def identity_get_device_by_code(self, device_code: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT device_code, user_code, scopes_json, metadata_json, status, player_id, controller_id, created_at, expires_at, interval_sec, payload_json FROM id_device_codes WHERE device_code=?",
                (device_code,),
            ).fetchone()
            return self._device_row(r) if r else None

    def identity_get_device_by_user_code(self, user_code: str) -> dict[str, Any] | None:
        with self._lock:
            r = self._execute(
                "SELECT device_code, user_code, scopes_json, metadata_json, status, player_id, controller_id, created_at, expires_at, interval_sec, payload_json FROM id_device_codes WHERE user_code=?",
                (user_code,),
            ).fetchone()
            return self._device_row(r) if r else None

    @staticmethod
    def _device_row(r: Any) -> dict[str, Any]:
        d = dict(r)
        d["interval"] = d.pop("interval_sec", 5)
        payload = d.pop("payload_json", None)
        if payload:
            try:
                extra = json.loads(payload)
                extra.pop("access_token", None)
                extra.pop("refresh_token", None)
                d.update(extra)
            except Exception:  # noqa: BLE001
                pass
        return d

    def save_session(self, session_id: str, data: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "sessions",
                "session_id",
                [
                    "session_id",
                    "principal_id",
                    "role",
                    "agent_id",
                    "last_request_id",
                    "epoch",
                    "data_json",
                ],
                (
                    session_id,
                    data.get("principal_id") or "",
                    data.get("role") or "PLAYER",
                    data.get("agent_id"),
                    data.get("last_request_id"),
                    int(data.get("epoch") or 1),
                    json.dumps(data, sort_keys=True),
                ),
            )
            self._commit()

    def load_session(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._execute(
                "SELECT data_json FROM sessions WHERE session_id=?", (session_id,)
            ).fetchone()
            return json.loads(row["data_json"]) if row else None

    def list_sessions(self, *, limit: int = 100) -> list[dict[str, Any]]:
        """Return a bounded, newest-first view of persisted sessions.

        Session records contain connection metadata only. Authentication material is
        never persisted by the runtime, so this is safe for the admin projection.
        The explicit limit keeps the management console from loading an unbounded
        session history into a browser.
        """
        bounded = max(1, min(int(limit), 500))
        with self._lock:
            rows = self._execute(
                "SELECT data_json FROM sessions ORDER BY session_id DESC LIMIT ?",
                (bounded,),
            ).fetchall()
            return [json.loads(r["data_json"]) for r in rows]

    def verify_consistency(self) -> list[str]:
        """Fail-closed recovery checks."""
        problems: list[str] = []
        with self._lock:
            if not self._state:
                problems.append("WORLD_NOT_READY")
                return problems
            head = self.ledger_head()
            if (self._state.last_event_digest or "") != (head or ""):
                problems.append("ledger_head mismatch with in-memory state")
            prev = None
            max_seq = None
            for row in self._execute(
                "SELECT sequence, digest, previous_digest, envelope_json FROM events ORDER BY sequence"
            ):
                env = json.loads(row["envelope_json"])
                max_seq = int(row["sequence"])
                if env.get("previous_digest") != prev:
                    problems.append(f"broken ledger chain at seq {row['sequence']}")
                    break
                prev = row["digest"]
            if max_seq is not None and max_seq != int(self._state.sequence):
                problems.append(
                    f"ledger sequence {max_seq} does not match in-memory sequence {self._state.sequence}"
                )
            meta_seq = self._get_meta("sequence")
            if meta_seq is not None and int(meta_seq) != int(self._state.sequence):
                problems.append(
                    f"meta sequence {meta_seq} does not match in-memory sequence {self._state.sequence}"
                )
            if prev is not None and not head:
                problems.append("ledger has events but ledger_head is empty")
            if prev is not None and prev != (head or None) and head:
                if head and prev != head:
                    problems.append("ledger head does not match last event digest")
            fence = self._get_meta("writer_token")
            if fence and fence != self.writer_token:
                problems.append("writer fence token mismatch")
        return problems

    # --- Research indexes (disposable; rebuildable from ledger) ---

    def save_trajectory(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_trajectories",
                "trajectory_id",
                [
                    "trajectory_id",
                    "world_id",
                    "from_cycle",
                    "to_cycle",
                    "content_digest",
                    "record_json",
                ],
                (
                    record["trajectory_id"],
                    record["world_id"],
                    int(record["from_cycle"]),
                    int(record["to_cycle"]),
                    record.get("content_digest") or "",
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._commit()

    def list_trajectories(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute(
                "SELECT record_json FROM research_trajectories ORDER BY from_cycle, to_cycle"
            ).fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def save_frontier_plan(self, plan: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_frontier_plans",
                "plan_id",
                ["plan_id", "request_id", "plan_json"],
                (
                    plan.get("plan_id") or "",
                    plan.get("request_id") or "",
                    json.dumps(plan, sort_keys=True),
                ),
            )
            self._commit()

    def save_frontier_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_frontier_audit",
                "digest",
                ["digest", "request_id", "record_index", "record_json"],
                (
                    record.get("digest") or "",
                    record.get("request_id") or "",
                    int(record.get("record_index") or 0),
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._commit()

    def list_frontier_audit(self, request_id: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            if request_id:
                rows = self._execute(
                    "SELECT record_json FROM research_frontier_audit WHERE request_id=? ORDER BY record_index",
                    (request_id,),
                ).fetchall()
            else:
                rows = self._execute(
                    "SELECT record_json FROM research_frontier_audit ORDER BY request_id, record_index"
                ).fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def get_frontier_audit(self, digest: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._execute(
                "SELECT record_json FROM research_frontier_audit WHERE digest=?", (digest,)
            ).fetchone()
            return json.loads(row["record_json"]) if row else None

    def save_observatory_run(self, run: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_observatory_runs",
                "analysis_run_id",
                ["analysis_run_id", "run_json"],
                (run.get("analysis_run_id") or "", json.dumps(run, sort_keys=True)),
            )
            self._commit()

    def save_observatory_candidate(self, kind: str, analysis_run_id: str, candidate: dict[str, Any]) -> None:
        with self._lock:
            cid = candidate.get("candidate_id") or candidate.get("unknown_id") or ""
            self._upsert(
                "research_observatory_candidates",
                "candidate_id",
                ["candidate_id", "kind", "analysis_run_id", "candidate_json"],
                (cid, kind, analysis_run_id, json.dumps(candidate, sort_keys=True)),
            )
            self._commit()

    def save_observatory_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_observatory_audit",
                "digest",
                ["digest", "analysis_run_id", "record_index", "record_json"],
                (
                    record.get("digest") or "",
                    record.get("analysis_run_id") or "",
                    int(record.get("record_index") or 0),
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._commit()

    def list_observatory_candidates(self, kind: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            if kind:
                rows = self._execute(
                    "SELECT candidate_json FROM research_observatory_candidates WHERE kind=? ORDER BY candidate_id",
                    (kind,),
                ).fetchall()
            else:
                rows = self._execute(
                    "SELECT candidate_json FROM research_observatory_candidates ORDER BY kind, candidate_id"
                ).fetchall()
            return [json.loads(r["candidate_json"]) for r in rows]

    def list_observatory_runs(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT run_json FROM research_observatory_runs").fetchall()
            return [json.loads(r["run_json"]) for r in rows]

    def clear_research_indexes(self) -> None:
        with self._lock:
            for table in (
                "research_trajectories",
                "research_frontier_audit",
                "research_frontier_plans",
                "research_observatory_runs",
                "research_observatory_candidates",
                "research_observatory_audit",
                "research_lab_experiments",
                "research_lab_results",
                "research_lab_audit",
                "research_compiler_results",
                "research_captured_tests",
                "research_compiler_audit",
                "research_learn_behaviors",
                "research_learn_edges",
                "research_learn_graphs",
            ):
                self._execute(f"DELETE FROM {table}")
            self._commit()

    def save_learn_behavior(self, node: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_learn_behaviors",
                "behavior_id",
                ["behavior_id", "record_json"],
                (node.get("behavior_id") or "", json.dumps(node, sort_keys=True)),
            )
            self._commit()

    def save_learn_edge(self, edge: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_learn_edges",
                "edge_id",
                ["edge_id", "record_json"],
                (edge.get("edge_id") or "", json.dumps(edge, sort_keys=True)),
            )
            self._commit()

    def save_learn_graph(self, graph: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_learn_graphs",
                "graph_digest",
                ["graph_digest", "record_json"],
                (graph.get("digest") or "", json.dumps(graph, sort_keys=True)),
            )
            self._commit()

    def list_learn_behaviors(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT record_json FROM research_learn_behaviors").fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def list_learn_edges(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT record_json FROM research_learn_edges").fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def save_compiler_result(self, result: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_compiler_results",
                "compiler_result_id",
                ["compiler_result_id", "compile_id", "record_json"],
                (
                    result.get("compiler_result_id") or "",
                    result.get("compile_id") or "",
                    json.dumps(result, sort_keys=True),
                ),
            )
            self._commit()

    def save_captured_test(self, captured: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_captured_tests",
                "captured_test_id",
                ["captured_test_id", "record_json"],
                (captured.get("captured_test_id") or "", json.dumps(captured, sort_keys=True)),
            )
            self._commit()

    def save_compiler_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_compiler_audit",
                "digest",
                ["digest", "compile_id", "record_json"],
                (
                    record.get("digest") or "",
                    record.get("compile_id") or "",
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._commit()

    def list_captured_tests(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT record_json FROM research_captured_tests").fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def list_compiler_results(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT record_json FROM research_compiler_results").fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def save_lab_experiment(self, experiment: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_lab_experiments",
                "experiment_id",
                ["experiment_id", "record_json"],
                (experiment.get("experiment_id") or "", json.dumps(experiment, sort_keys=True)),
            )
            self._commit()

    def save_lab_result(self, result: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_lab_results",
                "lab_result_id",
                ["lab_result_id", "experiment_id", "record_json"],
                (
                    result.get("lab_result_id") or "",
                    result.get("experiment_id") or "",
                    json.dumps(result, sort_keys=True),
                ),
            )
            self._commit()

    def save_lab_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._upsert(
                "research_lab_audit",
                "digest",
                ["digest", "experiment_id", "record_json"],
                (
                    record.get("digest") or "",
                    record.get("experiment_id") or "",
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._commit()

    def list_lab_results(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute("SELECT record_json FROM research_lab_results").fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    # --- Operator export / import (canonical world only; research indexes optional) ---

    def dump_meta(self) -> dict[str, str]:
        with self._lock:
            rows = self._execute("SELECT key, value FROM meta ORDER BY key").fetchall()
            return {r["key"]: r["value"] for r in rows}

    def list_snapshots(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._execute(
                "SELECT snapshot_id, cycle, sequence, state_digest, state_json, created_at "
                "FROM snapshots ORDER BY sequence ASC"
            ).fetchall()
            out: list[dict[str, Any]] = []
            for r in rows:
                created = r["created_at"]
                out.append(
                    {
                        "snapshot_id": r["snapshot_id"],
                        "cycle": int(r["cycle"]),
                        "sequence": int(r["sequence"]),
                        "state_digest": r["state_digest"],
                        "state_json": r["state_json"],
                        "created_at": str(created) if created is not None else None,
                    }
                )
            return out

    def event_count(self) -> int:
        with self._lock:
            row = self._execute("SELECT COUNT(*) AS c FROM events").fetchone()
            return int(row["c"] if row else 0)

    def list_event_rows(self) -> list[dict[str, Any]]:
        """Full ledger rows for backup (ordered by sequence)."""
        with self._lock:
            rows = self._execute(
                "SELECT sequence, cycle, event_id, event_type, digest, previous_digest, envelope_json "
                "FROM events ORDER BY sequence ASC"
            ).fetchall()
            return [
                {
                    "sequence": int(r["sequence"]),
                    "cycle": int(r["cycle"]),
                    "event_id": r["event_id"],
                    "event_type": r["event_type"],
                    "digest": r["digest"],
                    "previous_digest": r["previous_digest"],
                    "envelope_json": r["envelope_json"],
                }
                for r in rows
            ]

    def schema_tables_present(self) -> list[str]:
        """Return required canonical table names that exist."""
        required = ["meta", "events", "snapshots", "sessions"]
        present: list[str] = []
        with self._lock:
            if self.backend == "sqlite":
                rows = self._execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
                names = {r["name"] for r in rows}
            else:
                rows = self._execute(
                    "SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema()"
                ).fetchall()
                names = {r["name"] for r in rows}
            for t in required:
                if t in names:
                    present.append(t)
        return present

    def clear_canonical(self) -> None:
        """Delete canonical world tables (for restore into a clean target). Research indexes untouched."""
        with self._lock:
            self._state = None
            self._ready = False
            self._begin_write()
            try:
                for table in ("events", "snapshots", "sessions", "meta"):
                    self._execute(f"DELETE FROM {table}")
                self._set_meta("writer_token", self.writer_token)
                self._set_meta("backend", self.backend)
                self._commit()
            except Exception:
                self._rollback()
                raise

    def import_canonical(
        self,
        *,
        meta: dict[str, str],
        events: list[dict[str, Any]],
        snapshots: list[dict[str, Any]],
    ) -> None:
        """Install ledger + snapshots + meta into an empty store. Fresh writer fence is claimed."""
        with self._lock:
            self._state = None
            self._ready = False
            self._begin_write()
            try:
                for table in ("events", "snapshots", "sessions", "meta"):
                    self._execute(f"DELETE FROM {table}")
                # Install meta except active writer token (audit copy only).
                for key, value in meta.items():
                    if key == "writer_token":
                        continue
                    self._set_meta(key, str(value))
                self._set_meta("writer_token", self.writer_token)
                self._set_meta(
                    "writer_fence_epoch_at_restore",
                    str(meta.get("writer_token") or ""),
                )
                self._set_meta("backend", self.backend)

                for ev in events:
                    self._execute(
                        """
                        INSERT INTO events(sequence, cycle, event_id, event_type, digest, previous_digest, envelope_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            int(ev["sequence"]),
                            int(ev["cycle"]),
                            ev["event_id"],
                            ev["event_type"],
                            ev["digest"],
                            ev.get("previous_digest"),
                            ev["envelope_json"]
                            if isinstance(ev.get("envelope_json"), str)
                            else json.dumps(ev.get("envelope") or ev, sort_keys=True),
                        ),
                    )
                for snap in snapshots:
                    self._upsert(
                        "snapshots",
                        "snapshot_id",
                        ["snapshot_id", "cycle", "sequence", "state_digest", "state_json"],
                        (
                            snap["snapshot_id"],
                            int(snap["cycle"]),
                            int(snap["sequence"]),
                            snap["state_digest"],
                            snap["state_json"]
                            if isinstance(snap.get("state_json"), str)
                            else json.dumps(snap.get("state") or {}, sort_keys=True),
                        ),
                    )
                self._commit()
            except Exception:
                self._rollback()
                raise

    def _set_meta(self, key: str, value: str, cur: Any | None = None) -> None:
        sql = self._sql(
            "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
        )
        c = cur if cur is not None else self._conn
        c.execute(sql, (key, value))

    def _serialize_state(self, state: WorldState) -> dict[str, Any]:
        return {
            "world_id": state.world_id,
            "world_version": state.world_version,
            "seed": state.seed,
            "catalog_version": state.catalog_version,
            "cycle": state.cycle,
            "sequence": state.sequence,
            "budget_defaults": state.budget_defaults,
            "rooms": state.rooms,
            "exits": state.exits,
            "entities": state.entities,
            "registered_agents": state.registered_agents,
            "active_agents": state.active_agents,
            "organizations": state.organizations,
            "messages": state.messages,
            "trades": state.trades,
            "pending_observations": state.pending_observations,
            "observation_digests": state.observation_digests,
            "destroyed_entities": state.destroyed_entities,
            "situations": state.situations,
            "last_event_digest": state.last_event_digest,
            "event_count": state.event_count,
        }


def _is_serialization_failure(exc: BaseException) -> bool:
    """Detect PostgreSQL serialization / deadlock failures for retry."""
    try:
        from psycopg.errors import DeadlockDetected, SerializationFailure

        if isinstance(exc, (SerializationFailure, DeadlockDetected)):
            return True
    except ImportError:
        pass
    msg = str(exc).lower()
    return "could not serialize" in msg or "deadlock detected" in msg or "40001" in msg
