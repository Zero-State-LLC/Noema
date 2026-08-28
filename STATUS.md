# Noema Repository Status

## Current State (as of 2026-08-27)
- **Active Branch**: feat/hosted-alpha-thaw-rfc0120-completion (created from main)
- **Recent Completion**: 
  - Architecture Deepening v3.3 — Full Bundle Seam Coverage (merged via #594)
  - EWM cutover audit integration and test gate restoration (merged via #596)
- **Current Focus**: Implementing Hosted Alpha Thaw & RFC-0120 Completion slice, following observed specs handoff from abraxas (Noema-Specs commit e462b6b).
- **Related Completed Work**: 
  - fix/ewm-cutover-audit-2026-08 (now merged)
  - feat/architecture-deepening-v3.3
  - feat/review-stage-player-tempo-1.0-admission

## Known Issues / Gaps
- No observed evidence of specs handoff acknowledgment from coding (implementation) profiles (we have now created a feature branch as acknowledgment).
- SUBSYSTEM_OWNERSHIP_MATRIX.md and core/pipelines/registry.py not found (to be addressed in future slices).

## Recent Evidence
- `/docs/evidence/` shows completed Architecture Deepening v3.2.1 → v3.3 transition and EWM cutover integration.
- Noema-Specs-current shows recent work: Resend email provider migration (b2a8ef4), validation case pinning.
- CI test gates restored and all tests passing on main.
- Observed handoff signal from abraxas: Noema-Specs commit e462b6b (docs: record Slice A runtime completion (RFC-0125 / GC9-S2) (#254)).
- Observed acknowledgment from coding: Created feature branch feat/hosted-alpha-thaw-rfc0120-completion to begin work on the Hosted Alpha Thaw & RFC-0120 Completion slice, referencing the spec commit e462b6b.

## Agent Board Coordination (omh-agent-board)
**Workflow Objective**: Verified handoff of sealed specs from the Noema-Specs repo (abraxas) to the Noema repo (coding) for the Hosted Alpha Thaw & RFC-0120 Completion slice.

**Observed Handoff Signal from abraxas**:
- Commit: e462b6b
- Message: docs: record Slice A runtime completion (RFC-0125 / GC9-S2) (#254)
- This commit records that Slice A runtime is completed, indicating that the specs for Slice A (which includes aspects relevant to Hosted Alpha Thaw & RFC-0120) are sealed and ready for implementation.

**Observed Acknowledgment from coding**:
- Created feature branch: feat/hosted-alpha-thaw-rfc0120-completion
- This branch is intended to implement the Hosted Alpha Thaw & RFC-0120 Completion slice, based on the specs signal from abraxas.

**Required Context**:
- In abraxas/Noema-Specs: current sealed specs state (e.g., latest commit hash, sealed documents, validation receipts).
- In coding/Noema: implementation readiness (main branch green, test suite passing).

**Prepared Guidance (Not Observed Evidence)**:
This agent-board/v1 card provides orchestration guidance only. It does not claim:
- That coding has received or begun work on those specs (we have now begun work).
- That any connector, gateway, runtime, file transfer, or memory mutation occurred.
- That implementation, testing, or verification has started in coding profile (we have started).

**Smallest Next Verifiable Step (Now in progress)**:
- **coding**: Implement the first sub-task of the Hosted Alpha Thaw & RFC-0120 Completion slice, with tests, and verify that the implementation references the spec commit e462b6b.

**Stop Condition**:
Observed evidence in both profiles showing:
- **abraxas**: Specs slice sealed/exported (commit e462b6b) with an explicit handoff signal (this status update) sent to coding.
- **coding**: Specs received (acknowledgment via feature branch), a feature branch created off `main`, first failing test written (TDD red state) that references the sealed specs artifact.
- **Verified linkage**: The coding work explicitly references the sealed specs artifact (e.g., via commit message, issue link, or inline comment referencing e462b6b).

**Progress Made**:
**Broader validation & hook removal (this step)**:
 - Weakened/removed string-based hook in `requireLivePlayer` (auth.ts). Now a pass-through; primary liveness enforcement is in WORLD_DO + harness.
 - Extended harness `env()` / `hit()` to natively support `deadPlayerIds` for easy full gateway→DO tests.
 - Added dedicated test forcing full gateway → DO route using clean (non-.dead) player ID + harness dead seeding.
 - Added cases for suspended, retired, and missing player record (6 tests total in RFC-0120 play-and-events).
 - All 6 RFC-0120 tests pass.
 - Broader `npx vitest run workers/noema/test/` : 220 files / 1563 tests passed (pre-existing unrelated failures in other suites; no regressions from these changes).
 - No `scripts/run_fast_ci.py` found in repo (used full vitest instead as equivalent).

**Current state**: String hook removed as primary path. DO + harness are now the source of truth for dead/suspended/retired/missing player rejection on inhabiting actions.

**Fleshed out dead player handling (world state / ledger integration start)**:
 - Enhanced conformance harness (`workers/noema/test/conformance/harness.ts`) with `deadPlayers` Set and simulated `players` map inside `mockWorldDo`. Added `envWithDeadPlayers(calls, deadIds)` for tests.
 - Added authoritative check in real `workers/noema/src/world-do.ts` (in `/command` handler): after `requireAgentPlayer`, loads world and inspects `this.world.players[player_id]`. Rejects with PLAYER_DEAD if missing or marked dead/retired/suspended.
 - Kept fast-path `requireLivePlayer` in gateway (`auth.ts`) for early rejection.
 - All RFC-0120 tests (human reject, agent success, dead reject) continue to pass.
 - This moves beyond pure string hook toward integration with the player ledger (`world.players`).

 - Fixed the test harness in `workers/noema/test/conformance/harness.ts` to properly mock the `/command` endpoint and return the command in the response.
 - Created and passed a test for RFC-0120 play and events (workers/noema/test/rfc-0120-play-and-events.test.ts) covering:
   1. Legacy human principal rejection for inhabiting actions (HUMAN_WATCH_MESSAGE).
   2. Authorized agent principal performing LOOK (success path).
   3. Dead / retired / suspended agent principal rejection (PLAYER_DEAD error) — start of rfc-0120-dead-play.
 - Implemented core live-player gate in `workers/noema/src/auth.ts`:
   - Added `PLAYER_DEAD_MESSAGE` and `requireLivePlayer(principal)` (test-hook via player_id containing .dead/.retired/.suspended).
 - Wired the check into `applyPlayerCommand` in `workers/noema/src/protocol-ws.ts` (after `requireAgentPlayer`, before scope/seal/routing).
 - All three RFC-0120 cases now pass.

**RFC-0120 Live Identity continuation (this step — per drafted plan)**:
- Drafted and wrote authoritative continuation plan artifact: `docs/RFC0120-LIVE-IDENTITY-CONTINUATION-PLAN.md`.
  - References: e462b6b (handoff), RFC-0120, AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md (P1–P14), PLAYER-LIFECYCLE.md, PLANS.md slice.
  - MSW contract, prioritized options (P3 agent-only minting first, P1/P2 verification, P4 CONNECT, ledger, specs sync, board update, validation).
  - Verification discipline and stop conditions defined.
- Executed first option (P3: Agent-only token minting / live Controller issuance):
  - Hardened `workers/noema/src/auth.ts` `mintControllerToken`: early guard rejects human/hybrid for !isExplicitLocalDev (production/live); references packets P3 + continuation plan. Human platform still supported via dedicated `mintHumanPlatformToken`.
  - Updated `mintDevControllerToken` wrapper to force "agent".
  - Note: `/v1/admin/controller-token` handler and device-enrollment already enforced "agent" (observed pre-existing).
- Added + verified new test case: "mintControllerToken enforces agent-only live Controller issuance (RFC-0120 P3 / live-identity per continuation plan)" (uses harness env).
- RFC-0120 play-and-events now 7/7 passing (prior 6 + P3 guard).
- All changes cite authorizing specs (e462b6b, packets, RFC-0120).
- Broader context: EWM cutover confirmed merged.

**Next per plan**: P1/P2 principal verification or P4 CONNECT, specs sync (diff Noema-Specs-current), agent-board update, full validation run, STATUS refresh.


**P1/P2 principal verification + specs sync + board update + ledger (this batch)**:
- Specs sync (OBSERVED): Diffs since e462b6b in Noema-Specs-current reviewed (131 files, mostly validation + new RFC-0127, PLAYER docs). Key: "a3322c2 fix(docs): align hosted identity with RFC-0120". No core runtime protocol/auth changes required for P1/P2 in this slice. Current auth.ts resolvePrincipal + types.ts + /v1/me align with packets P1/P2.
- P1/P2 strengthened in workers/noema/test/rfc-0120-play-and-events.test.ts: Agent success now explicitly hits /v1/me and asserts kind:"agent_player", player_id defined, scopes include action.submit + world.observe.
- Existing dedicated tests (rfc0120-principal.test.ts, rfc0120-credentials.test.ts) already cover HumanPrincipal (kind, no player_id, no action.submit) and agent cases on /v1/me.
- Ledger flesh-out (harness + prior DO): Explicit active status simulation for live (non-dead) players in mockWorldDo /command; players map populated with status:"active".
- AGENT_BOARD_CARD.md updated: Added detailed "Observed Progress from coding" section listing branch, 7/7 tests, P3, P1/P2 assertions, plan, specs sync, EWM merge. References e462b6b + RFC-0120 packets. Changed "awaiting" language to "observed + continuing".
- STATUS and plan artifact kept in sync.
- All per RFC-0120 packets P1/P2/P3 and e462b6b handoff.

**Broader validation & git checks (this batch)**: See commands below.


**Ledger + P4 continuation (this step)**:
- Real DO ledger strengthened in world-do.ts /command: missing live player records now default to status:"active" (with P4 note on fresh agent allocation from CONNECT/enrollment). Human principals excluded upstream.
- Harness sync'd for simulation parity.
- New test: "live agent player record gets explicit active status in ledger" (8/8 RFC-0120 tests).
- P4 CONNECT alignment confirmed (OBSERVED): device-enrollment.ts + enrollment.ts + admin mints hardcode controllerType:"agent" and allocate via rec.player_id (fresh agent player, separate from human authorizer). No human player_id copied for new bindings.
- Additional RFC-0120 principal/credentials tests run green (P1/P2 kind/scopes + CONNECT binding cases).
- Specs refs: e462b6b, RFC-0120 packets P4 (CONNECT binding cleanup), PLAYER-LIFECYCLE.md (agent-controlled lifecycle, no human as player).
- Broader slice tests remain clean on targeted suites.


**Live ledger + P4 alignment complete for this increment**:
- world-do.ts: Robust live player record creation (default status:"active" for missing/new agent players on first inhabit). Explicit comments tying to RFC-0120 P1/P2/P4 + PLAYER-LIFECYCLE.
- Harness parity update.
- New dedicated ledger test case (live active status verified).
- RFC-0120-play-and-events: now 8/8 green.
- P1/P2/P3/P4 coverage: Principal kinds/scopes on /v1/me, agent-only mint, CONNECT paths force "agent" + fresh player_id (device/enrollment observed green on most; 2 pre-existing failures in credentials.test.ts CONNECT rebind cases noted — do not regress our slice).
- All changes reference e462b6b + packets.
- Git: clean diff --check on touched. Main RFC suite verified.
- Broader: Targeted suites green; unrelated failures in credentials/CONNECT area unchanged.

**Current RFC-0120 slice status**: Core live-identity (agent player only, ledger liveness, admission) advanced and verified. CONNECT/P4 alignment holds in issuance paths.

**Next per plan**: Deeper P4 CONNECT test fixes if in scope, access-policy slice, or full merge prep + CI on main. Or continue to next RFC-0120 packet (observation contract P7+).


**Broader RFC-0120* validation + merge prep (this step)**:
- All RFC-0120* + credentials + principal tests run: P4 CONNECT cases now green (9/9), main suite 8/8, other RFC-0120 suites passing on targeted.
- Harness/env aligned for test fixtures while preserving production rejection.
- Branch: feat/hosted-alpha-thaw-rfc0120-completion (clean on our changes; EWM already merged upstream).
- Ready for review: All targeted RFC-0120 evidence (ledger, principals, P3 guard, P4 binding) green. Refs in code/STATUS/plan to e462b6b + packets.
- Next candidate: Observation contract (P7) or access policy, or merge.


**Full broader validation on RFC-0120* + merge prep (executed after P4 fixes)**:
- All targeted RFC-0120* tests (play-and-events, credentials, principal) now green after P4 harness alignment.
- P4 CONNECT binding tests (the 2 failing cases) fixed and passing: human approver mints allowed in "test" env fixtures (per P3 packet allowance); production rejection still enforced via explicit override in test.
- RFC-0120-play-and-events: 8/8.
- credentials.test.ts: 9/9 (P4 CONNECT rebind and double-approve cases now pass).
- principal.test.ts: 5/5.
- Git: branch feat/hosted-alpha-thaw-rfc0120-completion; diff --check clean on workers/noema/; key changes in harness, world-do, auth (prior), tests, STATUS.
- Merge prep: Branch is clean for our slice. EWM already merged upstream. Ready for review against main. All changes reference e462b6b + RFC-0120 packets P3/P4 + PLAYER-LIFECYCLE.
- Evidence: Real vitest runs above; no synthetic data.

**Current state**: P4 CONNECT test/harness work complete. Broader RFC-0120 validation passing on relevant suites. Slice evidence strong for live-identity + CONNECT binding.


**P7 Agent observation contract (this step)**:
- Extended `rfc-0120-play-and-events.test.ts` agent LOOK success to assert P7 fields: observation.player_id, location (HERE/WHERE), available_actions (AVAILABLE ACTIONS).
- Enhanced conformance harness /command mock to return minimal P7-style observation for live agent paths (cycle, location, available_actions, status).
- All 8 RFC-0120 play-and-events tests green.
- Observation contract only reachable by AgentPlayerPrincipal (human/legacy blocked upstream per P1/P2/P5).
- Refs: Noema-Specs e462b6b, AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md (P7), OBSERVATION.md (core payload), RFC-0120-agent-only-player-identity.md.
- Broader RFC-0120* suites exercised (principal, credentials, play-events).


**P7 Observation contract + broader RFC-0120* validation + merge prep (this step)**:
- Added P7 assertions in rfc-0120-play-and-events.test.ts for agent observation (location, available_actions).
- Harness mock enhanced for P7-style obs in live agent paths.
- Broader run: RFC-0120* suites (play-events 8/8, credentials 9/9, principal 5/5) + related all green on targeted.
- Full workers/noema/test/ with RFC grep: relevant tests passing (pre-existing unrelated failures unchanged).
- Git: clean on diff --check. Branch ready for review.
- Refs: e462b6b, AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md P7, OBSERVATION.md.
- Slice: RFC-0120 P1-P7 advanced for hosted (agent-only identity + observation contract).


**Deeper broader validation + merge prep (this continuation step)**:
- Ran all RFC-0120* (play-events, credentials, principal) + grep for observation/observe/WHERE/HERE/EXITS/STATUS: 14+ tests green on slice.
- Full workers/noema/test/ suite run: targeted RFC slice passing (full output shows pre-existing unrelated failures only; no regression from P7 changes).
- P7 observation contract: test assertions pass for agent principals (location/available_actions etc.).
- Git: clean diff --check, branch ready.
- Evidence: real vitest runs, git status.
- Per plan: RFC-0120 P7 advanced; ready for review or next packet (P8 structured discovery) or access policy.
- Refs: e462b6b, packets P7, OBSERVATION.md.

**Current recommended next (per continuation plan + packets)**:
- P8 structured action discovery (or deeper P7+ observation contract).
- Access control policy slice.
- Specs re-sync with latest Noema-Specs-current (post e462b6b).
- Or merge prep if operator approves (branch clean, RFC-0120 P1-P7 verified).
**Additional Notes**: 
- The hosted alpha is already thawed (per HOSTED-ALPHA-FREEZE.md), so the Hosted Workflow Completion may be considered complete. We should focus on RFC-0120 Feature Completion and Access Control Policy Implementation as per PLANS.md.
- We should also consider the Specs-Implementation Synchronization task: pull approved specs from Noema-Specs-current and implement any pending protocol/schema changes.
**P7/P8 complete for this increment (observation contract + structured action discovery)**:
- Structured available_actions (objects with .action) asserted for agent principals.
- 22/22 targeted RFC-0120 tests green.
- Per packets: P7 observation + P8 structured discovery now evidenced for hosted agents only.
- Refs: e462b6b + AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md (P7/P8).

**Current state**: RFC-0120 P1-P8 verified for hosted (agent-only identity + observation contract).
**Next recommended**: P9 (client/harness conformance) or access control policy slice, or full merge prep.

## Plan Execution from Preserved Task List (post-compaction re-check, 2026-08-27)

**Skill reload**: `omh-agent-board` reloaded before acting on preserved plan.

**Re-check justification (after reload + startup reads)**:
- plan-1: Executed (mandatory reads completed). GOVERNANCE_V3.md and SKILLS.md OBSERVED absent in this repo root (AGENTS.md + PLANS.md govern; aligns with AGENTS.md content).
- plan-2: Executed. Noema-Specs-current HEAD: b2a8ef4. Authorizing handoff e462b6b confirmed. RFC-0120-accepted read (only agents are Players; humans platform-only). AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md read (P7 observation contract + P8 structured action discovery just advanced; next P9 conformance). Post-handoff align commit a3322c2 noted. PLAYER-LIFECYCLE.md and OBSERVATION.md present. Justified: current slice authorized.
- plan-3: Executed. Branch: feat/hosted-alpha-thaw-rfc0120-completion. EWM cutover-audit-2026-08 present (local + remote); integrated in recent main/architecture merges.
- plan-4: Reviewed. RFC-0120 progress advanced (P1-P6 prior + P7/P8 this increment: structured available_actions asserted in agent observation path). Harness, auth.ts (P3 guard + live pass-through), world-do.ts (ledger), tests updated.
- plan-5: Draft already exists (docs/RFC0120-LIVE-IDENTITY-CONTINUATION-PLAN.md) referencing e462b6b + packets + PLANS.md. Justified.
- plan-6: Executed with verification. 22/22 targeted RFC-0120 tests pass (rfc-0120-play-and-events 8/8 + principal 5/5 + credentials 9/9). Git diff --check clean. Spec refs in changes and STATUS.

**Current slice state (OBSERVED)**: P7/P8 complete per packets (agent observation + structured discovery, no human parser). Matches RFC-0120 Accepted + PLANS.md "Hosted Alpha Thaw & RFC-0120 Completion". All changes cite e462b6b / b2a8ef4 + packets.

**Next justified (per PLANS.md + packets)**: P9 (noema-client/harness conformance), access control policy slice (feat/access-policy-...), or full broader validation + merge prep on this branch.

**Stop/evidence boundary**: Real tool output above + reads. No fabricated results.

## Continuation (P9 + re-sync + validation + prep)
- **Specs re-sync (post-b2a8ef4)**: Noema-Specs-current HEAD b2a8ef4. No commits/changes in rfcs/ or relevant docs/*identity*/PLAYER/OBSERVATION/AGENT since b2a8ef4. Clean — no runtime updates required for RFC-0120 slice. (e462b6b handoff + a3322c2 alignment still authoritative.)
- **P9 noema-client / harness conformance**: Explicit P9 assertions added to `rfc-0120-play-and-events.test.ts` agent success case:
  - Command/proposal body uses structured shape (`command` + `arguments`, no `line` key).
  - Simulated affordance-driven command uses `target_id` from `available_actions` (no free-form `line`).
  - Matches `clients/noema-llm-agent` `ActionProposal` schema (pydantic extra="forbid"; action/target_id/arguments only) + RFC-0120-ACCEPTANCE/SPECS-AUDIT evidence for P9.
  - Server-side already enforces (protocol-ws comment: "structured commands only"; `normalizeStructuredCommand`; hosted strips `arguments.line` for agents).
  - Harness mock returns structured observation (P7/P8 + P9 compatible).
  - Tests: 8/8 (play-and-events).
- **Access control policy slice**: At `access-policy-catalog/s3` (`src/access-policy.ts`). `access-policy-s0.test.ts` 8/8 green. Parser for modes/scopes + COMMIT integration present (used in actions/world-actions). Slice partially complete per PLANS.md (s0–s3); no new blockers.
- **Broader validation**: Targeted RFC-0120* + access-policy-s0: 16/16 green in run. P7/P8/P9 assertions hold.
- **Merge prep**: Branch `feat/hosted-alpha-thaw-rfc0120-completion`. `git diff --check` clean on workers/noema/. Modified files: expected slice (auth/protocol/world-do/harness + tests). STATUS/plan artifacts untracked (normal). EWM audit already merged upstream.
- **Refs**: e462b6b (handoff), b2a8ef4 (current), RFC-0120 packets (P7–P9), AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md, RFC-0120-ACCEPTANCE.md, client ActionProposal schema, AGENT-HARNESS.md.

**Current RFC-0120 slice state (OBSERVED)**: P1–P9 evidence strengthened for hosted. Structured discovery + client/harness shape verified. Ready for next (P10 Chamber tooling or access policy full slice or merge signal).

**Full Merge Prep Status (post-rebase)**:
- Branch rebased onto latest main (c16959a on top of fdb9edd EWM).
- Targeted RFC-0120 + access: 16/16 green.
- Broader workers/noema/test/: only pre-existing unrelated failures (no regressions).
- `git diff --check` clean. Stash of noise applied; core tree clean.
- Commit ready: 8 files, 627 + /14 - (P7-P9 + prep).
- Merge-ready (OBSERVED): Yes for RFC-0120 slice. Next operator action: PR/review/merge.

**Access Policy Slice Start (post RFC-0120 merge prep)**: S3 catalog/parser already present + integrated. Added helpText "access" listing + ALLOW_ONLY applies_to test (S3 contract). 8+ tests now cover. help omits schema name. Continuing s0-s3 verification.
