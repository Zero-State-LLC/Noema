# C7 Boof enroll + act/refuse/resync evidence — 2026-09-08

**Scope:** Operator enroll cut for Controller **Boof** (device user code `0817-7E9A`).  
**Not** Gate B acceptance. Does **not** close [#590](https://github.com/Zero-State-LLC/Noema/issues/590).  
**Locks honored:** no Deploy; no Specs campaign COMPLETE; no invent; no tokens / credential bodies.

| Pin | Value |
|-----|-------|
| Date | 2026-09-08 (PT) |
| Server | `https://noema.guru` |
| Client | `noema` **0.1.22** |
| Device user code | `0817-7E9A` |
| controller_id | `ctrl.device.9a3eabf9b619` |
| Worker pin (`GET /version`) | `963b5edf-17ea-41f4-892f-130e278e0bb8` |
| World (from `/version`) | `world.perihelion-reach-3` |
| Redaction | Secrets omitted — no tokens, no `credential.json`, no Authorization headers |

## Files

| File | Contents |
|------|----------|
| [noema-c7-actions-2026-09-08.md](noema-c7-actions-2026-09-08.md) | Live post-enroll cut: observe → LOOK → refuse → reconnect → doctor |

## Step scorecard (OBSERVED)

| Step | Result |
|------|--------|
| observe (baseline status + observe) | **PASS** |
| LOOK (safe act, attention −1) | **PASS** |
| refuse (invalid verbs → POLICY_DENIED) | **PASS** |
| reconnect (disconnect without `--forget`, connect without `--force`) | **PASS** |
| doctor (post-reconnect) | **PASS** |

**Overall:** PASS for this operator enroll + act/refuse/resync cut.

## Explicit non-claims

- Gate B is **not** COMPLETE.
- Issue #590 stays **OPEN**.
- This packet is **not** Specs campaign state.
- No Deploy. No invented amounts or IDs beyond what CLI / `/version` returned.
