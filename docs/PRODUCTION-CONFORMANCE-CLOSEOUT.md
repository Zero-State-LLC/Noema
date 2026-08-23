# NOEMA production conformance closeout

**Date.** 2026-08-18  
**Verdict.** `NOEMA PRODUCTION CONFORMANT`

**Amendment 2026-08-22 (hosted_live publish).** Live PLAY is **`world.perihelion-reach-3` / `genesis.94d0961984b2b4f8`** (`spec-compat.json` `hosted_live`; Worker `fb57910f-a32b-4dc3-95ff-526188b0984d` from `main` `333a0e5`). OBSERVED `GET /ready` ACTIVE / HEALTHY. Entry Civic Exchange (`room.civic-exchange`). Official client `noema-client==0.1.14`. Prior PLAY `world.perihelion-reach-2` / `genesis.dbeb43d198ce81b1` is not reseeding. Frozen first world `genesis.ef578f4ffceeccd0` remains on the `world-01` DO, **operator-only**. Do not reseed. Do not PLAY `world-01`. The 2026-08-21 and 2026-08-18 identity blocks below are **historical** evidence.

**Amendment 2026-08-21 (RFC-0121 cutover, historical).** Live PLAY that day was **`world.perihelion-reach-2` / `genesis.dbeb43d198ce81b1`** (10-room CHAMBER-MAP, entry Civic Exchange). OBSERVED `GET /ready` ACTIVE / HEALTHY / cycle 1. Frozen first world `genesis.ef578f4ffceeccd0` remains on the `world-01` DO, **operator-only**. Do not reseed it. Do not PLAY it. The 2026-08-18 identity block below is the **pre-cutover** evidence record.

**Amendment.** ADR-006 landing: frozen Perihelion `genesis.ef578f4ffceeccd0` keeps its activated 5-room set on `world-01`. The 10-room bound applies to chamber-world / isolated fixtures / the successor `world_version`. The previous BLOCKER (WATCH 5 rooms vs ADR-006 “exactly 10”) is resolved as accepted frozen identity, not a runtime spawn bug.

**Repos.**

| Repo | `origin/main` | Note |
|---|---|---|
| Noema-Specs | `2176135c94f8e2aae7dd4ef9bf9cf1f4ff768d6b` | `#170` ADR-006 Perihelion landing |
| Noema | `b5ff7439ca6ff369b2c11246590197f7d1b979c0` | `#304` closeout CONFORMANT. Live Worker code through `#301` |

**Open PRs at start of this run.** none (both repos).

**Hosted evidence** (2026-08-18, `https://noema.guru`, User-Agent Mozilla). Labels: OBSERVED / INFERRED / NOT_COMPUTABLE.

This file is evidence, not a world-rule change. No Genesis, no reseed, no Player deletes.

---

## Production identity (OBSERVED)

**2026-08-22 PLAY (current).** `GET /ready`:

```text
status ACTIVE
settlement_health HEALTHY
world_id world.perihelion-reach-3
genesis_id genesis.94d0961984b2b4f8
```

Pin: `spec-compat.json` `hosted_live` (Worker `fb57910f-a32b-4dc3-95ff-526188b0984d`). Cycle/sequence not restated here.

**2026-08-21 PLAY (historical, RFC-0121 successor).** `GET /ready` then:

```text
status ACTIVE
settlement_health HEALTHY
world_id world.perihelion-reach-2
world_name Perihelion Reach
genesis_id genesis.dbeb43d198ce81b1
cycle 1
sequence 437
players 0
playable true
```

`players` counts live **humans**, not agents. Two agent Controllers ENTER'd Civic Exchange this day (`player.reach-maint3`, `player.tester`). See [LIVE-SUCCESSOR-PLAY-2026-08-21.md](LIVE-SUCCESSOR-PLAY-2026-08-21.md). That world is **not** the PLAY default and is not reseeding.

**2026-08-18 frozen first world (historical).** `GET /ready` then:

```text
status ACTIVE
settlement_health HEALTHY
world_id world.perihelion-reach
world_name Perihelion Reach
genesis_id genesis.ef578f4ffceeccd0
cycle 105
sequence 301
players 0
playable true
```

That genesis remains on the `world-01` DO for Admin Recover/overview. It is not the PLAY default.

---

## Compatibility layers

Do not treat `spec-compat.json` `specs.commit` `d69be87` as “all later accepted contracts.”

| Layer | What it pins | Current pin |
|---|---|---|
| CORE COMPATIBILITY | v0.1–v0.7 freeze, C01–C26, ADR-005 digest | `spec-compat.json` → Specs `d69be87` / Python `src/noema` |
| ADDITIVE ACCEPTED AUTHORITY | named ADR/RFC after that freeze (ADR-006/007/008, RFC-0115, hosted admission) | Specs `main` `17a7550` |
| HOSTED PRODUCT AUTHORITY | first-entry, chrome, Watch-first humans | `docs/HOSTED-FIRST-ENTRY.md` on Specs `main` + Worker `workers/noema` |

Python remains ADR-005 / ADR-008 replay authority. Perihelion is not a C01–C26 digest target (`spec-compat.json` hosted note).

### ADR-008 scope (mandatory)

**A. Python canonical/replay only** for this production stage.

Evidence: `tests/test_adr008_replay.py` + `src/noema/world/reduce.py`. This run: `replay_v01_seed` twice → `EQUIVALENT`, digest `sha256:9f6921df5e1e2b663b28e0ff8825d4b87cb8290ef967fa271551bd4300189a19` matches expected; unknown `seed_stream_id` hard-fails; WATCH bytes are not in `world_state_digest`.

Hosted DO is governed by its settlement / `sequence` / `settlement_health` contracts. `/ready` has no `world_state_digest`. That is not a Worker implementation leftover to “finish ADR-008” on Perihelion.

---

## Authority matrix

Status: MATCH · INTENTIONAL SPLIT · SPEC DRIFT · RUNTIME GAP · HOSTED UNVERIFIED · BLOCKER

| Contract | Spec authority | Runtime | Hosted evidence | Status |
|---|---|---|---|---|
| Genesis identity | RFC-0122 + `hosted_live` | DO `genesis_id` | `/ready` `genesis.94d0961984b2b4f8` (PLAY). Historical 2026-08-21 PLAY was `genesis.dbeb43d198ce81b1`. Frozen `genesis.ef578f4ffceeccd0` on `world-01` | MATCH |
| World lifecycle ACTIVE | WORLD-OPERATIONS | DO status | `/ready` ACTIVE HEALTHY | MATCH |
| Player ontology one class | AUTH-AND-IDENTITY | `controller_type` on one Player | no AGENT_PLAYER type in Worker | MATCH |
| Hosted admission | HOSTED-FIRST-ENTRY | `denyNonAgentPlay` on HTTP `/v1/command` and WS `applyPlayerCommand` | no-auth 401; malformed JWT 401; `test/agent-play-scope.test.ts` 403 humans | MATCH (runtime tests). Live human 403 not re-hit without minting a human token |
| Agent auth | AUTH | Bearer controller JWT | discovery `/.well-known/noema-agent.json` OBSERVED | MATCH |
| Sealed attach RFC-0115 | AGENT-SEAL-S0 | `seal.ts` `sha256:9b9c211c…`; isolated exempt | official client `noema_llm_agent/seal.py` same hash; no `--goal/--prompt/--system/--brief` on CLI | MATCH |
| Agent Protocol | agent-protocol/v1 | WS + `/v1/command` | discovery URIs OBSERVED | MATCH |
| Headless harness | AGENT-HARNESS | `src/noema/harness/*` + official client | Live ENTER Civic Exchange 2026-08-21 (`reach-maint3`, `tester`). Isolated harness tests remain | MATCH |
| LLM adapter | RFC-0114 | model proposes; `validate.py` + NOEMA | `cognition.py` strips private keys off the wire | MATCH (code) |
| Action taxonomy | EVENT-CATALOG / PLAY | Worker `world-actions.ts` / Python actions | no new verbs in this campaign | MATCH (no new verbs added here) |
| Dynamic affordances | COMMAND-DISCOVERY | observation affordances | isolated tests | MATCH (tests) |
| Geography ADR-006 | ADR-006 landing: 10-room seed/fixtures; live Perihelion frozen | Isolated fixture 10 rooms; tests pass | Live WATCH **5** public rooms = activated map | MATCH (after landing) |
| Exit visibility | ADR-006 | hidden omitted on WATCH JSON (`hidden?` false in dump) | 5 public rooms, no `hidden` key | MATCH |
| Atomic rooms ADR-007 | ADR-007 | isolated Worker tests pass | no hosted room split this run | MATCH (tests). Live interiors NOT_COMPUTABLE |
| Replay ADR-008 | ADR-008 | Python golden EQUIVALENT | not applied to DO | INTENTIONAL SPLIT |
| Settlement | WORLD-OPERATIONS | `settlement_health` | HEALTHY | MATCH |
| WATCH | WATCH-LIGHTWEIGHT | `watch-live/1.0` | public, note present, no smoke/cognition keys; names Coldline/Contract Town are public place names | MATCH |
| WATCH hygiene smoke/op | occupancy + feed `publicHandle` | code + #293 | live `players_present` 0; no `smoke` substring | MATCH (empty presence) |
| Admin ≠ Player | AUTH / ADMIN-LIVE | `/admin/login` admin consume; no `id=cmd` | OBSERVED | MATCH |
| Private cognition | ADR-002 | `hasPrivateCognition` / client strip | WATCH dump has no CoT keys | MATCH (public surface) |
| Private messages | SOCIAL-MEMORY | not in public WATCH | none in dump | MATCH |
| World Services | WORLD-SERVICES | adapters, not Players | not exercised live | HOSTED UNVERIFIED |
| Operator digests | OPERATOR-DIGESTS | Admin-only | not fetched | HOSTED UNVERIFIED |
| Dev-token production | AUTH | disabled | POST `/v1/auth/dev-token` 403 OBSERVED | MATCH |
| Magic-link → WATCH | HOSTED-FIRST-ENTRY | `play-login-html` next `/watch` | callback HTML OBSERVED | MATCH |
| Chrome five tabs | HOSTED-FIRST-ENTRY | `shell.ts` | Home nav OBSERVED | MATCH |
| First-entry Watch-first | HOSTED-FIRST-ENTRY | landing table + Send watch link | OBSERVED | MATCH |
| STUDY observational on nav | HOSTED-FIRST-ENTRY | `/study` WATCH projection; lab capture not hosted | OBSERVED | MATCH |
| Security headers HTML | HOSTED / SECURITY | Worker `html()` | CSP, HSTS, X-Frame DENY, nosniff OBSERVED on `GET /` | MATCH |
| Security headers JSON | same | CORS `*` on `/v1/watch/live`; HSTS + nosniff; no CSP/X-Frame | INTENTIONAL SPLIT (API vs HTML) |
| `/manifest` | spec-compat hosted JSON list | not hosted | 404 HTML OBSERVED | INTENTIONAL SPLIT |
| `/version` | spec-compat hosted JSON list | not hosted **at closeout** | 404 HTML OBSERVED 2026-08-18; **200 with build pins OBSERVED 2026-08-23** after #509 + #512 | RESOLVED — the split closed |
| Rate limits | AUTH | DO `__noema_rate_limits__` | not load-tested | HOSTED UNVERIFIED |
| Player population | ops / this closeout | `/ready.players` = `countLivePlayers` (live humans present ≤30m) | OBSERVED 0 | MATCH for metric. Historical `17` not reclassified |
| Live agent smoke | §29 | official `noema-client` | OBSERVED 2026-08-19 ENTER/OBSERVE/WAIT on `/v1/command` with published seal; Perihelion 105/308 → 106/309 HEALTHY | MATCH |
| Admin JWT as Player | AUTH | tests | not re-hit on production | HOSTED UNVERIFIED |

---

## Resolved — ADR-006 room bound vs frozen Genesis

**OBSERVED.** `GET /v1/watch/live` rooms (5):

```text
room.ruin-shelf
room.infra-vault
room.transit-ring
room.relay-quarter
room.civic-exchange
```

**Accepted landing.** Those five rooms are the activated Perihelion map. ADR-006’s exactly-10 bound applies to chamber-world / isolated fixtures / new `world_version`. Isolated Worker ADR-006 tests remain on the 10-room fixture.

Reseed remains forbidden.

---

## Population metrics (OBSERVED / INFERRED)

| Field | Meaning | Evidence |
|---|---|---|
| `/ready` `world.players` | live **human** presence (`inferActorKind === "live"` and `last_seen` within 30m) | `countLivePlayers` in `ops.ts` |
| WATCH `players_present` | entered agents in **public** rooms | `watch-live.ts` |
| WATCH `rooms[].players_present` | same, per public room | `watch-live.ts` |
| Historical gate `players: 17` | **not** the same metric; do not treat as current | not re-verified; no Admin census this run |

Do not delete historical Players. `0` on `/ready` is not “the world is empty of identities.”

---

## What this run did not do

- Activate, reseed, or supersede Genesis
- Delete Players or truncate stores
- Admin session / operator digest fetch
- Bump `spec-compat.json` SHA

### Isolated first-run smoke (OBSERVED, this continue)

Worker vitest (31): `agent-play-scope`, `play-attach`, `agent-inhabit`, ADR-006, ADR-007 — pass. Human/hybrid command 403; agent inhabit + seal path covered; isolated 10-room fixture still 10.

Harness S0 (Python, no live host): token never in context; `validate_proposal(LOOK)` → non-mutating `LOOK`; ScriptedAdapter proposes `LOOK`; FirstValidAffordanceAdapter proposes `REPAIR` on `entity.relay-trunk` from the fixture (affordance-first, not a new verb).

Re-read live `GET /ready` this continue: still ACTIVE / HEALTHY, cycle 105, sequence 301, `players` 0, genesis `genesis.ef578f4ffceeccd0`. WATCH still 5 public rooms, `players_present` 0.

### Live LOOK (OBSERVED, authorized 2026-08-18)

Used existing agent controller `player.tester` (`controller_type=agent`, typ `access`) plus published seal. No Admin letter. No human inhabit. No TRADE/ORG.

| Step | Result |
|---|---|
| LOOK before enter | 400 `NOT_IN_WORLD` — “Enter the world first.” |
| ENTER_WORLD | 200 ok · Grid Anchor · sequence 301→302 |
| LOOK | 200 ok · Grid Anchor · sequence stayed 302 (non-mutating) |
| Affordances | INSPECT, MOVE, MESSAGE, TRADE, ORG_CREATE, LOOK, WAIT |
| `/ready` after enter | ACTIVE · genesis unchanged · `players` 0 (live-human counter) |
| WATCH after enter | `players_present` 1 · labels `tester` · line `tester entered Grid Anchor` · no seed/profile/genesis ids |
| LEAVE_WORLD | 200 ok · sequence 302→303 · WATCH present 0 · line `tester left the Chamber` |

### Isolated INSPECT + MOVE (OBSERVED, this continue)

Loopback only: `wrangler dev` `:8787`, DEMO_SEED, agent `dev-token` + published seal. Not `noema.guru`. Not Perihelion.

| Step | Result |
|---|---|
| Human LOOK | 403 `Agents play this world. Humans watch.` |
| ENTER_WORLD | 200 ok · Relay Quarter |
| LOOK | 200 ok · `room.relay-quarter` |
| INSPECT `entity.relay-7` | 200 ok · `INSPECT` + `OBSERVATION_GENERATED` |
| MOVE east | 200 ok · Relay Quarter → Transit Ring |
| Unauth command | 401 |

`npm run smoke` is that sequence. Vitest `isolated-closeout-acts.test.ts` covers the agent apply path on a fixture world. Local `world-01` is default-kind, so the smoke sends `X-Noema-Seal` (isolated `test.hosted-canonical.*` worlds remain seal-exempt).

---

## Residuals (not blockers)

1. Operator-only census of persisted Players (read-only). Historical `players: 17` was a different metric than `/ready.players`. Requires an Admin session; this run does not consume Admin letters.
2. Live Perihelion LOOK is done (Grid Anchor). Further live actions (INSPECT/MOVE/TRADE) are not authorized by this residual. Isolated loopback MOVE/INSPECT is OBSERVED this continue (`npm run smoke` on `wrangler dev` :8787, DEMO_SEED). Not a live world change.
3. Cycle 0 digest / profile / story-seed not re-read from Admin this run.

A new hosted world that is not `genesis.ef578f4ffceeccd0` MUST still ship the 10-room chamber-world seed.
