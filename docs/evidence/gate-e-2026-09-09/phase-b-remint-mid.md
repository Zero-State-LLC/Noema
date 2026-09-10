# Gate E Phase B mid-run remint — OBSERVED (NOT COMPLETE)

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Phase:** B (inside 24h window)
**When:** `2026-09-09T22:37:57Z` (~15:36 PT Sep 9)
**Start companion:** [phase-b-start.md](phase-b-start.md)

**This file records a mid-run remint. It does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. No Deploy. No Path 8 recover. No secrets.

---

## Reason (OBSERVED)

`NOT_AUTHORIZED` — credentials expired.

This remint is an operator Controller-credential refresh. It is **not** the Path 8 recovery drill. `ends_at` is **unchanged** (`2026-09-10T16:37:48Z` / 09:37:48 PT Sep 10).

---

## New devices (OBSERVED)

Checked at cycle / sequence `18815` / as listed per slot.

| Slot | Device user code | `controller_id` | Status |
|------|------------------|-----------------|--------|
| LUDUS | `B28F-076F` | `ctrl.device.71916a297ea7` | **OK** @ `18815` / `44251` |
| ADVERSARY | `2BAD-6466` | `ctrl.device.f230ad7e19aa` | **OK** @ `18815` / `44252` |
| VECTOR | `4BAC-170D` | `ctrl.device.c0c930e668f4` | **OK** @ `18815` / `44253` |

Prior Phase B start stored ids (`df4ec0abc7c7` / `24dc57575816` / `2d1cabdb42de`) are superseded for subsequent observe. Do not mix the two trios into one census.

No tokens, `credential.json`, or Authorization headers in this packet.

---

## Unchanged

| Item | Value |
|------|-------|
| Phase B `ends_at` | `2026-09-10T16:37:48Z` (unchanged) |
| Path 8 | still **SCHEDULED_NOT_FIRED** at this remint (planned `2026-09-10T04:37:48Z`) |
| Worker at remint | **NOT_COMPUTABLE** from this receipt (not re-sampled `/version` at 22:37:57Z) |

---

## Explicit non-claims

- Not Gate E COMPLETE. Not Phase A PASS. Not Phase B PASS.
- No Deploy from this file. No Admin recover. No INCIDENT flip.
- This remint does **not** satisfy Path 8.
- Issue #682 stays **OPEN**.
- Continuity of the pre-remint trio through `ends_at` is **not** shown here.
