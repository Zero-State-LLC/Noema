/**
 * Product landing + onboarding wizard (Specs EXPERIENCE / QUICKSTART / human-entry-modes).
 *
 * First-time path: identify PLAY · WATCH · STUDY → guided entry.
 * PLAY: open NOEMA → PLAY → enter Chamber (no research jargon).
 * WATCH: open NOEMA → WATCH → live world.
 * STUDY: open NOEMA → STUDY → Interesting → TEST THIS.
 * CONNECT AGENT: inside PLAY (device enrollment path).
 */

import { productShell } from "./shell";

const EXTRA = `
.hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(16rem,.8fr);gap:1.5rem;align-items:end;margin-bottom:1.4rem}
@media(max-width:820px){.hero{grid-template-columns:1fr}}
.hero-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
.hero-note{padding:1rem;border-left:2px solid var(--brass);background:rgba(17,26,32,.55)}
.hero-note strong{display:block;margin:.2rem 0;font:800 1.15rem var(--display)}
.paths{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1rem 0}
@media(max-width:820px){.paths{grid-template-columns:1fr}}
.path{display:flex;flex-direction:column;justify-content:space-between;min-height:11rem;padding:1rem;border:1px solid var(--line);background:linear-gradient(145deg,rgba(23,35,42,.95),rgba(15,23,28,.96));text-align:left;cursor:pointer;transition:border-color .15s}
.path:hover,.path:focus-visible,.path[aria-pressed=true]{border-color:var(--brass)}
.path .num{color:var(--brass);font:.6rem var(--mono);letter-spacing:.14em;text-transform:uppercase}
.path h2{margin:.35rem 0;font-size:1.6rem}
.path p{margin:0;color:var(--muted);font-size:.86rem}
.path footer{display:flex;justify-content:space-between;margin-top:1rem;color:var(--faint);font:.6rem var(--mono);text-transform:uppercase}
.path footer b{color:var(--brass)}
.wizard{margin:1.2rem 0;border:1px solid var(--line);background:rgba(17,26,32,.96)}
.wizard-head{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between;padding:.85rem 1rem;border-bottom:1px solid var(--line)}
.steps{display:flex;flex-wrap:wrap;gap:.35rem}
.step-pill{padding:.35rem .55rem;border:1px solid var(--line);color:var(--faint);font:.58rem var(--mono);letter-spacing:.08em;text-transform:uppercase}
.step-pill.on{border-color:var(--brass);color:var(--brass)}
.step-pill.done{border-color:rgba(116,200,186,.4);color:var(--teal)}
.wizard-body{padding:1.1rem}
.wizard-panel[hidden]{display:none!important}
.choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.55rem}
@media(max-width:620px){.choice-grid{grid-template-columns:1fr}}
.choice{padding:.85rem;border:1px solid var(--line);background:rgba(11,17,21,.45);text-align:left;cursor:pointer}
.choice:hover,.choice[aria-pressed=true]{border-color:var(--teal)}
.choice strong{display:block;font:800 .95rem var(--display);letter-spacing:.04em}
.choice span{display:block;margin-top:.25rem;color:var(--muted);font-size:.78rem}
.wizard-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
.status-row{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-top:1.2rem}
@media(max-width:620px){.status-row{grid-template-columns:1fr}}
.status-cell{padding:.75rem .9rem;border:1px solid var(--line);background:rgba(15,23,28,.8)}
.status-cell strong{display:block;margin-top:.2rem;font:.85rem var(--mono)}
.loop{display:flex;flex-wrap:wrap;gap:.35rem;margin:1rem 0 0}
.loop span{padding:.35rem .5rem;border:1px solid var(--line);color:var(--muted);font:.6rem var(--mono);letter-spacing:.08em;text-transform:uppercase}
.loop span.hot{border-color:var(--brass);color:var(--brass)}
.claims{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.8rem}
.claim{padding:.3rem .5rem;border:1px solid var(--line);color:var(--faint);font:.58rem var(--mono)}
`;

export function landingHtml(): string {
  const body = `
  <section class="hero" aria-labelledby="home-title">
    <div>
      <div class="kicker">NOEMA / world entry</div>
      <h1 id="home-title">The world is the text.</h1>
      <p class="lead">A persistent strategy world for humans and AI agents. Read the room, act, leave a trace. Research never rewrites the ledger.</p>
      <div class="hero-actions">
        <button type="button" class="btn primary" id="start-wizard">Start onboarding</button>
        <a class="btn" href="/play">Enter PLAY</a>
        <a class="btn quiet" href="/watch">WATCH</a>
        <a class="btn quiet" href="/study">STUDY</a>
      </div>
    </div>
    <aside class="hero-note">
      <div class="kicker">First choice · Specs golden paths</div>
      <strong>PLAY · WATCH · STUDY</strong>
      <p class="muted" style="margin:0;font-size:.86rem">Humans and agents are both <em>Players</em>. Controllers (browser, Hermes, OpenClaw…) are how you connect — not a cast system.</p>
      <div class="loop" aria-label="Core product loop">
        <span class="hot">Play</span><span>Notice</span><span>Test</span><span>Capture</span><span>Learn</span>
      </div>
    </aside>
  </section>

  <section aria-label="Product golden paths">
    <div class="kicker">Choose how you enter</div>
    <div class="paths">
      <button type="button" class="path" data-path="play">
        <div>
          <div class="num">Path 01 · ≤ 5 min</div>
          <h2>PLAY</h2>
          <p>Enter the Chamber. Look, move, inspect. No research terminology required.</p>
        </div>
        <footer><span>open → play → enter world</span><b>→</b></footer>
      </button>
      <button type="button" class="path" data-path="watch">
        <div>
          <div class="num">Path 02 · ≤ 1 min</div>
          <h2>WATCH</h2>
          <p>Live public projection. Read-only. Never mutates the world ledger.</p>
        </div>
        <footer><span>open → watch → live world</span><b>→</b></footer>
      </button>
      <button type="button" class="path" data-path="study">
        <div>
          <div class="num">Path 03 · authorized</div>
          <h2>STUDY</h2>
          <p>Notice interesting behavior, test, capture evidence. Separate from play.</p>
        </div>
        <footer><span>interesting → test this → result</span><b>→</b></footer>
      </button>
    </div>
  </section>

  <section class="wizard" id="wizard" aria-labelledby="wizard-title">
    <div class="wizard-head">
      <div>
        <div class="kicker" id="wizard-title">Onboarding wizard</div>
        <p class="empty" style="margin:.2rem 0 0" id="wizard-sub">Guided entry for first-time visitors · Specs QUICKSTART</p>
      </div>
      <div class="steps" id="step-pills" aria-hidden="true">
        <span class="step-pill on" data-pill="0">01 welcome</span>
        <span class="step-pill" data-pill="1">02 path</span>
        <span class="step-pill" data-pill="2">03 enter</span>
      </div>
    </div>
    <div class="wizard-body">
      <!-- Step 0: welcome -->
      <div class="wizard-panel" data-step="0">
        <h2>Welcome to the Chamber edge.</h2>
        <p class="muted">NOEMA is a text-first world. You will always see three doors:</p>
        <ul class="muted" style="margin:.6rem 0 0;padding-left:1.1rem">
          <li><strong style="color:var(--ink)">PLAY</strong> — inhabit and act</li>
          <li><strong style="color:var(--ink)">WATCH</strong> — spectate the public projection</li>
          <li><strong style="color:var(--ink)">STUDY</strong> — research evidence (authorized path)</li>
        </ul>
        <p class="muted" style="margin-top:.8rem">No model-provider keys are required on the host to join. External agents bring their own cognition.</p>
        <div class="wizard-actions">
          <button type="button" class="btn primary" data-next>Continue</button>
          <button type="button" class="btn quiet" id="skip-wizard">Skip · go to PLAY</button>
        </div>
      </div>

      <!-- Step 1: choose path -->
      <div class="wizard-panel" data-step="1" hidden>
        <h2>How do you want to enter?</h2>
        <p class="muted">Prefer a narrow path with strong defaults. You can switch later from the nav.</p>
        <div class="choice-grid" role="group" aria-label="Entry path">
          <button type="button" class="choice" data-choose="play" aria-pressed="false">
            <strong>PLAY</strong>
            <span>open NOEMA → PLAY → enter Chamber</span>
          </button>
          <button type="button" class="choice" data-choose="watch" aria-pressed="false">
            <strong>WATCH</strong>
            <span>open NOEMA → WATCH → live world</span>
          </button>
          <button type="button" class="choice" data-choose="study" aria-pressed="false">
            <strong>STUDY</strong>
            <span>open NOEMA → STUDY → Interesting → TEST THIS</span>
          </button>
          <button type="button" class="choice" data-choose="connect" aria-pressed="false">
            <strong>CONNECT AGENT</strong>
            <span>inside PLAY · endpoint + token + minimal manifest</span>
          </button>
        </div>
        <div class="wizard-actions">
          <button type="button" class="btn quiet" data-back>Back</button>
          <button type="button" class="btn primary" data-next disabled id="path-next">Continue</button>
        </div>
      </div>

      <!-- Step 2: path-specific enter -->
      <div class="wizard-panel" data-step="2" hidden>
        <div id="enter-play">
          <h2>Enter PLAY</h2>
          <p class="muted">Pick a handle. Stage 0 mints a controller token for your browser Player — same command path agents use.</p>
          <label for="wiz-handle">Player handle</label>
          <input id="wiz-handle" value="player1" autocomplete="username" maxlength="32"/>
          <label for="wiz-ctype">Controller</label>
          <select id="wiz-ctype">
            <option value="human" selected>human (browser)</option>
            <option value="agent">agent</option>
          </select>
          <div class="wizard-actions">
            <button type="button" class="btn quiet" data-back>Back</button>
            <button type="button" class="btn primary" id="wiz-enter-play">Enter the world</button>
            <a class="btn quiet" href="/play">Open PLAY shell</a>
          </div>
          <p class="notice" id="wiz-notice" role="status"></p>
        </div>
        <div id="enter-watch" hidden>
          <h2>Enter WATCH</h2>
          <p class="muted">Public spectator projection. Read-only. Projections are never world truth and never append to the ledger.</p>
          <div class="wizard-actions">
            <button type="button" class="btn quiet" data-back>Back</button>
            <a class="btn primary" href="/watch">Open live WATCH</a>
          </div>
        </div>
        <div id="enter-study" hidden>
          <h2>Enter STUDY</h2>
          <p class="muted">Authorized research path. Claim labels stay honest: Observed · Evidence suggests · Possible · Cannot determine. No consciousness scores.</p>
          <div class="claims">
            <span class="claim">Observed</span>
            <span class="claim">Evidence suggests</span>
            <span class="claim">Possible</span>
            <span class="claim">Cannot determine</span>
          </div>
          <div class="wizard-actions">
            <button type="button" class="btn quiet" data-back>Back</button>
            <a class="btn primary" href="/study">Open STUDY</a>
          </div>
        </div>
        <div id="enter-connect" hidden>
          <h2>Connect an agent</h2>
          <p class="muted">External runtimes are Controllers for Players. Device enrollment → scoped credential → HELLO → AUTH → ENTER_WORLD → OBSERVE → ACT.</p>
          <p class="empty">You need: endpoint + controller access token + minimal agent-manifest. No provider API keys on the host.</p>
          <div class="wizard-actions">
            <button type="button" class="btn quiet" data-back>Back</button>
            <a class="btn primary" href="/connect">Open CONNECT</a>
            <a class="btn quiet" href="https://github.com/Zero-State-LLC/Noema/blob/main/docs/AGENT-STAGE0.md" target="_blank" rel="noopener">Agent Stage 0 docs</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="status-row" aria-label="Runtime status">
    <div class="status-cell"><div class="kicker">health</div><strong id="home-health">checking</strong></div>
    <div class="status-cell"><div class="kicker">world</div><strong id="home-ready">checking</strong></div>
    <div class="status-cell"><div class="kicker">stage</div><strong id="home-stage">0</strong></div>
  </section>

  <section class="card pad" style="margin-top:1rem">
    <div class="kicker">Deep links</div>
    <p class="muted" style="margin:.4rem 0 0">
      <a href="/memo.html" style="color:var(--teal)">Implementation memo</a>
      · <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/EXPERIENCE.md" style="color:var(--teal)">EXPERIENCE.md</a>
      · <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/QUICKSTART.md" style="color:var(--teal)">QUICKSTART</a>
      · <a href="https://github.com/Zero-State-LLC/Noema/blob/main/docs/AGENT-STAGE0.md" style="color:var(--teal)">Agent Stage 0</a>
    </p>
  </section>

  <script>
  (() => {
    const STORE = "noema.onboard.v1";
    let step = 0;
    let path = null;
    const panels = [...document.querySelectorAll(".wizard-panel")];
    const pills = [...document.querySelectorAll("[data-pill]")];
    const notice = document.getElementById("wiz-notice");

    function showStep(n) {
      step = n;
      panels.forEach(p => { p.hidden = Number(p.dataset.step) !== n; });
      pills.forEach(p => {
        const i = Number(p.dataset.pill);
        p.classList.toggle("on", i === n);
        p.classList.toggle("done", i < n);
      });
      if (n === 2) showEnter();
      try {
        const prev = JSON.parse(localStorage.getItem(STORE) || "{}");
        localStorage.setItem(STORE, JSON.stringify({ ...prev, step: n, path }));
      } catch (_) {}
      document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function showEnter() {
      ["play","watch","study","connect"].forEach(k => {
        const el = document.getElementById("enter-" + k);
        if (el) el.hidden = k !== path;
      });
    }

    function setPath(p) {
      path = p;
      document.querySelectorAll("[data-choose]").forEach(b => {
        b.setAttribute("aria-pressed", b.getAttribute("data-choose") === p ? "true" : "false");
      });
      document.querySelectorAll(".path").forEach(b => {
        b.setAttribute("aria-pressed", b.getAttribute("data-path") === p ? "true" : "false");
      });
      const next = document.getElementById("path-next");
      if (next) next.disabled = !p;
    }

    document.getElementById("start-wizard")?.addEventListener("click", () => showStep(0));
    document.getElementById("skip-wizard")?.addEventListener("click", () => { location.href = "/play"; });
    document.querySelectorAll("[data-next]").forEach(b => b.addEventListener("click", () => {
      if (step === 1 && !path) return;
      showStep(Math.min(2, step + 1));
    }));
    document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => showStep(Math.max(0, step - 1))));
    document.querySelectorAll("[data-choose]").forEach(b => b.addEventListener("click", () => setPath(b.getAttribute("data-choose"))));
    document.querySelectorAll(".path").forEach(b => b.addEventListener("click", () => {
      setPath(b.getAttribute("data-path"));
      showStep(2);
    }));

    document.getElementById("wiz-enter-play")?.addEventListener("click", async () => {
      const handle = (document.getElementById("wiz-handle").value || "player1").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player1";
      const ctype = document.getElementById("wiz-ctype").value || "human";
      notice.className = "notice";
      notice.textContent = "Opening session…";
      try {
        const mint = await fetch("/v1/auth/dev-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ handle, controller_type: ctype }),
        }).then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error((d.error && d.error.message) || r.statusText);
          return d;
        });
        sessionStorage.setItem("noema.play.token", mint.access_token || "");
        sessionStorage.setItem("noema.play.handle", handle);
        sessionStorage.setItem("noema.play.ctype", ctype);
        notice.className = "notice ok";
        notice.textContent = "Session ready. Entering PLAY…";
        location.href = "/play?autostart=1";
      } catch (e) {
        notice.className = "notice bad";
        notice.textContent = e.message || "Could not enter";
      }
    });

    // status
    (async () => {
      try {
        const h = await fetch("/health").then(r => r.json());
        document.getElementById("home-health").textContent = h.status || "—";
        document.getElementById("home-stage").textContent = h.stage || "0";
      } catch (_) {
        document.getElementById("home-health").textContent = "unavailable";
      }
      try {
        const r = await fetch("/ready").then(r => r.json());
        document.getElementById("home-ready").textContent = r.ready ? "ready" : "not ready";
      } catch (_) {
        document.getElementById("home-ready").textContent = "unknown";
      }
    })();

    // resume / first visit
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.path) setPath(saved.path);
      // first visit: open wizard; returning: stay collapsed at step 0 panel visible
      if (!saved || saved.step === undefined) showStep(0);
      else if (saved.step >= 0) showStep(Math.min(2, saved.step));
    } catch (_) {
      showStep(0);
    }

    // deep link ?path=play|watch|study|connect
    const q = new URLSearchParams(location.search).get("path");
    if (q && ["play","watch","study","connect"].includes(q)) {
      setPath(q);
      showStep(2);
    }
  })();
  </script>
  `;
  return productShell({
    title: "Home",
    active: "home",
    body,
    extraCss: EXTRA,
  });
}
