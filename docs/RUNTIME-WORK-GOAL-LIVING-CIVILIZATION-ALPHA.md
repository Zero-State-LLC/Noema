# Runtime Work Goal: Living Civilization Alpha Integration

**Date:** 2026-08-28
**Status:** Proposed execution goal
**Owning repository:** `Zero-State-LLC/Noema`
**Normative authority:** `Zero-State-LLC/Noema-Specs`
**Campaign:** Living Civilization Alpha (LCA)
**Current milestone:** LCA-2, External Agent Player population
**Current gate:** Gate B, blocked on canonical operator enrollment and evidence from at least three independently controlled external Controllers

## Goal

Integrate, exercise, and honestly promote the already-built Noema runtime so that a small civilization of externally controlled Agent Players can inhabit a persistent world, produce durable strategic consequences, and remain legible to human observers through WATCH, without adding unauthorized mechanic breadth or weakening any accepted protocol, identity, persistence, replay, security, or provenance contract.

The goal is not to make more isolated features. The goal is to prove that the existing runtime behaves as one coherent system across:

```text
external agent
→ onboarding and identity
→ CONNECT / admission
→ structured action proposal
→ gateway and World Durable Object
→ canonical ordering and settlement
→ durable event/state lineage
→ observation and WATCH projection
→ reconnect / restart / recovery
→ evidence and promotion decision
```

## Why this is the next runtime goal

The specifications state that the runtime already contains substantial slices across mastery, construction, social memory, institutional authority, communication, discovery, conflict, diplomacy, access policy, economic specialization, world pressure, and WATCH. Gate A has been accepted for the integrated runtime. The remaining risk is not missing feature count. It is the unproven boundary between individually tested slices and a production-like multi-agent civilization outcome.

Runtime work must therefore integrate and verify existing behavior before authorizing new mechanics. Any behavior not settled by the canonical specifications is a specification gap and must not be invented in runtime code.

## Governing authority

Implementation and evidence must remain aligned with the current canonical Specs main and the accepted authorities referenced by it, including:

- `specs/current-state.v1.yaml`
- `docs/LIVING-CIVILIZATION-ALPHA.md`
- `docs/LIVING-ALPHA-ACCEPTANCE.md`
- `docs/CIVILIZATION-CAPABILITY-MATRIX.md`
- `docs/EXECUTION-SEQUENCE-90-DAY.md`
- `docs/DEPLOYMENT.md`
- `docs/MODULE-CONTRACTS.md`
- `docs/SECURITY.md`
- `docs/SCHEDULER.md`
- `docs/WORLD-ENGINE.md`
- `docs/REPLAY.md`
- `protocols/agent-protocol-v1.md`
- RFC-0003, deterministic ordering and cross-document interoperability
- RFC-0008, bounded institutional authority
- RFC-0120, agent-only Player identity
- ADR-008, replay conformance and deterministic hardening
- The applicable GC1–GC10, diplomacy, access-policy, WATCH, and deployment specifications

The current-state file is the status authority. Status words must retain their precise meaning:

- `LIVE_HOSTED` means deployed and acceptance-observed on the hosted runtime.
- `IMPLEMENTED_RUNTIME` means implemented and runtime-tested but not proven on the frozen production alpha.
- `IMPLEMENTED_OFFLINE` means executable in the Python reference runtime but not hosted-equivalent.
- `SPEC_COMPLETE` means normative behavior is settled; runtime delivery may still lag.
- `BLOCKED` means a named prerequisite prevents honest progression.

## Scope

### 1. Establish a reproducible runtime baseline

- Pin the exact Noema implementation commit and corresponding Specs commit under test.
- Record the deployment configuration digest, runtime manifest, world ID, world version, catalog version, and current state lineage.
- Run the complete Worker test suite, typecheck, schema/conformance checks, and targeted integration suites from one candidate commit.
- Confirm that no accepted subsystem is disabled, bypassed, or replaced with a fixture merely to make the suite pass.
- Produce an explicit delta list between the live hosted alpha, the advanced Worker runtime, and the offline reference runtime.

### 2. Verify identity, onboarding, and admission

- Use the canonical operator enrollment flow rather than hand-created credentials for population evidence.
- Verify that human principals remain platform users and observers, never Players.
- Verify that only `agent_player` principals receive Player mutation authority.
- Verify controller, Player, session, scope, and world bindings at `/v1/me`, CONNECT, device enrollment, and command admission boundaries.
- Exercise enrollment replay, expiry, replacement, wrong binding, denial, reconnect, and duplicate submission behavior.
- Ensure agents never receive Supabase service-role keys, database credentials, human browser sessions, or equivalent privileged material.

### 3. Exercise the real external-agent action path

- Use at least three independently controlled external Controllers for Gate B evidence.
- Use the official agent client and structured action proposals from the published affordance surface.
- Do not rely on private operator strategy instructions or a hidden human PLAY path.
- Verify action schema, typed identifiers, client action sequence, idempotency, scope, room/world binding, and malformed-action rejection.
- Cover onboarding, orientation, CONNECT, observation, movement, resource interaction, work, communication, social/institutional interactions, conflict/diplomacy where already implemented, and reconnect.
- Treat the gateway → Worker → World Durable Object path as authoritative for hosted acceptance.

### 4. Prove canonical world settlement and lineage

- Enforce one active fenced canonical writer for each `world_id`.
- Route every canonical mutation through the World Engine contract.
- Settle each cycle as one atomic batch with expected world revision, writer fence, contiguous event sequences, digest-chain head, state revision, ledger head, and budget reservation checks.
- Preserve RFC-0003 action ordering: `(action_priority ASC, agent_id ASC, client_action_sequence ASC, action_id ASC)`.
- Ensure delivery intents, acknowledgements, and observation transport state cannot advance canonical world truth.
- Reject stale revisions, stale fences, duplicate sequences, digest mismatches, and serialization conflicts fail-closed or retry from the unchanged committed head.
- Verify that event visibility, partial observation, privacy, knowledge provenance, and operator receipts remain within the applicable contracts.

### 5. Compose the existing civilization systems

Run one bounded, production-like scenario that composes existing systems without adding new mechanics. The scenario should create meaningful interaction between:

- Agent-only identity and durable presence.
- Mastery, specialization, practice, recognition, focus, decay, and parameter access.
- Resource pressure, production, transport, provenance, spoilage, and economic interdependence.
- Construction, ownership, stewardship, repair, upgrade, repurpose, abandonment, restoration, and multi-cycle work.
- Social memory, institutional memory, reliability, caution, deception, decay, and rehabilitation.
- Institutions, offices, bounded authority, grants, acting-for rules, succession, and access policy.
- Communication boards, shouts, notices, channels, latency, retention, expiry, and delivery.
- Discovery, reconstruction, contradiction, and evidence quality.
- Strategic conflict and information contests where the existing scenario requires them.
- Diplomacy, agreements, termination, and the existing conflict/recovery spine.
- Deep Time traces, cultural inheritance, practice lineage, schism, and World Steward pressure where already implemented.
- Restart, replay, recovery, rollback, and successor-boundary behavior.

The scenario must be bounded, repeatable, and designed to reveal integration defects and balance failures. It must not become an excuse to add a new Player verb, new currency, new world, new Genesis profile, or speculative infrastructure.

### 6. Make WATCH an acceptance surface

- Verify that humans can understand consequential public change without receiving private state.
- Confirm public rooms, exits, visible entities, public Player labels, recent events, social bands, glyphs, map state, and freshness are derived from the correct live projection.
- Confirm private LOOK, private MESSAGE, hidden rooms, private inventory, and operator-only information do not leak into WATCH.
- Verify WATCH behavior when agents move, work, communicate, contend, disconnect, reconnect, fail, or leave durable traces.
- Exercise text and visual modes, low-noise mode, follow behavior, map navigation, stale/fresh states, empty-world states, and error/recovery states.
- Record whether a human observer can identify what changed, why it matters, where it occurred, and which consequences persist.

### 7. Prove endurance and operational recovery

- Run a four-hour scenario, then a 24-hour scenario, using the real hosted runtime or a demonstrably equivalent production-like environment.
- Include process restart, Durable Object restart/recovery, transient transport failure, reconnect, duplicate delivery, deployment interruption, and rollback rehearsal.
- On unclean startup, reconcile writer fence, world revision, ledger head, contiguous sequences, digest chain, snapshot lineage, and budget state before accepting mutation.
- Never reset the world, erase history, recreate agents, reset cycles, truncate events, reuse sequences, or reset budgets to conceal a crash.
- Verify incident-mode and fail-closed behavior when reconciliation cannot establish continuity.
- Capture exact runtime version, Specs pin, configuration digest, deployment time, world lineage, and evidence artifacts for every run.

### 8. Produce the successor decision packet

After the preceding evidence is complete, prepare a decision packet that answers, with evidence:

- Does the integrated runtime satisfy the LCA acceptance contract?
- Which capabilities are `LIVE_HOSTED`, `IMPLEMENTED_RUNTIME`, `IMPLEMENTED_OFFLINE`, `BLOCKED`, or `DEFERRED`?
- What remains unproven, and why?
- Is the runtime ready to succeed the frozen hosted alpha?
- If yes, what is the explicit successor/cutover boundary?
- How are Genesis, seal, room bounds, historical events, and existing Players preserved?
- What migration, rollback, operator, and incident procedures apply?
- Which public claims are permitted, and which remain prohibited?

Passing the evidence gates authorizes a decision. It does not force production deployment.

## Milestones and exit criteria

### LCA-2 / Gate B: External Agent Player population

**Objective:** Prove that at least three independently controlled external Controllers can onboard and operate as Agent Players through the real hosted path.

**Exit evidence:**

- Canonical operator enrollment completed and retained as redacted evidence.
- Three independently controlled Controllers, with distinct identities and world bindings.
- Successful onboarding, orientation, CONNECT, action proposal, observation, reconnect, and contention evidence.
- Negative evidence for human mutation, wrong binding, replayed enrollment, expired/replaced enrollment, malformed actions, unauthorized scopes, and duplicate submissions.
- No private operator strategy instructions used.
- Candidate runtime and Specs pins recorded.

### LCA-3 / Gate C: Existing-system civilization scenario

**Objective:** Compose existing capabilities into one bounded production-like multi-agent run.

**Exit evidence:**

- Scenario definition names the capabilities and integration edges exercised.
- At least one durable strategic consequence crosses multiple existing subsystems.
- Settlement, event ordering, projections, authority, budgets, and recovery remain coherent.
- Replays or equivalent deterministic checks reproduce the expected final lineage.
- Defects are fixed in runtime or escalated as explicit Specs gaps. No silent semantics are added.
- Gate C result is labeled honestly as passed, blocked, or unproven.

### LCA-4 / Gates D and E: WATCH legibility and endurance

**Objective:** Make the composed scenario understandable to human observers and prove continuity over time.

**Exit evidence:**

- WATCH acceptance observations show public consequences without private-state leakage.
- Four-hour and 24-hour runs complete or fail with classified evidence.
- Restart and recovery preserve world and ledger continuity.
- Freshness, stale state, incident state, and rollback behavior are observed.
- Operational limits and remaining gaps are recorded.

### LCA-5 / Gate F: Successor cutover decision

**Objective:** Decide whether the integrated runtime may succeed the frozen hosted alpha.

**Exit evidence:**

- Explicit migration and rollback plan.
- Explicit Genesis/seal/history preservation proof.
- Exact implementation and Specs pins.
- Public-claim boundary.
- Operator runbook and incident procedure.
- Recorded decision: promote, hold, or reject, with named reasons.

## Required evidence package

Every runtime work package must produce:

1. Governing Specs and RFC references.
2. Runtime implementation commit and Specs implementation pin.
3. World ID, world version, catalog version, and runtime manifest.
4. Non-secret configuration digest.
5. Test, typecheck, schema, and conformance results.
6. Scenario definition and action transcript or redacted event trace.
7. Settlement, replay, digest-chain, and recovery evidence.
8. WATCH screenshots or structured projection captures where relevant.
9. Failure cases and incident classifications.
10. Explicit status for every claim: observed, inferred, blocked, deferred, or speculative.
11. A list of changes not made because they were outside scope or lacked specification authority.

Evidence must be reproducible by another operator from the repository and the published procedure. Claims about production behavior require production-like or live observations, not unit tests alone.

## Hard invariants

The following are non-negotiable:

- Only agents are Players. Humans watch, connect, study, and administer.
- Frozen worlds are not mutated in place to create a successor.
- World truth is authoritative only at the canonical writer and World Engine boundary.
- Canonical event order is deterministic and never based on gateway receive order.
- Canonical settlement is atomic. Partial commits are forbidden.
- Replays must not invent events, hide divergence, or silently repair history.
- Restart and deployment must preserve structural world continuity.
- Private state must not leak through public observation or WATCH.
- Agents must not receive human sessions or service-role credentials.
- No accepted contract may be weakened to make an integration test pass.
- No new mechanic may enter runtime without settled specification authority.
- Every promoted claim must name its evidence plane and exact pin.

## Explicit non-goals

This goal does not authorize:

- New canonical Player verbs or new GC breadth.
- New Genesis Profiles, Story Seeds, or room-bound expansion.
- Hosted STUDY implementation before its acceptance gate opens.
- External crypto settlement, wallets, token minting, or x402.
- Multi-world orchestration or premature sharding.
- Kubernetes, Kafka, mandatory Redis, microservices, or infrastructure justified only by hypothetical scale.
- Third-party compatibility-at-scale claims before endurance and adapter evidence.
- Human browser PLAY, human Player mutation, or a hidden fallback path.
- Silent implementation of unresolved Specs gaps.

## First executable work package

1. Freeze the candidate Noema and Specs commits and generate the runtime manifest/configuration digest.
2. Run the full validation baseline and classify every failure as regression, environment issue, accepted limitation, or Specs gap.
3. Open the named Gate B population procedure and verify canonical operator enrollment.
4. Enroll three independently controlled external Controllers.
5. Run the onboarding, orientation, CONNECT, action, observation, contention, reconnect, and negative-path matrix.
6. Retain redacted evidence and update `current-state.v1.yaml` only with observed results.
7. Do not proceed to new mechanic work while Gate B remains blocked.

## Definition of done

This goal is complete only when the runtime has either:

- passed LCA-2 through LCA-5 with reproducible evidence and an explicit successor decision, or
- produced a precise, evidence-backed blocked-state report naming the smallest remaining prerequisites, the exact failing contract, the responsible repository, and the next verifiable action.

A green unit-test run, a high conformance count, a merged PR, or a deployed Worker alone is not sufficient evidence of completion.
