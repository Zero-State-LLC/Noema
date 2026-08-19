# PLAY mobile Chamber — room + command, Here sheet

**Supersede (2026-08-19):** inhabit is `/connect`. `GET /play` 308 → `/connect`. This file is historical Chamber IA.

**Status:** approved for spec  
**Date:** 2026-08-18  
**Host:** `https://noema.guru/play`  
**Does not reseed or Recover Perihelion.**  
**Admin ≠ Player.** Chamber remains a Player surface.  
**Text-first PLAY.** No new verbs. No `AGENT_PLAYER`.

A human joined Perihelion on a phone and reported the Chamber as too crowded to think. Slice 6 made targets tappable. It did not cut how many things compete.

## Problem

At `max-width: 900px` the desktop rail stacks under the room. First paint then shows, in one column:

mast (NOEMA, world, cycle, health, handle, Leave) · world strip · WHERE / room / condition · just-happened · signals · rumors / traffic / archive / contests / offices · trail · HERE · EXITS · AVAILABLE HERE · STATUS · Key · Advanced · sticky command plus a hint that lists look, move, inspect, talk, message, trade, accept, form, leave, help.

A 375px screen cannot hold a two-column workspace. Cognitive overload is the stacked rail plus the verb wall, not missing tap size.

## Goal

On a phone, the Chamber’s job is: **see where you are, type the next line.**

Success is binary:

- At `max-width: 900px`, the only always-visible surfaces are a thin mast, the room (WHERE + name + description + condition + just-happened + short trail), and a sticky command line.
- HERE, EXITS, AVAILABLE HERE, STATUS, Key, and Advanced live in one **Here** sheet, closed by default.
- Command hint is `look · help` only.
- Mast is **NOEMA** and **Leave**. Cycle, handle, and health live in the sheet STATUS block.
- Desktop (`min-width: 901px`) is unchanged: two-column room + rail, no sheet.
- Same `/v1/command`. No new Player verbs. No Recover. No Genesis.

## Non-goals

- Restyling brand tokens or desktop Chamber.
- New routes (`/play/here` etc.).
- A tenant picker or Admin chrome on PLAY.
- Changing LOOK / MOVE / WAIT semantics.
- Hiding rumors / traffic / archive when they have content (they stay as closed `<details>` in the room scroll).
- Sending PLAY letters.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Approach | **A** — room + command always on; one Here sheet |
| Breakpoint | `max-width: 900px` (the width where the rail already stacks) |
| Mast | NOEMA + Leave only |
| Room | WHERE, name, description, condition, just-happened, last few trail lines |
| Command hint | `look · help` |
| Here control | One full-width text button **under** the command form, not beside Send. Label **Here**. |
| Sheet contents | HERE, EXITS, AVAILABLE HERE, STATUS (cycle / you / health), Key (collapsed), Advanced (collapsed) |
| Sheet default | Closed |
| Empty sections | Stay hidden, same as today |
| Open / close | Here button opens. Backdrop, **×**, and Escape close. Focus enters the sheet; on close, focus returns to `#cmd`. |
| Tap-to-fill | Exit / act buttons in the sheet still fill `#cmd` (existing `data-cmd` / tok-list behavior). |
| Implementation | Reuse `#play-chamber .ch-rail` as the sheet. No second copy of the lists. Prefer `<dialog>` if it keeps existing ids; otherwise a single overlay + `aria-modal`. |
| Desktop | ≥901px: `.ch-rail` is the side column. No dialog, no Here button. |
| World strip | Hidden on phone if it only repeats room/world already in WHERE. If it carries a live threshold (health / contest), show that one line in STATUS inside the sheet. |

## Always-visible phone surface

```
┌ NOEMA                    Leave ┐
│ WHERE                          │
│ <room name>                    │
│ <description>                  │
│ Just happened: …               │
│ (short trail)                  │
│                                │
│ [ look                  ] Send │
│ Here                           │
└────────────────────────────────┘
```

- Product chrome (`.top`, `.foot`) stays hidden in `body.is-chamber`.
- `#play-chamber` remains `100dvh` with sticky `.ch-cmd` and `env(safe-area-inset-bottom)`.
- 44px minimum targets and 16px command font stay (no iOS zoom).
- Trail stays in the room scroll. Phone shows the newest **5** items. Older lines remain in the DOM but are not shown (`:nth-child` or a `.trail-more` collapse). Desktop still shows the full trail.

## Here sheet

```
┌ Here                         × ┐
│ HERE     (people, objects)     │
│ EXITS    (tap fills command)   │
│ AVAILABLE HERE                 │
│ STATUS   cycle · you · health  │
│ Key      (collapsed)           │
│ Advanced (collapsed)           │
└────────────────────────────────┘
```

- Same ids: `#entity-list`, `#exit-list`, `#action-rail`, `#status-rows`, `#world-key` / legend, `#advanced`.
- Does not navigate. Does not submit a command by opening.
- `aria-label` remains "Here". When open, `aria-expanded="true"` on the Here button.
- Reduced motion: sheet appears/disappears with opacity only, no slide, ≤150ms.

## Files

- Modify: `workers/noema/src/play.ts` — chamber CSS + mast + hint + Here control + sheet wiring in extra CSS / markup.
- Modify: `workers/noema/src/play-ui.ts` only if paint currently assumes the rail is always a side column (strip / health / handle). Prefer CSS + a few class toggles in the existing client bundle.
- Modify: `workers/noema/test/play-chamber.test.ts` — phone contract + desktop regression.
- Do not touch Admin, WATCH, CONNECT, or `/v1/command`.

## Tests

1. Chamber HTML still contains HERE, EXITS, AVAILABLE HERE, Key, Advanced, `#cmd`, `#leave`.
2. At `max-width: 900px` CSS: mast is NOEMA + Leave; `.ch-rail` is not a persistent second column; Here control exists; hint matches `look · help` and does not list trade / message / form.
3. At `min-width: 901px`: `.ch-body` is two columns; no Here button required; rail visible without a dialog.
4. Sheet closed by default (`open` attribute absent / `hidden` / `aria-expanded="false"`).
5. Escape-close and focus-return are present in the client script (`Escape`, `$("cmd").focus` or equivalent).
6. Existing Slice 6 rules still hold: `min-height:44px`, `.cmdform input` `font-size:16px`, sticky `.ch-cmd`, `overflow-x:clip`.
7. No `scanline` / infinite animation. Reduced-motion still kills sheet motion.

## Acceptance

- A 375×812 viewport of `/play` in `is-chamber` shows room + command, not the rail essay.
- Opening Here reveals exits and available acts without leaving the Chamber.
- Desktop Chamber screenshot at 1100px matches current two-column layout.
- Live Perihelion is not Recovered or reseeded.
