# WATCH visual asset map

**Authority.** Public spectator projection only. Text remains primary. Phosphor is optional chrome.

**Kind.** Implementation map. No new brand decisions. No new Player verbs. No Genesis change.

**Named pins.** Inventory. Tokens. MAJOR-only phosphor. Reduced-motion. Viewports 360 / 390 / 768 / 1280 / 1440. Budgets 180 / 100 / 200.

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
| Banner (hidden default) | `#watch-banner` | deferred/optional |
| Atmosphere plate | `.watch-atmos` (`/assets/watch-spectator.jpg`) | functional chrome (≤200 KiB assets) |
| Places list (glyph-mapped rooms / exits / entities / Players) | `#watch-map` | required text |
| Phosphor wrap + canvas | `#watch-phos-wrap` `#watch-phosphor` | major-change signal (load-gated) |
| ASCII pre fallback | `#watch-pre` | required text (desktop) |
| Recent feed | `#watch-feed` | required text |
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

Motion is **MAJOR only**.

| Input | Motion | Still drawing |
|---|---|---|
| `tier=MAJOR` new sequence + public `room_id` | One-shot pulse (Slice 7, 240ms-class amber) | Amber room cell |
| `tier=NOTABLE` | none | Text feed emphasis only |
| `tier=NORMAL` | none | Dim node if room is known |
| `prefers-reduced-motion: reduce` | no pulses, no rAF | Static TEXT / still canvas |
| Empty / loading / error | none | Headline copy; feed empty state |
| `PAUSED` | none | `#watch-state` text |

At most one live MAJOR pulse. Hidden rooms stay off the public sketch. PIXEL is opt-in; TEXT is default authority.

---

## States and viewports

States: empty, loading/error, PAUSED, MAJOR, live feed.

Viewports: 360 / 390 / 768 / 1280 / 1440. Below 860px the stage stacks; ASCII pre hides.

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
- `collectPulses` emits MAJOR only.
- Reduced-motion path still idle / no rAF.
- Humans and agents appear as ordinary Players on WATCH occupancy. Public labels still omit operator/smoke handles.
- Glyph ids on the live snapshot (`room`→`loc`, Player→`player`, exit→`threshold`, entity→`glyphForEntity`, event→`glyphForProjection`) stay the closed 14-mark catalog.
- Public WATCH key is the live SVG catalog (`#world-key`). Raster `/assets/legend.png` / `legend-mini.png` are not loaded.
- PIXEL canvas room / player / exit marks trace the same catalog `d` paths (`loc`, `player`, `unknown`, `threshold`). Certainty and occupancy still select the phosphor atlas id; MAJOR pulses stay motion-only.
- Operator live LOOK/MOVE text is Admin `GET /v1/admin/watch`, not public WATCH.
- Admin Watch agents is scoped to the signed-in operator: agents they minted or enrolled. Unowned/legacy agents remain visible. Other operators' owned agents and `controller_type` human testers stay off this surface.
- This document remains the single visual map; no new brand tokens.
