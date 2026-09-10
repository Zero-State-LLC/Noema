# Gate E Phase B start receipt — OBSERVED (NOT COMPLETE)

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Phase:** B (24h candidate)
**Status:** start receipt only — **not** scored
**Collected:** 2026-09-09T16:37:48Z (09:37:48 PT)

**This file is a start receipt. It does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. No Deploy. No Controller reconnect. No Path 8 recover. No secrets.

Phase A overall at [phase-a-end.md](phase-a-end.md) is **NOT_COMPUTABLE** as a clean PASS / HOLD. Filing a Phase B start does **not** upgrade Phase A to PASS and does **not** authorize a 24h score.

---

## Window (OBSERVED / DECLARED)

| Field | UTC | PT | Status |
|-------|-----|----|--------|
| `started_at` | `2026-09-09T16:37:48Z` | 09:37:48 PT Sep 9 | **OBSERVED** |
| `ends_at` | `2026-09-10T16:37:48Z` | 09:37:48 PT Sep 10 | **DECLARED** (+24h) |
| Recovery drill planned | `2026-09-10T04:37:48Z` | 21:37:48 PT Sep 9 | **PLANNED** (not fired in this file) |

---

## Pins at start (OBSERVED)

| Pin | Value | Status |
|-----|-------|--------|
| `worker_version_id` | `3db8d757-dc2d-4795-9eb3-9bae8e605207` | **OBSERVED** |
| Start cycle / sequence | `18465` / `43454` | **OBSERVED** |
| `world_id` / `genesis_id` | `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8` | campaign pins (unchanged) |

Current live Worker after later Chamber Deploys is recorded in [repin-2026-09-10.md](repin-2026-09-10.md) (`7188ff8a…`, #702 already on `main`). That re-pin is **not** this start bind.

---

## Controllers at start (OBSERVED; pre mid-remint)

| Slot | Stored `controller_id` (hex suffix) | Status |
|------|-------------------------------------|--------|
| LUDUS | `ctrl.device.df4ec0abc7c7` | ENTER+observe **OK** Civic Exchange |
| ADVERSARY | `ctrl.device.24dc57575816` | ENTER+observe **OK** Civic Exchange |
| VECTOR | `ctrl.device.2d1cabdb42de` | ENTER+observe **OK** Civic Exchange |

**3/3** ENTER+observe OK. No `SETTLEMENT_RESYNC` at this start check.

These stored ids are **not** the Phase A start ids and **not** the mid-run remint ids in [phase-b-remint-mid.md](phase-b-remint-mid.md). Device user codes at this instant are **not** in the operator start receipt. Do not invent them.

Public `/v1/watch/live` `controllers` is **not** a trio census — see [controllers-watch-live-note.md](controllers-watch-live-note.md).

---

## Path 8 (in-window recovery drill)

| Item | Status |
|------|--------|
| Drill at start | **SCHEDULED_NOT_FIRED** |
| Planned fire | `2026-09-10T04:37:48Z` (21:37:48 PT Sep 9) |
| Receipt form | Existing Admin recover JSON only |
| Dedicated schema | **NOT_COMPUTABLE** — do not invent |

This file does **not** fire recover, declare INCIDENT, or write a recover body. None of the CONTROL_PLANE Deploys in [intervention-log.md](intervention-log.md) is the Path 8 drill.

---

## Explicit non-claims

- Not Gate E COMPLETE. Not Phase A PASS. Not Phase B PASS.
- Phase B start ≠ 24h continuity. End heads at `ends_at` are **not** in this file.
- Issue #682 stays **OPEN**.
- No Deploy, remint, Controller reconnect, or Path 8 recover from this file.
- No Specs campaign flip.
