/**
 * ADMIN management console — separate from PLAY/WATCH/STUDY.
 * Specs: PLATFORM (admin ≠ player) · GENESIS (admin-only) · UI-HANDOFF.
 */

import { FONT_LINKS, TOKEN_CSS } from "./theme/tokens";
import { agentInhabitSnippetJs } from "./agent-inhabit";
import { glyphCatalog, legendHtml } from "./presentation/glyphs";
import { followOperatorWatch, phosphorSnapshotFromOperatorWatch } from "./operator-watch";
import { phosphorInlineScript } from "./watch-phosphor";

const FONTS = FONT_LINKS;

const CSS = `
${TOKEN_CSS}
:root{
  --operator-accent:var(--color-state-warning);
  --operator-accent-soft:color-mix(in srgb,var(--color-state-warning) 18%, transparent);
  --operator-ink:var(--color-text-inverse);
  --r:2px;
}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--void);color:var(--ink);font:15px/1.5 var(--font-body)}
body{background:radial-gradient(ellipse 50% 40% at 80% -5%,color-mix(in srgb,var(--color-state-warning) 10%, transparent),transparent),var(--void)}
a{color:var(--operator-accent);text-decoration:none}a:hover{color:var(--ink)}
button,input,select{font:inherit}button{cursor:pointer;color:inherit;background:none;border:0}
button:disabled{opacity:.45;cursor:not-allowed}
:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:2px}
.skip{
  position:fixed;z-index:var(--z-skip);top:.75rem;left:.75rem;padding:.5rem .75rem;
  background:var(--color-state-active);color:var(--color-text-inverse);font:600 .75rem var(--font-interface);
  transform:translateY(-160%);text-decoration:none;white-space:nowrap;
}
.skip:focus{transform:none}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition:none!important}
}
@media(max-width:640px){
  .btn,input,select,.nav a{min-height:44px}
}
.top{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;justify-content:space-between;padding:.7rem 1.25rem;border-bottom:1px solid var(--line);background:rgba(7,10,16,.92)}
.brand{font:550 1rem var(--font-display);letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.brand span{display:block;margin-top:.15rem;color:var(--faint);font:.55rem var(--font-mono);letter-spacing:.1em}
.nav{display:flex;flex-wrap:wrap;gap:.2rem}
.nav a{padding:.45rem .6rem;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.nav a[aria-current=page],.nav a:hover{color:var(--ink)}
.tag{display:inline-flex;padding:.28rem .45rem;border:1px solid var(--line);color:var(--muted);font:.55rem var(--font-mono);text-transform:uppercase}
.tag.ok{color:var(--teal);border-color:rgba(107,155,143,.45)}.tag.warn{color:var(--operator-accent)}.tag.bad{color:var(--ember)}
.kicker{color:var(--operator-accent);font:500 .6rem var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
h1{margin:.25rem 0;font:550 clamp(1.8rem,4vw,2.8rem)/1.05 var(--font-display)}
h2{margin:.2rem 0;font:550 1.25rem var(--font-display)}
.muted{color:var(--muted)}.faint{color:var(--faint)}.empty{color:var(--faint);font-size:.82rem}
.btn{display:inline-flex;min-height:2.4rem;align-items:center;justify-content:center;padding:.5rem .85rem;border:1px solid var(--line-hot);border-radius:var(--r);background:var(--panel-2);font-weight:600}
.btn.primary{background:var(--operator-accent);color:var(--operator-ink);border-color:var(--operator-accent)}
.btn.quiet{background:transparent;color:var(--muted)}
.btn.danger{border-color:rgba(196,106,90,.55);color:var(--ember)}
.btn-row{display:flex;flex-wrap:wrap;gap:.45rem}
label{display:block;margin:.5rem 0 .25rem;color:var(--muted);font-size:.74rem}
input,select{width:100%;min-height:2.35rem;padding:.5rem .65rem;border:1px solid var(--line-hot);border-radius:var(--r);background:#0a1016;color:var(--ink)}
.card{border:1px solid var(--line);border-radius:var(--r);background:linear-gradient(160deg,rgba(24,35,45,.95),rgba(12,18,24,.98))}
.pad{padding:1rem 1.1rem}
.frame{display:grid;grid-template-columns:13.5rem 1fr;min-height:calc(100vh - 3.5rem)}
@media(max-width:820px){.frame{grid-template-columns:1fr}}
.rail{padding:1rem .75rem;border-right:1px solid var(--line);background:rgba(10,14,20,.95)}
@media(max-width:820px){.rail{border-right:0;border-bottom:1px solid var(--line)}}
.rail strong{display:block;font:550 1.1rem var(--font-display);letter-spacing:.12em}
.rail-nav{display:grid;gap:.15rem;margin-top:1rem}
.rail-nav a{padding:.55rem .55rem;border-left:2px solid transparent;color:var(--muted);font:.65rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase}
.rail-nav a:hover,.rail-nav a.active{border-left-color:var(--operator-accent);color:var(--ink);background:var(--operator-accent-soft)}
.rail-foot{margin-top:1.5rem;padding:.7rem;border:1px solid var(--line);color:var(--faint);font:.58rem/1.45 var(--font-mono)}
.main{padding:1.25rem clamp(1rem,3vw,2rem) 3rem}
.section{scroll-margin-top:1rem;padding:1.5rem 0 0}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.65rem}
.s3{grid-column:span 3}.s4{grid-column:span 4}.s5{grid-column:span 5}.s6{grid-column:span 6}.s7{grid-column:span 7}.s8{grid-column:span 8}.s12{grid-column:1/-1}
@media(max-width:900px){.s3,.s4,.s5,.s6,.s7,.s8{grid-column:1/-1}}
.metric{padding:1rem;border-top:2px solid var(--line-hot);background:#0a1016}
.metric.teal{border-top-color:var(--teal)}.metric.warn{border-top-color:var(--operator-accent)}
.metric strong{display:block;margin-top:.3rem;font:550 clamp(1.5rem,3vw,2.1rem) var(--font-display)}
.metric span{color:var(--faint);font:.58rem var(--font-mono);text-transform:uppercase}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.35rem .7rem;margin:0;font-size:.8rem}
.kv dt{color:var(--faint);font:.58rem var(--font-mono);text-transform:uppercase}.kv dd{margin:0;overflow-wrap:anywhere}
.notice{min-height:1.2rem;margin:.7rem 0 0;color:var(--muted);font-size:.8rem}.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.danger{margin-top:.9rem;padding:.85rem;border:1px solid color-mix(in srgb,var(--color-state-warning) 45%, var(--line));background:var(--operator-accent-soft)}
.danger label{display:flex!important;gap:.5rem;align-items:flex-start;margin:0}
.danger input{width:1rem;height:1rem;min-height:0;margin-top:.15rem}
.login{display:grid;min-height:calc(100vh - 3.5rem);place-items:center;padding:2rem}
.login-card{width:min(100%,28rem);padding:1.5rem}
.login-card h1{font-size:clamp(2rem,6vw,3rem)}
.banner{margin:0 0 1rem;padding:.75rem 1rem;border:1px solid color-mix(in srgb,var(--color-state-warning) 40%, var(--line));background:var(--operator-accent-soft);font-size:.84rem;color:var(--muted)}
code{color:var(--teal);font-family:var(--font-mono);font-size:.86em}
.list{margin:0;padding:0;list-style:none;display:grid;gap:.3rem}
.list li{display:flex;justify-content:space-between;gap:.75rem;padding:.5rem 0;border-bottom:1px solid rgba(42,51,66,.5);font-size:.8rem}
.awatch{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(16rem,.9fr);gap:1rem}
@media(max-width:900px){.awatch{grid-template-columns:1fr}}
.awatch-feed,.awatch-sites,.awatch-agents{margin:0;padding:0;list-style:none;display:grid;gap:.35rem;max-height:22rem;overflow:auto}
.awatch-agents{grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr));max-height:none;margin:.75rem 0 0}
.awatch-feed li,.awatch-sites li,.awatch-agents li{padding:.4rem 0;border-bottom:1px solid rgba(42,51,66,.45);font:.8rem/1.4 var(--font-mono)}
.awatch-agents li{padding:0;border-bottom:0}
.awatch-feed .meta,.awatch-sites .meta,.awatch-agents .meta{color:var(--faint);font-size:.72rem}
.awatch .glyph,.awatch-roster .glyph,.awatch-pick .glyph{display:inline-flex;width:1rem;height:1rem;margin-right:.35rem;vertical-align:-.12em}
.awatch .glyph svg,.awatch-roster .glyph svg,.awatch-pick .glyph svg{display:block;width:100%;height:100%}
.glyph-player{color:var(--color-state-social)}
.glyph-trade,.glyph-economy{color:var(--color-state-economic)}
.glyph-danger{color:var(--color-state-critical)}
.glyph-distress,.glyph-threshold{color:var(--color-state-warning)}
.glyph-rumor,.glyph-unknown{color:var(--color-state-unknown)}
.glyph-comms,.glyph-event,.glyph-loc{color:var(--color-state-active)}
.glyph-infra{color:var(--color-text-machine)}
.glyph-resource,.glyph-org{color:var(--color-text-secondary)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
.legend{margin:.75rem 0 0}
.legend summary{
  cursor:pointer;color:var(--muted);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.key-body{display:grid;gap:.4rem .85rem;margin:.55rem 0 0}
@media(min-width:720px){.key-body{grid-template-columns:1fr 1fr}}
.key-row{display:flex;gap:.55rem;align-items:flex-start;font-size:.8rem;color:var(--ink)}
.key-row .glyph{width:1.15rem;height:1.15rem}
.key-row strong{font-weight:600}
.awatch-toolbar{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;margin:.75rem 0 0}
.awatch-toolbar .kicker{margin:0 .35rem 0 0}
.awatch-toolbar .btn[aria-pressed="true"]{border-color:var(--color-state-active);color:var(--color-state-active)}
.awatch-roster{margin:.75rem 0 0}
.awatch-roster .kicker{margin:0 0 .4rem}
.awatch-pick{
  display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:center;
  width:100%;margin:0;padding:.35rem .45rem;border:1px solid var(--line);
  background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;
}
.awatch-pick[aria-pressed="true"]{border-color:var(--color-state-active);color:var(--color-state-active)}
.awatch-phos{position:relative;z-index:1}
.awatch-phos[hidden]{display:none}
.awatch-phos-bar{margin:0 0 .4rem;color:var(--faint);font:.75rem/1.2 var(--font-body);pointer-events:none}
.awatch-phosphor{
  display:block;width:100%;max-width:36rem;height:auto;aspect-ratio:16/9;
  position:relative;z-index:1;pointer-events:auto;
  background:var(--void);image-rendering:pixelated;image-rendering:crisp-edges;
  border:1px solid var(--line);cursor:pointer;
}
`;

function adminChrome(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#070a10"/><meta name="robots" content="noindex"/>
<title>${title} · NOEMA ADMIN</title>
${FONTS}<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#admin-main">Skip to operator content</a>
<header class="top">
  <div class="brand">OPERATOR<span>admin ≠ player · not PLAY</span></div>
  <nav class="nav" aria-label="Planes">
    <a href="/">Product</a>
    <a href="/connect">Connect</a>
    <a href="/admin" aria-current="page">Admin</a>
  </nav>
  <span class="tag warn">ADMIN</span>
</header>
${body}
</body>
</html>`;
}

/** Embedded operator email form for the product homepage (distinct ids from play email). */
export function adminEmailGateMarkup(): string {
  return `
<p class="muted">Operator plane. This is not a Player login. Links go to <code>zer0state@zer0state.com</code> only.</p>
<form id="op-login-form">
  <label for="op-email">Operator email</label>
  <input id="op-email" type="email" autocomplete="username" required readonly value="zer0state@zer0state.com"/>
  <button class="btn primary block" type="submit">Send login link</button>
</form>
<p class="notice" id="op-notice" role="status"></p>
<script>
(() => {
  const form = document.getElementById("op-login-form");
  const notice = document.getElementById("op-notice");
  const email = document.getElementById("op-email");
  if (!form || !notice || !email) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    notice.className = "notice";
    notice.textContent = "Requesting login link…";
    try {
      const res = await fetch("/v1/admin/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
      notice.className = "notice ok";
      notice.textContent = data.message;
    } catch (err) {
      notice.className = "notice bad";
      notice.textContent = err.message || "ADMIN unavailable";
    }
  });
})();
</script>`;
}

export function adminLoginHtml(): string {
  return adminChrome(
    "Admin login",
    `<main class="login" id="admin-main">
  <section class="card pad login-card" aria-labelledby="login-title">
    <p class="kicker">Operator access</p>
    <h1 id="login-title">Open the control plane.</h1>
    <p class="muted">ADMIN is not a player login. Agents inhabit. Humans watch. Admin is platform master. Admin privilege is never inherited by a player session.</p>
    <form id="login-form" style="margin-top:1.2rem">
      <label for="email">Email</label>
      <input id="email" type="email" autocomplete="username" required readonly value="zer0state@zer0state.com"/>
      <button class="btn primary" type="submit" style="width:100%;margin-top:.85rem">Send login link</button>
    </form>
    <p class="notice" id="notice" role="status"></p>
    <p class="empty" style="margin-top:1rem">A link is mailed only to <code>zer0state@zer0state.com</code>. Never put admin access in player sessions.</p>
  </section>
</main>
<script>
(() => {
  const form = document.getElementById("login-form");
  const notice = document.getElementById("notice");
  if (new URLSearchParams(location.search).get("error") === "1") {
    notice.className = "notice bad";
    notice.textContent = "That login link is expired or invalid. Request a new one.";
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    notice.className = "notice";
    notice.textContent = "Requesting login link…";
    try {
      const res = await fetch("/v1/admin/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: document.getElementById("email").value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
      notice.className = "notice ok";
      notice.textContent = data.message;
    } catch (err) {
      notice.className = "notice bad";
      notice.textContent = err.message || "ADMIN unavailable";
    }
  });
})();
</script>`,
  );
}

export function adminCallbackHtml(): string {
  return adminChrome(
    "Admin callback",
    `<main class="login" id="admin-main">
  <section class="card pad login-card" aria-labelledby="callback-title">
    <p class="kicker">Operator access</p>
    <h1 id="callback-title">Opening ADMIN…</h1>
    <p class="muted">Confirming the login link. ADMIN is not a player login.</p>
    <p class="notice" id="notice" role="status">Checking the link…</p>
  </section>
</main>
<script>
(() => {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const token_hash = search.get("token_hash") || hash.get("token_hash") || "";
  const type = search.get("type") || hash.get("type") || "";
  const code = search.get("code") || hash.get("code") || "";
  (async () => {
    try {
      const res = await fetch("/v1/admin/login/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_hash, type, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error("not authorized");
      sessionStorage.setItem("noema.admin.token", data.access_token);
      sessionStorage.setItem("noema.admin.session", data.session_id);
      location.href = "/admin";
    } catch (err) {
      location.href = "/admin/login?error=1";
    }
  })();
})();
</script>`,
  );
}

export function adminHtml(): string {
  return adminChrome(
    "Admin",
    `<div class="frame">
  <aside class="rail" aria-label="Admin sections">
    <strong>OPERATOR</strong>
    <p class="empty" style="margin:.35rem 0 0">management console</p>
    <nav class="rail-nav">
      <a class="active" href="#overview">Overview</a>
      <a href="#world">World</a>
      <a href="#genesis">Genesis</a>
      <a href="#digests">Digests</a>
      <a href="#players">Players</a>
      <a href="#agent-watch">Watch agents</a>
      <a href="#providers">Providers</a>
      <a href="#boundary">Boundaries</a>
    </nav>
    <div class="rail-foot"><strong style="color:var(--teal);font-size:.65rem">ADMIN ONLY</strong><br/>Platform master. Agents inhabit. Humans watch. Admin is never a Player.</div>
  </aside>
  <main class="main" id="admin-main">
    <header style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;align-items:end;padding-bottom:1rem;border-bottom:1px solid var(--line)">
      <div>
        <p class="kicker">ADMIN / operations</p>
        <h1>Keep the world legible.</h1>
        <p class="muted" style="margin:.35rem 0 0;max-width:52ch">Visibility and deliberate control. Graphical by design. Text-first rule remains inside PLAY.</p>
      </div>
      <div class="btn-row">
        <span class="tag" id="auth-tag">authorizing</span>
        <button class="btn quiet" type="button" id="refresh">Refresh</button>
        <button class="btn quiet" type="button" id="logout">Exit admin</button>
      </div>
    </header>
    <p class="notice" id="notice" role="status">Loading operator projection…</p>

    <section class="section" id="overview">
      <p class="kicker">01 / overview</p>
      <h2>Operating picture</h2>
      <div class="grid" style="margin-top:.75rem">
        <article class="metric teal s3"><span>Live players</span><strong id="m-players">—</strong><span id="m-player-note">present now · 30m</span></article>
        <article class="metric warn s3"><span>World</span><strong id="m-world">—</strong><span id="m-world-state">checking</span></article>
        <article class="metric s3"><span>Cycle</span><strong id="m-cycle">—</strong><span id="m-seq">sequence —</span></article>
        <article class="metric s3"><span>Rooms</span><strong id="m-rooms">—</strong><span>chamber sites</span></article>
        <article class="card pad s6">
          <p class="kicker">Runtime</p>
          <dl class="kv" id="kv-runtime"></dl>
        </article>
        <article class="card pad s6">
          <p class="kicker">Attention</p>
          <ul class="list" id="attention"><li><strong>Loading…</strong><span>—</span></li></ul>
        </article>
      </div>
    </section>

    <section class="section" id="world">
      <p class="kicker">02 / world</p>
      <h2>World management</h2>
      <p class="muted">Players never boot or seed worlds. Start / reseed remain operator actions.</p>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s7">
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;justify-content:space-between;align-items:start">
            <div><p class="kicker">Canonical live state</p><h2 id="world-title" style="font-size:1.2rem">—</h2></div>
            <span class="tag" id="world-tag">—</span>
          </div>
          <dl class="kv" id="kv-world" style="margin-top:.75rem"></dl>
          <p class="kicker" style="margin-top:1rem">Lifecycle</p>
          <p class="empty">Pause rejects mutating PLAY. Resume requires settlement not BLOCKING. Incident fail-closes mutation. Recover persists a live DO snapshot when the canonical head is missing, or restores from an existing head. Close incident returns ACTIVE without reseeding.</p>
          <label for="life-reason">Reason (optional)</label>
          <input id="life-reason" maxlength="200" autocomplete="off" placeholder="maintenance window"/>
          <div class="btn-row" style="margin-top:.7rem">
            <button class="btn" type="button" id="life-pause">Pause</button>
            <button class="btn" type="button" id="life-resume">Resume</button>
          </div>
          <div class="danger" style="margin-top:.75rem">
            <label><input type="checkbox" id="life-incident-confirm"/><span>I understand Declare incident fail-closes mutating PLAY until recovery.</span></label>
            <button class="btn danger" type="button" id="life-incident" disabled style="margin-top:.7rem">Declare incident</button>
          </div>
          <div class="danger" style="margin-top:.75rem">
            <label><input type="checkbox" id="life-close-confirm"/><span>I understand Close incident returns ACTIVE without reseeding or a new Genesis.</span></label>
            <button class="btn" type="button" id="life-close" disabled style="margin-top:.7rem">Close incident</button>
          </div>
          <div class="danger" style="margin-top:.75rem">
            <label><input type="checkbox" id="life-recover-confirm"/><span>I understand Recover persists the live Durable Object snapshot as the first canonical head when none exists, or restores from an existing head. It does not reseed Genesis or invent ledger history.</span></label>
            <button class="btn" type="button" id="life-recover" disabled style="margin-top:.7rem">Recover world</button>
          </div>
          <p class="notice" id="life-notice" role="status"></p>
        </article>
        <article class="card pad s5" id="reseed-card">
          <p class="kicker">Consequential</p>
          <h2 style="font-size:1.1rem">Reseed Stage 0 Chamber</h2>
          <p class="muted">Restores the fixed chamber seed. Clears live player positions in this Durable Object. Not a full Genesis profile run.</p>
          <div class="danger">
            <label><input type="checkbox" id="reseed-confirm"/><span>I understand reseed resets live Stage 0 world state in this DO.</span></label>
            <button class="btn danger" type="button" id="reseed" disabled style="margin-top:.7rem">Reseed chamber</button>
          </div>
          <p class="notice" id="reseed-notice" role="status"></p>
        </article>
      </div>
    </section>

    <section class="section" id="digests">
      <p class="kicker">02b / operator digests</p>
      <h2>Gameplay summaries</h2>
      <p class="muted">Settled activity only. Not alerts. Not world truth. Incidents are controlled under World. Email is optional and off by default.</p>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s5">
          <p class="kicker">Configuration</p>
          <label for="d-cadence">Cadence</label>
          <select id="d-cadence">
            <option value="OFF">OFF</option>
            <option value="PT15M">15 minutes</option>
            <option value="PT30M" selected>30 minutes</option>
            <option value="PT1H">1 hour</option>
            <option value="PT5H">5 hours</option>
            <option value="PT10H">10 hours</option>
            <option value="PT24H">24 hours</option>
          </select>
          <label for="d-depth">Depth</label>
          <select id="d-depth">
            <option>BRIEF</option>
            <option selected>STANDARD</option>
            <option>DETAILED</option>
          </select>
          <label style="display:flex;gap:.45rem;align-items:center;margin-top:.7rem"><input type="checkbox" id="d-enabled" checked/> Enabled</label>
          <label style="display:flex;gap:.45rem;align-items:center"><input type="checkbox" id="d-ctrl"/> Controller breakdown (metadata)</label>
          <div class="btn-row" style="margin-top:.85rem">
            <button class="btn primary" type="button" id="d-save">Save</button>
            <button class="btn quiet" type="button" id="d-tick">Generate due windows</button>
          </div>
          <p class="notice" id="d-notice" role="status"></p>
        </article>
        <article class="card pad s7">
          <p class="kicker">Latest digest</p>
          <pre id="d-latest" class="empty" style="white-space:pre-wrap;font:0.78rem/1.45 var(--font-mono);margin:0">No digest yet.</pre>
        </article>
      </div>
    </section>

    <section class="section" id="genesis">
      <p class="kicker">03 / genesis</p>
      <h2>Create a world deliberately</h2>
      <div class="banner">
        <strong style="color:var(--ink)">Specs GENESIS:</strong> admin-only, one-time create-world.
        PLAY never shows this UI. After activation, configuration freezes.
      </div>
      <div id="genesis-active-banner" class="banner" hidden style="border-color:rgba(107,155,143,.5)">
        <strong style="color:var(--teal)">WORLD ACTIVE</strong>
        <span id="genesis-active-copy"></span>
      </div>
      <div class="grid" id="genesis-editor">
        <article class="card pad s6">
          <p class="kicker">Configuration</p>
          <form id="genesis-form">
            <label for="g-name">World name</label>
            <input id="g-name" value="Perihelion Reach" autocomplete="off"/>
            <p class="empty" style="margin:.25rem 0 .5rem">Theme: space-western / cyberpunk frontier (vocabulary only — not final lore)</p>
            <label for="g-profile">Genesis profile</label>
            <select id="g-profile">
              <option value="FRACTURED_OLD_WORLD" selected>FRACTURED_OLD_WORLD — Fractured Old World</option>
              <option value="YOUNG_FRONTIER">YOUNG_FRONTIER — Young Frontier</option>
              <option value="RECOVERING_NETWORK">RECOVERING_NETWORK — Recovering Network</option>
            </select>
            <label>Story seeds (≤2)</label>
            <div id="g-seeds" style="display:grid;gap:.35rem;margin:.4rem 0">
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="OLD_TRADE_NETWORK" checked/> OLD_TRADE_NETWORK</label>
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="LOST_ARCHIVE" checked/> LOST_ARCHIVE</label>
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="FOUNDING_SPLIT"/> FOUNDING_SPLIT</label>
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="FAILED_SETTLEMENT"/> FAILED_SETTLEMENT</label>
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="RESOURCE_CRISIS"/> RESOURCE_CRISIS</label>
              <label style="display:flex;gap:.45rem;align-items:center;margin:0"><input type="checkbox" value="DISPUTED_SUCCESSION"/> DISPUTED_SUCCESSION</label>
            </div>
            <label for="g-seed">World seed</label>
            <div class="btn-row" style="margin-top:.25rem">
              <input id="g-seed" value="17011984" style="flex:1"/>
              <button class="btn quiet" type="button" id="g-rand">Randomize</button>
            </div>
            <div class="btn-row" style="margin-top:.85rem">
              <button class="btn primary" type="submit" id="g-preview">Preview</button>
              <button class="btn quiet" type="button" id="g-clear">Clear preview</button>
            </div>
          </form>
          <p class="notice" id="g-notice" role="status"></p>
          <dl class="kv" id="kv-genesis" style="margin-top:.85rem"></dl>
        </article>
        <article class="card pad s6">
          <p class="kicker">Cycle 0 / preview</p>
          <h2 style="font-size:1.15rem" id="g-preview-title">No preview loaded</h2>
          <div class="btn-row" style="margin:.4rem 0"><span class="tag" id="g-preview-status">waiting</span><span class="tag" id="g-det">determinism —</span><span class="tag" id="g-val">validation —</span></div>
          <div id="g-preview-body" class="empty">Preview data appears after PREVIEW.</div>
          <div class="danger" id="g-activation" hidden>
            <p><strong>ACTIVATE WORLD?</strong> After activation Genesis configuration becomes immutable. Players may enter. This world cannot be reseeded.</p>
            <label><input type="checkbox" id="g-confirm"/><span>I understand activation is consequential and configuration freezes.</span></label>
            <button class="btn primary" type="button" id="g-activate" disabled style="margin-top:.7rem">Activate world</button>
          </div>
        </article>
      </div>
    </section>

    <section class="section" id="players">
      <p class="kicker">04 / players</p>
      <h2>Players and connections</h2>
      <p class="muted">Agents inhabit. Humans watch. This split is operational: live login presence vs operator-minted / agent / smoke actors. Present now means a command in the last 30 minutes.</p>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s6">
          <p class="kicker">Live players</p>
          <strong style="font:550 2rem var(--font-display)" id="live-count">—</strong>
          <p class="empty">Present now · play-link humans</p>
          <ul class="list" id="live-player-list"><li class="empty">No live Players.</li></ul>
        </article>
        <article class="card pad s6">
          <p class="kicker">System actors</p>
          <strong style="font:550 2rem var(--font-display)" id="system-count">—</strong>
          <p class="empty">Operator-minted · agent · smoke</p>
          <ul class="list" id="system-actor-list"><li class="empty">No system actors on record.</li></ul>
        </article>
        <article class="card pad s12">
          <p class="kicker">Issue controller token</p>
          <p class="muted" style="margin-top:.35rem">Mints an agent inhabit token (not ADMIN). Copy the inhabit snippet. Does not re-enable public dev-token. Human login is email magic-link, not this mint.</p>
          <div class="grid" style="margin-top:.5rem">
            <div class="s4">
              <label for="tok-handle">Handle</label>
              <input id="tok-handle" maxlength="32" placeholder="alice" autocomplete="off"/>
            </div>
            <div class="s4">
              <label for="tok-ctype">Controller</label>
              <select id="tok-ctype">
                <option value="agent" selected>agent (inhabit)</option>
                <option value="human">human (identity only)</option>
              </select>
            </div>
            <div class="s4">
              <label for="tok-ttl">Expires (hours)</label>
              <input id="tok-ttl" type="number" min="1" max="168" value="24"/>
            </div>
          </div>
          <div class="btn-row" style="margin-top:.75rem">
            <button type="button" class="btn primary" id="tok-mint">Mint controller token</button>
            <button type="button" class="btn quiet" id="tok-copy" disabled>Copy token</button>
          </div>
          <p class="notice" id="tok-notice" role="status"></p>
          <pre class="empty" id="tok-out" style="margin-top:.6rem;padding:.75rem;border:1px solid var(--line);background:#0a1016;white-space:pre-wrap;word-break:break-all;font:.72rem/1.45 var(--font-mono);max-height:12rem;overflow:auto"># token appears here</pre>
        </article>
        <article class="card pad s12">
          <p class="kicker">Agent bootstrap email</p>
          <p class="muted" style="margin-top:.35rem">Sends a review link only. The letter does not contain a token. Opening the link does not approve enrollment.</p>
          <div class="grid" style="margin-top:.5rem">
            <div class="s6">
              <label for="enroll-handle">Handle</label>
              <input id="enroll-handle" maxlength="32" placeholder="hermes" autocomplete="off"/>
            </div>
            <div class="s6">
              <label for="enroll-email">Notify</label>
              <input id="enroll-email" type="email" placeholder="operator@example.com" autocomplete="off"/>
            </div>
          </div>
          <div class="btn-row" style="margin-top:.75rem">
            <button type="button" class="btn" id="enroll-send">Send enrollment letter</button>
          </div>
          <p class="notice" id="enroll-notice" role="status"></p>
        </article>
      </div>
    </section>

    <section class="section" id="agent-watch">
      <p class="kicker">04b / watch agents</p>
      <h2>Watch agents play</h2>
      <p class="muted">Live LOOK / MOVE / action lines for agents you minted or enrolled, plus the public site map. Same glyphs as PLAY and public WATCH. PIXEL is the same catalog sketch as public WATCH, with this operator's occupancy. Click an agent, a site, or a PIXEL room mark to follow live text and light that room. Other operators' agents stay off this surface. Private MESSAGE bodies stay off this surface.</p>
      ${legendHtml()}
      <div class="awatch-toolbar">
        <span class="kicker">Sketch</span>
        <button type="button" class="btn" id="awatch-mode-text" aria-pressed="true">TEXT</button>
        <button type="button" class="btn" id="awatch-mode-pixel" aria-pressed="false">PIXEL</button>
        <button type="button" class="btn" id="awatch-follow-all" aria-pressed="true">All agents</button>
      </div>
      <div class="awatch-roster">
        <p class="kicker">Agents</p>
        <ul class="awatch-agents" id="awatch-agents"><li class="empty">No agents on this operator yet.</li></ul>
      </div>
      <div class="awatch-phos" id="awatch-phos-wrap" hidden>
        <div class="awatch-phos-bar" id="awatch-phos-bar">Operator sketch — not the world. Your agents only.</div>
        <canvas class="awatch-phosphor" id="awatch-phosphor" width="320" height="180" role="img" aria-label="Operator topology sketch. Click a site to follow."></canvas>
      </div>
      <div class="awatch" style="margin-top:.75rem">
        <article class="card pad">
          <p class="kicker">Sites</p>
          <ul class="awatch-sites" id="awatch-sites"><li class="empty">No public sites.</li></ul>
        </article>
        <article class="card pad">
          <p class="kicker">Live text</p>
          <ul class="awatch-feed" id="awatch-feed"><li class="empty">No agent lines yet.</li></ul>
        </article>
      </div>
    </section>

    <section class="section" id="providers">
      <p class="kicker">05 / providers</p>
      <h2>Deployment providers</h2>
      <p class="muted">Redacted readiness only. Provider credentials remain server-side and are never returned to this page.</p>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s4">
          <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:start">
            <div><p class="kicker">Canonical settlement</p><h2 style="font-size:1.1rem">Supabase</h2></div>
            <span class="tag" id="provider-supabase-tag">checking</span>
          </div>
          <p class="muted" id="provider-supabase-message">Verifying fixed canonical head checks…</p>
          <dl class="kv" id="provider-supabase-details"></dl>
          <button class="btn quiet" type="button" id="provider-supabase-verify" style="margin-top:.75rem">Verify Supabase</button>
        </article>
        <article class="card pad s4">
          <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:start">
            <div><p class="kicker">Transactional mail · primary</p><h2 style="font-size:1.1rem">Resend</h2></div>
            <span class="tag" id="provider-resend-tag">checking</span>
          </div>
          <p class="muted" id="provider-resend-message">Verifying API key and noema.guru domain…</p>
          <dl class="kv" id="provider-resend-details"></dl>
          <button class="btn quiet" type="button" id="provider-resend-verify" style="margin-top:.75rem">Verify Resend</button>
        </article>
        <article class="card pad s12">
          <p class="kicker">Break-glass boundary</p>
          <p class="empty">Secret values, arbitrary SQL, unrestricted recipients, and credential rotation are intentionally unavailable to browser code. Configure management credentials as Worker secrets before enabling reviewed break-glass operations.</p>
          <dl class="kv" id="provider-capabilities"></dl>
        </article>
      </div>
      <p class="notice" id="provider-notice" role="status"></p>
    </section>

    <section class="section" id="boundary">
      <p class="kicker">06 / boundaries</p>
      <h2>What this plane is not</h2>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s6">
          <p class="kicker">Product surfaces</p>
          <ul class="list">
            <li><strong>PLAY</strong><span>Player inhabit</span></li>
            <li><strong>WATCH</strong><span>Spectator projection</span></li>
            <li><strong>STUDY</strong><span>Researcher evidence</span></li>
            <li><strong>CONNECT</strong><span>Controller enrollment</span></li>
          </ul>
        </article>
        <article class="card pad s6">
          <p class="kicker">Not exposed in browser</p>
          <ul class="list">
            <li><strong>Backup / restore</strong><span>CLI</span></li>
            <li><strong>Evidence keyring</strong><span>server-side only</span></li>
            <li><strong>Service-role secrets</strong><span>never to clients</span></li>
            <li><strong>Player→Admin promote</strong><span>forbidden</span></li>
          </ul>
        </article>
      </div>
    </section>
  </main>
</div>
<script>
(() => {
  const GLYPHS = ${JSON.stringify(glyphCatalog())};
  const followOperatorWatch = ${followOperatorWatch.toString()};
  const phosphorSnapshotFromOperatorWatch = ${phosphorSnapshotFromOperatorWatch.toString()};
  const token = sessionStorage.getItem("noema.admin.token");
  if (!token) {
    if (location.hash) sessionStorage.setItem("noema.admin.next", location.hash);
    location.href = "/admin/login";
    return;
  }

  const $ = (id) => document.getElementById(id);
  ${agentInhabitSnippetJs()}
  const notice = (msg, kind="") => { const el=$("notice"); el.textContent=msg||""; el.className="notice"+(kind?" "+kind:""); };

  function glyphNode(id) {
    const m = GLYPHS[id] || GLYPHS.unknown;
    const wrap = document.createElement("span");
    wrap.className = "glyph glyph-" + (id || "unknown");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", m.label);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", m.d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.4");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    svg.append(path);
    wrap.append(svg);
    return wrap;
  }

  async function api(path, opts={}) {
    const headers = Object.assign({ "content-type": "application/json", Authorization: "Bearer " + token }, opts.headers||{});
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data.error && data.error.message) || res.statusText);
      err.status = res.status;
      err.code = data.error && data.error.code;
      throw err;
    }
    return data;
  }

  function kv(root, rows) {
    root.replaceChildren();
    rows.forEach(([k,v]) => {
      const dt=document.createElement("dt"), dd=document.createElement("dd");
      dt.textContent=k; dd.textContent=v==null||v===""?"—":String(v);
      root.append(dt, dd);
    });
  }

  function renderProvider(name, status) {
    const tag = $("provider-" + name + "-tag");
    const message = $("provider-" + name + "-message");
    tag.textContent = status.healthy === true ? "READY" : status.configured ? "CHECK" : "MISSING";
    tag.className = "tag " + (status.healthy === true ? "ok" : "bad");
    message.textContent = status.message || "No provider result.";
    kv($("provider-" + name + "-details"), Object.entries(status.details || {}));
  }

  async function loadProviders() {
    const data = await api("/v1/admin/providers");
    renderProvider("supabase", data.providers.supabase);
    renderProvider("resend", data.providers.resend);
    const c = data.configuration || {};
    const caps = c.capabilities || {};
    kv($("provider-capabilities"), [
      ["Ready for deploy", data.ready_for_deploy ? "yes" : "no"],
      ["Supabase management token", c.supabase && c.supabase.management_token ? "configured" : "missing"],
      ["Resend API key", c.resend && c.resend.api_key ? "configured" : "missing"],
      ["Controlled mail test", caps.send_controlled_test ? "available" : "unavailable"],
      ["Credential rotation", caps.rotate_credentials ? "available" : "disabled"],
      ["Secrets exposed", data.secrets_exposed ? "ERROR" : "no"],
    ]);
  }

  let lastPreview = null;

  function selectedSeeds() {
    return [...document.querySelectorAll("#g-seeds input:checked")].map(i => i.value).slice(0, 2);
  }

  function p(className, style) {
    const n = document.createElement("p");
    if (className) n.className = className;
    if (style) n.setAttribute("style", style);
    return n;
  }
  function strong(text) {
    const n = document.createElement("strong");
    n.textContent = text;
    return n;
  }
  function bullets(items) {
    const frag = document.createDocumentFragment();
    items.forEach((t, i) => {
      if (i) frag.append(document.createElement("br"));
      frag.append("• " + t);
    });
    return frag;
  }

  function renderPreview(result, meta) {
    lastPreview = result;
    $("g-preview-title").textContent = (result.world_name || "World") + " · " + result.genesis_profile_id;
    $("g-preview-status").textContent = result.status || "PREVIEW";
    $("g-preview-status").className = "tag " + (result.validation && result.validation.ok ? "ok" : "warn");
    $("g-val").textContent = result.validation && result.validation.ok ? "validation PASS" : "validation FAIL";
    $("g-val").className = "tag " + (result.validation && result.validation.ok ? "ok" : "bad");
    if (meta && meta.determinism) {
      $("g-det").textContent = meta.determinism.ok ? "determinism PASS" : "determinism FAIL";
      $("g-det").className = "tag " + (meta.determinism.ok ? "ok" : "bad");
    }
    const s = result.preview_summary || {};
    const th = result.theme || {};
    const body = $("g-preview-body");
    body.replaceChildren();
    const kicker = p("kicker");
    kicker.textContent = (result.world_name || "World").toUpperCase() + " — PREVIEW";
    body.append(kicker);
    if (th.character) {
      const row = p("muted");
      row.append(strong("Character"), document.createElement("br"), th.character);
      body.append(row);
    }
    const profile = p("muted");
    profile.append(
      strong("Profile"),
      " " + (result.genesis_profile_id || "") + " · ",
      strong("Seeds"),
      " " + (result.story_seed_ids||[]).join(", "),
    );
    body.append(profile);
    const structure = p("muted");
    const bits = [
      (s.room_count||0) + " primary sites",
      ((s.active_institutions||[]).length) + " active institution(s)",
      ((s.dormant_institutions||[]).length) + " dormant lineage(s)",
    ];
    if (s.functioning_exchange) bits.push("1 functioning exchange");
    if (s.damaged_relay) bits.push("damaged infrastructure present");
    if (s.archive_mystery) bits.push("archive / data mystery");
    structure.append(strong("Starting structure"), document.createElement("br"), bullets(bits));
    body.append(structure);
    if (s.regions) {
      const row = p("empty");
      row.textContent = s.regions.map(r => r.name).join(" · ");
      body.append(row);
    }
    if (s.tensions && s.tensions.length) {
      const row = p("muted");
      row.append(strong("Pressures"), document.createElement("br"), bullets(s.tensions));
      body.append(row);
    }
    if (s.ruins_scars && s.ruins_scars.length) {
      const row = p("muted");
      row.append(strong("Historical traces"), document.createElement("br"), bullets(s.ruins_scars));
      body.append(row);
    }
    if (s.opportunities) {
      const row = p("muted");
      row.append(strong("Opportunities"), document.createElement("br"), s.opportunities.join(" · "));
      body.append(row);
    }
    if (th.lore_boundary) {
      const row = p("empty");
      row.setAttribute("style", "margin-top:.5rem");
      row.textContent = th.lore_boundary;
      body.append(row);
    }
    const ids = p("empty mono");
    ids.setAttribute("style", "margin-top:.6rem;font-size:.72rem");
    ids.append("genesis_id " + (result.genesis_id || ""), document.createElement("br"), "cycle0_digest " + (result.cycle0_digest || ""));
    body.append(ids);
    if (result.validation && !result.validation.ok) {
      const row = p("notice bad");
      row.textContent = "Blocked: " + (result.validation.errors||[]).join("; ");
      body.append(row);
    }
    const canAct = result.validation && result.validation.ok && meta && meta.determinism && meta.determinism.ok;
    $("g-activation").hidden = !canAct;
    $("g-confirm").checked = false;
    $("g-activate").disabled = true;
  }

  let watchFollow = { handle: "", room_id: "" };

  function syncFollowAll() {
    const allBtn = $("awatch-follow-all");
    if (!allBtn) return;
    allBtn.setAttribute("aria-pressed", (!watchFollow.handle && !watchFollow.room_id) ? "true" : "false");
  }

  function setWatchFollow(next) {
    const handle = String((next && next.handle) || "");
    const roomId = String((next && next.room_id) || "");
    if (watchFollow.handle === handle && watchFollow.room_id === roomId) {
      watchFollow = { handle: "", room_id: "" };
    } else {
      watchFollow = { handle, room_id: roomId };
    }
    syncFollowAll();
    return loadAgentWatch();
  }
  window.NoemaAdminPhosphorPick = function(roomId) {
    const id = String(roomId || "");
    if (!id) return;
    Promise.resolve(setWatchFollow({ handle: "", room_id: id })).then(() => {
      const site = document.querySelector('#awatch-sites .awatch-pick[aria-pressed="true"]');
      if (site && site.scrollIntoView) site.scrollIntoView({ block: "nearest" });
    }).catch(() => undefined);
  };

  async function loadAgentWatch() {
    const agentsEl = $("awatch-agents");
    const sitesEl = $("awatch-sites");
    const feedEl = $("awatch-feed");
    if (!sitesEl || !feedEl) return;
    const data = await api("/v1/admin/watch");
    const focused = followOperatorWatch(data, watchFollow);
    const followHandle = String(watchFollow.handle || "");
    const followRoom = String(focused.focus_room_id || watchFollow.room_id || "");
    if (agentsEl) {
      const agents = data.agents || [];
      agentsEl.replaceChildren();
      if (!agents.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No agents on this operator yet. Mint or enroll an agent.";
        agentsEl.append(li);
      } else {
        agents.forEach((a) => {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "awatch-pick";
          btn.setAttribute("aria-pressed", a.handle === followHandle ? "true" : "false");
          btn.append(glyphNode(a.glyph || "player"), document.createTextNode(a.handle || "agent"));
          const meta = document.createElement("div");
          meta.className = "meta";
          meta.textContent = a.present && a.room_name ? a.room_name : (a.present ? "present" : "not in a public site");
          btn.append(meta);
          btn.addEventListener("click", () => { setWatchFollow({ handle: a.handle || "", room_id: "" }); });
          li.append(btn);
          agentsEl.append(li);
        });
      }
    }
    const sites = focused.sites || [];
    sitesEl.replaceChildren();
    if (!sites.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No public sites.";
      sitesEl.append(li);
    } else {
      sites.forEach((r) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "awatch-pick";
        btn.setAttribute("aria-pressed", r.room_id === followRoom ? "true" : "false");
        const row = document.createElement("span");
        row.append(glyphNode(r.glyph || "loc"), document.createTextNode(r.name || r.room_id || "site"));
        if (r.players_present > 0) {
          const n = document.createElement("span");
          n.className = "meta";
          n.append(glyphNode("player"), document.createTextNode(" " + String(r.players_present)));
          row.append(n);
        }
        btn.append(row);
        const exits = Array.isArray(r.exits) ? r.exits : [];
        if (exits.length) {
          const meta = document.createElement("div");
          meta.className = "meta";
          meta.textContent = exits.map((x) => (x.direction || "") + " → " + (x.to_room_name || "")).join(" · ");
          btn.append(meta);
        }
        const roomName = String(r.name || "").trim().toLowerCase();
        const roomId = String(r.room_id || "").trim().toLowerCase();
        const slug = roomId.replace(/^room\./, "");
        const labels = (Array.isArray(r.player_labels) ? r.player_labels : [])
          .map((h) => String(h || "").trim())
          .filter((h) => {
            const n = h.toLowerCase();
            return h && !n.startsWith("room.") && n !== roomName && n !== roomId && n !== slug;
          });
        if (labels.length) {
          const meta = document.createElement("div");
          meta.className = "meta";
          meta.textContent = labels.join(", ");
          btn.append(meta);
        }
        btn.addEventListener("click", () => { setWatchFollow({ handle: "", room_id: r.room_id || "" }); });
        li.append(btn);
        sitesEl.append(li);
      });
    }
    const lines = focused.lines || [];
    feedEl.replaceChildren();
    if (!lines.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = followHandle || watchFollow.room_id
        ? "No lines for this follow yet."
        : "No agent lines yet. Connected agents appear here as they LOOK and MOVE.";
      feedEl.append(li);
    } else {
      lines.forEach((row) => {
        const li = document.createElement("li");
        const head = document.createElement("div");
        head.append(glyphNode(row.glyph || "event"));
        const who = document.createElement("strong");
        who.textContent = row.handle || "agent";
        head.append(who, document.createTextNode("  " + (row.command || "")));
        li.append(head);
        const line = document.createElement("div");
        line.textContent = row.line || "";
        li.append(line);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = [row.room_name, row.command].filter(Boolean).join(" · ");
        li.append(meta);
        feedEl.append(li);
      });
    }
    const bar = $("awatch-phos-bar");
    if (bar) {
      bar.textContent = followHandle
        ? ("Following " + followHandle + " — not the world.")
        : (watchFollow.room_id
          ? "Following this site — not the world. Your agents only."
          : "Operator sketch — not the world. Your agents only.");
    }
    syncFollowAll();
    try {
      if (window.NoemaAdminPhosphor) {
        window.NoemaAdminPhosphor.update(phosphorSnapshotFromOperatorWatch(Object.assign({}, data, { follow: watchFollow })));
      }
    } catch (e) {}
  }

  function showAgentWatch(handle) {
    if (handle) watchFollow = { handle: String(handle), room_id: "" };
    location.hash = "#agent-watch";
    document.querySelectorAll(".rail-nav a").forEach((x) => {
      x.classList.toggle("active", x.getAttribute("href") === "#agent-watch");
    });
    const target = document.querySelector("#agent-watch");
    if (target) target.scrollIntoView({ block: "start" });
    return loadAgentWatch();
  }

  async function load() {
    $("auth-tag").textContent = "ADMIN";
    $("auth-tag").className = "tag ok";
    notice("Refreshing operator projection…");
    try {
      const data = await api("/v1/admin/overview");
      const w = data.world || {};
      const h = data.health || {};
      const g = data.genesis || {};
      $("m-players").textContent = (w.live_players || []).length || w.players_present || 0;
      $("m-world").textContent = w.world_id || "—";
      $("m-world-state").textContent = g.status || "—";
      $("m-cycle").textContent = w.cycle ?? "—";
      $("m-seq").textContent = "sequence " + (w.sequence ?? "—");
      $("m-rooms").textContent = w.room_count ?? "—";
      $("world-title").textContent = (w.world_name || w.world_id || "World");
      $("world-tag").textContent = g.status === "ACTIVE" ? "ACTIVE" : (g.status || "ONLINE");
      $("world-tag").className = "tag " + (g.status === "ACTIVE" ? "ok" : "warn");
      const live = w.live_players || [];
      const system = w.system_actors || [];
      const liveEl = $("live-count");
      const sysEl = $("system-count");
      if (liveEl) liveEl.textContent = String(live.length);
      if (sysEl) sysEl.textContent = String(system.length);

      kv($("kv-runtime"), [
        ["Health", h.status],
        ["Env", h.env],
        ["Admin plane", data.admin_plane],
        ["Protocol", h.protocol_version],
      ]);
      kv($("kv-world"), [
        ["World id", w.world_id],
        ["Name", w.world_name],
        ["Status", g.status],
        ["Settlement health", w.settlement_health || g.settlement_health || "—"],
        ["Cycle", w.cycle],
        ["Tempo policy", (w.player_tempo && w.player_tempo.policy_version) || "RFC-0019"],
        ["Tempo mode", (w.player_tempo && w.player_tempo.mode) || "—"],
        ["Tempo phase", (w.player_tempo && w.player_tempo.phase) || "—"],
        ["Tempo deadline", (w.player_tempo && w.player_tempo.step_required)
          ? "step required"
          : (w.player_tempo && w.player_tempo.collect_deadline_ms) || "—"],
        ["Tempo slots", w.player_tempo
          ? (w.player_tempo.accepted_slot_count + " / " + w.player_tempo.active_participant_count)
          : "—"],
        ["Presentation hold ms", (w.player_tempo && w.player_tempo.presentation_hold_remaining_ms) || 0],
        ["Sequence", w.sequence],
        ["Head present", data.canonical_head && data.canonical_head.head_present ? "yes" : "no"],
        ["Head sequence", data.canonical_head ? data.canonical_head.head_sequence : "—"],
        ["Head revision", data.canonical_head ? data.canonical_head.head_revision : "—"],
        ["DO revision", data.canonical_head ? data.canonical_head.do_revision : "—"],
        ["Live players", (w.live_players || []).length],
        ["System actors", (w.system_actors || []).length],
        ["Rooms", w.room_count],
        ["Entities", w.entity_count],
        ["Entry", w.entry_room_id],
      ]);
      const lifePause = $("life-pause");
      const lifeResume = $("life-resume");
      if (lifePause) lifePause.disabled = g.status !== "ACTIVE";
      if (lifeResume) lifeResume.disabled = g.status !== "PAUSED";
      const reseedCard = $("reseed-card");
      if (reseedCard) {
        reseedCard.hidden = h.env === "production";
      }
      kv($("kv-genesis"), [
        ["Status", g.status],
        ["Genesis ID", g.genesis_id],
        ["Profile", g.profile_id],
        ["Story seeds", (g.story_seed_ids||[]).join(", ") || "—"],
        ["World seed", g.world_seed],
        ["Cycle 0 digest", g.cycle0_digest],
        ["Frozen", g.config_frozen === true ? "yes" : "no"],
        ["Settlement", g.settlement_ok === true ? "ok" : g.settlement_ok === false ? "soft-fail" : "—"],
        ["Settlement ID", g.settlement_id],
        ["Activated", g.activated_at],
      ]);

      const active = g.status === "ACTIVE" && g.config_frozen;
      $("genesis-active-banner").hidden = !active;
      $("genesis-editor").style.opacity = active ? "0.55" : "1";
      if (active) $("genesis-editor").setAttribute("inert", "");
      else $("genesis-editor").removeAttribute("inert");
      if (active) {
        $("genesis-active-copy").textContent =
          " Genesis " + (g.genesis_id||"") + " · digest " + (g.cycle0_digest||"") +
          " · Live DO healthy · Settlement " + (g.settlement_ok ? "ok" : "check SUPABASE");
      }

      const att = $("attention");
      att.replaceChildren();
      const pairLi = (strongText, spanText, className) => {
        const li = document.createElement("li");
        if (className) li.className = className;
        const strong = document.createElement("strong");
        strong.textContent = strongText || "";
        const span = document.createElement("span");
        span.textContent = spanText || "";
        li.append(strong, span);
        return li;
      };
      const msgs = data.attention || [];
      if (!msgs.length) {
        att.append(pairLi("No operator attention required.", "clear"));
      } else {
        msgs.forEach(m => att.append(pairLi(m.message, m.level)));
      }

      const fillActors = (elId, rows, empty) => {
        const el = $(elId);
        if (!el) return;
        el.replaceChildren();
        if (!rows.length) {
          el.append(pairLi(empty, "", "empty"));
          return;
        }
        rows.forEach((row) => {
          const label = row.handle || row.player_id;
          const note = row.entered ? "present" : "idle";
          el.append(pairLi(label, note));
        });
      };
      fillActors("live-player-list", live, "No live Players.");
      fillActors("system-actor-list", system, "No system actors on record.");
      await loadAgentWatch();
      try {
        const dg = await api("/v1/admin/digests");
        const cfg = dg.config || {};
        $("d-enabled").checked = cfg.enabled !== false;
        if (cfg.cadence) $("d-cadence").value = cfg.cadence;
        if (cfg.depth) $("d-depth").value = cfg.depth;
        $("d-ctrl").checked = !!cfg.include_controller_breakdown;
        const latest = (dg.digests || [])[0];
        $("d-latest").textContent = latest ? latest.text : "No digest yet.";
      } catch (_) { /* digest surface optional if DO old */ }
      try { await loadProviders(); } catch (e) {
        $("provider-notice").textContent = e.message || "Provider status unavailable";
        $("provider-notice").className = "notice bad";
      }

      notice("Operator projection updated.", "ok");
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        sessionStorage.removeItem("noema.admin.token");
        location.href = "/admin/login";
        return;
      }
      $("auth-tag").textContent = "ERROR";
      $("auth-tag").className = "tag bad";
      notice(e.message || "Admin projection unavailable", "bad");
    }
  }

  async function verifyProvider(provider) {
    const n = $("provider-notice");
    n.className = "notice";
    n.textContent = "Verifying " + provider + "…";
    try {
      const status = await api("/v1/admin/providers/verify", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      renderProvider(provider, status);
      n.textContent = status.message;
      n.className = "notice " + (status.healthy ? "ok" : "bad");
    } catch (e) {
      n.textContent = e.message || "Provider verification failed";
      n.className = "notice bad";
    }
  }
  $("provider-supabase-verify").addEventListener("click", () => verifyProvider("supabase"));
  $("provider-resend-verify").addEventListener("click", () => verifyProvider("resend"));

  $("life-incident-confirm").addEventListener("change", (e) => {
    $("life-incident").disabled = !e.target.checked;
  });
  $("life-close-confirm").addEventListener("change", (e) => {
    $("life-close").disabled = !e.target.checked;
  });
  $("life-recover-confirm").addEventListener("change", (e) => {
    $("life-recover").disabled = !e.target.checked;
  });
  async function lifecycle(action) {
    const n = $("life-notice");
    n.className = "notice";
    n.textContent = action === "incident" ? "Declaring incident…" : action === "recover" ? "Recovering world…" : action === "close" ? "Closing incident…" : action === "pause" ? "Pausing…" : "Resuming…";
    try {
      const r = await api("/v1/admin/lifecycle", {
        method: "POST",
        body: JSON.stringify({ action, reason: $("life-reason").value || undefined }),
      });
      n.className = "notice ok";
      n.textContent = r.recover_mode === "adopt"
        ? "Live world snapshot is now the canonical head. World is ACTIVE."
        : "World is now " + (r.status || action) + ".";
      $("life-incident-confirm").checked = false;
      $("life-incident").disabled = true;
      $("life-close-confirm").checked = false;
      $("life-close").disabled = true;
      $("life-recover-confirm").checked = false;
      $("life-recover").disabled = true;
      await load();
    } catch (e) {
      n.className = "notice bad";
      n.textContent = e.code === "RECOVERY_REQUIRED" && /resume|close/i.test(action)
        ? "Settlement must recover before resume or close (RECOVERY_REQUIRED)."
        : (e.message || "Lifecycle change failed");
    }
  }
  $("life-pause").addEventListener("click", () => lifecycle("pause"));
  $("life-resume").addEventListener("click", () => lifecycle("resume"));
  $("life-incident").addEventListener("click", () => {
    if (!$("life-incident-confirm").checked) return;
    lifecycle("incident");
  });
  $("life-close").addEventListener("click", () => {
    if (!$("life-close-confirm").checked) return;
    lifecycle("close");
  });
  $("life-recover").addEventListener("click", () => {
    if (!$("life-recover-confirm").checked) return;
    lifecycle("recover");
  });
  $("d-save").addEventListener("click", async () => {
    $("d-notice").textContent = "Saving…";
    try {
      await api("/v1/admin/digest-config", {
        method: "POST",
        body: JSON.stringify({
          enabled: $("d-enabled").checked,
          cadence: $("d-cadence").value,
          depth: $("d-depth").value,
          include_controller_breakdown: $("d-ctrl").checked,
          dashboard: true,
        }),
      });
      $("d-notice").className = "notice ok";
      $("d-notice").textContent = "Digest preferences saved. World state unchanged.";
    } catch (e) {
      $("d-notice").className = "notice bad";
      $("d-notice").textContent = e.message || "Save failed";
    }
  });
  $("d-tick").addEventListener("click", async () => {
    $("d-notice").textContent = "Ticking due windows…";
    try {
      const r = await api("/v1/admin/digest-tick", { method: "POST", body: "{}" });
      const d = (r.digests || [])[(r.digests||[]).length - 1];
      if (d) $("d-latest").textContent = d.text;
      $("d-notice").className = "notice ok";
      $("d-notice").textContent = "Produced " + (r.produced || 0) + " digest(s).";
    } catch (e) {
      $("d-notice").className = "notice bad";
      $("d-notice").textContent = e.message || "Tick failed";
    }
  });
  $("refresh").addEventListener("click", load);
  $("logout").addEventListener("click", () => {
    sessionStorage.removeItem("noema.admin.token");
    sessionStorage.removeItem("noema.admin.session");
    location.href = "/admin/login";
  });
  $("reseed-confirm").addEventListener("change", (e) => {
    $("reseed").disabled = !e.target.checked;
  });
  $("reseed").addEventListener("click", async () => {
    if (!$("reseed-confirm").checked) return;
    $("reseed").disabled = true;
    $("reseed-notice").className = "notice";
    $("reseed-notice").textContent = "Reseeding…";
    try {
      const r = await api("/v1/admin/reseed", { method: "POST", body: "{}" });
      $("reseed-notice").className = "notice ok";
      $("reseed-notice").textContent = r.note || "Reseed complete.";
      $("reseed-confirm").checked = false;
      await load();
    } catch (e) {
      $("reseed-notice").className = "notice bad";
      $("reseed-notice").textContent = e.message || "Reseed failed";
      $("reseed").disabled = false;
    }
  });

  $("g-rand").addEventListener("click", () => {
    $("g-seed").value = String(Math.floor(Math.random() * 90000000) + 10000000);
  });
  $("g-clear").addEventListener("click", () => {
    lastPreview = null;
    $("g-preview-title").textContent = "No preview loaded";
    $("g-preview-body").textContent = "Preview data appears after PREVIEW.";
    $("g-activation").hidden = true;
    $("g-notice").textContent = "";
  });
  $("genesis-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const seeds = selectedSeeds();
    if (seeds.length > 2) {
      $("g-notice").className = "notice bad";
      $("g-notice").textContent = "Select at most 2 story seeds.";
      return;
    }
    $("g-notice").className = "notice";
    $("g-notice").textContent = "Generating deterministic preview…";
    try {
      const data = await api("/v1/admin/genesis/preview", {
        method: "POST",
        body: JSON.stringify({
          world_name: $("g-name").value.trim() || "Perihelion Reach",
          world_seed: $("g-seed").value.trim(),
          profile_id: $("g-profile").value,
          story_seed_ids: seeds,
        }),
      });
      renderPreview(data.result, data);
      const liveOk = data.live_world_unchanged && data.live_world_unchanged.ok;
      $("g-notice").className = "notice " + (data.determinism && data.determinism.ok && liveOk ? "ok" : "bad");
      $("g-notice").textContent =
        (data.determinism && data.determinism.ok ? "Determinism OK. " : "Determinism FAILED — do not activate. ") +
        (liveOk ? "Live world unchanged." : "Live world mutated during preview — stop.");
    } catch (err) {
      $("g-notice").className = "notice bad";
      $("g-notice").textContent = err.message || "Preview failed";
    }
  });
  let lastControllerToken = "";
  $("tok-mint").addEventListener("click", async () => {
    const handle = ($("tok-handle").value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
    const ctype = $("tok-ctype").value || "agent";
    const hours = Math.min(168, Math.max(1, Number($("tok-ttl").value) || 24));
    $("tok-notice").className = "notice";
    $("tok-notice").textContent = "Minting…";
    $("tok-copy").disabled = true;
    lastControllerToken = "";
    try {
      const data = await api("/v1/admin/controller-token", {
        method: "POST",
        body: JSON.stringify({
          handle,
          controller_type: ctype,
          expires_in: hours * 3600,
        }),
      });
      lastControllerToken = data.access_token || "";
      $("tok-out").textContent =
        "# operator-minted controller token (Player — not ADMIN)\\n" +
        "# player_id=" + (data.player_id || "") + "\\n" +
        "# controller_id=" + (data.controller_id || "") + "\\n" +
        "# controller_type=" + (data.controller_type || ctype) + "\\n" +
        "# expires_in=" + (data.expires_in || "") + "s\\n" +
        ((data.controller_type || ctype) === "agent"
          ? inhabitSnippet(lastControllerToken)
          : "# humans watch — this token cannot command");
      $("tok-notice").className = "notice ok";
      $("tok-notice").textContent = "Minted " + (data.player_id || "") + " · " + (data.controller_type || ctype) + " · " + Math.round((data.expires_in || 0) / 3600) + "h";
      $("tok-copy").disabled = !lastControllerToken;
      if ((data.controller_type || ctype) === "agent") await showAgentWatch(handle);
    } catch (e) {
      $("tok-notice").className = "notice bad";
      $("tok-notice").textContent = e.message || "mint failed";
      $("tok-out").textContent = "# mint failed";
    }
  });
  $("enroll-send").addEventListener("click", async () => {
    const handle = ($("enroll-handle").value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
    const email = ($("enroll-email").value || "").trim();
    $("enroll-notice").className = "notice";
    $("enroll-notice").textContent = "Sending…";
    try {
      const data = await api("/v1/admin/agent/enroll", {
        method: "POST",
        body: JSON.stringify({ handle, email }),
      });
      $("enroll-notice").className = "notice ok";
      $("enroll-notice").textContent = "Sent " + (data.enrollment_id || "") + " · expires " + (data.expires_at || "");
    } catch (e) {
      $("enroll-notice").className = "notice bad";
      $("enroll-notice").textContent = e.message || "send failed";
    }
  });
  $("tok-copy").addEventListener("click", async () => {
    if (!lastControllerToken) return;
    try {
      await navigator.clipboard.writeText(lastControllerToken);
      $("tok-notice").className = "notice ok";
      $("tok-notice").textContent = "Token copied to clipboard.";
    } catch (_) {
      $("tok-notice").className = "notice bad";
      $("tok-notice").textContent = "Copy failed — select token text manually.";
    }
  });

  $("g-confirm").addEventListener("change", (e) => {
    $("g-activate").disabled = !e.target.checked || !lastPreview || !(lastPreview.validation && lastPreview.validation.ok);
  });
  $("g-activate").addEventListener("click", async () => {
    if (!lastPreview || !$("g-confirm").checked) return;
    $("g-activate").disabled = true;
    $("g-notice").className = "notice";
    $("g-notice").textContent = "Activating…";
    try {
      const data = await api("/v1/admin/genesis/activate", {
        method: "POST",
        body: JSON.stringify({ genesis_id: lastPreview.genesis_id, confirm: true }),
      });
      $("g-notice").className = "notice ok";
      $("g-notice").textContent =
        "Activated " + (data.world && data.world.world_id) +
        " · settlement " + (data.settlement && data.settlement.settled ? "ok" : "soft") +
        " · config frozen.";
      await load();
    } catch (err) {
      $("g-notice").className = "notice bad";
      $("g-notice").textContent = err.message || "Activation failed";
      $("g-activate").disabled = false;
    }
  });

  // Enforce ≤2 story seeds in UI
  document.querySelectorAll("#g-seeds input").forEach(cb => {
    cb.addEventListener("change", () => {
      const checked = [...document.querySelectorAll("#g-seeds input:checked")];
      if (checked.length > 2) {
        cb.checked = false;
        $("g-notice").className = "notice bad";
        $("g-notice").textContent = "At most 2 story seeds for first-run budget.";
      }
    });
  });

  document.querySelectorAll(".rail-nav a").forEach(a => {
    a.addEventListener("click", () => {
      document.querySelectorAll(".rail-nav a").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
    });
  });
  const allFollow = $("awatch-follow-all");
  if (allFollow) {
    allFollow.addEventListener("click", () => {
      watchFollow = { handle: "", room_id: "" };
      syncFollowAll();
      loadAgentWatch().catch(() => undefined);
    });
  }

  const hash = location.hash;
  if (hash) {
    document.querySelectorAll(".rail-nav a").forEach(x => {
      x.classList.toggle("active", x.getAttribute("href") === hash);
    });
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ block: "start" });
  }
  load();
  setInterval(() => { loadAgentWatch().catch(() => undefined); }, 5000);
})();
</script>
<script>
${phosphorInlineScript({
  canvasId: "awatch-phosphor",
  wrapId: "awatch-phos-wrap",
  textBtnId: "awatch-mode-text",
  pixelBtnId: "awatch-mode-pixel",
  globalName: "NoemaAdminPhosphor",
})}
</script>`,
  );
}
