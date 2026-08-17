# Production Genesis Gate — Perihelion Reach

**Status:** already-activated candidate · **do not re-activate** · **do not reseed** `genesis.ef578f4ffceeccd0`  
**Genesis activation is N/A** — the approved candidate is the live identity.  
**Do not** force-supersede or submit a second activate.

**Stores:** [DATA-STORES.md](DATA-STORES.md).

**Live `GET /ready` 2026-08-17 (OBSERVED):** `ACTIVE` · `HEALTHY` · cycle 105 · seq 288 · `genesis.ef578f4ffceeccd0`. Read-only SQL head matches (revision 160, `do.1`, digest prefix `sha256:f163f`). Both RPCs present. Did **not** apply SQL. Did **not** invent a head. Did **not** Recover.

### Verified this inventory (2026-08-17)

- Production PLAY: `noema_commit_canonical_settlement` with `p_allow_bootstrap=false`.
- Recover is the only path when the DO has state and the SQL head is missing (`noema_adopt_live_world_head` or REST snapshot; no invented events). Head is present; Recover is not indicated.
- Admin ≠ Player. WORLD TRUTH ≠ RESEARCH. One fenced writer.
- Hosted tables + RPCs + Perihelion head: OBSERVED (see [DATA-STORES.md](DATA-STORES.md)). Mutating PLAY / Recover proof **not executed**.

Prior-doc `/ready` notes (`2026-08-16` ACTIVE/HEALTHY, seq `92` here vs `94` in RUNTIME-READINESS) are **not re-verified**. Do not treat those sequences as current.

If `/ready` is `INCIDENT`/`BLOCKING`, Recover (`POST /v1/admin/lifecycle {action:recover}`). Do not close while BLOCKING. Do not reseed.

Product host: `https://noema.guru`  
Workers.dev: `https://noema-gateway.zer0state-noema.workers.dev`  
Cutover capture (historical): `2026-08-12T23:05Z` · commit `7135e3f7` · Worker `79b86443-667d-41ba-8759-f9e2f58ca45d`

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
| Assets `ASSETS` | Bound · product media and static fallback assets |
| Custom domain `https://noema.guru` | Resolves to intended Worker (`env=production`) |
| workers.dev fallback | Same deployment · `env=production` |

---

## Supabase settlement

Historical activation-time checks below are **not** a hosted SQL inspection from this inventory. Required writers and gaps: [DATA-STORES.md](DATA-STORES.md).

| Check | Result |
|-------|--------|
| Settlement backend reachable | Prior-doc PASS (activation-time overview). **Not re-verified.** |
| Schema compatible | OBSERVED 2026-08-17: heads + settled events + canonical settlements + both RPCs present. |
| Credentials valid | Prior-doc PASS (`settlement_ok: true`). **Not re-verified.** |
| Safe non-Genesis probe | Do not invent a Perihelion head. Do not reseed. |

Settlement ID (prior-doc): `settlement.genesis.ef578f4ffceeccd0`  
DO digest == Cycle 0 digest: prior-doc match. SQL head row OBSERVED this inventory (seq 288, revision 160).

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
| Human Player email magic link | **Production path** — request from `/` or `/play`; callback mints Player controller token |
| Operator-minted controller tokens | **Agent / controlled-entry path** — `POST /v1/admin/controller-token` (ADMIN only) |
| PLAY production enter | Email play link for humans; scoped controller token for agents |
| Supabase human JWT | Used through the Worker magic-link exchange; service-role credentials never reach Players |

**Rule applied:** *Do not activate a production world that legitimate Players cannot safely enter afterward.*  
Human entry: `/` or `/play` → email magic link → `/play/callback` → Player session.
Agent entry: ADMIN mints or enrolls a scoped agent Controller credential. ADMIN login remains a separate allowlisted email flow.

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
| `/` | 200 | Product entry: Player email gate; PLAY primary; WATCH / STUDY / CONNECT secondary |
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

## Live production (do not re-activate)

Captured `2026-08-13` against `https://noema.guru` (unauthenticated):

```json
GET /health → {"status":"ok","env":"production","protocol_version":"1","world_id":"world-01"}
GET /ready  → ready=true · ACTIVE · HEALTHY · genesis.ef578f4ffceeccd0 · cycle 0 · sequence 75 · players 17
```

| Check | Result |
|-------|--------|
| Identity | `genesis.ef578f4ffceeccd0` **MATCH** frozen candidate |
| Settlement | `HEALTHY` (same genesis settlement id) |
| Dev-token | **403** `dev-token disabled in production` |
| WATCH `/v1/watch/live` | 200 · no world seed / profile / Story Seed IDs / signing names |
| Public shells | `/` `/play` `/watch` `/study` `/connect` `/admin` `/admin/login` **200** |
| Unauth activate / force | **401** `ADMIN bearer token required` |
| Operator-minted human + agent | **PASS** (re-gate 2026-08-13; entry is Admin → mint → PLAY) |
| Genesis activation | **N/A** — already ACTIVE; editor is `inert` while frozen |

Admin Genesis form default seed is the frozen pin `17011984`. The editor stays `inert` while the world is ACTIVE.

## Final checklist

```text
[x] NOEMA_ENV=production
[x] Health PASS
[x] Readiness PASS
[x] Admin auth PASS
[x] Player auth PASS          operator-minted controller token
[x] Agent controller auth PASS operator-minted controller token
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
[x] Genesis activation N/A (already ACTIVE; do not re-activate)
```

---

## Spec defects

None discovered. No Specs changes made.

---

## Runtime defects / blockers

Historical cutover blockers (1) and (2) are **closed** for controlled first-world play via operator-minted controller tokens (`POST /v1/admin/controller-token`). Public `/v1/auth/dev-token` stays denied. Real IdP / device-enrollment UX remains out of this gate.

1. ~~Player production entry~~ **PASS** — Admin → mint human token → PLAY paste.  
2. ~~Agent controller production enrollment~~ **PASS** — Admin → mint `controller_type: agent` → Bearer.  
3. **Deploy env pin** — still an operational risk until `scripts/deploy-stage0.sh` refuses unset `NOEMA_ENV` (PR B). `wrangler.toml` stays `local` for `npm run dev`.

---

## Smallest next work (out of this run)

1. Ship security remediations (`6c18b52`) with `NOEMA_ENV=production` deploy — do not reseed.  
2. Pin deploy so production cannot silently regress to `preview`/`local`.  
3. Record operator smoke (admin token required; no activate).  
4. **Do not** activate, force-supersede, or reseed.

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

## Final verdict

```text
ACTIVE · CONTROLLED PLAY READY · DO NOT RE-ACTIVATE
```

The approved candidate is the live world. Operator-minted human and agent Players can enter. Public dev-token stays off. Genesis activation is not re-run.

Historical cutover verdict (`NOT READY FOR PRODUCTION GENESIS ACTIVATION`) applied when public Player auth was missing. That blocker is closed via operator-minted controller tokens (see re-gate above).
