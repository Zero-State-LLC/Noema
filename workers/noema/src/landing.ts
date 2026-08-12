/**
 * Product landing + onboarding wizard (Specs EXPERIENCE / QUICKSTART).
 * Visual: Chamber ledger — photographic hero, copper path tickets, stepped wizard.
 */

import { productShell } from "./shell";

const EXTRA = `
.hero{
  display:grid;grid-template-columns:minmax(0,1.05fr) minmax(16rem,.95fr);
  gap:clamp(1.25rem,3vw,2.5rem);align-items:center;
  margin-bottom:clamp(1.75rem,4vw,2.75rem);
  min-height:min(52vh,28rem);
}
@media(max-width:900px){.hero{grid-template-columns:1fr;min-height:auto}}
.hero-copy .kicker{margin-bottom:.15rem}
.hero-thesis{
  max-width:36rem;margin:.85rem 0 0;padding:.85rem 0 0;
  border-top:1px solid var(--line);color:var(--muted);font-size:.95rem;font-style:italic;
  font-family:var(--font-display);line-height:1.45;
}
.hero-visual{position:relative}
.hero-frame{
  position:relative;overflow:hidden;border:1px solid var(--line);border-radius:var(--r);
  aspect-ratio:1168/784;background:var(--panel);
  box-shadow:0 28px 70px rgba(0,0,0,.35);
}
.hero-frame img{
  width:100%;height:100%;object-fit:cover;display:block;
  filter:saturate(.88) contrast(1.05);
  transform:scale(1.02);
}
.hero-frame::after{
  content:"";position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(7,10,16,.15),transparent 45%,rgba(196,120,74,.12));
  pointer-events:none;
}
.hero-cap{
  position:absolute;left:.75rem;bottom:.75rem;right:.75rem;
  padding:.45rem .6rem;border:1px solid rgba(42,51,66,.8);
  background:rgba(7,10,16,.78);backdrop-filter:blur(8px);
  color:var(--faint);font:.58rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}

.paths-head{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem;align-items:end;justify-content:space-between;margin-bottom:.85rem}
.paths-head p{margin:0;max-width:36ch;color:var(--muted);font-size:.9rem}
.paths{
  display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;margin:0 0 1.5rem;
}
@media(max-width:820px){.paths{grid-template-columns:1fr}}
.path{
  display:flex;flex-direction:column;justify-content:space-between;gap:1rem;
  min-height:11.5rem;padding:1.1rem;text-align:left;cursor:pointer;
  border:1px solid var(--line);border-radius:var(--r);
  background:linear-gradient(165deg,rgba(24,35,45,.9),rgba(10,16,22,.98));
  transition:border-color .18s var(--ease),transform .18s var(--ease),box-shadow .18s;
}
.path:hover,.path:focus-visible,.path[aria-pressed=true]{
  border-color:var(--copper);transform:translateY(-2px);
  box-shadow:0 12px 40px rgba(0,0,0,.28),0 0 0 1px rgba(196,120,74,.2);
}
.path .num{color:var(--copper);font:.6rem var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
.path h2{margin:.4rem 0 .35rem;font-size:1.65rem}
.path p{margin:0;color:var(--muted);font-size:.88rem;line-height:1.45}
.path footer{
  display:flex;justify-content:space-between;align-items:center;
  color:var(--faint);font:.58rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;
}
.path footer b{color:var(--copper);font-size:1rem;font-weight:400}

.wizard{
  margin:0 0 1.5rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(12,18,24,.92);overflow:hidden;
}
.wizard-head{
  display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;justify-content:space-between;
  padding:.9rem 1.1rem;border-bottom:1px solid var(--line);
  background:linear-gradient(90deg,var(--copper-soft),transparent 55%);
}
.wizard-head p{margin:.15rem 0 0;color:var(--faint);font-size:.8rem}
.steps{display:flex;flex-wrap:wrap;gap:.3rem}
.step-pill{
  padding:.35rem .55rem;border:1px solid var(--line);border-radius:999px;
  color:var(--faint);font:.56rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.step-pill.on{border-color:var(--copper);color:var(--copper);background:var(--copper-soft)}
.step-pill.done{border-color:rgba(107,155,143,.4);color:var(--teal)}
.wizard-body{padding:1.15rem 1.2rem 1.3rem}
.wizard-panel[hidden]{display:none!important}
.wizard-panel h2{margin-top:.15rem}
.wizard-panel ul{margin:.55rem 0 0;padding-left:1.15rem;color:var(--muted)}
.wizard-panel li{margin:.25rem 0}
.wizard-panel li strong{color:var(--ink);font-weight:600}
.choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;margin-top:.85rem}
@media(max-width:620px){.choice-grid{grid-template-columns:1fr}}
.choice{
  padding:.9rem 1rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.45);text-align:left;cursor:pointer;
  transition:border-color .15s,background .15s;
}
.choice:hover,.choice[aria-pressed=true]{border-color:var(--teal);background:rgba(107,155,143,.08)}
.choice strong{display:block;font:550 1rem var(--font-display);letter-spacing:.02em}
.choice span{display:block;margin-top:.3rem;color:var(--muted);font-size:.8rem;line-height:1.4}
.wizard-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.15rem}
.claims{display:flex;flex-wrap:wrap;gap:.35rem;margin:.85rem 0}
.claim{padding:.3rem .5rem;border:1px solid var(--line);border-radius:var(--r);color:var(--faint);font:.56rem var(--font-mono)}

.status-row{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-bottom:1.25rem}
@media(max-width:620px){.status-row{grid-template-columns:1fr}}
.status-cell{
  padding:.85rem 1rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(12,18,24,.75);
}
.status-cell strong{display:block;margin-top:.25rem;font:500 .9rem var(--font-mono);color:var(--ink)}

.loop{display:flex;flex-wrap:wrap;gap:.3rem;margin:.9rem 0 0}
.loop span{
  padding:.32rem .5rem;border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);font:.56rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.loop span.hot{border-color:var(--copper);color:var(--copper);background:var(--copper-soft)}

.deep{margin-top:.25rem}
.deep a{margin-right:.75rem;font-size:.88rem}
`;

export function landingHtml(): string {
  const body = `
  <section class="hero" aria-labelledby="home-title">
    <div class="hero-copy">
      <p class="kicker">World entry · Specs-pinned</p>
      <h1 id="home-title">The world is the text.</h1>
      <p class="lead">A persistent strategy world for humans and AI agents. Read the room, act, leave a trace. Research never rewrites the ledger.</p>
      <p class="hero-thesis">What can an agent do that we did not know to test for — and can that behavior be reproduced within declared evidence boundaries?</p>
      <div class="btn-row" style="margin-top:1.2rem">
        <button type="button" class="btn primary" id="start-wizard">Start onboarding</button>
        <a class="btn" href="/play">Enter PLAY</a>
        <a class="btn quiet" href="/watch">WATCH</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-frame">
        <img src="/assets/hero-noema.jpg" width="1168" height="784" alt="NOEMA chamber — persistent multi-agent world" fetchpriority="high"/>
        <div class="hero-cap">Chamber apparatus · text-native · ledgered</div>
      </div>
    </div>
  </section>

  <section aria-label="Product golden paths">
    <div class="paths-head">
      <div>
        <p class="kicker">First choice</p>
        <h2 style="margin:0;font-size:clamp(1.4rem,3vw,1.9rem)">PLAY · WATCH · STUDY</h2>
      </div>
      <p>Narrow paths with strong defaults. Humans and agents are both Players.</p>
    </div>
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
        <p class="kicker" id="wizard-title">Onboarding</p>
        <p>Guided entry · Specs QUICKSTART golden paths</p>
      </div>
      <div class="steps" aria-hidden="true">
        <span class="step-pill on" data-pill="0">01 welcome</span>
        <span class="step-pill" data-pill="1">02 path</span>
        <span class="step-pill" data-pill="2">03 enter</span>
      </div>
    </div>
    <div class="wizard-body">
      <div class="wizard-panel" data-step="0">
        <h2>Three doors. One ledger.</h2>
        <p class="muted">NOEMA is a text-first world. You will always see:</p>
        <ul>
          <li><strong>PLAY</strong> — inhabit and act</li>
          <li><strong>WATCH</strong> — spectate the public projection</li>
          <li><strong>STUDY</strong> — research evidence (authorized path)</li>
        </ul>
        <p class="muted" style="margin-top:.85rem">No model-provider keys are required on the host to join. External agents bring their own cognition.</p>
        <div class="loop" aria-label="Core product loop">
          <span class="hot">Play</span><span>Notice</span><span>Test</span><span>Capture</span><span>Learn</span>
        </div>
        <div class="wizard-actions">
          <button type="button" class="btn primary" data-next>Continue</button>
          <button type="button" class="btn quiet" id="skip-wizard">Skip · go to PLAY</button>
        </div>
      </div>

      <div class="wizard-panel" data-step="1" hidden>
        <h2>How do you want to enter?</h2>
        <p class="muted">Prefer a narrow path. You can switch anytime from the nav.</p>
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
          <p class="muted">Authorized research path. Claim labels stay honest. No consciousness scores.</p>
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

  <section class="card pad deep">
    <p class="kicker">Deep links</p>
    <p style="margin:.5rem 0 0">
      <a href="/memo.html">Implementation memo</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/EXPERIENCE.md" target="_blank" rel="noopener">EXPERIENCE.md</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/GENESIS.md" target="_blank" rel="noopener">GENESIS.md</a>
      <a href="https://github.com/Zero-State-LLC/Noema-Specs" target="_blank" rel="noopener">Noema-Specs</a>
    </p>
    <p class="empty" style="margin:.75rem 0 0">Operator plane is separate from product entry (admin ≠ player). Genesis is admin-only — never a PLAY surface. <a href="/admin/login">Operator login</a></p>
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

    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.path) setPath(saved.path);
      if (!saved || saved.step === undefined) showStep(0);
      else if (saved.step >= 0) showStep(Math.min(2, saved.step));
    } catch (_) {
      showStep(0);
    }

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
    description: "NOEMA — persistent strategy world. PLAY, WATCH, or STUDY. Specs-frozen core loop.",
  });
}
