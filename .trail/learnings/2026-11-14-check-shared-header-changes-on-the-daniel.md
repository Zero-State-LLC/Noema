---
title: "Check shared header changes on the home page too: its hero header overrides the shell on mobile"
author: Daniel
date: 2026-11-14
branch: fix/hero-nav-scroll
cost: { minutes: 8, tokens: 48162 }
id: l-c6a5477c
scope: repo
status: active
src: agent
touches:
  - STATUS.md
  - docs/handoff/NEXT.md
  - workers/noema/src/landing.ts
  - workers/noema/test/watch-measured-a11y.test.ts
  - workers/noema/src/shell.ts
  - workers/noema/src/watch-stage-view.ts
  - workers/noema/test/watch-map-label-legibility.test.ts
---

## Decided
A change to the shared site header is verified on every main page, the home page included, not on one representative page. The home page uses its own hero header, whose mobile rule is more specific than the shell's and silently undoes header fixes there.

## Tried and ruled out
Checking the mobile nav fix only on /watch: it passed there and on five other pages, but the home page kept a 399px nav at 375px because its hero header re-enabled wrapping at 760px and below.

## Watch out
The hero header still needs wrapping between 701 and 760px, where it is a row. Only at 700px and below, where the shell makes it a column, must it stay single-line, and that rule has to come after the 760px block to win.

In the code: workers/noema/src/landing.ts (@media max-width:760px body.hero-bleed .top, and the max-width:700px rule after it), workers/noema/src/shell.ts (@media max-width:700px .top), test in workers/noema/test/watch-measured-a11y.test.ts.
