# CONNECT two doors — approve or use a token

**Supersede (2026-08-19):** shipped chrome is Home · Manifesto · Watch · Connect. CONNECT is onboard + inhabit. `GET /play` 308 → `/connect`. This file is historical IA.

**Status:** approved for spec  
**Date:** 2026-08-17  
**Host:** `https://noema.guru/connect`  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** This page never mints `typ: admin-access`.  
**Agents do not click PLAY magic letters.**

Mechanics stay as [2026-08-15 hosted device enrollment](2026-08-15-hosted-device-enrollment-design.md). This spec is **first paint and IA only**.

## Problem

`/connect` is one screen doing four jobs: a 4-step protocol lecture, mint-or-paste, look-up-then-approve, and a curl drawer. Testers and humans have to hunt for the one action they came to do.

## Goal

Opening `/connect` shows **two equal doors**. Each door is one job. Nothing else on first paint.

Success is binary:

- First paint has no numbered lecture, no curl, no protocol essay.
- Two doors only: **Approve a code** and **Use a token**.
- `/connect?code=49D8-A98C` opens the Approve door with that code filled and lookup already run.
- Approve still requires a PLAY human session. Opening the page does not approve.
- Production public `/v1/auth/dev-token` stays 403. The Use-a-token door is paste-only in production.
- No new Player verbs. No `AGENT_PLAYER`. No PLAY letters sent by this page.

## Non-goals

- Changing `/v1/auth/device` start, preview, approve, deny, or poll.
- Re-enabling public mint in production.
- Auto-approve on lookup (rejected).
- Operator one-shot that skips the human PLAY session (rejected for this slice).
- Merging Admin mint into `/connect`.
- Visual brand rewrite.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| First paint | Two cards. No steps list. No curl. |
| Door A | Approve a code — PLAY session required. |
| Door B | Use a token — paste operator-issued controller token (prod) or local mint (non-prod). |
| Deep link | `?code=` opens Door A, fills the field, runs lookup. Does not approve. |
| Lookup | Auto-run when the field looks like `XXXX-XXXX` (paste or type). Manual lookup button remains. |
| Approve/Deny | Shown only when preview `status === pending`. |
| Signed out | One line on Door A: enter yourself in PLAY, then return. Link to `/play`. |
| Token display | Approve path never shows the agent token. Use-a-token path may show a minted token only when local mint succeeded. |
| Curl / lecture | Stay in `docs/AGENT-STAGE0.md` only. |
| Routes | Same `/connect`. No new path required. |

## First paint

Header stays short: “Attach an agent” + one sentence (Controllers for Players, same command path).

Two cards, equal weight:

1. **Approve a code** — short code from a harness. Human PLAY session binds that runtime to this Player.
2. **Use a token** — you already have a controller token from an operator.

Choosing a door hides the other. A “both doors” control returns to first paint.

## Approve door

- One field. Placeholder `AB12-CD34`. Case-insensitive, hyphen optional on input (existing preview API).
- If `sessionStorage noema.play.token` is missing: do not show the field. One line + `/play` link.
- If present: show field. On paste/complete, lookup `GET /v1/auth/device/preview?user_code=`.
- Preview shows runtime, scopes, expiry. “Looking this up did not approve.”
- Pending → Approve / Deny (`POST /v1/auth/device/approve` or `deny` with PLAY Bearer).
- Success copy: “Approved. The runtime will pick up its token. Not shown here.”

## Use-a-token door

- Production (`/health` `env === production`): paste field only. No mint button. One line: public mint is off; operator issues the token (Admin → Players) or PLAY Advanced.
- Non-production: existing mint via `/v1/auth/dev-token` may stay behind this door only.
- Optional: “Open PLAY” after paste (existing). This is not the agent harness path.

## Deep link (tester)

Harness announce may print `https://noema.guru/connect?code=49D8-A98C`.

- Lands on Approve door, field filled, lookup started.
- Still requires PLAY session. Still does not approve on GET.

`noema-agent enroll` announce should add this URL in implementation. Not a new API.

## Error handling

| Case | UI |
|------|----|
| Unknown / expired code | Bad notice. No Approve. |
| Already approved/denied | Status text. No Approve. |
| PLAY token missing or 401 | Point at `/play`. Do not mint a Player here. |
| Production mint click (if any leftover) | Same “public mint is off” copy. |

## Testing

- Brand/visual: first paint has two doors; no `/curl` lecture; no `POST /v1/auth/device` recipe on the page.
- Deep link fills code and calls preview once.
- Approve still 401 without PLAY token.
- Production HTML/JS does not offer a working public mint control.
- Existing device-enrollment Worker tests unchanged except any copy assertions that mention the 4-step list.

## Out of scope leftovers

Isolated operator ACK (`operator.env` + `isolated-ack.mjs`) stays the tester path that skips `/connect`. This spec does not replace it.
