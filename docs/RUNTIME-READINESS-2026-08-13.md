# Runtime readiness — 2026-08-13 (S0 closeout)

**Kind:** hosted Worker + `NoemaWorldDO` vs reconciled `Noema-Specs`.  
**Not** a platform migration. Stack remains Cloudflare Pages/Workers/DO + Supabase Auth/Postgres/Storage.  
**Architecture:** RFC-0016 world head + RFC-0017 revision fence (SQL may be unapplied). SERIALIZABLE multi-row PG remains later.

Python `src/noema/` remains the offline Chamber / conformance runtime. **Product host is the Worker.**

## Verdict

```text
HOSTED_GC_S0_SHIPPED_HEADS_SQL_UNCONFIRMED
```

First-world PLAY on Perihelion is live (`ACTIVE` / `HEALTHY` / `genesis.ef578f4ffceeccd0`, cycle 0, seq 75 at last check). Completeness S0 packages are on the Worker. Reconstructable Postgres heads still require an operator apply of the world-heads SQL.

## Scorecard (post-S0)

| Domain | Status | Notes |
|---|---|---|
| A Hosted authority | PARTIAL | RFC-0016 upsert + RFC-0017 revision CAS. Worker skips missing table (404). Events settle to `noema_settled_events`. |
| B Canonical writers | PARTIAL | Mutations still happen in `applyWorldCommand` then events copy. GC caches are non-writers. |
| C Idempotency | IMPLEMENTED | `seen_idempotency[player_id::key]` |
| D Atomic cycle / settlement | PARTIAL | RFC-0017 fence; not SERIALIZABLE multi-row |
| E Fail-closed settle | PARTIAL | DEGRADED → BLOCKING. Unsettled recorded. Replay after SQL. |
| F World-time | IMPLEMENTED | RFC-0019: `WAIT` sets `wait_until_cycle`; present quorum commits `World.cycle`. Cron is not the clock. |
| G Scheduler | PARTIAL | Digest cron `*/15`. GC10 schedule is world-time, not wall clock. |
| H Reservations | IMPLEMENTED | TRADE + contest stakes |
| I / J / L / M | IMPLEMENTED | Parity, bearer, fail-closed typed codes |
| K Partial observability | IMPLEMENTED | WATCH redacted. GC lines self-only. MESSAGE `UNREACHABLE` does not leak topology. |
| O Operator | PARTIAL | Pause/resume/incident. Production activate blocked when ACTIVE. No spawn. |

Fixed since the morning audit (do not re-open as defects):

- `WAIT` does **not** increment `World.cycle` alone (RFC-0019).
- Idle presence does **not** clear `entered`.
- RFC-0017 `STALE_HEAD` / crash-retry helpers shipped.

## GC1–GC10 hosted

| Package | Hosted | PLAY visible? |
|---|---|---|
| GC1-S0/S1 | Yes (#68 / #69) | Self-only practice / recognition lines |
| GC2-S0 BUILD | Yes (#79) | Commands work; help omits BUILD |
| GC3-S0 | Yes (#70) | Self-only trade-memory lines |
| GC3-S1 | Hosted this run | Defender sees `You have found {name} dangerous.` after `CONTEST_RESOLVED`. No reputation scalar |
| GC4-S0 | Yes (#71) | Org roles; advisor non-authorizing |
| GC4-S1 | Hosted this run | Named vacant/occupied offices; `PUBLISH_NOTICE`. Help omits office verbs |
| GC4-S2 | Hosted this run | Institution TRADE/REPAIR via occupied office + treasury. No new verbs |
| GC5-S0 | Yes (#72) | Same-room MESSAGE; long-range needs relay ≥ 25 |
| GC5-S2 | Hosted this run | Claim + MESSAGE lineage. No rumor score. Help omits rumor aliases |
| GC6-S0 | Mapper yes; **Perihelion silent** | No `archive_subject_entity_id` / `archive_claim` on genesis artifacts |
| GC6-S1 | Hosted this run | Player reconstruction from accessible archive/inspect. Not truth. Help omits reconstruct |
| GC7-S0 | Yes (#81) | Isolated contest; help omits CONTEST |
| GC7-S1 | Hosted this run | Withdraw open contest. ABORTED / forfeit SUCCESS. Help omits CONTEST |
| GC8-S0 | Already true | Cost comparison |
| GC9-S0 | Yes (#71) | Room custom after 3 distinct REPAIRs |
| GC9-S1 | Hosted this run | Tradition after persistence + transmission. Public WATCH pulses. No bonus |
| GC10-S0 | Yes (#82) | Cycle-4 `ENTITY_UPDATE` −15 if preview ≥ 25. Silent if genesis relay is too damaged. PLAY omits WED |
| GC10-S1 | Hosted this run | Cycle-8 harvest stock −4; cycle-12 public-exit `ACCESS_RESTRICTED` (4 cycles). S0 remains. PLAY omits WED |

## Frozen / left untouched

- `action-contracts.v01.json`, `event-types.0.2.json`
- First-world Genesis; no activate / force-supersede / reseed
- Chamber help still omits BUILD, CONTEST, WED, ATTEST
- Crypto / wallets / x402
- GC1-S2 mechanical benefits
- `AGREEMENT_FORM` / `ACCESS_POLICY` as first-world required help

## Operator SQL (still required for reconstructable heads)

```text
Noema/supabase/migrations/20260813210000_noema_world_heads.sql
Noema/supabase/migrations/20260813223000_noema_world_head_fence.sql
```

This environment cannot apply them. Until they run, `putWorldHead` 404 is skipped so PLAY does not fail-close.

## Next (not authorized here)

1. Operator apply the two SQL files.  
2. Next institutional slice is emergency scopes, then designated succession.  
3. Do not implement GC1-S2 benefits, crypto, or Genesis reseed.
