# Brand Slice 9 — Visual QA

**Authority.** [PLAYER-BRAND.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/PLAYER-BRAND.md) § Acceptance (14) · [VISUAL-DESIGN.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/VISUAL-DESIGN.md) §11.

**Kind.** Verification. No world-rule, settlement, or Genesis change.

Automated contracts: `workers/noema/test/brand-visual-qa.test.ts`.  
Capture matrix: `workers/noema/test/brand-screenshot-matrix.json`.  
No Playwright dependency. Shots below are optional operator evidence.

## 14 statements → evidence

| # | Statement | Automated | Manual (optional shot) |
|---|---|---|---|
| 1 | Reads as a science-fiction game | Door copy + Syne; no SaaS / research-console first-read | `/` @ 390 and 1280 |
| 2 | Research terms do not dominate PLAY | First-read ban on `/` and `/play` | Chamber first paint |
| 3 | Meaningful density, not clutter | Mast, strip, location, rail, command present | `/play` chamber @ 1280 |
| 4 | Color is semantic + labeled | Tokens + Key legend; state not color-only | Key open |
| 5 | Mono only for machine/data | Room prose Interface; command/receipts Machine | Command vs room |
| 6 | Major change is apparent | 240ms amber threshold; WATCH `.major` | WATCH MAJOR if live |
| 7 | Five questions from first paint | Place, strip, signals, actions, command, consequence | Chamber @ 1440 |
| 8 | No cyberpunk clichés | No scanline / glitch / Orbitron / reticle / dashboard / continuous particles | Any viewport |
| 9 | Mobile usable | 640px: 44px targets, 16px command, sticky bar | 360 and 390 |
| 10 | Text-game core remains | LOOK/room text primary; no SPA | Chamber |
| 11 | Research/admin still precise | `/study` stub; `/admin` OPERATOR + Genesis | `/admin/login` |
| 12 | Human = agent mechanics | Both use `POST /v1/command` | n/a |
| 13 | Admin/research operationally precise | Health, head, Genesis; no PLAY cmd | `/admin` if signed in |
| 14 | No new brand decisions while coding | Pinned tokens + `terms.ts` registers | n/a |

## Viewport matrix

360 / 390 / 768 / 1280 / 1440. States: empty, loading/error, PAUSED, MAJOR. Reduced-motion on.

Optional capture (Chromium, after deploy):

```text
for W in 360 390 768 1280 1440; do
  chromium --headless --window-size=$W,900 --screenshot=qa-door-$W.png https://noema.guru/
  chromium --headless --window-size=$W,900 --screenshot=qa-play-$W.png https://noema.guru/play
  chromium --headless --window-size=$W,900 --screenshot=qa-watch-$W.png https://noema.guru/watch
done
```

Do not point these at Perihelion mutating verbs. Door / PLAY signed-out / WATCH / admin login are enough.

## Contrast (computed)

All listed pairs ≥ 4.5:1 on `surface.world` / `surface.panel`. See `brand-visual-qa.test.ts`.

## Keyboard

Door email, skip link, chamber command, leave, WATCH pause/refresh, Admin skip. `:focus-visible` uses `--color-border-focus`.

## Performance

Unchanged ceilings: PLAY/WATCH gzip 180 KiB; phosphor JS 100 KiB; phosphor assets 200 KiB.

WATCH inventory, tokens, MAJOR-only phosphor triggers, reduced-motion, viewports, and those ceilings: [WATCH-VISUAL-MAP.md](WATCH-VISUAL-MAP.md).
