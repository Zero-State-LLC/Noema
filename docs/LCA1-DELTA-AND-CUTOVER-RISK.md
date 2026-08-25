# LCA-1 — Production-alpha delta report and successor-cutover risk register

**Packet:** issue #550 · Campaign: [LIVING-CIVILIZATION-ALPHA](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-CIVILIZATION-ALPHA.md) · Milestone LCA-1, Acceptance Gate A
**Owner:** Prabu. Independent of the integration-scenario packet (#549); this document does not touch scenario tests.
**Claim labels:** OBSERVED (read from a live surface or repository), INFERRED (derived, derivation shown), SPECULATIVE (marked), NOT_COMPUTABLE (no probe exists; who holds the answer is named).

## Evidence pins

| Fact | Value | Label |
|---|---|---|
| Live Worker | `d9aab067-e3ca-447c-bb8b-fccc59729bbf`, `deployed_at 2026-08-24T23:21:53Z` | OBSERVED, `GET /version` |
| Live world | `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`, ACTIVE HEALTHY, cycle 1327, players 0 | OBSERVED, `GET /ready` |
| Live build source | `e1d44d5` (#548 merge) or `f566044` (its sole commit — identical Worker content) | INFERRED: publish trails the #548 merge (23:21:26Z) by 27 seconds, and #548 is the only Worker-content change on `main` since the previously pinned build |
| Previously pinned build source | `06b818f` (#524) | OBSERVED, `spec-compat.json` note, derivation recorded in #522/#525 |
| Repo pin | `d9aab067`, matching live | OBSERVED. Was `2bb3a8b4` (two publishes stale) when this report was first written |
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
| `hosted_live.worker_version_id` pin | **configuration-only — now current** | Was three lags deep and a live cross-repo contradiction: Specs direction recorded `d9aab067` while this repo pinned `2bb3a8b4`. Moved by hand with the derivation shown, and `specs_git` re-derived to `81ca8c1` with it. The cure — the publish writing the pin — is #556 |
| Monitors and CI: `pin-currency.yml`, Specs-sibling checkout (#537), Specs `direction-freshness` | **deployed** (repo automation) | OBSERVED in workflow runs |
| Official client (`hosted_live.official_client`; the literal lives there and in PARTNER-OPERATOR only, by guard) | **deployed** (PyPI) | OBSERVED on PyPI; verified against production incl. seal identity (Specs #283) |
| `CRIME_DETECTED` producer | **intentionally excluded** | Five consumers, no producer; RFC-0002 detection preconditions unimplemented. Wiring it is an RFC-gated decision (audit: PARTIAL; `closed-catalog.test.ts` pins the absence) |
| Hosted STUDY / research spine (Frontier, Observatory, Lab, Compiler, LEARN) | **blocked** | Campaign doctrine 6: blocked until natural multi-agent play produces evidence worth testing. Offline implementations complete (Specs #267) |
| Operator device enrollment | **blocked — on a publish first, then a people step** | `players 0` OBSERVED; `doctor` reports `credential: missing` as designed. **The correction:** the repairs that make enrollment approvable (#563 cross-tab, #561 owner-email review, #570 foregrounded short code) are merged and **not live** — OBSERVED by the 404/401 probe above. Attempting enrollment today exercises the un-repaired path, i.e. the very defects #558 and #560 describe. The people step is real but second |
| Enrollment / CONNECT repairs (#563, #561, #570): `connect.ts`, `device-enrollment.ts` +178, `play-auth.ts`, `play-login-html.ts`, `play-mail.ts`, `index.ts` | **implemented, not deployed** | Merged after the 23:21Z publish. **OBSERVED not inferred:** `GET /v1/auth/device/review` — a route #561 adds — returns **404** on live, while the deployed-route control `GET /v1/auth/device/preview` returns **401** without a token. A deployed handler rejects; a missing route falls through. See the enrollment row below |
| Rollback rehearsal harness (#562): `rollback-evidence.ts`, `world-do.ts` | **implemented, not deployed** | Merged 2026-08-25T03:36Z, after the publish. OBSERVED via `git log e1d44d5..HEAD -- workers/noema/src` |
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
| 7 | **Deployment / rollback** | Manual publish + hand pin: a bare `wrangler deploy` regresses `NOEMA_ENV` (documented footgun); pin lags every publish (three lags in two days, live right now) | `NOEMA_ENV` warning in GENESIS-RUNBOOK / PRODUCTION-GENESIS-GATE; two independent scheduled monitors; isolated A-B-A rehearsal (#562, closes #555) with [ISOLATED-ROLLBACK-REHEARSAL.md](ISOLATED-ROLLBACK-REHEARSAL.md) | Pin-on-publish (#556) still open and deploys production — human-only. Isolated rehearsal does not replace that pin write |
| 8 | **Public claims** | Cutover claims outrun evidence | Claim-label vocabulary enforced by Specs validators; `current-state.v1.yaml` + freshness checks (#289); manifesto honesty passes; whitepaper restored (#548) | Keep promotion edits to `current-state.v1.yaml` evidence-first, per DIRECTION-AUTHORITY |

## Blockers to LCA-2, and the validation each needs

Closed on `main` (do not recreate):

- **Cross-version DO load fixture** (risk row 2) — #565 merged; issue #553 closed. Sanitized older-format nested Deep Time blob through `migrateWorldRuntime` / incident recover. Not a live production dump.
- **Isolated rollback rehearsal** (risk row 7) — #562 merged; issue #555 closed. Isolated workers.dev A-B-A; production GET-only.

Still open:

1. **Operator device enrollment** — **publish first, then the people step.** #563, #561 and #570 are merged and unpublished; `GET /v1/auth/device/review` 404s on live today. Validation: publish, re-probe that route for a non-404, then one real `noema connect` approval and `doctor` showing a credential. Enrolling before the publish tests the path the repairs replaced.
2. **Integration scenario (#549, Jcode)** — #552 merged as Gate A **candidate** evidence. Gate A is not complete.
3. **Pin automation** (delta table) — #556 folds the pin write into publish; it deploys production, so merge is human-only. The pin itself is current as of the `d9aab067` move; until #556 lands, every publish still needs a hand-written pin.
4. **Hosted connect cross-tab repair** — #563 onto main; partner-flagged as auth-adjacent. Do not merge without a human call.

Do not treat this list as Gate A completion. LCA-2 remains BLOCKED until the open items have acceptance evidence.
