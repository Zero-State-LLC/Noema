/**
 * ADMIN management console — separate from PLAY/WATCH/STUDY.
 * Specs: PLATFORM (admin ≠ player) · GENESIS (admin-only) · UI-HANDOFF.
 */

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet"/>`;

const CSS = `
:root{
  color-scheme:dark;
  --void:#070a10;--panel:#121a22;--panel-2:#18232d;--ink:#ebe6d8;--muted:#9b9587;--faint:#6a655c;
  --line:#2a3342;--line-hot:#3d4a58;--copper:#c4784a;--copper-soft:rgba(196,120,74,.14);
  --teal:#6b9b8f;--ember:#c46a5a;--copper-ink:#1a1008;
  --font-display:"Fraunces",Georgia,serif;--font-body:"Source Sans 3",system-ui,sans-serif;
  --font-mono:"IBM Plex Mono",ui-monospace,monospace;--r:2px;
}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--void);color:var(--ink);font:15px/1.5 var(--font-body)}
body{background:radial-gradient(ellipse 50% 40% at 80% -5%,rgba(196,120,74,.1),transparent),var(--void)}
a{color:var(--copper);text-decoration:none}a:hover{color:var(--ink)}
button,input,select{font:inherit}button{cursor:pointer;color:inherit;background:none;border:0}
button:disabled{opacity:.45;cursor:not-allowed}
:focus-visible{outline:2px solid var(--copper);outline-offset:2px}
.top{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;justify-content:space-between;padding:.7rem 1.25rem;border-bottom:1px solid var(--line);background:rgba(7,10,16,.92)}
.brand{font:550 1rem var(--font-display);letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.brand span{display:block;margin-top:.15rem;color:var(--faint);font:.55rem var(--font-mono);letter-spacing:.1em}
.nav{display:flex;flex-wrap:wrap;gap:.2rem}
.nav a{padding:.45rem .6rem;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.nav a[aria-current=page],.nav a:hover{color:var(--ink)}
.tag{display:inline-flex;padding:.28rem .45rem;border:1px solid var(--line);color:var(--muted);font:.55rem var(--font-mono);text-transform:uppercase}
.tag.ok{color:var(--teal);border-color:rgba(107,155,143,.45)}.tag.warn{color:var(--copper)}.tag.bad{color:var(--ember)}
.kicker{color:var(--copper);font:500 .6rem var(--font-mono);letter-spacing:.14em;text-transform:uppercase}
h1{margin:.25rem 0;font:550 clamp(1.8rem,4vw,2.8rem)/1.05 var(--font-display)}
h2{margin:.2rem 0;font:550 1.25rem var(--font-display)}
.muted{color:var(--muted)}.faint{color:var(--faint)}.empty{color:var(--faint);font-size:.82rem}
.btn{display:inline-flex;min-height:2.4rem;align-items:center;justify-content:center;padding:.5rem .85rem;border:1px solid var(--line-hot);border-radius:var(--r);background:var(--panel-2);font-weight:600}
.btn.primary{background:var(--copper);color:var(--copper-ink);border-color:var(--copper)}
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
.rail-nav a:hover,.rail-nav a.active{border-left-color:var(--copper);color:var(--ink);background:var(--copper-soft)}
.rail-foot{margin-top:1.5rem;padding:.7rem;border:1px solid var(--line);color:var(--faint);font:.58rem/1.45 var(--font-mono)}
.main{padding:1.25rem clamp(1rem,3vw,2rem) 3rem}
.section{scroll-margin-top:1rem;padding:1.5rem 0 0}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.65rem}
.s3{grid-column:span 3}.s4{grid-column:span 4}.s5{grid-column:span 5}.s6{grid-column:span 6}.s7{grid-column:span 7}.s8{grid-column:span 8}.s12{grid-column:1/-1}
@media(max-width:900px){.s3,.s4,.s5,.s6,.s7,.s8{grid-column:1/-1}}
.metric{padding:1rem;border-top:2px solid var(--line-hot);background:#0a1016}
.metric.teal{border-top-color:var(--teal)}.metric.copper{border-top-color:var(--copper)}
.metric strong{display:block;margin-top:.3rem;font:550 clamp(1.5rem,3vw,2.1rem) var(--font-display)}
.metric span{color:var(--faint);font:.58rem var(--font-mono);text-transform:uppercase}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.35rem .7rem;margin:0;font-size:.8rem}
.kv dt{color:var(--faint);font:.58rem var(--font-mono);text-transform:uppercase}.kv dd{margin:0;overflow-wrap:anywhere}
.notice{min-height:1.2rem;margin:.7rem 0 0;color:var(--muted);font-size:.8rem}.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.danger{margin-top:.9rem;padding:.85rem;border:1px solid rgba(196,120,74,.45);background:var(--copper-soft)}
.danger label{display:flex!important;gap:.5rem;align-items:flex-start;margin:0}
.danger input{width:1rem;height:1rem;min-height:0;margin-top:.15rem}
.login{display:grid;min-height:calc(100vh - 3.5rem);place-items:center;padding:2rem}
.login-card{width:min(100%,28rem);padding:1.5rem}
.login-card h1{font-size:clamp(2rem,6vw,3rem)}
.banner{margin:0 0 1rem;padding:.75rem 1rem;border:1px solid rgba(196,120,74,.4);background:var(--copper-soft);font-size:.84rem;color:var(--muted)}
code{color:var(--teal);font-family:var(--font-mono);font-size:.86em}
.list{margin:0;padding:0;list-style:none;display:grid;gap:.3rem}
.list li{display:flex;justify-content:space-between;gap:.75rem;padding:.5rem 0;border-bottom:1px solid rgba(42,51,66,.5);font-size:.8rem}
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
<header class="top">
  <div class="brand">NOEMA<span>operator plane · admin ≠ player</span></div>
  <nav class="nav" aria-label="Planes">
    <a href="/">Product</a>
    <a href="/play">Play</a>
    <a href="/admin" aria-current="page">Admin</a>
  </nav>
  <span class="tag warn">ADMIN</span>
</header>
${body}
</body>
</html>`;
}

export function adminLoginHtml(): string {
  return adminChrome(
    "Admin login",
    `<main class="login">
  <section class="card pad login-card" aria-labelledby="login-title">
    <p class="kicker">Operator access</p>
    <h1 id="login-title">Open the control plane.</h1>
    <p class="muted">ADMIN is a separate privileged surface. PLAY, WATCH, and STUDY use Player / Spectator / Researcher identities. Admin privilege is never inherited by a player session.</p>
    <form id="login-form" style="margin-top:1.2rem">
      <label for="token">Operator token</label>
      <input id="token" type="password" autocomplete="current-password" required/>
      <button class="btn primary" type="submit" style="width:100%;margin-top:.85rem">Open ADMIN</button>
    </form>
    <p class="notice" id="notice" role="status"></p>
    <p class="empty" style="margin-top:1rem">Token is checked server-side (<code>ADMIN_OPERATOR_TOKEN</code>). Never put it in client config or player sessions.</p>
  </section>
</main>
<script>
(() => {
  const form = document.getElementById("login-form");
  const notice = document.getElementById("notice");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    notice.className = "notice";
    notice.textContent = "Checking operator access…";
    try {
      const res = await fetch("/v1/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_token: document.getElementById("token").value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
      sessionStorage.setItem("noema.admin.token", data.access_token);
      sessionStorage.setItem("noema.admin.session", data.session_id);
      location.href = "/admin";
    } catch (err) {
      notice.className = "notice bad";
      notice.textContent = err.message || "ADMIN unavailable";
    }
  });
})();
</script>`,
  );
}

export function adminHtml(): string {
  return adminChrome(
    "Admin",
    `<div class="frame">
  <aside class="rail" aria-label="Admin sections">
    <strong>NOEMA</strong>
    <p class="empty" style="margin:.35rem 0 0">management console</p>
    <nav class="rail-nav">
      <a class="active" href="#overview">Overview</a>
      <a href="#world">World</a>
      <a href="#genesis">Genesis</a>
      <a href="#players">Players</a>
      <a href="#boundary">Boundaries</a>
    </nav>
    <div class="rail-foot"><strong style="color:var(--teal);font-size:.65rem">ADMIN ONLY</strong><br/>Controller type is metadata. Humans and agents are both Players in the world.</div>
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
        <article class="metric teal s3"><span>Players present</span><strong id="m-players">—</strong><span id="m-player-note">world ontology: PLAYER</span></article>
        <article class="metric copper s3"><span>World</span><strong id="m-world">—</strong><span id="m-world-state">checking</span></article>
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
        </article>
        <article class="card pad s5">
          <p class="kicker">Consequential</p>
          <h2 style="font-size:1.1rem">Reseed Stage 0 Chamber</h2>
          <p class="muted">Restores the fixed chamber seed. Clears live player positions in this Durable Object. Not a full Genesis profile run.</p>
          <div class="danger">
            <label><input type="checkbox" id="reseed-confirm"/><span>I understand reseed resets live Stage 0 world state in this DO.</span></label>
            <button class="btn danger" type="button" id="reseed" disabled style="margin-top:.7rem">Reseed chamber</button>
          </div>
          <p class="notice" id="reseed-notice"></p>
        </article>
      </div>
    </section>

    <section class="section" id="genesis">
      <p class="kicker">03 / genesis</p>
      <h2>Create a world deliberately</h2>
      <div class="banner">
        <strong style="color:var(--ink)">Specs GENESIS:</strong> admin-only, one-time create-world.
        Players, spectators, researchers, and agents MUST NOT invoke Genesis.
        After activation, configuration freezes — PLAY never shows Genesis UI.
      </div>
      <div class="grid">
        <article class="card pad s6">
          <p class="kicker">Stage 0 status</p>
          <h2 style="font-size:1.15rem" id="gen-title">Chamber seed</h2>
          <dl class="kv" id="kv-genesis" style="margin-top:.7rem"></dl>
          <p class="empty" style="margin-top:.8rem">Full profile catalog + story seeds + preview/activate live on <code>noema-serve</code> <code>/admin</code> (Python modular monolith). This host exposes Stage 0 chamber seed status only.</p>
        </article>
        <article class="card pad s6">
          <p class="kicker">Profiles (catalog)</p>
          <ul class="list">
            <li><strong>stage0.chamber</strong><span>ACTIVE · frozen</span></li>
            <li><strong>v0.6 profiles</strong><span>Python ADMIN only</span></li>
          </ul>
          <p class="muted" style="margin-top:.85rem">Preview → activate is a deliberate two-step. Regeneration before activation requires a new genesis_id. Another Genesis after activation = another world.</p>
        </article>
      </div>
    </section>

    <section class="section" id="players">
      <p class="kicker">04 / players</p>
      <h2>Players and connections</h2>
      <p class="muted">Humans and agents are peers. Controller type is operational metadata, not a world species.</p>
      <div class="grid" style="margin-top:.75rem">
        <article class="card pad s4">
          <p class="kicker">World ontology</p>
          <strong style="font:550 2rem var(--font-display)" id="players-total">—</strong>
          <p class="empty">Players present (live DO)</p>
        </article>
        <article class="card pad s8">
          <p class="kicker">Presence</p>
          <ul class="list" id="player-list"><li class="empty">No player positions returned.</li></ul>
        </article>
      </div>
    </section>

    <section class="section" id="boundary">
      <p class="kicker">05 / boundaries</p>
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
  const token = sessionStorage.getItem("noema.admin.token");
  if (!token) { location.href = "/admin/login"; return; }

  const $ = (id) => document.getElementById(id);
  const notice = (msg, kind="") => { const el=$("notice"); el.textContent=msg||""; el.className="notice"+(kind?" "+kind:""); };

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

  async function load() {
    $("auth-tag").textContent = "ADMIN";
    $("auth-tag").className = "tag ok";
    notice("Refreshing operator projection…");
    try {
      const data = await api("/v1/admin/overview");
      const w = data.world || {};
      const h = data.health || {};
      $("m-players").textContent = w.players_present ?? "—";
      $("m-world").textContent = w.world_id || "—";
      $("m-world-state").textContent = data.ready ? "ready" : "not ready";
      $("m-cycle").textContent = w.cycle ?? "—";
      $("m-seq").textContent = "sequence " + (w.sequence ?? "—");
      $("m-rooms").textContent = w.room_count ?? "—";
      $("world-title").textContent = w.world_id || "World unavailable";
      $("world-tag").textContent = data.ready ? "ONLINE" : "OFFLINE";
      $("world-tag").className = "tag " + (data.ready ? "ok" : "warn");
      $("players-total").textContent = w.players_present ?? "—";

      kv($("kv-runtime"), [
        ["Health", h.status],
        ["Stage", h.stage],
        ["Env", h.env],
        ["Protocol", h.protocol_version],
        ["Admin plane", data.admin_plane || "stage0-worker"],
      ]);
      kv($("kv-world"), [
        ["World id", w.world_id],
        ["Cycle", w.cycle],
        ["Sequence", w.sequence],
        ["Players present", w.players_present],
        ["Rooms", w.room_count],
        ["Entities", w.entity_count],
        ["Unsettled", w.unsettled_count],
      ]);
      const g = w.genesis || data.genesis || {};
      kv($("kv-genesis"), [
        ["Profile", g.profile_id],
        ["Status", g.status],
        ["Frozen", g.frozen === true ? "yes" : g.frozen === false ? "no" : "—"],
        ["Stage", g.stage],
        ["Note", g.note],
      ]);
      $("gen-title").textContent = (g.profile_id || "stage0.chamber") + " · " + (g.status || "—");

      const att = $("attention");
      att.replaceChildren();
      const msgs = data.attention || [];
      if (!msgs.length) {
        const li = document.createElement("li");
        li.innerHTML = "<strong>No operator attention required.</strong><span>clear</span>";
        att.append(li);
      } else {
        msgs.forEach(m => {
          const li = document.createElement("li");
          li.innerHTML = "<strong>" + (m.message||"") + "</strong><span>" + (m.level||"") + "</span>";
          att.append(li);
        });
      }

      const pl = $("player-list");
      pl.replaceChildren();
      const ids = w.player_ids || [];
      if (!ids.length) {
        pl.innerHTML = '<li class="empty">No player positions in live DO.</li>';
      } else {
        ids.forEach(id => {
          const li = document.createElement("li");
          li.innerHTML = "<strong>" + id + "</strong><span>present</span>";
          pl.append(li);
        });
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

  document.querySelectorAll(".rail-nav a").forEach(a => {
    a.addEventListener("click", () => {
      document.querySelectorAll(".rail-nav a").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
    });
  });

  load();
})();
</script>`,
  );
}
