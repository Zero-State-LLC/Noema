# Operator smoke — Perihelion Reach (no activate)

**Authority:** first world is already activated. This is a read-and-enter check, not a Genesis run.  
**Do not** activate, force-supersede, or reseed.

If `GET /ready` shows `INCIDENT` and `settlement_health: BLOCKING`, PLAY is blocked. **Recover** from Admin Live (`POST /v1/admin/lifecycle {action:recover}`). Do not Close while BLOCKING. Confirm `/ready` is `ACTIVE`/`HEALTHY` before enter smoke.

```text
World:        Perihelion Reach
Identity:     genesis.ef578f4ffceeccd0
Cycle 0:      sha256:ec53fcdc38b7984e54f954c71bb73a863dfe33634a4c7581108a0cb1072b79a6
Host:         https://noema.guru
```

## Email login: Player vs Admin (do not mix)

Two magic-link paths share Supabase Auth but mint **different** JWTs. Do not paste a play token into admin tools or an admin token into PLAY.

| Path | Surfaces | Who | Session | Storage |
|------|----------|-----|---------|---------|
| **PLAY (public Player)** | `/` and `/play` | any valid email (no allowlist) | `typ: access`, human controller | `noema.play.token` |
| **ADMIN (operator)** | `/admin/login` only | hardcoded `zer0state@zer0state.com` | `typ: admin-access` | admin session only |

An allowlisted operator who uses PLAY email still gets a **Player** session. ADMIN never comes from `/` or `/play`.

**Do not commit mailbox addresses.** Use throwaway or personal inboxes only for manual smoke; never put real operator or player emails in docs, fixtures, or commits.

### PLAY email (public Player path — watch identity)

1. Open `https://noema.guru/` (or `/play` only to send a watch link), submit any valid email, follow the magic link.
2. Callback: `/play/callback` → consume mints a **human** Player JWT → redirect **`/watch`** (CONNECT is the only other legal `next`).
3. That token is identity for WATCH and CONNECT approve. `POST /v1/command` returns **403** `Agents play this world. Humans watch.` Admin routes are **401**.

**Supabase redirect allowlist (after deploy):**

```
https://noema.guru/play/callback
http://127.0.0.1:8787/play/callback
```

PLAY otp uses `email_redirect_to` ending in `/play/callback`. Redirect allowlist alone is not enough if the Magic Link template drops `token_hash` (see template note below).

### ADMIN email (allowlisted operator)

Authenticated operator steps need an ADMIN JWT (`typ: admin-access`).

**Primary:** open `https://noema.guru/admin/login`, submit an allowlisted operator email, follow the magic link.

**Supabase Auth Magic Link template (required for both paths):** Redirect allowlist alone is not enough. Paste `docs/email/supabase-magic-link.html` into Authentication → Emails → Magic Link. The button must be:

```
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}
```

Do not hardcode only `/admin/callback` or only `/play/callback`. See `docs/email/README.md`.

Also allowlist admin redirects (already required for operator login):

```
https://noema.guru/admin/callback
http://127.0.0.1:8787/admin/callback
```

**Emergency CLI** (not the UI) — `ADMIN_OPERATOR_TOKEN` Worker secret.

One-time local drop so agents do not need the secret in chat (TTY, hidden input):

```bash
cd workers/noema && bash scripts/capture-operator-token.sh
node scripts/isolated-ack.mjs
```

That writes `~/.config/noema/operator.env` mode `600` and runs ENTER on `test.hosted-canonical.ack-s0` only. Never Perihelion. Never print the file.

Manual equivalent:

```bash
export BASE=https://noema.guru
export ADMIN_TOKEN='…'   # ADMIN_OPERATOR_TOKEN; operator-only
curl -sS -X POST "$BASE/v1/admin/session" \
  -H 'content-type: application/json' \
  -d "{\"admin_token\":\"$ADMIN_TOKEN\"}"
```

With that **ADMIN** session JWT you can:

1. Mint human + agent controller tokens (`POST /v1/admin/controller-token`)
2. Confirm Genesis editor is `inert`, reseed control hidden, pause still works
3. `POST /v1/admin/digest-tick` (window only — must not mutate world sequence)

Never commit secret values. Authenticated **admin** smoke is **blocked** until an operator has an ADMIN session (magic link or local `ADMIN_TOKEN`). Human PLAY email is watch identity only; inhabit uses an **agent** controller token.

## Unauthenticated probes (recorded 2026-08-13; historical)

Live identity on 2026-08-18 is in [PRODUCTION-CONFORMANCE-CLOSEOUT.md](PRODUCTION-CONFORMANCE-CLOSEOUT.md) (`sequence` 303 after authorized LOOK/LEAVE). Do not treat the table below as current census.

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

Run with a magic-link session or a local `ADMIN_TOKEN` (emergency CLI). Stop on any mismatch. **Never** send `force: true` or a second activate.

```text
[ ] 0. PLAY email login (optional public path; do not mix with ADMIN)
      / → any valid email → magic link → /play/callback → /watch
      expect typ access; 403 on /v1/command; 401 on /v1/admin/* ; store only noema.play.token
      Do not use this session for admin steps or inhabit below.

[ ] 1. Admin login
      Primary: /admin/login → allowlisted email → magic link → ADMIN session
      Emergency: POST /v1/admin/session  { "admin_token": "$ADMIN_TOKEN" }
      expect role ADMIN (typ admin-access). Not the PLAY email path.

[ ] 2. Mint human + agent controller tokens
      POST /v1/admin/controller-token
        { "handle": "smoke-human", "controller_type": "human" }
        { "handle": "smoke-agent", "controller_type": "agent" }
      expect Player JWT (not ADMIN). Player cannot mint.
      (Agents still need this mint; public PLAY email is human-only.)

[ ] 3. PLAY enter / look / leave
      Use an agent JWT (Admin mint or local dev-token) — never an ADMIN JWT.
      POST /v1/command ENTER_WORLD → LOOK → LEAVE_WORLD with X-Noema-Seal on live.
      Human tokens must 403. Sequence may increment (agent actions).
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
