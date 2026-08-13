# Runtime readiness audit — 2026-08-13

**Kind:** hosted Worker + `NoemaWorldDO` vs reconciled `Noema-Specs`.  
**Not** a platform migration. Stack remains Cloudflare Pages/Workers/DO + Supabase Auth/Postgres/Storage.  
**Architecture frontier:** reducer registry + [RFC-0016](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/rfcs/RFC-0016-hosted-durable-world-head.md) hosted world head. SERIALIZABLE cycle fence remains later.

Python `src/noema/` remains the offline Chamber / conformance runtime. **Product host is the Worker.**

## Verdict

```text
HOSTED_INTEGRITY_READY_AFTER_OPERATOR_SQL
```

First-world PLAY on Perihelion is live (`ACTIVE` / `HEALTHY` / `genesis.ef578f4ffceeccd0`). The P0 is recoverability: strategically durable world state lives in DO storage; Postgres is a best-effort event sink, not a reconstructable canonical world row. That contradicts the reconciled split (DO = live ordering; Postgres = durable record). Repair is an explicit architecture resume, not a silent GC slice.

## Scorecard

| Domain | Status | Severity | Runtime evidence | Next action |
|---|---|---|---|---|
| A Hosted authority (DO vs Postgres) | PARTIAL | P1 | Events + `noema_world_heads` upsert (RFC-0016). Restore if DO world missing. Not a SERIALIZABLE cycle fence. | Apply SQL migration; later fence RFC |
| B Canonical writers | PARTIAL | P1 | Mutations happen inside `applyWorldCommand` then events are appended. No separate event-reducer pass. `WAIT` increments `World.cycle` (`world-actions.ts`) contrary to reducer registry (WAIT must not write world cycle). `expireStalePresence` clears `entered` without `AGENT_LEFT_WORLD`. GC caches are non-writers. | Do not invent a reducer engine in this audit. Pin WAIT/cycle in a later RFC if hosted cycle must move |
| C Idempotency | IMPLEMENTED | — | `seen_idempotency[player_id::key]` in DO world; repair test does not double-debit. Envelope `player_id` mismatch is `FORBIDDEN`. Cache trimmed to last 200 keys (DO-local). | Keep; Postgres-backed idempotency waits on A |
| D Atomic cycle / settlement | PARTIAL | P0 | No cycle-fence transaction. TRADE accept transfers both legs then emits `TRADE_ACCEPTED` + two `RESOURCE_TRANSFER`s in one command. Second accept is `TRADE_FAILED`. Partial Postgres write cannot roll back DO state. | Same resume as A |
| E DO ↔ Supabase fail-closed | PARTIAL | P1 | `nextSettlementHealth`: fail → DEGRADED → BLOCKING + `INCIDENT`. Mutating PLAY then blocked. `unsettled[]` now records failed `event_id`s (was unused). No idempotent replay of the backlog onto Postgres. | Replay unsettled on alarm only after A |
| F World-time | PARTIAL | P1 | TRADE expiry uses `w.cycle`. Presence idle uses `Date.now()` (operational 30m, spec-aligned). `WAIT` advances world cycle (drift). Operator digest windows use wall clock. | Do not use wall clock in new reducers |
| G Scheduler / future obligations | PARTIAL | P1 | Cron `*/15` ticks operator digests. Digest history is DO storage. No hosted GC10 schedule. Alarms are not the sole record of trades (expiry is cycle on the trade object). | GC10 remains unauthorized |
| H Resources / reservations | IMPLEMENTED | — | Propose reserves offered; reject/cancel/expire release; accept consumes. Amounts sanitized. Second accept tested. | Concurrent DO serialization is the DO itself |
| I Player / Controller | PARTIAL | P2 | `PlayerPrincipal` from controller JWT or Supabase `sub`. No full Account→Binding table in the Worker. Controller type does not change costs. Session takeover exists. | Full identity graph stays on Python/Supabase path |
| J AuthZ | IMPLEMENTED | — | Bearer required. Service role only in Worker settle. Agents never get that key. Client `player_id` cannot override principal. | — |
| K Partial observability | PARTIAL | P1 | WATCH is redacted rooms/presence. MESSAGE `UNREACHABLE` does not leak topology. GC lines are self-only. World Services copy may say “oracle” as negation (not a PLAY discovery line). | Keep WATCH empty of DM/GC6 text |
| L Human / agent parity | IMPLEMENTED | — | Same `applyWorldCommand` for human line and structured command. | — |
| M REJECTED vs committed | IMPLEMENTED | — | Budget/target/addressability fails return typed codes without debit. Frozen names kept (`BUDGET_EXCEEDED`, `TRADE_FAILED`, `MOVE_REJECTED` path). | — |
| N Event / receipt / audit | PARTIAL | P2 | Settled rows are world events (plus `GENESIS_ACTIVATED`). Login/rate-limit are HTTP, not events. Operator digests are DO-side projections. | Do not promote Worker errors to catalog types |
| O Operator causation | PARTIAL | P2 | Admin lifecycle pause/resume/incident on DO meta. Genesis activate blocked when ACTIVE in production. No WED. No raw SQL world edit in Worker. | Receipt taxonomy already in Specs |
| GC1–GC10 | see table below | — | — | — |

## GC1–GC10

| Package | Spec ready? | Hosted implemented? | Reference Python? | Tested? | PLAY visible? |
|---|---|---|---|---|---|
| GC1-S0/S1 | Yes (RFC-0004/0005) | Yes | N/A for product host | Yes `practice.test.ts` | Self-only Work lines |
| GC2-S0 BUILD | Yes, **thaw required** | No (`BUILD` unsupported) | Deferred | Specs fixtures only | No |
| GC3-S0 | Yes | Yes | N/A | `social-memory.test.ts` | Self-only Tie lines |
| GC4-S0 | Yes | Pin yes (advisor non-authorizing) | N/A | `org-actions.test.ts` | Org roles |
| GC5-S0 | Yes | Yes | N/A | `communication.test.ts` | Delivery / `UNREACHABLE` |
| GC6-S0 | Yes (RFC-0010/0015) | Mapper yes; **Perihelion silent** (no claim fields) | N/A | `discovery.test.ts` | Unprojected on live Genesis |
| GC7-S0 contest | Yes, **thaw required** | No | v0.2 fixtures in Python | Specs only | No |
| GC8-S0 | Yes (already-true costs) | Yes (no extra code) | N/A | `economy.test.ts` | Cost behavior |
| GC9-S0 | Yes | Yes | N/A | `culture.test.ts` | Room custom line |
| GC10-S0 WED | Yes, **unauthorized** | No | N/A | Specs only | No |

## Frozen / left untouched

- `action-contracts.v01.json`, `event-types.0.2.json`
- First-world Genesis (`genesis.ef578f4ffceeccd0`); no activate/reseed
- Architecture frontier (Postgres durable world + fence)
- BUILD / contest / WED thaws
- Crypto / wallets

## Highest-severity findings

1. **P0** Durable world is DO-local. Postgres event sink cannot rebuild WorldState.  
2. **P1** Command resolution writes WorldState; events are copies, not the sole writers.  
3. **P1** `WAIT` increments `World.cycle`.  
4. **P1** Presence expiry mutates `entered` without `AGENT_LEFT_WORLD`.  
5. **P1** Unsettled backlog is now recorded but not replayed.

## Next bounded work (not done here)

Resume architecture only with an explicit thaw: persist settled world + writer fence in existing Supabase Postgres, reconstruct after DO restart, replay `unsettled`. Until then, do not open GC2/GC7/GC10 or invent GC6 Genesis claims.
