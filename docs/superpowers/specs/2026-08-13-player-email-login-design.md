# Player email magic-link login

**Status:** approved  

**Date:** 2026-08-13  
**Host:** `https://noema.guru`  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** This path never mints `typ: admin-access`.

## Problem

Production PLAY still asks for a pasted Access token. Admin email login is live only at `/admin/login`. The homepage and `/play` do not show it. Operators (and future Players) who follow a generic Supabase “sign in” link do not get an ADMIN session and cannot enter the world without an operator-minted token.

## Goal

Any valid email can request a magic link from the **homepage** and **`/play`**. After they click it, the Worker mints a **Player** controller JWT (`typ: access`, `controller_type: human`) and PLAY opens already in session.

Success is binary:

- Homepage and `/play` show an email field as the primary gate.
- Consume mints `typ: access` only. That token opens PLAY / `/v1/me` / `/v1/command`.
- That token is **401** on every `/v1/admin/*` route (`resolveAdmin` requires `typ: admin-access`).
- An allowlisted operator email on this path is still a Player.
- `/admin/login` is unchanged (allowlist + admin-access).
- Live world identity is unchanged.

## Non-goals

- Making ADMIN available from `/` or `/play`
- Public agent signup
- Passwords, TOTP, OAuth providers
- Changing Genesis, reseed, pause
- Removing `POST /v1/admin/controller-token` (agents still use it)
- Re-enabling `/v1/auth/dev-token` in production

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Who | Any email (public PLAY) |
| Surfaces | Homepage **and** `/play` |
| Mailer | Existing Supabase Auth (same secrets as admin login) |
| Session | Worker mints Player controller JWT via `mintControllerToken` |
| Player id | Supabase `user.id` (`sub`), not email local-part (avoids `alice@x` / `alice@y` collision) |
| Token paste | Advanced disclosure on `/play` only (agents / operator mint) |
| Admin path | Unchanged at `/admin/login` |
| Genesis | Untouched |

## Architecture

```text
Browser (/ or /play)     Worker                      Supabase Auth
   |                        |                              |
   | POST /v1/play/login/request                           |
   | { email }              |-- throttle ----------------->|
   |                        |-- POST /auth/v1/otp          |
   | 200 generic body       |<-----------------------------|
   |                        |                              |
   | click magic link ------------------------------------>|
   | redirect /play/callback?token_hash=&type=             |
   |                        |                              |
   | POST /v1/play/login/consume                           |
   |                        |-- verify hash --------------->|
   |                        |-- mint typ:access (human)    |
   | store noema.play.token |                              |
   | location /play         |                              |
```

The Worker is the only party that uses the service role. The browser never stores a Supabase access token.

## Configuration

No new secrets. Reuse `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_SIGNING_SECRET`.

Operator dashboard (not code): add redirect URL

```text
https://noema.guru/play/callback
http://127.0.0.1:8787/play/callback
```

Magic Link template already required for ADMIN must **also** work for PLAY. Use one template that cannot hardcode `/admin/callback` only.

Preferred template (redirect_to is supplied per request):

```text
{{ .ConfirmationURL }}
```

is **not** sufficient if it omits `token_hash`. The consume path needs `token_hash` (or `code`). Implementation MUST:

1. Pass `email_redirect_to` = `{origin}/play/callback` on the PLAY otp request.
2. Read `token_hash` / `type` / `code` from `location.search` **and** `location.hash`.
3. Never persist hash `access_token` / `refresh_token`.

If the hosted Magic Link HTML is a custom button, operators should prefer:

```text
https://noema.guru/play/callback?token_hash={{ .TokenHash }}&type={{ .Type }}
```

for PLAY-initiated mail, and the admin URL for ADMIN-initiated mail. Because Supabase has **one** Magic Link template per project, v1 uses `email_redirect_to` on the otp call (PLAY vs ADMIN already pass different callbacks). Document that the template must preserve `token_hash` on whatever site URL Supabase appends, **or** operators keep two-step: ConfirmationURL landing on the `redirect_to` we sent (`/play/callback` or `/admin/callback`) with hash params that our callback already reads.

v1 acceptance: a PLAY request’s otp `email_redirect_to` is `{origin}/play/callback`; callback page is `/play/callback`; consume works with `token_hash` from query or hash. Admin template docs stay in `OPERATOR-SMOKE.md`.

## HTTP API

### `POST /v1/play/login/request`

Public. Body: `{ "email": string }`.

1. `normalizeEmail` — invalid → 400 `INVALID_REQUEST`.
2. Throttle 5 / hour / IP and 5 / hour / email (reuse `LoginThrottle` **or** a separate instance so PLAY traffic cannot starve ADMIN). Over → 429 `RATE_LIMITED`, `retryable: true`.
3. If Supabase is configured: `POST {SUPABASE_URL}/auth/v1/otp` with `create_user: true` and `email_redirect_to: {origin}/play/callback`. `origin` is `https://noema.guru` when `NOEMA_ENV=production`, else request origin.
4. Always 200 except 400/429:

```json
{
  "ok": true,
  "message": "If that mailbox can play, a link is on the way."
}
```

Send failures stay 200. `console.error` without the mailbox.

There is **no** allowlist on this path.

### `POST /v1/play/login/consume`

Public, one-shot. Body: `{ "token_hash", "type" }` or `{ "code" }`.

1. Missing fields → 400.
2. Verify / exchange with Supabase (same as admin consume).
3. Upstream 400–499 → 401 `NOT_AUTHORIZED`. Network / 5xx → 502 `UPSTREAM`.
4. Require `user.id` (or `user.sub`) and `user.email`. Missing → 401.
5. Handle = local-part of email, sanitized `[A-Za-z0-9_-]`, length 2–32, fallback `player`.
6. Mint via `mintControllerToken(env, { handle, controllerType: "human", expiresIn: 86400 })` **and** set claims:

   - `player_id` = `player.{sub_compact}` where `sub_compact` is `user.id` with hyphens removed, first 12 hex chars (same idea as existing Supabase Player path in `resolvePrincipal`).
   - `identity_id` = full Supabase user id.
   - `amr` = `email_magic_link`.
   - `issued_by` must **not** be `admin`.

   If `mintControllerToken` currently derives `player_id` from handle only, extend it with an optional `playerId` / `identityId` override used only by this consume path. Admin-minted tokens keep handle-based ids.

7. Response (no Supabase tokens):

```json
{
  "access_token": "<typ:access jwt>",
  "token_type": "bearer",
  "player_id": "player.<sub12>",
  "controller_type": "human",
  "expires_in": 86400
}
```

### Unchanged

| Route | Behavior |
|-------|----------|
| `POST /v1/admin/login/*` | Allowlisted ADMIN mint |
| `POST /v1/admin/session` | CLI operator token |
| `POST /v1/admin/controller-token` | Operator-minted Player (agents) |
| `POST /v1/auth/dev-token` | Still 403 in production |

## Routes (HTML)

| Path | Behavior |
|------|----------|
| `/` | Primary control: email + “Send play link”. Copy: this signs you into the world as a Player, not ADMIN. Link to `/admin/login` as “Operator login” in small type. |
| `/play` | Same email gate when `noema.play.token` is missing. After session, existing Chamber UI. “Agent / advanced” disclosure: Access token paste (operator-minted). |
| `/play/callback` | Reads `token_hash` / `type` / `code` from search and hash. POST consume. Store **only** `noema.play.token` (and handle if already stored). Redirect `/play`. Failure → `/play?error=1` with generic notice. |
| `/admin/login` | Unchanged |

Do not store email or Supabase tokens in `sessionStorage`.

Homepage and PLAY share `noema.play.token` so a homepage link lands on `/play` already signed in.

## Isolation

| Token | PLAY / `/v1/me` / `/v1/command` | `/v1/admin/*` |
|-------|----------------------------------|---------------|
| PLAY consume `typ: access` | allowed | 401 / 403 — not admin-access |
| Admin `typ: admin-access` | 401 | allowed |
| Raw Supabase JWT | existing Player mapping (unchanged) | 401 |
| Operator-minted controller | Player | 401 |

A PLAY consume JWT MUST fail `resolveAdmin`. An admin JWT MUST fail `resolvePrincipal`.

## Rate limit

Separate `LoginThrottle` instance from ADMIN (`playLoginThrottle`) so a public PLAY flood cannot 429 operator login. Same numbers: 5 / 3600s / `ip:` and `email:`.

## Errors

| Case | HTTP | Code |
|------|------|------|
| Bad email | 400 | `INVALID_REQUEST` |
| Throttled | 429 | `RATE_LIMITED` |
| Supabase missing on consume | 503 | `NOT_CONFIGURED` |
| Provider 5xx / network | 502 | `UPSTREAM` |
| Bad/expired link | 401 | `NOT_AUTHORIZED` |

## Tests (vitest, no live mail)

1. PLAY request: any valid email calls otp (no allowlist); same generic 200; `email_redirect_to` ends with `/play/callback`.
2. Invalid email → 400; sixth same IP → 429; ADMIN throttle is a different instance (PLAY hits do not increment admin throttle).
3. Consume verify stub with `user.id` + email → `typ: access`, `controller_type: human`, `player_id` uses compact sub, no `refresh_token`, `issued_by` absent.
4. That token: `resolvePrincipal` succeeds; `resolveAdmin` 401/403.
5. Admin-access token still rejected by `resolvePrincipal`.
6. PLAY login HTML (homepage + play gate) has `id="email"` and `/v1/play/login/request`; play advanced still mentions Access token; homepage does not say “Operator token” as the primary field.
7. `/play/callback` HTML reads `location.hash` and never stores `refresh_token`.
8. Existing admin email-login tests still pass.

## Deploy

1. Add Supabase redirect `/play/callback`.
2. `NOEMA_ENV=production npm run deploy`. No reseed, no activate.
3. Smoke: request from `/play` with a real mailbox → link → PLAY session → LOOK. `/admin` with that session still redirects to admin login.

## Files (implementation, later)

- `workers/noema/src/auth.ts` — optional `playerId` / `identityId` on `mintControllerToken`
- `workers/noema/src/play-auth.ts` — request/consume + play throttle (keep `admin-auth.ts` admin-only)
- `workers/noema/src/index.ts` — `/v1/play/login/*`, `GET /play/callback`
- `workers/noema/src/play.ts` / `play-ui.ts` / `landing.ts` — email gate
- `workers/noema/test/play-email-login.test.ts`
- `docs/OPERATOR-SMOKE.md` — note PLAY email vs ADMIN email

## Out of this change

`/version` `/manifest` `/config` · STUDY · Cloudflare Access · passwords · v0.8 · second Genesis · treating operator email as ADMIN on PLAY.
