# Genesis runbook — first reliable hosted world

**Authority:** [Noema-Specs GENESIS.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/GENESIS.md)  
**Runtime:** Cloudflare Worker `noema-gateway` + `NoemaWorldDO` + optional Supabase settlement  
**Scope:** ONE world. Admin-only. No multi-world, no lore generation, no research spine.  
**Stores:** [DATA-STORES.md](DATA-STORES.md). **Do not reseed** `genesis.ef578f4ffceeccd0`.

### Verified 2026-08-17

OBSERVED live `GET /ready`: ACTIVE / HEALTHY / cycle 105 / seq 288 / `genesis.ef578f4ffceeccd0`. Read-only SQL: Perihelion head matches (revision 160, writer `do.1`, digest prefix `sha256:f163f`). Both settlement RPCs present; `service_role` execute only. Did not apply SQL. Did not invent a head. Did not Recover. Inspect: [DATA-STORES.md](DATA-STORES.md).

- Production PLAY commits via `noema_commit_canonical_settlement` with `p_allow_bootstrap=false`. Isolated `test.hosted-canonical.*` is the only bootstrap path.
- Recover is the only path when the DO has state and the SQL head is missing: `noema_adopt_live_world_head`, or the same live snapshot via REST if that RPC is not applied. No invented ledger events. OBSERVED: adopt already committed as revision 1 at sequence 92 (`settlement.adopt-live.world.perihelion-reach`). Do not Recover again.
- Admin ≠ Player. WORLD TRUTH ≠ RESEARCH. One fenced writer.

## Boundary

```text
PLAYER  → human or agent controller (same ontology)
ADMIN   → separate operator principal (ADMIN_OPERATOR_TOKEN)
```

PLAY never exposes Genesis. After activation, Genesis config is immutable.

## Flow

```text
ADMIN LOGIN
→ CREATE WORLD inputs
→ PROFILE + ≤2 STORY SEEDS + WORLD SEED
→ PREVIEW (non-canonical)
→ VALIDATE + DETERMINISM CHECK
→ CONFIRM
→ ACTIVATE (atomic)
→ CYCLE 0 LIVE
→ PLAY / WATCH
```

## Operator checklist (first world)

1. Verify `GET /health` and `GET /ready` on the product host  
2. Log in at `/admin/login` with `ADMIN_OPERATOR_TOKEN`  
3. Open **Genesis**  
4. Select profile (rehearsal default: `FRACTURED_OLD_WORLD`)  
5. Select ≤2 Story Seeds (rehearsal: `OLD_TRADE_NETWORK`, `LOST_ARCHIVE`)  
6. World name default **Perihelion Reach** (editable; theme pack only)  
7. Set or randomize world seed (rehearsal: `perihelion-rehearsal-01`)  
8. **Preview** — confirm theme character line + opportunities  
9. Confirm determinism PASS and live world unchanged  
10. Review pressures / traces / regions  
11. Confirm validation PASS  
12. Check **Activate** confirmation  
13. Activate once  
14. Verify admin shows WORLD ACTIVE + frozen + settlement status  
15. Enter as human-controlled Player  
16. Enter as agent-controlled Player  
17. Verify WATCH has no Story Seed IDs / world_seed / profile  
18. Record Genesis ID + Cycle 0 digest  

(Theme ≠ lore — see [GENESIS-THEME.md](GENESIS-THEME.md).)

## Rehearsal (non-production)

Fixture: `examples/genesis/first-world-rehearsal.json`

```bash
cd workers/noema
export ADMIN_TOKEN='…'   # operator token
export BASE=https://noema-gateway.zer0state-noema.workers.dev

# Preview-only (safe)
../../scripts/genesis_rehearsal.sh

# Explicit activation (still not CI)
../../scripts/genesis_rehearsal.sh --activate
```

Expected:

```text
GENESIS REHEARSAL: PASS
```

## Production activation comparison (human only)

Exact candidate (do not substitute):

```text
Perihelion Reach · FRACTURED_OLD_WORLD · OLD_TRADE_NETWORK + LOST_ARCHIVE · 17011984
```

Approved rehearsal identity (see [FIRST-GENESIS-CANDIDATE.md](FIRST-GENESIS-CANDIDATE.md)):

```text
genesis_id:    genesis.ef578f4ffceeccd0
cycle0_digest: sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6
```

1. Login to **production** ADMIN.  
2. Enter the exact final candidate.  
3. Preview.  
4. Record production `genesis_id`.  
5. Record production Cycle 0 digest.  
6. Compare against approved rehearsal identity/digest.  
7. If mismatch → **STOP**.  
8. Human operator approves (never CI).  
9. ACTIVATE with `confirm: true` only (no `force` in production).  
10. Verify settlement `digest_match`.  
11. Human Player smoke.  
12. Agent Player smoke.  
13. WATCH smoke.  
14. Record first-world activation receipt.  

## Production safeguards

| Rule | Enforcement |
|------|-------------|
| No CI auto-activate | Smoke requires `--activate`; no deploy hook activates |
| No deploy reseed | `NOEMA_ENV=production` → reseed 403 |
| No reseed after freeze | DO returns `POLICY_DENIED` when ACTIVE |
| No force supersede in production | API returns `POLICY_DENIED` |
| No player Genesis | Player JWT rejected on `/v1/admin/*` |
| Dev-token off in production | `POST /v1/auth/dev-token` → 403 |

### Production deploy pin

```bash
cd workers/noema
NOEMA_ENV=production bash ./scripts/deploy-stage0.sh
```

Confirm `GET /health` reports `"env":"production"`. Bare `wrangler deploy` without the var is **not** production.

The generated post-deploy pin workflow (`.github/workflows/deploy-worker-pin-pr.yml`) is `workflow_dispatch` only. Merging it does not deploy. Dispatch requires typing `I_ACKNOWLEDGE_PRODUCTION_DEPLOY_AND_PIN`, running from `main`, and `DEFAULT_WORLD_ID=world.perihelion-reach-3`. After a successful deploy it opens a reviewable pin PR; it never writes `spec-compat.json` to `main`.

Gate evidence: [PRODUCTION-GENESIS-GATE.md](PRODUCTION-GENESIS-GATE.md).

## Successor world (RFC-0121)

**Current PLAY (2026-08-22).** `spec-compat.json` `hosted_live`: `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`. Prior PLAY `world.perihelion-reach-2` is not reseeding. Frozen first world remains on `world-01` (operator-only). Do not reseed. Do not force reach-2.

A later successor decision must follow [SUCCESSOR-CUTOVER-RUNBOOK.md](SUCCESSOR-CUTOVER-RUNBOOK.md). That record names `world-01` / `genesis.ef578f4ffceeccd0` **out of scope**. It does not authorize a cutover.

Local rehearsal (preview, or preview + activate). `--successor --activate` stops after activation; it does not inhabit. The rehearsal script still refuses `https://noema.guru`.

```bash
ADMIN_TOKEN=… BASE=http://127.0.0.1:8787 ./scripts/genesis_rehearsal.sh --successor
ADMIN_TOKEN=… BASE=http://127.0.0.1:8787 ./scripts/genesis_rehearsal.sh --successor --activate
```

**Historical production cutover (2026-08-21, RFC-0121).** Completed. Do not repeat. PLAY later moved to reach-3 (RFC-0122). The steps below are the evidence record:

1. Deploy Worker that allows Admin `world_id: world.perihelion-reach-2` on preview/activate. Keep `DEFAULT_WORLD_ID=world-01`. `force` and reseed stay `POLICY_DENIED`. Omitted `world_id` still targets the live 5-room DO.
2. Admin preview successor on production. Require `genesis_id ≠ genesis.ef578f4ffceeccd0` and `room_count: 10`.
3. Admin `confirm: true` activate on `world.perihelion-reach-2`. No `force`. Do not reseed `genesis.ef578f4ffceeccd0`.
4. Set production `DEFAULT_WORLD_ID=world.perihelion-reach-2` and deploy. PLAY then uses the successor DO. Do not add PLAY to the old DO.
   Successor production genesis (2026-08-21): `genesis.dbeb43d198ce81b1`, seed `perihelion-successor-rehearsal-01`, 10 rooms. Frozen first world remains `genesis.ef578f4ffceeccd0` on the `world-01` DO.
5. Admin overview / Recover of the frozen world: `GET /v1/admin/overview?world_id=world.perihelion-reach` and `POST /v1/admin/lifecycle { "action":"recover", "world_id":"world.perihelion-reach" }` target the `world-01` DO. PLAY never follows that allowlist.

## Recovery

- **Failure before activation commit:** world remains NOT ACTIVE / DEMO_SEED; re-preview.  
- **Failure after activation:** do not re-run Genesis; recover against same Genesis/world identity (DO live + settlement event `GENESIS_ACTIVATED`). **Do not reseed** `genesis.ef578f4ffceeccd0`.  
- **INCIDENT + BLOCKING + missing canonical head:** Recover is the only path. If the live Durable Object still has a coherent stored world, admin `POST /v1/admin/lifecycle { "action": "recover" }` persists that snapshot as the first `noema_world_heads` row via `noema_adopt_live_world_head` (no invented events, no Genesis reseed), verifies `HEAD_PRESENT`, then returns ACTIVE + HEALTHY. If the DO has no usable stored world, Recover stays 409.  
- **INCIDENT with an existing head:** Recover restores the durable head into the DO, then ACTIVE + HEALTHY.  
- SQL file `supabase/migrations/20260816013000_noema_adopt_live_world_head.sql` is on disk. Hosted function `noema_adopt_live_world_head` is present (OBSERVED). Recover still does not invent ledger events.

## API (admin JWT)

| Method | Path |
|--------|------|
| POST | `/v1/admin/session` `{ admin_token }` |
| GET | `/v1/admin/overview` |
| GET | `/v1/admin/genesis/catalog` |
| POST | `/v1/admin/genesis/preview` |
| POST | `/v1/admin/genesis/activate` `{ genesis_id, confirm: true }` |

## Deferred

Multi-world · new profiles/seeds · procedural lore · research spine gate · graph DB · player-facing Genesis.
