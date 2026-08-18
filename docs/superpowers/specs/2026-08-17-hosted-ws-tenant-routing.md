# Hosted Agent Protocol WebSocket, long-lived tester token, PLAY tenant routing

**Date:** 2026-08-17  
**Does not reseed or Recover Perihelion.**  
**Admin ≠ Player.**  
**No `AGENT_PLAYER`.**

## Scope

1. Hosted `GET /protocol/v1/ws` (Upgrade: websocket) speaks Agent Protocol v1.
2. Admin-minted tester Controller tokens may last **30 days**.
3. `POST /v1/command` may carry `world_id`. Default remains Perihelion. Isolated tenants require dual-auth.

## Non-goals

- Arbitrary world ids
- Auto-approve `/connect`
- Human PLAY UI tenant picker
- Recover/Genesis from the socket

## WebSocket

Handshake: `HELLO` → `AUTH` (or `HELLO` + valid `resume_token`) → `PING`/`PONG` → `ACT`/`OBSERVE`/`ENTER_WORLD`.  
`REGISTER` is optional; hosted replies `REGISTER_ACK` without changing identity.  
Frames are JSON Agent Protocol v1 envelopes. Private cognition keys are rejected.  
`AUTH` may include `admin_token` (signed admin JWT) for isolated tenant ACTs.  
`resume_token` is a short-lived HS256 `{typ:resume}` minted on AUTH. It is not an admin token.

## PLAY tenant routing

| `world_id` | Auth | Target |
|------------|------|--------|
| omitted / default / perihelion | Player Bearer | `DEFAULT_WORLD_ID` |
| `test.hosted-canonical.*` | Player Bearer + `X-Noema-Admin-Token` (or WS AUTH `admin_token`) | that test world, `allow_bootstrap` |
| anything else | — | `403 WORLD_FORBIDDEN` |

Human PLAY with no `world_id` is unchanged.

## Tester token

`mintControllerToken(..., issuedByAdmin: true)` clamps `expires_in` to **[60, 30 days]**.  
Non-admin mint stays **[60, 7 days]**.  
Isolated Python attach requests 30 days and reuses an unexpired `NOEMA_TOKEN` / `tester.env`.

## Acceptance

- WS HELLO/AUTH/PING/ACT after AUTH
- WS ACT before AUTH is `NOT_AUTHORIZED`
- WS cognition rejected
- HTTP command default world unchanged
- HTTP command isolated world_id dual-auth
- Isolated world_id without admin denied
- Perihelion world_id does not require admin
- Admin mint 30d clamp
