# Work Consumes Cargo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the hosted loop so harvest fills hold, REPAIR/CONSTRUCT consume cargo (free storage up), and TRADE `storage:` moves occupied hold — no new verbs, no crypto.

**Architecture:** Keep `storage` as free capacity (16 empty, 0 full). Add `workers/noema/src/cargo.ts` for occupied-hold math. Work verbs stop running storage through `canPay`/`debit` (those subtract). TRADE treats `storage` with inverted sign and reserves cargo without freeing the pack until accept/cancel.

**Tech Stack:** Noema-Specs (`validate_all.py` + RFC catalog), Cloudflare Worker `workers/noema` (Vitest), production deploy `NOEMA_ENV=production npm run deploy`.

## Global Constraints

- No new Player verbs. No currency, wallet, order book, NPC shop, or crypto.
- Do not invert live Perihelion `storage` numbers. Do not Recover. Do not reseed.
- HARVEST unchanged: still fills hold; energy 2 + compute 1; node stock pays energy.
- AUTH-INFRA-CLASS **amounts** stay (REPAIR energy 3, compute 2, cargo 1). Storage **sign** on work/TRADE is the change.
- RFC-0117 lockout WAIT rest stays (energy 0 and storage 0 → energy 2, storage 1).
- Isolated `test.hosted-canonical.*` only for live proof. Not Perihelion CI mutation.
- PLAY copy names hold/cargo. Never “storage capped.” WATCH silent on pack and TRADE contents.
- CODEOWNERS: admin-squash merge then restore `enforce_admins`. Specs first, then Worker, then deploy, then UNFREEZE pin.

**Spec:** `docs/superpowers/specs/2026-08-20-work-consumes-cargo-design.md`

**Files (locked decomposition):**

| File | Responsibility |
|------|----------------|
| `Noema-Specs/rfcs/RFC-0118-work-consumes-cargo.md` | Accepted contract |
| `Noema-Specs/docs/GC8-S6-WORK-CARGO.md` | Slice |
| `Noema-Specs/specs/economy-catalog.gc8-s6.json` | Machine catalog |
| `Noema-Specs/validation/validate_all.py` | `check_gc8_s6` / `check_rfc_0118` |
| `workers/noema/src/cargo.ts` | occupied hold, consume cargo, TRADE cargo apply |
| `workers/noema/src/world-actions.ts` | REPAIR, CONSTRUCT, TRADE propose/accept/cancel |
| `workers/noema/src/actions.ts` | affordances + helpText |
| `workers/noema/test/gc8-s6.test.ts` | Worker fixtures from the spec |
| `workers/noema/test/cargo.test.ts` | helper unit tests |

`STORAGE_CAPACITY` already exists in `workers/noema/src/construction.ts` (`export const STORAGE_CAPACITY = 16`). Import it. Do not duplicate.

---

### Task 1: Specs RFC-0118

**Files:**
- Create: `rfcs/RFC-0118-work-consumes-cargo.md`
- Create: `docs/GC8-S6-WORK-CARGO.md`
- Create: `specs/economy-catalog.gc8-s6.json`
- Modify: `validation/validate_all.py` (after `check_rfc_0117`)

**Interfaces:**
- Consumes: RFC-0117 already Accepted on Specs main (`1a764da`)
- Produces: catalog fields `work_consumes_cargo: true`, `new_verbs: []`, `currency: false`, `rest_energy` unused, `cargo_trade_sign: "inverted"`

- [ ] **Step 1: Write RFC-0118** in a Specs worktree from `origin/main`:

```markdown
# RFC-0118 — Work consumes cargo

## Status

**Accepted**

No new Player verbs. AUTH-INFRA-CLASS amounts unchanged. Do not invert live `storage` numbers.

## Problem

`storage` is free capacity. HARVEST fills hold. REPAIR/CONSTRUCT still `canPay` storage, which demands empty pack. TRADE `storage` uses energy-sign. Cargo has no job.

## Proposed change

Work verbs consume cargo (free storage up). TRADE `storage: N` is cargo (giver free storage +N, receiver −N). HARVEST unchanged. WATCH silent on pack.

Catalog: `specs/economy-catalog.gc8-s6.json`. Slice: `docs/GC8-S6-WORK-CARGO.md`.

## Alternatives rejected

DROP verb. Flip storage to material stock. TRADE-only dump. Harvest debit-vs-check migrate. Currency/crypto.

## Compatibility

Additive sign flip. Worlds ignoring S6 keep today's lockout-to-work.

## Validation

`check_gc8_s6`: empty-hold work reject; cargo work storage +1; TRADE cargo 15→16 / 16→15; no new verbs.

## Rollback

`canPay`/`debit` storage on work and TRADE again.
```

- [ ] **Step 2: Write catalog** `specs/economy-catalog.gc8-s6.json`:

```json
{
  "schema_version": "economy-catalog/gc8-s6",
  "catalog_id": "economy-catalog/gc8-s6",
  "slice_id": "gc8-s6",
  "authority": "docs/GC8-S6-WORK-CARGO.md",
  "rfc": "rfcs/RFC-0118-work-consumes-cargo.md",
  "new_verbs": [],
  "new_events": [],
  "currency": false,
  "wallet": false,
  "crypto": false,
  "work_consumes_cargo": true,
  "storage_capacity": 16,
  "repair_cargo": 1,
  "watch_cargo": false
}
```

- [ ] **Step 3: Write slice** `docs/GC8-S6-WORK-CARGO.md` with the verb table from the design spec section 3 and the reject lines from section 5.

- [ ] **Step 4: Add `evaluate_gc8_s6` + `check_gc8_s6`** after `check_rfc_0117` in `validation/validate_all.py`:

```python
def evaluate_gc8_s6(attempt: dict, catalog: dict) -> dict:
    cap = int(catalog.get("storage_capacity") or 16)
    cargo_need = int(catalog.get("repair_cargo") or 1)
    storage = int(attempt.get("storage") or 0)
    op = attempt.get("op")
    if op == "repair":
        occupied = max(0, cap - storage)
        if occupied < cargo_need:
            return {"ok": False, "storage": storage, "reason": "NO_MATERIALS"}
        return {"ok": True, "storage": min(cap, storage + cargo_need), "reason": None}
    if op == "trade_cargo":
        giver = int(attempt.get("giver_storage") or 0)
        recv = int(attempt.get("receiver_storage") or 0)
        n = int(attempt.get("n") or 1)
        if giver > cap - n:
            return {"ok": False, "reason": "GIVER_NOT_CARRYING"}
        if recv < n:
            return {"ok": False, "reason": "RECEIVER_FULL"}
        return {"ok": True, "giver_storage": giver + n, "receiver_storage": recv - n, "reason": None}
    return {"ok": False, "reason": "UNKNOWN"}


def check_gc8_s6(Draft202012Validator) -> None:
    catalog = load_json(ROOT / "specs" / "economy-catalog.gc8-s6.json")
    rfc = (ROOT / "rfcs" / "RFC-0118-work-consumes-cargo.md").read_text(encoding="utf-8")
    if "**Accepted**" not in rfc.split("## Status", 1)[-1][:240]:
        fail("RFC-0118 must be Accepted")
    if catalog.get("new_verbs") or catalog.get("currency") or catalog.get("crypto") or catalog.get("watch_cargo"):
        fail("GC8-S6 must not add verbs, currency, crypto, or WATCH cargo")
    if not catalog.get("work_consumes_cargo"):
        fail("GC8-S6 must set work_consumes_cargo")
    empty = evaluate_gc8_s6({"op": "repair", "storage": 16}, catalog)
    if empty.get("ok") or empty.get("reason") != "NO_MATERIALS":
        fail(f"empty hold repair: {empty}")
    one = evaluate_gc8_s6({"op": "repair", "storage": 15}, catalog)
    if not one.get("ok") or one.get("storage") != 16:
        fail(f"one cargo repair: {one}")
    full = evaluate_gc8_s6({"op": "repair", "storage": 0}, catalog)
    if not full.get("ok") or full.get("storage") != 1:
        fail(f"full hold repair: {full}")
    trade = evaluate_gc8_s6(
        {"op": "trade_cargo", "giver_storage": 15, "receiver_storage": 16, "n": 1},
        catalog,
    )
    if not trade.get("ok") or trade.get("giver_storage") != 16 or trade.get("receiver_storage") != 15:
        fail(f"trade cargo: {trade}")
    ok("GC8-S6 work consumes cargo: catalog, RFC-0118 Accepted, no new verbs")
```

Call `check_gc8_s6(Draft202012Validator)` immediately after `check_rfc_0117` in `main()`.

- [ ] **Step 5: Run validation**

Run: `python3 validation/validate_all.py`

Expected: `OK: GC8-S6 work consumes cargo` and `PASS`

- [ ] **Step 6: Commit, PR, admin-squash merge Specs, restore `enforce_admins`**

```
feat(spec): RFC-0118 work consumes cargo
```

---

### Task 2: `cargo.ts` helpers (TDD)

**Files:**
- Create: `workers/noema/src/cargo.ts`
- Create: `workers/noema/test/cargo.test.ts`

**Interfaces:**
- Consumes: `STORAGE_CAPACITY` from `./construction`
- Produces:

```ts
export function occupiedHold(storage: number, cap?: number): number;
export function canConsumeCargo(storage: number, cargo: number, reserved?: number, cap?: number): boolean;
export function consumeCargo(budgets: { storage?: number }, cargo: number, cap?: number): void;
export function applyTradeStorage(
  giver: { storage?: number },
  receiver: { storage?: number },
  n: number,
  cap?: number,
): { ok: true } | { ok: false; code: "GIVER_NOT_CARRYING" | "RECEIVER_FULL" };
```

- [ ] **Step 1: Write failing tests** `workers/noema/test/cargo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STORAGE_CAPACITY } from "../src/construction";
import { applyTradeStorage, canConsumeCargo, consumeCargo, occupiedHold } from "../src/cargo";

describe("GC8-S6 cargo helpers", () => {
  it("occupied hold is capacity minus free storage", () => {
    expect(occupiedHold(16)).toBe(0);
    expect(occupiedHold(15)).toBe(1);
    expect(occupiedHold(0)).toBe(STORAGE_CAPACITY);
  });

  it("empty hold cannot consume cargo; full hold can", () => {
    expect(canConsumeCargo(16, 1)).toBe(false);
    expect(canConsumeCargo(15, 1)).toBe(true);
    expect(canConsumeCargo(0, 1)).toBe(true);
    expect(canConsumeCargo(15, 1, 1)).toBe(false);
  });

  it("consumeCargo frees storage and clamps at capacity", () => {
    const b = { storage: 0 };
    consumeCargo(b, 1);
    expect(b.storage).toBe(1);
    const fullFree = { storage: 16 };
    consumeCargo(fullFree, 1);
    expect(fullFree.storage).toBe(16);
  });

  it("TRADE cargo giver 15→16 receiver 16→15", () => {
    const g = { storage: 15 };
    const r = { storage: 16 };
    expect(applyTradeStorage(g, r, 1)).toEqual({ ok: true });
    expect(g.storage).toBe(16);
    expect(r.storage).toBe(15);
  });

  it("TRADE rejects empty giver and full receiver", () => {
    expect(applyTradeStorage({ storage: 16 }, { storage: 16 }, 1)).toEqual({
      ok: false,
      code: "GIVER_NOT_CARRYING",
    });
    expect(applyTradeStorage({ storage: 15 }, { storage: 0 }, 1)).toEqual({
      ok: false,
      code: "RECEIVER_FULL",
    });
  });
});
```

- [ ] **Step 2: Run to verify RED**

Run: `cd workers/noema && npx vitest run test/cargo.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement** `workers/noema/src/cargo.ts`:

```ts
import { STORAGE_CAPACITY } from "./construction";

export function occupiedHold(storage: number, cap = STORAGE_CAPACITY): number {
  return Math.max(0, cap - Math.max(0, Math.floor(storage)));
}

export function canConsumeCargo(
  storage: number,
  cargo: number,
  reserved = 0,
  cap = STORAGE_CAPACITY,
): boolean {
  const need = Math.max(0, Math.floor(cargo));
  if (need <= 0) return true;
  return occupiedHold(storage, cap) - Math.max(0, reserved) >= need;
}

export function consumeCargo(budgets: { storage?: number }, cargo: number, cap = STORAGE_CAPACITY): void {
  const need = Math.max(0, Math.floor(cargo));
  if (need <= 0) return;
  budgets.storage = Math.min(cap, Math.max(0, Math.floor(budgets.storage ?? 0)) + need);
}

export function applyTradeStorage(
  giver: { storage?: number },
  receiver: { storage?: number },
  n: number,
  cap = STORAGE_CAPACITY,
): { ok: true } | { ok: false; code: "GIVER_NOT_CARRYING" | "RECEIVER_FULL" } {
  const amt = Math.max(0, Math.floor(n));
  if (amt <= 0) return { ok: true };
  const gs = Math.max(0, Math.floor(giver.storage ?? 0));
  const rs = Math.max(0, Math.floor(receiver.storage ?? 0));
  if (!canConsumeCargo(gs, amt, 0, cap)) return { ok: false, code: "GIVER_NOT_CARRYING" };
  if (rs < amt) return { ok: false, code: "RECEIVER_FULL" };
  giver.storage = Math.min(cap, gs + amt);
  receiver.storage = rs - amt;
  return { ok: true };
}
```

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run test/cargo.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```
feat(play): cargo hold helpers for work-consumes-cargo
```

---

### Task 3: REPAIR consumes cargo

**Files:**
- Create: `workers/noema/test/gc8-s6.test.ts`
- Modify: `workers/noema/src/world-actions.ts` (REPAIR `canPay`/`debit` around the `baseRepair` / `repairCost` block ~L2691–2708)
- Modify: `workers/noema/src/actions.ts` `deriveAffordances` REPAIR available/reason ~L2857–2871

**Interfaces:**
- Consumes: `canConsumeCargo`, `consumeCargo` from Task 2
- Produces: REPAIR fail `You do not have materials in hold.` when occupied hold (minus reserved cargo) < cargo cost; success free storage +cargo

Repairable fixture: `enrichEntity` with `entity_type: "INFRASTRUCTURE"`, `infra_type: "relay"`, `condition: 40`, `label: "relay-trunk"`. ENTER_WORLD then set `budgets.storage`. Use `COMMIT` `{ operation: "REPAIR", entity_id }`. Player needs energy ≥ 3, compute ≥ 2.

Split `repairCost` into fuel vs cargo:

```ts
const cargoNeed = repairCost.storage || 0;
const fuel = { ...repairCost, storage: undefined };
if (!canPay(payFrom, fuel)) { /* existing energy/compute messages */ }
if (payFrom === pl.budgets && !canConsumeCargo(pl.budgets.storage ?? 0, cargoNeed, reservedCargoFor(w, principal.player_id))) {
  return fail(request_id, "BUDGET_EXCEEDED", "You do not have materials in hold.");
}
debit(payFrom, fuel);
if (payFrom === pl.budgets) consumeCargo(pl.budgets, cargoNeed);
else debit(payFrom, { storage: cargoNeed }); // institution treasury keeps old debit until a treasury RFC
```

Institution treasury: this slice only flips **player** hold. If `acting_for`, keep treasury `canPay`/`debit` including storage (org packs are not this RFC). Spec is player loop.

- [ ] **Step 1: Write failing world tests** in `test/gc8-s6.test.ts` (copy `principal` / `run` / `world` from `test/gc8-s4.test.ts`, add a repairable relay in the hub):

```ts
it("empty hold REPAIR fails materials in hold", async () => {
  const w = world();
  const p = principal("player.nacre");
  await run(w, p, "ENTER_WORLD");
  w.players[p.player_id].budgets.storage = 16;
  const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
  expect(r.ok).toBe(false);
  expect(r.error?.message).toBe("You do not have materials in hold.");
  expect(w.players[p.player_id].budgets.storage).toBe(16);
});

it("one cargo REPAIR frees storage", async () => {
  const w = world();
  const p = principal("player.nacre");
  await run(w, p, "ENTER_WORLD");
  w.players[p.player_id].budgets.storage = 15;
  const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
  expect(r.ok).toBe(true);
  expect(w.players[p.player_id].budgets.storage).toBe(16);
});

it("full hold REPAIR opens hold 0→1", async () => {
  const w = world();
  const p = principal("player.nacre");
  await run(w, p, "ENTER_WORLD");
  w.players[p.player_id].budgets.storage = 0;
  const r = await run(w, p, "COMMIT", { operation: "REPAIR", entity_id: "entity.relay" });
  expect(r.ok).toBe(true);
  expect(w.players[p.player_id].budgets.storage).toBe(1);
});
```

Affordance: after ENTER, set storage 16, LOOK, REPAIR reason is `You do not have materials in hold.` Energy/compute still the fallback when hold has cargo but fuel is short.

- [ ] **Step 2: Run RED**

Run: `npx vitest run test/gc8-s6.test.ts`

Expected: empty-hold case currently fails because `canPay` passes (storage 16 ≥ 1) or succeeds the repair.

- [ ] **Step 3: Implement REPAIR player path + affordance**

`deriveAffordances` REPAIR:

```ts
const repairCost = withWorkshopStorage({ ...COSTS.REPAIR }, workshopStorageDiscount(entities));
const fuel = { ...repairCost, storage: undefined };
const cargoNeed = repairCost.storage || 0;
const hasCargo = canConsumeCargo(budgets.storage ?? 0, cargoNeed);
const ok = canPay(budgets, fuel) && hasCargo;
reason: ok ? undefined : !hasCargo ? "You do not have materials in hold." : "You do not have enough energy or compute."
```

- [ ] **Step 4: GREEN** `npx vitest run test/gc8-s6.test.ts test/gc8-s4.test.ts`

Expected: PASS. Harvest-then-MOVE still cargo MOVE 2.

- [ ] **Step 5: Commit** `fix(play): REPAIR consumes cargo instead of free storage`

---

### Task 4: CONSTRUCT consumes cargo

**Files:**
- Modify: `workers/noema/src/world-actions.ts` CONSTRUCT cost block ~L2849–2858
- Modify: `workers/noema/test/gc8-s6.test.ts` (add construct cases)
- Test also: `workers/noema/test/construction.test.ts` (must stay green or update storage assertions that assumed debit)

**Interfaces:**
- Consumes: same helpers as Task 3
- Produces: CONSTRUCT fail `You do not have materials in hold.` when occupied < `storageNeed`; success `consumeCargo`

- [ ] **Step 1: Write failing construct tests** — empty hold construct rejects; storage 16−need after success when starting at 16-need.

- [ ] **Step 2: RED** `npx vitest run test/gc8-s6.test.ts test/construction.test.ts`

- [ ] **Step 3: Split CONSTRUCT `cost` into fuel + cargoNeed; `canPay` fuel; `canConsumeCargo`; `debit` fuel; `consumeCargo`.** Keep `spendLot` after consume. Institution/hidden/slot checks unchanged.

- [ ] **Step 4: GREEN**

- [ ] **Step 5: Commit** `fix(play): CONSTRUCT consumes cargo`

---

### Task 5: TRADE cargo sign + reserve

**Files:**
- Modify: `workers/noema/src/world-actions.ts` TRADE propose ~L2082–2098, accept requested/offered loops ~L2194–2233, cancel refund
- Modify: `workers/noema/test/gc8-s6.test.ts`

**Interfaces:**
- Consumes: `applyTradeStorage`, `canConsumeCargo`, `occupiedHold`
- Produces: propose `storage` does **not** `source.storage -=`; sets `reserved.storage`. Accept uses `applyTradeStorage`. Cancel does not refund storage (it was never deducted). Giver fail `You are not carrying that.` Receiver fail `They do not have enough free storage.`

`reservedCargoFor(w, playerId)`: sum `reserved.storage` on OPEN trades where this player is proposer (offered storage) or would give requested storage as counterparty only at accept time. For repair-while-open-offer: proposer offered storage N counts as reserved against occupied hold.

Propose offered storage:

```ts
if (key === "storage") {
  if (!canConsumeCargo(source.storage ?? 0, amt, alreadyReserved)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You are not carrying that.");
  }
  reserved[res] = amt;
  continue;
}
```

Accept offered storage: `applyTradeStorage(proposerBudgets, receiveInto, amt)` then map codes to messages.

Accept requested storage: `applyTradeStorage(payFrom, proposerDest, amt)` — counterparty is giver.

Do not invert energy/compute/influence.

- [ ] **Step 1: Failing tests**

```ts
it("TRADE storage is cargo 15→16 / 16→15", async () => { /* offer storage:1 want energy:1; accept */ });
it("TRADE rejects giver not carrying", async () => { /* proposer storage 16 */ });
it("TRADE rejects receiver pack full", async () => { /* counterparty storage 0 */ });
it("reserved cargo cannot REPAIR", async () => { /* storage 15, open offer storage 1, REPAIR fails materials */ });
```

- [ ] **Step 2: RED** then **Step 3: implement** then **Step 4: GREEN** `npx vitest run test/gc8-s6.test.ts test/trade-idempotency-security.test.ts test/diplomacy-s0.test.ts`

- [ ] **Step 5: Commit** `fix(play): TRADE storage moves cargo`

Open trades at deploy: accept uses new rule; fail with new copy; do not rewrite amounts.

---

### Task 6: Help copy

**Files:**
- Modify: `workers/noema/src/actions.ts` `helpText` harvest/repair/trade (~L3222–3242)
- Modify: `workers/noema/test/gc8-s6.test.ts`

**Interfaces:**
- Consumes: none
- Produces: exact strings from the design spec section 5

- [ ] **Step 1: Assert**

```ts
expect(helpText("harvest")).toMatch(/fills hold/);
expect(helpText("repair")).toMatch(/cargo 1 \(frees storage\)/);
expect(helpText("trade")).toMatch(/storage:.*cargo/i);
expect(helpText()).not.toMatch(/storage capped/i);
expect(helpText()).not.toMatch(/\bcrypto\b/i);
```

- [ ] **Step 2: RED** — harvest help currently “needs free storage” without “fills hold”

- [ ] **Step 3: Edit help strings**

HARVEST: `Costs: energy 2, compute 1 · fills hold · needs free storage`  
REPAIR: `Costs: energy 3, compute 2, and cargo 1 (frees storage).`  
TRADE: add `storage: on an offer is cargo. Giver frees hold; receiver must have free storage.`

- [ ] **Step 4: GREEN** `npx vitest run test/gc8-s6.test.ts test/gc8-s4.test.ts`

- [ ] **Step 5: Commit** `fix(play): help names cargo hold for work and TRADE`

---

### Task 7: Deploy and pin

**Files:**
- Modify: `spec-compat.json`, `docs/HOSTED-ALPHA-FREEZE.md`, `docs/ALPHA-RELEASE.md`, `workers/noema/test/hosted-alpha-freeze.test.ts`

- [ ] **Step 1:** Confirm Specs RFC-0118 is on `origin/main`. Note `specs_git`.
- [ ] **Step 2:** Admin-squash merge Worker PRs if not already on main.
- [ ] **Step 3:** `cd workers/noema && NOEMA_ENV=production npm run deploy` — record Worker version id.
- [ ] **Step 4:** UNFREEZE(play) pin runtime_git + worker_version_id + specs_git. Official client stays `noema-client==0.1.4`. Admission, seal, Genesis, verb set, rooms frozen.
- [ ] **Step 5:** `GET https://noema.guru/ready` still ACTIVE/HEALTHY. Do not Recover.

---

## Self-review

1. Spec coverage: loop table → Tasks 3–5; TRADE reserve → Task 5; copy → Task 6; migrate/WATCH → constraints + Task 7; harvest unchanged → Task 3 still runs gc8-s4; RFC-0117 untouched.
2. No TBD/TODO. Helpers named once in Task 2.
3. Institution treasury REPAIR keeps debit (explicit). Player path is the slice.
