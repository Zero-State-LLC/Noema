# PLAY Chamber — full-viewport terminal workspace

**Status:** approved — implementing  
**Date:** 2026-08-13  
**Host:** `https://noema.guru`  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** This change never touches `/admin` or `typ: admin-access`.

## Problem

After a Player magic link, `/play` still looks like a brochure with a login rail. The client already runs `enter` + `look` when `noema.play.token` exists, but the first paint is “Outside / Enter world”, the email gate stays visible in the sidebar, and the world is a stack of cards inside marketing chrome. It is not a place to play.

## Goal

Signed-in PLAY is a **full-viewport Chamber**: Grok Build / jcode layout (masthead, scrollback, context rail, sticky composer) with **colored text** for place, here, you, and fail. Magic link lands in-world immediately. Login chrome is gone while the token is live.

Success is binary:

- Signed-out `/play` is still play-email only (no operator form, no Chamber masthead).
- Token present → Chamber paints at once; no “Outside”, no “Enter world”, no email gate.
- Auto `enter` + `look` still run (existing client path).
- LOOK, trail, exits, and verbs render as text with the color roles below — not a card stack.
- Same hosted verbs, same `data-cmd` / `sendCommand` / `commandForOps` path.
- Existing play-email-login, play-ui, and product-surface tests still pass.

## Non-goals

- New verbs, profiles, seeds, NPC society, v0.8
- WebSocket / live push (still request/response)
- Theme picker or a new palette
- Restyling `/`, `/watch`, `/connect`, `/study`, `/admin`
- Changing auth APIs, JWT audience, or WATCH redaction
- Merging Watch or Connect into Play drawers
- Re-enabling `/v1/auth/dev-token` in production

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Layout | **A — Terminal workspace** (not IDE split, not monoline-only) |
| URL | Same `/play` for door and Chamber |
| Entry | Token → hide door → `enter` + `look` (already implemented) |
| Chrome in-world | No product nav, no footer; Chamber is the chrome |
| Scrollback | LOOK + trail (`you` / `local` / `world` / `fail`) |
| Context rail | Here, exits, sequence; facts only |
| Actions | Colored `data-cmd` tokens, not button rows |
| Color | Existing ledger tokens as syntax roles |
| Leave world | Masthead control → `LEAVE_WORLD`; org-leave stays a command |
| Handle | No name field in Chamber; use `noema.play.handle` / last handle |
| Advanced | Door: token paste to enter. Rail: ids + optional token paste once in Chamber |
| Genesis | Untouched |

## Architecture

`/play` is one Worker HTML document. The Worker does not know the browser session (`noema.play.token` is `sessionStorage`). Both trees ship in `playHtml()`:

```text
productShell
  #play-door      signed-out email gate (visible by default)
  #play-chamber   full-viewport workspace (hidden by default)
```

On boot the client:

1. If no token → leave the door visible (product nav stays).
2. If token → set `body.is-chamber`, hide door + `.top` + `.foot`, show Chamber, run `enterWorld(token)` which already sends `enter` then `look`.

```text
body.is-chamber .top,
body.is-chamber .foot { display: none }
body.is-chamber #main.wrap { width: 100%; max-width: none; padding: 0; margin: 0 }
body.is-chamber #play-door { display: none }
#play-chamber { display: none }
body.is-chamber #play-chamber { display: grid; min-height: 100dvh }
```

Do not add a second route. Do not ask the Worker to personalize HTML.

```text
Browser                         Worker
  | GET /play                      |
  |<---- door + chamber HTML ------|
  | read noema.play.token          |
  | body.is-chamber                |
  | POST /v1/command ENTER_WORLD   |
  | POST /v1/command LOOK          |
  | paint scrollback + rail        |
```

## Surfaces

### Signed out — door

Unchanged from product-surface IA: play email is the primary gate. No operator form. No “The world is the text”. Continue-to-PLAY if a token already exists (same as boot-with-token). Invalid magic link (`?error=1`) stays on the door with the existing notice.

Advanced on the door only: optional controller-token paste and Enter (today’s agent / operator-mint path, plus preview `autostart`). Submitting a token sets `noema.play.token` and switches to Chamber. The door is allowed to say Enter; the Chamber is not.

### Signed in — Chamber

```text
┌ masthead ─────────────────────────────────────────────────────┐
│ NOEMA  Perihelion Reach · Cycle N · handle             [leave]│
├ scrollback ──────────────────────────────────┬ context ───────┤
│ WHERE  <place>                               │ HERE           │
│        <description>                         │   people/objs  │
│        CONDITION  <line>                     │ EXITS          │
│ YOU    look                                  │   teal tokens  │
│ LOCAL  …                                     │ STATUS         │
│ WORLD  …                                     │   cycle / seq  │
│ FAIL   …                                     │   <details>    │
├ composer ─────────────────────────────────────────────────────┤
│ > command_                                              [send]│
│ look · move east · inspect · …     notice (ember on fail)     │
└───────────────────────────────────────────────────────────────┘
```

**Masthead (one line).** `NOEMA` (link to `/`), world name, cycle, handle. Settlement/health appears on this line **only** when it is not fine (paused, blocking, incident, degraded). Leave-world is a quiet control here.

**Scrollback.** The world. First paint is the LOOK from auto-enter. Then a growing trail. This replaces `#loc-card` and the desktop-duplicate trail. Place name may use display serif; everything else is body or mono.

**Context rail (~16rem, `min-width: 901px`).** Here (people, objects, service desks, bonds), exits, status (cycle, seq, settled). Facts only — not a second story of “what just happened”. Below `900px` the rail collapses under the composer as a `<details>` (same breakpoint as today’s play grid). When collapsed, LOOK appends one muted line: `exits: east · quay`.

**Composer.** Sticky bottom. Focus after enter. Same `#cmd-form` / `#cmd` / `#send`. Hint row lists hosted verbs as colored tokens. `#notice` sits under the hint.

## Color (syntax, not decoration)

Most text is `--ink` / `--muted` on `--void`. No new tokens. No colored card borders as the main signal. Do not syntax-highlight free prose inside room descriptions.

| Role | Token | Used for |
|------|--------|----------|
| Place / you | `--copper` | Room name, masthead world, `YOU` trail kind, composer caret |
| Here / local | `--teal` | People and objects in the rail, `LOCAL` trail kind, exits, clickable verbs |
| Fail | `--ember` | `FAIL` trail kind, composer errors, blocked play |
| Settled | `--ok` | Rail settled / seq-ok only — not a persistent HEALTHY masthead chip |
| World noise | `--muted` / `--faint` | Descriptions, `WORLD` trail kind, hints, sequence ids |

CSS classes (required, testable): `.role-place`, `.role-you`, `.role-here`, `.role-fail`, `.role-ok`. Kind labels on trail rows use the matching role.

## Render rules

### LOOK

A text block at the top of the scrollback, replaced on each successful LOOK / move — not prepended forever.

```text
WHERE  The Broken Exchange
       Dust, copper, a stalled ledger.
       CONDITION  crane seized · repairable
```

`WHERE` and the room name are copper. Body is muted. `CONDITION` is hidden when empty. Exits and entities are **not** restated as a second essay in this block; they belong in the rail.

### Trail

Same four kinds as `TrailKind` today (`you` | `local` | `world` | `fail`). Append only.

```text
YOU    look
LOCAL  nacre is here
WORLD  The crane ticks once and stops.
FAIL   Not enough energy.
```

Kind label is the color. Title is ink. Optional detail is muted, one line. `trailFromResult` stays the source of items; only the HTML wrapper changes.

### Actions

No `.act-strip` button row and no `.opp` cards as the primary control. Hint verbs and rail exits/opportunities are `<button class="role-here" data-cmd="…">` (or equivalent). Click or type: same `sendCommand` path. Incomplete cmds (trailing space / `=` / `"`) still fill the composer. Mutating verbs stay hidden until in-world and `commandForOps` allows them.

`renderEntityListHtml`, `renderOpportunitiesHtml`, `renderPlayersHereHtml`, `renderServiceDesksHtml`, `renderBondsHtml` may keep their data helpers; their markup becomes compact text/token lists for the rail, not padded cards.

## Session flow

1. `/play` without `noema.play.token` → door.
2. Token present (consume, refresh, or pasted controller token) → Chamber + `enter` + `look`.
3. Handle from `noema.play.handle` or last `noema.play.v2` handle. No masthead rename field.
4. Production never calls `/v1/auth/dev-token`. Preview/local may mint only when there is no token and `autostart=1` (today’s path).
5. Commands: parser + `commandForOps` unchanged. LOOK after move updates the LOOK block and the rail together.
6. Masthead leave sends `leave` (`LEAVE_WORLD`). Success clears `noema.play.token` (and handle session key), removes `is-chamber`, returns to the door. If leave is blocked, stay in Chamber and show the fail.
7. `leave <org>` is typed only — not a chrome button.
8. Advanced `details` in the rail: player id, controller id, seq, optional token paste. Same fields as today’s `#advanced`.

## Errors

| Case | UI |
|------|-----|
| Invalid / expired magic link | Door + existing “request a new one” notice |
| Token present, `ENTER_WORLD` or `LOOK` fails | Stay in Chamber; ember composer notice + `FAIL` trail. Do not show the email form |
| Token rejected (`NOT_AUTHORIZED`) | Drop token → door + notice |
| World paused / play blocked | Masthead health line + composer notice; existing command gate still applies |
| Command fail | `FAIL` trail + ember notice; notice clears on the next successful command |
| Network / parse fail | Same as command fail; no toast stack |

## Unchanged

| Item | Behavior |
|------|----------|
| `POST /v1/play/login/request` · consume · `/play/callback` | Same |
| `noema.play.token` | Same session key |
| Hosted verb set / `parsePlayCommand` | Same |
| `commandForOps` mutation gate | Same |
| WATCH `/v1/watch/live` | Untouched |
| Admin plane | Untouched |
| Genesis | Frozen |

## Tests

- Default `playHtml()` contains play email request and `#play-door`; does **not** contain an admin login form; `body` has no `is-chamber` class; `#play-chamber` is hidden by default (`display: none` unless `body.is-chamber`).
- `#play-chamber` markup contains masthead, scrollback, context rail, composer. Chamber default copy does **not** include “Enter world” or “Outside”. The door may still include Enter for token-paste / preview mint.
- Color role classes `.role-place`, `.role-you`, `.role-here`, `.role-fail`, `.role-ok` appear in PLAY CSS.
- LOOK / trail helpers still emit only `you` / `local` / `world` / `fail` and do not add verbs.
- Existing `play-email-login`, `play-ui`, and `product-surface` tests still pass.
- Client boot: token in `sessionStorage` still calls `enterWorld` (existing contract; keep or adapt the current autostart coverage).

## Files (implementation, later)

- `workers/noema/src/play.ts` — door/chamber trees, `is-chamber` CSS, drop card layout
- `workers/noema/src/play-ui.ts` — LOOK block, trail rows, rail token lists
- `workers/noema/src/shell.ts` — only if `is-chamber` hide rules belong in `PRODUCT_CSS` (prefer PLAY extra CSS)
- `workers/noema/test/play-ui.test.ts` and/or new `play-chamber.test.ts`
- `docs/UI-HANDOFF.md` if it still describes PLAY as cards + Enter world

## Out of this change

New auth · new verbs · STUDY Lab · second Genesis · Watch/Connect visual rewrite · live websocket · theme picker.
