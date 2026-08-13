# Product Surface IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` Player + Operator email only; give PLAY/WATCH/CONNECT one job each; drop STUDY from primary nav.

**Architecture:** HTML-only product chrome. Reuse `POST /v1/play/login/*` and `POST /v1/admin/login/*`. Extract a small `adminEmailGateMarkup()` for the home operator form. No auth or Genesis changes.

**Tech Stack:** Cloudflare Worker HTML (`landing.ts`, `play.ts`, `watch.ts`, `connect.ts`, `study.ts`, `shell.ts`), vitest.

## Global Constraints

- Do not activate, reseed, or force-supersede Genesis.
- Admin ≠ Player. Home operator form posts `/v1/admin/login/request`. Play form posts `/v1/play/login/request`.
- `/` has no hero image, thesis, path rail, health chip, wizard, or spec links.
- Nav: Home · Play · Watch · Connect. No Study in nav or footer plane list.
- Existing play-email-login and admin-email-login API tests must still pass.
- Work in `/home/scrimshawlife/work/Noema-surface-ia` on `docs/product-surface-ia`.
- Tests: `cd workers/noema && npm test` (nvm npm).

## File map

| File | Job |
|------|-----|
| `workers/noema/src/shell.ts` | Nav/footer |
| `workers/noema/src/admin.ts` | Export `adminEmailGateMarkup()` |
| `workers/noema/src/play-login-html.ts` | Optional `operatorLink: false` |
| `workers/noema/src/landing.ts` | Door only |
| `workers/noema/src/play.ts` | Drop marketing header / duplicate trail |
| `workers/noema/src/watch.ts` | Strip essay |
| `workers/noema/src/connect.ts` | Attach-only |
| `workers/noema/src/study.ts` | Stub |
| `workers/noema/test/product-surface.test.ts` | New HTML contract |
| `workers/noema/test/play-ui.test.ts` | Update STUDY + PLAY lead assertions |
| `docs/UI-HANDOFF.md` | Home is login door |

---

### Task 1: Nav + surface HTML tests

**Files:**
- Create: `workers/noema/test/product-surface.test.ts`
- Modify: `workers/noema/src/shell.ts`
- Modify: `workers/noema/test/play-ui.test.ts` (STUDY describe)

**Interfaces:**
- Consumes: `productShell`, `landingHtml`, `playHtml`, `studyHtml`
- Produces: nav without Study; failing landing/play/study assertions that later tasks turn green except nav (this task greens nav)

- [ ] **Step 1: Write failing tests** in `product-surface.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productShell } from "../src/shell";
import { landingHtml } from "../src/landing";
import { playHtml } from "../src/play";
import { studyHtml } from "../src/study";
import { watchHtml } from "../src/watch";
import { connectHtml } from "../src/connect";

function navOf(html: string): string {
  const m = html.match(/<nav class="nav"[\s\S]*?<\/nav>/);
  return m ? m[0] : "";
}

describe("product chrome", () => {
  const shell = productShell({ title: "T", active: "home", body: "x" });
  it("nav is Home Play Watch Connect without Study", () => {
    const n = navOf(shell);
    expect(n).toMatch(/>Play</);
    expect(n).toMatch(/>Watch</);
    expect(n).toMatch(/>Connect</);
    expect(n).not.toMatch(/>Study</);
  });
  it("footer does not list STUDY as a plane", () => {
    expect(shell).not.toMatch(/PLAY · WATCH · STUDY/);
  });
});

describe("home door", () => {
  const html = landingHtml();
  it("has play + admin login requests", () => {
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("/v1/admin/login/request");
    expect(html).toContain("Send play link");
    expect(html).toContain("Send login link");
  });
  it("is not a brochure", () => {
    expect(html).not.toContain("hero-noema.jpg");
    expect(html).not.toContain("The world is the text.");
    expect(html).not.toContain("path-rail");
    expect(html).not.toMatch(/id="home-health"/);
    expect(html).not.toMatch(/Restart STUDY/);
  });
});

describe("planes", () => {
  it("play has play email and no admin login request", () => {
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).not.toContain("/v1/admin/login/request");
    expect(playHtml()).not.toMatch(/Read the place/);
  });
  it("study is an honest stub", () => {
    expect(studyHtml()).toMatch(/not open/i);
    expect(studyHtml()).not.toMatch(/aria-controls="panel-notice"/);
  });
  it("watch still loads the live projection", () => {
    expect(watchHtml()).toContain("/v1/watch/live");
    expect(watchHtml()).not.toMatch(/Watch the world move/);
  });
  it("connect has curl and no mint-dev-token as primary production path", () => {
    expect(connectHtml()).toContain("NOEMA_BASE");
    expect(connectHtml()).toContain("/v1/command");
  });
});
```

Update `play-ui.test.ts` STUDY describe to expect stub (will fail until Task 5): leave that failure for Task 5 **or** move STUDY test into this file only. **Do not** keep `path explainer` assertion.

Change play-ui `avoids player-facing system jargon` to drop `toMatch(/Read the place/)` (Task 3).

- [ ] **Step 2: Run** `cd workers/noema && npm test -- product-surface`

Expected: FAIL — nav still has Study.

- [ ] **Step 3: Change `shell.ts`**

Remove `${nav("/study", "Study", "study")}`. Keep `ProductNav` including `"study"` for the stub page `active`. Footer second span: `PLAY · WATCH · CONNECT · <a …>operator</a>`.

- [ ] **Step 4: `npm test -- product-surface`** — chrome tests PASS; home/play/study tests still FAIL until later tasks.

- [ ] **Step 5: Commit** `fix(ui): drop STUDY from primary nav`

---

### Task 2: Home is two logins

**Files:**
- Modify: `workers/noema/src/admin.ts` — export `adminEmailGateMarkup()` from the existing login form (email, Send login link, POST `/v1/admin/login/request`). `adminLoginHtml()` uses it.
- Modify: `workers/noema/src/play-login-html.ts` — `playEmailGateMarkup({ continueToPlay, operatorLink })` default `operatorLink: true`; home passes `false`.
- Modify: `workers/noema/src/landing.ts` — replace body with door only.

Landing body shape:

```html
<section class="door" aria-labelledby="home-title">
  <h1 id="home-title">NOEMA</h1>
  <p class="muted">Perihelion Reach</p>
  <article class="card pad">${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}</article>
  <article class="card pad">${adminEmailGateMarkup()}</article>
</section>
```

Minimal CSS for stacked cards. No health script. Description: “Sign in to PLAY or the operator plane.”

- [ ] **Step 1:** home door tests already in Task 1 file — they fail.

- [ ] **Step 2:** implement landing + admin markup.

- [ ] **Step 3:** `npm test -- product-surface play-email-login admin-email-login` PASS for home + existing login tests.

- [ ] **Step 4: Commit** `fix(ui): homepage is player and operator login only`

---

### Task 3: PLAY chamber

**Files:**
- Modify: `workers/noema/src/play.ts` — remove `.play-head` kicker/h1/lead. Hide `#trail-side` / desktop duplicate “What just happened” card (`play-side-desktop-only`).
- Modify: `workers/noema/test/play-ui.test.ts` — remove `Read the place` assertion.

Keep: loc card, here, command, session, play-health, email gate, advanced token.

- [ ] Tests: product-surface play case + play-ui hierarchy still pass.

- [ ] Commit `fix(ui): PLAY is chamber only`

---

### Task 4: WATCH + CONNECT

**Files:**
- Modify: `workers/noema/src/watch.ts` — title “Public projection.” One sentence. Keep refresh/pause/feed/map/counts. Remove “Watch the world move”, “later stages” limit paragraph, duplicate essay lead.
- Modify: `workers/noema/src/connect.ts` — production wrap is paste + Admin → Players. Hide mint button when we would hide it in production (keep existing env check). Cut “inside PLAY” onboarding lead. Curl stays.

- [ ] Tests: product-surface watch/connect.

- [ ] Commit `fix(ui): WATCH projection and CONNECT attach only`

---

### Task 5: STUDY stub + docs

**Files:**
- Replace `studyHtml()` body with stub + links to `/play` and `/watch`.
- Update `play-ui.test.ts` STUDY describe.
- Short note in `docs/UI-HANDOFF.md` if it still lists Home as four-path brochure.

- [ ] `npm test && npm run typecheck`

- [ ] Commit `fix(ui): STUDY stub out of primary nav`

---

## Spec coverage

| Spec | Task |
|------|------|
| Nav / footer | 1 |
| Home door | 2 |
| PLAY chamber | 3 |
| WATCH / CONNECT | 4 |
| STUDY stub + docs | 5 |
| Auth/Genesis unchanged | global |
