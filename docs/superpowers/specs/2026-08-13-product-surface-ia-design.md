# Product surface IA — login home, one job per page

**Status:** approved — implementing  
**Date:** 2026-08-13  
**Host:** `https://noema.guru`  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** Homepage operator form uses the existing admin magic-link API.

## Problem

`/`, `/play`, `/watch`, `/study`, and `/connect` repeat the same brochure: thesis, path cards, kickers, health, spec rails. Home is not a door. STUDY is a fake Lab explainer. PLAY carries marketing plus a second email gate.

## Goal

- **`/` is only login surfaces** — Player play-link + Operator login-link.  
- **Each other page has one job.**  
- **STUDY leaves the primary nav**; `/study` stays as an honest stub (200).  
- Auth, WATCH redaction, and Genesis stay as they are.

Success is binary:

- `/` has no hero image, thesis, path rail, health chip, wizard, or spec links.  
- `/` has play email + operator email only (plus Continue to PLAY if already signed in).  
- Primary nav is Home · Play · Watch · Connect.  
- `/play` signed-in is Chamber only (no marketing lead).  
- `/watch` is projection + counts, not an essay.  
- `/connect` is attach-agent only.  
- `/study` is a short “not open yet” page, not in nav.  
- Existing play/admin login APIs unchanged.

## Non-goals

- New auth, new verbs, STUDY Lab, marketing Pages CTAs  
- Visual brand rewrite (keep Chamber ledger tokens)  
- Merging Watch/Connect into Play drawers  
- Changing `/admin` console internals beyond sharing the operator form already used at `/admin/login`

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Home | Player login + Admin login only |
| Planes | One job per page |
| STUDY | Drop from primary nav; honest stub |
| Watch / Connect | Stay peer pages, stripped |
| Auth | Reuse `POST /v1/play/login/*` and `POST /v1/admin/login/*` |

## Surfaces

### `/` — door

```text
NOEMA
[ Play email ]     Send play link
[ Operator email ] Send login link
```

- Play form: existing `playEmailGateMarkup` / `POST /v1/play/login/request`. Continue to PLAY if `noema.play.token` exists.  
- Operator form: same request as `/admin/login` (`POST /v1/admin/login/request`). Copy: operator plane, not a Player.  
- After operator consume, still `/admin`. After play consume, still `/play`.  
- Optional one-line wordmark subtitle only if needed for orientation (“Perihelion Reach”). No hero, no loop chips, no path cards.

### `/play` — Chamber

**Signed out:** play email only. No operator form. No “The world is the text” lead.  
**Signed in:** location, here, command, session. Remove the marketing header (`kicker` / `h1` / `lead` that repeat Home). Keep one health/status line if it is operational (pause/settlement), not a second brochure. Advanced: agent token paste. Side trail: do not duplicate the main “what just happened” list on desktop.

### `/watch` — public projection

Keep: refresh, pause, feed, site map, player/site counts, cycle/seq.  
Cut: “Watch the world move” essay, “later stages” disclaimer, duplicate “Live world” hero card if the map already shows sites. One sentence max: public, redacted, read-only.

### `/connect` — attach an agent

Keep: sequence, production token paste, curl to `https://noema.guru`.  
Cut: PLAY onboarding language. Production: no fake “Mint agent token” that hits disabled dev-token; point to Admin → Players or operator-issued token paste.

### `/study` — stub

Title + two sentences: STUDY is not open. PLAY is the world; research does not rewrite the ledger. Link to `/play` and `/watch`. No Notice/Test/Capture tabs.

## Chrome

`productShell` primary nav:

```text
Home · Play · Watch · Connect
```

Footer: small operator link to `/admin/login` still allowed. No Study in nav or footer plane list.

## Unchanged

| Item | Behavior |
|------|----------|
| Play consume / callback | `/play/callback`, `noema.play.token` |
| Admin consume / callback | `/admin/callback`, `noema.admin.token` |
| WATCH `/v1/watch/live` | redaction unchanged |
| Genesis | frozen, no activate |
| `/admin` | management console |

## Tests

- `landingHtml()` contains play request + admin request; does **not** contain hero image, path-rail PLAY/WATCH cards, “The world is the text”, or Study onboarding.  
- `productShell` nav has Play/Watch/Connect and **not** Study.  
- `playHtml()` signed-out markup has play email; no admin login form.  
- `studyHtml()` has “not open”; no Notice/Test tablist.  
- Existing play-email-login and admin-email-login tests still pass.  
- Watch still fetches `/v1/watch/live` (smoke or existing client contract).

## Files (implementation, later)

- `workers/noema/src/shell.ts` — nav + footer  
- `workers/noema/src/landing.ts` — login door only  
- `workers/noema/src/play.ts` / `play-ui.ts` — cut marketing header / duplicate trail  
- `workers/noema/src/watch.ts` — strip essay  
- `workers/noema/src/connect.ts` — attach-only  
- `workers/noema/src/study.ts` — stub  
- `workers/noema/test/play-ui.test.ts` and/or new `product-surface.test.ts`  
- Docs that still say Home is a four-path brochure (`docs/UI-HANDOFF.md`, `README.md` if needed)

## Out of this change

New auth · STUDY Lab · v0.8 · second Genesis · site/ marketing Pages rewrite.
