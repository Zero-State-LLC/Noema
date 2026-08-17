# Data stores

Inventory of required tables, RPCs, isolation rules, and ownership for hosted PLAY and offline Chamber.

**Do not reseed** Genesis `genesis.ef578f4ffceeccd0`.

Claim labels: **OBSERVED** (read from files or live endpoints this pass), **INFERRED** (follows from those facts without a SQL session), **SPECULATIVE** (not established).

### Live probe 2026-08-17 (this pass)

| Check | Result | Label |
|---|---|---|
| `GET https://noema.guru/ready` | `ready:true`, `play_blocked:false`, `status:ACTIVE`, `settlement_health:HEALTHY`, world `world.perihelion-reach`, cycle 105, sequence 288, `genesis_id:genesis.ef578f4ffceeccd0` | OBSERVED |
| Four migration files on disk in order | present under `supabase/migrations/` | OBSERVED |
| Worker secrets named on `noema-gateway` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` listed by `wrangler secret list` (values not read) | OBSERVED |
| Project host `dezykkherxlaysxyvgbs.supabase.co` | HTTP 401 `UNAUTHORIZED_MISSING_API_KEY` without apikey | OBSERVED (project live; not a schema proof) |
| `commitCanonicalSettlement` on missing RPC | Worker treats non-ok as fail; DO restores pre-command state and enters INCIDENT | OBSERVED in `settle.ts` / `world-do.ts` |
| Hosted RPC applied + Perihelion `noema_world_heads` row | No `SUPABASE_SERVICE_ROLE_KEY` in this shell. Did **not** apply SQL. Did **not** invent a head. | not independently verified |
| Mutating PLAY + Recover settlement proof | not executed | not independently verified |

INFERRED: because production secrets are configured and `/ready` is ACTIVE/HEALTHY, the last mutating ACK that emitted canonical events did not take the INCIDENT path. That is not a substitute for reading the SQL head row. Operator inspect (values stay in env, never argv):

```bash
# from a secret store, not the shell history:
#   export SUPABASE_URL=…
#   export SUPABASE_SERVICE_ROLE_KEY=…
cd workers/noema && node ./scripts/inspect-settlement.mjs
```

Do not apply the four migrations until that script reports `present:false` for a table or RPC. Applying blindly is not authorized here.

---

## Required tables

Hosted PLAY acknowledgement needs the RFC-0016/0017/0032 tables. The first migration also tracks the offline Python `WorldStore` schema; those research and identity tables are **not** hosted PLAY writers.

| Table | Required for | Owner | Source file | Label |
|---|---|---|---|---|
| `noema_world_heads` | Hosted recoverability record (one row per `world_id`) | Postgres | `supabase/migrations/20260813210000_noema_world_heads.sql` plus fence/canonical columns in later files | OBSERVED on disk |
| `noema_settled_events` | Canonical event rows written inside the settlement RPC | Postgres | `20260812193000_noema_settled_events.sql` plus digest columns in `20260813233000_noema_atomic_canonical_settlement.sql` | OBSERVED on disk |
| `noema_canonical_settlements` | Idempotent settlement receipts (`UNIQUE (world_id, revision)`) | Postgres | `20260813233000_noema_atomic_canonical_settlement.sql` | OBSERVED on disk |
| `meta`, `events`, `snapshots`, `sessions` | Offline Chamber ledger / restart replay | Offline-only (`WorldStore`) | `20260812181043_noema_world_schema.sql` mirrors `src/noema/persistence/store.py` | OBSERVED on disk; not a Worker writer |
| `research_*` (15 tables) | Rebuildable research indexes | Offline-only | same first schema | OBSERVED on disk; must stay rebuildable |
| `id_accounts`, `id_players`, `id_controllers`, `id_credentials`, `id_device_codes` | Offline identity plane | Offline-only | same first schema | OBSERVED on disk; Worker does not write these |

### `noema_world_heads` columns (required for fence + adopt)

OBSERVED from `20260813210000` + `20260813223000` + `20260813233000`:

`world_id` (PK), `sequence`, `cycle`, `genesis_id`, `status`, `settlement_health`, `state_json`, `updated_at`, `revision`, `ledger_head_event_id`, `state_digest`, `writer_generation`, `canonicalization_version`, `canonical_state_json`, `ledger_head_digest`.

Hosted row for Perihelion: **not read this inventory. Do not invent.**

### `noema_settled_events` columns (required for canonical commit)

OBSERVED from `20260812193000` + `20260813233000`:

`event_id` (PK), `event_type`, `sequence`, `cycle`, `world_id`, `player_id`, `controller_id`, `session_id`, `payload`, `settled_at`, `settlement_id`, `canonical_digest`, `previous_digest`.

The Stage-0 observational sink (`settleEvent` REST upsert) is not the PLAY ACK. Mutating ACK goes through the RPC.

### `noema_canonical_settlements` columns

OBSERVED from `20260813233000`:

`settlement_id` (PK), `world_id`, `revision`, `sequence`, `writer_generation`, `state_digest`, `ledger_head_event_id`, `ledger_head_digest`, `committed_at`, `UNIQUE (world_id, revision)`.

### Research tables (rebuildable, offline-only)

OBSERVED names in `store.py` / first schema. `WorldStore.clear_research_indexes()` may drop and rebuild them. They must not become hosted world truth.

- `research_trajectories`
- `research_frontier_audit`
- `research_frontier_plans`
- `research_observatory_runs`
- `research_observatory_candidates`
- `research_observatory_audit`
- `research_lab_experiments`
- `research_lab_results`
- `research_lab_audit`
- `research_compiler_results`
- `research_captured_tests`
- `research_compiler_audit`
- `research_learn_behaviors`
- `research_learn_edges`
- `research_learn_graphs`

---

## RPCs

Both functions are `SECURITY DEFINER`, `REVOKE` from `PUBLIC` / `anon` / `authenticated`, `GRANT EXECUTE` to `service_role` only. Hosted presence of either function was **not inspected** this inventory.

### `public.noema_commit_canonical_settlement`

OBSERVED in `supabase/migrations/20260813233000_noema_atomic_canonical_settlement.sql` and `workers/noema/src/settle.ts`.

| Item | Contract |
|---|---|
| Writer | One Postgres transaction: events + head + settlement receipt |
| Production PLAY | Worker must pass `p_allow_bootstrap=false` (default). Missing head → `MISSING_CANONICAL_HEAD` |
| Isolated test-world only | `POST /v1/operator/test-world/command` may set `allow_bootstrap: true`. `/v1/command` does not |
| Fence | `revision` + `writer_generation` must match (`STALE_HEAD` / `STALE_FENCE`) |
| Lineage | Contiguous sequence + digest chain; `evt.obs.*` filtered out before the RPC |
| Idempotency | Same `settlement_id` returns `{ok, idempotent:true}` |
| Fail-closed | Ambiguous or failed RPC is not an ACK; DO restores pre-command state and enters INCIDENT |

### `public.noema_adopt_live_world_head`

OBSERVED in `supabase/migrations/20260816013000_noema_adopt_live_world_head.sql`, `workers/noema/src/settle.ts` (`commitAdoptedLiveHead`), `workers/noema/src/incident-recover.ts`, `workers/noema/src/world-do.ts` admin-lifecycle `recover`.

| Item | Contract |
|---|---|
| When | Recover, and only when the DO has a usable live world and SQL head is missing |
| What | Persist the live DO snapshot as revision 1. Does **not** invent ledger events `0..n` |
| Refuse | Existing head → `HEAD_ALREADY_PRESENT`. Empty/unusable rooms → `UNUSABLE_LIVE_WORLD` |
| Fallback | If the RPC is not applied (HTTP 404/406), Recover writes the same snapshot via REST to `noema_world_heads` and still does not invent events |
| Not used | `p_allow_bootstrap` is not a parameter of this function |

---

## Isolation rules

| Rule | Enforcement (on disk) | Label |
|---|---|---|
| **Admin ≠ Player** | Admin JWT `typ: admin-access`. Player JWT `typ: access` or Supabase human JWT. Admin token is 401 on `/v1/me` / `/v1/command`. Player is 401 on `/v1/admin/*`. | OBSERVED (`admin-auth.ts`, `auth.ts`, `OPERATOR-SMOKE.md`) |
| **WORLD TRUTH ≠ RESEARCH** | Research tables are rebuildable indexes. Observatory / Lab / Compiler / LEARN / Deep Time never rewrite production history. Lab mutates forks only. | OBSERVED (`CORE-LOOP-RUNTIME.md`, `store.py`) |
| **One fenced writer** | Hosted: live ordering is the World DO; the only mutating ACK is `noema_commit_canonical_settlement` under `service_role`. Offline: one `WorldStore` writer token; SQLite `BEGIN IMMEDIATE` or Postgres `SERIALIZABLE`. | OBSERVED |
| **Recover is the only path when the DO has state and the SQL head is missing** | Production PLAY must not bootstrap (`p_allow_bootstrap=false`). Adopt is Recover-only. Isolated `test.hosted-canonical.*` is not Perihelion. | OBSERVED |
| **Do not reseed live Genesis** | Production reseed 403. Frozen ACTIVE world `POLICY_DENIED`. Identity `genesis.ef578f4ffceeccd0` is not re-activated here. | OBSERVED in runbooks + Worker gates; live gate not re-hit this inventory |
| **Test world ≠ Perihelion** | `admitTestWorldId` denies `world-01` / `world.perihelion-reach` before DO lookup. | OBSERVED (`test-world.ts`) |
| **Observational ≠ canonical** | `canonicalEventsForCommit` drops `evt.obs.*`. | OBSERVED (`settle.ts`) |
| **Unmigrated unsettled history** | If hosted secrets are set and DO `unsettled` is non-empty, mutation fail-closes (`UNMIGRATED_UNSETTLED_HISTORY`) instead of folding old candidates into the RPC. | OBSERVED (`world-do.ts`) |
| **RPC callers** | Only `service_role`. Players and anon cannot execute the writers. | OBSERVED in SQL; hosted grants not inspected |

---

## Ownership

| Plane | What it owns | What it must not own |
|---|---|---|
| **DO** (`NoemaWorldDO`) | Live world JSON (`world`), `world_meta` (status, revision, writer_generation, genesis_id, settlement_health), operator digest config/history. Named DO `__noema_enrollments__` holds enrollment + device bags. Live ordering. | Canonical ACK. Invented ledger `0..n` when SQL head is missing. |
| **Postgres** | Reconstructable head (`noema_world_heads`), canonical events, settlement receipts. RPC is the single semantic write transaction. | Research truth. Player/Admin session minting. Product HTML. |
| **Auth** (Supabase Auth) | Magic-link generate/verify for PLAY and ADMIN. Human JWT `sub` mapped to an ephemeral Player principal. | World state, ledger, Genesis, research. Admin privilege is never inherited from a Player session. |
| **Storage** | Worker `[assets]` (`wrangler.toml` binding `ASSETS`) serves product HTML/media. No Worker writes to Supabase Storage or R2 for world truth. | World ledger, receipts, enrollments. |
| **Offline-only** | Python `WorldStore` (`meta`/`events`/`snapshots`/`sessions`), all `research_*`, offline `id_*`, evidence-receipt files/keyring. | Hosted PLAY ACK. Must not be treated as the product writer. |

INFERRED: Supabase Storage buckets are unused by the Worker settlement path (no `storage/v1` callers under `workers/noema/src`). SPECULATIVE: whether any unused hosted bucket exists.

---

## Deferred tables

Enrollment-audit, revocation, and evidence-receipt tables are **not required** for hosted PLAY. Explicit deferral:

| Proposed table | Required now? | Rationale |
|---|---|---|
| Enrollment-audit | **No** | Hosted enrollment and device codes persist in DO storage (`enrollments`, `devices` on `__noema_enrollments__`). Offline `id_device_codes` is Chamber-only. No SQL audit table is referenced by settle/recover. Adding one would not unblock ACK or Recover. |
| Revocation | **No** | Offline `id_controllers.revoked_at` / `id_credentials.revoked_at` are Chamber identity. Hosted access is JWT expiry + operator mint/deny. Emergency `revoked_cycle` is world state inside the DO, not a SQL table. A hosted revocation ledger is not on the settlement path. |
| Evidence-receipt | **No** | Phase 11 receipts are HMAC files + keyring (`src/noema/evidence/receipts.py`). Mandatory only for offline `research-isolated` / `reproducibility` / `public-evidence-export`. Not a hosted PLAY table. |

Do not create these on hosted Postgres until a later identity/evidence slice explicitly requires them.

---

## Inventory gaps

Still **not** independently verified without a service-role session:

```json
["hosted apply of 20260813210000_noema_world_heads.sql not independently verified","hosted apply of 20260813223000_noema_world_head_fence.sql not independently verified","hosted apply of 20260813233000_noema_atomic_canonical_settlement.sql not independently verified","hosted apply of 20260816013000_noema_adopt_live_world_head.sql not independently verified","hosted RPC public.noema_commit_canonical_settlement not inspected with service role","hosted RPC public.noema_adopt_live_world_head not inspected with service role","hosted noema_world_heads row for Perihelion not read (do not invent)","hosted Worker/DO settlement proof not executed"]
```

Live `GET /ready` **was** fetched this pass (see Live probe). Prior-doc sequences 92 vs 94 are historical; current observed sequence is 288.

---

## Claim labels

| Claim | Label |
|---|---|
| Four hosted-head/RPC migration files exist on disk | OBSERVED |
| First schema + settled-events files exist on disk | OBSERVED |
| Worker `commitCanonicalSettlement` sends `p_allow_bootstrap` only when `allow_bootstrap === true`; `/v1/command` omits the flag | OBSERVED |
| Isolated test-world route is the only Worker path that sets `allow_bootstrap: true` | OBSERVED |
| Recover adopts via `noema_adopt_live_world_head` or REST snapshot; never invents events | OBSERVED |
| RPCs grant execute to `service_role` only (in SQL files) | OBSERVED |
| Research tables are rebuildable and offline-only | OBSERVED in code; hosted copies if any are unused by the Worker |
| Live `/ready` ACTIVE / HEALTHY / genesis.ef578f4ffceeccd0 / cycle 105 / seq 288 | OBSERVED 2026-08-17 |
| Hosted SQL apply + RPC + Perihelion head row via service role | **not verified** (see gaps). Use `inspect-settlement.mjs` |
| A current Perihelion `noema_world_heads` sequence or digest | SPECULATIVE if invented — **do not invent** |
