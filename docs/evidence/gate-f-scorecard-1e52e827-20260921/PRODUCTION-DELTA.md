# Item-1 — Exact production delta (post-Deploy live `65086d32` vs prior `630652e6`)

**Label key:** OBSERVED · INFERRED · SPECULATIVE · NOT_COMPUTABLE  
**Scope:** `RUNTIME_ONLY` (OBSERVED — #715)  
**Stance:** `LIVE_NAMED` at Worker `1e52e827…` / source `65086d32…`  
**Prior live:** `ac6813da…` / `630652e6…` → **HISTORICAL**  
**Not GO · not Gate F COMPLETE.** Deploy already landed; this table is the post-Deploy delta record.

## Lineage (OBSERVED)

| Role | Worker version | Source commit | Evidence |
|---|---|---|---|
| Prior baseline (HISTORICAL) | `e5603e4b-7565-4e4a-a8d1-85360558a8ef` | `80a3d031…` | #714 · Gate E era |
| Prior live A (HISTORICAL) | `ac6813da-1e0a-4f0c-8566-d9346b4baed5` | `630652e6772d4fbc340cf155a33fd628163709d9` | Deploy 35535519732 · #716 |
| Intermediate on main | (metadata / docs / sharp / rehearse) | `75d468c7` (#717) · `3fb9a630` (#719) · `65086d32` (#720) | merges before Deploy |
| **Current live B′** | `1e52e827-695c-4386-9795-d42b175ec166` | `65086d324d2c52b1efd507c9174d0950095a8049` | Deploy [35549259561](https://github.com/Zero-State-LLC/Noema/actions/runs/35549259561) · pin [#721](https://github.com/Zero-State-LLC/Noema/pull/721) |

`deployed_at` OBSERVED: `2026-09-21T00:57:11.486234Z` (= **2026-09-20 17:57 PDT**).

## Commits on path prior live source → live source (OBSERVED)

`gh compare 630652e6…65086d32` (ahead_by 5):

| SHA (short) | PR | Summary | Runtime class |
|---|---|---|---|
| `56583aae` | #716 | pin prior live `ac6813da` | **configuration-only** (pin metadata) |
| `75d468c7` | #717 | sharp@0.35.4 npm override + lockfile | **implemented · deployed** (build/tooling lockfile; no Worker `.ts` Δ) |
| `c1778961` | #718 | A-B-A NOT_COMPUTABLE docs | **intentionally excluded** (docs) |
| `3fb9a630` | #719 | rehearsal script wait `/ready` before genesis | **implemented · deployed** as script only — **not** production Worker request path |
| `65086d32` | #720 | A-B-A PASS r2 evidence docs | **intentionally excluded** (docs) |

## File delta: prior live source → current live source (OBSERVED)

| Path | Δ | Classification | Notes |
|---|---|---|---|
| `workers/noema/package.json` | +3 / −0 | **implemented · deployed** · **not migration-required** | npm `"overrides": { "sharp": "0.35.4" }` only |
| `workers/noema/package-lock.json` | +128 / −150 | **implemented · deployed** · **not migration-required** | transitive `sharp` 0.35.2 → **0.35.4** under wrangler/miniflare |
| `workers/noema/scripts/rollback-rehearsal.mjs` | +3 / −0 | **implemented · deployed** · **runtime-behavior: rehearsal-only** | wait `/ready` after deploy before genesis (cold-DO warm). Not on `noema.guru` request path |
| `workers/**` `.ts` / routes / DO | **empty** | **intentionally excluded** from code Δ | OBSERVED: no Worker TypeScript / route / DO source files in compare |
| `spec-compat.json` | pin churn | **configuration-only** | hosted_live pin to `1e52e827` / `65086d32` via #721 |
| `docs/evidence/gate-f-isolated-aba-75d468c7-20260920/**` | added | **intentionally excluded** (docs) | Item-4 receipts |

### Migration-required vs runtime-behavior (honesty)

| Class | Finding | Label |
|---|---|---|
| **migration-required** | **None** in Worker runtime source (no schema / DO / route / catalog Δ) | OBSERVED |
| **runtime-behavior (production request path)** | No `.ts`/route/DO change; sharp override is tooling/transitive for Worker **build** (miniflare), not a PLAY verb or settlement path change | OBSERVED (absence of runtime-source Δ) · INFERRED (sharp not on production HTTP handlers) |
| **runtime-behavior (rehearsal tooling)** | `#719` changes isolated A-B-A script only | OBSERVED |
| **docs / pin metadata** | #716/#718/#720/#721 | OBSERVED |

### One-line workers/ honesty (OBSERVED)

**`workers/` Δ vs prior live = sharp npm override + lockfile + rehearsal-script `/ready` wait; no Worker runtime TypeScript.**

## Surfaces checklist (Item-1 vocabulary)

| Surface | Live vs prior live | Class | Label |
|---|---|---|---|
| Worker runtime source (CF Worker tree) | No `.ts`/route/DO Δ | lockfile/override + rehearsal script only | OBSERVED |
| Worker version id | `ac6813da` → `1e52e827` | **deployed** | OBSERVED |
| Specs pin | Specs [#349](https://github.com/Zero-State-LLC/Noema-Specs/pull/349) reconcile | configuration / docs | OBSERVED |
| Official-client pin | `noema-client==0.1.21` (unchanged by this Deploy path) | intentionally excluded from workers Δ | OBSERVED (`spec-compat.json` hosted_live) |
| Catalogs / `world_rules_version` | unchanged | intentionally excluded | OBSERVED (absence) |
| Non-secret config digest | not re-hashed in this packet | NOT_COMPUTABLE | NOT_COMPUTABLE |
| Routes | no route file Δ | intentionally excluded | OBSERVED |
| PLAY world / genesis | same `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8` | intentionally excluded (RUNTIME_ONLY) | OBSERVED (`/ready`) |
| sharp / miniflare tooling | override **now on live Worker build** | **implemented · deployed** | OBSERVED |
| Migration-required rows | **none** | — | OBSERVED |

## Route drift

OBSERVED: none in `630652e6…65086d32` (no route / OpenAPI / worker route files).

## RUNTIME_ONLY confirmation

| Check | Result | Label |
|---|---|---|
| `successor_scope` | `RUNTIME_ONLY` | OBSERVED (#715) |
| DEFAULT_WORLD_ID / Genesis change | No | OBSERVED (`/version` + `/ready`) |
| WORLD_CUTOVER | **not** declared; **not** this packet | OBSERVED |
| Live after Deploy | `1e52e827` / `65086d32` | OBSERVED |

## Explicit non-claims

- Deploy SUCCESS ≠ Gate F `GO`.  
- Empty runtime-source Δ ≠ waive A-B-A (rehearsal already PASS on isolated Worker for absorbed `#717` lineage).  
- Lockfile/override Δ ≠ proven PLAY behavioral Δ without measurement (isolated rehearsal exercised Worker health/genesis/rollback continuity, not a claim of PLAY population behavior change).
