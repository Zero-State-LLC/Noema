# Deploy #686 probe — OBSERVED (NOT Gate E COMPLETE)

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`
**Cut:** post-[#686](https://github.com/Zero-State-LLC/Noema/pull/686) live probe (inside Phase A calendar)
**Collected:** 2026-09-09 ~09:40–09:43Z

**This file is a Deploy-acceptance probe. It does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. No further Deploy. No remint from this file. No Path 8 recover. No secrets.

---

## Deploy / pin (OBSERVED)

| Item | Value | Status |
|------|-------|--------|
| Source PR | [#686](https://github.com/Zero-State-LLC/Noema/pull/686) `fix: clamp restored world.sequence to heads.sequence (Gate E SoT)` | **MERGED** `2026-09-09T09:37:48Z` |
| Actions run | [34335936228](https://github.com/Zero-State-LLC/Noema/actions/runs/34335936228) | **SUCCESS** |
| `worker_version_id` | `3db8d757-dc2d-4795-9eb3-9bae8e605207` | **OBSERVED** |
| `deployed_at` | `2026-09-09T09:40:39.099343Z` | **OBSERVED** ([phase-a-end.md](phase-a-end.md) / pin #687) |
| Source commit at Deploy | `25958c7b810d88c7faedbde00ab92c83584a6fcb` | **OBSERVED** ([#687](https://github.com/Zero-State-LLC/Noema/pull/687) pin body) |
| Pin PR | [#687](https://github.com/Zero-State-LLC/Noema/pull/687) | **MERGED** `2026-09-09T09:42:55Z` |
| World / Genesis | `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8` | **OBSERVED** |

Prior live Worker (Phase A start / #684 window): `592c06a4…` then `caee513b…` (#684 / pin #685). See [intervention-log.md](intervention-log.md).

---

## Probe result (OBSERVED)

| Check | Result | Status |
|-------|--------|--------|
| ENTER | **3/3 OK** | **OBSERVED** (~09:41–09:43Z) |
| `SETTLEMENT_RESYNC` | **0** | **OBSERVED** (same slice as [phase-a-end.md](phase-a-end.md) mid-window) |
| Acceptance | **MET** | **OBSERVED** for this probe only |
| Remint | **skipped** (creds reused) | **OBSERVED** |

Acceptance **MET** means the #686 SoT-clamp Deploy accepted ENTER for the stored trio on Worker `3db8d757…`. It does **not** mean Phase A PASS, 4h continuity, or Gate E COMPLETE.

Cycle/sequence heads **at the Deploy instant** were not sampled for this probe file. Mid-window observe heads are in [phase-a-end.md](phase-a-end.md) (trio after #686). End heads at Phase A check are `18318` / `43155`. Do not invent a Deploy-instant head.

---

## Explicit non-claims

- **NOT** Gate E COMPLETE.
- Not Phase A PASS. Not Phase B PASS.
- Acceptance MET ≠ endurance PASS.
- Remint skipped — this file does not remint or reconnect.
- Issue #682 stays **OPEN**.
- No Deploy dispatched from this packet. No Path 8 recover. No Specs flip.
