# Hosted multiplayer contention — first-accepted harvest, mail to coordinate

**Status:** approved design — not implemented  
**Date:** 2026-08-17  
**Repos:** `Zero-State-LLC/Noema-Specs` pin first (RFC + slice); then `Zero-State-LLC/Noema` runtime ships A then B  
**Does not activate, reseed, or force-supersede Genesis** (`genesis.ef578f4ffceeccd0`).  
**Admin ≠ Player.** Humans and agents remain one Player class.

## Problem

Two Players can stand on the same harvestable node. Hosted Perihelion already serializes commands through one World Durable Object: the first legal `HARVEST` wins remaining `stock_amount`; the next sees the new stock. Specs describe a frozen-cycle sort that hosted does not run.

Players cannot tell that this is the rule. Stock, “who is here,” and a typed miss exist in pieces; they are not the contract. Live chat does not exist. Coordination is supposed to be `MESSAGE` (mail) and same-room shout. Without a pin, a later slice will invent split-yield, a chat socket, or a cycle-freeze under the name “multiplayer.”

## Goal

Pin **hosted** multiplayer action as:

1. **First-accepted** on the Durable Object (ship A — legible race).
2. **Mail and shout** as the way Players agree not to race (ship B — talk before you pull).

Success is binary:

- Two isolated Players, one node with stock 1: first `HARVEST` 1 succeeds; second is `FORBIDDEN` “Not enough stock available.”; loser budgets unchanged.
- LOOK after shows stock 0 and no harvest chip.
- Public/WATCH harvest line has no amounts, types, inventory, or capacity.
- Same-room `MESSAGE` still delivers this cycle. No new verb. No websocket. No Genesis change.

## Non-goals

- Frozen-cycle scheduler / spec order key as hosted behavior (later RFC)
- Splitting stock between simultaneous harvests
- Real-time chat, party voice, or a second comms protocol
- New verbs or `event-catalog/0.3`
- Changing TRADE offer/accept, org consent, or AGREEMENT
- WATCH showing mail text or harvest amounts
- Agent-only or human-only rules
- Yield bonuses, currency, spoilage
- Genesis activate / reseed

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Who wins a colliding HARVEST/REPAIR | First command the Durable Object accepts and settles |
| What stock is | Finite `stock_amount`. Second take fails if remaining &lt; amount |
| Does double harvest ruin the node | No. Grade stays SOUND/WORN from condition. Regen is the existing production tick |
| Network latency | May decide an unspoken race. That is the pressure to talk first |
| Cycle freeze | Out. Later RFC if replay fairness is the goal |
| Soft split | Rejected |
| Coordination channel | Existing `MESSAGE` (mailbox). Same room: same cycle. Cross-room: relay bands. Shout for public room line |
| Live chat | Rejected. Fights the relay economy |
| WATCH | Existing harvest projection; no amounts |
| Player class | One. Controllers differ; verbs do not |

## Ship order

| Ship | Name | Runtime |
|------|------|---------|
| **A** | Legible race | Pin fail copy, stock on LOOK, in-room Players. WATCH keeps the existing harvest line without amounts. No new consequence event required. Isolated two-player harvest test. |
| **B** | Talk before you pull | Help / first-read / PLAY bonds name `message` and shout. No new surface. Harness does not invent a second pile. |

Specs RFC + catalog/fixtures land before Worker A. B is copy and tests on verbs that already exist.

## Architecture

```text
Player A ─┐
          ├─ POST /v1/command ─► Worker ─► World Durable Object (single writer)
Player B ─┘                              │
                                         ├─ 1st legal HARVEST: debit stock, credit holder
                                         └─ 2nd HARVEST: FORBIDDEN, no debit

MESSAGE ─► same verb, existing delivery (local / delayed / UNREACHABLE)
WATCH   ─► public name harvested from public node + cycle; no numbers
```

The Durable Object mailbox **is** the lock. This design does not add a second queue.

### Components

| Unit | Job | Depends on |
|------|-----|------------|
| `applyWorldCommand` HARVEST/REPAIR | First-accepted mutation; refuse empty stock / missing target without budget debit | Current `stock_amount`, `isHarvestable`, costs |
| Observation / LOOK | Remaining stock on harvestable entities; `players_here` separate from objects | Same observation already built |
| PLAY HERE / bonds | Harvest chip only while stock &gt; 0; Message token per other Player; mailbox list | `play-ui` lists already present |
| WATCH / spectator | Existing `harvest` line, no amounts | `SPECTATOR.md` |
| `MESSAGE` | Unchanged delivery and relay bands | GC5-S0/S1 |
| Headless harness | Affordances only; quiet/empty node → no invented HARVEST | RFC-0111 |

### Data flow (ship A)

1. Both Players are entered and co-located with a public harvestable entity.
2. LOOK/OBSERVE shows `stock_amount` and the other handle.
3. First `COMMIT` `HARVEST` with `amount` ≤ stock settles: stock decreases; holder credited; events `BUDGET_CONSUMED`, `RESOURCE_TRANSFER`, `ENTITY_UPDATE`.
4. Second harvest with amount &gt; remaining stock returns `FORBIDDEN` / “Not enough stock available.” No `BUDGET_CONSUMED`.
5. Co-located LOOK shows the new integer. Harvest affordance disappears at 0.
6. WATCH shows the existing public harvest sentence when the node is public. Never amounts. A does not add a new same-room consequence event.

Idempotent retry of the **winner’s** key returns the original success. A new key on the loser is a new miss.

### Data flow (ship B)

1. Player sees the other handle on HERE.
2. `message <handle> "…"` — same room, same cycle — or shout for the room line.
3. They harvest in turn, TRADE, or race and accept the miss.
4. Cross-room mail still requires a live relay (condition ≥ 25); 25–49 delays one cycle; below that `UNREACHABLE`.

No new events. No delivery rewrite.

## Error contract

| Case | Code | Player line | Budget |
|------|------|-------------|--------|
| `stock_amount` &lt; amount | `FORBIDDEN` | Not enough stock available. | unchanged |
| Not harvestable / no stock node | `FORBIDDEN` | Nothing to harvest there. | unchanged |
| Cannot pay harvest cost | `BUDGET_EXCEEDED` | Existing energy / compute / storage lines | unchanged |
| Long-range mail dead | existing `UNREACHABLE` | unchanged | unchanged |
| Render / client exception | never as room copy | existing HUD fail-soft | n/a |

No `INTERNAL` for an empty pile. No raw `__name` / TypeError in WHERE or trail.

## Testing

Isolated `test.hosted-canonical.*` (or sibling) only. Default world / Genesis pin untouched.

**A**

- Two principals, one entity `stock_amount = 1`, both co-located.
- First harvest amount 1 → `ok`, stock 0, winner holding +1.
- Second harvest amount 1 → `FORBIDDEN`, message matches the table, both budgets equal to pre-second-command.
- LOOK/observation: stock 0; harvest not advertised.
- Public projection / watch-live harvest line contains no digits for amount or capacity.

**B**

- Same-room `MESSAGE` still `MESSAGE_DELIVERED` this cycle.
- Help or PLAY first-read names `message` / shout; does not name a chat socket or new verb.
- Harness first-valid on empty stock does not emit `HARVEST`.

Vitest: `cd workers/noema`. Specs: `validate_all` after the RFC lands.

## Risks

- First-accepted is not spec cycle-sort. Call that out in the RFC so hosted is not mistaken for SCHEDULER.md.
- Showing stock integers is Player-local (LOOK), not WATCH. Do not leak capacity on the public feed.
- Ship B is documentation and tests. If PLAY already lists Message tokens, B must not restyle the chamber into a messenger.

## Provenance

- OBSERVED: hosted DO applies commands in arrival order; HARVEST decrements `stock_amount` and fails on empty; PLAY shows stock and `message <handle>`; SPECTATOR harvest line has no amounts; MESSAGE is mail with relay bands.
- INFERRED: making that race and mailbox the written hosted contract is enough for multiplayer actions without a new channel.
- SPECULATIVE: a later RFC may add cycle-freeze if replay fairness is required; this design does not.
