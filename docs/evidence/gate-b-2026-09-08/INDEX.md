# Gate B cohort evidence — 2026-09-08

**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Candidate:** `lca2-gate-b-three-external-agent-population`  
**Collected:** 2026-09-07 evening PT / 2026-09-08 UTC  
**Client:** `noema` **0.1.22** against `https://noema.guru`  
**Worker pin (OBSERVED):** `963b5edf-17ea-41f4-892f-130e278e0bb8`  
**World:** `world.perihelion-reach-3` / Perihelion Reach  

**This packet is evidence only. It does not claim Gate B COMPLETE.**  
Do not close #590. Do not flip Noema-Specs campaign state. No Deploy. No secrets.

**Addenda:**
- [pins-human.md](pins-human.md) collected 2026-09-08T07:13:19Z UTC (00:13:19 PT).
- [admin-receipts.md](admin-receipts.md) collected 2026-09-08T07:31:59Z UTC (00:31:59 PT) — closes Admin report rows / `independent_control_receipt` / binding digests gap as **OBSERVED**.
- [worker-source-sha.md](worker-source-sha.md) collected 2026-09-08T07:31:22Z UTC (00:31:22 PT) — live UUID → Worker **source** git SHA **OBSERVED** (`308c98de…` via PR #649 / `hosted_live`).
- [ordering-probe.md](ordering-probe.md) collected 2026-09-08 ~07:45–07:50Z UTC (00:45–00:50 PT) — act/observe **raw** fields for sequence/cycle/budgets/`settled`/`request_id`/`events`/`provenance` **OBSERVED** via library; CLI `act` still hides them; recovery receipt object **NOT_COMPUTABLE**; HTTP headers bare.
- [concurrent-digests.md](concurrent-digests.md) collected 2026-09-08T08:29:10–08:29:18Z UTC (01:29:10–01:29:18 PT) — **PASS** supersedes prior BLOCKED (#657): reconnect codes C5EE/B135/2D79 Approved; concurrent library LOOK a+b+c with wall-clock overlap; digests `contention_evidence_digest` / `ordering_evidence_digest` / `budget_settlement_evidence_digest` computed. New `controller_id`s after remint (expected).

## Files

| File | Contents |
|------|----------|
| [orientation.md](orientation.md) | Production pins baseline; enroll connectivity; redacted orientation + action surface for three Controllers |
| [reconnect.md](reconnect.md) | Disconnect/reconnect identity preservation for a/b/c; one optional LOOK on controller-a |
| [contention-watch.md](contention-watch.md) | Concurrent LOOK contention (PARTIAL); WATCH digest; post-run `/ready` `/health` `/version`; recovery-receipt gap |
| [pins-human.md](pins-human.md) | Addendum: full pin packet + canonical heads; human≠Player identity proof; independence receipts summary |
| [admin-receipts.md](admin-receipts.md) | Addendum: Noema Admin report rows — `approver_amr`, `independent_control_receipt`, `controller_binding_digest` for Gate B trio + C7 Boof (operator; labeled separately) |
| [worker-source-sha.md](worker-source-sha.md) | Addendum: OBSERVED Worker source git SHA `308c98de4173874d8a1941818ba4392ddcc2cba6` for live UUID `963b5edf…` via PR #649 + `spec-compat.json` `hosted_live` pin fields |
| [ordering-probe.md](ordering-probe.md) | Addendum: concurrent LOOK+INSPECT raw CommandResult; OBSERVED sequence/budgets/settled/request_id/events/provenance; idempotency_key client-sent not echoed; recovery receipt NOT_COMPUTABLE; HTTP headers bare |
| [concurrent-digests.md](concurrent-digests.md) | Addendum: **PASS** concurrent LOOK a+b+c; three cohort sha256 digests; method documented; supersedes BLOCKED (#657); new post-reconnect controller_ids noted |

## Controllers (OBSERVED)

| Slot | Label | controller_id | observe player_id | Orientation | Reconnect |
|------|-------|---------------|-------------------|-------------|-----------|
| controller-a | LUDUS | `ctrl.device.65cba99c4116` | `player.device65cba99c4116` | PASS | PASS |
| controller-b | ADVERSARY | `ctrl.device.c865ee7b39ce` | `player.devicec865ee7b39ce` | PASS | PASS |
| controller-c | VECTOR | `ctrl.device.995df01ed35e` | `player.device995df01ed35e` | PASS | PASS |

Device user codes (public, original enroll): a `C326-1B75`, b `F25B-5D4F`, c `1F36-6D59`. All Approved → Connected. Location at collection: Civic Exchange (`room.civic-exchange`).

**Post-reconnect remint (2026-09-08 ~01:19 PT, codes C5EE/B135/2D79):** new live controller_ids differ from the table above — a `ctrl.device.32bdc772bf02`, b `ctrl.device.a75b4a98d334`, c `ctrl.device.d6fb4938b52a` (expected after reconnect; see [concurrent-digests.md](concurrent-digests.md)).

Admin receipts (see [admin-receipts.md](admin-receipts.md)): all three Gate B Controllers have **DISTINCT** `independent_control_receipt` ids and **DISTINCT** `controller_binding_digest` values (independence **OBSERVED**). C7 Boof (`0817-7E9A`) is a separate operator cut, not one of the Gate B three.

## #590 Gate B acceptance checklist

| Checklist item | Status in this packet |
|----------------|------------------------|
| Record production/deployment pins, seal and room constraints, Controller versions, and canonical heads | **MOSTLY COVERED** — see [pins-human.md](pins-human.md) + [worker-source-sha.md](worker-source-sha.md): live `/version` `/ready` `/health`, client 0.1.22, Worker UUID re-verified, Noema + Specs `main` tips recorded; Worker **source** SHA `308c98de4173874d8a1941818ba4392ddcc2cba6` **OBSERVED** via #649/`hosted_live` (seal/specs_git/genesis/room included). Standalone sealed-bundle artifact file beyond `hosted_live` still **NOT_COMPUTABLE** if required separately. |
| Enroll ≥3 independently controlled external Controllers via supported onboarding | **STRENGTHENED** — three approved enrollments + distinct controller/player/code triples ([pins-human.md](pins-human.md) §3); formal `independent_control_receipt` + distinct `controller_binding_digest` ×3 now **OBSERVED** ([admin-receipts.md](admin-receipts.md)). Separate-human-principal still **NOT_COMPUTABLE**. |
| Confirm each human principal remains authorizer/operator/spectator and never a Player | **STRENGTHENED** — identity separation OBSERVED ([pins-human.md](pins-human.md) §2); live per-code Admin `approver_amr=admin_session` for Gate B trio + C7 now **OBSERVED** ([admin-receipts.md](admin-receipts.md)). |
| For each Agent Player, capture redacted orientation + supported action surface without private strategy | **OBSERVED** — [orientation.md](orientation.md) |
| Verify disconnect and reconnect with identity and durable state preserved | **OBSERVED** — [reconnect.md](reconnect.md); a/b/c PASS; no `--forget` / no `--force` |
| Exercise ≥1 concurrent contention/conflict; verify ordering, idempotency, budgets | **STRENGTHENED → PASS (digests)** — prior a+b LOOK + C7 LOOK+INSPECT library fields **OBSERVED** ([ordering-probe.md](ordering-probe.md)). Multi-controller concurrent library LOOK a+b+c **PASS** with wall-clock overlap; `contention_evidence_digest` / `ordering_evidence_digest` / `budget_settlement_evidence_digest` **PASS** ([concurrent-digests.md](concurrent-digests.md)). |
| Capture recovery receipts, WATCH digest, and redacted transcripts | **PARTIAL** — WATCH + redacted transcripts covered earlier; act **settlement/`request_id`/events** now **OBSERVED** ([ordering-probe.md](ordering-probe.md)). Dedicated **recovery receipt** object still **NOT_COMPUTABLE** on act/observe/HTTP headers. |
| Run production health and public post-state checks after the cohort run | **OBSERVED** — post `/ready` `/health` `/version` + `/v1/watch/live` in [contention-watch.md](contention-watch.md) |
| Update Noema-Specs campaign state only after all evidence complete | **STILL OPEN** — blocked until remaining gaps close. **Not done in this PR.** |

## Still-open shortlist (do not invent)

1. Specs campaign state update (blocked on complete evidence). **Not flipped.**
2. Worker **source** git SHA for live UUID `963b5edf…` — **OBSERVED** as `308c98de4173874d8a1941818ba4392ddcc2cba6` ([worker-source-sha.md](worker-source-sha.md) / PR #649 / `hosted_live`). Standalone sealed-bundle artifact file beyond `hosted_live` fields still **NOT_COMPUTABLE** if required as a distinct object.
3. Dedicated **recovery receipt** object / Gate-A-style incident-recover pack still **NOT_COMPUTABLE** on act/observe. Ordering/budget/`request_id`/`settled` **OBSERVED** via library ([ordering-probe.md](ordering-probe.md)); `idempotency_key` echo still absent. Multi-controller cohort digests now **PASS** ([concurrent-digests.md](concurrent-digests.md)):
   - `contention_evidence_digest` = `be78b73854315fef9193e700f18ea0c4da3753bce506828137b40cccf77271cc`
   - `ordering_evidence_digest` = `a1721bea4560aaf59c723d23caede64507329e80e2efee891e3560b5788db5cb`
   - `budget_settlement_evidence_digest` = `6c9577ddde721a799b5a45e06ddfc1617abf514d3f3f163512d02dd1f0075621`
4. Post-reconnect `controller_id` remint (new ids vs prior enroll) — expected; prior Admin `independent_control_receipt` / binding digests were for old device ids and may need re-binding if continuity beyond remint is required.
5. `acceptance_authority_digest` not computed in the concurrent-digests pass.
6. Separate-human-principal independence still **NOT_COMPUTABLE**.

### Closed by [admin-receipts.md](admin-receipts.md) (now **OBSERVED**)

- Live Admin report rows with `approver_amr` for Gate B + C7 codes.
- Completed `independent_control_receipt` / `controller_binding_digest` artifacts for the Gate B trio (distinct ×3); C7 labeled separately.

### Closed by [concurrent-digests.md](concurrent-digests.md) (now **PASS**)

- Reconnect a/b/c after Admin Approve of C5EE/B135/2D79.
- Concurrent multi-controller library LOOK (≥2; actually a+b+c) with `CommandResult.raw`.
- Opaque SHA-256 `contention_evidence_digest` / `ordering_evidence_digest` / `budget_settlement_evidence_digest`.

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No amounts invented. No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers pasted.
