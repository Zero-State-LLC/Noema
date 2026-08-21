# GC1-S2 playable-completion design

**Date:** 2026-08-16  
**Status:** Design for review. Not an RFC. Not authorized runtime.  
**Completion bar:** playable completeness (mature-world sentence on hosted Perihelion).  
**Necessary RFC:** one — **GC1-S2 same-asset Engineer quality**.  
**Not this package:** other GC parent SPEC GAPs, GC1 decay/latent, WATCH titles, v0.8, Genesis reseed.

Authority to write later: `Zero-State-LLC/Noema-Specs` RFC-0040 + `docs/GC1-S2-ENGINEER-QUALITY.md`. Runtime after that RFC is Accepted: `workers/noema` `REPAIR` path only.

---

## 1. Why this is the only necessary gap

GAME-COMPLETENESS mature-world question: a Player can acquire a role, specialize, relate, build, and leave inheritance.

Already live enough for that sentence except **specialization that changes the world**:

- GC1-S0/S1: practice and recognition **lines only**
- GC2-S0: construct/dismantle
- GC3-S0–S7: memory, caution, preferred waiver
- GC4-S0–S4: offices, emergency, designated succession
- GC5–GC10 S0/S1 slices that already have RFCs

Without S2, recognition is presentation. Scenario A stays incomplete. No other open RFC is required to make the sentence true on Perihelion.

---

## 2. Slice contract

| Field | Value |
|-------|--------|
| Slice | `gc1-s2` |
| Catalog | `mastery-catalog/gc1-s2` (additive; S0/S1 catalogs unchanged) |
| Who | S1-recognized Engineer (`track.engineer.01`, 3 distinct repaired `entity_id`s) |
| Trigger | Successful `REPAIR` |
| Prior work | This **Player** already has ≥1 successful `REPAIR` on **this** `entity_id` (any earlier cycle, including before recognition) |
| Payer | Personal budgets **or** `acting_for` with occupied `OPERATE_NAMED_ASSET` |
| Evidence subject | Acting Player, never the org |
| Quality | Frozen +15 plus **+5** → **+20** this success |
| Cap | 100 |
| First repair of an asset | +15 (no bonus) |
| Costs / eligibility / targets | Unchanged v0.1 |
| New verbs / events | None. Reuse `BUDGET_CONSUMED` + `ENTITY_UPDATE` |
| WATCH / public titles | None |
| Decay / latent / focus | Out of slice |
| Other tracks | Out of slice |

Payload MAY include `quality_bonus: 5` on the repair `ENTITY_UPDATE` for rebuild tests. WATCH text MUST NOT narrate the bonus.

---

## 3. Rebuild

1. Walk this Player’s successful repair events in `(cycle, sequence)` order.  
2. Collect distinct `entity_id`s (S1 recognition set).  
3. Recognized Engineer iff that set size ≥ 3.  
4. On a new successful `REPAIR` of `E`: if recognized **and** `E` is already in the set, condition delta is 20; else 15.  
5. Cap 100. Replay of the same `event_id` does not double-count.

Failed or `BUDGET_EXCEEDED` repairs never enter the set.

---

## 4. Surfaces

| Surface | Behavior |
|---------|----------|
| Acting PLAY | Existing repair prose + `You work this {label} with practiced hands.` No XP. No “Engineer +5.” |
| Other Players | No recognition line |
| WATCH | Existing public repair pulse only; no title, no +5 |
| Affordance | `REPAIR` still shown from ordinary rules; MUST NOT appear/disappear because of recognition |

---

## 5. Failures

| Case | Result |
|------|--------|
| Not recognized Engineer | +15, no new code |
| First repair of this `entity_id` | +15 |
| Prior repair was another Player’s | +15 |
| Cannot pay | `BUDGET_EXCEEDED`; no quality write |
| Office repair, vacant / wrong profile | Existing `FORBIDDEN`; no bonus path |

---

## 6. Hosted implementation (after RFC Accepted)

File: `workers/noema` existing `REPAIR` success (personal and `acting_for`).  
After grant/conflict checks: compute delta with the rebuild above; write condition; emit the same event types as today.

Isolated tests only (`test.hosted-canonical.*`). Never Perihelion as `world_id`.

1. Three distinct repairs → recognized; fourth on a **new** asset → +15.  
2. Second repair on an **already-repaired** asset → +20, cap 100.  
3. `acting_for` uses the holder’s history, not the org’s.  
4. Other Player PLAY/WATCH has no Engineer title.

---

## 7. Explicitly not necessary for playable completion

Preferred-counterparty is already RFC-0039. Do **not** open in this package:

- GC1 decay / latent / public titles / `SPECIALIZATION_*`
- GC2 extra classes, UPGRADE, workshops
- GC4 consensus succession; broader COI
- GC5 SHOUT/BOARD
- GC7 fifth form / institution-as-party
- GC8 lot quality
- GC9 v0.6C / rituals
- GC10 scars
- WATCH websocket, hosted `refresh_token`, STUDY/Lab/LEARN
- `TRACE`, `ROLE_*`, hidden rooms, Genesis reseed

---

## 8. Next step after this design is approved

1. Specs: RFC-0040 + `docs/GC1-S2-ENGINEER-QUALITY.md` + mastery catalog/fixtures + `check_gc1_s2`.  
2. Noema: isolated tests then `REPAIR` delta.  
3. Admin-merge both; deploy Worker; `/ready` stays ACTIVE/HEALTHY; genesis unchanged.
