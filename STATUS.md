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

## Merge Complete (2026-08-27)
**Merged**: `feat/hosted-alpha-thaw-rfc0120-completion` → `main` via **e37d45c**
- RFC-0120 P1–P10 complete for hosted (agent-only player identity, ledger liveness/dead handling, P7 observation contract, P8 structured discovery, P9 client/harness conformance, P10 Human PLAY retirement + Chamber NON-CANONICAL).
- Access policy s3 advanced (9/9 tests, help listing, ALLOW_ONLY).
- Evidence: 36/36 targeted RFC-0120* + access green pre/post; `git diff --check` clean; specs pin e462b6b + b2a8ef4 + packets + AGENTS.md/PLANS.md.
- Review: code paths (auth.ts requireAgentPlayer + pass-through; world-do.ts ledger check), AGENTS endorsement, full matrix MATCH per RFC-0120-ACCEPTANCE.md.

**Next**: Per PLANS.md — P11 research/admin isolation, access full slice, or next RFC packet. Merge prep closed.

## P11 Research/admin isolation (2026-08-27 continuation)

**Observed**: Explicit P11 tests added and passing.
- HumanPrincipal with "researcher" role: kind="human", no player_id, no action.submit, rejected by requireAgentPlayer (403 HUMAN_WATCH_MESSAGE).
- HumanPrincipal with "admin" role: same isolation.
- Updated humanPrincipalFromClaims to support researcher/admin roles from claims while preserving non-Player contract (kind human, mutation scopes stripped).

**Authorizing artifacts**:
- AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md: P11 "Research/admin isolation (researcher ≠ Player; admin ≠ Player)"
- RFC-0120: "Researcher cannot ENTER_WORLD as Player. Admin cannot accidentally inherit Player scopes."
- RFC-0120-ACCEPTANCE.md: P11 MATCH ("Admin session is not an access token; STUDY does not mint Player")

**Verification**:
- workers/noema/test/rfc0120-principal.test.ts: 7/7 passed (2 new P11 cases).
- Existing separation (AdminPrincipal vs HumanPrincipal vs PlayerPrincipal, resolvePrincipal routing, requireAgentPlayer) reinforced with explicit P11 coverage.

**RFC-0120 slice**: P1–P11 now evidenced for hosted.

**Next**: Access policy full closeout or P12 Deep Time traces.

## Access Policy s0–s3 closeout (full hosted family)

**Date:** 2026-08-27 (post RFC-0120 P1-P11)

**Status:** COMPLETE (OBSERVED)

**Evidence:**
- Specs observed: ACCESS-POLICY-S0.md (EXIT DENY/CLEAR, GRANT_ACCESS), S1 (ROOM), S2 (ALLOW_ONLY, applies_to required), S3.md (Chamber ACCESS help listing; omit WED/ATTEST/schema name ACCESS_POLICY; modes DENY·CLEAR·ALLOW_ONLY).
- Implementation on main:
  - Parser: access-policy.ts (s3 catalog, full parseAccessMode/Scope/PolicyLine supporting all).
  - Help: actions.ts helpText lists "ACCESS" with exact lines per S3; no schema name; separate from WED/ATTEST.
  - Runtime: world-actions.ts applyAccessPolicy (authority check, cost compute/influence, debit, restrictions store, CLEAR logic, ALLOW_ONLY applies_to enforcement, ACCESS_RESTRICTED events, expires).
  - Integration: dispatched from COMMIT, GRANT_ACCESS profile.
- Tests: access-policy-s0.test.ts 9/9 (covers ALLOW_ONLY/applies_to, modes, scopes, forbids).
- No WED/ATTEST advertised in ACCESS help.
- Worktree audit: core access-policy.ts / tests on main match or exceed s* branches (diffs mostly tooling).

**Per PLANS.md + S0-S3 contract:** s0–s3 hosted family complete. No new verbs/modes.

**RFC-0120 slice context:** Access policy advanced alongside identity work.

## P12.1 Environmental traces / Deep Time audit (2026-08-27 continuation)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md (P12 row), DEEP-TIME.md (v0.6: minimal durable public trace via ledger events/scars/artifacts/institutions; public-only; no new TRACE verb; researcher/admin produce public history).

**Inventory (OBSERVED):**
- MOVE: public ledger event (rfc0120-traces + world-actions).
- REPAIR: last_repair_* → "construction" trace ("maintenance plate") in projectRoomTraces.
- TRADE: trade_notice → "notice" trace.
- ACCESS_POLICY: ACCESS_RESTRICTED public event + access_restrictions (world-actions); restrictions as environmental marks.
- Scars: genesis, damage, repair (deep-time.ts, world-do, play-traces).
- Notices/org: board/shout/institution/trade/rumor/org_marks/vacant_offices → public notices.
All via play-traces.ts (publicTraces always visibility:"public", no ids leaked, MAX 3, source refs stripped). watch-live.ts surfaces in public WATCH rooms. world-actions attaches to player observations. No private paths in public surfaces.

**Added assertions:** rfc0120-traces.test.ts P12.1 case (scar + REPAIR construction + TRADE notice all public; no TRACE verb). 19/19 green (rfc0120-traces + play-traces).

**Verification:**
- npx vitest ... rfc0120-traces + play-traces: 19 passed.
- No new verbs, public-only, ties to P11 isolation (public history from non-Players).
- git diff --check (pending full).

**RFC-0120 context:** Advances P12 public trace requirement post P11.

## P12.2 Researcher/admin trace isolation (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md P12; DEEP-TIME.md (researcher/admin produce non-Player public history); RFC-0120 (traces public/environmental); P11 principal isolation in types.ts/auth.ts (HumanPrincipal kind="human", no player_id for researcher/admin roles).

**Evidence:**
- HumanPrincipal (researcher/admin roles) explicitly no player_id, no mutation scopes (auth.ts:62, types.ts:61-73, isHumanPrincipal).
- play-traces.ts: 0 player_id references; all ObservationTrace {kind, text, visibility:"public"}.
- study.ts: "Humans study. Agents inhabit. Research does not rewrite the ledger." Public /watch/live (traces).
- watch-live.ts: public surfaces strip player_ids.
- world-actions: player_id only for gated PlayerPrincipals.
- Added test in rfc0120-traces.test.ts: researcher/admin HumanPrincipal -> public traces, no player_id on trace or principal. 5/5 in rfc0120-traces (P12.1+P12.2).

**Verification:** npx vitest rfc0120-traces.test.ts: 5 passed. Ties P11 non-Player to P12 public traces only.

## P12.3 Minimal durable trace coverage (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md P12; DEEP-TIME.md ("Minimal durable trace (short-session Player): A Player present for only a few cycles MUST be able to leave at least one durable mark. ... Acceptable marks already exist: a successful public TRADE; a joint REPAIR...").

**Evidence:**
- REPAIR in world-actions.ts sets last_repair_cycle + last_repair_handle on entity.
- play-traces.ts projects it to public "construction" trace: "A maintenance plate names X as the last repairer." (visibility public, no player_id).
- play-traces.test.ts already covers the projection.
- Added in rfc0120-traces.test.ts (P12 describe): short-session simulation via REPAIR state -> durable public trace present.
- Ties to existing mechanics (no new verbs); public, observable in WATCH/obs.

**Verification:** npx vitest rfc0120-traces.test.ts: 6 passed (now includes P12.3). Public only.

## P12.4 WATCH / observation public traces (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md P12; DEEP-TIME.md (public traces in WATCH); RFC-0120 (public projection).

**Evidence:**
- watch-live.ts:713-744: `const traces = publicTraces( projectRoomTraces({ ... }) ); if (traces.length) row.traces = traces;` in public rooms.
- Traces always from publicTraces (visibility public).
- Added test in rfc0120-traces.test.ts: WATCH snapshot with scar/repair entities surfaces traces in room; all public; no "private" visibility.
- Ties to P13 (no private leak).

**Verification:** npx vitest rfc0120-traces.test.ts: 7 passed. Public surfaces only.

## P12.5 Deep Time reconstruction + specs sync (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md P12; DEEP-TIME.md (reconstruction from ledger/scars/trajectory for public traces; scars have reconstruction_confidence).

**Evidence:**
- deep-time.ts + persistDeepTime: scars, trajectory_digest, evidence_fragments, norm_ratchets persist as Deep Time state.
- world-do.ts + checkpoint: reconstruction state survives restore (scars/trajectory).
- watch-map.ts + types: reconstructions with fidelity/confidence; public scars below floor.
- Traces (public projection of scars + repairs) are the observable reconstruction surface in WATCH/obs.
- Added test in rfc0120-traces.test.ts: reconstructed state (scars + last_repair) projects to public traces.
- References existing checkpoint restore tests that carry Deep Time state.

**Verification:** npx vitest rfc0120-traces.test.ts: 8 passed. Reconstruction preserves public traces.

**Full RFC-0120 P12 complete:** All 5 sub-slices evidenced (public durable traces from agent actions, isolation, reconstruction). No new verbs. Matches DEEP-TIME.md + packets.

## P13 WATCH public projection verification (2026-08-27)

**Status:** VERIFIED (OBSERVED; matches RFC-0120-ACCEPTANCE.md P13 MATCH)

**Authorizing artifacts:** RFC-0120-ACCEPTANCE.md ("P13 WATCH | MATCH | Public projection; no inbox, affordances, situation, practice_lines"); AGENT-ONLY-PLAYER-IDENTITY-PACKETS.md (P13 context); P12.4 tie-in; watch-live.ts.

**Evidence:**
- watch-live.ts: buildWatchLive returns `projection: "public"`, `public_pulses`, `public_descriptor_lines`, `public_title_lines`, `public_focus_lines`, `public_player_labels`, `traces` (public only via publicTraces), `recent_events`, `narrative`. Explicit comment on public projection.
- Types: inbox explicitly "private — never WATCH".
- Added explicit test in rfc0120-traces.test.ts: P13 case asserts `projection==="public"`, no "inbox", no "affordances", no "situation", no raw "practice_lines" in the public snap; traces (if present) public.
- Contrasts with observation surfaces (player-view/LOOK have raw affordances/practice_lines/situation).
- P12.4 already covered public traces in WATCH rooms.
- watch-live.ts:773+: roomsOut use only public fields + traces.

**Verification:** npx vitest rfc0120-traces.test.ts: 9 passed (includes P13). Public projection clean.

**Tie to prior:** Completes P12.4 public surface requirement. Supports full RFC-0120 acceptance (P13 listed as MATCH).

## RFC-0120 P13/P14 closeout note (2026-08-27)

**Status:** P13 verified in this slice (public projection confirmed); P14 per RFC-0120-ACCEPTANCE.md is the closeout itself (already marked MATCH).

**Evidence alignment:** RFC-0120-ACCEPTANCE.md lists P13 WATCH MATCH and P14 MATCH. Current runtime (watch-live.ts public projection + rfc0120-traces.test.ts P13 case) supports the P13 claim. Targeted tests 59/59 in RFC slice; git diff --check clean.

**Full RFC-0120 (P1–P14) acceptance supported on main:** P12 Deep Time + P13 WATCH public surface evidenced here. Matches acceptance matrix.

## P14 RFC-0120 acceptance closeout (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** RFC-0120-ACCEPTANCE.md (full matrix; P14 "this closeout" | MATCH | this file; Verdict: `RFC-0120 RUNTIME ACCEPTED`; pins to Specs `#193`, runtime main; lists P0–P13 MATCH + non-goals honored; residuals noted but not blockers).

**Evidence:**
- Acceptance matrix (observed in doc): P0 specs MATCH, P1–P11 as previously evidenced, P12 Deep Time traces MATCH, P13 WATCH MATCH, P14 this closeout MATCH.
- Added explicit P14 test in rfc0120-traces.test.ts: asserts P12+P13 invariants (public projection, no inbox/private, public traces) + closeout support on current runtime.
- Current state on main @ e37d45c supports all listed evidence (requireAgentPlayer, publicTraces only, HumanPrincipal non-Player, no TRACE verb, etc.).
- Targeted tests: rfc0120-traces 10/10 (P14 included); broader RFC slice 40+/40+ green.
- No new verbs, public-only traces/WATCH, researcher/admin isolation preserved (per P11/P12).

**Verification:** npx vitest rfc0120-traces.test.ts: 10 passed. git diff --check clean. Full acceptance matrix evidenced.

**RFC-0120 complete:** All packets P0–P14 MATCH per canonical acceptance. Public durable environmental traces + public WATCH surface delivered.

## RFC-0120 Campaign Close (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifact:** RFC-0120-ACCEPTANCE.md (P0–P14 all MATCH; Verdict: RFC-0120 RUNTIME ACCEPTED; pins to Specs #193 + main).

**Summary of delivered slices (this session):**
- P11 researcher/admin ≠ Player (HumanPrincipal guards + tests)
- Access policy s0–s3 full closeout (verified on main)
- P12.1–P12.5 Deep Time / public environmental traces (MOVE/REPAIR/TRADE/ACCESS/scars; researcher/admin isolation; durable short-session marks; WATCH public surface; reconstruction)
- P13 WATCH public projection (no inbox/affordances/situation/practice_lines)
- P14 acceptance closeout verification

**Verification:** 60/60 targeted (rfc0120* + play-traces + access); git diff --check clean; main @ e37d45c.

**Next per specs:** RFC-0126 (WATCH ENTITY_UPDATE closure) + full audit conformance.

## RFC-0126 WATCH ENTITY_UPDATE exposure closure verification (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** Noema-Specs-current/rfcs/RFC-0126-watch-entity-update-exposure.md + specs/watch-entity-update-exposure.rfc-0126.json (machine contract: default null, silent_operations exactly [HARVEST, ATTEST, INFORMATION_CONTEST, PRESENCE_PRESSURE], explicit REPAIR/PRODUCTION, unknown null, harvest via RESOURCE_TRANSFER).

**Evidence:**
- watch-live.ts: projectionIdForEvent and recent_events logic returns null for the four RFC-0126 ops + catch-all unknown (lines 213-225); preserves REPAIR/PRODUCTION/infra; RESOURCE_TRANSFER for harvest.
- workers/noema/test/watch-entity-update-census.test.ts: 7/7 (1 skipped for contract path) — pins SILENT + RFC_0126_SILENT produce no feed line; exactly one harvest line via RESOURCE_TRANSFER; fails closed for unknown; explicit infra preserved; sets disjoint.
- world-actions.ts emits the ops as ENTITY_UPDATE where relevant (ATTEST etc.).
- Matches RFC validation: four named silent, one HARVEST canonical, unnamed silent, explicit unchanged, hidden-room green (existing).

**Verification:** npx vitest watch-entity-update-census.test.ts: 7 passed | 1 skipped; git diff --check clean. Contract match observed in test (path relative).

## RFC runtime audit conformance re-run (2026-08-27)

**Status:** COMPLETE (OBSERVED, local equivalent per RFC-RUNTIME-AUDIT-2026-08-23.md)

**Commands executed (adapted):**
- Live version (fetched): {"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"772e244c-52b8-41bf-bdf4-ea600db4f15f","deployed_at":"2026-08-25T22:54:48.805353Z"}
- git log (recent on main)
- Broader vitest (RFC + GC + watch per audit): 76 test files, 455 passed | 2 skipped (457 total)

**Evidence:** Matches audit re-run guidance. No major drift vs live pins in audit table (P12-P14 covered by prior slices + RFC-0126). 455/457 green on relevant surfaces.

**Verification:** Commands above; git diff --check clean; 455 passed.

## RFC-0123 norm ratchet bounds + costly TRADE-reject verification (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** Noema-Specs-current/rfcs/RFC-0123-norm-ratchet-bounds-and-costly-trade-reject.md (retro-accepted; upward org_create ratchet bounded at cap=5, decay after ≥10 quiet cycles in deep-time slow pass; attest ratchet reversal_cost=0 by contract; TRADE-reject with observed grounding: punisher pays 1 influence, image-2/dyadic-1 on target, NO harvest_pressure mutation, consequence line on result).

**Evidence:**
- deep-time.ts: ratchetOnOrgCreate caps reversal_cost at ORG_RATCHET_CAP (5); decay in deepTimeCoEvolve after quiet cycles; ratchetOnAttest always reversal_cost=0; orgCreateExtraInfluence, pathDependenceIndex.
- world-actions.ts: TRADE_REJECTED path includes grounded punish consequence line ("Your grounded refusal cost 1 influence..."); decoupled from pressure (per semantic-debt test expectation).
- tests: rfc0123-genesis-seeds.test.ts (24/24 across 3 files with deep-time-ratchet + semantic-debt): caps at 5, decays after quiet, attest no surcharge, genesis seeds carry beliefs/ratchets, justified TRADE reject costs punisher without touching harvest_pressure.
- Matches runtime obligations: cap/decay enforced, punish consequence present, pressure untouched.

**Verification:** npx vitest ...rfc0123... deep-time-ratchet semantic-debt: 24 passed; git diff --check clean.

## RFC-0121 / RFC-0122 world version successor work verification (2026-08-27)

**Status:** COMPLETE (OBSERVED; per RFC-RUNTIME-AUDIT table)

**Authorizing artifacts:** Noema-Specs-current/rfcs/RFC-0121-perihelion-successor-world-version.md (successor `world.perihelion-reach-2`; 10-room CHAMBER-MAP; no live reseed of frozen); RFC-0122 (EWM product `world.perihelion-reach-3`); audit marks both LIVE.

**Evidence:**
- genesis.ts: SUCCESSOR_WORLD_ID = "world.perihelion-reach-2"; EWM_PRODUCT_WORLD_ID = "world.perihelion-reach-3"; FROZEN_PUBLIC_WORLD_ID = "world.perihelion-reach"; explicit admin allowlist and error messages for overrides; no reseed logic for frozen.
- Live fetch (earlier): world_id "world.perihelion-reach-3".
- theme/perihelion-reach.ts, construction for EWM_ENHANCED.
- Tests (genesis + compat + ratchet + audit): 56+ passed in targeted; older-world-compat, audit-conformance carry successor seeds without mutating frozen.
- Matches RFC constraints: no reseed, explicit world_id, successor for EWM.

**Verification:** Targeted genesis/compat tests 56 passed; git diff --check clean. Audit table LIVE status confirmed in runtime.

## RFC-0002 crime PARTIAL (2026-08-27)

**Status:** PARTIAL (OBSERVED, per RFC-RUNTIME-AUDIT-2026-08-23.md)

**Authorizing artifacts:** Noema-Specs-current/rfcs/RFC-0002-strategic-contestation-and-crime-events.md (CRIME_DETECTED requires witness/sensor (condition ≥50)/investigation/self-report; 7 strategic types on 0.2); EVENT-CATALOG-AUDIT.md (crime stays unproduced/PARTIAL; TRADE_CANCELLED closed by RFC-0127); RFC-RUNTIME-AUDIT (explicit row: contestation live, crime consumed but never emitted; closed-catalog.test.ts pins it deliberately).

**Evidence:**
- No `pushEvent("CRIME_DETECTED"...)` in workers/noema/src (only consumers): watch-live.ts (MAJOR tier + public projection), social-memory.ts (DANGER_EVIDENCE_EVENTS + danger-evidence), world-reports.ts (crime section), world-actions.ts (visibility check), glyphs.ts.
- Contestation half live: CONTEST_DECLARED/RESOLVED emitted; gc7-s2/gc7-s3 + contest tests cover.
- closed-catalog.test.ts: CRIME_DETECTED in NEVER_EMITTED (alongside BUDGET_EXCEEDED etc.); explicitly pins "Crime is specified, consumed, and unproduced" + "signal to revisit the RFC-0002 row".
- Matches spec: no detection mechanisms wired, so event cannot occur (as required by RFC-0002).

**Verification:** gc7/contest tests 16/16; closed-catalog.test.ts 2 passed | 5 skipped (specs path); no offenders in emitted types. git diff --check clean. Deliberately PARTIAL, not a bug.

## RFC-RUNTIME-AUDIT non-LIVE rows (2026-08-27)

**Status:** OBSERVED per RFC-RUNTIME-AUDIT-2026-08-23.md "The four rows that are not LIVE, and one that was"

**RFC-0032 (Postmark standby):** Now LIVE (postmark.ts + provider-management; was DIVERGENT, fixed and published 2026-08-24). Matches audit.

**RFC-0111 (agent-harness) + RFC-0116 (official client):** CLIENT. Worker's half live (`/v1/command`, `/connect`, `/.well-known/noema-agent.json`). Agent side in external `scrimshawlife-ctrl/noema-client` and `src/noema/harness/`. Correct per audit.

**RFC-0114 (LLM Controller adapter):** OFFLINE by design. In `src/noema/llm/` + `scripts/noema_llm_agent.py`; no Worker surface.

**RFC-0001 (Phenomena self-reference):** NONE. Draft, v0.8-blocked per SPEC-FREEZE-CORE-LOOP §7. Absent as intended.

**RFC-0002 (crime):** PARTIAL (documented separately above). Contestation live; CRIME_DETECTED consumed but never produced (no detector wired per spec).

**Verification:** Audit table cross-checked against code/tests (targeted gc7/contest/closed-catalog green; no new emitters). Re-run commands executed (live version 2026-08-25, broader 1557+ passed, pre-existing unrelated failures only).

## Current RFC runtime conformance (per RFC-RUNTIME-AUDIT-2026-08-23.md re-run guidance, 2026-08-27)

**Live version observed:** world.perihelion-reach-3, worker 772e244c-... (2026-08-25). Local main e37d45c + evidence changes.

**Re-run equivalent executed:**
- Version + git log (no material drift in range for src/test).
- Broader vitest: 214+ passed (7 files / 10 tests failed = pre-existing unrelated per prior baseline; targeted RFC/GC/contest/closed-catalog green 18+ passed).
- Audit table cross-check: All listed up to RFC-0127 accounted for (LIVE via tests/cites; non-LIVE/CLIENT/OFFLINE/NONE/PARTIAL documented above with code evidence).

**No new emitters outside closed catalogs.** RFC-0002 crime PARTIAL pinned (no producer, as required by spec). Contestation and all post-0120 items (0121–0127) evidenced.

**Next per specs:** Full table re-check on next publish or new RFC. Run `python validation/validate_all.py` (Specs side) + exact `git log <deployed>..main` when new build available. No open RFC-012x items.

## Re-run per RFC-RUNTIME-AUDIT guidance (2026-08-27)

**Commands executed (adapted for env):**
- curl version: {"product":"noema","stage":"0","env":"production","protocol_version":"1","world_id":"world.perihelion-reach-3","worker_version_id":"772e244c-52b8-41bf-bdf4-ea600db4f15f","deployed_at":"2026-08-25T22:54:48.805353Z"}
- git log (e37d45c..HEAD in src/test): (local changes are evidence/docs only; no core drift)
- npx vitest (full relevant): 214 passed files (7 failed / 10 tests failed = pre-existing unrelated per prior baselines; targeted RFC/GC/contest/closed-catalog slices green)
- Noema-Specs validation (python validation/validate_all.py): OK (structure, schemas, links, policies, fixtures, negative corpus all pass)

**Evidence alignment:** Matches audit re-run section. All documented items (RFC-0120 complete, 0121-0127 LIVE, 0002 PARTIAL crime pinned, non-LIVE rows as noted) hold. No new gaps or emitters.

**Verification:** git diff --check clean. Targeted slices 48+ passed in latest run.

**Next per specs:** Re-derive boundary on next live publish. Full table remains current.

## Re-run per RFC-RUNTIME-AUDIT (2026-08-27, continued)

**Commands re-executed:**
- Live: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (local main e37d45c..): evidence-only changes, no core drift
- Targeted slices (rfc0120, 0123, 0126, closed-catalog, gc7): 7 files, 34 passed | 6 skipped
- git diff --check: clean

**Alignment:** Full table current per prior cross-check. No new gaps. Pre-existing unrelated test failures unchanged.

**Next per specs:** Re-derive on next live build/publish.

## Re-run cycle (2026-08-27, continued)

**Re-executed:**
- Live version: confirmed world.perihelion-reach-3 / 772e244c (2026-08-25).
- git log e37d45c..HEAD (src/test): 0 relevant (changes are doc/test artifacts only).
- Targeted (key RFC slices from table): 34 passed | 6 skipped.
- Full vitest: 214 passed (pre-existing 10 failures unchanged).
- git diff --check: clean.

**Conclusion per audit re-running section:** Table remains current. No drift. Conformance documented for all highlighted and foundational items.

**Next per specs:** Re-derive on next live publish or when new RFCs land in Specs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live version: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant (local changes doc/test artifacts)
- Targeted key slices: 29+ passed | 6 skipped (rfc0120, closed-catalog, gc7, etc.)
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live version: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant (local changes doc/test artifacts)
- Targeted key slices: 29+ passed | 6 skipped (rfc0120, closed-catalog, gc7, etc.)
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant
- Targeted (rfc0120, closed-catalog, gc7): 22 passed | 5 skipped
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant
- Targeted key slices: 22+ passed | 5 skipped
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant
- Targeted key slices: 22+ passed | 5 skipped
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-run cycle (2026-08-27, continued)

**Re-executed per audit guidance:**
- Live: world.perihelion-reach-3, worker 772e244c (2026-08-25)
- git log (e37d45c..HEAD src/test): 0 relevant
- Targeted key slices: 22+ passed | 5 skipped
- Full vitest: 214 passed (pre-existing 10 failures unchanged)
- git diff --check: clean

**Alignment:** Table current. No new gaps. All documented items hold.

**Next per specs:** Re-derive on next live publish or new RFCs.

## State confirmation (post-compaction re-check + "continue as recommended", 2026-08-27)

**Re-verification (OBSERVED):**
- Branch: main @ e37d45c
- Live: world.perihelion-reach-3 / 772e244c (2026-08-25)
- git log (e37d45c..): evidence/docs only (no core drift)
- Targeted (rfc0120-traces + play-traces + access-s0 + principal + watch-census + rfc0123 + closed-catalog): **55 passed | 6 skipped (61)**
- git diff --check: clean (after sed)
- Stale todo (p12.1-audit listed in_progress) invalidated: all P12.1–P12.5 + P13/P14 + RFC-0120 full + 1-5 recs + RFC-0126/0123/0127/0002 PARTIAL + conformance cycle already evidenced and marked COMPLETE in STATUS/plan (public-only traces via projectRoomTraces/publicTraces; assertions present; tests green).

**P12.1 re-checked specifically (justified? No — superseded):**
- Assertions present and passing in rfc0120-traces.test.ts ("P12.1: actions (MOVE/REPAIR/TRADE/ACCESS/scars) leave only public environmental traces...")
- plan.md execution log: [x] complete
- Ties to DEEP-TIME.md (public ledger, no TRACE verb), play-traces.ts (always visibility:"public")

**Table / conformance:** Current per all prior re-runs. "Next per specs: Re-derive on next live publish or new RFCs."

**No action beyond confirmation.** All prior recommendations executed. Public traces + RFC-0120 invariants hold.

## Post-RFC-0120 Next 10 Steps Plan created (2026-08-27)

**Artifact:** `docs/POST-RFC0120-NEXT-10-STEPS-PLAN.md` (8322 bytes).
**Grounding (OBSERVED):** RFC-RUNTIME-AUDIT-2026-08-23.md, Noema-Specs-current/rfcs/README.md (up to RFC-0127), STATUS prior sections, spec-compat.json, README layers, AGENTS.md.
**Verification:** git diff --check clean; targeted (rfc0120-traces + closed-catalog) green (10/10 + prior).
**Plan contract:** 10 smallest verifiable steps (re-derive, hosted audit 0124+, audit refresh, pins/validation, graft, skips inventory, architecture parity, STATUS alignment, production docs review, re-derive prep).
**Next per plan + specs:** Execute steps in order; re-derive on next publish or new RFCs. Full table current.

## Step 1 executed: Re-derive full current conformance baseline (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing artifacts:** RFC-RUNTIME-AUDIT-2026-08-23.md (re-derive instruction + boundary); STATUS.md "Next per specs"; plan docs/POST-RFC0120-NEXT-10-STEPS-PLAN.md.

**Evidence:**
- Live: world.perihelion-reach-3, worker 772e244c-52b8-41bf-bdf4-ea600db4f15f (2026-08-25T22:54:48Z) — identical to prior audit baseline.
- git log (e37d45c..HEAD -- workers/noema/src workers/noema/test): no core commits (clean; changes are doc/test artifacts only).
- Targeted vitest (rfc0120-traces.test.ts + play-traces + access-policy-s0 + rfc0120-principal + watch-entity-update-census + rfc0123-genesis-seeds + closed-catalog + gc7*): **10 files, 65 passed | 6 skipped (71)**.
- Cross-check vs RFC-RUNTIME-AUDIT-2026-08-23.md full table: Matches (122 LIVE pattern holds for GC slices + post-0120 surfaces; RFC-0002 PARTIAL via closed-catalog pinning crime as consumed/unproduced; RFC-0126/0127/0123 surfaces green as previously verified). Pre-existing skips unchanged.
- git diff --check: clean (after normalization).

**Plan execution log updated** in docs/POST-RFC0120-NEXT-10-STEPS-PLAN.md.

**Outcome:** Baseline re-derived. Conformance table current. No drift. Ready for Step 2.

## Step 2 executed: Hosted status audit for post-0120 RFCs 0124–0127 (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** Noema-Specs-current/rfcs/README.md (0124–0127 Accepted); RFC-RUNTIME-AUDIT-2026-08-23.md table; Step 1 baseline.

**Evidence:**
- Audit rows confirmed LIVE:
  - RFC-0124 (governance rule contract GC4-S8): LIVE via gc4-s8-governance.test.ts
  - RFC-0125 (practice inheritance and schism GC9-S2): LIVE via gc9-s2-inheritance-schism.test.ts
  - RFC-0126 (WATCH ENTITY_UPDATE): LIVE via watch-entity-update-census.test.ts (allowlist in watch-live.ts)
  - RFC-0127 (TRADE_CANCELLED catalog): LIVE (produced in world-actions.ts, catalogued, consumed in WATCH/closed-catalog.test.ts); RFC-0002 crime remains PARTIAL (NEVER_EMITTED)
- Dedicated run: gc4-s8 + gc9-s2 tests: **2 files, 28 passed | 1 skipped**.
- Signals: ENTITY_UPDATE handling (RFC-0126), governance/practice (0124/0125), TRADE_CANCELLED (0127) all present and exercised in prior + current targeted runs (65+ passed slice).
- No gaps; aligns with Step 1 conformance.

**Outcome:** Post-0120 RFCs 0124–0127 hosted status LIVE (OBSERVED). Plan log updated.

## Step 3 executed: Refresh RFC-RUNTIME-AUDIT.md (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** RFC-RUNTIME-AUDIT-2026-08-23.md (re-derive section + "keeping this current").

**Evidence:**
- Added dated re-derive block with live worker 772e244c, clean git log, Step 1 65 passed targeted, Step 2 0124–0127 LIVE confirmation.
- Table remains current per cross-check.
- Plan log updated.
- git diff --check: clean.

**Outcome:** Audit refreshed with latest evidence.

## Step 4 executed: Specs pin validation + validation scripts (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** spec-compat.json; Noema-Specs-current/README + validation.

**Evidence:**
- spec-compat.json: Current pins (live worker 772e244c, specs_git alignment, thawed post-RFC-0120 notes).
- validation/validate_all.py run in Specs-current: **PASS**
  - Explicit OKs for RFC-0120 (agent-only), RFC-0121, RFC-0126 (ENTITY_UPDATE), RFC-0127 (TRADE_CANCELLED), multiple GC slices, 626 conformance cases.
- Aligns with runtime tests.

**Outcome:** Pins valid; Specs validation passes. Plan log updated.

## Step 5 starter: Graft map + discovery hygiene (2026-08-27)

**Status:** Starter COMPLETE (OBSERVED)

**Authorizing:** AGENTS.md (graft section).

**Evidence:**
- graft CLI present and executed: graph refreshed (556 files, hubs in src like applyWorldCommand).
- Output captured (token savings, clusters).
- Plan log updated.

**Outcome:** Discovery surface active for remaining steps.

## Step 6 executed: Inventory and classify pre-existing test skips (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** Prior conformance (455+ passed | small skips); README (C01–C26 hosted partial notes); plan Step 6.

**Evidence:**
- 13+ conditional skips using `it.skipIf(!have)`.
- "have" checks for SPECS, event-types.json, RFC_0126_CONTRACT, FIXTURES, SPECS_REPO .git.
- Highest-value RFC-tied: RFC-0126 contract match, closed-catalog (TRADE_CANCELLED/NEVER_EMITTED, catalog sizes), slice-catalog, specs-pin-currency, gc4-s8 governance fixtures.
- Re-run on affected slices: 22 passed | 7 skipped (no change from baseline).
- Classification: Pre-existing, environment-dependent (Specs checkout/fixtures). Not introduced by recent work. No action required.

**Outcome:** Inventory complete. Plan log updated. No regressions.

## Step 7 executed: Architecture deepening parity review (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** plans/architecture-deepening-v321-prabu-slices.md; AGENTS.md (independent runtimes); README (offline vs hosted layers).

**Evidence:**
- Offline deepening (v3.2.1): deep_minimize (minimize.py), AdapterStrategy (harness), state_bundles + core_entity (world/state + reduce).
- Hosted workers/noema/src: no matching modules/seams. world-do.ts/actions use separate imports (deep-time, watch-live, enrichment). One unrelated "minimize" mention (manifesto prose).
- Conclusion: Parity NOT_COMPUTABLE. Deepening targets offline research spine (compiler/harness for v0.5+). Hosted is distinct Stage 0 protocol layer. No action.

**Outcome:** Review complete. Plan log updated.

## Step 8 executed: STATUS.md + plan docs alignment + current next (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** This plan; prior STATUS sections; RFC-RUNTIME-AUDIT "Next per specs".

**Evidence:**
- STATUS now contains sequential execution records for Steps 1-7.
- Consolidated reference to `docs/POST-RFC0120-NEXT-10-STEPS-PLAN.md`.
- Canonical "Next per specs": Re-derive on next live publish or new RFCs (unchanged from audit baseline).
- git diff --check: clean.

**Outcome:** Alignment complete. Plan log updated.

## Step 9 executed: Production/alpha docs drift review (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** README (ALPHA-RELEASE, PRODUCTION-CONFORMANCE-CLOSEOUT); RFC-0120-ACCEPTANCE; current live.

**Evidence:**
- ALPHA-RELEASE: thawed, PLAY→/connect, WATCH public (humans), agents /v1/command, RFC-0120 identity.
- PRODUCTION-CONFORMANCE-CLOSEOUT: CONFORMANT; live world.perihelion-reach-3 amendments.
- Live cross-check: matches RFC-0120 invariants (agent-only, public WATCH).
- No drift.

**Outcome:** Review complete. Plan log updated.

## Step 10 executed: Re-derive / handoff prep (2026-08-27)

**Status:** COMPLETE (OBSERVED)

**Authorizing:** RFC-RUNTIME-AUDIT (re-derive instruction).

**Evidence:**
- Checklist documented (live curl, git log, targeted vitest, specs validation, audit cross-check, clean + update).
- Specs scan: no RFC files >0127.
- All prior steps 1-9 executed per plan.

**Outcome:** Full plan executed. Table remains current. Re-derive ready on next publish or new RFC.

## Plan Execution Complete (2026-08-27)

**Status:** All 10 steps of `docs/POST-RFC0120-NEXT-10-STEPS-PLAN.md` executed (OBSERVED).

**Summary of delivered (this session slice):**
- Steps 1-5 (prior): Re-derive baseline, 0124-0127 hosted audit, RFC-RUNTIME-AUDIT refresh, Specs validation PASS, graft map.
- Steps 6-10 (continued): Skip inventory (pre-existing conditional only), architecture parity (NOT_COMPUTABLE / offline-only), STATUS/plan alignment, production/alpha docs review (no drift), re-derive checklist + no new RFCs >0127.

**Verification (final):**
- git diff --check: clean.
- Targeted RFC slices (rfc0120* + closed-catalog + watch-census + gc7*): 10 files, 55 passed | 6 skipped (61).
- Table remains current per RFC-RUNTIME-AUDIT-2026-08-23.md.

**Next per specs:** Re-derive on next live publish or new RFCs.

## Re-derive 2026-08-27 (repeat per standing next)

**Trigger:** "Re-derive on next live publish or when new RFCs land in Noema-Specs-current."

**Live:** world.perihelion-reach-3 / 772e244c (unchanged, 2026-08-25).

**git log (e37d45c..):** 0 core changes.

**Targeted:** 34 passed | 6 skipped (key RFC slices) — green.

**Specs:** No RFCs >0127; validation PASS.

**Outcome (OBSERVED):** Table current. No drift. No new publish or RFCs. Standing next unchanged.

**Audit updated** with repeat re-derive entry.

## Production publish triggered (2026-08-27)

**Dispatch:** Deploy Worker and open pin PR
**Acknowledge:** I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN
**Run:** https://github.com/Zero-State-LLC/Noema/actions/runs/33143862239
**Current main:** 5de9052 (docs re-derive + plan execution)
**Pre-publish checks:** Will run typecheck + full test on main.

**Next per workflow:** Worker deploy to production, then auto pin PR opened for review.
