# Gate B cohort evidence — 2026-09-08

**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)  
**Candidate:** `lca2-gate-b-three-external-agent-population`  
**Collected:** 2026-09-07 evening PT / 2026-09-08 UTC  
**Client:** `noema` **0.1.22** against `https://noema.guru`  
**Worker pin (OBSERVED):** `963b5edf-17ea-41f4-892f-130e278e0bb8`  
**World:** `world.perihelion-reach-3` / Perihelion Reach  

**This packet is evidence only. It does not claim Gate B COMPLETE.**  
Do not close #590. Do not flip Noema-Specs campaign state. No Deploy. No secrets.

## Files

| File | Contents |
|------|----------|
| [orientation.md](orientation.md) | Production pins baseline; enroll connectivity; redacted orientation + action surface for three Controllers |
| [reconnect.md](reconnect.md) | Disconnect/reconnect identity preservation for a/b/c; one optional LOOK on controller-a |
| [contention-watch.md](contention-watch.md) | Concurrent LOOK contention (PARTIAL); WATCH digest; post-run `/ready` `/health` `/version`; recovery-receipt gap |

## Controllers (OBSERVED)

| Slot | Label | controller_id | observe player_id | Orientation | Reconnect |
|------|-------|---------------|-------------------|-------------|-----------|
| controller-a | LUDUS | `ctrl.device.65cba99c4116` | `player.device65cba99c4116` | PASS | PASS |
| controller-b | ADVERSARY | `ctrl.device.c865ee7b39ce` | `player.devicec865ee7b39ce` | PASS | PASS |
| controller-c | VECTOR | `ctrl.device.995df01ed35e` | `player.device995df01ed35e` | PASS | PASS |

Device user codes (public): a `C326-1B75`, b `F25B-5D4F`, c `1F36-6D59`. All Approved → Connected. Location at collection: Civic Exchange (`room.civic-exchange`).

## #590 Gate B acceptance checklist

| Checklist item | Status in this packet |
|----------------|------------------------|
| Record production/deployment pins, seal and room constraints, Controller versions, and canonical heads | **PARTIAL (OBSERVED)** — worker `/version` pin, `/ready`, `/health`, client 0.1.22, doctor `seal: required`, room `civic-exchange`. **Full pin packet with canonical Specs/Worker git heads still missing.** |
| Enroll ≥3 independently controlled external Controllers via supported onboarding | **MOSTLY COVERED** — three approved device-code enrollments → `connected: true`. **Independence / separate-human-principal receipts still thin.** |
| Confirm each human principal remains authorizer/operator/spectator and never a Player | **STILL OPEN** — formal human≠Player principal proof not captured. |
| For each Agent Player, capture redacted orientation + supported action surface without private strategy | **OBSERVED** — [orientation.md](orientation.md) |
| Verify disconnect and reconnect with identity and durable state preserved | **OBSERVED** — [reconnect.md](reconnect.md); a/b/c PASS; no `--forget` / no `--force` |
| Exercise ≥1 concurrent contention/conflict; verify ordering, idempotency, budgets | **PARTIAL** — concurrent LOOK a+b exits 0; attention −1 each. Explicit ordering / idempotency fields **not observed** in CLI responses. |
| Capture recovery receipts, WATCH digest, and redacted transcripts | **PARTIAL** — WATCH digest + redacted act/observe excerpts **OBSERVED**; recovery / idempotency receipts **NOT observed** via CLI. |
| Run production health and public post-state checks after the cohort run | **OBSERVED** — post `/ready` `/health` `/version` + `/v1/watch/live` in [contention-watch.md](contention-watch.md) |
| Update Noema-Specs campaign state only after all evidence complete | **STILL OPEN** — blocked until remaining gaps close. **Not done in this PR.** |

## Still-open shortlist (do not invent)

1. Specs campaign state update (blocked on complete evidence).
2. Full pin packet with canonical Specs / Worker git heads + sealed bundle.
3. Formal human ≠ Player principal proof.
4. Stronger independence receipts for the three Controllers.
5. Explicit server ordering / idempotency / recovery receipts (CLI did not surface them).

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- No amounts invented. No Deploy. No Specs campaign flip. No tokens / `credential.json` / Authorization headers pasted.
