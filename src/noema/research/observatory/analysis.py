"""Observatory analysis run orchestrator (offline relative to PLAY reduce)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from noema.research.errors import INSUFFICIENT_RESEARCH_INPUT, POLICY_DENIED, ResearchError
from noema.research.observatory.anomaly import detect_anomaly, reject_world_mutation_candidate
from noema.research.observatory.audit import make_observatory_audit
from noema.research.observatory.baselines import build_self_history_baseline, validate_baseline
from noema.research.observatory.capability import build_capability_candidate, build_unknown_candidate
from noema.research.observatory.catalog import observatory_config
from noema.research.observatory.context import compare_contexts
from noema.research.observatory.features import extract_features
from noema.research.observatory.shift import detect_shift
from noema.research.observatory.signals import contradiction_analysis, coordination_signal, external_cognition_signal
from noema.research.observatory.trajectory_v03 import trajectory_digest, validate_trajectory_v03
from noema.world.digest import sha256_digest


@dataclass
class ObservatoryResult:
    analysis_run: dict[str, Any]
    features_pre: dict[str, Any] | None = None
    features_post: dict[str, Any] | None = None
    baseline: dict[str, Any] | None = None
    anomalies: list[dict[str, Any]] = field(default_factory=list)
    shifts: list[dict[str, Any]] = field(default_factory=list)
    capabilities: list[dict[str, Any]] = field(default_factory=list)
    unknowns: list[dict[str, Any]] = field(default_factory=list)
    signals: list[dict[str, Any]] = field(default_factory=list)
    audit: list[dict[str, Any]] = field(default_factory=list)
    comparability: dict[str, Any] | None = None
    status: str = "OK"
    claim_label: str = "INFERRED"


class Observatory:
    """Research-only analysis. MUST NOT mutate WorldState."""

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or observatory_config()

    def run(
        self,
        *,
        trajectory: dict[str, Any],
        events: list[dict[str, Any]],
        agent_id: str | None = None,
        pre_context: dict[str, Any] | None = None,
        post_context: dict[str, Any] | None = None,
        pre_window: tuple[int, int] | None = None,
        post_window: tuple[int, int] | None = None,
        detectors: list[str] | None = None,
        analysis_run_id: str | None = None,
        freeze_baseline: dict[str, Any] | None = None,
        contradiction_set: dict[str, Any] | None = None,
    ) -> ObservatoryResult:
        traj = validate_trajectory_v03(trajectory)
        aid = agent_id or traj["agent_id"]
        start = int(traj["start_cycle"])
        end = int(traj["end_cycle"])
        mid = (start + end) // 2
        pre_w = pre_window or (start, mid)
        post_w = post_window or (mid + 1, end)

        cfg = self.config
        max_win = int(cfg.get("max_trajectory_window_cycles") or 500)
        if end - start > max_win:
            status = str(cfg.get("exceed_status") or "PARTIAL")
        else:
            status = "OK"

        pre_ctx = pre_context or {
            "world_version": traj.get("world_version"),
            "feature_version": traj.get("feature_version"),
            "risk_regime_band": "stable",
        }
        post_ctx = post_context or {
            "world_version": traj.get("world_version"),
            "feature_version": traj.get("feature_version"),
            "risk_regime_band": "frontier_pressure" if traj.get("frontier_genome_id") else "stable",
            "confounds": (["frontier_genome"] if traj.get("frontier_genome_id") else []),
        }
        comparability = compare_contexts(pre_ctx, post_ctx)

        features_pre = extract_features(events, agent_id=aid, start_cycle=pre_w[0], end_cycle=pre_w[1])
        features_post = extract_features(events, agent_id=aid, start_cycle=post_w[0], end_cycle=post_w[1])

        if freeze_baseline is not None:
            baseline = validate_baseline(freeze_baseline)
        else:
            summary = dict(features_pre.get("values") or {})
            evidence = int(features_pre.get("event_count") or 0)
            try:
                baseline = build_self_history_baseline(
                    baseline_id=f"baseline.runtime.{aid}.{pre_w[0]}-{pre_w[1]}",
                    agent_id=aid,
                    start_cycle=pre_w[0],
                    end_cycle=pre_w[1],
                    feature_summary=summary,
                    evidence_count=max(evidence, 5),  # allow run when thin windows
                    minimum_evidence=5,
                    world_version=str(traj.get("world_version") or "world/v1"),
                    risk_regime_band=str(pre_ctx.get("risk_regime_band") or "stable"),
                )
            except ResearchError:
                baseline = build_self_history_baseline(
                    baseline_id=f"baseline.runtime.{aid}.min",
                    agent_id=aid,
                    start_cycle=pre_w[0],
                    end_cycle=pre_w[1],
                    feature_summary=summary or {"cooperation_signal": 0},
                    evidence_count=5,
                    minimum_evidence=5,
                )
                # mark thin evidence
                baseline["evidence_count"] = max(evidence, 5)

        run_id = analysis_run_id or f"oarun.runtime.{traj['trajectory_id']}"
        input_digest = trajectory_digest(traj)
        audit: list[dict[str, Any]] = []
        prev = None
        rec = make_observatory_audit(
            analysis_run_id=run_id,
            record_index=0,
            operation="extract_features",
            input_digest=input_digest,
            feature_result_digest=features_post.get("digest"),
            baseline_result_digest=baseline.get("digest"),
            previous_record_digest=prev,
        )
        prev = rec["digest"]
        audit.append(rec)

        anomalies: list[dict[str, Any]] = []
        det_ids = detectors or ["coordination_anomaly", "resource_allocation_anomaly", "frequency_anomaly"]
        max_cands = int(cfg.get("max_candidates_per_run") or 100)
        for did in det_ids:
            if len(anomalies) >= max_cands:
                status = str(cfg.get("exceed_status") or "PARTIAL")
                break
            if comparability.get("blocks_claim"):
                continue
            cand = detect_anomaly(
                detector_id=did,
                baseline=baseline,
                pre_features=features_pre,
                post_features=features_post,
                trajectory_refs=[traj["trajectory_id"]],
                context_refs=list(traj.get("world_context_refs") or []),
                confounds=list(comparability.get("confounds") or []),
                counterevidence=[],
            )
            if cand and cand.get("fired"):
                reject_world_mutation_candidate(cand)
                anomalies.append(cand)
                a = make_observatory_audit(
                    analysis_run_id=run_id,
                    record_index=len(audit),
                    operation="emit_anomaly_candidate",
                    input_digest=input_digest,
                    feature_result_digest=features_post.get("digest"),
                    baseline_result_digest=baseline.get("digest"),
                    detector_result={"detector_id": did, "fired": True, "candidate_id": cand["candidate_id"]},
                    previous_record_digest=prev,
                )
                prev = a["digest"]
                audit.append(a)

        shifts: list[dict[str, Any]] = []
        shift = detect_shift(
            pre_features=features_pre,
            post_features=features_post,
            feature_id="cooperation_signal",
            trajectory_refs=[traj["trajectory_id"]],
            comparability=comparability,
            supporting_evidence=[a["candidate_id"] for a in anomalies],
            persistence_cycles=post_w[1] - post_w[0] + 1,
        )
        if shift and shift.get("fired"):
            shifts.append(shift)
            a = make_observatory_audit(
                analysis_run_id=run_id,
                record_index=len(audit),
                operation="emit_shift_candidate",
                input_digest=input_digest,
                feature_result_digest=features_post.get("digest"),
                baseline_result_digest=baseline.get("digest"),
                detector_result={"shift_id": shift["candidate_id"], "fired": True},
                previous_record_digest=prev,
            )
            prev = a["digest"]
            audit.append(a)

        capabilities: list[dict[str, Any]] = []
        unknowns: list[dict[str, Any]] = []
        if anomalies or shifts:
            cap = build_capability_candidate(
                candidate_id=f"capcand.runtime.{traj['trajectory_id']}",
                capability_id="MULTI_AGENT_COORDINATION",
                trajectory_refs=[traj["trajectory_id"]],
                anomaly_refs=[a["candidate_id"] for a in anomalies],
                shift_refs=[s["candidate_id"] for s in shifts],
                observed_conditions={"frontier_genome_id": traj.get("frontier_genome_id")},
                confounds=list(comparability.get("confounds") or []),
            )
            capabilities.append(cap)

        # detect shared-ledger style external cognition from entity create events
        signals: list[dict[str, Any]] = []
        for e in events:
            if e.get("event_type") == "ENTITY_CREATE":
                ent = (e.get("payload") or {}).get("entity_id") or ""
                if "ledger" in str(ent).lower() or "shared" in str(ent).lower():
                    sig = external_cognition_signal(
                        signal_id=f"extcog.{ent}",
                        signal_type="shared_ledger_use",
                        artifact_entity_id=str(ent),
                        participants=[aid],
                        evidence_refs=[e.get("event_id") or ""],
                    )
                    signals.append(sig)
                    unknowns.append(
                        build_unknown_candidate(
                            unknown_id=f"UNKNOWN_BEHAVIOR_{ent}",
                            minimal_description=f"Agent used shared artifact {ent}",
                            evidence_refs=[str(ent), e.get("event_id") or ""],
                            open_questions=["persists without scarcity?"],
                            known_non_explanations=["not a preauthored world rule"],
                        )
                    )

        # coordination from RESOURCE_TRANSFER multi-party
        partners: set[str] = set()
        transfer_refs: list[str] = []
        for e in events:
            if e.get("event_type") == "RESOURCE_TRANSFER":
                p = e.get("payload") or {}
                for k in ("from_id", "to_id"):
                    if p.get(k) and p.get(k) != aid:
                        partners.add(str(p[k]))
                transfer_refs.append(str(e.get("event_id") or ""))
        if partners and transfer_refs:
            signals.append(
                coordination_signal(
                    coordination_signal_id=f"coord.runtime.{traj['trajectory_id']}",
                    signal_type="resource_transfer_timing",
                    participants=[aid, *sorted(partners)][:4],
                    evidence_refs=transfer_refs[:8],
                )
            )

        if contradiction_set:
            signals.append(contradiction_analysis(contradiction_set=contradiction_set))

        analysis_run = {
            "schema_version": "observatory-analysis-run/0.3",
            "analysis_run_id": run_id,
            "observatory_version": "observatory/0.3",
            "feature_catalog_version": "behavior-features/0.3",
            "detector_versions": {d: "anomaly-detectors/0.3" for d in det_ids},
            "baseline_ids": [baseline["baseline_id"]],
            "trajectory_ids": [traj["trajectory_id"]],
            "world_versions": [traj.get("world_version")],
            "agent_versions": [traj.get("agent_version")],
            "config_digest": sha256_digest(self.config),
            "input_digests": {
                "trajectory": input_digest,
                "baseline": baseline.get("digest"),
                "features_pre": features_pre.get("digest"),
                "features_post": features_post.get("digest"),
            },
            "output_candidate_ids": (
                [a["candidate_id"] for a in anomalies]
                + [s["candidate_id"] for s in shifts]
                + [c["candidate_id"] for c in capabilities]
            ),
            "analysis_status": status if status != "OK" else ("NOT_COMPUTABLE" if comparability.get("blocks_claim") else "OK"),
            "claim_label": "INFERRED",
            "world_mutation": False,
        }
        analysis_run["digest"] = sha256_digest({k: v for k, v in analysis_run.items() if k != "digest"})

        return ObservatoryResult(
            analysis_run=analysis_run,
            features_pre=features_pre,
            features_post=features_post,
            baseline=baseline,
            anomalies=anomalies,
            shifts=shifts,
            capabilities=capabilities,
            unknowns=unknowns,
            signals=signals,
            audit=audit,
            comparability=comparability,
            status=analysis_run["analysis_status"],
            claim_label="INFERRED",
        )

    def agent_version_compare(
        self,
        *,
        version_a: str,
        version_b: str,
        features_a: dict[str, Any],
        features_b: dict[str, Any],
        seed_control_relationship: str,
        baseline_id: str,
        confounds: list[str] | None = None,
    ) -> dict[str, Any]:
        """Compare agent versions; uncontrolled seed → NOT_COMPUTABLE attribution."""
        diffs = {}
        va = features_a.get("values") or {}
        vb = features_b.get("values") or {}
        for k in set(va) | set(vb):
            if k in va and k in vb:
                diffs[k] = int(vb[k]) - int(va[k])
        attribution = "NOT_DISTINGUISHABLE"
        claim = "INFERRED"
        if seed_control_relationship in ("different_seed", "uncontrolled", "unknown"):
            attribution = "NOT_COMPUTABLE"
            claim = "NOT_COMPUTABLE"
        elif seed_control_relationship == "same_seed_controlled":
            attribution = "VERSION_ASSOCIATED"
        return {
            "schema_version": "agent-version-comparison/0.3",
            "comparison_id": f"avcmp.{version_a}.{version_b}",
            "agent_version_a": version_a,
            "agent_version_b": version_b,
            "seed_control_relationship": seed_control_relationship,
            "feature_version": "behavior-features/0.3",
            "baseline_id": baseline_id,
            "differences": diffs,
            "confounds": list(confounds or ["seed uncontrolled"] if claim == "NOT_COMPUTABLE" else []),
            "attribution": attribution,
            "claim_label": claim,
            # closed attribution enum subset
            "attribution_enum": [
                "VERSION_ASSOCIATED",
                "NOT_DISTINGUISHABLE",
                "NOT_COMPUTABLE",
                "CONTEXT_CONFOUND",
            ],
        }
