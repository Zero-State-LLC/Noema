# Gate C civilization evidence run — 2026-09-08

**Candidate:** `lca3-gate-c-existing-system-civilization`  
**Issue:** [Zero-State-LLC/Noema#661](https://github.com/Zero-State-LLC/Noema/issues/661) **OPEN**  
**Worker (OBSERVED):** `2c48d671-620a-43df-bb56-87438671e734` · World `world.perihelion-reach-3` · Genesis `genesis.94d0961984b2b4f8`  
**Client:** `/workspace/c7-noema-022/bin/noema` **0.1.22** · Server `https://noema.guru`  
**Plan:** `/workspace/noema-gate-c-eight-path-map-2026-09-08.md`  
**Strategy declarations:** `/workspace/gate-c-cohort/strategy-declarations-2026-09-08.md`  
**Raw evidence (redacted):** `/workspace/gate-c-cohort/run-logs/evidence.jsonl`  

**Explicit non-claims:** Gate C is **not** COMPLETE. No Deploy. No new verbs. No RFC-0130. Path 8 **NOT_COMPUTABLE** — no invented recovery receipts. Operator should **withhold COMPLETE**.

---

## Cohort (OBSERVED remint)

| Slot | Label | controller_id | player_id |
|------|-------|---------------|-----------|
| controller-a | LUDUS | `ctrl.device.f2d32e6656db` | `player.devicef2d32e6656db` |
| controller-b | ADVERSARY | `ctrl.device.567685259784` | `player.device567685259784` |
| controller-c | VECTOR | `ctrl.device.23d75b3e1b86` | `player.device23d75b3e1b86` |

## Canonical heads

| Pin | Start (first in-world observe) | End (run close) |
|-----|--------------------------------|-----------------|
| LUDUS | cycle **17414** / seq **40883** | cycle **17415** / seq **40949** |
| ADVERSARY | cycle **17414** / seq **40884** | cycle **17415** / seq **40949** |
| VECTOR | cycle **17414** / seq **40885** | cycle **17415** / seq **40949** |
| `/ready` end | — | ready=true, ACTIVE, HEALTHY, cycle **17415**, sequence **40949**, players=0 (census ≠ population proof) |
| `/version` end | — | `worker_version_id=2c48d671-620a-43df-bb56-87438671e734` |

## Operator-intervention list

| Item | Status |
|------|--------|
| Admin Approve remint (ED58/D9D6/CB1F) | DONE prior (remint-admin-receipts) |
| Further operator privilege / WED / binding OA | **NONE** this run |
| Rahu HOLD ~15:58–17:32 PT | Noted; no binding OA; soft Player acts only |
| Deploy / Genesis / new enrollments | Forbidden / not done |
| Path 8 recovery drill / invent receipt | **Not done** — NOT_COMPUTABLE |

## Strategy plurality (OBSERVED ≥3 dimension divergences)

Pre-run public declarations (no CoT): Strategy A “Exchange + broker” for LUDUS+VECTOR; Strategy B “Engineer + shared infrastructure” for ADVERSARY.

| # | Dimension | Strategy A (LUDUS/VECTOR) | Strategy B (ADVERSARY) | OBSERVED? |
|---|-----------|---------------------------|------------------------|-----------|
| 1 | Specialization | FOCUS **broker** (`You are focusing on exchanges.`) | FOCUS **engineer** (`You are focusing on infrastructure.`) | **YES** |
| 2 | Resource / route | HARVEST + TRADE / TRADE_NOTICE; LUDUS MOVE west under lot cost then return | HARVEST → `BUILD.CONSTRUCT` workshop + route_link | **YES** |
| 3 | Construction / repair allocation | Minimal (inspect only) | Primary construct workshop `entity.workshop.1368354c` + route_link `entity.route-link.b9b361f8` | **YES** |
| 4 | Org / access | LUDUS joins as **member**; no founder org | `ORG_CREATE` Reach Works Co-op + office Works Steward + `ORG_OFFICE_ACT` NOTICE | **YES** |
| 5 | Communication | TRADE_NOTICE / BOARD / private MESSAGE | Org **CHANNEL** + office NOTICE | **YES** |

Both strategies remained viable: brokers closed two settled trades; engineer founded org, held office, constructed infra.

**Act budget:** 63 act attempts · **53 exit=0** · LUDUS 20 / ADVERSARY 26 / VECTOR 17 — bounded, not endless; not identical golden scripts.

---

## Path scorecard

| Path | Verdict | Why (OBSERVED citations) |
|------|---------|--------------------------|
| **1** Resource/transport pressure → decision change | **PASS** | Harvest pressure rose (norms text ~28→33). LUDUS MOVE west → Storage District consequence **“Carrying lots cost extra.”** (cyc 17414/seq **40925**) → WAIT → return east still noting lot cost (**40926**) rather than further remote harvest; VECTOR revised TRADE_NOTICE terms under pressure (**40929**). |
| **2** Mastery / specialization difference | **PASS** | FOCUS broker (LUDUS/VECTOR) vs engineer (ADVERSARY) at **40885** (+ refocus). After settled trades, LUDUS/VECTOR practice **“You have been closing exchanges.”**; ADVERSARY engineer path constructed workshop/route_link and held Works Steward office — counterpart broker path did not construct. |
| **3** Coordination beats isolation | **PASS** | Bilateral TRADE `trade.40916` settled (**40919**) and `trade.40934` settled (**40937**) between VECTOR↔LUDUS; LUDUS invited into Reach Works Co-op (**40909**); ADVERSARY office NOTICE + CHANNEL coordinated members (**40923**/**40924**). Isolation baseline: solo harvest without trade/org would not yield settled exchange + shared institution notice. |
| **4** Social memory → later decision | **PASS** | After `trade.40916` settled, LUDUS shows reputation image/second-order and broker practice, then later offers **NON_AGGRESSION** agreement to same VECTOR counterpart (**40933**) and settles second trade `trade.40934` (**40937**) — counterpart continuity after prior settled exchange. Private MESSAGE thread LUDUS→VECTOR (**40898**) and VECTOR reply (**40944**). |
| **5** Bounded institution / authority | **PASS** | `ORG_CREATE` Reach Works Co-op `org.reach-works-co-op.4dd0afd6` (**40900**) → `ORG_OFFICE_CREATE` Works Steward `office.reach-works-co-op.4dd0af.works-steward.7b00d394` (**40907**) → assign OCCUPIED (**40921**) → **`ORG_OFFICE_ACT` NOTICE posted** (**40923**) — authority-bearing settled decision inside declared PUBLISH_NOTICE scope. Member add LUDUS (**40909**). |
| **6** Communication constraints | **PASS** | Surfaces: TRADE_NOTICE (**40895**, **40929**), BOARD (**40896**), private MESSAGE (**40898**, **40944**), org CHANNEL (**40924**). Constraint: AGREEMENT_FORM failed with **`NOT_COLOCATED: That Player is not here.`** (**40932**) when counterpart not co-present — co-location required for that coordination; later succeeded when co-present (**40933**). |
| **7** Conflict/disruption → recovery | **PASS** | `CONTEST_DECLARE` ACCESS_CONTEST `contest.40927` OPEN (**40928**) → `CONTEST_WITHDRAW` with **stake forfeit** (**40930**) on existing legal surface — disruption + recovery/closure without invented verbs or operator grants. |
| **8** Restart/recovery receipts | **NOT_COMPUTABLE** | `/ready` end heads recorded as supporting context only (17415/40949). **No** dedicated recovery-receipt object tied to candidate heads. Gate B waiver does **not** satisfy Gate C. **Do not invent.** |

### Honest gaps / partials (not invented)

| Item | Label | Note |
|------|-------|------|
| `ACCESS_POLICY` via default CLI | **GAP (client policy)** | Default `ClientPolicy.allow_access=False` → `POLICY_DENIED`. Even with allow_access=True, act rejected **not advertised** in this room state. Path 5 still PASS via office NOTICE. |
| `BUILD.VEST` / `SHARE` workshop | **PARTIAL** | `FORBIDDEN: That cannot be vested/shared` — workshop unfinished/ownership constraint. Construct + office NOTICE still evidence institution. |
| Transient `NOT_IN_WORLD` / inactive counterparty | Logged | Several acts failed when peer briefly inactive; recovered via re-observe/LOOK; not operator privilege. |

---

## Narrative (short)

Reminted LUDUS / ADVERSARY / VECTOR entered Civic Exchange on live Worker `2c48d671…`. Pre-run declarations split broker exchange (A) from engineer infrastructure (B). Controllers independently FOCUSed, harvested different nodes, and published discovery on TRADE_NOTICE/BOARD vs later org CHANNEL. ADVERSARY formed **Reach Works Co-op**, created and occupied **Works Steward**, posted an office NOTICE, and began workshop + route_link construction. LUDUS joined as member while keeping broker FOCUS. VECTOR and LUDUS settled two energy trades; LUDUS offered non-aggression after trade memory. Lot-carrying transport cost in Storage District changed LUDUS routing. ADVERSARY declared then withdrew an access contest with stake forfeit. Run stopped at a coherent ~53 successful acts. Path 8 left **NOT_COMPUTABLE**.

---

## TLDR scorecard

| Path | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|------|---|---|---|---|---|---|---|---|
| Verdict | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **NOT_COMPUTABLE** |

**Withhold Gate C COMPLETE?** **YES** — Path 8 blocks COMPLETE until recovery receipts tied to this candidate’s heads exist without invention.

**#661:** stays **OPEN**. No Deploy. No COMPLETE language in Specs campaign.
