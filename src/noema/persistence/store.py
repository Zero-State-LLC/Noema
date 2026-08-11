"""SQLite persistence for Chamber world, ledger, and snapshots.

Production modular-monolith contract prefers PostgreSQL SERIALIZABLE cycles.
Phase 1 uses SQLite with exclusive write transactions for solo/local MVP.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any

from noema.world.digest import sha256_digest
from noema.world.state import WorldState, acceptance_projection, load_seed


class WorldStore:
    """Single fenced writer store per process."""

    def __init__(self, path: Path | str = ":memory:"):
        self.path = str(path)
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(self.path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()
        self._state: WorldState | None = None
        self._ready = False

    def _init_schema(self) -> None:
        cur = self._conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS events (
              sequence INTEGER PRIMARY KEY,
              cycle INTEGER NOT NULL,
              event_id TEXT NOT NULL UNIQUE,
              event_type TEXT NOT NULL,
              digest TEXT NOT NULL,
              previous_digest TEXT,
              envelope_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS snapshots (
              snapshot_id TEXT PRIMARY KEY,
              cycle INTEGER NOT NULL,
              sequence INTEGER NOT NULL,
              state_digest TEXT NOT NULL,
              state_json TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS sessions (
              session_id TEXT PRIMARY KEY,
              principal_id TEXT NOT NULL,
              role TEXT NOT NULL,
              agent_id TEXT,
              last_request_id TEXT,
              epoch INTEGER NOT NULL DEFAULT 1,
              data_json TEXT NOT NULL
            );
            -- Research indexes (rebuildable; not world truth)
            CREATE TABLE IF NOT EXISTS research_trajectories (
              trajectory_id TEXT PRIMARY KEY,
              world_id TEXT NOT NULL,
              from_cycle INTEGER NOT NULL,
              to_cycle INTEGER NOT NULL,
              content_digest TEXT NOT NULL,
              record_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS research_frontier_audit (
              digest TEXT PRIMARY KEY,
              request_id TEXT NOT NULL,
              record_index INTEGER NOT NULL,
              record_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS research_frontier_plans (
              plan_id TEXT PRIMARY KEY,
              request_id TEXT NOT NULL,
              plan_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS research_observatory_runs (
              analysis_run_id TEXT PRIMARY KEY,
              run_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS research_observatory_candidates (
              candidate_id TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              analysis_run_id TEXT NOT NULL,
              candidate_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS research_observatory_audit (
              digest TEXT PRIMARY KEY,
              analysis_run_id TEXT NOT NULL,
              record_index INTEGER NOT NULL,
              record_json TEXT NOT NULL
            );
            """
        )
        self._conn.commit()

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    @property
    def ready(self) -> bool:
        return self._ready and self._state is not None

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
            self._conn.commit()
            return state.clone()

    def rehydrate_from_db(self, seed_path: Path | str | None = None) -> WorldState:
        """Restart recovery: seed + ledger replay, merging registered agents from latest snapshot."""
        from noema.world.reduce import apply_event

        with self._lock:
            seed = seed_path or self._get_meta("seed_path")
            if not seed:
                raise RuntimeError("no seed_path recorded for rehydrate")
            state = load_seed(seed)
            # merge any registered agents captured in latest snapshot
            row = self._conn.execute(
                "SELECT state_json FROM snapshots ORDER BY sequence DESC LIMIT 1"
            ).fetchone()
            if row:
                snap = json.loads(row["state_json"])
                for aid, rec in (snap.get("registered_agents") or {}).items():
                    state.registered_agents.setdefault(aid, rec)
            for erow in self._conn.execute(
                "SELECT envelope_json FROM events ORDER BY sequence ASC"
            ):
                state = apply_event(state, json.loads(erow["envelope_json"]))
            self._state = state
            self._ready = True
            return state.clone()

    def _get_meta(self, key: str) -> str | None:
        row = self._conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
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
    ) -> dict[str, Any]:
        """Atomically append events and replace canonical state (fenced writer)."""
        with self._lock:
            if not self._state:
                raise RuntimeError("WORLD_NOT_READY")
            cur = self._conn.cursor()
            try:
                cur.execute("BEGIN IMMEDIATE")
                for event in events:
                    cur.execute(
                        """
                        INSERT INTO events(sequence, cycle, event_id, event_type, digest, previous_digest, envelope_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
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
                self._state = new_state
                head = new_state.last_event_digest or ""
                self._set_meta("ledger_head", head, cur=cur)
                self._set_meta("sequence", str(new_state.sequence), cur=cur)
                self._set_meta("cycle", str(new_state.cycle), cur=cur)
                view = acceptance_projection(new_state)
                digest = sha256_digest(view)
                self._set_meta("state_digest", digest, cur=cur)
                snap_id = None
                if snapshot or not events:
                    snap_id = f"snap.{new_state.sequence}"
                    cur.execute(
                        """
                        INSERT OR REPLACE INTO snapshots(snapshot_id, cycle, sequence, state_digest, state_json)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            snap_id,
                            new_state.cycle,
                            new_state.sequence,
                            digest,
                            json.dumps(self._serialize_state(new_state), sort_keys=True),
                        ),
                    )
                self._conn.commit()
                return {
                    "ledger_head": head,
                    "sequence": new_state.sequence,
                    "cycle": new_state.cycle,
                    "state_digest": digest,
                    "snapshot_id": snap_id,
                    "event_count": len(events),
                }
            except Exception:
                self._conn.rollback()
                raise

    def ledger_head(self) -> str | None:
        with self._lock:
            row = self._conn.execute("SELECT value FROM meta WHERE key='ledger_head'").fetchone()
            if not row:
                return None
            return row["value"] or None

    def list_events(self, *, after_sequence: int = 0, limit: int = 100) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT envelope_json FROM events WHERE sequence > ? ORDER BY sequence ASC LIMIT ?",
                (after_sequence, limit),
            ).fetchall()
            return [json.loads(r["envelope_json"]) for r in rows]

    def save_session(self, session_id: str, data: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO sessions(session_id, principal_id, role, agent_id, last_request_id, epoch, data_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
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
            self._conn.commit()

    def load_session(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT data_json FROM sessions WHERE session_id=?", (session_id,)
            ).fetchone()
            return json.loads(row["data_json"]) if row else None

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
            # chain integrity
            prev = None
            for row in self._conn.execute(
                "SELECT sequence, digest, previous_digest, envelope_json FROM events ORDER BY sequence"
            ):
                env = json.loads(row["envelope_json"])
                if env.get("previous_digest") != prev:
                    problems.append(f"broken ledger chain at seq {row['sequence']}")
                    break
                prev = row["digest"]
            if prev is not None and prev != (head or None) and head:
                # head may be empty at genesis
                if head and prev != head:
                    problems.append("ledger head does not match last event digest")
        return problems

    # --- Research indexes (disposable; rebuildable from ledger) ---

    def save_trajectory(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_trajectories(
                  trajectory_id, world_id, from_cycle, to_cycle, content_digest, record_json
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    record["trajectory_id"],
                    record["world_id"],
                    int(record["from_cycle"]),
                    int(record["to_cycle"]),
                    record.get("content_digest") or "",
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._conn.commit()

    def list_trajectories(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT record_json FROM research_trajectories ORDER BY from_cycle, to_cycle"
            ).fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def save_frontier_plan(self, plan: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_frontier_plans(plan_id, request_id, plan_json)
                VALUES (?, ?, ?)
                """,
                (plan.get("plan_id") or "", plan.get("request_id") or "", json.dumps(plan, sort_keys=True)),
            )
            self._conn.commit()

    def save_frontier_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_frontier_audit(digest, request_id, record_index, record_json)
                VALUES (?, ?, ?, ?)
                """,
                (
                    record.get("digest") or "",
                    record.get("request_id") or "",
                    int(record.get("record_index") or 0),
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._conn.commit()

    def list_frontier_audit(self, request_id: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            if request_id:
                rows = self._conn.execute(
                    "SELECT record_json FROM research_frontier_audit WHERE request_id=? ORDER BY record_index",
                    (request_id,),
                ).fetchall()
            else:
                rows = self._conn.execute(
                    "SELECT record_json FROM research_frontier_audit ORDER BY request_id, record_index"
                ).fetchall()
            return [json.loads(r["record_json"]) for r in rows]

    def get_frontier_audit(self, digest: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT record_json FROM research_frontier_audit WHERE digest=?", (digest,)
            ).fetchone()
            return json.loads(row["record_json"]) if row else None

    def save_observatory_run(self, run: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_observatory_runs(analysis_run_id, run_json)
                VALUES (?, ?)
                """,
                (run.get("analysis_run_id") or "", json.dumps(run, sort_keys=True)),
            )
            self._conn.commit()

    def save_observatory_candidate(self, kind: str, analysis_run_id: str, candidate: dict[str, Any]) -> None:
        with self._lock:
            cid = candidate.get("candidate_id") or candidate.get("unknown_id") or ""
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_observatory_candidates(
                  candidate_id, kind, analysis_run_id, candidate_json
                ) VALUES (?, ?, ?, ?)
                """,
                (cid, kind, analysis_run_id, json.dumps(candidate, sort_keys=True)),
            )
            self._conn.commit()

    def save_observatory_audit(self, record: dict[str, Any]) -> None:
        with self._lock:
            self._conn.execute(
                """
                INSERT OR REPLACE INTO research_observatory_audit(
                  digest, analysis_run_id, record_index, record_json
                ) VALUES (?, ?, ?, ?)
                """,
                (
                    record.get("digest") or "",
                    record.get("analysis_run_id") or "",
                    int(record.get("record_index") or 0),
                    json.dumps(record, sort_keys=True),
                ),
            )
            self._conn.commit()

    def list_observatory_candidates(self, kind: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            if kind:
                rows = self._conn.execute(
                    "SELECT candidate_json FROM research_observatory_candidates WHERE kind=? ORDER BY candidate_id",
                    (kind,),
                ).fetchall()
            else:
                rows = self._conn.execute(
                    "SELECT candidate_json FROM research_observatory_candidates ORDER BY kind, candidate_id"
                ).fetchall()
            return [json.loads(r["candidate_json"]) for r in rows]

    def list_observatory_runs(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute("SELECT run_json FROM research_observatory_runs").fetchall()
            return [json.loads(r["run_json"]) for r in rows]

    def clear_research_indexes(self) -> None:
        with self._lock:
            self._conn.execute("DELETE FROM research_trajectories")
            self._conn.execute("DELETE FROM research_frontier_audit")
            self._conn.execute("DELETE FROM research_frontier_plans")
            self._conn.execute("DELETE FROM research_observatory_runs")
            self._conn.execute("DELETE FROM research_observatory_candidates")
            self._conn.execute("DELETE FROM research_observatory_audit")
            self._conn.commit()

    def _set_meta(self, key: str, value: str, cur: sqlite3.Cursor | None = None) -> None:
        c = cur or self._conn.cursor()
        c.execute(
            "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )

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
