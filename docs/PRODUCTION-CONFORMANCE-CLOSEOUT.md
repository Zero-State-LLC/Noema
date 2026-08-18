# NOEMA production conformance closeout

**Date.** 2026-08-18  
**Verdict.** `NOEMA PRODUCTION CONFORMANT`

**Amendment.** ADR-006 landing: live Perihelion `genesis.ef578f4ffceeccd0` keeps its activated room set. The 10-room bound applies to chamber-world / isolated fixtures / new hosted `world_version`. The previous BLOCKER (WATCH 5 rooms vs ADR-006 “exactly 10”) is resolved as accepted identity, not a runtime spawn bug.

**Repos.**

| Repo | `origin/main` | Note |
|---|---|---|
| Noema-Specs | `17a75505ff32b9a044ef88c7e1bbb51565c04e71` | `#168` five-tab + gateway admission |
| Noema | `997321984355437f41935a41c93e79c0a9c28009` | `#302` specs audit (docs). Live Worker code is `#301` `fef4cc0` + earlier inhabit/seal |

**Open PRs at start of this run.** none (both repos).

**Hosted evidence** (2026-08-18, `https://noema.guru`, User-Agent Mozilla). Labels: OBSERVED / INFERRED / NOT_COMPUTABLE.

This file is evidence, not a world-rule change. No Genesis, no reseed, no Player deletes.

---

## Production identity (OBSERVED)

`GET /ready`:

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

Matches the frozen Genesis ID. Profile / story-seed / world-seed / Cycle 0 digest were **not** re-read from Admin in this run (NOT_COMPUTABLE without operator session). They remain the approved identity; this run did not alter them.

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
| Genesis identity | FIRST-WORLD / this closeout | DO `genesis_id` | `/ready` `genesis.ef578f4ffceeccd0` | MATCH |
| World lifecycle ACTIVE | WORLD-OPERATIONS | DO status | `/ready` ACTIVE HEALTHY | MATCH |
| Player ontology one class | AUTH-AND-IDENTITY | `controller_type` on one Player | no AGENT_PLAYER type in Worker | MATCH |
| Hosted admission | HOSTED-FIRST-ENTRY | `denyNonAgentPlay` on HTTP `/v1/command` and WS `applyPlayerCommand` | no-auth 401; malformed JWT 401; `test/agent-play-scope.test.ts` 403 humans | MATCH (runtime tests). Live human 403 not re-hit without minting a human token |
| Agent auth | AUTH | Bearer controller JWT | discovery `/.well-known/noema-agent.json` OBSERVED | MATCH |
| Sealed attach RFC-0115 | AGENT-SEAL-S0 | `seal.ts` `sha256:9b9c211c…`; isolated exempt | official client `noema_llm_agent/seal.py` same hash; no `--goal/--prompt/--system/--brief` on CLI | MATCH |
| Agent Protocol | agent-protocol/v1 | WS + `/v1/command` | discovery URIs OBSERVED | MATCH |
| Headless harness | AGENT-HARNESS | `src/noema/harness/*` + `clients/noema-llm-agent` | CONNECT inhabit snippet live | MATCH (code). Live ENTER not executed this run |
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
| STUDY off nav | HOSTED-FIRST-ENTRY | stub `/study` | OBSERVED | MATCH |
| Security headers HTML | HOSTED / SECURITY | Worker `html()` | CSP, HSTS, X-Frame DENY, nosniff OBSERVED on `GET /` | MATCH |
| Security headers JSON | same | CORS `*` on `/v1/watch/live`; HSTS + nosniff; no CSP/X-Frame | INTENTIONAL SPLIT (API vs HTML) |
| `/version` `/manifest` | spec-compat hosted JSON list | not hosted | 404 HTML OBSERVED | INTENTIONAL SPLIT |
| Rate limits | AUTH | DO `__noema_rate_limits__` | not load-tested | HOSTED UNVERIFIED |
| Player population | ops / this closeout | `/ready.players` = `countLivePlayers` (live humans present ≤30m) | OBSERVED 0 | MATCH for metric. Historical `17` not reclassified |
| Live agent smoke | §29 | — | not run (no authorized live agent token; would mutate) | HOSTED UNVERIFIED |
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
- Live `ENTER_WORLD` on Perihelion
- Admin session / operator digest fetch
- Bump `spec-compat.json` SHA

---

## Residuals (not blockers)

1. Operator-only census of persisted Players (read-only). Historical `players: 17` was a different metric than `/ready.players`.
2. Authorized isolated-then-live agent LOOK smoke (not run; would mutate).
3. Cycle 0 digest / profile / story-seed not re-read from Admin this run.

A new hosted world that is not `genesis.ef578f4ffceeccd0` MUST still ship the 10-room chamber-world seed.
