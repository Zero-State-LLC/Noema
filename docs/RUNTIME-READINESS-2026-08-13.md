# Runtime readiness — 2026-08-13 (S0 closeout)

**Kind:** hosted Worker + `NoemaWorldDO` vs reconciled `Noema-Specs`.  
**Not** a platform migration. Stack remains Cloudflare Pages/Workers/DO + Supabase Auth/Postgres/Storage.  
**Architecture:** RFC-0016/0017 head + fence. Merged #96 adds atomic `noema_commit_canonical_settlement`. Hosted SQL/RPC apply is still unverified.

Python `src/noema/` remains the offline Chamber / conformance runtime. **Product host is the Worker.**

## Verdict

```text
CANONICAL_HEAD_IMPLEMENTED_UNVERIFIED
PERIHELION_CANONICAL_BOOTSTRAP_BLOCKED
HOSTED_ISOLATED_TEST_PATH_BLOCKED
```

First-world PLAY on Perihelion is live (`ACTIVE` / `HEALTHY` / `genesis.ef578f4ffceeccd0`, cycle 0, seq 75 at last check). Completeness S0 packages are on the Worker. Canonical-head code from #96 is deployed. Hosted schema/RPC apply and isolated-world settlement were **not** verified from this environment.

## Scorecard (post-S0)

| Domain | Status | Notes |
|---|---|---|
| A Hosted authority | PARTIAL | #96 Worker calls `noema_commit_canonical_settlement` with `p_allow_bootstrap=false`. Hosted RPC not confirmed applied. |
| B Canonical writers | PARTIAL | Mutating ACK waits on that RPC; failure restores pre-command DO state and sets INCIDENT. |
| C Idempotency | IMPLEMENTED | `seen_idempotency[player_id::key]` |
| D Atomic cycle / settlement | PARTIAL | SQL function is one transaction. Hosted apply unverified. Isolated Worker/DO path does not exist. |
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
| GC4-S3 | Hosted this run | Emergency scopes: 3-cycle grant overlay. No superuser |
| GC4-S4 | Hosted this run | Designated succession. No implicit jump. Emergency remaining duration |
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

## Canonical-head deploy evidence (2026-08-14)

| Item | Observed |
|---|---|
| PR | Zero-State-LLC/Noema#96 MERGED |
| Merge SHA | `272a993065bdc8ebce4a01c56b5b5f1e67ba5503` |
| Deployed SHA | same (clean `main`; only untracked `supabase/.temp/`) |
| Deployment ID | Worker version `9b0dfc94-9038-41a9-a209-1d5aed4d158f` at `2026-08-14T04:01:45Z` |
| Worker health | `GET /health` `ok` / `production`; `GET /ready` `ACTIVE` / `HEALTHY` |
| DO | `NoemaWorldDO` loads Perihelion via `DEFAULT_WORLD_ID=world-01` |
| Named Supabase project | `dezykkherxlaysxyvgbs` host resolves; Worker `SUPABASE_URL` value not readable here |
| Migration applied | **NO** — no `DATABASE_URL` / `SUPABASE_ACCESS_TOKEN` / SQL editor session |
| RPC verified | **NO** — function not inspectable without SQL |
| Isolated world ID | **none** — production command path always uses `DEFAULT_WORLD_ID` |
| Canonical head row | not read |
| Stale-head / stale-fence / retry / restart | unit tests only (`test/fence.test.ts`, `test/canonical-state.test.ts`) |
| Perihelion | not mutated; seq 75; no fabricated head; Genesis reseed **NO** |

## Operator SQL (still required)

Apply in order, hosted Postgres only. Do not reset. Do not fabricate a Perihelion head.

```text
Noema/supabase/migrations/20260813210000_noema_world_heads.sql
Noema/supabase/migrations/20260813223000_noema_world_head_fence.sql
Noema/supabase/migrations/20260813233000_noema_atomic_canonical_settlement.sql
```

This environment cannot apply them. After #96 deploy, a mutating PLAY command will fail-closed (`MISSING_CANONICAL_HEAD` / RPC miss) and enter INCIDENT rather than skip. Apply SQL before the next production mutation.

## Next (not authorized here)

1. Operator apply the three SQL files on project `dezykkherxlaysxyvgbs` (or confirm Worker `SUPABASE_URL` matches).  
2. Provide an isolated hosted world path, or a SQL session, before claiming `CANONICAL_HEAD_VERIFIED`.  
3. Do not implement GC1-S2 benefits, crypto, or Genesis reseed.  
4. Do not bootstrap Perihelion from sequence-75 events.
