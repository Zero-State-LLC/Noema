# Gate F scorecard packet — live `1e52e827` / `65086d32` (post-Deploy)

**Written:** 2026-09-20 19:09 PDT  
**Tracking:** [Zero-State-LLC/Noema#715](https://github.com/Zero-State-LLC/Noema/issues/715) (OPEN)  
**Candidate:** `lca6-gate-f-successor-decision`  
**Authority:** Specs `docs/LCA-GATE-F-SCENARIO.md` § Packet items 1–7  
**Danny authorization:** scorecard fill for items **1–6** only — **not** Gate F `GO`

## What this packet is

- Post-Deploy fill of Gate F scorecard items **1–6** for **LIVE_NAMED** Worker `1e52e827-695c-4386-9795-d42b175ec166` / source `65086d324d2c52b1efd507c9174d0950095a8049`.
- Refresh of Item-1 production delta vs prior live `ac6813da` / `630652e6` (now HISTORICAL).
- Continuity seal for isolated A-B-A **PASS** (r2) already filed under `docs/evidence/gate-f-isolated-aba-75d468c7-20260920/`.

## What this packet is not

- **Not** Gate F COMPLETE  
- **Not** item 7 verdict / **`GO` unchecked**  
- **Not** a Deploy (Deploy [35549259561](https://github.com/Zero-State-LLC/Noema/actions/runs/35549259561) already landed; Deploy ≠ `GO`)  
- **Not** WORLD_CUTOVER, campaign flip, or hosted STUDY reopen  
- **Not** inventing digests or risk owners — gaps marked **NOT_COMPUTABLE**

## OBSERVED pins (packet time 2026-09-20 ~19:09 PDT)

| Surface | Value | Evidence |
|---|---|---|
| Live Worker | `1e52e827-695c-4386-9795-d42b175ec166` | `GET https://noema.guru/version` |
| `deployed_at` | `2026-09-21T00:57:11.486234Z` (= **2026-09-20 17:57 PDT**) | `/version` |
| Live source | `65086d324d2c52b1efd507c9174d0950095a8049` | Deploy run + pin #721 |
| Deploy run | [35549259561](https://github.com/Zero-State-LLC/Noema/actions/runs/35549259561) **SUCCESS** | `workflow_dispatch` from main |
| Pin PR | [#721](https://github.com/Zero-State-LLC/Noema/pull/721) MERGED `f61e6b886c45f24fbcdc7b5686a90ffe6a807d5b` | gh |
| Specs reconcile | [#349](https://github.com/Zero-State-LLC/Noema-Specs/pull/349) MERGED `c56134710632da51adc4d45eff423c1d83af0d79` | gh |
| `/ready` | ACTIVE / HEALTHY · ready=true · players=0 · cycle=21948 · genesis `genesis.94d0961984b2b4f8` | `GET /ready` |
| PLAY world | `world.perihelion-reach-3` | `/version` + `/ready` |
| Prior live (HISTORICAL) | `ac6813da-1e0a-4f0c-8566-d9346b4baed5` / `630652e6772d4fbc340cf155a33fd628163709d9` | prior Deploy / #716 |
| Prior SUCCESSOR_NAMED (absorbed) | `75d468c750aeb04490969f33d2cc13ad7e85a3a5` (#717) | now in live `65086d32` |
| `successor_scope` | `RUNTIME_ONLY` | #715 |
| Dependabot sharp open alerts | **0** (as of last probe) | gh Dependabot API |
| Scoring | items 1–6 filled here; item 7 **NOT ISSUED**; Specs still **DEFERRED** for COMPLETE | this packet · Specs companion |

## Files

| File | Role |
|---|---|
| [SCORECARD.md](SCORECARD.md) | Items 1–6 status + item 7 NOT ISSUED / GO unchecked |
| [PRODUCTION-DELTA.md](PRODUCTION-DELTA.md) | Item-1 post-Deploy delta vs prior `ac6813da` / `630652e6` |
| [INDEX.md](INDEX.md) | This index |

Related evidence (already on main): [`../gate-f-isolated-aba-75d468c7-20260920/`](../gate-f-isolated-aba-75d468c7-20260920/)

## Explicit non-claims

Deploy already done ≠ Gate F `GO`. Scorecard fill ≠ COMPLETE. Item 7 remains **NOT ISSUED**.
