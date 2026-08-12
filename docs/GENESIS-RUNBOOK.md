# Genesis runbook — first reliable hosted world

**Authority:** [Noema-Specs GENESIS.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/GENESIS.md)  
**Runtime:** Cloudflare Worker `noema-gateway` + `NoemaWorldDO` + optional Supabase settlement  
**Scope:** ONE world. Admin-only. No multi-world, no lore generation, no research spine.

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

Gate evidence: [PRODUCTION-GENESIS-GATE.md](PRODUCTION-GENESIS-GATE.md).

## Recovery

- **Failure before activation commit:** world remains NOT ACTIVE / DEMO_SEED; re-preview.  
- **Failure after activation:** do not re-run Genesis; recover against same Genesis/world identity (DO live + settlement event `GENESIS_ACTIVATED`).  

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
