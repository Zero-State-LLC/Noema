# Runtime readiness — 2026-08-13 (S0 closeout)

**Addendum 2026-08-19 (M0 baseline pin — commands run).**
Stores: [DATA-STORES.md](DATA-STORES.md). **Do not reseed** `genesis.ef578f4ffceeccd0`.

Proof against shipped runtime `origin/main` `60c38a95324acaa626721c17743d8db387cadd45` (#315). Workspace checkout at `891d51d` is behind shipped main; tests/scripts ran from that shipped tree. Specs catalog hash checked on disk.

OBSERVED `curl GET https://noema.guru/ready` **before** hosted scripts (HTTP 200, `date: Wed, 19 Aug 2026 03:47:14 GMT`): `ready:true`, `play_blocked:false`, `code:null`, `status:ACTIVE`, `settlement_health:HEALTHY`, cycle 105, sequence **305**, `genesis_id:genesis.ef578f4ffceeccd0`, `playable:true`, `players:0`. OBSERVED `GET https://noema.guru/health` (HTTP 200, same minute): `status:ok`, `service:noema-gateway`, `stage:0`, `env:production`, `protocol_version:1`, `world_id:world-01`.

OBSERVED same `/ready` **after** shipped `agent-golden-path.mjs` live ENTER/LOOK/LEAVE (HTTP 200, `date: Wed, 19 Aug 2026 03:48:19 GMT`): cycle 105, sequence **307**, same genesis, `play_blocked:false`, `ACTIVE`/`HEALTHY`, `players:0`. Sequence 305 → 307 is those two live mutating commands, not a missing head.

Production is **not** bootstrap-blocked. `play_blocked:false` is the live play gate. `p_allow_bootstrap=false` on `POST /v1/command` is the RFC-0016/0017 policy (do not invent a Perihelion head) — not a live outage. Residual is live isolated SQL inspect (`SUPABASE_*` / `inspect-settlement.mjs`), not Perihelion bootstrap.

### Baseline pin (OBSERVED 2026-08-19)

| Pin | Value | Label |
|---|---|---|
| Product | `https://noema.guru` | OBSERVED |
| Shipped runtime SHA | `60c38a95324acaa626721c17743d8db387cadd45` (`origin/main` #315) | OBSERVED `git rev-parse` |
| `GET /ready` (03:47:14Z) | HTTP 200 · `ready:true` · `play_blocked:false` · `code:null` · seq **305** | OBSERVED |
| `GET /ready` (03:48:19Z, post golden) | HTTP 200 · same genesis · seq **307** · `play_blocked:false` | OBSERVED |
| World status | `ACTIVE` · `settlement_health:HEALTHY` · `playable:true` | OBSERVED |
| World | `world.perihelion-reach` / Perihelion Reach | OBSERVED |
| DO name (health) | `world-01` | OBSERVED `/health` |
| Genesis | `genesis.ef578f4ffceeccd0` | OBSERVED |
| Cycle / sequence | 105 / **307** (was 305 before live ENTER+LEAVE) | OBSERVED |
| Players | 0 (after LEAVE) | OBSERVED |
| `GET /health` | HTTP 200 · `ok` · `noema-gateway` · `stage:0` · `env:production` · `protocol_version:1` | OBSERVED |
| `POST /v1/command` unauth | HTTP 401 · `NOT_AUTHORIZED` · Bearer token required | OBSERVED |
| Production bootstrap-blocked? | **No** (`play_blocked:false`) | OBSERVED |
| Published seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` | OBSERVED `seal.ts` + catalog + `examples/sealed-prompt/s0.txt` digest |
| `/v1/command` bootstrap policy | `p_allow_bootstrap=false` unless `allow_bootstrap === true` | OBSERVED `settle.ts` L313; isolated test-world route sets true |
| First-world profile / seeds / Cycle 0 digest | FRACTURED_OLD_WORLD · OLD_TRADE_NETWORK + LOST_ARCHIVE · `17011984` · `sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6` | Spec pin ([FIRST-WORLD-SPEC-FREEZE.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/FIRST-WORLD-SPEC-FREEZE.md)); **not** re-read from Admin this run |
| vitest `workers/noema` | 156 files / 948 tests passed (incl. `agent-golden-path`, `isolated-settlement-proof`, `seal`, `settle-head`) | OBSERVED `npm test` on shipped tree |
| `isolated-ack.mjs` | `ok:true` · `test.hosted-canonical.ack-s3` · ENTER HTTP 200 · Perihelion test-world HTTP 403 · base `noema-gateway.zer0state-noema.workers.dev` | OBSERVED |
| `agent-golden-path.mjs` | `ok:true` · `/v1/command` · isolated ENTER/LOOK/MOVE 200 (`room.anchor`→`room.hall`) · INSPECT 400 · settled true · live ENTER/LOOK/LEAVE 200 · LOOK room `Grid Anchor` · seal sent · no live Admin header | OBSERVED |
| `noema-replay --json` | `EQUIVALENT` · events 31 · final digest `sha256:9f6921df5e1e2b663b28e0ff8825d4b87cb8290ef967fa271551bd4300189a19` | OBSERVED Chamber seed replay |
| Hosted SQL re-read this pass | **No** | NOT_COMPUTABLE here (no `SUPABASE_*` inspect) |

Do not Recover. Do not reseed. Do not treat sequence drift 288 → 305 → 307 as a missing head.

**Addendum 2026-08-17 live probe.**  
Stores: [DATA-STORES.md](DATA-STORES.md). **Do not reseed** `genesis.ef578f4ffceeccd0`.

OBSERVED `GET https://noema.guru/ready`: `ready:true`, `play_blocked:false`, `status:ACTIVE`, `settlement_health:HEALTHY`, cycle 105, sequence 288, `genesis_id:genesis.ef578f4ffceeccd0`. Worker secret names include `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Host `dezykkherxlaysxyvgbs.supabase.co` answers 401 without apikey.

Read-only SQL later the same day: Perihelion head matches `/ready` (revision 160, digest prefix `sha256:f163f`). Both RPCs present. Did **not** apply migrations. Did **not** invent a Perihelion head. See [DATA-STORES.md](DATA-STORES.md).

**Addendum 2026-08-17 inventory (on disk).**  
This pass also read Worker/SQL on disk. Production PLAY commits via `noema_commit_canonical_settlement` with `p_allow_bootstrap=false`. Recover is the only path when the DO has state and the SQL head is missing.

Worker `settle.ts` commits via `noema_commit_canonical_settlement` (`p_allow_bootstrap=false` on `/v1/command`). Recover adopts via `noema_adopt_live_world_head` or REST snapshot only (`incident-recover.ts`; `world-do.ts` admin-lifecycle recover). Recover is the only path when the DO has state and the SQL head is missing. Admin ≠ Player. WORLD TRUTH ≠ RESEARCH. One fenced writer.

Prior-doc `2026-08-16` notes claimed `GET https://noema.guru/ready` ACTIVE/HEALTHY and also disagreed on sequence (`94` here vs `92` in PRODUCTION-GENESIS-GATE). Those live numbers are **not re-verified**. Same notes already recorded `Migration applied: NO`, RPC not inspected, SQL head not re-read. That gap list still stands.

**Addendum 2026-08-16 (prior-doc, not re-fetched).**  
Documented then: `GET https://noema.guru/ready` → `ready:true`, `status:ACTIVE`, `settlement_health:HEALTHY`, `sequence:94`, `genesis.ef578f4ffceeccd0`. Recover unblocked PLAY. `#132` treats WAIT as mutating and forbids LOOK auto-enter. SQL head row was **not** re-read. Main at that addendum: `7802ce4`.

**Pages retirement (2026-08-16, OBSERVED):** account `315fb44b61212825452aad0ca566ea42` has **zero** Cloudflare Pages projects. `noema.guru` and `www.noema.guru` are Worker custom domains on `noema-gateway` production. Product HTML is Worker `[assets]`. Do not attach a Pages project to this zone.

**Kind:** hosted Worker + `NoemaWorldDO` vs reconciled `Noema-Specs`.  
**Not** a platform migration. Stack remains Cloudflare Workers + Worker `[assets]` + DO + Supabase Auth/Postgres/Storage.  
**Architecture:** RFC-0016/0017 head + fence. #96 atomic RPC. #99 isolated test-world harness is deployed. Hosted Worker/DO settlement proof is still unverified from this environment.

Python `src/noema/` remains the offline Chamber / conformance runtime. **Product host is the Worker.**

## Verdict

```text
HARNESS_DEPLOY_VERIFIED
CANONICAL_HEAD_SCHEMA_VERIFIED
PRODUCTION_NOT_BOOTSTRAP_BLOCKED
ISOLATED_SETTLEMENT_PROOF_RESIDUAL
```

First-world identity remains `genesis.ef578f4ffceeccd0` (do not reseed). Isolated harness #99 is on production (`3229a75`) per prior deploy note. 2026-08-19 `/ready` was fetched twice (see baseline pin): production is ACTIVE / HEALTHY / not play-blocked; sequence 305 then 307 after golden-path ENTER+LEAVE. Isolated `inspect-settlement.mjs` SQL re-read remains residual. Hosted SQL was **not** re-read this pass.

## Scorecard (post-S0)

| Domain | Status | Notes |
|---|---|---|
| A Hosted authority | PARTIAL | Worker calls `noema_commit_canonical_settlement` with `p_allow_bootstrap=false`. Hosted RPC not inspected this inventory. |
| B Canonical writers | PARTIAL | Mutating ACK waits on that RPC; failure restores pre-command DO state and sets INCIDENT. |
| C Idempotency | IMPLEMENTED | `seen_idempotency[player_id::key]` |
| D Atomic cycle / settlement | PARTIAL | Isolated operator route is deployed. Hosted Worker/DO settlement proof not executed. |
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

## Isolated harness deploy evidence (2026-08-14)

| Item | Observed |
|---|---|
| PR | Zero-State-LLC/Noema#99 MERGED |
| Merge SHA | `3229a75a9b45ff3df596814f09da23c6ca85b852` |
| Deployed SHA | same (clean `main`; only untracked `supabase/.temp/`) |
| Worker version | `778cc86b-05cf-4fb6-8f69-40675dd5b779` at `2026-08-14T04:44:56Z` |
| Environment | production (`noema.guru`, `noema-gateway.zer0state-noema.workers.dev`) |
| Health | `ok` / `production`; `/ready` `ACTIVE` / `HEALTHY` |
| Operator route | `POST /v1/operator/test-world/command` → `401` without bearer (route present; no DO) |
| `/v1/command` | still `401` Bearer required; not used for mutation |
| Hosted Worker/DO proof | **not executed** — no signed Player+admin pair, no SQL session |
| Perihelion | not mutated; seq 75; no Genesis |

## Prior canonical-head deploy evidence (#96)

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

Apply in order, hosted Postgres only. Do not reset. Do not fabricate a Perihelion head. Do not reseed Genesis.

```text
supabase/migrations/20260813210000_noema_world_heads.sql
supabase/migrations/20260813223000_noema_world_head_fence.sql
supabase/migrations/20260813233000_noema_atomic_canonical_settlement.sql
supabase/migrations/20260816013000_noema_adopt_live_world_head.sql
```

All four files are on disk. Hosted objects (tables + both RPCs + Perihelion head) were read 2026-08-17 — do not re-apply. After the Worker is on the atomic RPC, a mutating PLAY command fail-closes (`MISSING_CANONICAL_HEAD` / RPC miss) and enters INCIDENT rather than skip. Recover is the only path when the DO has state and the SQL head is missing. Head is present.

## Next (not authorized here)

1. Supply a Player bearer + signed `X-Noema-Admin-Token` and a SQL session to finish hosted Worker/DO proof on `test.hosted-canonical.*`.  
2. Do not implement GC1-S2 benefits, crypto, or Genesis reseed.  
3. Do not bootstrap Perihelion from sequence-75 events.
