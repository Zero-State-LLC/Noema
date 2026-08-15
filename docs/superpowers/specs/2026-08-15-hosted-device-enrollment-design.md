# Hosted device enrollment for agent Controllers

**Status:** draft (awaiting review)  

**Date:** 2026-08-15  
**Host:** `https://noema.guru`  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** This path never mints `typ: admin-access`.  
**Agents do not click PLAY magic links.**

Implements AGENT-ONBOARDING Phase A and RFC-0033 on the **hosted Worker**. Python already has `/auth/device`; production `noema.guru` does not.

## Problem

A Player (example: Prabu) can enter via the PLAY letter and act in the Chamber. An agent runtime (OpenClaw, Hermes, Grok Bot) that only sees that letter will drive a **browser** to click ENTER NOEMA and type in `/play`. That works. It is the human path. It is the wrong interface for a harness.

The preferred agent path is already specified: obtain a **Controller token**, then `POST /v1/command` with Bearer. Hosted production only exposes that token via Admin mint or RFC-0033 admin-approved email bootstrap. There is no way for the **human of that Player** to approve a runtime attach on noema.guru.

## Goal

A harness starts enrollment with HTTP only. The human, already in PLAY (or after the existing enter-world letter), opens `/connect`, sees a short code, approves. The harness polls once, stores a Controller token in its secret store, and never opens a browser again.

Success is binary:

- OpenClaw / Hermes / Grok Bot / `curl` can complete attach without Playwright or the PLAY magic-link.
- Approve requires a **PLAY human** Bearer. An agent Bearer cannot approve (unless it already has `noema.controller.manage`, which default tokens do not).
- The agent token is `typ: access`, `controller_type: agent`, bound to the **approver’s** `player_id`.
- That token is **401** on every `/v1/admin/*` route.
- First GET of `/connect` or preview does **not** approve and does **not** issue a token.
- First successful poll returns the access token **once**; replay/deny/expiry issue nothing.
- Admin mint and RFC-0033 bootstrap email remain as break-glass. They are not the default for a Player attaching their own runtime.
- PLAY email copy and consume path stay a human enter-world letter.
- Live world identity is unchanged. No Genesis / reseed / pause changes.

## Non-goals

- Teaching OpenClaw/Hermes/Grok Bot in this repo beyond a documented five-step client contract (optional later skill adapters).
- Putting access tokens, refresh tokens, or shell in email.
- Making PLAY magic-link the agent entry (it stays human-only).
- Public unauthenticated agent signup (no human approve).
- New gameplay verbs or harness-specific commands.
- Re-enabling `/v1/auth/dev-token` in production.
- Requiring a framework skill for conformance.
- Changing Admin login.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Identity | One Player, many Controllers. Human PLAY session + agent runtime share `player_id`. |
| Default approver | The human Controller of that Player (PLAY token). |
| Break-glass | Existing `POST /v1/admin/controller-token` and RFC-0033 admin enroll email. |
| Protocol | Hosted device flow, same meanings as Python `/auth/device`, under `/v1`. |
| Harnesses | Display-only `metadata.runtime` (`openclaw`, `hermes`, `grok-bot`, or other). Same scopes and command API. |
| Token to agent | Returned only on `POST /v1/auth/device/token` after approve, once. |
| Storage | Existing enrollment Durable Object instance (`WORLD_DO` name `__noema_enrollments__`), separate records from RFC-0033 mail enroll. |
| Expiry | 10 minutes from start. |
| User code | `XXXX-XXXX` hex, case-insensitive on input. |
| Scopes | Default `noema.player.read`, `noema.world.observe`, `noema.action.submit`. Strip any admin scopes if a client sends them. |
| Refresh | Out of this spec. Hosted Worker today mints access tokens only (same as Admin mint). Poll returns `access_token` + `token_type: bearer`. No refresh token unless a follow-up spec adds Worker refresh. |

## Architecture

```text
Harness                     Worker                         Human (PLAY)
   |                           |                                  |
   | POST /v1/auth/device      |                                  |
   | { metadata.runtime }      |-- persist pending -------------->|
   |  device_code, user_code   |                                  |
   |  verification_uri=/connect|                                  |
   |<--------------------------|                                  |
   | show AB12-CD34            |                                  |
   |                           |   Bearer PLAY human token        |
   |                           |   GET  /connect                  |
   |                           |   GET  /v1/auth/device/preview   |
   |                           |   POST /v1/auth/device/approve   |
   |                           |<---------------------------------|
   | POST /v1/auth/device/token|                                  |
   | { device_code }           |-- redeem once ------------------>|
   |  access_token             |                                  |
   |<--------------------------|                                  |
   | POST /v1/command          |                                  |
   | Authorization: Bearer     |                                  |
```

Python `/auth/device` stays for local `noema-serve`. Hosted clients use `/v1/auth/device` on `https://noema.guru`.

## HTTP contract

All JSON. Generic errors use the existing `{ error: { code, message, retryable } }` envelope.

### `POST /v1/auth/device`

Unauthenticated.

Request:

```json
{
  "metadata": { "runtime": "openclaw" },
  "scopes": ["noema.player.read", "noema.world.observe", "noema.action.submit"]
}
```

`metadata` and `scopes` are optional. Unknown extra scopes that are not in the default game set are dropped. Admin scopes are dropped.

Response `200`:

```json
{
  "device_code": "…",
  "user_code": "AB12-CD34",
  "verification_uri": "https://noema.guru/connect",
  "expires_in": 600,
  "interval": 5,
  "scopes": ["noema.player.read", "noema.world.observe", "noema.action.submit"]
}
```

`verification_uri` is always the production CONNECT origin when `NOEMA_ENV=production` (`https://noema.guru/connect`). Local/preview uses the request origin.

### `GET /v1/auth/device/preview?user_code=`

Public. No secrets.

`200`: `{ user_code, status, scopes, runtime, expires_at }`  
`404`: unknown code.

`status` is `pending` | `approved` | `denied` | `expired` | `redeemed`. Preview of `approved` does **not** include tokens.

### `POST /v1/auth/device/approve`

Requires `Authorization: Bearer` of a PLAY **human** controller token (`controller_type` is `human` or `hybrid`, or `amr` is `email_magic_link`). Agent tokens are `403` / `NOT_AUTHORIZED` unless they already include `noema.controller.manage`.

Binds the pending record to the approver’s `player_id`. Cannot approve for another Player.

Body: `{ "user_code": "AB12-CD34" }`.

`200`: `{ status: "approved", user_code, player_id, controller_id, scopes, runtime }` — **no access_token**.  
`409` if not pending. `401`/`403` if approver invalid.

### `POST /v1/auth/device/deny`

Same Bearer rules as approve. Body `{ "user_code" }`. `200` `{ status: "denied", user_code }`.

### `POST /v1/auth/device/token`

Unauthenticated. Body `{ "device_code" }`.

| Record state | Response |
|--------------|----------|
| pending | `200` `{ status: "authorization_pending", interval: 5 }` |
| approved, tokens unused | `200` `{ status: "approved", access_token, token_type: "bearer", player_id, controller_id, scopes }` then mark **redeemed** and drop stored token material |
| redeemed / missing token | `401` tokens already redeemed |
| denied / expired | `401` with that status |

Poll interval is a hint (5 seconds). Clients must tolerate `authorization_pending`.

### `GET /connect`

Existing page. Add a signed-in panel:

- No PLAY token in `sessionStorage` / Bearer → tell the human to enter via PLAY first. No approve control.
- PLAY token present → user_code field, preview, Approve / Deny calling the routes above with that Bearer.

Opening `/connect` without approve is not consent.

## Client contract (OpenClaw, Hermes, Grok Bot, curl)

Required steps, in order:

1. `POST /v1/auth/device` with optional `{ "metadata": { "runtime": "<name>" } }`.
2. Show the human `user_code` and `verification_uri`.
3. Poll `POST /v1/auth/device/token` with `device_code` until `status` is `approved` or a terminal error.
4. Store `NOEMA_BASE` + `NOEMA_TOKEN` in that runtime’s secret mechanism. Never commit them. Never put them in a skill source file.
5. `POST /v1/command` with `Authorization: Bearer $NOEMA_TOKEN` (`ENTER_WORLD`, then `LOOK`, …).

A skill or tool adapter may implement those five steps. It is optional. A raw HTTP client is conforming.

`metadata.runtime` is shown on CONNECT. It does not change scopes, verbs, or token claims.

## Storage

Reuse `durableEnrollmentStore` / `WORLD_DO.idFromName("__noema_enrollments__")`. Device records are a separate key namespace from RFC-0033 mail enrollments (`device.<device_code>` / index by normalized `user_code`).

Fields: `device_code_hash`, `user_code`, `scopes`, `runtime`, `status`, `player_id`, `controller_id`, `issued_at`, `expires_at`, and — only after approve until the first successful poll — the minted `access_token`. That token lives only in DO storage, is never logged, and is deleted when the record is marked redeemed.

Do not log `device_code`, access tokens, or PLAY tokens.

## Errors

| Situation | code | status |
|-----------|------|--------|
| Unknown user_code / device_code | `NOT_AUTHORIZED` (do not distinguish unknown vs other auth failure) | 401 |
| Agent tries to approve | `NOT_AUTHORIZED` | 403 |
| Expired pending | `NOT_AUTHORIZED` message `device code expired` | 401 |
| Approve when not pending | `NOT_AUTHORIZED` | 409 |
| Poll still pending | `authorization_pending` (not an error) | 200 |
| Poll after redeem | `NOT_AUTHORIZED` | 401 |

Public start/preview/poll responses must not include another user’s email or Admin identifiers.

## Testing

Worker unit tests (no live harness):

- start returns `user_code` + `verification_uri` + 600s expiry
- preview has no token fields
- approve with human PLAY token binds `player_id`
- approve with agent token fails
- deny then poll fails closed
- expire then approve/poll fails closed
- poll once returns token; second poll fails
- `metadata.runtime` of `openclaw`, `hermes`, `grok-bot` is echo-only (same scopes)

Do not require OpenClaw/Hermes/Grok Bot in CI.

## Rollout

1. Implement Worker routes + CONNECT approve panel + tests.
2. Deploy production Worker (secrets unchanged).
3. Document the five-step client contract on `/connect` and `docs/AGENT-STAGE0.md`.
4. Point Prabu’s OpenClaw (and later Hermes / Grok Bot) at `/v1/auth/device`, **not** at the PLAY inbox.
5. Existing PLAY letter remains for Prabu-the-human.

Until step 4, a harness that only knows the inbox will keep automating the browser. Shipping the API without switching the client does not stop that.

## Risks

- Hosted identity is JWT-only (no Python player table). Approve trusts the PLAY human JWT’s `player_id`. That is the same authority PLAY already uses to act.
- No refresh token in this slice. When the access token expires, the harness starts a new device flow or an operator remints.
- CONNECT must not treat a logged-in **agent** paste as an approver.

## Open questions (none)

All forks in the brainstorm are locked: identity C, approver C, approach 1, harnesses as clients of one protocol.
