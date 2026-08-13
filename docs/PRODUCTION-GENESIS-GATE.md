# Production Genesis Gate — Perihelion Reach

**Status:** Production environment cutover executed · **NOT READY** for production Genesis activation  
**Do not activate without explicit human approval.**  
**This run did not activate.**

Captured (UTC): `2026-08-12T23:05Z` (post-cutover)  
Runtime commit: `7135e3f7ef805a6d026011d673e96c4d4e69b554`  
Worker version: `79b86443-667d-41ba-8759-f9e2f58ca45d`  
Product host: `https://noema.guru`  
Workers.dev: `https://noema-gateway.zer0state-noema.workers.dev`

---

## Candidate (frozen — exact)

```text
World:        Perihelion Reach
Profile:      FRACTURED_OLD_WORLD
Story Seeds:  OLD_TRADE_NETWORK, LOST_ARCHIVE
World Seed:   17011984
Theme:        perihelion-reach (presentation only)
```

| Field | Approved rehearsal | Production preview |
|--------|--------------------|--------------------|
| Genesis ID | `genesis.ef578f4ffceeccd0` | `genesis.ef578f4ffceeccd0` **MATCH** |
| Cycle 0 digest | `sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6` | same **MATCH** |

---

## Pre-cutover record (non-secret)

| Item | Value |
|------|--------|
| Host | `https://noema.guru` |
| Runtime commit | `7135e3f7ef805a6d026011d673e96c4d4e69b554` |
| `NOEMA_ENV` | `preview` |
| Health | `ok` |
| Readiness | ready · ACTIVE · `genesis.ef578f4ffceeccd0` · sequence `9` |
| Prior Worker version | `4d646420-60a5-4be0-842f-889c36b9522e` |
| Durable Object | bound `WORLD_DO` / `NoemaWorldDO` · healthy |
| Supabase settlement | `settlement_ok: true` · `settlement.genesis.ef578f4ffceeccd0` |
| Admin auth | available (`ADMIN_OPERATOR_TOKEN` secret present) |
| Dev-token | available (preview) |

---

## Production environment

Deploy mechanism (canonical):

```bash
cd workers/noema
NOEMA_ENV=production bash ./scripts/deploy-stage0.sh
# → wrangler deploy --var NOEMA_ENV:production
```

Post-deploy:

```json
GET /health → {"status":"ok","env":"production",...}
```

Runtime enforces production behavior (not UI-only labeling).

**Deploy note:** `wrangler.toml` still defaults `NOEMA_ENV=local`. Every production deploy **must** pass `NOEMA_ENV=production` via the deploy script or equivalent `--var`. A bare `wrangler deploy` would regress environment.

---

## Secrets (status only — never values)

| Secret | Status |
|--------|--------|
| `ADMIN_OPERATOR_TOKEN` | CONFIGURED |
| `TOKEN_SIGNING_SECRET` | CONFIGURED |
| `SUPABASE_URL` | CONFIGURED |
| `SUPABASE_JWT_SECRET` | CONFIGURED |
| `SUPABASE_SERVICE_ROLE_KEY` | CONFIGURED |

No secrets printed. No secrets in health/ready/watch/public responses.

---

## Cloudflare bindings

| Binding | Status |
|---------|--------|
| Worker `noema-gateway` | Deployed · version `79b86443-…` |
| Durable Object `WORLD_DO` → `NoemaWorldDO` | Bound · ready `world.ok=true` |
| Assets `ASSETS` | Bound · static splash assets |
| Custom domain `https://noema.guru` | Resolves to intended Worker (`env=production`) |
| workers.dev fallback | Same deployment · `env=production` |

---

## Supabase settlement

| Check | Result |
|-------|--------|
| Settlement backend reachable | PASS (prior activation settled; overview reports ok) |
| Schema compatible | PASS (`noema_settled_events` path used at activation) |
| Credentials valid | PASS (`settlement_ok: true`) |
| Safe non-Genesis probe | Via admin overview + ready (no fake history written) |

Settlement ID: `settlement.genesis.ef578f4ffceeccd0`  
DO digest == Cycle 0 digest: match.

---

## Auth gates

| Gate | Result | Evidence |
|------|--------|----------|
| Admin valid operator → ADMIN principal | **PASS** | `POST /v1/admin/session` → `role: ADMIN` |
| Admin invalid credential → denied | **PASS** | `401 NOT_AUTHORIZED` |
| Player / non-admin on admin plane → denied | **PASS** | `401` malformed / bad signature |
| Admin JWT is not a Player principal | **PASS** | `GET /v1/me` with admin JWT → `401` |
| Dev-token in production | **PASS (denied)** | `403` `dev-token disabled in production` |
| Force supersede in production | **PASS (denied)** | `403 POLICY_DENIED` `force supersede forbidden in production` |
| Production reseed | **PASS (denied)** | `403 POLICY_DENIED` `reseed disabled in production` |
| Active frozen world reseed (DO) | **PASS** | Worker gate + DO `POLICY_DENIED` when frozen |

### Player authentication readiness

| Check | Result |
|-------|--------|
| Public dev-token in production | **DENIED** (hard gate) |
| Operator-minted controller tokens | **Production path** — `POST /v1/admin/controller-token` (ADMIN only) |
| PLAY production enter | Paste operator-issued token (primary when `env=production`) |
| Supabase human JWT | Optional alternate path (configured); not required for controlled first entry |

**Rule applied:** *Do not activate a production world that legitimate Players cannot safely enter afterward.*  
Controlled entry: Admin → Players → mint human/agent controller token → PLAY.

### Agent-controller readiness

| Check | Result |
|-------|--------|
| Ontology (agent → PlayerPrincipal) | PASS |
| Production mint | Operator mint with `controller_type: agent` |
| CONNECT / docs | Admin mint primary; dev-token preview-only |

---

## Health / readiness / version

```json
// GET /health
{"status":"ok","service":"noema-gateway","stage":"0","env":"production","protocol_version":"1","world_id":"world-01"}

// GET /ready
{"ready":true,"world":{"ok":true,"world_id":"world.perihelion-reach","cycle":0,"sequence":9,"players":2,"status":"ACTIVE","genesis_id":"genesis.ef578f4ffceeccd0"}}
```

| Endpoint | Status |
|----------|--------|
| `/health` | PASS |
| `/ready` | PASS (Chamber / DO only — research not required) |
| `/version` `/manifest` `/config` | Not implemented (404 product shell) — non-blocking; health + admin overview carry env/protocol |

---

## Production Genesis preview (non-mutating)

Inputs (exact):

```json
{
  "world_name": "Perihelion Reach",
  "world_seed": "17011984",
  "profile_id": "FRACTURED_OLD_WORLD",
  "story_seed_ids": ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"]
}
```

| Check | Result |
|-------|--------|
| Preview HTTP | 200 |
| Determinism (double generate) | PASS |
| Live sequence before/after | `9` → `9` **unchanged** |
| Status / genesis_id unchanged | ACTIVE · `genesis.ef578f4ffceeccd0` |
| Genesis ID vs rehearsal | **EXACT MATCH** |
| Cycle 0 digest vs rehearsal | **EXACT MATCH** |
| Theme | `perihelion-reach` · vocabulary/pressure only · `lore_is_final: false` |

### Structural comparison (PASS)

| Expected | Observed |
|----------|----------|
| Locations: Grid Anchor, Coldline, Contract Town, Black Channel, Dead Spur | All five present |
| Institutions: Nacre Compact (active), Prior Compact (dormant) | Match |
| Resources: mixed energy, low storage, low transport, mixed trade-access | Match |
| Historical traces / tensions | Damaged relay corridor; maker marks / incomplete ledgers; ghost route; legacy access-control; fragmentary archive; credential vs ledger tension; partial trade-route obligations |

### Hidden-history boundary

| Surface | Story Seed IDs / world seed / profile | Result |
|---------|--------------------------------------|--------|
| Admin preview / overview | Visible to ADMIN only | PASS |
| WATCH `/v1/watch/live` | Redacted — no seeds / profile / signing material | PASS |
| Public product HTML | No seed IDs in WATCH projection | PASS |

---

## Public surface smoke

| Path | HTTP | Notes |
|------|------|-------|
| `/` | 200 | Splash / wizard |
| `/play` | 200 | PLAY shell (auth path blocked by prod gate) |
| `/watch` | 200 | Spectator |
| `/study` | 200 | Study shell |
| `/connect` | 200 | Agent shell (mint blocked by prod gate) |
| `/admin` | 200 | Operator GUI |
| `/admin/login` | 200 | Operator login |

World already ACTIVE — honest live state, not fabricated “not active.”

---

## Admin GUI / activation control

| Check | Result |
|-------|--------|
| Preview form + structural display | Present |
| Labels PREVIEW / status | Present (`PREVIEW` in render path) |
| ACTIVATE requires checkbox confirm | PASS (`confirm: true` API; UI checkbox) |
| Activate without confirm | `400 CONFIRMATION_REQUIRED` |
| No auto / deploy / CI activation | PASS (this run did not activate) |
| Force not used in UI activate path | PASS (UI sends `confirm: true` only) |

---

## Prepared activation payload (NOT submitted)

```json
{
  "genesis_id": "genesis.ef578f4ffceeccd0",
  "confirm": true
}
```

**Do not** send `force: true` in production (denied by gate).  
**Do not** create a second preview during activation if identity would drift.  
Note: live DO is **already ACTIVE** with this genesis from non-production rehearsal. Ordinary re-activate is blocked while frozen; production force supersede is denied. Environment cutover did not reseed or re-activate.

---

## Final checklist

```text
[x] NOEMA_ENV=production
[x] Health PASS
[x] Readiness PASS
[x] Admin auth PASS
[ ] Player auth PASS          ← BLOCKER
[ ] Agent controller auth PASS ← BLOCKER
[x] Dev-token disabled
[x] Force supersede disabled
[x] Production reseed protected
[x] Durable Object healthy
[x] Supabase settlement healthy
[x] Spec/version pins correct (genesis/0.6 · protocol 1)
[x] Preview non-mutating
[x] Genesis ID exact match
[x] Cycle 0 digest exact match
[x] Structural preview approved
[x] Hidden-history boundary PASS
[x] WATCH redaction PASS
[x] Activation payload prepared
```

---

## Spec defects

None discovered. No Specs changes made.

---

## Runtime defects / blockers

1. **Player production entry (hard gate FAIL)**  
   PLAY + landing wizard only mint via `/v1/auth/dev-token`, which is correctly disabled when `NOEMA_ENV=production`. Supabase JWT verification exists in Worker auth but no production player login/session UX is wired or verified.

2. **Agent controller production enrollment (hard gate FAIL)**  
   CONNECT only mints via the same disabled dev-token path. No production enrollment endpoint.

3. **Deploy env pin (operational risk, non-blocking for this gate)**  
   Production depends on deploy-time `--var NOEMA_ENV:production`. Bare deploy without the var regresses env.

---

## Smallest next work (out of this run)

1. Production Player authentication path (Supabase human JWT end-to-end **or** equivalent Specs-aligned controller bind) without re-enabling open dev-token.  
2. Production agent-controller enrollment (device enrollment / operator-issued scoped controller tokens) resolving to the same PlayerPrincipal ontology.  
3. Wire PLAY/CONNECT UI to the production path; keep dev-token production denial.  
4. Pin/document deploy so production cannot silently regress to `preview`/`local`.  
5. Only after (1)–(2) pass: human may approve activation/ops next steps. **This run still forbids activation.**

---

## Tests run

```text
workers/noema: vitest — jwt + genesis (10/10 PASS)
Live production gates: health, ready, admin auth, isolation,
  dev-token denial, force denial, reseed denial, preview non-mutation,
  identity/digest match, WATCH redaction, public surfaces
```

---

## Re-gate (operator-minted entry) — 2026-08-13

After PRs #41–#43 (action parity, operator tokens, ORG_*) and conformance hardening:

| Gate | Result |
|------|--------|
| `NOEMA_ENV=production` | PASS |
| Health / readiness / DO ACTIVE | PASS · `genesis.ef578f4ffceeccd0` |
| Dev-token denied | PASS |
| Admin auth + force/reseed denied | PASS |
| Operator mint human + agent | PASS |
| Player cannot mint | PASS |
| Human ENTER/LOOK/INSPECT/REPAIR/MOVE | PASS |
| LOOK/INSPECT → `OBSERVATION_GENERATED` | PASS |
| Agent ENTER/LOOK | PASS |
| MESSAGE private + WATCH redaction | PASS |
| TRADE propose/accept | PASS |
| ORG form + invite | PASS (post org-sort fix) |
| Genesis preview identity/digest match | PASS · non-mutating |
| Public surfaces | PASS |

**Player entry path:** Admin → Players → mint controller token → PLAY paste / agent Bearer.  
**Do not re-enable open dev-token.**

World is already ACTIVE with approved candidate; activation is not re-run.  
**Controlled production play is ready** for operator-issued human and agent Players.

```text
PRODUCTION GATE (operator-minted): PASS for controlled entry
Genesis activation: N/A (already ACTIVE; do not force-supersede)
```

---

## Final verdict (original cutover run)

```text
NOT READY FOR PRODUCTION GENESIS ACTIVATION
```

At cutover time, public Player auth was missing. That blocker is addressed via **operator-minted controller tokens** (see re-gate above).
