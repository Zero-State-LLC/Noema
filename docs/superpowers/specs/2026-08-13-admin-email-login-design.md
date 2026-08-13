# Admin email magic-link login

**Status:** design — awaiting review before implementation  
**Date:** 2026-08-13  
**Host:** `https://noema.guru`  
**Does not activate, reseed, or force-supersede Genesis.**

## Problem

`/admin/login` is a single password box for `ADMIN_OPERATOR_TOKEN`. That value is a Cloudflare Worker secret: it is not in email, git, or `.env`, and wrangler cannot print it back. Operators cannot reach ADMIN without rotating the secret.

## Goal

An allowlisted operator types their email on `/admin/login`, receives a Supabase Auth magic link, and lands in ADMIN with the existing `typ: admin-access` session. The token field is removed from the login page.

Success is binary:

- Allowlisted mailbox can complete login and call `GET /v1/admin/overview`.
- Any other mailbox cannot obtain an admin-access JWT.
- A raw Supabase JWT is never stored as the admin session and never unlocks ADMIN.
- `GET /v1/me` with the minted admin JWT remains 401.
- Live world identity is unchanged.

## Non-goals

- Player email login / public signup
- Extra mailboxes committed to git
- Password reset, TOTP, passkeys
- Cloudflare Access
- New Genesis, reseed, pause, or PLAY auth changes
- Removing `ADMIN_OPERATOR_TOKEN` from the Worker (CLI emergency path stays)

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Factor | Magic link to allowlisted emails |
| Mailer | Existing Supabase Auth (live `SUPABASE_URL` + service role) |
| Session | Worker mints current `typ: admin-access` JWT |
| Login UI | Email only — no operator-token field |
| CLI | `POST /v1/admin/session` + `ADMIN_OPERATOR_TOKEN` remains |
| Allowlist | Worker secret `ADMIN_ALLOWLIST_EMAILS` (not `[vars]`) |
| Throttle | 5 requests / hour / IP and 5 / hour / normalized email |
| Genesis | Untouched |

## Architecture

```text
Browser                  Worker                         Supabase Auth
   |                        |                                 |
   | POST /login/request    |                                 |
   | { email }              |-- allowlist? ------------------>|
   |                        |   if yes: POST /auth/v1/otp     |
   | 200 same generic body  |<--------------------------------|
   |                        |                                 |
   | click magic link ---------------------------------------->|
   | redirect /admin/callback?token_hash=&type=                 |
   |                        |                                 |
   | POST /login/consume    |-- verify hash / exchange code ->|
   |                        |-- email still allowlisted?      |
   |                        |-- mint admin-access JWT         |
   | store admin JWT only   |                                 |
   | GET /admin             | resolveAdmin (unchanged)        |
```

The Worker is the only party that talks to Supabase with the service role. The browser never sees `SUPABASE_SERVICE_ROLE_KEY` or a Supabase access token for this flow.

## Configuration

New Worker secret (names only, never values in git or health):

```text
ADMIN_ALLOWLIST_EMAILS
```

Format: comma-separated mailboxes, compared after trim + lowercase. Example shape (do not commit a real mailbox list):

```text
operator@example.com,backup@example.com
```

Required existing secrets (already configured on production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_SIGNING_SECRET`.

Operator dashboard step (not code): add redirect URL to the Supabase project:

```text
https://noema.guru/admin/callback
http://127.0.0.1:8787/admin/callback
```

If `ADMIN_ALLOWLIST_EMAILS` is missing or empty, `POST /v1/admin/login/request` still returns the generic 200 body and does not call Supabase. `POST /v1/admin/login/consume` returns 503 `NOT_CONFIGURED`.

## HTTP API

### `POST /v1/admin/login/request`

Public. Body: `{ "email": string }`.

1. Normalize email: trim, lowercase. Invalid shape (no `@`, empty) → 400 `INVALID_REQUEST`.
2. Apply throttle (IP from `CF-Connecting-IP` else `0.0.0.0`; plus normalized email). Over limit → 429 `RATE_LIMITED`, `retryable: true`. Throttle does not disclose allowlist membership.
3. If email is on the allowlist and Supabase is configured: `POST {SUPABASE_URL}/auth/v1/otp` with service role:

```json
{
  "email": "<normalized>",
  "create_user": true,
  "options": {
    "email_redirect_to": "<origin>/admin/callback",
    "should_create_user": true
  }
}
```

`origin` is `https://noema.guru` when `NOEMA_ENV=production`, else the request origin (local wrangler). `create_user` runs **only** after the allowlist check, so non-operators never get Auth users.

4. Always return 200 (except 400/429):

```json
{
  "ok": true,
  "message": "If that mailbox is authorized, a link is on the way."
}
```

Unknown email, allowlisted email, and Supabase send failure all use this body. Log send failures server-side only (no mailbox in client response).

### `POST /v1/admin/login/consume`

Public, one-shot. Body is one of:

```json
{ "token_hash": "<hash>", "type": "magiclink" }
{ "code": "<pkce-or-auth-code>" }
```

1. Reject missing fields with 400.
2. If `token_hash`: `POST {SUPABASE_URL}/auth/v1/verify` `{ "type": "magiclink", "token_hash" }` (accept `type=email` if Supabase sends that).
3. If `code`: exchange at `{SUPABASE_URL}/auth/v1/token` (authorization code). No PKCE verifier is stored by this v1 if Supabase is configured for implicit/token_hash magic links; prefer `token_hash` as the primary production path.
4. Read `user.email` from the verify/exchange response. Missing email → 401.
5. Re-check allowlist. Fail → 401 `NOT_AUTHORIZED`, no JWT.
6. Mint the existing admin JWT (`typ: admin-access`, `role: ADMIN`, `noema.world.admin` scope, 3600s) with claim `amr: "email_magic_link"`. `resolveAdmin` sets `authentication_context` from `amr` (`email_magic_link` or `operator_token`). CLI-minted sessions keep `amr: "operator_token"`.
7. Response (no Supabase tokens):

```json
{
  "access_token": "<admin-access jwt>",
  "token_type": "bearer",
  "session_id": "asess.<id>",
  "role": "ADMIN",
  "expires_in": 3600
}
```

### `POST /v1/admin/session`

Unchanged. Requires `admin_token` matching `ADMIN_OPERATOR_TOKEN`. Not linked from the login page. Smoke scripts and curl keep this path.

### Unchanged admin surface

`resolveAdmin`, overview, controller-token mint, genesis, lifecycle, digests: still require `typ: admin-access`. No new privilege.

## Routes (HTML)

| Path | Behavior |
|------|----------|
| `/admin/login` | Email field, submit request, “check your email” status. No token input. Copy: ADMIN is not a player login. |
| `/admin/callback` | Reads `token_hash` + `type` (and `code` if present) from the query. POSTs consume. On success, `sessionStorage` keys stay `noema.admin.token` / `noema.admin.session`. Redirect `/admin`. On failure, redirect `/admin/login` with a generic error. |
| `/admin` | Unchanged; still requires admin-access in sessionStorage. |

Do not put the email or hash into `sessionStorage`.

## Isolation (admin ≠ player)

| Token | PLAY / `/v1/me` / `/v1/command` | ADMIN `/v1/admin/*` |
|-------|----------------------------------|---------------------|
| `typ: admin-access` | 401 | allowed |
| Supabase `aud=authenticated` | existing Player path (unchanged) | 401 — not admin-access |
| Operator-minted controller JWT | Player | 401 |

Callback **must** mint. If consume ever returned the Supabase access token, a pasted PLAY session could confuse operator identity with a Player. Tests must assert the consume JSON has no `access_token` from Supabase (no `refresh_token`, no `provider_token`).

`GET /v1/me` with the minted admin JWT stays 401 (already true if `typ !== access`).

Admin JWT claims stay Worker-signed with `TOKEN_SIGNING_SECRET`. Do not sign admin sessions with `SUPABASE_JWT_SECRET`.

## Rate limit

In-memory `Map` on the isolate is enough for a single production Worker with one operator.

- Keys: `ip:<addr>` and `email:<normalized>`
- Window: 3600 seconds
- Limit: 5 hits per key
- Over: 429, no Supabase call

No Durable Object. Accept that a new isolate has an empty map.

## Errors

| Case | HTTP | Code |
|------|------|------|
| Bad email shape | 400 | `INVALID_REQUEST` |
| Throttled | 429 | `RATE_LIMITED` |
| Allowlist empty on consume | 503 | `NOT_CONFIGURED` |
| Supabase down on consume | 502 | `UPSTREAM` |
| Bad/expired/non-allowlisted consume | 401 | `NOT_AUTHORIZED` |
| CLI bad operator token | 401 | `NOT_AUTHORIZED` (unchanged) |

Request-path send failures stay 200 generic.

## Tests (vitest, no live mail)

1. Unknown email and allowlisted email both return the same 200 body; only allowlisted calls the otp stub.
2. Invalid email → 400; sixth request from same IP → 429.
3. Consume with a verify stub whose email is not allowlisted → 401, no `access_token`.
4. Consume with allowlisted verify stub → `typ=admin-access` after HS256 verify; body has no `refresh_token`.
5. That minted token: `resolveAdmin` ok; `resolvePrincipal` / `/v1/me` path rejects (401).
6. Existing `POST /v1/admin/session` operator-token tests still pass.
7. Login HTML does not contain `admin_token` or “Operator token”.

## Deploy

1. `npx wrangler secret put ADMIN_ALLOWLIST_EMAILS` (operator types the list; agents do not echo it).
2. Confirm Supabase redirect URLs.
3. `NOEMA_ENV=production npm run deploy` — no reseed, no activate.
4. Smoke: request with a non-allowlisted address → generic 200; allowlisted address receives mail; callback opens ADMIN; `/ready` still `genesis.ef578f4ffceeccd0`.

## Files (implementation, later)

- `workers/noema/src/admin-auth.ts` — allowlist, request, consume, throttle
- `workers/noema/src/admin.ts` — login + callback HTML
- `workers/noema/src/index.ts` — two new routes; `/admin/callback`
- `workers/noema/src/types.ts` — `ADMIN_ALLOWLIST_EMAILS`; `authentication_context` union
- `workers/noema/test/admin-email-login.test.ts` — new
- `docs/OPERATOR-SMOKE.md` — email login as primary; CLI token as emergency

## Out of this change

`/version` `/manifest` `/config` · STUDY · real IdP for Players · marketing CTAs · v0.8 · second Genesis.
