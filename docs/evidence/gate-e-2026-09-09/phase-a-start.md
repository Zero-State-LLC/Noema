# Gate E Phase A start receipt — OBSERVED (RUNNING only)

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Phase:** A (4h candidate)
**Status:** **RUNNING** (start receipt only)
**Collected:** 2026-09-09T07:38:30Z (00:38:30 PT)

**This file is a start receipt. It does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. Do not flip Noema-Specs campaign state. No Deploy. No Path 8 recover. No secrets.

Companion: [Noema-Specs `docs/LCA-GATE-E-SCENARIO.md`](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LCA-GATE-E-SCENARIO.md). Checklist remains unchecked.

---

## Window (OBSERVED)

| Field | Value | Status |
|-------|-------|--------|
| `started_at` | `2026-09-09T07:38:30Z` (00:38:30 PT) | **OBSERVED** |
| `ends_at` | `2026-09-09T11:38:30Z` (+4h) | **DECLARED** from start |
| Clock claim | start only | **RUNNING** — not scored |

---

## Pins at start (OBSERVED)

| Pin | Value | Status |
|-----|-------|--------|
| `world_id` | `world.perihelion-reach-3` | **OBSERVED** |
| `genesis_id` | `genesis.94d0961984b2b4f8` | **OBSERVED** |
| Start cycle / sequence | `18013` / `42292` | **OBSERVED** |
| `worker_version_id` | `592c06a4-fa8c-40f6-bec7-21cbc45689f9` | **OBSERVED** |
| `/ready` | `ACTIVE` `HEALTHY` `players=0` | **OBSERVED** |
| Official client | `noema` `0.1.22` | **OBSERVED** |

Prep bind heads in [candidate-declaration.md](candidate-declaration.md) were cycle `17958` / sequence `42176`. Start heads above are the Phase A clock bind. Do not collapse them.

---

## Controllers at start (OBSERVED)

| Slot | `controller_id` | Status |
|------|-----------------|--------|
| LUDUS | `ctrl.device.045d476eb727` | **OK** Civic Exchange |
| ADVERSARY | `ctrl.device.b0485ebad353` | **FAIL** `NOT_IN_WORLD` — `ENTER` → `SETTLEMENT_RESYNC` |
| VECTOR | `ctrl.device.bd2e11406237` | **OK** |

Trio at clock start is **not** 3/3 in-world. ADVERSARY failed ENTER. This start receipt does not score population. Zero-or-partial Controller endurance without a later `NOT_COMPUTABLE` / FAIL mark is WEAK.

Device user codes at this instant are **not** in the operator start receipt. Do not invent them.

---

## Explicit non-claims

- Gate E is **not** COMPLETE.
- Phase A is **RUNNING** (start only). Not PASS. Not FAIL. Not scored.
- Issue #682 stays **OPEN**.
- No Deploy, Controller reconnect, remint, or Path 8 recover from this file.
- No Specs campaign flip.
- End heads, mid-window remint, and post-#686 trio state are **not** recorded here — see [phase-a-end.md](phase-a-end.md) and [deploy-686-probe.md](deploy-686-probe.md).
