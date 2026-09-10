# Gate E Phase A end receipt — OBSERVED (NOT COMPLETE)

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Phase:** A (4h candidate)
**Checked:** 2026-09-09T11:44:32Z
**Start companion:** [phase-a-start.md](phase-a-start.md)

**This file does not claim Gate E COMPLETE or Phase A PASS.**
Do not close #682. No Deploy. No Controller reconnect. No Path 8 recover. No secrets.

---

## Heads (OBSERVED)

| Field | Value | Status |
|-------|-------|--------|
| Start cycle / sequence | `18013` / `42292` | **OBSERVED** ([phase-a-start.md](phase-a-start.md)) |
| End cycle / sequence | `18318` / `43155` | **OBSERVED** at check `2026-09-09T11:44:32Z` |
| Delta | `+305` / `+863` | **OBSERVED** |
| Window `ends_at` | `2026-09-09T11:38:30Z` | **DECLARED** at start |
| Check lag after `ends_at` | ~6 minutes | **OBSERVED** |

---

## Worker at end (OBSERVED)

| Pin | Value | Status |
|-----|-------|--------|
| `worker_version_id` | `3db8d757-dc2d-4795-9eb3-9bae8e605207` | **OBSERVED** (post-[#686](https://github.com/Zero-State-LLC/Noema/pull/686)) |
| `deployed_at` | `2026-09-09T09:40:39.099343Z` | **OBSERVED** |
| Pin PR | [#687](https://github.com/Zero-State-LLC/Noema/pull/687) | **MERGED** |
| Start Worker | `592c06a4-fa8c-40f6-bec7-21cbc45689f9` | **HISTORICAL** (clock start) |

Worker identity changed mid-window. See [deploy-686-probe.md](deploy-686-probe.md) and [intervention-log.md](intervention-log.md) (Phase A calendar CONTROL_PLANE rows for #684 / #686).

---

## Controllers at end (OBSERVED)

All three **stored** devices: expired / `connected=False` / **0/3 observe**.

| Slot | Stored `controller_id` (hex suffix) | At end |
|------|-------------------------------------|--------|
| LUDUS | `ctrl.device.59952ca5c938` | expired / `connected=False` / no observe |
| ADVERSARY | `ctrl.device.38752b7a746b` | expired / `connected=False` / no observe |
| VECTOR | `ctrl.device.51be323d8705` | expired / `connected=False` / no observe |

These stored ids are **not** the Phase A start ids (`045d476eb727` / `b0485ebad353` / `bd2e11406237`). Mid-window remint after #686 produced a new stored trio; that trio was dead by the end check.

Play PIDs dead ~`10:47`–`10:48Z` after `n=500` keepalive. Continuity through `ends_at` (`11:38:30Z`) is therefore **not** shown.

Device user codes at end check are **not** in the operator end receipt. Do not invent them.

---

## Mid-window post-#686 slice (OBSERVED; not the full 4h)

Checked ~`2026-09-09T09:41Z`–`09:43Z` (immediately after Worker `3db8d757…`):

| Item | Value | Status |
|------|-------|--------|
| ENTER + observe | **3/3 OK** | **OBSERVED** |
| `SETTLEMENT_RESYNC` | **0** | **OBSERVED** |

This slice is a post-fix probe, not continuity through `ends_at`. See [deploy-686-probe.md](deploy-686-probe.md).

---

## Verdict table (fail-closed)

| Slice | Verdict | Note |
|-------|---------|------|
| World (ACTIVE / HEALTHY / heads advanced) | **PASS** | End heads `18318` / `43155`; delta `+305` / `+863` |
| Trio after #686 (09:41–09:43Z) | **PASS** | 3/3 ENTER+observe; 0 `SETTLEMENT_RESYNC` |
| Continuity through `ends_at` | **FAIL** | Play PIDs dead ~10:47–10:48Z; stored devices expired; 0/3 observe at 11:44:32Z |
| Phase A overall | **NOT_COMPUTABLE** as a clean **PASS** / **HOLD** | Conjunctive 4h candidate cannot be scored PASS while continuity FAIL |
| Gate E | **not COMPLETE** | Phase A does not open or close Gate E |

Do **not** treat the post-#686 trio PASS as Phase A PASS. Do **not** treat world PASS as endurance PASS.

---

## Explicit non-claims

- Not Gate E COMPLETE. Not Phase A PASS. Not Phase B PASS.
- Overall Phase A is **NOT_COMPUTABLE** as a clean PASS / HOLD.
- Issue #682 stays **OPEN**.
- No Deploy, remint, Controller reconnect, or Path 8 recover from this file.
- No Specs campaign flip.
- Cycle/sequence heads at the #684 / #686 Deploys themselves are **NOT_COMPUTABLE** from this receipt (not sampled at those publishes).
