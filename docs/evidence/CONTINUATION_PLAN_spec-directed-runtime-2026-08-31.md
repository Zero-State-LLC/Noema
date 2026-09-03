# NOEMA spec-directed runtime continuation plan

**Recorded:** 2026-09-01 (post #624)  
**Runtime baseline:** `684869e485bc433e543765610a0767177a18afbb` (origin/main, Gate B provenance)  
**Specs baseline:** `2e3438fd82aac384b6e8c7720596ebe0b45930ca`  
**Official client baseline:** `af19d165e8ba2ef4d9a327ac6c831213058ad433` (`0.1.20`)  
**Disposition:** continue from existing work; do not restart or recreate WATCH, cohort, auth, or client stabilization slices.

**Amendment 2026-09-03 (client pin):** Danny authorized advancing
`hosted_live.official_client` to `noema-client==0.1.20` (GitHub Latest
`v0.1.20`; `v0.1.21` was not tagged). C7 enrollment-bound checks remain
unrun. Gate B remains **OWNER_BLOCKED**. This does not enroll, publish,
or close LCA-2.

## Objective

Bring accepted Specs, runtime source, the deployed Worker, the official client,
WATCH, multi-agent play, and reproducible evidence back to one supportable
state. Select the first missing link, not the most visible feature.

## Current evidence boundary

| Surface | Current observation | Classification |
|---|---|---|
| Runtime source | `45e2070` contains the map-first WATCH integration and passed the complete Worker suite and typecheck | SOURCE_IMPLEMENTED |
| Hosted Worker | `34f4b0dc-85c6-4adb-8fd8-9ccffae73b99`, source `a68f5d8d6dcc441696e4ab883d120bc3cc53d398` | HOSTED_OLDER_SOURCE |
| Hosted world | `world.perihelion-reach-3`, `genesis.94d0961984b2b4f8`, ACTIVE, HEALTHY, playable | HOSTED_READ_ONLY_VERIFIED |
| WATCH `/watch` | Desktop browser load passed; HTTP dependencies returned 200 and stream upgraded with 101 | CURRENT_DEPLOYMENT_VERIFIED |
| WATCH `/watch/map` | Desktop and 390 px mobile browser loads passed; map, Health, River, navigation, and live state rendered | CURRENT_DEPLOYMENT_VERIFIED |
| Map-first source `45e2070` | Not deployed | HOSTED_NOT_COMPUTABLE |
| Official client | Source/release `0.1.20`; clean suite passed 165 tests; live discovery and `doctor` passed | VERIFY_EXISTING |
| Hosted client pin | `noema-client==0.1.20` | OWNER_AUTHORIZED (Danny 2026-09-03; C7 enrollment checks still unrun) |
| LCA cohort runner | Real local Worker plus three official-client processes verified; participant isolation protections present | RUNNER_VERIFIED_LOCAL |
|| Gate B | Code paths for fail-closed optional reconstruction controllers (positive real int or omitted) + human approval + independent-control receipts for exactly three enrollments (rejecting contention/recovery gaps) merged via #624 (Galadriel assignments Noema #622 + Noema-Specs #290); tests passed (Worker 1628, Python 541); live external controllers and human approvals absent | OWNER_BLOCKED (code advanced; local evidence only) |
| Email provider status | Hosted provider-management is ADMIN-gated | AUTHORIZED_PROBE_REQUIRED |
| Live email delivery/fallback | No controlled live delivery was executed in this campaign | NOT_COMPUTABLE |

Browser evidence for the current deployment does not prove the map-first source
changes. Local tests and read-only provider checks do not prove live Resend or
Postmark delivery or fallback behavior.

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

**Disposition:** VERIFY_EXISTING  
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

Repository policy requires the user to explicitly say **deploy**. The dispatch
also requires `I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN`. Passing readiness checks
does not authorize publication.

### C4. Publish and settle the generated pin PR

**Dependencies:** C0-C3.  
**Action:** dispatch the existing production deploy-and-pin workflow from main.
Do not use a competing deployment path.  
**Required evidence:**

- exact deployed source SHA;
- Wrangler Worker version ID;
- live `/version` convergence to that ID;
- live `/ready` ACTIVE/HEALTHY;
- generated `spec-compat.json` pin PR;
- independent review and green CI on the pin PR;
- merged pin before treating repository and deployment identity as reconciled.

Do not reseed, activate Genesis, recover, or mutate `world-01`.

### C5. Verify the newly deployed WATCH source

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

**Verification receipt (Galadriel, 2026-09-02 Gate B WATCH C0):** Completed read-only hosted verification. /watch and /watch/map HTTP 200; desktop Chrome + 390x844 mobile renders; /health /ready 200 ACTIVE/HEALTHY. /v1/watch/live + /v1/watch/map agree on world.perihelion-reach-3, cycle 10259, sequence 26489. Hosted Worker: 3f9b0e44-98c1-46f9-8232-bb44051a754f. Local commit: 706657a. Focused verification 22 passed; git diff --check clean. Screenshots: watch-20260903T000324Z.png + watch-map-390-.... Boundary preserved (OWNER_BLOCKED, no source SHA public, no fabricated enrollments). Updated: docs/evidence/WATCH-FIDELITY-GATE-B-2026-09-03.md + continuation plan + assets/.

### C6. Run controlled live email acceptance separately

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
to `noema-client==0.1.20` (latest existing GitHub release; `v0.1.21` was not
tagged). The rule above still holds as the 2026-09-01 instruction: do not
promote solely because a tag exists. This override does not complete the
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

At the time of this plan the campaign is `OWNER_BLOCKED` at C0/C1/C3, C6, and
C8 (code paths for reconstruction fail-closed and 3-enrollment receipts now in via #624; live approvals/controllers remain the blocker). Unblocked work is limited to review response, read-only refresh, evidence preparation, and plan updates that do not impersonate live acceptance.
