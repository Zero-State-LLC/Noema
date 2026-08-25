# LCA-1 — Production-alpha delta report and successor-cutover risk register

**Packet:** issue #550 · Campaign: [LIVING-CIVILIZATION-ALPHA](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-CIVILIZATION-ALPHA.md) · Milestone LCA-1, Acceptance Gate A
**Owner:** Prabu. Independent of the integration-scenario packet (#549); this document does not touch scenario tests.
**Claim labels:** OBSERVED (read from a live surface or repository), INFERRED (derived, derivation shown), SPECULATIVE (marked), NOT_COMPUTABLE (no probe exists; who holds the answer is named).

## Evidence pins

| Fact | Value | Label |
|---|---|---|
| Live Worker | `3e5fc51f-d009-4812-9978-a6022060c3d3`, `deployed_at 2026-08-25T18:47:35.085038Z` | OBSERVED, `GET /version` |
| Live world | `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`, ACTIVE HEALTHY, cycle 2183, sequence 7824, players 0 | OBSERVED, `GET /ready` during Gate A execution |
| Live build source | `6db67822c14baf6838a7d5be46a6eb6c40b52598` | OBSERVED from the merged PR #585 deployment execution and live version timestamp; route-drift reported no candidate routes absent from the live build |
| Previously pinned build source | `06b818f` (#524) | OBSERVED, `spec-compat.json` note, derivation recorded in #522/#525 |
| Repo pin | `3e5fc51f-d009-4812-9978-a6022060c3d3`, matching live in this Gate A packet | OBSERVED from `GET /version`; generated pin validation passed |
| Specs baseline | `Noema-Specs` `d73bdec` (#289 direction package) | OBSERVED |

## Production-alpha delta report

Classification vocabulary is the issue's: **implemented** (in `main`, in tests) · **deployed** (in the running Worker) · **configuration-only** · **migration-required** · **blocked** · **intentionally excluded**.

| Delta | Class | Evidence and label |
|---|---|---|
| Game-contract runtime (GC1–GC10 minus crime producer, diplomacy, access policy, WATCH, RFC-0126 fail-closed, RFC-0127 catalog) | **deployed** | In `06b818f`'s ancestry, which the live build supersedes by one docs+site commit. OBSERVED in source, INFERRED live via the source derivation above; per-slice liveness is `RFC-RUNTIME-AUDIT-2026-08-23.md` |
| Whitepaper restore + manifesto link (#548) | **deployed** | The only `workers/noema/src` + `public` change between the two builds: `manifesto.ts` (+7/−1) and one `.docx` asset. OBSERVED diff, INFERRED live |
| Conformance/guard test layer (#527, #534–#539, #542/#547, #545, #546): closed-catalog, slice-catalog copy, forbidden-projection, client-pin guard, Deep Time tails, WS resume boundary, accepted-replay invariant | **implemented** | Test-only; no deploy semantics. OBSERVED |
| Harness spec-conformance fixes (#543 field forwarding, #544 `SETTLEMENT_RESYNC` one-retry) | **implemented** | Python controller-side; runs beside agents, never deployed to the Worker. OBSERVED |
| `spec-compat.json` metadata: per-runtime event-catalog pins (#533), `specs.commit` currency (#526/#540/#541), client pin | **configuration-only** | OBSERVED |
| `hosted_live.worker_version_id` pin | **configuration-only — current in this packet** | Production deploy source `6db6782` produced Worker `3e5fc51f`; live `/version` and `/ready` evidence generated and validated the exact pin. `specs_git` remains `81ca8c1` because the deploy did not change Specs alignment |
| Monitors and CI: `pin-currency.yml`, Specs-sibling checkout (#537), Specs `direction-freshness` | **deployed** (repo automation) | OBSERVED in workflow runs |
| Official client (`hosted_live.official_client`; the literal lives there and in PARTNER-OPERATOR only, by guard) | **deployed** (PyPI) | OBSERVED on PyPI; verified against production incl. seal identity (Specs #283) |
| `CRIME_DETECTED` producer | **intentionally excluded** | Five consumers, no producer; RFC-0002 detection preconditions unimplemented. Wiring it is an RFC-gated decision (audit: PARTIAL; `closed-catalog.test.ts` pins the absence) |
| Hosted STUDY / research spine (Frontier, Observatory, Lab, Compiler, LEARN) | **blocked** | Campaign doctrine 6: blocked until natural multi-agent play produces evidence worth testing. Offline implementations complete (Specs #267) |
| Operator device enrollment | **deployed; human acceptance still required** | The repairs that make enrollment approvable (#563 cross-tab, #561 owner-email review, #570 foregrounded short code) are in deployed source `6db6782`. Route drift reported no candidate routes absent from the live build. One canonical `noema connect` approval remains a people step; no mailbox or device secret belongs in repository evidence |
| Enrollment / CONNECT repairs (#563, #561, #570, #583–#585): `connect.ts`, `device-enrollment.ts`, `play-auth.ts`, `play-login-html.ts`, `play-mail.ts`, `index.ts` | **deployed** | OBSERVED in source `6db6782` and the deployment executed immediately after #585 merged. The earlier 404 and cross-tab leakage evidence is historical pre-repair evidence, not current status |
| Rollback rehearsal support (#562): `rollback-evidence.ts`, `world-do.ts` | **deployed** | #562 is in source `6db6782`; isolated A-B-A evidence remains the acceptance packet. Production was not used as the rehearsal target |
| Migration-required items | **none found** | No schema/DO state change between the two builds requires a migration step. OBSERVED (the inter-build diff is one route + one asset). Cross-*version* DO compatibility is a risk-register row, not a delta — now covered by #565's older-blob load test |

## Successor-cutover risk register

The successor decision this register serves: promoting the integrated advanced runtime to accepted production service (Gates D–F) while preserving the frozen first world. Rows ordered by how much of the answer already exists.

| # | Area | Risk | Standing mitigations (OBSERVED) | Residual / needed |
|---|---|---|---|---|
| 1 | **World/Genesis preservation** | Cutover tooling touches `genesis.ef578f4ffceeccd0` / `world-01`, or force-activates reach-2 | Reseed/force bans in tracker law; `hosted-alpha-freeze.test.ts` pins thawed-status copy, seal, agents-only; admin frozen-world allowlist test; `/ready` never exposes the frozen world; [SUCCESSOR-CUTOVER-RUNBOOK.md](SUCCESSOR-CUTOVER-RUNBOOK.md) names the frozen DO out of scope | Future Gate F packet still required before any successor deploy. This runbook does not authorize one |
| 2 | **Durable Object state compatibility** | New code loads an older world blob and silently drops a persisted field — the failure class that once wiped scars, and would have un-inherited every GC9-S2 tradition | `migrateWorldRuntime` (`world-actions.ts:4126`), `ensureDeepTime`, `ensureCulture` rebuild paths; `older-world-compat.test.ts` loads a sanitized older-format nested-Deep-Time blob (#565, closes #553) | A live production-shape dump of `world.perihelion-reach-3` at cutover time remains operator work. The merged fixture is synthetic older-format, not a live blob |
| 3 | **Settlement / recovery** | Head resync or settle failure during the cutover window loses or doubles actions | `SETTLEMENT_RESYNC` one-same-key-retry on server contract and both clients (#544, client 0.1.x); accepted-replay invariant pinned (#546); failures-not-cached interlock recorded (Specs sweep doc); unsettled-queue + incident-recover paths tested | Idempotency dedupe window is newest-200 keys — ample for the one-retry contract, but a documented bound, not unlimited |
| 4 | **Identity / credentials** | Resume or enrollment path admits a stale or non-agent principal across cutover | RFC-0120 enforced incl. WS resume path; resume tokens expire; restored seals re-validated against the *current* catalog on every command (#545, mutation-verified) | End-to-end device enrollment has never run in production (zero operators). NOT_COMPUTABLE until a human enrolls; the answer is held by whoever runs it first |
| 5 | **Client / harness compatibility** | The successor build breaks the pinned client or the in-repo harness | The pinned client verified against production incl. seal byte-identity (Specs #283); harness now conformant to AGENT-HARNESS §ASP/§8; client-pin single-source guard (#535) | The lineage direction (client fixes not flowing upstream) is named in the sweep doc; re-check on any client release |
| 6 | **WATCH truthfulness at cutover** | Projection legibility under a real population is unproven; a leak or filler regression during high-activity cutover would be public | RFC-0126 fail-closed default; hidden-room sweep across all 27 public event types (#521); forbidden-projection token guards (#539); §5 entity-scope fix live (#520) | Gate D material by design — cannot be closed before external agents exist. SPECULATIVE until LCA-2 |
| 7 | **Deployment / rollback** | A bare `wrangler deploy` can regress `NOEMA_ENV`; every production publish must bind its pin to the exact deployed version | `NOEMA_ENV` warnings; scheduled monitors; isolated A-B-A rehearsal (#562); fail-closed dispatch + explicit deploy ACK (#567); generated post-deploy pin PR #574 | Keep production deploy human-dispatched and require the generated pin PR. Isolated rehearsal does not replace post-deploy evidence |
| 8 | **Public claims** | Cutover claims outrun evidence | Claim-label vocabulary enforced by Specs validators; `current-state.v1.yaml` + freshness checks (#289); manifesto honesty passes; whitepaper restored (#548) | Keep promotion edits to `current-state.v1.yaml` evidence-first, per DIRECTION-AUTHORITY |

## Blockers to LCA-2, and the validation each needs

Closed on `main` (do not recreate):

- **Gate A integrated runtime execution** — [LCA-GATE-A-EXECUTION-2026-08-25.md](LCA-GATE-A-EXECUTION-2026-08-25.md) records a complete-suite + typecheck pass, targeted settlement/recovery/replay acceptance, and live `/version`, `/ready`, and WATCH evidence on candidate `6db6782`.
- **Production-shape compatibility evidence** — #577 exposes sanitized aggregate migration evidence from the stored live shape through the authenticated admin boundary; no player identity or message content is returned.
- **Cross-version DO load fixture** (risk row 2) — #565 merged; issue #553 closed. Sanitized older-format nested Deep Time blob through `migrateWorldRuntime` / incident recover. Not a live production dump.
- **Isolated rollback rehearsal** (risk row 7) — #562 merged; issue #555 closed. Isolated workers.dev A-B-A; production GET-only.

Still open after Gate A runtime execution:

1. **Evidence/pin review and Specs promotion** — merge the Gate A execution packet through normal review, then update Specs campaign state from reviewed evidence. Runtime does not self-promote Specs authority.
2. **Operator device enrollment for LCA-2** — the repaired flow is deployed; the remaining validation is one real `noema connect` approval and `doctor` showing a credential. This step requires a designated human mailbox and must not record email, device code, or token material.
3. **External population for Gate B** — enroll at least three independently controlled external Agent Players after the human approval step.

**Gate A is not complete.** All five runtime checks passed on candidate `6db6782`; review, pin merge, and Specs campaign promotion remain required. LCA-2 remains blocked until that promotion and the human enrollment prerequisite complete.
