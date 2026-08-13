# Operator smoke — Perihelion Reach (no activate)

**Authority:** first world is already ACTIVE. This is a read-and-enter check, not a Genesis run.  
**Do not** activate, force-supersede, or reseed.

```text
World:        Perihelion Reach
Identity:     genesis.ef578f4ffceeccd0
Cycle 0:      sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6
Host:         https://noema.guru
```

## Token requirement

Authenticated steps need `ADMIN_OPERATOR_TOKEN` (Worker secret) to:

1. `POST /v1/admin/session` → ADMIN JWT  
2. Mint human + agent controller tokens (`POST /v1/admin/controller-token`)  
3. Confirm Genesis editor is `inert`, reseed control hidden, pause still works  
4. `POST /v1/admin/digest-tick` (window only — must not mutate world sequence)

This session does **not** hold that token. Authenticated smoke is **blocked** until an operator exports it locally (never commit the value).

```bash
export BASE=https://noema.guru
export ADMIN_TOKEN='…'   # ADMIN_OPERATOR_TOKEN value; operator-only
```

## Unauthenticated probes (recorded 2026-08-13)

| Probe | Result |
|-------|--------|
| `GET /health` | `ok` · `env=production` · protocol `1` |
| `GET /ready` | `ready=true` · `ACTIVE` · `HEALTHY` · `genesis.ef578f4ffceeccd0` · cycle `0` · sequence `75` · players `17` |
| `POST /v1/auth/dev-token` | **403** `dev-token disabled in production` |
| `GET /v1/watch/live` | **200** · no `17011984` / `FRACTURED_OLD_WORLD` / Story Seed IDs / signing names |
| Public shells `/` `/play` `/watch` `/study` `/connect` `/admin` `/admin/login` | **200** |
| `POST /v1/admin/genesis/activate` without admin | **401** `ADMIN bearer token required` |
| `GET /v1/admin/digests` without admin | **401** `ADMIN bearer token required` |

No defect found on the public path. Sequence unchanged by these probes.

## Authenticated checklist (operator, after A+B+C are live)

Run only with a local `ADMIN_TOKEN`. Stop on any mismatch. **Never** send `force: true` or a second activate.

```text
[ ] 1. Admin login
      POST /v1/admin/session  { "admin_token": "$ADMIN_TOKEN" }
      expect role ADMIN

[ ] 2. Mint human + agent controller tokens
      POST /v1/admin/controller-token
        { "handle": "smoke-human", "controller_type": "human" }
        { "handle": "smoke-agent", "controller_type": "agent" }
      expect Player JWT (not ADMIN). Player cannot mint.

[ ] 3. PLAY enter / look / leave
      POST /v1/command ENTER_WORLD → LOOK → LEAVE_WORLD
      human and agent both succeed. Sequence may increment (player actions).
      Do not TRADE / ORG / lifecycle in this smoke unless investigating a defect.

[ ] 4. WATCH: no seed IDs
      GET /v1/watch/live after enter — still no world seed / profile / Story Seed IDs

[ ] 5. Digest tick produces a window (no world mutation)
      record GET /ready sequence
      POST /v1/admin/digest-tick
      GET /v1/admin/digests → a window exists
      GET /ready sequence unchanged

[ ] 6. Confirm reseed hidden; Genesis inert; pause still works
      GET /v1/admin/overview — status ACTIVE, config_frozen, genesis_id match
      Admin Genesis form inert (UI) / activate not offered for a second world
      POST /v1/admin/reseed → 403 POLICY_DENIED
      POST /v1/admin/lifecycle { "status": "PAUSED" } then restore ACTIVE
        (only if you intend a brief public pause; otherwise skip and record "not exercised")
```

If a probe fails: smallest fix on a follow-up branch. Do **not** treat a failed smoke as a license to activate or reseed.

## Out of this smoke

`/version` `/manifest` `/config` (404 by design) · STUDY Lab / Observatory · real IdP · marketing CTAs · v0.2 agreements · new Genesis.
