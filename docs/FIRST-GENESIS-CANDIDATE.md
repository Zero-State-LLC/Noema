# First Genesis candidate — Perihelion Reach

**Status:** Production host **ACTIVE** at the approved identity · nothing remains for activation  
**Do not re-activate, force-supersede, or reseed.**

## Configuration (exact)

```text
World:        Perihelion Reach
Profile:      FRACTURED_OLD_WORLD
Story Seeds:  OLD_TRADE_NETWORK, LOST_ARCHIVE
World Seed:   17011984
Theme:        perihelion-reach (vocabulary/pressure only — not lore)
```

Fixture: `examples/genesis/perihelion-reach-final-candidate.json`

## Determinism receipt

| Field | Value |
|--------|--------|
| Host (rehearsal, then production) | `https://noema.guru` (now `NOEMA_ENV=production`, same identity) |
| Runtime commit | `9871e06be5f71ba1947be9e502abb2d7f7c985a8` |
| Timestamp (UTC) | `2026-08-12T22:57:27Z` |
| Spec pin | Noema-Specs genesis/0.6 · profiles & story-seeds v0.6 |
| Candidate input digest | `sha256:7e4f1ca457dccb0ce78c8ce26c57a67242960ab7e4e44ee9118dbe1c16d7f151` |
| Preview A genesis_id | `genesis.ef578f4ffceeccd0` |
| Preview A Cycle 0 digest | `sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6` |
| Preview B | **identical** |
| Determinism | **PASS** |
| Validation | **PASS** (`errors: []`) |
| Live world unchanged by preview | **PASS** |

## Structural preview (from candidate)

**Locations (5)**  
Grid Anchor · Coldline · Contract Town · Black Channel · Dead Spur

**Resources**  
energy: mixed · storage: low · transport: low · trade-access: mixed

**Institutions**  
- Active: Nacre Compact  
- Dormant: Prior Compact  

**Infrastructure / entities (examples)**  
Relay/grid trunk, bond-board, market-post, scarred conduit under hub

**Historical traces**  
Damaged relay corridor; maker marks / incomplete ledgers; ghost route east; legacy access-control remnants; fragmentary archive

**Unresolved tensions**  
- Obsolete credentials vs sealed ledgers  
- Partial trade-route obligations  

**Starting opportunities**  
salvage · repair · trade · exploration · claiming access · institution building · negotiation · information brokerage · route recovery · artifact investigation

**Character (theme, not lore)**  
Technological frontier / degraded commercial infrastructure / space-western economics / cyberpunk decay without neon cosplay

## Rehearsal activation (non-production)

| Check | Result |
|--------|--------|
| Atomic activate | PASS |
| Config frozen | PASS |
| DO digest == Cycle 0 digest | PASS (`digest_match: true`) |
| Supabase settlement | PASS · `settlement.genesis.ef578f4ffceeccd0` |
| Ordinary reseed after freeze | **403 DENIED** |
| Force supersede in production | Code-denied when `NOEMA_ENV=production` |

## Player / WATCH smokes (post-rehearsal activate)

| Smoke | Result |
|--------|--------|
| Human ENTER/LOOK/MOVE/INSPECT | PASS (entry: Grid Anchor) |
| Agent ENTER/LOOK/MOVE | PASS (same world / same entry room class) |
| Player observation redaction | PASS (no Story Seed IDs / seed / profile) |
| WATCH redaction | PASS (public sites only) |
| Admin overview | ACTIVE · frozen · seed 17011984 |

## Production activation procedure (human only)

1. Login to production ADMIN (`ADMIN_OPERATOR_TOKEN`).  
2. Enter exact final candidate above.  
3. Preview.  
4. Record production `genesis_id`.  
5. Record production Cycle 0 digest.  
6. **Compare** to approved rehearsal identity/digest above.  
7. If mismatch → **STOP**.  
8. **Human operator approves** (not CI).  
9. ACTIVATE (`confirm: true`; **never** `force` in production).  
10. Verify settlement `digest_match`.  
11. Human Player smoke.  
12. Agent Player smoke.  
13. WATCH smoke.  
14. Record first-world activation receipt.  

## Environment note

Product host is `NOEMA_ENV=production` (cut over 2026-08-12) and **already ACTIVE** at this candidate:

- Live: `genesis.ef578f4ffceeccd0` · Cycle 0 `sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6`  
- Dev-token **denied** in production  
- Force supersede **denied** in production  
- Reseed **denied** in production  
- Controlled entry: Admin → operator-minted human/agent token → PLAY  
- Preview of this candidate **exact-matches** the live identity (non-mutating)

Nothing remains for production activation. See [PRODUCTION-GENESIS-GATE.md](PRODUCTION-GENESIS-GATE.md).

## Verdict

```text
ACTIVE AT APPROVED IDENTITY · DO NOT RE-ACTIVATE
```

Awaiting nothing for activation. Further ops are hygiene (security deploy, env pin, operator smoke) — not a second Genesis.
