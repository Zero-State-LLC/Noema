# WATCH visual asset map

**Authority.** Public spectator projection only. Text remains primary. Phosphor is optional chrome.

**Kind.** Implementation map. No new brand decisions. No new Player verbs. No Genesis change.

**Named pins.** Inventory. Tokens. Tiered phosphor — one MAJOR, ≤3 non-MAJOR (Living Chamber, Specs §18.6). Reduced-motion. Viewports 360 / 390 / 768 / 1280 / 1440. Budgets 180 / 100 / 200.

Related: [UI-HANDOFF.md](UI-HANDOFF.md) · [BRAND-VISUAL-QA.md](BRAND-VISUAL-QA.md) · [PLAYER-BRAND](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/PLAYER-BRAND.md) · [VISUAL-DESIGN](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/VISUAL-DESIGN.md) · `workers/noema/src/watch.ts` · `workers/noema/src/watch-phosphor.ts`.

---

## Inventory

| Element | Source | Class |
|---|---|---|
| Title + spectator sentence | `.watch-head h1`, `.muted` | required text |
| World / cycle / seq / players | `#watch-world` `#watch-cycle` `#watch-seq` `#watch-players` · `.watch-state-plate` | required text |
| Connecting / live / PAUSED / error tag | `#watch-state` | required text |
| Refresh / Pause | `#watch-refresh` `#watch-pause` | functional chrome |
| TEXT / PIXEL mode | `#watch-mode-text` `#watch-mode-pixel` | functional chrome |
| Headline + copy | `#watch-headline` `#watch-copy` | required text |
| MAJOR hero flash | `.watch-hero.major` | major-change signal |
| MAJOR banner (renders on MAJOR headline, clears ≤2 polls) | `#watch-banner` · `.watch-banner.on` | major-change signal |
| Feed insert settle (new rows brighten then settle ≤900ms) | `.watch-feed li.fresh` | functional chrome |
| Headline mark flash (one-shot ≤400ms, NOTABLE/MAJOR change) | `.watch-line .mark.flash` | functional chrome |
| Atmosphere plate | `.watch-atmos` (`/assets/watch-spectator.jpg`) | functional chrome (≤200 KiB assets) |
| Places list (glyph-mapped rooms / exits / entities / Players) | `#watch-map` | required text |
| Phosphor wrap + canvas | `#watch-phos-wrap` `#watch-phosphor` | major-change signal (load-gated) |
| ASCII cartogram (2D, shared Phosphor layout, Specs §4.B.1; TEXT/no-canvas fallback only, never beside the live canvas) | `#watch-pre` | required text (desktop, TEXT mode) |
| Recent feed | `#watch-feed` | required text |
| Feed tier marks (`·` normal, `>` notable, `!` major + type weight; never color-only, never faded quiet) | `.watch-feed .mark` | required text |
| Key / legend | `#world-key` live SVG catalog (`legendHtml()`) | required text |
| Projection disclaimer | `.watch-note` | required text |

No operator plane, no budgets, no secrets, no Story Seed IDs.

---

## Token mapping

| Role | Token | Use |
|---|---|---|
| Display type | `--font-display` | Title, headline |
| Machine type | `--font-mono` | Cycle, feed, places |
| Body type | `--font-body` | Phosphor bar |
| Ink / faint / muted / line | `--ink` `--faint` `--muted` `--line` | Text hierarchy |
| Active | `--color-state-active` | TEXT pressed, marks |
| MAJOR / warning | `--color-state-warning` | One-shot threshold, major feed mark |
| Phosphor ground | `#0E1114` / `--void` | Canvas wash |
| Phosphor copper | `#3DDCFF` | Sparse known nodes (`color.state.active`) |
| Phosphor amber | `#FFB020` | MAJOR pulse only (`color.state.warning`) |

`--ember` is `--color-state-critical` and is not the MAJOR token.

Forbidden: scanlines, glitch, Orbitron, reticle, dashboard, continuous particles.

---

## Phosphor trigger rules

Motion is **event-born, all tiers** (Living Chamber, Specs §18.6). No ambient loop; a quiet Chamber draws zero frames.

| Input | Motion | Still drawing |
|---|---|---|
| `tier=MAJOR` new sequence + public `room_id` | One-shot amber ring (920ms-class) | Amber room cell |
| `tier=NOTABLE` new sequence + public `room_id` | Stronger copper pulse (560ms-class) + text feed emphasis | Room cell |
| `tier=NORMAL` new sequence + public `room_id` | Soft copper pulse (280ms-class) | Dim node if room is known |
| `agent_move` new sequence + public `room_id` | Pulse as above; public edges touching that room read `exit_active` for the pulse's life | Dim edges |
| `prefers-reduced-motion: reduce` | no pulses of any tier, no rAF, no exit lighting | Static TEXT / still canvas |
| Empty / loading / error | none | Headline copy; feed empty state |
| `PAUSED` | none | `#watch-state` text |

At most one live MAJOR pulse and at most three non-MAJOR pulses (newest win across polls — `capPulses` at merge time, so a newer event replaces the oldest live pulse instead of being dropped). Events outside the public layout never pulse and never consume a cap slot. Hidden rooms and hidden edges stay off the public sketch — exit lighting never hints unpublished topology, and layout itself never lights an edge from recent events. The canvas paints ground fill, border, topology, occupancy, pulses, then site labels last on ground plates (labels never overdrawn — Specs §18) — no decorative field wash. An adjacent HTML map key (`#watch-phos-key`) names the marks; it is not the catalog legend. PIXEL renders by default when Canvas 2D is available (client preference `noema.watch.mode`); TEXT stays the complete authority, one keystroke away, and is the only mode that shows the §4.B.1 ASCII cartogram — one map at a time.

---

## States and viewports

States: empty, loading/error, PAUSED, MAJOR, live feed.

Viewports: 360 / 390 / 768 / 1280 / 1440. Below 860px the stage stacks; ASCII pre hides.

The ASCII cartogram (`asciiCartogram`) rasterizes the same deterministic public layout as PIXEL — TEXT and PIXEL agree on arrangement. `[NAME]` sites, `*` activity, occupancy counts, `!` MAJOR-headline site, `+` picked site, `- | \ /` route connectors (`.` dashed). Budget 78×24; over-budget graphs fall back to the per-site line list. `aria-hidden` atmosphere; the semantic list stays authoritative.

Reduced-motion kills `.watch-hero.major` animation and phosphor pulses.

---

## Budgets

| Ceiling | Value | Pin |
|---|---|---|
| WATCH HTML gzip | ≤ 180 KiB | `brand-visual-qa.test.ts` |
| Phosphor JS | ≤ 100 KiB | `PHOSPHOR_JS_BUDGET` |
| Phosphor assets | ≤ 200 KiB | `PHOSPHOR_ASSET_BUDGET` |

Phosphor is optional and load-gated. It never replaces the feed.

---

## Acceptance

- 14 PLAYER-BRAND statements still pass.
- `collectPulses` emits tiered pulses: 1 MAJOR, ≤3 non-MAJOR, newest win across polls (`capPulses`); events outside the public layout are dropped before cap accounting; `agent_move` pulses light touched public edges only.
- Reduced-motion path still idle / no rAF.
- Agents appear as Players on WATCH occupancy. Humans watch. Public labels and feed lines show named agent handles and omit operator/smoke handles. Unlabeled occupancy still reads as "an agent" / "N agents". Smoke/operator motion still reads as "A player".
- Glyph ids on the live snapshot (`room`→`loc`, Player→`player`, exit→`threshold`, entity→`glyphForEntity`, event→`glyphForProjection`) stay the closed 14-mark catalog.
- Public WATCH and Admin Watch agents share the live SVG catalog (`#world-key`). Raster legend / glyph sheets are not shipped (`legend.png`, `legend-mini.png`, `glyphs-players.png`, `glyphs-entities.png`).
- PIXEL canvas traces all 14 catalog `d` paths from `#world-key`. `loc` is the named room, `player` occupancy, `threshold` a solid exit curve, `unknown` a dashed route or partial room. Entity and event glyphs (`infra` `resource` `org` `trade` `economy` `danger` `distress` `comms` `rumor` `event`) sit as site-side marks. Certainty and occupancy still select the phosphor atlas id; pulses of every tier stay motion-only.
- Operator live LOOK/MOVE text is Admin `GET /v1/admin/watch`, not public WATCH.
- Admin Watch agents is scoped to the signed-in operator: agents they minted or enrolled. Unowned/legacy agents remain visible. Other operators' owned agents and `controller_type` human testers stay off this surface.
- Admin Watch PIXEL is opt-in and traces the same catalog `d` paths. Occupancy is that operator's agents. Clicking an agent, a site, or a PIXEL room mark follows live text and lights that room. It is not public WATCH.
- Public PIXEL click looks closer: lights that room, opens its Places details. The feed stays the full public projection.
- This document remains the single visual map; no new brand tokens.
