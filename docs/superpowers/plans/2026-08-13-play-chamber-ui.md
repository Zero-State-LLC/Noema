# PLAY Chamber UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in `/play` is a full-viewport Grok Build / jcode Chamber (masthead, scrollback, context rail, composer) with copper/teal/ember syntax; magic-link still auto-enters.

**Architecture:** One Worker HTML document. `#play-door` (email + optional token paste) is the default. `#play-chamber` is hidden until the client sets `body.is-chamber` when `noema.play.token` exists, then runs the existing `enter` + `look` path. Presentation helpers in `play-ui.ts` stay the single source serialized by `playUiRuntimeSource()`.

**Tech Stack:** Cloudflare Worker HTML (`play.ts`, `play-ui.ts`), vitest. No new dependencies.

## Global Constraints

- Do not activate, reseed, or force-supersede Genesis.
- Admin ≠ Player. No `/v1/admin/*` and no `typ: admin-access` on this path.
- No new verbs, profiles, seeds, websockets, or theme picker.
- Same hosted verbs, `data-cmd`, `sendCommand`, `parsePlayCommand`, `commandForOps`.
- Production never calls `/v1/auth/dev-token`.
- Color roles use existing tokens: `--copper`, `--teal`, `--ember`, `--ok`, `--muted`.
- Work on branch `docs/play-chamber-ui` in `/home/scrimshawlife/Noema` (spec already at `65bd742`).
- Tests: `cd /home/scrimshawlife/Noema/workers/noema && npm test` (use nvm `npm` if the WSL shim is broken).

## File map

| File | Job |
|------|-----|
| `workers/noema/test/play-chamber.test.ts` | HTML + helper contract for door/chamber |
| `workers/noema/src/play.ts` | Door + chamber trees, `is-chamber` CSS, client boot |
| `workers/noema/src/play-ui.ts` | LOOK block, trail rows, rail token lists; add to `playUiRuntimeSource` |
| `workers/noema/test/play-ui.test.ts` | Replace five-section card assertions |
| `workers/noema/test/product-surface.test.ts` | Still: play email, no admin request |
| `docs/UI-HANDOFF.md` | PLAY is Chamber workspace after login |
| `docs/superpowers/specs/2026-08-13-play-chamber-ui-design.md` | Status → implementing |

Keep these client IDs (JS depends on them): `play-health`, `world-line`, `room-name`, `room-desc`, `loc-cond`, `loc-cond-text`, `entity-list`, `players-here`, `desk-list`, `route-box`, `exit-list`, `bonds-card`, `bonds-body`, `opp-list`, `cmd-form`, `cmd`, `send`, `cmd-hint`, `notice`, `trail`, `handle`, `token-paste`, `token-hint`, `enter`, `handle-live`, `leave`, `session-notice`, `advanced`, `token-paste-adv`, `pid`, `cid`, `meta-seq`, `meta-settled`, `err-advanced`, `status-rows`. Drop `act-strip` as a visible control (may omit the node; stop writing button rows).

---

### Task 1: Door / Chamber HTML contract

**Files:**
- Create: `workers/noema/test/play-chamber.test.ts`
- Modify: `workers/noema/src/play.ts` (EXTRA CSS + `playHtml()` body)
- Test: `workers/noema/test/play-chamber.test.ts`

**Interfaces:**
- Consumes: `playHtml()` from `workers/noema/src/play.ts`
- Produces: `#play-door`, `#play-chamber`, `body.is-chamber` CSS, role classes `.role-place` `.role-you` `.role-here` `.role-fail` `.role-ok`. Chamber default copy has no `Outside` / `Enter world`. Door still has Enter + email.

- [ ] **Step 1: Write the failing test**

Create `workers/noema/test/play-chamber.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { playHtml } from "../src/play";

function chamberOf(html: string): string {
  const i = html.indexOf('id="play-chamber"');
  if (i < 0) return "";
  const j = html.indexOf('id="play-door"', i);
  return j > i ? html.slice(i, j) : html.slice(i);
}

describe("play chamber HTML", () => {
  const html = playHtml();
  const chamber = chamberOf(html);

  it("ships door + chamber; body is not in chamber by default", () => {
    expect(html).toContain('id="play-door"');
    expect(html).toContain('id="play-chamber"');
    expect(html).not.toMatch(/<body[^>]*class="[^"]*is-chamber/);
    expect(html).toContain("/v1/play/login/request");
    expect(html).not.toContain("/v1/admin/login/request");
  });

  it("hides chamber until body.is-chamber", () => {
    expect(html).toMatch(/#play-chamber\{[^}]*display:\s*none/);
    expect(html).toMatch(/body\.is-chamber\s+#play-chamber/);
    expect(html).toMatch(/body\.is-chamber\s+\.top/);
    expect(html).toMatch(/body\.is-chamber\s+\.foot/);
  });

  it("chamber has masthead, scrollback, rail, composer", () => {
    expect(chamber).toContain("ch-mast");
    expect(chamber).toContain("ch-scroll");
    expect(chamber).toContain("ch-rail");
    expect(chamber).toContain('id="cmd"');
    expect(chamber).toContain('id="leave"');
    expect(chamber).toContain('id="trail"');
    expect(chamber).toContain('id="exit-list"');
    expect(chamber).toContain("HERE");
    expect(chamber).toContain("EXITS");
  });

  it("chamber default copy is not Outside / Enter world", () => {
    expect(chamber).not.toMatch(/Outside/);
    expect(chamber).not.toMatch(/Enter world/);
    expect(html).toMatch(/Enter world/);
  });

  it("defines syntax color roles", () => {
    expect(html).toContain(".role-place");
    expect(html).toContain(".role-you");
    expect(html).toContain(".role-here");
    expect(html).toContain(".role-fail");
    expect(html).toContain(".role-ok");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: FAIL — `id="play-chamber"` missing (and/or `chamberOf` empty).

- [ ] **Step 3: Implement door + chamber markup and CSS**

In `workers/noema/src/play.ts`, replace `const EXTRA = \`...\`;` and the `playHtml()` body.

`EXTRA` must include (keep existing `.notice` / `.btn` reliance on `PRODUCT_CSS`):

```css
.role-place,.role-you{color:var(--copper)}
.role-here{color:var(--teal)}
.role-fail{color:var(--ember)}
.role-ok{color:var(--ok)}
#play-chamber{display:none}
body.is-chamber .top,body.is-chamber .foot{display:none}
body.is-chamber #main.wrap{width:100%;max-width:none;padding:0;margin:0}
body.is-chamber #play-door{display:none}
body.is-chamber #play-chamber{
  display:grid;grid-template-rows:auto 1fr auto;min-height:100dvh;
}
.ch-mast{
  display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:center;
  min-height:2.6rem;padding:.45rem .85rem;border-bottom:1px solid var(--line);
  font:500 .68rem/1.3 var(--font-mono);letter-spacing:.06em;text-transform:uppercase;
}
.ch-mast a{color:var(--ink);text-decoration:none}
.ch-mast #leave{margin-left:auto;text-transform:none;letter-spacing:0}
.ch-body{
  display:grid;grid-template-columns:minmax(0,1fr) 16rem;min-height:0;
}
@media(max-width:900px){
  .ch-body{grid-template-columns:1fr}
  .ch-rail{order:2}
}
.ch-scroll{min-height:0;overflow:auto;padding:.85rem 1rem 1.25rem}
.look .where{margin:0 0 .2rem;font:500 .62rem var(--font-mono);letter-spacing:.14em}
.look #room-name{
  margin:0 0 .35rem;font:550 clamp(1.4rem,3vw,2.1rem)/1.05 var(--font-display);
}
.look #room-desc{margin:0;max-width:44rem;color:var(--muted)}
.look #loc-cond{margin:.65rem 0 0}
.look #look-exits{margin:.45rem 0 0;color:var(--muted);font-size:.84rem}
.ch-rail{
  border-left:1px solid var(--line);padding:.75rem .8rem;overflow:auto;
  font-size:.84rem;
}
.ch-rail h3{
  margin:.85rem 0 .35rem;color:var(--copper);
  font:500 .62rem/1.3 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;
}
.ch-rail h3:first-child{margin-top:0}
.tok-list,.trail{margin:0;padding:0;list-style:none}
.tok-list li{padding:.28rem 0;border-bottom:1px solid rgba(42,51,66,.45)}
.tok-list button{
  padding:0;border:0;background:none;color:var(--teal);font:inherit;text-align:left;
}
.tok-list button:hover{color:var(--ink)}
.trail{margin-top:1rem}
.trail li{
  display:grid;grid-template-columns:3.4rem 1fr;gap:.45rem;
  padding:.45rem 0;border-bottom:1px solid rgba(42,51,66,.45);font-size:.84rem;
}
.trail .k{font:.56rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;padding-top:.2rem}
.ch-cmd{
  border-top:1px solid var(--line);padding:.65rem .85rem .75rem;
  background:rgba(12,18,24,.97);
}
.cmdform{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem}
.cmdform input{
  min-height:2.5rem;font-family:var(--font-mono);font-size:.9rem;color:var(--teal);
}
.ch-cmd .hint{margin:.4rem 0 0;color:var(--faint);font-size:.72rem}
.ch-cmd .hint [data-cmd]{color:var(--teal);cursor:pointer}
.status-rows{margin:.35rem 0 0;padding:0;list-style:none}
.status-rows li{display:flex;justify-content:space-between;gap:.75rem;font-size:.8rem}
.status-rows span{color:var(--muted)}
.gate{max-width:28rem;margin:1.5rem auto;padding:1.15rem}
.adv{margin-top:.75rem}
.adv summary{
  cursor:pointer;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.mono-ids{margin-top:.55rem;word-break:break-all;font-size:.72rem;color:var(--faint)}
```

`playHtml()` body (keep `playEmailGateMarkup()` with no `continueToPlay`; keep handle + token paste + Enter on the door):

```html
  <div id="play-door">
    <article class="card gate" id="session-card">
      <p class="kicker">Play</p>
      <div id="session-out">
        ${playEmailGateMarkup({ operatorLink: false })}
        <label for="handle">Your name</label>
        <input id="handle" value="player1" autocomplete="username" maxlength="32"/>
        <div id="token-primary" hidden>
          <label for="token-paste">Access token</label>
          <input id="token-paste" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
          <p class="empty" style="margin-top:.45rem" id="token-hint">Production entry requires a token from <a href="/admin#players">Admin → Players</a> (operator mint). Public minting is disabled. Paste it in the Access token field.</p>
        </div>
        <button class="btn primary block" id="enter" type="button" style="margin-top:.65rem">Enter world</button>
        <p class="empty" style="margin-top:.65rem">Agents: use <a href="/connect">Connect</a>.</p>
      </div>
      <p class="notice" id="session-notice" role="status"></p>
    </article>
  </div>

  <div id="play-chamber" aria-label="Chamber">
    <header class="ch-mast">
      <a href="/">NOEMA</a>
      <span id="world-line" class="role-place">—</span>
      <span id="ch-cycle"></span>
      <p class="play-health" id="play-health" hidden role="status"></p>
      <span id="handle-live">—</span>
      <button class="btn quiet" id="leave" type="button">Leave world</button>
    </header>
    <div class="ch-body">
      <section class="ch-scroll" aria-label="World">
        <article class="look" id="loc-card">
          <p class="where role-place">WHERE</p>
          <h2 id="room-name"></h2>
          <p id="room-desc"></p>
          <div id="loc-cond" hidden>
            <b class="role-place">CONDITION</b>
            <span id="loc-cond-text"></span>
          </div>
          <p id="look-exits" hidden></p>
        </article>
        <ol class="trail" id="trail" aria-live="polite"></ol>
      </section>
      <aside class="ch-rail" aria-label="Here">
        <h3 class="role-here">HERE</h3>
        <ul class="tok-list" id="entity-list" aria-label="Nearby objects"></ul>
        <div id="players-here"></div>
        <div id="desk-list"></div>
        <div id="bonds-card"><div id="bonds-body"></div></div>
        <h3>EXITS</h3>
        <ul class="tok-list" id="exit-list" aria-label="Exits"></ul>
        <div class="route-box" id="route-box" hidden aria-label="Local routes"></div>
        <ul class="tok-list" id="opp-list" aria-label="Local opportunities"></ul>
        <h3>STATUS</h3>
        <ul class="status-rows" id="status-rows"></ul>
        <details class="adv" id="advanced">
          <summary>Advanced details</summary>
          <div id="token-advanced-wrap">
            <label for="token-paste-adv">Access token</label>
            <input id="token-paste-adv" type="password" autocomplete="off" placeholder="Paste token if you already have one"/>
          </div>
          <p class="mono-ids">
            player <code id="pid">—</code><br/>
            controller <code id="cid">—</code><br/>
            sequence <code id="meta-seq">—</code>
            <span id="meta-settled" hidden></span>
          </p>
          <p class="empty" id="err-advanced" style="margin-top:.45rem"></p>
        </details>
      </aside>
    </div>
    <footer class="ch-cmd" aria-label="Command line">
      <form class="cmdform" id="cmd-form">
        <label class="sr" for="cmd">Command</label>
        <input id="cmd" autocomplete="off" spellcheck="false" placeholder="look" disabled aria-describedby="cmd-hint"/>
        <button class="btn primary" id="send" type="submit" disabled>Send</button>
      </form>
      <p class="hint" id="cmd-hint"><button type="button" data-cmd="look">look</button> · <button type="button" data-cmd="move ">move east</button> · <button type="button" data-cmd="inspect ">inspect</button> · <button type="button" data-cmd="talk ">talk</button> · message nacre "hi" · trade nacre offer=energy:1 want=compute:1 · accept · form · leave &lt;org&gt; · help</p>
      <p class="notice" id="notice" role="status"></p>
    </footer>
  </div>
```

Keep the existing `<script type="module">` / `playClientBundle()` after the two trees. Do **not** change client JS in this task except IDs that moved: `setSessionUi` still toggles `#session-out` / `#session-in` — `#session-in` is gone. Patch `setSessionUi` now so the page does not throw:

```js
    function setSessionUi(on) {
      document.body.classList.toggle("is-chamber", on);
      $("cmd").disabled = !on;
      $("send").disabled = !on;
      $("handle-live").textContent = state.handle || "—";
      if (on) $("cmd").focus();
      else $("handle").focus();
    }
```

If `$("session-out")` / `$("session-in")` / `$("act-strip")` are still referenced, guard them (`if ($("act-strip")) ...`) so boot does not throw. `renderObs` empty state still writes `"Outside"` this task — Task 4 fixes that. Chamber **markup** default must not include those strings.

- [ ] **Step 4: Run chamber tests**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: PASS.

`play-ui.test.ts` “five-section” and `id="token-paste"` tests may fail until Task 5. Do not “fix” them by putting `Outside` / card headings back.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/test/play-chamber.test.ts workers/noema/src/play.ts
git commit -m "feat(ui): ship door and Chamber trees on /play"
```

---

### Task 2: LOOK + trail text helpers

**Files:**
- Modify: `workers/noema/src/play-ui.ts`
- Modify: `workers/noema/test/play-chamber.test.ts`
- Modify: `workers/noema/src/play.ts` (`renderTrail` uses helper)

**Interfaces:**
- Consumes: `LocationObs`, `TrailItem`, `TrailKind`, `escHtml`
- Produces:
  - `renderLookHtml(opts: { name?: string; description?: string; condition?: string; exitsLine?: string }): string`
  - `renderTrailHtml(items: TrailItem[]): string`
  - both included in `playUiRuntimeSource()`

- [ ] **Step 1: Write failing tests** at the bottom of `play-chamber.test.ts`:

```ts
import {
  renderLookHtml,
  renderTrailHtml,
  playUiRuntimeSource,
} from "../src/play-ui";

describe("look and trail text", () => {
  it("LOOK is a WHERE block with copper roles, no exit essay when rail is open", () => {
    const html = renderLookHtml({
      name: "The Broken Exchange",
      description: "Dust, copper, a stalled ledger.",
      condition: "crane seized · repairable",
    });
    expect(html).toContain("WHERE");
    expect(html).toContain("role-place");
    expect(html).toContain("The Broken Exchange");
    expect(html).toContain("Dust, copper");
    expect(html).toContain("CONDITION");
    expect(html).toContain("crane seized");
    expect(html).not.toMatch(/east →/);
  });

  it("LOOK appends exits line only when asked (mobile rail collapsed)", () => {
    const html = renderLookHtml({
      name: "Quay",
      description: "Water.",
      exitsLine: "east · quay",
    });
    expect(html).toContain("exits: east · quay");
  });

  it("trail rows use the four kinds and role classes", () => {
    const html = renderTrailHtml([
      { kind: "you", title: "look" },
      { kind: "local", title: "nacre is here" },
      { kind: "world", title: "The crane ticks once and stops." },
      { kind: "fail", title: "Not enough energy.", detail: "energy 0" },
    ]);
    expect(html).toContain("role-you");
    expect(html).toContain("role-here");
    expect(html).toContain("role-fail");
    expect(html).toContain("YOU");
    expect(html).toContain("LOCAL");
    expect(html).toContain("WORLD");
    expect(html).toContain("FAIL");
    expect(html).toContain("look");
    expect(html).toContain("energy 0");
    expect(html).not.toContain("CONTEST_DECLARE");
  });

  it("serializes the new helpers into the page runtime", () => {
    expect(playUiRuntimeSource()).toContain("function renderLookHtml");
    expect(playUiRuntimeSource()).toContain("function renderTrailHtml");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: FAIL — `renderLookHtml` is not exported.

- [ ] **Step 3: Implement helpers** in `workers/noema/src/play-ui.ts` after `escHtml`:

```ts
export function renderLookHtml(opts: {
  name?: string;
  description?: string;
  condition?: string;
  exitsLine?: string;
}): string {
  const name = escHtml(opts.name || "");
  const desc = escHtml(opts.description || "");
  const cond = String(opts.condition || "").trim();
  const exits = String(opts.exitsLine || "").trim();
  return (
    '<p class="where role-place">WHERE</p>' +
    '<h2 id="room-name">' + name + "</h2>" +
    '<p id="room-desc">' + desc + "</p>" +
    (cond
      ? '<div id="loc-cond"><b class="role-place">CONDITION</b><span id="loc-cond-text">' +
        escHtml(cond) +
        "</span></div>"
      : '<div id="loc-cond" hidden><b class="role-place">CONDITION</b><span id="loc-cond-text"></span></div>') +
    (exits
      ? '<p id="look-exits">exits: ' + escHtml(exits) + "</p>"
      : '<p id="look-exits" hidden></p>')
  );
}

export function renderTrailHtml(items: TrailItem[]): string {
  if (!items.length) return "";
  const label: Record<TrailKind, string> = {
    you: "YOU",
    local: "LOCAL",
    world: "WORLD",
    fail: "FAIL",
  };
  const role: Record<TrailKind, string> = {
    you: "role-you",
    local: "role-here",
    world: "",
    fail: "role-fail",
  };
  return items
    .map((t) => {
      const k = t.kind;
      const detail = t.detail
        ? '<span class="d">' + escHtml(t.detail) + "</span>"
        : "";
      return (
        "<li><span class=\"k " +
        k +
        (role[k] ? " " + role[k] : "") +
        '">' +
        label[k] +
        '</span><span class="t">' +
        escHtml(t.title) +
        detail +
        "</span></li>"
      );
    })
    .join("");
}
```

Add `renderLookHtml` and `renderTrailHtml` to the `playUiRuntimeSource()` function list.

In `play.ts` `renderTrail()`:

```js
    function renderTrail() {
      $("trail").innerHTML = state.trail.length
        ? renderTrailHtml(state.trail)
        : "";
    }
```

Remove the `trail-side` branch (node is gone).

- [ ] **Step 4: Run tests**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/play-ui.ts workers/noema/src/play.ts workers/noema/test/play-chamber.test.ts
git commit -m "feat(ui): render LOOK and trail as colored text"
```

---

### Task 3: Rail token lists

**Files:**
- Modify: `workers/noema/src/play-ui.ts` (`renderEntityListHtml`, `renderOpportunitiesHtml`, `renderPlayersHereHtml`; add `renderExitTokensHtml`)
- Modify: `workers/noema/test/play-chamber.test.ts`
- Modify: `workers/noema/src/play.ts` (exit list + `renderObs` uses `renderExitTokensHtml`)

**Interfaces:**
- Consumes: `EntityObs`, `ExitObs`, `LocationObs`, `PlayerHere`, `deriveOpportunities`, `escHtml`, `titleCaseLabel`, `playerHandle`
- Produces: `renderExitTokensHtml(exits: ExitObs[]): string` — teal `data-cmd` tokens. Entity / opp / player markup is compact tokens, not `.ent` / `.opp` cards.

- [ ] **Step 1: Write failing tests**

```ts
import {
  renderExitTokensHtml,
  renderEntityListHtml,
  renderOpportunitiesHtml,
  renderPlayersHereHtml,
} from "../src/play-ui";

describe("rail tokens", () => {
  it("exits are teal data-cmd tokens", () => {
    const html = renderExitTokensHtml([
      { direction: "east", to_room_id: "room.quay", to_room_name: "Quay" },
    ]);
    expect(html).toContain('data-cmd="move east"');
    expect(html).toContain("role-here");
    expect(html).toContain("east");
    expect(html).not.toMatch(/class="btn move"/);
  });

  it("entities are tokens with inspect/repair cmds", () => {
    const html = renderEntityListHtml([
      {
        entity_id: "e1",
        label: "crane",
        entity_type: "fixture",
        repairable: true,
      },
    ]);
    expect(html).toContain('data-cmd="inspect crane"');
    expect(html).toContain('data-cmd="repair crane"');
    expect(html).toContain("role-here");
    expect(html).not.toMatch(/class="ent"/);
    expect(html).not.toMatch(/class="glyph"/);
  });

  it("opportunities are tokens not opp cards", () => {
    const html = renderOpportunitiesHtml({
      room_id: "room.x",
      name: "X",
      description: "",
      exits: [{ direction: "east", to_room_id: "room.y", to_room_name: "Y" }],
      entities: [],
    });
    expect(html).toContain("data-cmd=");
    expect(html).not.toMatch(/class="opp"/);
  });

  it("players here stay message/trade cmds as tokens", () => {
    const html = renderPlayersHereHtml([{ player_id: "p1", handle: "nacre" }]);
    expect(html).toContain("nacre");
    expect(html).toContain("data-cmd=");
    expect(html).toContain("role-here");
    expect(html).not.toMatch(/class="ent player-here"/);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: FAIL — `renderExitTokensHtml` missing and/or `.ent` still present.

- [ ] **Step 3: Implement**

Add:

```ts
export function renderExitTokensHtml(exits?: ExitObs[] | null): string {
  if (!exits || !exits.length) return "";
  return exits
    .map((x) => {
      const dest = x.to_room_name || titleCaseLabel(x.to_room_id.replace(/^room\./, ""));
      return (
        '<li><button type="button" class="role-here" data-cmd="move ' +
        escHtml(x.direction) +
        '">' +
        escHtml(x.direction) +
        "</button> <span class=\"muted\">" +
        escHtml(dest) +
        "</span></li>"
      );
    })
    .join("");
}
```

Replace `renderEntityListHtml` return (empty state stays a `.empty` li) with:

```ts
      return (
        '<li><button type="button" class="role-here" data-cmd="inspect ' +
        escHtml(e.label) +
        '">' +
        escHtml(name) +
        "</button> <span class=\"muted\">" +
        escHtml(sub) +
        "</span>" +
        (e.repairable
          ? ' <button type="button" class="role-here" data-cmd="repair ' +
            escHtml(e.label) +
            '">repair</button>'
          : "") +
        (e.harvestable
          ? ' <button type="button" class="role-here" data-cmd="harvest ' +
            escHtml(e.label) +
            '">harvest</button>'
          : "") +
        "</li>"
      );
```

`renderOpportunitiesHtml` items:

```ts
        '<li><button type="button" class="role-here" data-cmd="' +
        escHtml(o.cmd) +
        '">' +
        escHtml(o.actionLabel) +
        "</button> <span class=\"muted\">" +
        escHtml(o.text) +
        "</span></li>"
```

`renderPlayersHereHtml` row (keep message / trade / invite `data-cmd` values exactly as today):

```ts
      let extra = "";
      for (const o of officerOrgs) {
        extra +=
          ' <button type="button" class="role-here" data-cmd="invite ' +
          escHtml(handle) +
          " to " +
          escHtml(o.org_id) +
          ' role=member">invite ' +
          escHtml(o.name) +
          "</button>";
      }
      return (
        '<li><button type="button" class="role-here" data-cmd="' +
        escHtml(msgCmd) +
        '">' +
        name +
        '</button> <button type="button" class="role-here" data-cmd="' +
        escHtml(tradeCmd) +
        '">trade</button>' +
        extra +
        "</li>"
      );
```

Add `renderExitTokensHtml` to `playUiRuntimeSource()`.

In `play.ts` `renderObs`, replace the exits `.map` button row with:

```js
      $("exit-list").innerHTML = renderExitTokensHtml(exits);
```

Delete the `$("act-strip")` write (and the `acts` assembly). Composer hint + rail tokens are the controls.

- [ ] **Step 4: Run tests**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts test/play-ui.test.ts
```

Expected: `play-chamber.test.ts` PASS. `play-ui.test.ts` desk/player behavior tests still PASS (`Talk unavailable` etc.). Shell HTML tests may still fail on old headings.

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/play-ui.ts workers/noema/src/play.ts workers/noema/test/play-chamber.test.ts
git commit -m "feat(ui): rail exits and entities as colored tokens"
```

---

### Task 4: Session boot, empty LOOK, masthead

**Files:**
- Modify: `workers/noema/src/play.ts` (`setSessionUi`, `renderObs` empty branch, `leave`, boot, masthead cycle)
- Modify: `workers/noema/test/play-chamber.test.ts` (string-contract on the client bundle)

**Interfaces:**
- Consumes: `noema.play.token`, existing `enterWorld` / `leave` / `sendCommand`
- Produces: token → `body.is-chamber` + `enter` + `look`. Empty in-chamber LOOK is `—` / waiting, never `Outside`. Leave success removes `is-chamber`. `NOT_AUTHORIZED` drops token and door. Cycle in `#ch-cycle`. Health chip only via existing `#play-health` when `/ready` says blocked.

- [ ] **Step 1: Write failing tests** (bundle contracts — the client is a string inside `playHtml()`):

```ts
describe("chamber client session", () => {
  const html = playHtml();
  it("toggles is-chamber and never paints Outside in the empty LOOK", () => {
    expect(html).toContain('classList.toggle("is-chamber"');
    expect(html).toContain('id="ch-cycle"');
    expect(html).not.toMatch(/textContent = "Outside"/);
    expect(html).not.toMatch(/Nothing visible until you enter/);
  });
  it("still auto-enters when noema.play.token is set", () => {
    expect(html).toContain('sessionStorage.getItem("noema.play.token")');
    expect(html).toContain("enterWorld(tok)");
    expect(html).toContain('await sendCommand("enter")');
    expect(html).toContain('await sendCommand("look")');
  });
  it("leave clears the play token", () => {
    expect(html).toContain('sessionStorage.removeItem("noema.play.token")');
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts
```

Expected: FAIL — `textContent = "Outside"` still in bundle.

- [ ] **Step 3: Patch client**

`renderObs` empty / not-in-world branch:

```js
      if (!obs || !obs.location || obs.in_world === false) {
        $("world-line").textContent = "—";
        $("room-name").textContent = "";
        $("room-desc").textContent = "Waiting for the world.";
        $("loc-cond").hidden = true;
        const lookExits = $("look-exits");
        if (lookExits) { lookExits.hidden = true; lookExits.textContent = ""; }
        $("entity-list").innerHTML = "";
        if (playersEl) playersEl.innerHTML = "";
        if (desksEl) desksEl.innerHTML = "";
        if (bondsCard) bondsCard.hidden = true;
        if (bondsBody) bondsBody.innerHTML = "";
        $("opp-list").innerHTML = "";
        $("exit-list").innerHTML = "";
        $("route-box").hidden = true;
        $("status-rows").innerHTML = "";
        $("meta-seq").textContent = "—";
        const cyc = $("ch-cycle");
        if (cyc) cyc.textContent = "";
        return;
      }
```

When in-world, set masthead:

```js
      $("world-line").textContent = obs.world_name || "In world";
      const cyc = $("ch-cycle");
      if (cyc) cyc.textContent = typeof obs.cycle === "number" ? "Cycle " + obs.cycle : "";
```

Mobile exits fallback after exits render:

```js
      const lookExits = $("look-exits");
      if (lookExits) {
        const narrow = window.matchMedia("(max-width: 900px)").matches;
        if (narrow && exits.length) {
          lookExits.hidden = false;
          lookExits.textContent = "exits: " + exits.map((x) => x.direction).join(" · ");
        } else {
          lookExits.hidden = true;
          lookExits.textContent = "";
        }
      }
```

`leave` already removes `noema.play.token`. After a successful leave it calls `setSessionUi(false)` which drops `is-chamber`. Keep that.

Patch `enterWorld` `catch` so a live token does not slam the door. Today it always `setSessionUi(false)` and `state.token = null`. Replace with:

```js
      } catch (e) {
        const h = humanizeError(e.code, e.message);
        let msg = h.primary;
        if (e.code === "NOT_AUTHORIZED" || /dev-token disabled/i.test(e.message || "")) {
          msg = e.message || "Request a play link to enter. If you already have a token, paste it under Advanced details.";
          state.token = null;
          setSessionUi(false);
          sessionNotice(msg, "bad");
        } else if (state.token) {
          setSessionUi(true);
          sessionNotice("");
          notice(msg, "bad");
          pushTrailItems([{ kind: "fail", title: (msg || "Action failed.").split("\\n")[0] }]);
        } else {
          setSessionUi(false);
          sessionNotice(msg, "bad");
        }
        $("err-advanced").textContent = h.advanced || e.message || "";
        state.busy = false;
      }
```

Do not add a persistent `HEALTHY` masthead chip. Leave `#play-health` as the only health line (already hidden unless `play_blocked`).

Composer hint verbs are already `data-cmd` tokens from Task 1. Incomplete cmds (`move `, `inspect `, `talk `) keep the existing “fill composer” path (`data-cmd` ending in space). Do not restore an `.act-strip`.

- [ ] **Step 4: Run tests**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test -- test/play-chamber.test.ts test/play-email-login.test.ts
```

Expected: chamber + email-login PASS (`Access token` still on the door).

- [ ] **Step 5: Commit**

```bash
git add workers/noema/src/play.ts workers/noema/test/play-chamber.test.ts
git commit -m "fix(ui): auto-enter Chamber without Outside empty state"
```

---

### Task 5: Regression tests, handoff, full suite

**Files:**
- Modify: `workers/noema/test/play-ui.test.ts` (`describe("play shell HTML")`)
- Modify: `docs/UI-HANDOFF.md` (PLAY row / product entry)
- Modify: `docs/superpowers/specs/2026-08-13-play-chamber-ui-design.md` (status)

**Interfaces:**
- Consumes: Task 1–4 HTML
- Produces: suite green; handoff says signed-in PLAY is the Chamber workspace

- [ ] **Step 1: Update failing shell assertions** in `play-ui.test.ts` `describe("play shell HTML")`:

Replace the five-section test and jargon test lead:

```ts
  it("uses chamber workspace hierarchy", () => {
    expect(html).toMatch(/id="play-chamber"/);
    expect(html).toMatch(/WHERE/);
    expect(html).toMatch(/>HERE</);
    expect(html).toMatch(/>EXITS</);
    expect(html).toMatch(/id="cmd"/);
  });

  it("avoids player-facing system jargon in primary chrome", () => {
    expect(html).not.toMatch(/PlayerPrincipal/);
    expect(html).not.toMatch(/Genesis/);
    expect(html).not.toMatch(/settlement internals/i);
    expect(html).toMatch(/WHERE/);
  });
```

Keep: no controller selector, `Enter world` (door), `/connect`, `id="cmd"`, Advanced details, `id="token-paste"`, no seed ids, `/admin#players`, `id="play-health"`, `id="desk-list"`, `id="players-here"`, `id="bonds-card"`, `Leave world`, embedded helpers.

- [ ] **Step 2: Run the full Worker suite**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test && npx tsc --noEmit
```

Expected: all tests PASS, typecheck clean. If a test still wants `What is here` / `act-strip` / `session-in`, update that assertion to the Chamber contract — do not restore cards.

- [ ] **Step 3: Handoff + spec status**

In `docs/UI-HANDOFF.md`, change the hosted entry sentence (the paragraph beginning “The hosted product entry at `/`”) so PLAY after login is the full-viewport Chamber (masthead / scrollback / rail / composer), not a card stack + Enter world. Keep Admin ≠ Player and Genesis freeze.

In the spec, set:

```md
**Status:** approved — implementing
```

- [ ] **Step 4: Re-run tests after doc-only? skip. Commit**

```bash
git add workers/noema/test/play-ui.test.ts docs/UI-HANDOFF.md docs/superpowers/specs/2026-08-13-play-chamber-ui-design.md
git commit -m "test(ui): Chamber hierarchy; document PLAY workspace"
```

- [ ] **Step 5: Final verification**

```bash
cd /home/scrimshawlife/Noema/workers/noema && npm test
```

Expected: PASS. Do not deploy or activate Genesis.

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Signed-out door = play email, no admin form | 1 |
| Both trees in one `playHtml()`; `body.is-chamber` | 1, 4 |
| Hide `.top` / `.foot` in chamber | 1 |
| Masthead / scrollback / rail / composer | 1 |
| No Outside / Enter world in Chamber default | 1, 4 |
| Color role classes | 1 |
| LOOK WHERE block; exits only when rail collapsed | 2, 4 |
| Trail you/local/world/fail | 2 |
| Actions as `data-cmd` tokens, not button rows | 3 |
| Bonds / desks / players in rail | 1 (slots), 3 (tokens) |
| Auto enter + look on token | 4 (preserve) |
| Leave masthead → door | 1, 4 |
| ENTER/LOOK fail with token stays in Chamber | 4 |
| `NOT_AUTHORIZED` drops token → door | 4 |
| Hint verbs as `data-cmd` tokens | 4 |
| Health only when blocked | 4 |
| Advanced in rail; token paste on door | 1 |
| Existing email-login / play-ui / product-surface | 5 |
| UI-HANDOFF | 5 |
| No new verbs / Genesis / Watch restyle | all (non-touch) |
