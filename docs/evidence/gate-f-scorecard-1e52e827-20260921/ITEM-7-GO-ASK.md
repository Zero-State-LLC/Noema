# Gate F Item 7 — GO ask (DRAFT for Danny)

**Written:** 2026-09-20 19:16 PDT  
**Tracking:** [Noema#715](https://github.com/Zero-State-LLC/Noema/issues/715) OPEN  
**Candidate:** `lca6-gate-f-successor-decision`  
**Live:** Worker `1e52e827-695c-4386-9795-d42b175ec166` / source `65086d324d2c52b1efd507c9174d0950095a8049`  
**Scorecard:** [`docs/evidence/gate-f-scorecard-1e52e827-20260921/`](./) · items **1–6 FILLED** · item **7 NOT ISSUED**  
**This document:** draft ask only — **does not** check `GO`, claim COMPLETE, or authorize Deploy.

---

## Ask (one decision)

@scrimshawlife-ctrl — please choose **one**:

- [ ] **Confirm proposed residual owners** (table below) **and issue `GO`**
- [ ] **Confirm proposed residual owners** **and issue `NO-GO`**
- [ ] **Hold** (owners and/or verdict deferred; leave `GO` unchecked)

Until you check one box above in a human reply on #715 (or update the scorecard yourself), item 7 remains **NOT ISSUED** and the scorecard `GO` box stays **unchecked**.

---

## Honesty section (required reading before GO)

### 1. Across-Deploy live PLAY digests = permanently NOT_COMPUTABLE

Byte-for-byte state/history digests for live PLAY (`world.perihelion-reach-3`) **across** the Deploy that landed `1e52e827` / `65086d32` were **not** captured pre-Deploy. There was **no pre-dump**. That matrix cannot be reconstructed after the fact without inventing values.

**Label:** **NOT_COMPUTABLE** (permanent for this Deploy event).  
**Implication for GO:** A honest `GO` under `RUNTIME_ONLY` may proceed **only if** Danny explicitly accepts this permanent gap (world/genesis OBSERVED unchanged via `/ready`; digests not measured). Accepting ≠ inventing digests.

### 2. Residual owners are PROPOSED, not OBSERVED assignments

Item-6 owner column previously **NOT_COMPUTABLE** (no named owners). This ask proposes owners from standing OBSERVED roles. Every row is labeled **PROPOSED — pending Danny confirm**. Confirming owners is a prerequisite for an honest item-7 verdict; until confirmed they remain proposals.

### 3. Deploy ≠ GO

Deploy [35549259561](https://github.com/Zero-State-LLC/Noema/actions/runs/35549259561) already **SUCCESS**. That is **not** Gate F `GO`. Live pin #721 / Specs #349 do **not** issue item 7. Narrating Deploy as successor decision / COMPLETE is **forbidden**.

### 4. Production A-return not rehearsed

Isolated A-B-A **PASS** r2 is OBSERVED. Production A-return (Deploy of prior source onto `noema.guru`) was **not** rehearsed — correctly out of rehearsal scope (prod GET-only). Residual remains owned under row 7 if GO issues.

### 5. Live perihelion-3 production-shape dump absent

Older-world suite fixture #565 = **synthetic** (OBSERVED). Live production-shape dump of perihelion-3 at cutover was **not** filed → NOT_COMPUTABLE as dump evidence. Row 2 proposes ops ownership if GO issues with that gap accepted.

---

## What `GO` would permit vs forbid

| Class | If Danny issues `GO` | Still forbidden after `GO` |
|---|---|---|
| Scorecard item 7 | May check **GO** on the scorecard (human only) | Agent must not self-check GO |
| Public language | Live Worker/source/`deployed_at` as OBSERVED; isolated A-B-A PASS with receipts; `RUNTIME_ONLY` + same PLAY world/genesis | “Deploy proves GO”; COMPLETE without separate COMPLETE record; inventing digests |
| Ops | Continue ops under confirmed residual owners; future Deploys still require workflow_dispatch + ACK + pin | Bare `wrangler deploy`; WORLD_CUTOVER without packet; agent Deploy |
| COMPLETE / campaign | **Not** implied — COMPLETE remains separate ask | Flip `current-state.v1.yaml`; hosted STUDY reopen; sentience / offline↔hosted digest equivalence claims |
| Specs companion | Specs [#350](https://github.com/Zero-State-LLC/Noema-Specs/pull/350) may land as OBSERVED fill (not COMPLETE) | Specs claiming COMPLETE or GO |

**If `NO-GO`:** record rationale; leave live as-is; do not invent digests; park until next real `workers/` runtime Δ or explicit reopen.  
**If `Hold`:** leave GO unchecked; owners stay PROPOSED until confirm.

---

## PROPOSED residual risk owners (pending Danny confirm)

Standing roles only. **Not** OBSERVED assignments until Danny confirms.

| # | Residual | Proposed owner | Label |
|---|---|---|---|
| 1 | Accidental WORLD_CUTOVER | Danny (scrimshawlife-ctrl) — constitution/gate human-yes | **PROPOSED** |
| 2 | Live perihelion-3 dump absent | Prabu (prabu-openclaw) — Worker/DO ops; Danny for production dump authorize | **PROPOSED** |
| 3 | Gate E settlement soft-restore / head-seq | Prabu + Noema Admin (ops plane) | **PROPOSED** |
| 4 | Device enrollment never completed | Danny (product) | **PROPOSED** |
| 5 | Client pin re-check | Prabu on next client release | **PROPOSED** |
| 6 | WATCH at population | Noema Admin + Gate D watch; Danny for COMPLETE claims | **PROPOSED** |
| 7 | Bare wrangler / prod A-return | Danny (Deploy ACK only via workflow); Prabu for Worker scripts | **PROPOSED** |
| 8 | Overclaim Deploy=GO | Danny + SIGNAL (public language) | **PROPOSED** |
| 9 | Future Dependabot | Prabu (merge) + Danny (Deploy) | **PROPOSED** |
| 10 | Gate E credential expiry carry-forward | Noema Admin + Danny | **PROPOSED** |

---

## Prerequisites already on the table (OBSERVED)

| Item | Status |
|---|---|
| 1 Exact production delta | FILLED |
| 2 Migration + rollback | FILLED PARTIAL (A-B-A PASS; live dump / prod A-return NOT_COMPUTABLE) |
| 3 Compatibility | FILLED PARTIAL (world/genesis OBSERVED; across-Deploy digests permanently NOT_COMPUTABLE) |
| 4 Operational rehearsal | FILLED — PASS (isolated r2) |
| 5 Permitted public claims | FILLED (draft bounds) |
| 6 Unresolved risks | FILLED (re-score); owners → **PROPOSED** in this ask |
| 7 Verdict | **NOT ISSUED** — awaiting Danny checkbox above |

---

## Hard walls (this ask)

- Do **not** check `GO` in SCORECARD from this draft alone  
- Do **not** claim Gate F COMPLETE  
- Do **not** Deploy / WORLD_CUTOVER from this ask  
- Do **not** invent digests or treat PROPOSED owners as OBSERVED until Danny confirm  
- Specs sync: companion [#350](https://github.com/Zero-State-LLC/Noema-Specs/pull/350) already open — **do not duplicate**

---

## Danny reply template (copy/paste OK)

```text
Owners: CONFIRM / HOLD / CHANGE (list changes)
Item-7: GO / NO-GO / HOLD
Accepted permanent gap: across-Deploy digests NOT_COMPUTABLE — YES / NO
```
