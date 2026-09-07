# NOEMA spec-directed runtime continuation plan

**Recorded:** 2026-09-01 (post #624)  
**Runtime baseline:** `684869e485bc433e543765610a0767177a18afbb` (origin/main, Gate B provenance)  
**Specs baseline:** `2e3438fd82aac384b6e8c7720596ebe0b45930ca`  
**Official client baseline:** `af19d165e8ba2ef4d9a327ac6c831213058ad433` (`0.1.20`)  
**Disposition:** continue from existing work; do not restart or recreate WATCH, cohort, auth, or client stabilization slices.

**Amendment 2026-09-03 (client pin):** Danny authorized advancing
`hosted_live.official_client` to `noema-client==0.1.21` (GitHub Latest
`v0.1.21`, tag commit `0a20e2e`). C7 enrollment-bound checks remain
unrun. Gate B remains **OWNER_BLOCKED**. This does not enroll, publish,
or close LCA-2.

## Execution amendment 2026-09-07

Continue this queue using the owner-approved [Specs–runtime gap-closure work
packets](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md). That companion reconciles
current source, deployment, client, and evidence separately; historical
receipts below are not current-main acceptance. After the 2026-09-07 Deploy +
pin, use its §2 refresh
([#640](https://github.com/Zero-State-LLC/Noema/pull/640)) as the OBSERVED pin
table. P0–P2 engineering and reviewed PRs precede conditional live Gates B–F.
Explicit deploy, enrollment, paid/live-run and acceptance boundaries remain
intact. This amendment does not claim Gate B complete.

### Verified continuation disposition, 2026-09-07 UTC

Historical same-day snapshot. C2–C6 rows below are superseded by the 2026-09-07
PT table that follows.

Read-only GitHub checks on 2026-09-07 confirmed runtime `main` at
`c1be76650c995972de290d11e78a54d8baab70e9` (approved plan #631 merged)
and Specs `main` at `94286cac7cc200a4ed244bfd7321ef16d0bfc2a1`.
These are repository baselines, not deployment identities or acceptance evidence.
The older observations and instructions below remain historical receipts unless
superseded by a dated disposition here.

| Queue item | Current disposition | Evidence boundary / next dependency |
|---|---|---|
| C0 | MERGED | GitHub reports #606 merged on 2026-09-01 at `2583f0d97ab96fe12ca89216f4ed85e1b9402fa0`. Do not wait for or recreate this PR. This check did not re-run its post-merge CI. |
| C1 | NOT_VERIFIED | Protected preflight input names, values, and readiness were not inspected during this refresh. No configuration change is authorized. |
| C2 | VERIFICATION_IN_PROGRESS | P1/P2 require fresh candidate Worker/Python tests, typecheck, and integration evidence. Runtime CI defect [#632](https://github.com/Zero-State-LLC/Noema/issues/632) and Specs CI defect [#324](https://github.com/Zero-State-LLC/Noema-Specs/issues/324) track missing ordinary-PR validation. No current full-suite result or deployment-readiness verdict is claimed here. |
| C3-C6 | CONDITIONAL / OWNER_BLOCKED | Keep the explicit deploy, protected preflight, WATCH acceptance, and controlled email approvals below. No deployment, email, or recovery drill was performed in this refresh. |
| C7 | PIN_ADVANCED / ACCEPTANCE_UNRUN | The 2026-09-03 authorization and runtime #628 advanced the pin to `noema-client==0.1.21`. Verify that exact artifact and its current-Worker enrollment/action/refusal/resync/reconnect path. Historical `0.1.20` results do not establish `0.1.21` acceptance. |
| C8 | OWNER_BLOCKED | Three independent external Controllers and approval-bound acceptance evidence remain required. Local engineering tests cannot promote Gate B or Gate C. |

The prior Gate A acceptance remains historical authority. Gate B/C status is
unchanged. This refresh did not call live readiness endpoints, inspect private
credentials, enroll Controllers, send email, spend a run budget, or mutate a world.

### Disposition refresh, 2026-09-07 PT (post Deploy + pin)

Supersedes the UTC table above for C2–C6. C0 remains MERGED; C1/C6/C8 remain
blocked as stated. This is not Gate B completion, enrollment, spend, or a full
WATCH acceptance suite.

OBSERVED pin table (Worker, `/version`, `/ready`, `hosted_live`, Specs/runtime
heads): [SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md)
§2 refresh ([#640](https://github.com/Zero-State-LLC/Noema/pull/640)).

| Queue item | Current disposition | Evidence boundary / next dependency |
|---|---|---|
| C0 | MERGED | Unchanged. #606 merged 2026-09-01 at `2583f0d97ab96fe12ca89216f4ed85e1b9402fa0`. |
| C1 | NOT_VERIFIED | Protected preflight input names, values, and readiness were still not inspected. Deploy proceeded on explicit acknowledge, not on a C1 close-out. No configuration change is authorized here. |
| C2 | PARTIAL / CI_GREEN | Runtime PR CI now runs Worker and Python regression ([#635](https://github.com/Zero-State-LLC/Noema/pull/635), closed #632). Main CI is green on the deploy source after [#638](https://github.com/Zero-State-LLC/Noema/pull/638) ([run 34167567879](https://github.com/Zero-State-LLC/Noema/actions/runs/34167567879) on `9c25603581992da0440b2dd733a554aca98adef0`) and remains green through pin [#639](https://github.com/Zero-State-LLC/Noema/pull/639) and baseline [#640](https://github.com/Zero-State-LLC/Noema/pull/640). A full local candidate suite (Worker + typecheck + integration + official-client path) may still be required for P2. Specs issue [#324](https://github.com/Zero-State-LLC/Noema-Specs/issues/324) is OBSERVED CLOSED (title: CI build does not execute specification validation); Specs CI now runs `bash validation/run.sh` on push/PR. |
| C3 | COMPLETE | Explicit production deploy was authorized and dispatched with acknowledge `I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN` from `9c25603581992da0440b2dd733a554aca98adef0`. Deploy workflow SUCCESS: [run 34167731843](https://github.com/Zero-State-LLC/Noema/actions/runs/34167731843). |
| C4 | COMPLETE | Worker published as `04ef6ecb-65b9-430e-b0fd-141a2cc7179f` (`deployed_at` 2026-09-07T22:46:20.53456Z). Pin PR [#639](https://github.com/Zero-State-LLC/Noema/pull/639) merged; `hosted_live.worker_version_id` matches live `/version`; merge commit `957620894a2c45810d3f20aa53c65d9fbf5f0d5b` is on `main`. Specs pin [#638](https://github.com/Zero-State-LLC/Noema/pull/638) and baseline docs [#640](https://github.com/Zero-State-LLC/Noema/pull/640) are also on `main`. |
| C5 | VERIFICATION_PENDING | Deploy succeeded. Public `/version` and `/ready` are OBSERVED in the §2 pin table (ACTIVE, HEALTHY, play open). No in-repo post-`04ef6ecb` WATCH browser acceptance suite (desktop/mobile map, coupling, rooms, a11y, live identity). The 2026-09-02 Galadriel receipt is prior Worker `3f9b0e44-98c1-46f9-8232-bb44051a754f`, not current-Worker acceptance. |
| C6 | OWNER_BLOCKED | Controlled live email acceptance still requires an authorized ADMIN operator, a controlled recipient, and explicit send approval. No email was sent in this refresh. |
| C7 | PIN_ADVANCED / ACCEPTANCE_UNRUN | Unchanged. Client pin remains `noema-client==0.1.21`. Enrollment-bound checks (discover/doctor/enroll/act/refuse/resync/reconnect on the current Worker) remain unrun. |
| C8 | OWNER_BLOCKED | Unchanged. Three independent external Controllers and approval-bound acceptance evidence remain required. Gate B remains **OWNER_BLOCKED**. |

This PT refresh did not enroll Controllers, send email, spend a run budget,
mutate a world, or claim Gate B.

## Objective

Bring accepted Specs, runtime source, the deployed Worker, the official client,
WATCH, multi-agent play, and reproducible evidence back to one supportable
state. Select the first missing link, not the most visible feature.

## Historical evidence boundary (2026-09-01, with dated amendments)

| Surface | Current observation | Classification |
|---|---|---|
| Runtime source | `45e2070` contains the map-first WATCH integration and passed the complete Worker suite and typecheck | SOURCE_IMPLEMENTED |
| Hosted Worker (2026-09-01) | `34f4b0dc-85c6-4adb-8fd8-9ccffae73b99`, source `a68f5d8d6dcc441696e4ab883d120bc3cc53d398` | HOSTED_OLDER_SOURCE (historical) |
| Hosted Worker (2026-09-02 C5 receipt) | `3f9b0e44-98c1-46f9-8232-bb44051a754f` | PRIOR_DEPLOYMENT (not current) |
| Hosted Worker (2026-09-07 PT) | `04ef6ecb-65b9-430e-b0fd-141a2cc7179f`, source `9c25603581992da0440b2dd733a554aca98adef0`, `deployed_at` 2026-09-07T22:46:20.53456Z | HOSTED_PINNED — OBSERVED in [§2 refresh](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md) ([#640](https://github.com/Zero-State-LLC/Noema/pull/640)); WATCH suite VERIFICATION_PENDING |
| Hosted world | `world.perihelion-reach-3`, `genesis.94d0961984b2b4f8`, ACTIVE, HEALTHY, playable | HOSTED_READ_ONLY_VERIFIED (re-OBSERVED 2026-09-07 PT via `/ready`; cycle is probe-time, not a frozen pin) |
| WATCH `/watch` | Desktop browser load passed; HTTP dependencies returned 200 and stream upgraded with 101 | PRIOR_DEPLOYMENT_VERIFIED (not proven on `04ef6ecb`) |
| WATCH `/watch/map` | Desktop and 390 px mobile browser loads passed; map, Health, River, navigation, and live state rendered | PRIOR_DEPLOYMENT_VERIFIED (not proven on `04ef6ecb`) |
| Map-first source `45e2070` | Historical “not deployed” note from 2026-09-01. Later publish is Worker `04ef6ecb` from source `9c25603`; that is not a claim that `45e2070` itself is live. | HISTORICAL_NOTE |
| Official client | Source/release `0.1.20`; clean suite passed 165 tests; live discovery and `doctor` passed | VERIFY_EXISTING |
| Hosted client pin | `noema-client==0.1.21` | OWNER_AUTHORIZED (Danny 2026-09-03; C7 enrollment checks still unrun) |
| LCA cohort runner | Real local Worker plus three official-client processes verified; participant isolation protections present | RUNNER_VERIFIED_LOCAL |
| Gate B | Code paths for fail-closed optional reconstruction controllers (positive real int or omitted) + human approval + independent-control receipts for exactly three enrollments (rejecting contention/recovery gaps) merged via #624 (Galadriel assignments Noema #622 + Noema-Specs #290); tests passed (Worker 1628, Python 541); live external controllers and human approvals absent | OWNER_BLOCKED (code advanced; local evidence only) |
| Email provider status | Hosted provider-management is ADMIN-gated | AUTHORIZED_PROBE_REQUIRED |
| Live email delivery/fallback | No controlled live delivery was executed in this campaign | NOT_COMPUTABLE |

Prior-deployment browser evidence (`3f9b0e44` and earlier) does not prove the
map-first source changes on current Worker `04ef6ecb`. Local tests and
read-only provider checks do not prove live Resend or Postmark delivery or
fallback behavior.

## Collaborator continuity

Preserve and continue from merged partner work, including Prabu contributions
around enrollment timing, cohort environment sanitization, evidence-file modes,
Specs validation, client `0.1.20`, and event-contract reconciliation. Do not
replace these implementations unless current canon or observed behavior proves
a defect.

**2026-09-01 partner slice (Galadriel):** Forge completion for Noema #622 + Noema-Specs #290. reconstruction.py now fails closed on optional controllers (positive real int required or omitted compatible). device-enrollment.ts now records/validates human approval + independent-control receipts for exactly three enrollments, rejects contention/recovery gaps. PR #624 (forge/gate-b-enrollment-provenance @706657a) merged to main; all reported tests green (no claim on live controllers). Local evidence only for fail-closed paths.

Before each material slice record:

```text
CANDIDATE:
CANONICAL REQUIREMENT:
MERGED RELATED WORK:
OPEN RELATED WORK:
PARTNER CONTRIBUTIONS:
EXISTING TESTS:
EXISTING EVIDENCE:
ACTUAL GAP:
DISPOSITION:
```

## Active PR disposition

### PR #606: deployment settlement and email preflight

```text
ACTIVE PR: #606
AUTHOR / CONTRIBUTOR: scrimshawlife-ctrl; partner review requested from Prabu and Partner Agents
SCOPE: read-only settlement inspection and Resend-domain verification before production publish
CURRENT HEAD: cc5738e65e734e8c6b1ddf9b511ce56df02dec80
CANONICAL PURPOSE: fail closed before deploy when settlement or transactional sender configuration cannot be inspected
OVERLAP WITH CAMPAIGN: deployment-preparation gate only
DISPOSITION: WAIT_FOR_ACTIVE_PR
```

All CI and CodeQL checks pass. Main protection requires one independent code-owner
approval. Do not bypass that review. The PR does not prove live email delivery,
Postmark behavior, or fallback behavior. Production Actions currently exposes
only `CLOUDFLARE_API_TOKEN` and `NOEMA_PIN_PR_TOKEN`; the four proposed preflight
secrets are not configured.

## Ranked continuation queue

### C0. Settle PR #606

**Owner:** independent code owner  
**Action:** review, repair if requested, then squash merge.  
**Evidence:** required approval, all checks green, post-merge CI green.  
**Stop:** do not deploy while the PR is unmerged or its protected secrets are absent.

### C1. Configure protected read-only preflight inputs

**Owner:** repository/production administrator  
**Dependencies:** C0 merged.  
**Inputs:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL` in the protected production environment.  
**Evidence:** secret names present without exposing values; workflow preflight
can read the live canonical row and verified sender domain.  
**Non-claim:** this does not prove delivery or fallback.

### C2. Run deployment-readiness checks without publishing

**Disposition (2026-09-07 PT):** `PARTIAL / CI_GREEN`. Ordinary PR CI now
executes Worker and Python regression ([#635](https://github.com/Zero-State-LLC/Noema/pull/635)).
Main CI is green on `9c25603` after [#638](https://github.com/Zero-State-LLC/Noema/pull/638)
([run 34167567879](https://github.com/Zero-State-LLC/Noema/actions/runs/34167567879)).
A full local candidate suite may still be required for P2. Historical
`VERIFY_EXISTING` checks below remain the readiness list; they are not all
re-run as a single local packet in this refresh.

**Checks:**

1. runtime main and Specs main refreshed;
2. no overlapping active deployment or WATCH PR;
3. complete Worker tests and typecheck green;
4. read-only settlement inspection targets `world.perihelion-reach-3` and reports
   the canonical head and both RPC names;
5. read-only sender-domain verification reports the exact configured domain as
   verified;
6. `/ready` remains ACTIVE/HEALTHY and `play_blocked=false`;
7. repository clean and deployment source SHA recorded.

If any check is unavailable, verdict is `BLOCKED`, not ready.

### C3. Obtain explicit production-deploy authorization

**Disposition (2026-09-07 PT):** `COMPLETE`. Deploy was authorized and
dispatched with acknowledge `I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN` from
`9c25603581992da0440b2dd733a554aca98adef0`. Workflow SUCCESS:
[run 34167731843](https://github.com/Zero-State-LLC/Noema/actions/runs/34167731843).

Repository policy still requires the user to explicitly say **deploy** for any
later publish. Passing readiness checks does not authorize a new publication.

### C4. Publish and settle the generated pin PR

**Disposition (2026-09-07 PT):** `COMPLETE`. Worker
`04ef6ecb-65b9-430e-b0fd-141a2cc7179f` published; pin PR
[#639](https://github.com/Zero-State-LLC/Noema/pull/639) merged to `main`
(`957620894a2c45810d3f20aa53c65d9fbf5f0d5b`). Live `/version` matches
`hosted_live.worker_version_id`. See
[SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md)
§2 ([#640](https://github.com/Zero-State-LLC/Noema/pull/640)).

**Dependencies:** C0-C3.  
**Action:** dispatch the existing production deploy-and-pin workflow from main.
Do not use a competing deployment path.  
**Required evidence (satisfied for this publish):**

- exact deployed source SHA;
- Wrangler Worker version ID;
- live `/version` convergence to that ID;
- live `/ready` ACTIVE/HEALTHY;
- generated `spec-compat.json` pin PR;
- independent review and green CI on the pin PR;
- merged pin before treating repository and deployment identity as reconciled.

Do not reseed, activate Genesis, recover, or mutate `world-01`.

### C5. Verify the newly deployed WATCH source

**Disposition (2026-09-07 PT):** `VERIFICATION_PENDING`. Public `/version` and
`/ready` OBSERVED after Deploy (Worker `04ef6ecb-65b9-430e-b0fd-141a2cc7179f`,
ACTIVE / HEALTHY, play open). That is not the full WATCH browser acceptance
list below. No in-repo receipt reruns those checks against `04ef6ecb`.

Only after C4, rerun real browser acceptance against the new Worker:

- `/watch` desktop with HTTP 200 dependencies and WebSocket 101;
- `/watch/map` desktop and mobile;
- map dominance and event/map coupling;
- complete public room set and hidden-topology omission;
- TEXT and low-noise controls;
- keyboard focus and semantic navigation;
- reduced-motion behavior;
- live `/v1/watch/live` and `/v1/watch/map` identity consistency;
- no private messages, cognition, affordances, or hidden routes.

Classify visual defects as `RECOMPOSE` or `REPAIR_EXISTING`. Do not create a new
WATCH framework.

**Verification receipt (Galadriel, 2026-09-02 Gate B WATCH C0) — prior Worker:** Completed read-only hosted verification. /watch and /watch/map HTTP 200; desktop Chrome + 390x844 mobile renders; /health /ready 200 ACTIVE/HEALTHY. /v1/watch/live + /v1/watch/map agree on world.perihelion-reach-3, cycle 10259, sequence 26489. Hosted Worker: 3f9b0e44-98c1-46f9-8232-bb44051a754f (not current; current live Worker is `04ef6ecb-65b9-430e-b0fd-141a2cc7179f`). Local commit: 706657a. Focused verification 22 passed; git diff --check clean. Screenshots: watch-20260903T000324Z.png + watch-map-390-.... Boundary preserved (OWNER_BLOCKED, no source SHA public, no fabricated enrollments). Updated: docs/evidence/WATCH-FIDELITY-GATE-B-2026-09-03.md + continuation plan + assets/.

### C6. Run controlled live email acceptance separately

**Disposition (2026-09-07 PT):** `OWNER_BLOCKED` (controlled email). Unchanged.

**Owner:** authorized ADMIN operator with a controlled recipient.  
**Safety:** sending email is an external side effect; obtain explicit approval
for the recipient and test.  
**Evidence required:** provider selected, message ID/receipt, sender domain,
template identity, controlled inbox receipt, and a deliberately exercised
fallback case if fallback is claimed. Redact addresses and secrets.

Until this occurs, live delivery and fallback remain `NOT_COMPUTABLE`.

### C7. Decide official-client pin promotion

Do not change `hosted_live.official_client` solely because `0.1.20` exists.
After the deployed Worker is settled, run:

- clean `0.1.20` suite and wheel identity;
- live discovery and `doctor`;
- authorized enrollment/connect path;
- observe/act/rejection/resync/reconnect behavior;
- bounded session with receipts;
- cross-repo command/affordance fixtures.

Promote the pin only when the evidence applies to the current Worker.

**Amendment 2026-09-03:** Danny authorized advancing `hosted_live.official_client`
to `noema-client==0.1.21` (GitHub Latest `v0.1.21`, tag commit `0a20e2e`).
The rule above still holds as the 2026-09-01 instruction: do not promote
solely because a tag exists. This override does not complete the
enrollment-bound C7 checks and does not complete Gate B. Gate B remains
**OWNER_BLOCKED**.

### C8. Complete live LCA Gate B evidence

Do not build another runner. Use the existing cohort lifecycle:

1. prepare live run pinned to the settled Worker, source, Specs, world, Genesis,
   seal, and canonical head;
2. a human independently approves three normal `noema connect` enrollments;
3. retain three distinct approval and independent-control receipts;
4. explicitly acknowledge live mutation;
5. run three official-client processes;
6. verify distinct credentials, Controller/Player references, decision contexts,
   action histories, request IDs, idempotency namespaces, reconnects, and narrow
   participant evidence;
7. settle the Gate B evidence packet.

Without those external receipts the verdict remains `BLOCKED`, not `COMPLETE`.

Implementation support for steps 2-3 (human approval + independent-control receipts for exactly three enrollments, plus reconstruction controller fail-closed) now merged in main via Galadriel #624 / Noema #622 + Specs #290. Use for future live evidence collection.

## Periodic refresh

After every two meaningful slices, refresh repository heads, open/draft PRs,
recent merges, CI, `/version`, `/ready`, Worker/source pins, official-client pin,
Specs authority, partner contributions, and evidence packets. Remove queue items
completed by collaborators instead of racing them.

Track coordination drift explicitly:

```text
DUPLICATE_IMPLEMENTATION
ACTIVE_PR_COLLISION
PARTNER_WORK_NOT_ASSIMILATED
STALE_HANDOFF
EVIDENCE_RECREATION
PROVENANCE_LOSS
```

## Stop conditions

Stop only when every remaining meaningful item is one of:

- `OWNER_BLOCKED`: approval, protected secret, controlled recipient, or enrollment receipt required;
- `EXTERNAL_BLOCKED`: provider, GitHub, Cloudflare, Supabase, or browser dependency unavailable;
- `CANON_BLOCKED`: accepted Specs do not resolve required behavior;
- `SAFETY_BLOCKED`: the next action would mutate protected production state without authorization;
- `COMPLETE`: source, hosted identity, client, WATCH, Gate evidence, and repository pins are reconciled.

As of the 2026-09-07 PT refresh, C0 is MERGED and C3–C4 are COMPLETE (authorized
Deploy + pin `04ef6ecb`). The campaign remains `OWNER_BLOCKED` at C1
(protected preflight readiness not re-inspected), C6 (controlled email), and
C8 (three independent external Controllers / Gate B). C5 is
`VERIFICATION_PENDING` (public `/version`+`/ready` OBSERVED; full WATCH
acceptance suite not rerun on the new Worker). C7 remains
`PIN_ADVANCED / ACCEPTANCE_UNRUN`. Code paths for reconstruction fail-closed
and 3-enrollment receipts remain in via #624; live approvals/controllers remain
the Gate B blocker. Unblocked work is limited to review response, read-only
refresh, evidence preparation, C5 WATCH rerun, P2 candidate-suite evidence, and
plan updates that do not impersonate live acceptance or enroll/spend.
