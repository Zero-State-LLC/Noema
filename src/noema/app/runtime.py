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
from noema.research.capture import ResearchCapture
from noema.research.errors import INJECTION_REJECTED, POLICY_DENIED, ResearchError
from noema.research.frontier.director import FrontierDirector, FrontierResult
from noema.research.frontier.injection import build_follow_on_entity_update, build_situation_injected_event
from noema.research.frontier.redaction import public_pressure_summary, redact_public_projection, research_overlay
from noema.world.reduce import apply_event
from noema.world.state import acceptance_projection


class NoemaRuntime:
    """Single-process Chamber runtime with one fenced writer."""

    def __init__(
        self,
        db_path: Path | str = ":memory:",
        *,
        spec_compat_path: Path | None = None,
        research_capture: bool = True,
        frontier_config: dict[str, Any] | None = None,
    ):
        self.store = WorldStore(db_path)
        self.router: ActionRouter | None = None
        self._writer = threading.RLock()
        self.spec_compat = self._load_compat(spec_compat_path)
        self.sessions: dict[str, dict[str, Any]] = {}
        self.research = ResearchCapture(self.store, enabled=research_capture)
        self.frontier = FrontierDirector(frontier_config)
        self._last_frontier: FrontierResult | None = None
        self._research_overlays: list[dict[str, Any]] = []

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
        return {
            "status": "ok",
            "research_capture": "degraded" if self.research.degraded else "ok",
            "frontier": "optional",
        }

    def ready(self) -> dict[str, Any]:
        """PLAY readiness — Frontier/research degradation does not block PLAY."""
        problems = self.store.verify_consistency() if self.store.ready else ["WORLD_NOT_READY"]
        ok = self.store.ready and not problems
        return {
            "ready": ok,
            "problems": problems,
            "research_optional": {
                "capture_degraded": self.research.degraded,
                "required_for_play": False,
            },
        }

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
            agent_id = action.get("agent_id") or principal.agent_id
            if not agent_id:
                raise ActionError(NOT_AUTHORIZED, "agent_id required")
            if agent_id not in state.registered_agents:
                state.registered_agents[agent_id] = {"agent_id": agent_id, "display_name": agent_id}
                self.store._state.registered_agents[agent_id] = state.registered_agents[agent_id]
            action = {**action, "agent_id": agent_id}
            new_state, events, results = self.router.apply_actions(
                state, [action], principal_agent_id=principal.agent_id or agent_id
            )
            meta = self.store.commit_cycle(new_state, events, snapshot=True)
            # Research capture is post-persist and must not fail PLAY.
            self.research.capture_after_commit(new_state, events, commit_meta=meta)
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
        obs = project_agent_observation(state, aid)
        # strip any research-private keys from player/agent surface
        if not principal.can_view_research_overlay():
            return redact_public_projection(obs)
        return obs

    def watch_live(self, session_id: str) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if principal.role not in (Role.SPECTATOR, Role.ADMIN, Role.RESEARCHER, Role.PLAYER):
            raise ActionError(NOT_AUTHORIZED, "watch not allowed")
        self.ensure_ready()
        live = project_spectator_live(self.store.get_state())
        if principal.can_view_research_overlay() and self._research_overlays:
            live = {**live, "research_overlay": self._research_overlays[-1]}
        else:
            live = redact_public_projection(live)
        return live

    def acceptance_view(self) -> dict[str, Any]:
        self.ensure_ready()
        return acceptance_projection(self.store.get_state())

    # --- Research / Frontier (permissioned; optional for PLAY) ---

    def list_trajectories(self) -> list[dict[str, Any]]:
        return self.store.list_trajectories()

    def rebuild_research_indexes(self) -> list[dict[str, Any]]:
        self.ensure_ready()
        state = self.store.get_state()
        events = self.store.list_events(limit=1_000_000)
        recs = self.research.rebuild_from_ledger(
            world_id=state.world_id,
            world_version=state.world_version,
            seed=state.seed,
            events=events,
        )
        return [r.to_dict() for r in recs]

    def run_frontier(
        self,
        session_id: str,
        request: dict[str, Any],
        templates: dict[str, dict[str, Any]],
        *,
        inject: bool = False,
        explicit_mutation_plans: list[list[dict[str, Any]]] | None = None,
        follow_on: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Evaluate Frontier plan. Optionally inject via canonical world path."""
        principal = self.get_principal(session_id)
        if not principal.can_operate_frontier():
            raise ResearchError(POLICY_DENIED, "Frontier controls require RESEARCHER or ADMIN")
        self.ensure_ready()
        result = self.frontier.run(request, templates, explicit_mutation_plans=explicit_mutation_plans)
        self._last_frontier = result
        self.store.save_frontier_plan(result.plan)
        for rec in result.audit:
            self.store.save_frontier_audit(rec)

        injection_events: list[dict[str, Any]] = []
        if inject and result.selected_genomes:
            injection_events = self._inject_selected(result, request, follow_on=follow_on)

        targets = [t.get("capability_id") for t in (request.get("targets") or []) if t.get("capability_id")]
        if result.selected_genomes:
            overlay = research_overlay(
                genome=result.selected_genomes[0],
                plan_id=result.plan.get("plan_id"),
                target_capability_ids=[str(t) for t in targets],
                selection_rationale=["selected_top_rank"] if result.selected_genomes else [],
            )
            self._research_overlays.append(overlay)

        return {
            "plan": result.plan,
            "candidate_count": len(result.candidates),
            "selected": [g.get("genome_id") for g in result.selected_genomes],
            "audit": result.audit,
            "replay_context": result.replay_context,
            "injection_events": [
                {"event_id": e["event_id"], "event_type": e["event_type"], "sequence": e["sequence"], "digest": e.get("digest")}
                for e in injection_events
            ],
            "stop_reason": result.stop_reason,
            "claim_label": result.claim_label,
        }

    def _inject_selected(
        self,
        result: FrontierResult,
        request: dict[str, Any],
        *,
        follow_on: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Apply SITUATION_INJECTED (+ optional follow-on) through reducer + ledger only."""
        with self._writer:
            state = self.store.get_state()
            events: list[dict[str, Any]] = []
            cycle = int(request.get("decision_cycle") or state.cycle)
            seq = int(state.sequence)
            prev = state.last_event_digest
            for i, genome in enumerate(result.selected_genomes):
                scores = {}
                for c in result.candidates:
                    if c.get("genome_digest") == genome.get("content_digest"):
                        scores = c.get("score_components") or {}
                        break
                if not scores and result.plan.get("selected_candidates"):
                    scores = (result.plan["selected_candidates"][i].get("score_components") or {})
                situation_id = f"sit.frontier.{request.get('request_id', 'run')}.{i}"
                seq += 1
                ev = build_situation_injected_event(
                    world_id=state.world_id,
                    cycle=cycle,
                    sequence=seq,
                    previous_digest=prev,
                    situation_id=situation_id,
                    genome=genome,
                    score_components=scores,
                    plan_id=result.plan.get("plan_id"),
                )
                try:
                    state = apply_event(state, ev)
                except Exception as exc:
                    raise ResearchError(INJECTION_REJECTED, f"injection rejected: {exc}") from exc
                events.append(ev)
                prev = ev["digest"]

                if follow_on and i == 0:
                    entity_id = follow_on.get("entity_id")
                    set_map = follow_on.get("set") or {}
                    if entity_id and set_map:
                        seq += 1
                        fev = build_follow_on_entity_update(
                            world_id=state.world_id,
                            cycle=cycle,
                            sequence=seq,
                            previous_digest=prev,
                            entity_id=entity_id,
                            set_map=set_map,
                            situation_id=situation_id,
                        )
                        try:
                            state = apply_event(state, fev)
                        except Exception as exc:
                            raise ResearchError(INJECTION_REJECTED, f"follow-on rejected: {exc}") from exc
                        events.append(fev)
                        prev = fev["digest"]

            meta = self.store.commit_cycle(state, events, snapshot=True)
            self.research.capture_after_commit(state, events, commit_meta=meta)
            # record injection event refs on last audit if present
            if result.audit and events:
                inj_audit = {
                    **result.audit[-1],
                    "record_type": "injection",
                    "record_index": len(result.audit),
                    "canonical_event_refs": [
                        {"event_id": e["event_id"], "digest": e["digest"], "event_type": e["event_type"]}
                        for e in events
                    ],
                    "previous_record_digest": result.audit[-1].get("digest"),
                }
                from noema.world.digest import sha256_digest

                body = {k: v for k, v in inj_audit.items() if k != "digest"}
                inj_audit["digest"] = sha256_digest(body)
                self.store.save_frontier_audit(inj_audit)
                result.audit.append(inj_audit)
            return events

    def get_frontier_audit(self, audit_id: str) -> dict[str, Any] | None:
        return self.store.get_frontier_audit(audit_id)

    def research_view(self, session_id: str) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "research view requires RESEARCHER or ADMIN")
        return {
            "trajectories": self.store.list_trajectories(),
            "overlays": list(self._research_overlays),
            "last_plan": self._last_frontier.plan if self._last_frontier else None,
            "audit": self.store.list_frontier_audit(),
        }

    def public_pressure_view(self) -> dict[str, Any]:
        """WATCH-safe world pressure summary without research metadata."""
        self.ensure_ready()
        state = self.store.get_state()
        event_ids = []
        for sid, sit in (state.situations or {}).items():
            event_ids.append(sid)
        narrative = "World conditions shift." if state.situations else "Quiet conditions."
        view = public_pressure_summary(
            cycle=state.cycle,
            world_id=state.world_id,
            event_ids=event_ids,
            narrative=narrative,
        )
        return redact_public_projection(view)
