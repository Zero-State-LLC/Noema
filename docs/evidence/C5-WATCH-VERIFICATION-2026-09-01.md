# C5 — verify the newly deployed WATCH source (read-only half)

**Recorded:** 2026-09-01
**Worker:** `c681fd71-608f-4e4d-9207-96f4439700a3`, source `02fd112`, deployed 2026-09-01T06:19:31Z
**Verdict:** map-first WATCH is live and behaves. **Three findings, none blocking.** One is pre-existing and visible to every spectator.
**Changes nothing.** No pin, contract, runtime, or world state.

## Why now

[The continuation plan](CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md) listed the
map-first source `45e2070` as `HOSTED_NOT_COMPUTABLE` — "Not deployed" — and made C5
conditional on C4 landing. The 2026-09-01 deploy carried `45e2070`, so **C5 became
actionable**. Everything below is public and read-only: no credential existed in the
session, and nothing mutated the world.

## Checks that pass — OBSERVED

| C5 item | Result |
|---|---|
| `/watch` desktop, HTTP dependencies | `/watch` 200, `/health` 200, `/ready` 200 |
| `/watch/map` desktop | renders; map dominant in the main column, Health + River in the side rail |
| `/watch/map` at 390 px | reflows, **no horizontal overflow** |
| complete public room set | 10 room cards on the page == 10 rooms in `/v1/watch/live` |
| hidden-topology omission | no room carries a hidden marker; hidden rooms absent |
| `/v1/watch/live` ↔ `/v1/watch/map` identity | both `world.perihelion-reach-3`, `cycle 8948`, `sequence 23853` |
| no player ids | `player_id` absent from both payloads; presence is counts and public labels |
| traces redaction | no entity ids in `rooms[].traces[]`, per WATCH §`rooms[].traces[]` |
| reduced motion | one stylesheet carries a `prefers-reduced-motion` block |
| semantic navigation | `main:1 nav:1 header:2 footer:1`; headings `H1 Live map` → `H2 Health` / `H2 River`; 17 focusable controls; no images, so no missing alt |

## Finding 1 — the door's specified typography never renders (pre-existing)

The page requests a Google Fonts stylesheet that **its own CSP blocks**:

```text
Refused: https://fonts.googleapis.com/css2?family=IBM+Plex+Mono…&family=Syne…
  violates "style-src 'self' 'unsafe-inline'"
```

Measured rather than inferred — rendered widths of the token stack against a plain
system stack are identical to the hundredth of a pixel:

```text
display stack "Syne, system-ui"        287.02 px
plain        system-ui                 287.02 px
mono stack   "IBM Plex Mono", ui-mono  325.11 px
plain        ui-monospace              325.11 px
```

`document.fonts.check()` returns `true` here and is misleading — it answers "can this
stack render", which the fallback satisfies. The empty `FontFaceSet` and the identical
widths are the real evidence.

**Pre-existing, not a regression.** The link lives in `src/theme/tokens.ts` and was
present at the previous live build `a68f5d8d`. The CSP is `src/index.ts`. So every
public page has always rendered in system fallback while the design system specified
Syne and IBM Plex.

Two honest exits, both product calls: allow `fonts.googleapis.com` / `fonts.gstatic.com`
in `style-src` and `font-src`, or drop the request and state system fonts as the
intended typography. Doing neither leaves the page asking for something it forbids.

## Finding 2 — a live surface with no live region

`/watch/map` updates continuously (cycle, River feed, health bands) and declares
**zero `aria-live` regions**. A spectator using a screen reader gets the initial page
and no announcement of anything that follows.

C5 asks for "keyboard focus and semantic navigation", and those pass. This is the
adjacent gap: the semantics are sound, the *liveness* is not conveyed. Gate D judges
WATCH legibility under real pressure, and for assistive technology the current answer
is that the page is legible once and silent thereafter.

Bounded fix, no framework: one polite live region over the event feed.

## Finding 3 — `entity_id` on the wire is unaddressed by doctrine, not clearly wrong

`/v1/watch/live` ships `rooms[].entities[] = { entity_id, label, entity_type, glyph }`,
so ids like `entity.relay-7` and `entity.salvage-cache` are public.

This is flagged as an **ambiguity, not a violation**, because the doctrine does not
reach it:

- [WATCH-LIGHTWEIGHT-SPECTATOR.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/WATCH-LIGHTWEIGHT-SPECTATOR.md) (Noema-Specs) bans entity
  ids explicitly for `rooms[].traces[]`, and that ban is honoured;
- it describes room detail as showing "public entity labels", not ids;
- no rule states whether `rooms[].entities[]` may carry `entity_id`.

The runtime's own text adapter treats ids as internal — `resolveVisibleEntity` matches
labels only, commenting that matching an id "would let a guess confirm internal
identifiers". That tension is the reason to pin the rule rather than assume either way.
`SKILL.ORIENT` says to report a `SPEC DEFECT` rather than silently pick a side.

## Not covered here

C5's "map dominance and event/map coupling" was checked visually — the map leads and
the River feed is subordinate — but coupling under load, and the low-noise controls
under a populated world, need a world with Players. With `players: 0` there is no
multi-agent pressure to observe, which is the same reason `A4` (Gate D) stays open.
