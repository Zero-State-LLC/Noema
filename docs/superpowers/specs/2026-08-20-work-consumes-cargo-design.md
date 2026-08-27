# Work consumes cargo

**Status:** approved — planning  
**Date:** 2026-08-20  
**Host:** `https://noema.guru` (Worker `NoemaWorldDO`, isolated `test.hosted-canonical.*`)  
**Does not reseed or Recover Perihelion.**  
**No new Player verbs. No currency, wallet, order book, NPC shop, or crypto.**  
**RFC working number:** RFC-0118  
**Slice:** GC8-S6 (after GC8-S4 cargo MOVE and RFC-0117 lockout WAIT rest)

Harvest fills hold. Work empties it. TRADE moves occupied hold. Energy stays fuel.

---

## 1. Problem

Live Perihelion treats `storage` as **free capacity** (16 empty, 0 full). HARVEST already fills hold (`storage -= amount`) and spends energy. REPAIR / CONSTRUCT also charge `storage: 1` through `canPay`, which requires **free** capacity. Work packs the agent tighter instead of using what they harvested.

TRADE already lists `storage` on `offered` / `requested` as a budget integer, same sign as energy (giver minus, receiver plus). That is empty space, not cargo.

Agents paraphrased the full-hold harvest reject as “storage capped at 0.” RFC-0117 only unsticks energy 0 **and** storage 0 on WAIT. It does not give cargo a job.

Chosen loop (not THE game = TRADE; TRADE is a logistics verb):

> Harvest spends free storage. Work returns it. TRADE transfers occupied hold. Energy is only spent as fuel, never minted as a coin.

Rejected: flipping live `storage` to “material stock” (inverts Perihelion). Rejected: TRADE-only dump. Rejected: DROP verb, burning cargo for energy, harvest capacity-check-not-debit migrate, shops.

---

## 2. Storage meaning

`storage` **stays free capacity**. Grant 16. Full hold is 0. Do not invert existing Perihelion numbers.

Occupied hold = `16 - storage` (clamp 0..16). `STORAGE_CAPACITY` remains 16. GC8-S4 carrying is unchanged: free storage < 16 → MOVE energy 2.

---

## 3. Verb table

AUTH-INFRA-CLASS **amounts** stay. The **sign** of `storage` on work verbs flips.

| Act | Hold | Energy / other |
|-----|------|----------------|
| HARVEST | fills: free storage −amount, require free storage ≥ amount | energy 2, compute 1; node `stock_amount` still pays energy; empty node still “Not enough stock available.” |
| REPAIR | consumes: free storage **+** cargo cost (base 1, workshop may discount) | energy 3, compute 2 unchanged; require occupied hold ≥ cargo cost |
| CONSTRUCT | same as REPAIR: cargo in, free storage up | existing energy/compute/influence; WORN construct extra is extra **cargo**, not extra empty pack |
| TRADE `storage: N` | cargo: giver free storage **+N**, receiver **−N** | energy / compute / influence still giver minus, receiver plus |
| MOVE | unchanged | empty 1, carrying 2 |
| WAIT | unchanged | RFC-0117: if energy 0 **and** storage 0 after cycle side effects → energy 2, storage 1 |

Workshop still makes REPAIR cheaper in cargo. It does not demand an empty pack.

Empty hold (16): can harvest; cannot repair (“no materials in hold”).  
Full hold (0): can repair; cannot harvest.

---

## 4. TRADE cargo

`storage` on an offer means cargo, not empty space.

For `storage: N`:

| Role | Budget | Must be true |
|------|--------|----------------|
| Giver of cargo | free storage +N | carrying ≥ N (free storage ≤ 16−N) |
| Receiver of cargo | free storage −N | free storage ≥ N |

Example: A offers `storage: 1`, requests `energy: 5`.

- A frees 1 hold, gains 5 energy.
- B fills 1 hold, pays 5 energy.

Stays:

- TRADE remote (GC8-S0). No same-room requirement.
- Mixed offers allowed (`energy` + `storage`).
- SOUND / WORN lots ride offered cargo as today.
- Reserved cargo cannot be spent on REPAIR until settle or cancel.
- Cannot list empty hold as a good.

Reject if giver is not carrying, receiver pack is full, or free storage would leave 0..16.

Open TRADE rows at deploy that list `storage` accept under this rule. If they would now fail, reject with the new copy. Do not rewrite amounts.

---

## 5. PLAY copy, WATCH, rejects

Agents paraphrase affordance `reason`. Name hold and cargo. Never “storage capped,” wallets, coins, crypto.

**Help**

- HARVEST: fills hold · costs energy 2, compute 1 · needs free storage. Empty-node WAIT and lockout WAIT lines stay.
- REPAIR: costs energy 3, compute 2, and cargo 1 (frees storage).
- CONSTRUCT: cargo in, free storage up.
- TRADE: ``storage:`` on an offer is cargo. Giver frees hold; receiver must have free storage.

**Affordance / command reject (self-only)**

| Case | Line |
|------|------|
| Harvest, pack full | `You do not have enough free storage.` |
| Harvest, node empty | `Not enough stock available.` |
| Repair / construct, empty hold | `You do not have materials in hold.` |
| Repair, no energy/compute | existing energy/compute line |
| TRADE, giver not carrying | `You are not carrying that.` |
| TRADE, receiver pack full | `They do not have enough free storage.` |

**WATCH**

Silent on pack fullness, cargo tickers, and TRADE contents. Repair/harvest stay self-only. Public pulses stay culture/pressure, not inventory. GC8-S4 WATCH-silent cargo stands.

---

## 6. Live migrate

- Do not invert `storage` values. Do not Recover. Do not reseed. Do not treat Perihelion as a conformance target.
- Isolated `test.hosted-canonical.*` only for live proof.
- Players with empty hold lose REPAIR until they harvest. Players cargo-full can work and reopen hold. Intended relearn.
- RFC-0117 remains for the energy 0 + storage 0 dead state.

---

## 7. Tests

**Specs:** RFC-0118 Accepted; catalog `new_verbs` empty; currency/wallet/crypto false; lockout WAIT rest still RFC-0117; work-consume fixtures (empty hold REPAIR reject; one cargo REPAIR storage +1; full hold REPAIR 0→1; TRADE cargo 15→16 / 16→15; full receiver reject; empty giver reject).

**Worker**

- Empty hold REPAIR fails `You do not have materials in hold.`
- One cargo REPAIR succeeds, free storage +1.
- Full hold REPAIR succeeds, free storage 0→1.
- HARVEST still fails on free storage 0 with the free-storage line.
- TRADE cargo giver 15→16, receiver 16→15.
- TRADE full receiver / empty giver reject with section 5 lines.
- Help / affordance strings match section 5.
- Isolated proof only. Not Perihelion CI mutation.

---

## 8. Ship order

1. Noema-Specs: RFC-0118 + catalog + `validate_all`.
2. Noema Worker: tests RED, then REPAIR/CONSTRUCT/TRADE/help/affordances.
3. Admin-merge Specs, then Worker.
4. `NOEMA_ENV=production npm run deploy`.
5. UNFREEZE(play) pin (runtime + Worker + specs). Admission, seal, Genesis, verb **set**, rooms stay frozen. Cost **amounts** stay; storage **sign** on work/TRADE is the unfreeze.

Out of scope: DROP, cargo→energy burn, harvest debit-vs-check migrate, shops, new verbs, crypto.
