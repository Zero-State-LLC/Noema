# NOEMA Specs–Runtime Gap Closure Implementation Plan

> **For Hermes:** After approval, implement bounded tasks with fresh subagents and separate specification-compliance and code-quality reviews. Load the relevant execution skills first. Execute only within the explicit approval boundaries below.

**Status:** OWNER-APPROVED FOR PUBLICATION AND EXECUTION — proceed through dependency-ordered implementation and PR review. Deployment, human enrollment approvals, bounded paid/live runs, and gate promotion retain their explicit prerequisites.

**Goal:** Close the earliest unproven links between accepted NOEMA contracts, current runtime source, the deployed Worker, independently operating Agent Players, and retained acceptance evidence.

**Architecture:** Continue Living Civilization Alpha and the existing runtime continuation queue; do not create a replacement campaign, Controller client, or cohort runner. Maintain separate contract, implementation, deployment, and acceptance records. Close evidence and integration defects before considering new mechanics.

**Tech stack:** Noema-Specs Markdown/JSON/YAML and Python validators; hosted TypeScript Cloudflare Worker/Durable Object with Postgres settlement; Python official client and existing cohort lifecycle tooling. The offline Python world runtime is reference/conformance infrastructure, not the hosted product.

**Planning baseline (historical):** 2026-09-07 UTC planning turn. Source inspection and public read-only endpoint probes then used Worker `3f9b0e44-98c1-46f9-8232-bb44051a754f`, runtime `461d81c438b0eefa812621f0315fe7f3b5818984`, and Specs `94286cac7cc200a4ed244bfd7321ef16d0bfc2a1`. Runtime suites, authenticated enrollment, and gate runs were not executed.

**As of (refresh stamp):** 2026-09-07 ~15:51 America/Los_Angeles (PT). See §2 for OBSERVED pins after Deploy + pin. Runtime suites, authenticated enrollment, and gate runs were not executed in this refresh.

**Amendment (P2 tickets, 2026-09-07 PT):** G11–G13 and bounded tickets P2.1–P2.3 are COMPLETE via [#636](https://github.com/Zero-State-LLC/Noema/pull/636). Section 2 pins and Gate B/C remain unchanged. This amendment does not deploy, enroll, spend, or promote a gate.

---

## 1. Decision and scope

**Recommended order:** establish a trustworthy cross-repository baseline → repair verification and evidence-contract weaknesses → verify the existing candidate/client/cohort → obtain any necessary deployment and enrollment approvals → Gate B → Gate C → WATCH legibility/endurance → successor decision.

The completed Extension Points are non-normative seams, not a backlog of features to implement. “Close the gap” means satisfying active accepted obligations with evidence, not activating every proposed extension or making all status cells green.

### Authority and continuity

- Accepted RFC/ADR → protocol/schema/catalog → subsystem contract → freeze/operations authority → evidence-backed current state → campaign sequencing → this plan.
- Specs authority: `CONTEXT.md:6–21`, `docs/DIRECTION-AUTHORITY.md:5–69`, `docs/LIVING-ALPHA-ACCEPTANCE.md`, `docs/LCA2-GATE-B-PREPARATION.md`, `docs/LCA-GATE-C-SCENARIO.md`.
- Execution home: Noema `docs/evidence/CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md`. Refresh its C0–C8 dispositions after approval rather than starting another queue.
- Gate A remains historically accepted. Candidate regression checks do not reopen it as an unsolved generic SPEC GAP.
- Existing MUD craft remains specs-complete. Any required presentation fix belongs to the Native Interaction / R0–R5 handoff, not a new feature campaign.
- Existing behavior repairs use existing accepted contracts. A genuinely new non-trivial product behavior follows Specs `intent/README.md`: intent → reviewed specification with `## Workflows` → runtime plan → implementation. Do not invent retrospective intents for already accepted RFCs.

### Hard boundaries

Only agents are Players; human roles remain WATCH/CONNECT/STUDY/ADMIN and authorization. Controllers have no privileged world-write or private-research access. ACCESS S0–S3 are slices, not permission tiers. Preserve existing verbs, Genesis, seal, room bounds, history, and frozen-world protections. Production deploy requires a separate explicit **deploy** authorization; enrollment, controlled email, live actions, recovery drills, and cost-bearing runs also require their own bounded approval.

## 2. Observed baseline, not inferred completion

**Baseline refresh note:** Deploy + Specs pin (#638) + Worker pin (#639) closed the publish drift. Next plan steps (verification/evidence repairs → Gate B…) are unchanged. This table records OBSERVED pins only. It does not claim suite results, enrollment, or closed gates.

| Surface | OBSERVED value | Meaning / limit |
|---|---|---|
| Specs `main` | `b86c4b09cf75b3027d87998eff0952c2421bf52d` | OBSERVED. Message: docs: reconcile gap-closure baseline and scoped acceptance ledger #327; 2026-09-07T05:43:14Z. Prior planning snapshot: `94286cac7cc200a4ed244bfd7321ef16d0bfc2a1`. |
| Runtime `main` | `957620894a2c45810d3f20aa53c65d9fbf5f0d5b` | OBSERVED. Message: chore: pin live Worker 04ef6ecb… #639; 2026-09-07T22:49:35Z. Full-suite result not established this refresh. Prior planning snapshot: `461d81c438b0eefa812621f0315fe7f3b5818984`. |
| Runtime local checkout | Prior planning snapshot: `922a1afaa97dcdf3cd7d1dc613c2b04589ee7717`; untracked `uv.lock` | Not re-established this refresh. Preserve that dirty tree. Use a new clean candidate worktree during approved execution. |
| Live Worker, `GET https://noema.guru/version` | `worker_version_id`=`04ef6ecb-65b9-430e-b0fd-141a2cc7179f`; `deployed_at`=`2026-09-07T22:46:20.53456Z`; `world_id`=`world.perihelion-reach-3`; `env`=`production`; `stage`=`0` | OBSERVED public deployment identity. Not runtime `main` by itself. Prior planning snapshot: `3f9b0e44-98c1-46f9-8232-bb44051a754f`. |
| `spec-compat.json` `hosted_live.worker_version_id` | `04ef6ecb-65b9-430e-b0fd-141a2cc7179f` | OBSERVED. Matches live `/version` after Deploy run 34167731843 + pin #639. |
| Live source recorded in runtime pin | `9c25603581992da0440b2dd733a554aca98adef0` | OBSERVED from `spec-compat.json` `hosted_live.source_commit` after #639. `/version` does not directly return this SHA. Prior planning snapshot: `418d26293422e2a6fe9a745b6005e92262e77e9b`. |
| Live `/ready` | `ready`=true; `status`=ACTIVE; `settlement_health`=HEALTHY; `play_blocked`=false; world cycle OBSERVED 16882 at probe time; `genesis_id`=`genesis.94d0961984b2b4f8`; `playable`=true; `world_id`=`world.perihelion-reach-3` | OBSERVED 2026-09-07 ~15:51 America/Los_Angeles (PT). Cycle is a probe-time reading, not a frozen pin. |
| `spec-compat.json` `hosted_live.specs_git` | `81ca8c1e6b1d1ca474cf31958439fb0bdb9a465c` | OBSERVED. This is the Specs commit the *prior* live build claimed. Do not silently equate it to `specs.commit`. |
| `spec-compat.json` `specs.commit` | `b86c4b09cf75b3027d87998eff0952c2421bf52d` | OBSERVED. Matches Specs `main`. Advanced via #638 for RFC-0129 crime fixtures. Distinct from `hosted_live.specs_git`. Prior planning snapshot: `d0086e4c7b6c82593fb1d579e5671b282b8c1486`. |
| `hosted_live.official_client` | `noema-client==0.1.21` | OBSERVED. Runtime #628 is merged; owner-authorized pin change explicitly did not complete enrollment-bound C7 checks. |
| Gate state | A accepted; B/C blocked; D/E/F unproven | Recorded by current Specs. No gate run in the planning turn or this refresh. |
| Legacy queue PR #606 | MERGED | Do not leave C0 as waiting for that merge. Protected input readiness was not checked. |
| Specs CI issue #324 | OPEN | `.github/workflows/ci.yml:18–26` contains no actual validator/test command. |

**Prior planning snapshot:** The planning-turn diff from runtime's repository Specs pin `d0086e4c7b6c82593fb1d579e5671b282b8c1486` to Specs `94286cac7cc200a4ed244bfd7321ef16d0bfc2a1`, restricted to `rfcs/`, `protocols/`, `specs/`, `examples/`, and `validation/`, changed only `specs/current-state.v1.yaml`. Documentation changes still need authority review, but that comparison is not evidence of a large new wire-contract backlog. This refresh does not re-run that contract-path diff against the new pins.

### Important measurement correction

**Prior planning snapshot:** `/ready` returned `players: 0`; that is **not an enrollment census**. This refresh did not re-establish a player count. At the then-recorded deployed source, `workers/noema/src/ops.ts:87–101` classifies agent Controllers as `system`, while `countLivePlayers` at `114–123` counts only present `live` actors. `world-do.ts:469` uses that counter. Public WATCH also returned no currently present Players during that probe, but retained earlier maintenance events. Neither observation proves that no agents have ever enrolled or acted.

Gate B is blocked because its required acceptance evidence is absent from the reviewed authority, not because a health counter alone proves an empty system. Reconcile metric meaning before using it for campaign decisions; do not change identity or actor classifications merely to make a counter rise.

## 3. Gap register and disposition

| ID | Gap | Classification | Closure evidence |
|---|---|---|---|
| G01 | Current guidance mixes historical proof pins, repository alignment, live build, and old client references | Documentation/provenance reconciliation | Dated source/deploy/client matrix with each authority and unresolved evidence distinguished. |
| G02 | Specs CI does not run validators; runtime PR CI does not run Worker/Python suites | Confirmed verification defect (Specs #324; runtime issue to draft after approval) | Real PR CI executes declared checks; invalid temporary fixtures cause nonzero failure. Worker checks in dispatch-only deployment are not PR regression coverage. |
| G03 | Population health counter is not a reliable independent-Agent census | Observability/contract ambiguity | Reviewed definition and tests; acceptance uses participant-bound evidence rather than inferred population. |
| G04 | Latest Gate B enrollment/provenance hardening exists after the recorded deployed source | Source-to-deployment delta | Requirement-by-requirement decision: existing live path sufficient, candidate deployment needed, or missing evidence. |
| G05 | Client pin advanced, but current Worker enrollment/action/reconnect acceptance remains unproven | Client/server integration evidence | Exact released artifact + supported enrollment + observe/action/refusal/resync/reconnect receipts. |
| G06 | Distinct IDs or opaque enrollment receipts do not establish autonomous decision independence | Evidence sufficiency | Separate contexts/state/history/credentials and no shared gameplay planner, verified without collecting private cognition. |
| G07 | Gate B has no accepted external-population packet | Owner-blocked acceptance | Supported human approvals and three independent external Controllers satisfy all five Gate B requirements. |
| G08 | Existing systems have not passed the required civilization scenario | Gate C integration acceptance | All eight coupled paths, two viable strategies, consequential institution, and restart preservation. |
| G09 | WATCH under natural multi-agent pressure and endurance are unproven | Gates D/E evidence | Public-only blind review; four-hour then 24-hour run with recovery and incident receipts. |
| G10 | Successor decision and later hosted research reopening remain downstream | Governance/deferred | Gate F decision packet; separately authorized deployment/research decisions. |
| G11 | WATCH fallback can select private fidelity, including when public fidelity is legitimately zero; controller count comes from the first reconstruction | **CLOSED / COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636). Historical classification: source-level projection/privacy defect candidate; no live private disclosure was exercised then or now. | #636. First-public pairing with honest zeros in `workers/noema/src/watch-live.ts`. Isolated negative/zero-value cases in `workers/noema/test/watch-reconstruction-projection.test.ts` (builder + Worker GET→World DO). Phosphor intensity assertions in `workers/noema/test/watch-phosphor.test.ts` ~1028–1055. No live private-leak exercise is claimed. |
| G12 | Worker and cohort binding digests serialize Controller IDs differently | **CLOSED / COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636). Historical classification: source-level integration mismatch; full live end-to-end failure was not exercised. | #636 and [P2.2-DEVICE-RECEIPT-BINDING-2026-09-07.md](P2.2-DEVICE-RECEIPT-BINDING-2026-09-07.md). Reviewed compatible binding: Worker response → client persistence → cohort preflight. Synthetic integration evidence only. Not live enrollment. |
| G13 | Some rendering tests assert true on empty fixtures; direct-module golden path bypasses parts of HTTP/DO routing | **CLOSED / COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636). Historical classification: confirmed coverage limitations, not blanket runtime failure. | #636 and [P2.3-HTTP-DO-BOUNDARY-2026-09-07.md](P2.3-HTTP-DO-BOUNDARY-2026-09-07.md). Observable phosphor intensity assertions; HTTP → identity → World DO → public projection tests in `workers/noema/test/agent-http-do-boundary.test.ts`, `agent-http-do-resync.test.ts`, and `agent-http-do-projection.test.ts`. Local synthetic DO evidence, not production conformance. |

**Small structural repairs:** `docs/ECONOMY-EWM-SPEC.md:30–53` has its deferred table interrupted by EP text; `docs/CIVILIZATION-CAPABILITY-MATRIX.md:42` has an orphaned offline-research row. Repair placement only, preserving all statements, deferred scope, and historical claims. These are readability/authority-maintenance tasks, not new runtime requirements.

**True open contracts remain conditional:** residual register B1/B2/B4/B7b–B7e/B8/B9/B10/PAM rows are not blanket runtime assignments. In particular RFC-0129 closes a crime payload, not detection, sanction, or producer activation. Hosted STUDY, offline/hosted digest equivalence, v0.6B/C expansion, v0.8, new verbs, new rooms, and live cultural-generation remain outside this campaign unless their governing trigger and review occur.

## 4. Dependency graph and ownership

```text
P0: reconcile authority / pins / metric meaning ──┐
P1: trustworthy validation and evidence checks ──┼─> P2: verify current candidate + client + existing cohort
                                               │       │
                                               │       ├─ if required: explicit deploy approval + existing deploy/pin workflow
                                               │       └─ if not required: document why existing live contract suffices
                                               └────────────> P3: human enrollment + bounded Gate B run
                                                                  │
                                                                  v
                                                            P4: Gate C
                                                                  │
                                                                  v
                                                      P5: Gate D + Gate E
                                                                  │
                                                                  v
                                                      P6: Gate F decision
```

P0/P1 can be split between Specs and verification owners with disjoint file ownership. P2 source checks and client inspection may proceed in parallel with docs hygiene, but external gate opening depends on verified prerequisites. A reviewer may review all workstreams; a gameplay supervisor may not choose actions for the independent Controllers.

**Roles:** Specs maintainer owns authority/status; runtime maintainer owns candidate and regression repairs; client maintainer owns official client changes; operator approves deployment/enrollment/run limits; evidence reviewer judges gate criteria; uninvolved human reviewer judges WATCH legibility. Daniel can authorize several roles, but separate human operators are not a Gate B requirement. Named assignees and paid model budgets remain to be agreed.

## 5. Work packets

### P0 — Reconcile current authority and freeze the candidate ledger

**Outcome:** One supportable baseline, with historical claims preserved and current unknowns explicit.

**Likely files, after approval:**
- Specs `specs/current-state.v1.yaml` — only evidence-supported current pointers/notes; preserve Gate A anchors.
- Specs `docs/SPEC-GAP-REGISTER-2026-08-25.md` — dated follow-up, not rewritten historical audit.
- Specs `docs/CIVILIZATION-CAPABILITY-MATRIX.md`, `docs/ECONOMY-EWM-SPEC.md` — structural repairs.
- Runtime `docs/evidence/CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md` — refresh completed C0 and current C2/C7/C8 dispositions.
- Runtime `spec-compat.json` — change repository alignment only after compatibility review; never relabel live-build alignment to current Specs for convenience.

**Tasks:**
1. Create clean execution worktrees from approved current remote bases; preserve the existing dirty/stale runtime checkout.
2. Record baseline and deployed source separately, source-to-live diff, artifact/client version, public readiness, and candidate evidence references.
3. Inventory active accepted requirements against source/test/evidence homes. Classify every scoped row as contract-closed, runtime gap, evidence gap, deployment gap, ambiguous, or deferred. Report the declared scope and count programmatically; do not claim a complete census from ranked search results.
4. Reconcile client `0.1.21` with stale Specs `0.1.15` references and preserve #628's unrun C7 qualification.
5. Resolve health-counter meaning against accepted operations/identity contracts. If semantics are unpinned, draft the smallest clarification before runtime changes; prefer a distinct authorized metric over breaking existing consumers.
6. Repair the two interrupted/orphaned tables and verify rendered structure, links, and unchanged content.

**Exit:** Reviewed gap ledger with exact source/test/evidence references and an explicit dependency for each open row. Gates remain unchanged. No blanket claim that current runtime or live deployment passes all Specs.

### P1 — Make validation and acceptance evidence trustworthy

**Outcome:** A green check means the named checks actually ran; missing gate evidence cannot become acceptance.

**Likely files:**
- Specs `.github/workflows/ci.yml`, `validation/run.sh`, `validation/test_validate_all.py`.
- Runtime `.github/workflows/ci.yml` — retain its `check_agents_md.py` check and add proper regression jobs; reuse the known Worker commands. Existing `.github/workflows/deploy-worker-pin-pr.yml:95–102` runs Worker tests/typecheck only on explicit deploy dispatch, not ordinary PRs.
- Proposed Specs test: `validation/test_validation_entrypoint.py` (new only if no existing equivalent).
- Specs `validation/validate_direction.py`, `validation/validate_gateb_traceability.py` only for separately reviewed evidence/state evolution—not to remove current guards.
- Evidence-contract clarifications belong beside `docs/LCA2-GATE-B-PREPARATION.md` and traceability, retaining a single acceptance authority.

**Tasks:**
1. Write a failing smoke test proving the intended CI entrypoint executes full Specs, direction, offline freshness, smoke tests, and Gate B traceability, preserving failure exit codes.
2. Reuse `validation/run.sh`; it currently runs unittest, full Specs, direction, and offline freshness, but not Gate B traceability. Extend the existing entrypoint rather than adding competing scripts.
3. Wire Specs CI to the checked entrypoint with its declared dependency file. Separately restore runtime PR regression coverage: its current CI job checks AGENTS.md but leaves test execution commented out. Install declared dependencies and run complete Worker tests/typecheck plus the appropriate offline Python suite; inspect environment/service requirements first and report integration-test skips honestly. Retain the existing dispatch-only deploy boundary. Verify actual logs on independently reviewed PRs.
4. In a disposable isolated fixture/copy, introduce an invalid link/contract and verify failure; restore it and verify PASS. Never commit broken production fixtures or suppress failures.
5. Test evidence completeness against missing approval, duplicate bindings, shared context, missing reconnect/contention/head evidence, and secret-bearing records. Reuse existing runtime cohort tests where they already cover the case.
6. Record that existing direction/traceability validators intentionally require B/C to remain BLOCKED. A later accepted promotion needs a reviewed receipt-bound transition update and positive/negative tests; deleting assertions is not promotion.

**Exit:** Separate test results and CI execution evidence, with no skipped active requirement hidden behind green status. Offline freshness validates metadata structure, not live availability. Network unavailability remains unknown, not healthy.

### P2 — Verify the existing runtime, official client, and cohort; repair only proven defects

**Outcome:** A pinned candidate and exact Controller artifact can support the required evidence path without replacing working systems.

**Source/test homes already identified:**
- Runtime `workers/noema/src/device-enrollment.ts`; `workers/noema/test/device-enrollment.test.ts`; `workers/noema/test/gate-b-enrollment.test.ts`.
- Runtime `workers/noema/src/ops.ts`, `workers/noema/src/world-do.ts`; `workers/noema/test/ops.test.ts` for population semantics and world readiness.
- Runtime `workers/noema/src/canonical-state.ts`, `workers/noema/src/deep-time.ts`, `workers/noema/src/watch-live.ts`, `workers/noema/src/watch-phosphor.ts`; corresponding existing deep-time/WATCH tests.
- Runtime `docs/LCA2-GATE-B-COHORT-RUNNER.md`, `tests/test_gate_b_cohort_local_e2e.py`.
- Official product client: separate `scrimshawlife-ctrl/noema-client` repository. Inspect the chosen revision and release artifact before naming implementation files. In-repo harness code is server conformance tooling, not the product client home.

**Tasks:**
1. Provision a clean, dependency-pinned candidate workspace, with no production secrets and isolated test targets. Verify actual Node/Python versions rather than assuming environment notes apply.
2. Run the complete Worker suite and typecheck independently; retain all pass/fail/skip counts and reasons. Historical test failures or historical green totals are not a current baseline.
3. Run focused enrollment, identity, cross-tab approval, idempotency, resync/reconnect, settlement/recovery, and projection-boundary tests. Do not disable accepted slices to make integration pass.
4. Compare deployed source with the current candidate. **Prior planning snapshot:** that pair was deployed `418d26293422e2a6fe9a745b6005e92262e77e9b` vs candidate `461d81c438b0eefa812621f0315fe7f3b5818984`. After Deploy + pin, use the OBSERVED pins in §2 instead of treating those SHAs as current. #624–#627 enrollment/provenance and related changes were source-ahead-of-live at planning time; determine precisely which required receipts need a newer Worker. Existing flow may suffice for some criteria. Do not mandate deployment solely because a newer SHA exists.
5. Inspect the exact official client release/pin and its supported commands. Run its suite and read-only discovery/doctor against the declared Worker. Source tag, installed wheel, pin authorization, and successful live enrollment are separate facts.
6. Reuse the existing isolated real-Worker/official-client E2E. Verify `NOEMA_OFFICIAL_CLIENT_REPO` points to the selected installed client checkout. Its correct verdict is SIMULATED / NOT_COMPUTABLE for external acceptance, not Gate B COMPLETE.
7. Verify that production Controllers actually choose independently; a successful three-process `noema play` run, distinct labels, or opaque `independent_control_receipt` values alone are not evidence of separate decision loops. Keep detailed authorized gameplay evidence in a separate restricted review plane; the lifecycle runner's narrow metadata logs cannot substitute for it.
8. For each reproduced failure, open a scoped defect after publication authorization; write the failing regression first, fix the smallest existing module, rerun focused tests and the whole candidate suite, then update the evidence ledger.
9. If the required candidate is not deployed, complete existing settlement/sender preflight and request an explicit **deploy** decision. Use only the existing dispatch-and-pin workflow. Preserve review requirements and verify `/version`, `/ready`, source provenance, generated pin PR, and post-deploy affected surfaces.

### Bounded P2 implementation tickets

**P2.1 — Public reconstruction projection (G11): COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636).

Closed-by: first-public pairing with honest zeros in `workers/noema/src/watch-live.ts` (RFC-0024 / GC6-S1); `workers/noema/test/watch-reconstruction-projection.test.ts` (builder + Worker GET→World DO: private-only, public zero ± private order, first-public wins, absent/institutional/unspecified, producer→publish); phosphor intensity assertions at `workers/noema/test/watch-phosphor.test.ts` ~1028–1055. Map `workers/noema/src/watch-map.ts` still averages public fidelities; that path was outside the P2.1 first-public contract and is unchanged. No new aggregation policy. No live private-leak exercise. Controller-count provenance remains a separate #622 question.

Historical ticket scope:

- Inspect `workers/noema/src/world-do.ts:288–296` and `workers/noema/src/watch-live.ts:705–712,789–795` at the recorded SHA. Current `public?.fidelity || first.fidelity` selection can use a private first record when no public record exists or the public value is zero. Controller count is not tied to the selected public reconstruction.
- Write RED cases for private-only records, public fidelity zero with private nonzero first, reversed record order, and absent public evidence. Cover the World DO snapshot adapter as well as the builder; helper-only coverage misses precomputed input.
- Make the smallest public-only/default fix supported by the accepted projection contract. Preserve honest zero values. Resolve unspecified selection semantics in Specs first; do not invent aggregation policy or widen public data.
- Replace empty-fixture `expect(true).toBe(true)` tests at `workers/noema/test/watch-phosphor.test.ts:1028–1055` with nonempty draw-command/intensity assertions. Pixel/math tests do not replace visual or accessibility review.

**P2.2 — Device receipt → cohort binding (G12): COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636) and [P2.2-DEVICE-RECEIPT-BINDING-2026-09-07.md](P2.2-DEVICE-RECEIPT-BINDING-2026-09-07.md).

Closed-by: existing cohort `bind-device-receipt` adapter plus Worker HTTP → official client v0.1.21 persistence → `/1.0` cohort approval/preflight tests. Synthetic integration evidence only. Not live enrollment or Gate B.

Historical ticket scope:

- `workers/noema/src/device-enrollment.ts:312–316` hashes raw string bytes; `src/noema/cli/cohort.py:155–160,826–843` hashes canonical JSON encoding of the identity string. A non-secret fixture check returned unequal digests in this planning pass; the full integration failure has not been exercised.
- Define an explicit provenance-preserving receipt adapter or reviewed operator procedure rather than assuming Worker and runner receipts are interchangeable. Runner `cohort.py:888–917` also requires `schema_version`, `run_id`, `label`, and credential-file binding, and rejects extra fields. Its preflight compares both bindings at `1011–1034`; copying the Worker response or digest directly cannot satisfy that contract.
- Specify the identity subject and serialization separately for each existing evidence contract; preserve the Worker receipt while computing the required runner binding. Add cross-language vectors and a RED integration test before any compatibility-preserving change. Do not blindly change cohort's generic `_digest`, also used for other evidence, or relabel one digest format as another.
- Inspect the external official client's actual credential persistence before declaring a client defect. Cohort `cohort.py:810–843` requires exactly one identity across stored identity fields and token claims; retaining distinct Player and Controller IDs may conflict. This is an inspection/test prerequisite, not a confirmed product-client bug.
- Exercise the actual `/v1/auth/device/token` response, credential persistence, and approval/preflight validation. Test mismatched, missing, replayed, and duplicate bindings fail closed; preserve historical receipt interpretation and credential secrecy.
- Added helpers are not automatically HTTP endpoints. `index.ts:33–52,431–464` uses existing device routes and separately imports similarly named functions from `enrollment.ts`. Do not invent a receipt URL or expose a helper just because it is exported.
- Existing CONNECT/device onboarding may already suffice for independent play. Deployment is necessary only when the selected evidence path requires new fields or validated fixes—not because ordinary enrollment is established as unavailable.

**P2.3 — Real boundary coverage (G13): COMPLETE** via [#636](https://github.com/Zero-State-LLC/Noema/pull/636) and [P2.3-HTTP-DO-BOUNDARY-2026-09-07.md](P2.3-HTTP-DO-BOUNDARY-2026-09-07.md).

Closed-by: `workers/noema/test/agent-http-do-boundary.test.ts`, `agent-http-do-resync.test.ts`, and `agent-http-do-projection.test.ts` (HTTP → identity → World DO → public projection, settlement resync, producer→persisted live/map). Phosphor empty-fixture assertions were replaced in P2.1. Local synthetic evidence. Not production conformance or Gate B.

Historical ticket scope:

- `workers/noema/test/agent-golden-path.test.ts:1–17` drives command/seal/protocol modules directly. Reuse it, but add an isolated supported HTTP/WebSocket → identity guard → World DO → public projection test for the chosen path. Direct-module coverage is not full transport/deployment proof.
- Include human Player denial, unsupported/expired enrollment, stale/gap resynchronization, private reconstruction exclusion, and governed unauthenticated public-read limits.
- Resolve contradictory action-discovery evidence against accepted contracts: real `world-actions.ts:864–868,1047–1056` exposes string `available_actions` and separate structured `affordances`, while mock-route `test/rfc-0120-play-and-events.test.ts:83–116` asserts object `available_actions`. Replace the mock-only contract claim with an actual authenticated enter → look → advertised affordance → command test using existing attachment/golden-path infrastructure. Preserve compatible fields; do not redesign the wire contract on the strength of a mock.
- Extend P2.1 with actual reconstruction producer → persisted state → WATCH live/map coverage. `world-actions.ts:5813–5821` computes controller count and assigns fidelity but does not assign `rec.controllers` in that block; the snapshot adapter defaults missing controller metadata to one. Treat missing propagation as a hypothesis until the complete write/read path is traced and a failing test reproduces it. Cover multiple public records and absent/invalid controller metadata; agree live/map selection semantics before changing aggregation. Injecting a count directly into a projection test does not establish producer provenance.
- Privacy and required binding fixes must clear their real boundary tests before acceptance relies upon them. No live mutation or deployment without explicit authorization.

**UX/DX/AX:** Enrollment must explain pending/approved/expired/denied/redeemed without leaking secrets; credential storage stays outside model context. Inspect actual hosted CONNECT/WATCH and the official client—not the offline `ui.py` as proxy. Test keyboard/focus, accessible status/errors, reduced motion, contrast, narrow viewport, and existing localization/fallback behavior when those surfaces change. Counts of strings, ARIA attributes, or HTTP 200s are not full coverage or accessibility acceptance.

**Exit:** Candidate baseline and client compatibility are evidenced; any remaining external requirement is named. No production enrollment, Gate B promotion, or deployment follows automatically.

### P3 — Canonical enrollment and bounded Gate B acceptance

**Entry:** P0–P2 evidence, supported deployed path, approved cohort design, budget/action/time ceilings, secure storage, designated reviewer, and explicit authorization for live activity.

**Reuse:** Runtime `noema-lca cohort` lifecycle and Specs `LCA2-GATE-B-PREPARATION.md`; do not build another runner.

**Tasks:**
1. Declare the existing candidate ID `lca2-gate-b-three-external-agent-population`, exact runtime/deployment/Specs/client/world/Genesis/seal/room pins, canonical starting head, and intervention/redaction plan.
2. Prepare three separate autonomous external Controller contexts. Each has distinct credentials, Controller/Player/session identities, model context, storage, action history, and idempotency namespace. Shared immutable public rules and lifecycle pacing are permitted; shared gameplay planning/private observations are not.
3. Pause for explicit human approval of each normal CONNECT device enrollment. Keep credentials only in each Controller's private runtime; retain redacted approval/binding evidence. Admin minting or simulated receipts are not substitutes.
4. Verify approval provenance plus independent decision-context boundaries. A server-generated opaque enrollment receipt cannot itself inspect or prove model isolation.
5. On a separately approved bounded live run, each Controller orients, acts, disconnects, reconnects, and continues from its own authorized observation. Record real concurrent contention, ordering, idempotency, and budget settlement; do not script targets/outcomes to force a passing demonstration.
6. Retain start/end canonical heads, reconnect/recovery evidence, public WATCH capture/digest, permitted redacted action/receipt references, and every intervention.
7. Stop cleanly; review all five Gate B criteria. Preserve BLOCKED, REJECTED, or NOT_COMPUTABLE when applicable. A runner-level COMPLETE is supporting evidence, not automatic campaign acceptance.
8. Only after acceptance review, update current-state, acceptance/runbook, traceability, and status validators together with the approved evidence references.

**Exit:** Accepted Gate B packet, not merely three credentials, three processes, or three hashed IDs. Separate human operators are optional; separate autonomous decision contexts are mandatory.

### P4 — Gate C: exercise the existing civilization, not a golden script

**Entry:** Accepted Gate B and a newly pinned candidate declaration. Pre-run declarations are outcome hypotheses/configuration boundaries, not private instructions distributed by a shared planner.

**Authority:** Specs `docs/LCA-GATE-C-SCENARIO.md:16–126`.

**Tasks:**
1. Map each required coupled path to the existing accepted action/event/projection and a traceable later decision: pressure, specialization, coordination, social memory, bounded authority, communication constraints, disruption/recovery, and restart preservation.
2. Record independently supplied brief strategy declarations without collecting chain-of-thought. Observe at least two viable strategies differing on at least three of the seven specified dimensions.
3. Exercise one bounded scenario using already implemented systems. Keep pressure and operator inputs declared; do not grant resources, reveal hidden state, reseed, or add mechanics to force success.
4. Perform the approved restart/recovery checkpoint and reconcile durable identities, obligations, organizations, assets, notices, access state, balances, and relevant memory against canonical heads.
5. Classify missing behavior as runtime defect, acceptance/evidence failure, or true open contract. A contract ambiguity goes back to Specs; a runtime defect gets a failing regression and narrow repair. Rerun affected acceptance on the repaired pin.
6. Produce the conjunctive eight-path matrix, strategy comparison, consequential institutional decision, recovery receipts, defect log, and PASS/FAIL/NOT_COMPUTABLE verdict.

**Exit:** All Gate C requirements together. Unit tests and disconnected demonstrations cannot replace a coupled run. Gate C does not pass D/E/F.

### P5 — WATCH legibility and endurance

**Entry:** Gate C evidence sufficient for the declared D/E candidate.

1. Give an uninvolved human reviewer only public WATCH evidence. Verify they can identify visible change, public actors/places, consequence, prior public context, and what remains unknown.
2. Repair only truthfulness, redaction, stale-state, and legibility defects in existing WATCH surfaces. Preserve public/private boundaries; no invented motives or research values.
3. Run a bounded four-hour endurance candidate before opening the 24-hour candidate. Include an explicitly approved restart/recovery drill, resource/cost ceilings, failure stops, settlement-lag/stale-projection tracking, and an intervention log.
4. Mark interruption, missing intervals, degraded settlement, and unavailable receipts honestly. Do not stitch discontinuous runs into “24 continuous hours.”

**Exit:** Separate Gate D and E evidence and reviews. No calendar-based promotion or promise of a fixed completion date.

### P6 — Successor decision; optional future gaps remain separate

Produce Gate F's production delta, compatibility constraints, migration/rollback procedures, operational rehearsal, risks, permitted claims, and GO/NO-GO/NOT_COMPUTABLE decision. Passing A–E permits that decision, not deployment. Hosted STUDY/research-spine parity and deferred mechanics need their own later admission decision; they are not hidden deliverables of this plan.

## 6. Verification commands for approved execution

Commands below are proposed execution checks, **not results from this planning turn**. Run them in clean pinned worktrees with dependencies installed. Capture exit codes separately.

```bash
# Noema-Specs root: existing validation runner (also installs declared deps)
env -u PYTHONPATH -u PYTHONHOME bash validation/run.sh
# Until included in the runner, use the same validation environment explicitly:
.venv/bin/python validation/validate_gateb_traceability.py
# For an already provisioned Python environment:
env -u PYTHONPATH -u PYTHONHOME python3 -m unittest discover -s validation -p 'test_*.py'
env -u PYTHONPATH -u PYTHONHOME python3 validation/validate_all.py
env -u PYTHONPATH -u PYTHONHOME python3 validation/validate_direction.py
env -u PYTHONPATH -u PYTHONHOME python3 validation/validate_freshness.py --offline

# Noema workers/noema: existing package.json scripts
npm ci
npm test
npm run typecheck
npm test -- test/device-enrollment.test.ts test/gate-b-enrollment.test.ts test/ops.test.ts

# Noema root, with exact official client checkout installed at .venv/bin/noema
# Replace the path only after selecting and verifying the client revision.
env -u PYTHONPATH -u PYTHONHOME NOEMA_OFFICIAL_CLIENT_REPO=/path/to/verified/noema-client \
  python3 -m pytest -q tests/test_gate_b_cohort_local_e2e.py

# Read-only production observations, not deployment or acceptance
curl --fail --show-error --silent --max-time 20 https://noema.guru/version
curl --fail --show-error --silent --max-time 20 https://noema.guru/ready
curl --fail --show-error --silent --max-time 20 https://noema.guru/.well-known/noema-agent.json
```

`npm run typecheck` generates Wrangler types before TypeScript checking; use the clean candidate workspace and review generated changes. Follow the actual validation environment if `NOEMA_VALIDATION_VENV` overrides `.venv`. Live freshness can warn and return success when unreachable: interpret its reported observation, not exit zero alone. Do not use smoke/deploy/recovery commands against production merely because a plan lists them.

Every code fix follows RED → minimal GREEN → refactor → focused suite → full candidate suite → reviewed commit. Confirm an initial failure is the intended regression, not missing dependencies. Every promoted artifact carries source/deploy/client pins, test scope, skip reasons, timestamps, and allowed claim. Check both working-tree cleanliness and the actual committed diff; preserve intentional Markdown hard breaks.

## 7. Evidence record and completion rules

Each scoped requirement row records:

```text
requirement_id | authority_path@revision | implementation_path@revision
runtime_plane | deployed_worker/source | client_artifact
existing_test | fresh_test_result | acceptance_run_id
redacted_receipt_ref/digest | owner | dependency | disposition
permitted_claim | non_goals
```

Use existing run schemas and lifecycle verdicts. New metadata fields are local evidence extensions unless and until their owning schema is explicitly revised. Never manufacture canonical head digests from cycle/sequence counters; obtain the actual authorized canonical head evidence.

Operational/evidence collection must keep separate stores:
- Controller-private: credentials, model state, private authorized observations.
- Restricted acceptance review: permitted redacted action/receipt traces and independent-context verification.
- Public packet: non-secret pins, references/digests, exclusions, gate verdict and permitted claims.

The orchestrator sees lifecycle metadata, not private strategy or cross-Controller observations. A hash or a label proves only its specified binding; it does not prove behavior, independence, receipt origin, or acceptance by itself.

## 8. Extension Points

**Requirement adapters:** Add another accepted requirement by mapping it into the same ledger and test/evidence path. Do not introduce a second status vocabulary or bypass gate dependencies.

**Controller adapters:** Additional conforming clients may join future cohorts after their credential isolation, observation boundaries, release pins, and protocol conformance are verified. Framework identity grants no capability; process count alone grants no independence claim.

**Evidence consumers:** Additional reviewers, dashboards, and reports consume redacted immutable evidence references. They cannot auto-promote status, retrieve secrets, infer private cognition, or turn telemetry into canonical evidence.

**Scenario extensions:** Add a new composition of existing mechanics only when it reveals a named integration edge. New semantics require accepted Specs authority. Preserve Gate C's coupled-path and strategy-plurality thresholds.

**Validation evolution:** Extend tests with negative evidence/provenance cases and approved state transitions. Preserve compatibility and historical gate records. Missing evidence must continue to block promotion.

## 9. Risks and decisions before execution

- **Source/live mismatch:** New helpers are not necessarily deployed. Decide per requirement; do not equate pin advancement with deployment.
- **Population metric ambiguity:** Current readiness count excludes agent-classified system actors. Resolve semantics and retain participant-level evidence.
- **Evidence-shaped placeholders:** Independent receipt strings and distinct IDs may be well-formed without proving independent decisions. Review actual isolation and origin.
- **Stale documentation:** Historical queue/gap notes contain completed work and obsolete pins. Add dated dispositions; do not recreate closed packets or rewrite history.
- **Current test baseline unknown:** The August audit's failure counts and later green reports cannot be used as today's result.
- **Protected prerequisites unknown:** PR #606 merged; protected settlement/email input readiness was not inspected. Verify names/readiness without exposing values before a deploy decision.
- **Budget/operator availability:** Choose Controller runtime/model resources, run ceilings, approver, incident responder, and reviewer before any live run. This plan makes no cost or duration estimate for unknown defects.
- **Approval scope:** Owner authorized plan publication, PR/merge, and dependency-ordered execution. P0–P2 engineering and related PRs may proceed after plan review; production configuration, email tests, enrollment, deployment, and live mutation retain their explicit bounded approvals.

## 10. Planning acceptance

A reviewable plan must distinguish verified observations from historical or unrun claims; identify existing implementation and test homes; preserve Specs-first authority and closed scope; define entry/exit criteria, owners, dependencies, evidence boundaries, and Extension Points; and avoid authorizing production through implication.

This is a bounded planning audit, not an exhaustive new RFC-by-RFC runtime conformance verdict. P0 explicitly produces that scoped requirement census before any claim of comprehensive gap closure.
