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
from noema.persistence.store import open_store
from noema.research.capture import ResearchCapture
from noema.research.errors import (
    INJECTION_REJECTED,
    INSUFFICIENT_RESEARCH_INPUT,
    POLICY_DENIED,
    ResearchError,
)
from noema.research.frontier.director import FrontierDirector, FrontierResult
from noema.research.frontier.injection import build_follow_on_entity_update, build_situation_injected_event
from noema.research.frontier.redaction import public_pressure_summary, redact_public_projection, research_overlay
from noema.research.compiler.compiler import Compiler, CompileSession
from noema.research.deep_time.registry import DeepTimeRegistry
from noema.research.genesis.engine import GenesisEngine
from noema.research.genesis.errors import GenesisError
from noema.research.lab.lab import Lab, LabSessionResult
from noema.research.learn.graph import LearnGraph, LearnProjection
from noema.research.observatory.analysis import Observatory, ObservatoryResult
from noema.research.observatory.redaction import observatory_research_overlay, redact_observatory_public
from noema.research.observatory.trajectory_v03 import upgrade_v01_capture_to_v03
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
        self.store = open_store(db_path)
        self.router: ActionRouter | None = None
        self._writer = threading.RLock()
        self.spec_compat = self._load_compat(spec_compat_path)
        self.sessions: dict[str, dict[str, Any]] = {}
        self.research = ResearchCapture(self.store, enabled=research_capture)
        self.frontier = FrontierDirector(frontier_config)
        self.observatory = Observatory()
        self.lab = Lab()
        self.compiler = Compiler()
        self.learn = LearnGraph()
        self.deep_time = DeepTimeRegistry()
        self.genesis = GenesisEngine()
        self._last_frontier: FrontierResult | None = None
        self._last_observatory: ObservatoryResult | None = None
        self._last_lab: LabSessionResult | None = None
        self._last_compile: CompileSession | None = None
        self._last_learn: LearnProjection | None = None
        self._last_genesis: dict[str, Any] | None = None
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
        return redact_observatory_public(redact_public_projection(view))

    def run_observatory(
        self,
        session_id: str,
        *,
        trajectory: dict[str, Any] | None = None,
        agent_id: str | None = None,
        detectors: list[str] | None = None,
        freeze_baseline: dict[str, Any] | None = None,
        pre_context: dict[str, Any] | None = None,
        post_context: dict[str, Any] | None = None,
        pre_window: tuple[int, int] | None = None,
        post_window: tuple[int, int] | None = None,
        contradiction_set: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Offline Observatory analysis. Never mutates world truth."""
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "Observatory requires RESEARCHER or ADMIN")
        self.ensure_ready()
        seq_before = self.store.get_state().sequence
        events = self.store.list_events(limit=1_000_000)
        if trajectory is None:
            captures = self.store.list_trajectories()
            if not captures:
                raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "no trajectories captured")
            cap = captures[-1]
            aid = agent_id or (cap.get("agent_ids") or ["agent.unknown"])[0]
            trajectory = upgrade_v01_capture_to_v03(cap, agent_id=aid)
        result = self.observatory.run(
            trajectory=trajectory,
            events=events,
            agent_id=agent_id,
            pre_context=pre_context,
            post_context=post_context,
            pre_window=pre_window,
            post_window=post_window,
            detectors=detectors,
            freeze_baseline=freeze_baseline,
            contradiction_set=contradiction_set,
        )
        self._last_observatory = result
        self.store.save_observatory_run(result.analysis_run)
        for a in result.anomalies:
            self.store.save_observatory_candidate("anomaly", result.analysis_run["analysis_run_id"], a)
        for s in result.shifts:
            self.store.save_observatory_candidate("shift", result.analysis_run["analysis_run_id"], s)
        for c in result.capabilities:
            self.store.save_observatory_candidate("capability", result.analysis_run["analysis_run_id"], c)
        for u in result.unknowns:
            self.store.save_observatory_candidate("unknown", result.analysis_run["analysis_run_id"], u)
        for rec in result.audit:
            self.store.save_observatory_audit(rec)
        overlay = observatory_research_overlay(
            anomaly_id=result.anomalies[0]["candidate_id"] if result.anomalies else None,
            shift_id=result.shifts[0]["candidate_id"] if result.shifts else None,
            capability_id=result.capabilities[0]["candidate_id"] if result.capabilities else None,
            detector_id=result.anomalies[0].get("detector_id") if result.anomalies else None,
            deviation_components=(result.anomalies[0].get("deviation_components") if result.anomalies else None),
        )
        self._research_overlays.append(overlay)
        seq_after = self.store.get_state().sequence
        return {
            "analysis_run": result.analysis_run,
            "anomalies": result.anomalies,
            "shifts": result.shifts,
            "capabilities": result.capabilities,
            "unknowns": result.unknowns,
            "signals": result.signals,
            "audit": result.audit,
            "comparability": result.comparability,
            "features_pre": result.features_pre,
            "features_post": result.features_post,
            "baseline": result.baseline,
            "world_sequence_unchanged": seq_before == seq_after,
            "world_mutation": False,
            "status": result.status,
        }

    def research_view(self, session_id: str) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "research view requires RESEARCHER or ADMIN")
        return {
            "trajectories": self.store.list_trajectories(),
            "overlays": list(self._research_overlays),
            "last_plan": self._last_frontier.plan if self._last_frontier else None,
            "audit": self.store.list_frontier_audit(),
            "observatory_runs": self.store.list_observatory_runs(),
            "observatory_candidates": self.store.list_observatory_candidates(),
            "lab_results": self.store.list_lab_results(),
            "last_lab": (
                {
                    "experiment_id": self._last_lab.experiment.get("experiment_id"),
                    "lab_result_id": (self._last_lab.result or {}).get("lab_result_id"),
                    "compiler_readiness": (self._last_lab.result or {}).get("compiler_readiness"),
                }
                if self._last_lab
                else None
            ),
            "captured_tests": self.store.list_captured_tests(),
            "compiler_results": self.store.list_compiler_results(),
            "last_compile": (
                {
                    "compile_id": (self._last_compile.request or {}).get("compile_id"),
                    "status": self._last_compile.status,
                    "captured_test_id": (self._last_compile.captured_test or {}).get("captured_test_id"),
                }
                if self._last_compile
                else None
            ),
            "learn_behaviors": self.store.list_learn_behaviors(),
            "learn_edges": self.store.list_learn_edges(),
            "last_learn": (
                {
                    "graph_digest": self._last_learn.graph.get("digest"),
                    "behavior_ids": self._last_learn.graph.get("behavior_node_ids"),
                    "edge_count": len(self._last_learn.edges),
                }
                if self._last_learn
                else None
            ),
        }

    def run_lab(
        self,
        session_id: str,
        *,
        intent: dict[str, Any] | None = None,
        experiment: dict[str, Any] | None = None,
        interventions: list[dict[str, Any]] | None = None,
        plan: dict[str, Any] | None = None,
        agent_id: str | None = None,
        max_runs: int | None = None,
        confounds: list[str] | None = None,
    ) -> dict[str, Any]:
        """Run isolated Lab experiment. Never mutates production ledger/state."""
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "Lab requires RESEARCHER or ADMIN")
        self.ensure_ready()
        state = self.store.get_state()
        seq_before = state.sequence
        head_before = state.last_event_digest
        ivs = list(interventions or [])
        if intent is not None:
            session = self.lab.run_from_intent(
                intent=intent,
                source_state=state,
                interventions=ivs,
                agent_id=agent_id,
                plan=plan,
                confounds=confounds,
                max_runs=max_runs,
            )
        elif experiment is not None:
            session = self.lab.run_experiment(
                experiment=experiment,
                source_state=state,
                interventions=ivs,
                agent_id=agent_id or "agent.unknown",
                plan=plan,
                confounds=confounds,
                max_runs=max_runs,
            )
        else:
            raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "intent or experiment required")
        self._last_lab = session
        self.store.save_lab_experiment(session.experiment)
        if session.result:
            self.store.save_lab_result(session.result)
        for rec in session.audit:
            self.store.save_lab_audit(rec)
        # prove production isolation
        state_after = self.store.get_state()
        isolated = (
            state_after.sequence == seq_before
            and state_after.last_event_digest == head_before
            and session.production_sequence_before == session.production_sequence_after
        )
        return {
            "experiment": session.experiment,
            "plan": session.plan,
            "fork": session.fork,
            "runs": [
                {
                    "run_id": r.get("run_id"),
                    "run_role": r.get("run_role"),
                    "measures": r.get("measures"),
                    "production_mutated": r.get("production_mutated"),
                    "status": r.get("status"),
                }
                for r in session.runs
            ],
            "result": session.result,
            "audit": session.audit,
            "simple_projection": session.simple_projection,
            "study_view": self.lab.study_view(session),
            "production_isolated": isolated,
            "production_sequence": seq_before,
            "status": session.status,
        }

    def lab_capture_gate(self, session_id: str, lab_result: dict[str, Any] | None = None) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "Lab requires RESEARCHER or ADMIN")
        result = lab_result
        if result is None:
            if not self._last_lab or not self._last_lab.result:
                raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "no lab result")
            result = self._last_lab.result
        return self.lab.capture_gate(result)

    def capture_as_test(
        self,
        session_id: str,
        *,
        intent: dict[str, Any],
        lab_result: dict[str, Any] | None = None,
        unit_manifest: dict[str, Any] | None = None,
        max_oracle_calls: int | None = None,
    ) -> dict[str, Any]:
        """CAPTURE AS TEST — Compiler pipeline. Never mutates production world."""
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "Compiler requires RESEARCHER or ADMIN")
        self.ensure_ready()
        state = self.store.get_state()
        seq_before = state.sequence
        head_before = state.last_event_digest
        lr = lab_result
        if lr is None:
            if self._last_lab and self._last_lab.result:
                lr = self._last_lab.result
            else:
                raise ResearchError(INSUFFICIENT_RESEARCH_INPUT, "lab_result required")
        session = self.compiler.capture_as_test(
            intent=intent,
            lab_result=lr,
            unit_manifest=unit_manifest,
            max_oracle_calls=max_oracle_calls,
        )
        self._last_compile = session
        if session.compiler_result:
            self.store.save_compiler_result(session.compiler_result)
        if session.captured_test:
            self.store.save_captured_test(session.captured_test)
            # LEARN is post-settlement; optional auto-ingest off PLAY path
            try:
                self.learn.ingest_captured_test(
                    session.captured_test,
                    lab_result=lr,
                    source_ref=session.captured_test.get("captured_test_id"),
                )
                proj = self.learn.project()
                self._persist_learn(proj)
            except Exception:
                pass
        for rec in session.audit:
            self.store.save_compiler_audit(rec)
        state_after = self.store.get_state()
        isolated = state_after.sequence == seq_before and state_after.last_event_digest == head_before
        return {
            "status": session.status,
            "request": session.request,
            "admission": session.admission,
            "phenomenon": session.phenomenon,
            "unit_manifest": session.unit_manifest,
            "dependency_graph": session.dependency_graph,
            "minimization": {
                "retained": (session.minimization or {}).get("retained"),
                "removed": (session.minimization or {}).get("removed"),
                "minimality_status": (session.minimization or {}).get("minimality_status"),
                "oracle": (session.minimization or {}).get("oracle"),
            }
            if session.minimization
            else None,
            "compiler_result": session.compiler_result,
            "receipt": session.receipt,
            "captured_test": session.captured_test,
            "audit": session.audit,
            "simple_view": session.simple_view,
            "advanced_view": session.advanced_view,
            "reproducibility_view": session.reproducibility_view,
            "production_isolated": isolated,
            "production_mutated": False,
            "world_truth": False,
        }

    def _persist_learn(self, proj: LearnProjection) -> None:
        self._last_learn = proj
        for b in proj.behaviors:
            self.store.save_learn_behavior(b)
        for e in proj.edges:
            self.store.save_learn_edge(e)
        self.store.save_learn_graph(proj.graph)

    def rebuild_learn(
        self,
        session_id: str,
        *,
        sources: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Rebuild LEARN graph from research evidence (disposable index)."""
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "LEARN requires RESEARCHER or ADMIN")
        self.ensure_ready()
        seq_before = self.store.get_state().sequence
        if sources is None:
            sources = []
            for ct in self.store.list_captured_tests():
                sources.append({"captured_test": ct, "source_ref": ct.get("captured_test_id")})
        proj = self.learn.rebuild_from_sources(sources)
        self._persist_learn(proj)
        seq_after = self.store.get_state().sequence
        return {
            "graph": proj.graph,
            "behaviors": proj.behaviors,
            "edges": [
                {
                    "edge_id": e["edge_id"],
                    "edge_type": e["edge_type"],
                    "source_ref": e["source_ref"],
                    "target_ref": e["target_ref"],
                    "claim_label": e["claim_label"],
                    "relationship_status": e["relationship_status"],
                }
                for e in proj.edges
            ],
            "simple_views": proj.simple_views,
            "advanced_views": proj.advanced_views,
            "not_tested": proj.not_tested,
            "rebuildable": True,
            "mutable_source_of_truth": False,
            "production_sequence_unchanged": seq_before == seq_after,
            "mutates_world": False,
        }

    def learn_view(self, session_id: str, *, behavior_id: str | None = None) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay():
            raise ResearchError(POLICY_DENIED, "LEARN requires RESEARCHER or ADMIN")
        if not self._last_learn:
            # try rebuild from stored captures
            if self.store.list_captured_tests():
                self.rebuild_learn(session_id)
            else:
                return {"behaviors": [], "simple_views": [], "graph": None}
        proj = self._last_learn
        assert proj is not None
        if behavior_id:
            simples = [v for v in proj.simple_views if behavior_id in (v.get("canonical_source_refs") or [])]
            advanceds = [
                v for v in proj.advanced_views if (v.get("presentation") or {}).get("behavior_id") == behavior_id
            ]
            return {
                "graph": proj.graph,
                "simple_views": simples,
                "advanced_views": advanceds,
                "agent_versions": self.learn.agent_versions(behavior_id),
                "not_tested": [n for n in proj.not_tested if n["behavior_id"] == behavior_id],
                "mutates_world": False,
            }
        return {
            "graph": proj.graph,
            "simple_views": proj.simple_views,
            "advanced_views": proj.advanced_views,
            "not_tested": proj.not_tested,
            "mutates_world": False,
        }

    # --- Deep Time (derived historical records) ---

    def deep_time_ingest(self, session_id: str, records: dict[str, Any]) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if not principal.can_view_research_overlay() and principal.role != Role.ADMIN:
            raise ResearchError(POLICY_DENIED, "Deep Time STUDY requires RESEARCHER or ADMIN")
        seq = self.store.get_state().sequence if self.store.ready else None
        for inst in records.get("institutions") or []:
            self.deep_time.put_institution(inst)
        for s in records.get("successions") or []:
            self.deep_time.put_succession(s)
        for a in records.get("artifacts") or []:
            self.deep_time.put_artifact(a)
        for c in records.get("claims") or []:
            self.deep_time.put_claim(c)
        for sc in records.get("scars") or []:
            self.deep_time.put_scar(sc)
        for n in records.get("names") or []:
            self.deep_time.put_name(n)
        for r in records.get("reconstructions") or []:
            self.deep_time.put_reconstruction(r)
        for lin in records.get("lineages") or []:
            self.deep_time.put_lineage(lin)
        seq_after = self.store.get_state().sequence if self.store.ready else None
        return {
            "snapshot": self.deep_time.snapshot(),
            "ledger_unchanged": seq == seq_after,
            "lore_is_not_truth": True,
            "mutates_world": False,
        }

    def deep_time_play_view(self, session_id: str) -> dict[str, Any]:
        """PLAY-safe historical surface — no jargon required."""
        self.get_principal(session_id)
        scars = list(self.deep_time.scars.values())
        arts = [a for a in self.deep_time.artifacts.values() if a.get("visibility") == "PUBLIC"]
        subject = []
        if scars:
            subject.append(scars[0]["scar_id"])
        if arts:
            subject.append(arts[0]["artifact_id"])
        from noema.research.deep_time.projections import play_history_view

        return play_history_view(
            subject_ids=subject or ["history.local"],
            title="OLD PLACE",
            age_label="historic",
            condition=scars[0].get("simple_label") if scars else None,
            known_history="Incomplete local history.",
            evidence=[a.get("title") or a["artifact_id"] for a in arts[:3]],
            unknown="Much is lost.",
        )

    # --- Genesis (ADMIN only) ---

    def genesis_preview(
        self,
        session_id: str,
        *,
        world_name: str,
        world_seed: str,
        profile_id: str,
        story_seed_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if principal.role != Role.ADMIN:
            raise GenesisError("NOT_AUTHORIZED", "only ADMIN may run Genesis")
        result = self.genesis.preview(
            world_name=world_name,
            world_seed=world_seed,
            profile_id=profile_id,
            story_seed_ids=story_seed_ids,
        )
        self._last_genesis = result
        return {
            "result": result,
            "admin_view": self.genesis.admin_preview_view(result),
            "player_view": self.genesis.player_entry_view(result),
        }

    def genesis_activate(self, session_id: str, genesis_id: str) -> dict[str, Any]:
        principal = self.get_principal(session_id)
        if principal.role != Role.ADMIN:
            raise GenesisError("NOT_AUTHORIZED", "only ADMIN may activate Genesis")
        result = self.genesis.activate(genesis_id, role=principal.role.value)
        self._last_genesis = result
        # handoff: load Cycle 0 as ordinary world
        state = self.genesis.load_cycle0_world(result)
        # use path from result for start_world
        from pathlib import Path

        seed_path = Path(result.get("chamber_seed_path") or Path.cwd() / "fixtures" / "v01-seed" / "world-seed.json")
        started = self.start_world(seed_path)
        # override identity fields after load
        with self._writer:
            st = self.store.get_state()
            st.world_id = result["world_id"]
            st.seed = result["world_seed"]
            st.cycle = 0
            self.store._state = st
        return {
            "result": result,
            "world": {
                "world_id": result["world_id"],
                "seed": result["world_seed"],
                "cycle": 0,
                "ordinary_world_valid": True,
                "started": started,
            },
            "player_entry": self.genesis.player_entry_view(result),
            "config_frozen": True,
        }
