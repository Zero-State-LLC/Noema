"""In-process modular monolith composition root."""

from __future__ import annotations

import json
import threading
import uuid
from pathlib import Path
from typing import Any

from noema.actions.errors import (
    NOT_AUTHORIZED,
    VERSION_MISMATCH,
    WORLD_NOT_READY,
    ActionError,
)
from noema.actions.router import ActionRouter
from noema.auth.roles import Principal, Role
from noema.observations.project import project_agent_observation, project_spectator_live
from noema.persistence.store import WorldStore
from noema.world.state import acceptance_projection


class NoemaRuntime:
    """Single-process Chamber runtime with one fenced writer."""

    def __init__(self, db_path: Path | str = ":memory:", *, spec_compat_path: Path | None = None):
        self.store = WorldStore(db_path)
        self.router: ActionRouter | None = None
        self._writer = threading.RLock()
        self.spec_compat = self._load_compat(spec_compat_path)
        self.sessions: dict[str, dict[str, Any]] = {}

    def _load_compat(self, path: Path | None) -> dict[str, Any]:
        candidates = []
        if path:
            candidates.append(Path(path))
        here = Path(__file__).resolve()
        candidates.extend(
            [
                here.parents[3] / "spec-compat.json",
                Path.cwd() / "spec-compat.json",
            ]
        )
        for p in candidates:
            if p.is_file():
                return json.loads(p.read_text(encoding="utf-8"))
        return {
            "runtime_version": "0.1.0",
            "versions": {
                "event_catalog": "event-catalog/0.1",
                "world_rules": "world/v1",
                "agent_protocol": "agent-protocol/v1",
                "canonicalization": "noema-jcs/1",
            },
        }

    def start_world(self, seed_path: Path | str) -> dict[str, Any]:
        with self._writer:
            state = self.store.load_from_seed(seed_path)
            # version gate
            catalog = state.catalog_version
            supported = self.spec_compat.get("versions", {}).get("event_catalog")
            if supported and catalog != supported:
                raise ActionError(
                    VERSION_MISMATCH,
                    f"unsupported event catalog {catalog}; runtime supports {supported}",
                )
            self.router = ActionRouter(state.world_id)
            snap = self.store.commit_cycle(state, [], snapshot=True)
            return {
                "world_id": state.world_id,
                "catalog_version": state.catalog_version,
                "world_version": state.world_version,
                "seed": state.seed,
                "cycle": state.cycle,
                "sequence": state.sequence,
                "snapshot": snap,
            }

    def resume_world(self, seed_path: Path | str | None = None) -> dict[str, Any]:
        with self._writer:
            state = self.store.rehydrate_from_db(seed_path)
            self.router = ActionRouter(state.world_id)
            # restore client sequences conservatively from ledger length
            return {
                "world_id": state.world_id,
                "cycle": state.cycle,
                "sequence": state.sequence,
                "ledger_head": state.last_event_digest,
                "resumed": True,
            }

    def ensure_ready(self) -> None:
        if not self.store.ready or self.router is None:
            raise ActionError(WORLD_NOT_READY, "world not loaded")

    def health(self) -> dict[str, Any]:
        return {"status": "ok"}

    def ready(self) -> dict[str, Any]:
        problems = self.store.verify_consistency() if self.store.ready else ["WORLD_NOT_READY"]
        ok = self.store.ready and not problems
        return {"ready": ok, "problems": problems}

    def version(self) -> dict[str, Any]:
        return {
            "runtime_version": self.spec_compat.get("runtime_version")
            or self.spec_compat.get("runtime_name", "noema") + "/0.1.0",
            "spec_pin": self.spec_compat.get("specs", {}),
            "versions": self.spec_compat.get("versions", {}),
            "implementation_phase": self.spec_compat.get("implementation_phase"),
            "deferred_milestones": self.spec_compat.get("deferred_milestones", []),
        }

    def create_session(self, *, role: Role, principal_id: str | None = None, agent_id: str | None = None) -> dict[str, Any]:
        session_id = f"sess.{uuid.uuid4().hex[:12]}"
        data = {
            "session_id": session_id,
            "principal_id": principal_id or f"principal.{uuid.uuid4().hex[:8]}",
            "role": role.value,
            "agent_id": agent_id,
            "epoch": 1,
        }
        self.sessions[session_id] = data
        self.store.save_session(session_id, data)
        return data

    def get_principal(self, session_id: str) -> Principal:
        data = self.sessions.get(session_id) or self.store.load_session(session_id)
        if not data:
            raise ActionError(NOT_AUTHORIZED, "unknown session")
        return Principal(data["principal_id"], Role(data["role"]), data.get("agent_id"))

    def apply_player_action(self, session_id: str, action: dict[str, Any]) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if principal.is_spectator() or principal.role == Role.RESEARCHER:
            raise ActionError(NOT_AUTHORIZED, "role cannot mutate world")
        if not principal.can_mutate_world():
            raise ActionError(NOT_AUTHORIZED, "role cannot mutate world")
        self.ensure_ready()
        assert self.router is not None
        with self._writer:
            state = self.store.get_state()
            # ensure agent registered for enter
            agent_id = action.get("agent_id") or principal.agent_id
            if not agent_id:
                raise ActionError(NOT_AUTHORIZED, "agent_id required")
            if agent_id not in state.registered_agents:
                state.registered_agents[agent_id] = {"agent_id": agent_id, "display_name": agent_id}
                # write registration into store state without events (registry only)
                self.store._state.registered_agents[agent_id] = state.registered_agents[agent_id]
            action = {**action, "agent_id": agent_id}
            new_state, events, results = self.router.apply_actions(
                state, [action], principal_agent_id=principal.agent_id or agent_id
            )
            # Snapshot each commit so registered agents/runtime metadata survive restart.
            meta = self.store.commit_cycle(new_state, events, snapshot=True)
            obs = project_agent_observation(new_state, agent_id)
            return {
                "results": results,
                "events": [{"event_id": e["event_id"], "event_type": e["event_type"], "sequence": e["sequence"]} for e in events],
                "observation": obs,
                "commit": meta,
            }

    def observe(self, session_id: str, agent_id: str | None = None) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        self.ensure_ready()
        aid = agent_id or principal.agent_id
        if not aid:
            raise ActionError(NOT_AUTHORIZED, "agent_id required")
        if principal.agent_id and aid != principal.agent_id and principal.role != Role.ADMIN:
            raise ActionError(NOT_AUTHORIZED, "cannot observe other agent")
        state = self.store.get_state()
        return project_agent_observation(state, aid)

    def watch_live(self, session_id: str) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if principal.role not in (Role.SPECTATOR, Role.ADMIN, Role.RESEARCHER, Role.PLAYER):
            raise ActionError(NOT_AUTHORIZED, "watch not allowed")
        self.ensure_ready()
        # players may watch public surface
        return project_spectator_live(self.store.get_state())

    def acceptance_view(self) -> dict[str, Any]:
        self.ensure_ready()
        return acceptance_projection(self.store.get_state())
