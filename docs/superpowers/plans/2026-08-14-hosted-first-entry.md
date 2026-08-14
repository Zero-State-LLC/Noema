# Hosted First-Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hosted product door at `/` a game-first Perihelion Reach entry (Player email only) and keep first Chamber as a text-first world screen.

**Architecture:** HTML-only Worker shells. Reuse `POST /v1/play/login/request` and `/v1/play/login/consume`. Move Operator login off the home primary column (`/admin/login` footer link already exists). Change chrome copy in `productShell`. No auth, Genesis, or Chamber command-semantics changes.

**Tech Stack:** Cloudflare Worker TypeScript HTML (`shell.ts`, `landing.ts`, `play.ts`, `play-login-html.ts`), vitest.

## Global Constraints

- Spec: `Noema-Specs/docs/HOSTED-FIRST-ENTRY.md` (branch `docs/hosted-first-entry`, commit `e4b9fc1` until merged).
- Do not activate, reseed, or force-supersede Genesis.
- Admin ≠ Player. Play form posts `/v1/play/login/request`. Operator form stays on `/admin/login` via existing `/v1/admin/login/request`.
- First-read (`/`, signed-out `/play`, callback, and shared product chrome) MUST NOT contain: apparatus, ledger, conformance, capability, evidence, evidence boundary, humans & agents, stage 0, NOTICE, TEST, CAPTURE, LEARN, research, experimental.
- `/` primary column has exactly one email form: Player.
- Nav stays Home · Play · Watch · Connect. No Study.
- Chamber stays text-first. No particle canvas, HUD, or maps-as-art in PLAY.
- Existing play-email-login, play-chamber, and admin-email-login API tests must still pass after assertion updates in this plan.
- Tests: `cd workers/noema && npx vitest run`
- Work in an isolated git worktree from `origin/main` (see using-git-worktrees at execution time).

## File map

| File | Job |
|---|---|
| `workers/noema/test/product-surface.test.ts` | First-read + world-door HTML contract |
| `workers/noema/test/play-email-login.test.ts` | Stop requiring admin form on `/` |
| `workers/noema/src/shell.ts` | Brand sub, footer, default meta, hide home health chip |
| `workers/noema/src/landing.ts` | World door: place line, Player form only |
| `workers/noema/src/play.ts` | Signed-out door copy; keep Chamber structure |
| `workers/noema/src/play-login-html.ts` | Callback spent-link copy if needed |
| `docs/UI-HANDOFF.md` | Home is world door, not dual-plane login |

`workers/noema/public/index.html` is **not** served as `/` (`index.ts` returns `landingHtml()` first). Do not rewrite the marketing file in this plan.

---

### Task 1: First-read and world-door tests

**Files:**
- Modify: `workers/noema/test/product-surface.test.ts`
- Modify: `workers/noema/test/play-email-login.test.ts`

**Interfaces:**
- Consumes: `landingHtml()`, `playHtml()`, `productShell()`, `playCallbackHtml()`
- Produces: failing assertions that Tasks 2–4 turn green

- [ ] **Step 1: Replace the home-door tests** in `workers/noema/test/product-surface.test.ts`

Keep the existing `product chrome` and `planes` describes. Replace the `home door` describe with:

```ts
const FIRST_READ_BAN = [
  "apparatus",
  "ledger",
  "conformance",
  "capability",
  "evidence boundary",
  "humans & agents",
  "stage 0",
  "NOTICE",
  "TEST",
  "CAPTURE",
  "LEARN",
  "research",
  "experimental",
];

function firstReadHaystack(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

describe("home door", () => {
  const html = landingHtml();
  const hay = firstReadHaystack(html);

  it("has exactly one Player email form and no admin login request", () => {
    expect(html).toContain("/v1/play/login/request");
    expect(html).toContain("Send play link");
    expect(html).toContain("id=\"play-continue\"");
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).not.toContain("Send login link");
    expect(html).toContain("/admin/login");
  });

  it("names the world and a place line", () => {
    expect(html).toContain("Perihelion Reach");
    expect(html).toMatch(/frontier station on a worn trade line/i);
    expect(html).toContain("Enter the world");
  });

  it("is not a brochure", () => {
    expect(html).not.toContain('<img src="/assets/hero-noema.jpg"');
    expect(html).not.toContain("The world is the text.");
    expect(html).not.toContain("path-rail");
    expect(html).not.toMatch(/id="home-health"/);
    expect(html).not.toMatch(/Restart STUDY/);
  });

  it("first-read omits research and stage vocabulary", () => {
    for (const word of FIRST_READ_BAN) {
      expect(hay.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});

describe("shared chrome first-read", () => {
  const shell = productShell({ title: "T", active: "home", body: "<p>x</p>" });
  const hay = firstReadHaystack(shell);
  it("brand and footer are game-first", () => {
    expect(hay).not.toMatch(/stage 0/i);
    expect(hay).not.toMatch(/humans &amp; agents/i);
    expect(hay).not.toMatch(/humans & agents/i);
    expect(shell).toContain('href="/admin/login"');
  });
  it("home does not paint a health chip", () => {
    expect(shell).not.toMatch(/id="rt-label"/);
    expect(shell).not.toMatch(/id="dot"/);
  });
});
```

Also add under `planes` (keep existing play/study/watch/connect tests):

```ts
  it("play signed-out has no admin login request", () => {
    const html = playHtml();
    expect(html).toContain("/v1/play/login/request");
    expect(html).not.toContain("/v1/admin/login/request");
    expect(html).toContain("Enter world");
  });
```

- [ ] **Step 2: Update the play-email-login homepage assertion**

In `workers/noema/test/play-email-login.test.ts`, change the test titled `homepage and play include email gate; homepage is not admin token` to:

```ts
  it("homepage and play include email gate; homepage is not admin login", () => {
    expect(landingHtml()).toContain("/v1/play/login/request");
    expect(landingHtml()).not.toContain("/v1/admin/login/request");
    expect(landingHtml()).not.toMatch(/Operator token/);
    expect(playHtml()).toContain("/v1/play/login/request");
    expect(playHtml()).toContain("Access token");
  });
```

- [ ] **Step 3: Run tests to verify they fail for the right reason**

Run:

```bash
cd workers/noema && npx vitest run test/product-surface.test.ts test/play-email-login.test.ts
```

Expected: FAIL
- `has exactly one Player email form` — landing still contains `/v1/admin/login/request`
- `names the world and a place line` — missing place line
- `first-read omits research` — `stage 0` and/or `humans & agents` still in chrome
- `brand and footer are game-first` — same
- `home does not paint a health chip` — `#rt-label` still present
- `homepage and play include email gate; homepage is not admin login` — still contains admin request

Do not implement yet.

- [ ] **Step 4: Commit tests only**

```bash
git add workers/noema/test/product-surface.test.ts workers/noema/test/play-email-login.test.ts
git commit -m "test(ui): world-door first-read and play-only home"
```

---

### Task 2: Shared chrome copy

**Files:**
- Modify: `workers/noema/src/shell.ts`

**Interfaces:**
- Consumes: `productShell({ title, active, body, extraCss?, description? })`
- Produces: game-first brand/footer/meta; no home health widget

- [ ] **Step 1: Confirm Task 1 chrome tests still fail**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts -t "shared chrome"`

Expected: FAIL on `stage 0` / health chip.

- [ ] **Step 2: Change default description, brand sub, footer, and home health widget**

In `workers/noema/src/shell.ts` `productShell`:

Replace the default description:

```ts
  const desc =
    opts.description ||
    "Perihelion Reach — enter the world.";
```

Replace the brand sub:

```html
    <span class="brand-sub">Perihelion Reach</span>
```

Replace the footer first span:

```html
  <span>NOEMA · Perihelion Reach</span>
```

Keep the existing second footer span:

```html
  <span>PLAY · WATCH · CONNECT · <a class="foot-operator" href="/admin/login">operator</a></span>
```

Wrap the header runtime widget so it is omitted when `opts.active === "home"`:

```ts
  const runtime =
    opts.active === "home"
      ? `<div class="runtime" hidden></div>`
      : `<div class="runtime" title="Runtime status"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>`;
```

Use `${runtime}` in the header in place of the current runtime `div`.

Do not change nav items. Do not add Study.

- [ ] **Step 3: Run chrome tests**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts`

Expected:
- `shared chrome first-read` PASS
- `home door` / `exactly one Player email form` still FAIL (admin form still on landing)
- `first-read omits research` may still FAIL if landing body contains banned words; if only chrome was the source, it may PASS except place-line / admin-form tests

- [ ] **Step 4: Commit**

```bash
git add workers/noema/src/shell.ts
git commit -m "fix(ui): game-first product chrome on Perihelion Reach"
```

---

### Task 3: World-door landing

**Files:**
- Modify: `workers/noema/src/landing.ts`

**Interfaces:**
- Consumes: `playEmailGateMarkup({ continueToPlay: true, operatorLink: false })`, `productShell`
- Produces: `/` HTML with Player form only, world name, place line, no admin form

- [ ] **Step 1: Confirm landing tests still fail on admin form / place line**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts -t "home door"`

Expected: FAIL — `/v1/admin/login/request` present and/or place line missing.

- [ ] **Step 2: Replace `landingHtml` body**

`workers/noema/src/landing.ts` should be:

```ts
/**
 * Product door — Perihelion Reach + Player email only.
 */

import { playEmailGateMarkup } from "./play-login-html";
import { productShell } from "./shell";

const EXTRA = `
.door{width:min(28rem,100%);margin:4rem auto 0;display:grid;gap:1.25rem}
.door h1{margin:0;font-size:clamp(2.6rem,8vw,3.6rem);max-width:none;text-align:center;letter-spacing:.12em}
.door .place{margin:.35rem 0 0;text-align:center;color:var(--copper);font:550 1rem/1.35 var(--font-display)}
.door .invite{margin:.45rem 0 0;text-align:center;color:var(--muted);max-width:22rem;justify-self:center}
#play-continue[hidden]{display:none!important}
`;

export function landingHtml(): string {
  const body = `
  <section class="door" aria-labelledby="home-title">
    <div>
      <h1 id="home-title">NOEMA</h1>
      <p class="place">Perihelion Reach</p>
      <p class="invite">A frontier station on a worn trade line. Enter the world.</p>
    </div>
    <article class="card pad" aria-labelledby="play-login-heading">
      <p class="kicker" id="play-login-heading">Play</p>
      ${playEmailGateMarkup({ continueToPlay: true, operatorLink: false })}
    </article>
  </section>`;

  return productShell({
    title: "Perihelion Reach",
    active: "home",
    body,
    extraCss: EXTRA,
    description: "Perihelion Reach — enter the world.",
  });
}
```

Remove the `adminEmailGateMarkup` import and the Operator `<article>`.

- [ ] **Step 3: Run surface + email-login tests**

Run:

```bash
cd workers/noema && npx vitest run test/product-surface.test.ts test/play-email-login.test.ts
```

Expected: all PASS in those two files.

- [ ] **Step 4: Commit**

```bash
git add workers/noema/src/landing.ts
git commit -m "fix(ui): Perihelion world door is Player email only"
```

---

### Task 4: Play door + callback copy

**Files:**
- Modify: `workers/noema/src/play.ts` (signed-out card kicker only if it still says research; keep Chamber markup)
- Modify: `workers/noema/src/play-login-html.ts` (callback failure copy is already on `/play?error=1` in `play.ts`; confirm the string)

**Interfaces:**
- Consumes: `playHtml()`, `playCallbackHtml()`, existing `play.ts` sessionNotice for `error=1`
- Produces: signed-out play door without admin form (already true); spent-link notice; callback still Player-only

- [ ] **Step 1: Add a callback / spent-link test** at the bottom of `workers/noema/test/product-surface.test.ts`

```ts
import { playCallbackHtml } from "../src/play-login-html";

describe("callback", () => {
  it("is Player consume, not ADMIN", () => {
    const html = playCallbackHtml();
    expect(html).toContain("/v1/play/login/consume");
    expect(html).toContain("Opening PLAY");
    expect(html).not.toContain("/v1/admin/login");
    expect(firstReadHaystack(html).toLowerCase()).not.toContain("research");
  });
});
```

`play.ts` already contains `That login link is expired or invalid. Request a new one.` for `error=1`. Add to the existing `planes` play test or a new one:

```ts
  it("play spent-link copy is on the door", () => {
    expect(playHtml()).toMatch(/expired or invalid/i);
  });
```

Note: `playHtml()` only contains that string inside the client script. `toMatch(/expired or invalid/i)` must search the full `playHtml()` including the script (do **not** run it through `firstReadHaystack`).

- [ ] **Step 2: Run the new tests**

Run: `cd workers/noema && npx vitest run test/product-surface.test.ts -t "callback|spent-link"`

Expected: PASS if copy already matches. If FAIL because the spent-link string is missing, add this exact line in the play boot script where `qs.get("error") === "1"`:

```js
        sessionNotice("That login link is expired or invalid. Request a new one.", "bad");
```

That line already exists in `workers/noema/src/play.ts` near the `error=1` query check. Do not invent a second string.

- [ ] **Step 3: Soften the signed-out play card**

In `playHtml()` door card, keep the email gate and handle. Change only the kicker if needed so first-read of the door card is Play, not research. Current kicker is `Play` — keep it.

Remove this empty-state line if present:

```html
        <p class="empty" style="margin-top:.65rem">Agents: use <a href="/connect">Connect</a>.</p>
```

Replace with a quieter line (CONNECT remains a nav item):

```html
        <p class="empty" style="margin-top:.65rem"><a href="/connect">Connect an agent</a></p>
```

Do not add Operator login to `/play`.

- [ ] **Step 4: Run play HTML tests**

Run:

```bash
cd workers/noema && npx vitest run test/product-surface.test.ts test/play-email-login.test.ts test/play-chamber.test.ts test/play-ui.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/play.ts workers/noema/src/play-login-html.ts workers/noema/test/product-surface.test.ts
git commit -m "fix(ui): play door and callback stay Player-only"
```

---

### Task 5: Full worker tests + handoff note

**Files:**
- Modify: `docs/UI-HANDOFF.md`

**Interfaces:**
- Consumes: completed Tasks 1–4
- Produces: docs aligned with hosted first-entry; full vitest green

- [ ] **Step 1: Run the full Worker suite**

Run: `cd workers/noema && npx vitest run`

Expected: all tests PASS (count will be ≥ 353 plus the new cases from this plan). If anything fails, fix in the file that caused it; do not weaken first-read tests.

- [ ] **Step 2: Update `docs/UI-HANDOFF.md`**

After the “Product form: text game” table, add:

```md
### Hosted first-entry (reference Worker)

`/` is a world door: Perihelion Reach, one place line, Player email. Operator login is `/admin/login`, not a peer card on `/`. First-read copy is game/place/play. Chamber first screen remains location, here, available actions, consequence, command. Spec: Noema-Specs `docs/HOSTED-FIRST-ENTRY.md`.
```

Do not rewrite the rest of the handoff.

- [ ] **Step 3: Commit**

```bash
git add docs/UI-HANDOFF.md
git commit -m "docs(ui): hosted first-entry is a world door"
```

---

## Self-review

**Spec coverage**

| Spec requirement | Task |
|---|---|
| Land → recognize world → Player email | 3 |
| Operator not equal rank on `/` | 1, 3 |
| Forbidden first-read words | 1, 2 |
| Allowed world/enter/look language | 3 |
| Callback Player consume | 4 |
| Chamber WHERE/HERE/CAN DO/command (existing markup) | 4 (no structural rewrite; already in `play.ts` / `play-ui.ts`) |
| No health chip on `/` first paint | 2 |
| Chamber health only for PAUSED/INCIDENT | already in `play.ts` `#play-health` | 
| WATCH/CONNECT secondary, STUDY out of nav | already true; chrome tests keep it |
| No Genesis / auth / verb changes | all tasks HTML-only |
| `public/index.html` not served as `/` | already `index.ts` `landingHtml()`; out of scope |

**Placeholders:** none.

**Type consistency:** `landingHtml()`, `playHtml()`, `playCallbackHtml()`, `productShell()` signatures unchanged except optional `description` already exists.
