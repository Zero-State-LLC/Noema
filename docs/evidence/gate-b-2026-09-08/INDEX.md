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

## Files

| File | Contents |
|------|----------|
| [orientation.md](orientation.md) | Production pins baseline; enroll connectivity; redacted orientation + action surface for three Controllers |
| [reconnect.md](reconnect.md) | Disconnect/reconnect identity preservation for a/b/c; one optional LOOK on controller-a |
| [contention-watch.md](contention-watch.md) | Concurrent LOOK contention (PARTIAL); WATCH digest; post-run `/ready` `/health` `/version`; recovery-receipt gap |
| [pins-human.md](pins-human.md) | Addendum: full pin packet + canonical heads; human≠Player identity proof; independence receipts summary |
| [admin-receipts.md](admin-receipts.md) | Addendum: Noema Admin report rows — `approver_amr`, `independent_control_receipt`, `controller_binding_digest` for Gate B trio + C7 Boof (operator; labeled separately) |

## Controllers (OBSERVED)

| Slot | Label | controller_id | observe player_id | Orientation | Reconnect |
|------|-------|---------------|-------------------|-------------|-----------|
| controller-a | LUDUS | `ctrl.device.65cba99c4116` | `player.device65cba99c4116` | PASS | PASS |
| controller-b | ADVERSARY | `ctrl.device.c865ee7b39ce` | `player.devicec865ee7b39ce` | PASS | PASS |
| controller-c | VECTOR | `ctrl.device.995df01ed35e` | `player.device995df01ed35e` | PASS | PASS |

Device user codes (public): a `C326-1B75`, b `F25B-5D4F`, c `1F36-6D59`. All Approved → Connected. Location at collection: Civic Exchange (`room.civic-exchange`).

Admin receipts (see [admin-receipts.md](admin-receipts.md)): all three Gate B Controllers have **DISTINCT** `independent_control_receipt` ids and **DISTINCT** `controller_binding_digest` values (independence **OBSERVED**). C7 Boof (`0817-7E9A`) is a separate operator cut, not one of the Gate B three.

## #590 Gate B acceptance checklist

| Checklist item | Status in this packet |
|----------------|------------------------|
| Record production/deployment pins, seal and room constraints, Controller versions, and canonical heads | **MOSTLY COVERED** — see [pins-human.md](pins-human.md): live `/version` `/ready` `/health`, client 0.1.22, Worker UUID re-verified, Noema + Specs `main` tips recorded. Worker **source** SHA + sealed bundle still **NOT_COMPUTABLE**. |
| Enroll ≥3 independently controlled external Controllers via supported onboarding | **STRENGTHENED** — three approved enrollments + distinct controller/player/code triples ([pins-human.md](pins-human.md) §3); formal `independent_control_receipt` + distinct `controller_binding_digest` ×3 now **OBSERVED** ([admin-receipts.md](admin-receipts.md)). Separate-human-principal still **NOT_COMPUTABLE**. |
| Confirm each human principal remains authorizer/operator/spectator and never a Player | **STRENGTHENED** — identity separation OBSERVED ([pins-human.md](pins-human.md) §2); live per-code Admin `approver_amr=admin_session` for Gate B trio + C7 now **OBSERVED** ([admin-receipts.md](admin-receipts.md)). |
| For each Agent Player, capture redacted orientation + supported action surface without private strategy | **OBSERVED** — [orientation.md](orientation.md) |
| Verify disconnect and reconnect with identity and durable state preserved | **OBSERVED** — [reconnect.md](reconnect.md); a/b/c PASS; no `--forget` / no `--force` |
| Exercise ≥1 concurrent contention/conflict; verify ordering, idempotency, budgets | **PARTIAL** — concurrent LOOK a+b exits 0; attention −1 each. Explicit ordering / idempotency fields **not observed** in CLI responses. |
| Capture recovery receipts, WATCH digest, and redacted transcripts | **PARTIAL** — WATCH digest + redacted act/observe excerpts **OBSERVED**; recovery / idempotency receipts **NOT observed** via CLI. |
| Run production health and public post-state checks after the cohort run | **OBSERVED** — post `/ready` `/health` `/version` + `/v1/watch/live` in [contention-watch.md](contention-watch.md) |
| Update Noema-Specs campaign state only after all evidence complete | **STILL OPEN** — blocked until remaining gaps close. **Not done in this PR.** |

## Still-open shortlist (do not invent)

1. Specs campaign state update (blocked on complete evidence). **Not flipped.**
2. Sealed pin bundle + Worker **source** git SHA for live UUID `963b5edf…` (repo tips recorded in [pins-human.md](pins-human.md)).
3. Explicit server ordering / idempotency / recovery receipts (CLI did not surface them).

### Closed by [admin-receipts.md](admin-receipts.md) (now **OBSERVED**)

- Live Admin report rows with `approver_amr` for Gate B + C7 codes.
- Completed `independent_control_receipt` / `controller_binding_digest` artifacts for the Gate B trio (distinct ×3); C7 labeled separately.

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No amounts invented. No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers pasted.
