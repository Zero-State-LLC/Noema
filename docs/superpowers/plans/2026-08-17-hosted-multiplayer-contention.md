# Hosted Multiplayer Contention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin hosted multiplayer as first-accepted harvest on the World Durable Object, with existing `MESSAGE`/shout as coordination — no live chat, no cycle freeze, no new verbs.

**Architecture:** Specs RFC-0113 + slice + catalog + fixtures first. Then isolated Worker tests that lock the already-serialized HARVEST miss and LOOK stock. Then help/first-read copy so Players are told to mail before they pull. Genesis pin untouched.

**Tech Stack:** Noema-Specs (Markdown RFC, JSON Schema 2020-12, `validation/validate_all.py`). Noema Worker (`applyWorldCommand`, `helpText`, vitest in `workers/noema`).

## Global Constraints

- Design: `docs/superpowers/specs/2026-08-17-hosted-multiplayer-contention-design.md`
- Specs first: RFC + catalog + `validate_all` on `Zero-State-LLC/Noema-Specs`, then runtime on `Zero-State-LLC/Noema`
- Do not activate, reseed, or force-supersede Genesis (`genesis.ef578f4ffceeccd0`)
- Admin ≠ Player. Humans and agents remain one Player class
- No new verbs, events, or `event-catalog/0.3`
- No frozen-cycle scheduler, no stock split, no websocket chat
- WATCH harvest line: no amounts, types, inventory, or capacity
- Miss copy: `FORBIDDEN` / `Not enough stock available.` — no budget debit
- Vitest always `cd workers/noema`
- Specs validate: `cd <specs-worktree> && python3 validation/validate_all.py`
- Authors cannot approve own PRs. Merge: DELETE `repos/Zero-State-LLC/{Noema-Specs,Noema}/branches/main/protection/enforce_admins`, `gh pr merge --admin --squash --repo Zero-State-LLC/{Noema-Specs,Noema}`, POST `enforce_admins` empty body
- Deploy only after Noema runtime PR: `cd workers/noema && NOEMA_ENV=production npm run deploy`

## File map

| File | Job |
|------|-----|
| `Noema-Specs/rfcs/RFC-0113-hosted-multiplayer-contention.md` | Accepted RFC |
| `Noema-Specs/docs/HOSTED-MP-CONTENTION.md` | Slice contract |
| `Noema-Specs/specs/hosted-mp-catalog.s0.json` | Pins (first_accepted, miss line, no live chat) |
| `Noema-Specs/specs/hosted-mp-catalog.s0.schema.json` | Catalog schema |
| `Noema-Specs/specs/hosted-mp-attempt.s0.schema.json` | Attempt schema |
| `Noema-Specs/examples/hosted-mp-s0/*.json` | ACCEPT/REJECT fixtures |
| `Noema-Specs/validation/validate_all.py` | `evaluate_hosted_mp_s0` + `check_hosted_mp_s0` |
| `Noema-Specs/docs/ACTION-CONTRACTS.md` | Point HARVEST contention at hosted first-accepted |
| `Noema-Specs/docs/COMMUNICATION-ECOLOGY.md` | Mail is coordination; no live chat |
| `Noema/workers/noema/test/hosted-mp-contention.test.ts` | Two-player harvest race + LOOK + WATCH digits |
| `Noema/workers/noema/src/world-actions.ts` | Only if miss copy/debit is not already exact |
| `Noema/workers/noema/src/actions.ts` | `helpText("harvest")` / `helpText("message")` talk-first lines |
| `Noema/tests/test_harness_autonomous.py` | Empty stock does not propose HARVEST |
| `Noema/docs/AGENT-STAGE0.md` | One line: race then MESSAGE |

---

### Task 1: Specs worktree

**Files:** none in-repo yet

**Interfaces:**
- Consumes: `origin/main` of `Zero-State-LLC/Noema-Specs` (must include RFC-0112 / `72f7fef` or later)
- Produces: worktree path and branch `feat/hosted-mp-contention`

- [ ] **Step 1: Create the worktree**

```bash
git -C /home/scrimshawlife/Noema-Specs fetch origin main
git -C /home/scrimshawlife/Noema-Specs worktree add -b feat/hosted-mp-contention \
  /home/scrimshawlife/work/Noema-Specs-mp origin/main
cd /home/scrimshawlife/work/Noema-Specs-mp
git log -1 --oneline
```

Expected: HEAD includes `RFC-0112-parameter-access.md`. If `/home/scrimshawlife/Noema-Specs` is missing, use any clone that remotes `Zero-State-LLC/Noema-Specs`.

- [ ] **Step 2: Confirm RFC-0113 is free**

```bash
ls rfcs/RFC-0113* 2>/dev/null; test ! -e rfcs/RFC-0113-hosted-multiplayer-contention.md
```

Expected: no such file.

---

### Task 2: Failing Specs check (TDD)

**Files:**
- Modify: `validation/validate_all.py` (insert after `check_gc1_s8` ~line 3326; call after `check_gc1_s8(...)` ~line 9601)

**Interfaces:**
- Consumes: nothing yet
- Produces: `evaluate_hosted_mp_s0(attempt: dict, catalog: dict) -> tuple[str, str | None]` and `check_hosted_mp_s0(Draft202012Validator) -> None`

- [ ] **Step 1: Add the evaluator and check that fail closed until files exist**

Insert immediately after `check_gc1_s8`:

```python
def evaluate_hosted_mp_s0(attempt: dict, catalog: dict) -> tuple[str, str | None]:
    if attempt.get("live_chat") or attempt.get("split_stock") or attempt.get("cycle_freeze"):
        return "REJECT", "DOCTRINE"
    if attempt.get("new_verb"):
        return "REJECT", "NEW_VERB"
    stock = int(attempt.get("stock") or 0)
    first = int(attempt.get("first_amount") or 0)
    second = int(attempt.get("second_amount") or 0)
    miss = catalog.get("miss_line") or "Not enough stock available."
    if first < 1 or first > stock:
        return "REJECT", "FIRST_INVALID"
    remaining = stock - first
    if second > remaining:
        attempt["_miss_line"] = miss
        return "REJECT", "NOT_ENOUGH_STOCK"
    return "ACCEPT", None


def check_hosted_mp_s0(Draft202012Validator) -> None:
    catalog_path = ROOT / "specs" / "hosted-mp-catalog.s0.json"
    if not catalog_path.exists():
        fail("hosted-mp-catalog.s0.json missing")
    catalog = load_json(catalog_path)
    catalog_schema = load_json(ROOT / "specs" / "hosted-mp-catalog.s0.schema.json")
    attempt_schema = load_json(ROOT / "specs" / "hosted-mp-attempt.s0.schema.json")
    errs = list(Draft202012Validator(catalog_schema).iter_errors(catalog))
    if errs:
        fail(f"hosted-mp catalog invalid: {errs[0].message}")
    if catalog.get("new_verbs") or catalog.get("new_events") or catalog.get("live_chat"):
        fail("hosted-mp must not add verbs, events, or live chat")
    if catalog.get("resolution") != "first_accepted":
        fail("hosted-mp resolution must be first_accepted")
    if catalog.get("miss_line") != "Not enough stock available.":
        fail("hosted-mp must pin miss_line")
    if catalog.get("watch_amounts"):
        fail("hosted-mp must forbid WATCH amounts")
    rfc = (ROOT / "rfcs" / "RFC-0113-hosted-multiplayer-contention.md").read_text(encoding="utf-8")
    if "**Accepted**" not in rfc.split("## Status", 1)[-1][:240]:
        fail("RFC-0113 must be Accepted")
    slice_doc = (ROOT / "docs" / "HOSTED-MP-CONTENTION.md").read_text(encoding="utf-8")
    if "first-accepted" not in slice_doc.lower() or "MESSAGE" not in slice_doc or "live chat" not in slice_doc.lower():
        fail("HOSTED-MP-CONTENTION must pin first-accepted, MESSAGE, and reject live chat")
    attempt_v = Draft202012Validator(attempt_schema)
    for name in (
        "attempt-first-ok.json",
        "attempt-second-empty.json",
        "attempt-split.json",
        "attempt-live-chat.json",
        "attempt-new-verb.json",
    ):
        fixture = load_json(ROOT / "examples" / "hosted-mp-s0" / name)
        ferrs = list(attempt_v.iter_errors(fixture))
        if ferrs:
            fail(f"{name} invalid: {ferrs[0].message}")
        outcome, reason = evaluate_hosted_mp_s0(fixture, catalog)
        exp = fixture["expected"]
        if outcome != exp["outcome"]:
            fail(f"{name}: got {outcome} expected {exp['outcome']}")
        if exp.get("reason") and reason != exp["reason"]:
            fail(f"{name}: reason {reason} expected {exp['reason']}")
    ok("hosted-mp S0: catalog, fixtures, RFC-0113 Accepted")
```

In `main`, immediately after `check_gc1_s8(Draft202012Validator)` add:

```python
    check_hosted_mp_s0(Draft202012Validator)
```

- [ ] **Step 2: Run validate_all to verify it fails**

```bash
cd /home/scrimshawlife/work/Noema-Specs-mp && python3 validation/validate_all.py
```

Expected: FAIL with `hosted-mp-catalog.s0.json missing` (or the first missing file).

- [ ] **Step 3: Commit the failing check**

```bash
git add validation/validate_all.py
git commit -m "test(spec): fail closed until hosted-mp RFC-0113 catalog exists"
```

---

### Task 3: RFC, slice, catalog, fixtures

**Files:**
- Create: `rfcs/RFC-0113-hosted-multiplayer-contention.md`
- Create: `docs/HOSTED-MP-CONTENTION.md`
- Create: `specs/hosted-mp-catalog.s0.json`
- Create: `specs/hosted-mp-catalog.s0.schema.json`
- Create: `specs/hosted-mp-attempt.s0.schema.json`
- Create: `examples/hosted-mp-s0/attempt-first-ok.json`
- Create: `examples/hosted-mp-s0/attempt-second-empty.json`
- Create: `examples/hosted-mp-s0/attempt-split.json`
- Create: `examples/hosted-mp-s0/attempt-live-chat.json`
- Create: `examples/hosted-mp-s0/attempt-new-verb.json`

**Interfaces:**
- Consumes: `evaluate_hosted_mp_s0` / `check_hosted_mp_s0`
- Produces: Accepted RFC-0113 artifacts that make `validate_all` pass this check

- [ ] **Step 1: Write the catalog**

`specs/hosted-mp-catalog.s0.json`:

```json
{
  "schema_version": "hosted-mp-catalog/s0",
  "catalog_id": "hosted-mp-catalog/s0",
  "slice_id": "hosted-mp-s0",
  "authority": "docs/HOSTED-MP-CONTENTION.md",
  "rfc": "rfcs/RFC-0113-hosted-multiplayer-contention.md",
  "resolution": "first_accepted",
  "miss_line": "Not enough stock available.",
  "miss_code": "FORBIDDEN",
  "new_verbs": [],
  "new_events": [],
  "live_chat": false,
  "cycle_freeze": false,
  "split_stock": false,
  "watch_amounts": false,
  "coordination_verb": "MESSAGE"
}
```

- [ ] **Step 2: Write catalog and attempt schemas**

`specs/hosted-mp-catalog.s0.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://noema.guru/specs/hosted-mp-catalog.s0.schema.json",
  "type": "object",
  "required": [
    "schema_version",
    "catalog_id",
    "slice_id",
    "resolution",
    "miss_line",
    "new_verbs",
    "new_events",
    "live_chat",
    "watch_amounts",
    "coordination_verb"
  ],
  "properties": {
    "schema_version": { "const": "hosted-mp-catalog/s0" },
    "catalog_id": { "type": "string" },
    "slice_id": { "const": "hosted-mp-s0" },
    "authority": { "type": "string" },
    "rfc": { "type": "string" },
    "resolution": { "const": "first_accepted" },
    "miss_line": { "type": "string" },
    "miss_code": { "type": "string" },
    "new_verbs": { "type": "array", "maxItems": 0 },
    "new_events": { "type": "array", "maxItems": 0 },
    "live_chat": { "const": false },
    "cycle_freeze": { "const": false },
    "split_stock": { "const": false },
    "watch_amounts": { "const": false },
    "coordination_verb": { "const": "MESSAGE" }
  },
  "additionalProperties": false
}
```

`specs/hosted-mp-attempt.s0.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://noema.guru/specs/hosted-mp-attempt.s0.schema.json",
  "type": "object",
  "required": ["attempt_id", "expected"],
  "properties": {
    "attempt_id": { "type": "string" },
    "stock": { "type": "integer", "minimum": 0 },
    "first_amount": { "type": "integer", "minimum": 0 },
    "second_amount": { "type": "integer", "minimum": 0 },
    "live_chat": { "type": "boolean" },
    "split_stock": { "type": "boolean" },
    "cycle_freeze": { "type": "boolean" },
    "new_verb": { "type": "string" },
    "expected": {
      "type": "object",
      "required": ["outcome"],
      "properties": {
        "outcome": { "enum": ["ACCEPT", "REJECT"] },
        "reason": { "type": "string" }
      }
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 3: Write fixtures**

`examples/hosted-mp-s0/attempt-first-ok.json`:

```json
{
  "attempt_id": "first-ok",
  "stock": 2,
  "first_amount": 1,
  "second_amount": 1,
  "expected": { "outcome": "ACCEPT" }
}
```

`examples/hosted-mp-s0/attempt-second-empty.json`:

```json
{
  "attempt_id": "second-empty",
  "stock": 1,
  "first_amount": 1,
  "second_amount": 1,
  "expected": { "outcome": "REJECT", "reason": "NOT_ENOUGH_STOCK" }
}
```

`examples/hosted-mp-s0/attempt-split.json`:

```json
{
  "attempt_id": "split",
  "stock": 2,
  "first_amount": 1,
  "second_amount": 1,
  "split_stock": true,
  "expected": { "outcome": "REJECT", "reason": "DOCTRINE" }
}
```

`examples/hosted-mp-s0/attempt-live-chat.json`:

```json
{
  "attempt_id": "live-chat",
  "stock": 1,
  "first_amount": 1,
  "second_amount": 0,
  "live_chat": true,
  "expected": { "outcome": "REJECT", "reason": "DOCTRINE" }
}
```

`examples/hosted-mp-s0/attempt-new-verb.json`:

```json
{
  "attempt_id": "new-verb",
  "stock": 1,
  "first_amount": 1,
  "second_amount": 0,
  "new_verb": "CHAT",
  "expected": { "outcome": "REJECT", "reason": "NEW_VERB" }
}
```

- [ ] **Step 4: Write slice `docs/HOSTED-MP-CONTENTION.md`**

Use this body (do not add verbs or cycle-freeze):

```markdown
# Hosted multiplayer contention — first-accepted harvest

**Status:** Executable specification. Specs-only until hosted tests land.  
**RFC:** [RFC-0113](../rfcs/RFC-0113-hosted-multiplayer-contention.md)  
**Does not open:** new verbs · live chat · cycle-freeze scheduler · stock split · Genesis change

Hosted Perihelion serializes `POST /v1/command` on one World Durable Object. The first legal `HARVEST` or `REPAIR` that settles wins remaining stock or the repair. The next command reads the new world.

## Doctrine

| Temptation | Verdict |
|------------|---------|
| First-accepted on the Durable Object | **ACCEPT.** |
| Frozen-cycle sort as hosted | **REJECT.** Later RFC |
| Split the pile | **REJECT.** |
| Live chat / websocket | **REJECT.** Fights the relay |
| New CHAT verb | **REJECT.** `MESSAGE` is mail |

## Slice contract

| Field | Value |
|-------|--------|
| Slice id | `hosted-mp-s0` |
| Resolution | first-accepted |
| Miss | `FORBIDDEN` · Not enough stock available. |
| Budget on miss | unchanged |
| Coordination | existing `MESSAGE` (same-room same-cycle; cross-room relay bands) and shout |
| WATCH | existing harvest line; no amounts |

Stock is finite `stock_amount`. Grade is SOUND/WORN from condition. Regen is the existing production tick.
```

- [ ] **Step 5: Write `rfcs/RFC-0113-hosted-multiplayer-contention.md`**

```markdown
# RFC-0113 — Hosted multiplayer contention

## Status

**Accepted**

Specification-only until hosted tests. No new verbs. No live chat. No cycle freeze.

## Problem

Two Players can harvest the same node. Hosted already serializes on one Durable Object, but nothing pins that as the multiplayer rule. Implementers invent split-yield, chat sockets, or a full scheduler.

## Proposed change

Accept [HOSTED-MP-CONTENTION.md](../docs/HOSTED-MP-CONTENTION.md). Hosted colliding `HARVEST`/`REPAIR` is first-accepted. Empty stock is `FORBIDDEN` “Not enough stock available.” Coordination is existing `MESSAGE` and shout.

Catalog: [`hosted-mp-catalog.s0.json`](../specs/hosted-mp-catalog.s0.json).

## Alternatives rejected

| Alternative | Why |
|-------------|-----|
| Cycle-freeze sort | Separate RFC; changes PLAY/WAIT |
| Soft split | Kills the coordination game |
| Live chat | Fights relay economy |

## Compatibility

Additive documentation of current hosted writer. Worlds that already fail empty harvest stay compatible.

## Data / security

No new events. WATCH must not gain amounts or mail text.

## Validation

`check_hosted_mp_s0`: first-ok ACCEPT; second-empty REJECT NOT_ENOUGH_STOCK; split/live-chat/new-verb REJECT.

## Rollback

Ignore the slice. Existing HARVEST miss still applies.

## Unresolved

Frozen-cycle hosted scheduler (later RFC).
```

- [ ] **Step 6: Run validate_all**

```bash
cd /home/scrimshawlife/work/Noema-Specs-mp && python3 validation/validate_all.py
```

Expected: PASS (or only pre-existing failures unrelated to `hosted-mp`; `check_hosted_mp_s0` must print ok).

- [ ] **Step 7: Commit**

```bash
git add rfcs/RFC-0113-hosted-multiplayer-contention.md \
  docs/HOSTED-MP-CONTENTION.md \
  specs/hosted-mp-catalog.s0.json \
  specs/hosted-mp-catalog.s0.schema.json \
  specs/hosted-mp-attempt.s0.schema.json \
  examples/hosted-mp-s0
git commit -m "feat(spec): RFC-0113 hosted first-accepted harvest + mail"
```

---

### Task 4: Specs pointers and merge

**Files:**
- Modify: `docs/ACTION-CONTRACTS.md` (HARVEST section after spectator_projection)
- Modify: `docs/COMMUNICATION-ECOLOGY.md` (after the MESSAGE verb preserve line)
- Modify: `CHANGELOG.md` (Added)
- Modify: `rfcs/README.md` if it lists RFC numbers

**Interfaces:**
- Consumes: RFC-0113
- Produces: merged Specs `main`

- [ ] **Step 1: Point HARVEST at hosted first-accepted**

After the HARVEST `spectator_projection` row in `docs/ACTION-CONTRACTS.md` add:

```markdown
Hosted colliding harvests: first command the World Durable Object accepts wins remaining `available`/`stock_amount`. The next is `FORBIDDEN` “Not enough stock available.” with no debit. This is not the frozen-cycle order in [SCHEDULER.md](SCHEDULER.md). See [HOSTED-MP-CONTENTION.md](HOSTED-MP-CONTENTION.md).
```

- [ ] **Step 2: Point comms at mail, not chat**

In `docs/COMMUNICATION-ECOLOGY.md` after “Preserves: `MESSAGE` as the stable verb” add:

```markdown
Hosted coordination uses this verb (mailbox) and existing shout/board surfaces. Do not add a live-chat protocol. [HOSTED-MP-CONTENTION.md](HOSTED-MP-CONTENTION.md).
```

- [ ] **Step 3: CHANGELOG Added bullet**

```markdown
- RFC-0113 / HOSTED-MP-CONTENTION: hosted first-accepted harvest; MESSAGE remains mail; no live chat.
```

- [ ] **Step 4: Validate and commit**

```bash
cd /home/scrimshawlife/work/Noema-Specs-mp && python3 validation/validate_all.py
git add docs/ACTION-CONTRACTS.md docs/COMMUNICATION-ECOLOGY.md CHANGELOG.md rfcs/README.md
git commit -m "docs(spec): point HARVEST contention and mail at RFC-0113"
```

- [ ] **Step 5: PR + admin-merge Specs**

```bash
git push -u origin feat/hosted-mp-contention
gh pr create --repo Zero-State-LLC/Noema-Specs --base main --head feat/hosted-mp-contention \
  --title "feat(spec): RFC-0113 hosted first-accepted harvest + mail" \
  --body "Pins hosted colliding HARVEST as first-accepted. Coordination is MESSAGE. No live chat, no cycle freeze, no new verbs."
gh api --method DELETE repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins
gh pr merge --admin --squash --repo Zero-State-LLC/Noema-Specs
gh api --method POST repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins --input - <<'EOF'
{}
EOF
```

---

### Task 5: Noema worktree + failing two-player harvest test (ship A)

**Files:**
- Create: `workers/noema/test/hosted-mp-contention.test.ts`

**Interfaces:**
- Consumes: `applyWorldCommand`, existing `FORBIDDEN` / stock decrement
- Produces: isolated test that two Players cannot both take stock 1

- [ ] **Step 1: Create Noema worktree from `origin/main`**

```bash
git -C /home/scrimshawlife/Noema fetch origin main
git -C /home/scrimshawlife/Noema worktree add -b feat/hosted-mp-contention \
  /home/scrimshawlife/work/Noema-mp origin/main
```

- [ ] **Step 2: Write the failing (or pinning) test**

Create `workers/noema/test/hosted-mp-contention.test.ts` with this body (adapt imports if `enrichEntity` already sets `stock_amount` on the cache; if not, set `stock_resource` + `stock_amount: 1` explicitly):

```typescript
import { describe, expect, it } from "vitest";
import { enrichEntity } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { buildWatchLive } from "../src/watch-live";

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.mp",
    controller_id: `ctrl.human.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  const node = enrichEntity({
    entity_id: "entity.cell",
    label: "cell",
    entity_type: "INFRASTRUCTURE",
    stock_resource: "energy",
    stock_amount: 1,
    harvestable: true,
  });
  return {
    world_id: "test.hosted-canonical.mp-s0",
    world_name: "Test Reach",
    cycle: 4,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor.",
        exits: [],
        entities: [node],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `req.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `idem.${p.player_id}.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("hosted-mp S0 first-accepted harvest", () => {
  it("second harvest on stock 1 is FORBIDDEN with no debit", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    expect((await run(w, a, "ENTER_WORLD")).ok).toBe(true);
    expect((await run(w, b, "ENTER_WORLD")).ok).toBe(true);
    const first = await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(first.ok).toBe(true);
    const energyBefore = w.players[b.player_id].budgets.energy;
    const computeBefore = w.players[b.player_id].budgets.compute;
    const second = await run(w, b, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    expect(second.ok).toBe(false);
    expect(second.error?.code).toBe("FORBIDDEN");
    expect(second.error?.message).toBe("Not enough stock available.");
    expect(w.players[b.player_id].budgets.energy).toBe(energyBefore);
    expect(w.players[b.player_id].budgets.compute).toBe(computeBefore);
    const cell = w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.cell");
    expect(cell?.stock_amount).toBe(0);
  });

  it("LOOK after the race shows stock 0 and the other Player", async () => {
    const w = world();
    const a = principal("player.nacre");
    const b = principal("player.vesper");
    await run(w, a, "ENTER_WORLD");
    await run(w, b, "ENTER_WORLD");
    await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    const look = await run(w, b, "LOOK");
    expect(look.ok).toBe(true);
    const cell = look.observation?.location?.entities?.find((e) => e.entity_id === "entity.cell");
    expect(cell?.stock_amount ?? 0).toBe(0);
    expect(cell?.harvestable).toBeFalsy();
    const here = look.observation?.players_here || [];
    expect(here.some((p: { player_id?: string }) => p.player_id === "player.nacre")).toBe(true);
  });

  it("WATCH harvest line has no amounts", async () => {
    const w = world();
    const a = principal("player.nacre");
    await run(w, a, "ENTER_WORLD");
    await run(w, a, "COMMIT", { operation: "HARVEST", entity_id: "entity.cell", amount: 1 });
    const live = buildWatchLive(w as never);
    const blob = JSON.stringify(live);
    expect(blob).not.toMatch(/harvested from[\s\S]{0,80}\b\d+\b/i);
    expect(blob).not.toMatch(/"stock_amount"\s*:\s*\d+/);
  });
});
```

If `buildWatchLive` signature differs, use the existing call from `workers/noema/test/watch-live.test.ts` and assert the public harvest sentence contains no digits for amount/capacity. If `buildWatchLive` will not compile against `WorldRuntime`, drop that one `it` and instead assert `JSON.stringify(first.events)` public payload has no capacity field — still no WATCH amounts.

- [ ] **Step 3: Run the test**

```bash
cd /home/scrimshawlife/work/Noema-mp/workers/noema && npx vitest run test/hosted-mp-contention.test.ts --reporter=dot
```

Expected: FAIL only if copy/debit/LOOK/WATCH already violate the pin. If all three pass, the runtime already matches ship A — keep the file as the pin.

- [ ] **Step 4: Fix only if a test failed**

Miss copy lives in `workers/noema/src/world-actions.ts` HARVEST branch (~2695):

```typescript
if ((entity.stock_amount ?? 0) < amount) {
  return fail(request_id, "FORBIDDEN", "Not enough stock available.");
}
```

Do not debit before this check. Do not add events on miss.

- [ ] **Step 5: Re-run and commit**

```bash
cd /home/scrimshawlife/work/Noema-mp/workers/noema && npx vitest run test/hosted-mp-contention.test.ts --reporter=dot
git add workers/noema/test/hosted-mp-contention.test.ts workers/noema/src/world-actions.ts
git commit -m "test(play): pin first-accepted harvest miss and LOOK stock"
```

---

### Task 6: Ship B — help copy + harness + docs

**Files:**
- Modify: `workers/noema/src/actions.ts` (`helpText` harvest and message branches ~3115–3123)
- Modify: `workers/noema/test/hosted-mp-contention.test.ts` (add help cases)
- Modify: `tests/test_harness_autonomous.py` (empty-stock does not HARVEST)
- Modify: `docs/AGENT-STAGE0.md` (one coordination sentence)

**Interfaces:**
- Consumes: `helpText(topic: string): string`
- Produces: help names finite stock + `message`; harness skips empty pile

- [ ] **Step 1: Add failing help assertions to the vitest file**

```typescript
import { helpText } from "../src/actions";

describe("hosted-mp S0 talk first", () => {
  it("help harvest names finite stock and message, not chat", () => {
    const h = helpText("harvest");
    expect(h).toMatch(/finite|Not enough stock/i);
    expect(h).toMatch(/message/i);
    expect(h).not.toMatch(/websocket|live chat|real-time chat/i);
  });
  it("help message stays mail", () => {
    const h = helpText("message");
    expect(h).toMatch(/message <player>/i);
    expect(h).toMatch(/private|not on WATCH/i);
    expect(h).not.toMatch(/websocket|live chat/i);
  });
});
```

- [ ] **Step 2: Run to see fail**

```bash
cd /home/scrimshawlife/work/Noema-mp/workers/noema && npx vitest run test/hosted-mp-contention.test.ts --reporter=dot
```

Expected: FAIL — help harvest lacks finite/message lines.

- [ ] **Step 3: Implement help lines**

Replace the harvest and message branches in `helpText`:

```typescript
  } else if (t === "harvest") {
    lines.push("HARVEST");
    lines.push("  harvest <resource-node> [amount]");
    lines.push("  Costs: energy 2, compute 1 · needs free storage");
    lines.push("  Stock is finite. First accepted take wins. Empty: Not enough stock available.");
    lines.push("  Talk first: message <player> \"text\" (same room, this cycle). No live chat.");
  } else if (t === "message") {
    lines.push("MESSAGE");
    lines.push("  message <player> \"text\"");
    lines.push("  Costs: compute 1 · private (not on WATCH)");
    lines.push("  Same room delivers this cycle. Far rooms need a live relay. Mail, not a chat.");
```

- [ ] **Step 4: Harness empty-stock test**

Append to `tests/test_harness_autonomous.py`:

```python
def empty_stock_obs() -> dict:
    q = quiet_obs()
    q["location"]["entities"] = [
        {
            "entity_id": "entity.cell",
            "label": "cell",
            "entity_type": "INFRASTRUCTURE",
            "condition": 80,
            "repairable": False,
            "harvestable": False,
            "stock_amount": 0,
        }
    ]
    q["available_actions"] = ["LOOK", "WAIT", "MOVE", "OBSERVE"]
    q["affordances"] = [
        {
            "action": "MOVE",
            "verb": "MOVE",
            "label": "Move west",
            "cmd": "move west",
            "available": True,
            "kind": "move",
        }
    ]
    q["situation"] = {"place": "Grid Anchor", "strain": "An organization acted"}
    return q


def test_empty_stock_does_not_invent_harvest():
    http = FakeGateway(empty_stock_obs())
    client = GatewayClient("https://noema.guru", StaticTokenProvider("tok"), http=http)
    harness = HeadlessHarness(client, FirstValidAffordanceAdapter(), HarnessPolicy(cooldown_seconds=0))
    run = harness.run_unattended(max_turns=4)
    cmds = [p["body"]["command"] for p in http.posts if p.get("body")]
    assert run.orientation_ok
    assert "COMMIT" not in cmds
    assert "HARVEST" not in cmds
    assert "WAIT" in cmds or "MOVE" in cmds
```

- [ ] **Step 5: AGENT-STAGE0 one sentence**

After the unattended `run` paragraph in `docs/AGENT-STAGE0.md` add:

```markdown
Colliding harvests are first-accepted. Coordinate with `MESSAGE` (mailbox), not a chat socket.
```

- [ ] **Step 6: Run tests and commit**

```bash
cd /home/scrimshawlife/work/Noema-mp/workers/noema && npx vitest run test/hosted-mp-contention.test.ts --reporter=dot
cd /home/scrimshawlife/work/Noema-mp && /home/scrimshawlife/.local/bin/pytest tests/test_harness_autonomous.py -q --tb=short
git add workers/noema/src/actions.ts workers/noema/test/hosted-mp-contention.test.ts \
  tests/test_harness_autonomous.py docs/AGENT-STAGE0.md
git commit -m "feat(play): help harvest names finite stock and mail"
```

Expected: vitest pass; pytest pass.

---

### Task 7: Noema PR, merge, deploy

**Files:** none new

**Interfaces:**
- Consumes: feat/hosted-mp-contention on Noema
- Produces: `main` + production Worker

- [ ] **Step 1: Push and open PR**

```bash
cd /home/scrimshawlife/work/Noema-mp
git push -u origin feat/hosted-mp-contention
gh pr create --repo Zero-State-LLC/Noema --base main --head feat/hosted-mp-contention \
  --title "feat(play): pin first-accepted harvest and mail coordination" \
  --body "Ship A: two-player stock-1 race. Ship B: help harvest/message. No new verbs, no chat, no Genesis change."
```

- [ ] **Step 2: Admin-merge**

```bash
gh api --method DELETE repos/Zero-State-LLC/Noema/branches/main/protection/enforce_admins
gh pr merge --admin --squash --repo Zero-State-LLC/Noema
gh api --method POST repos/Zero-State-LLC/Noema/branches/main/protection/enforce_admins --input - <<'EOF'
{}
EOF
```

- [ ] **Step 3: Deploy and check pin**

```bash
cd /home/scrimshawlife/work/Noema-mp/workers/noema
git fetch origin main && git checkout --detach origin/main
NOEMA_ENV=production npm run deploy
curl -sS https://noema.guru/ready
```

Expected: `genesis_id` remains `genesis.ef578f4ffceeccd0`; `status` ACTIVE; `play_blocked` false.

---

## Spec coverage

| Design requirement | Task |
|--------------------|------|
| First-accepted hosted rule | 3, 5 |
| Finite stock; miss line; no debit | 3, 5 |
| No split / no live chat / no new verbs | 3 fixtures |
| LOOK stock 0; players_here | 5 |
| WATCH no amounts | 5 |
| MESSAGE mail + shout | 3, 6 |
| Harness no invented HARVEST | 6 |
| Specs then runtime | 1–4 then 5–7 |
| No Genesis change | Global + Task 7 ready check |

## Placeholder scan

No TBD, TODO, or “implement later.” Help strings, fixtures, and test bodies are written in full.

## Type consistency

- `evaluate_hosted_mp_s0(attempt, catalog) -> (outcome, reason)`
- Catalog `resolution: "first_accepted"`, `miss_line: "Not enough stock available."`
- Runtime miss `FORBIDDEN` + that exact message
- Isolation world id `test.hosted-canonical.mp-s0`
