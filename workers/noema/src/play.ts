/** Text-first PLAY shell for Stage 0 (served by Worker at /play and /). */

export function playHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0b1115"/>
<title>PLAY · NOEMA</title>
<style>
:root{color-scheme:dark;--void:#0b1115;--surface:#111a20;--surface-2:#17232a;--ink:#e8efed;--muted:#9aabb0;--faint:#66777e;--line:#2a3a42;--strong:#3e535b;--brass:#e4b56d;--teal:#74c8ba;--ember:#e08072;--mono:"IBM Plex Mono","SFMono-Regular",ui-monospace,monospace;--sans:system-ui,-apple-system,"Segoe UI",sans-serif;--display:"Arial Narrow","Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--void);color:var(--ink);font:15px/1.55 var(--sans)}
body{background:radial-gradient(circle at 12% -8%,rgba(116,200,186,.1),transparent 28rem),radial-gradient(circle at 95% 0%,rgba(228,181,109,.08),transparent 24rem),var(--void)}
a{color:inherit;text-decoration:none}button,input{font:inherit}button{cursor:pointer;color:inherit}button:disabled{opacity:.45;cursor:not-allowed}
button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.top{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:.75rem 1.2rem;align-items:center;justify-content:space-between;padding:.75rem clamp(.8rem,3vw,2rem);border-bottom:1px solid rgba(74,98,106,.65);background:rgba(11,17,21,.92);backdrop-filter:blur(12px)}
.brand{font:800 1.1rem var(--display);letter-spacing:.22em}.brand span{display:block;margin-top:.15rem;color:var(--faint);font:.62rem var(--mono);letter-spacing:.1em;text-transform:uppercase}
.nav{display:flex;gap:.2rem}.nav a{padding:.5rem .7rem;color:var(--muted);font:700 .72rem var(--display);letter-spacing:.16em;text-transform:uppercase}.nav a[aria-current=page],.nav a:hover{color:var(--ink)}
.runtime{display:inline-flex;gap:.4rem;align-items:center;padding:.35rem .55rem;border:1px solid var(--line);color:var(--muted);font:.62rem var(--mono);text-transform:uppercase}.dot{width:.45rem;height:.45rem;border-radius:50%;background:var(--faint)}.dot.ok{background:var(--teal)}.dot.bad{background:var(--ember)}
.wrap{width:min(1100px,calc(100% - 1.5rem));margin:0 auto;padding:1.5rem 0 3rem}
.kicker{color:var(--brass);font:700 .66rem/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase}
h1{margin:.25rem 0 .5rem;font:800 clamp(2rem,6vw,3.4rem)/1 var(--display);letter-spacing:-.04em}
.lead{max-width:60ch;margin:0 0 1.2rem;color:var(--muted)}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 16rem;gap:.8rem;align-items:start}
@media(max-width:820px){.grid{grid-template-columns:1fr}}
.card{border:1px solid var(--line);background:linear-gradient(145deg,rgba(23,35,42,.95),rgba(15,23,28,.96))}
.pad{padding:1rem 1.1rem}
.location h2{margin:.2rem 0 .5rem;font:800 clamp(1.6rem,4vw,2.6rem)/1 var(--display)}
.location p{margin:0;max-width:65ch;color:var(--muted)}
.meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 0;color:var(--faint);font:.65rem var(--mono)}.meta span{padding:.3rem .45rem;border-left:2px solid var(--strong)}
.list{display:grid;gap:.4rem;margin:.9rem 0 0;padding:0;list-style:none}
.item,.route{width:100%;padding:.6rem .7rem;border:1px solid var(--line);background:rgba(11,17,21,.4);text-align:left}
.item{display:flex;gap:.55rem;align-items:center}.item:hover,.route:hover{border-color:var(--teal)}
.mark{display:grid;place-items:center;width:1.5rem;height:1.5rem;border:1px solid var(--strong);color:var(--teal);font:.55rem var(--mono)}
.item strong,.route strong{display:block;font-size:.82rem}.item span,.route span{display:block;margin-top:.12rem;color:var(--muted);font-size:.72rem}
.route{display:flex;gap:.5rem;align-items:center;color:var(--muted)}.route b{min-width:2.8rem;color:var(--brass);font:.62rem var(--mono);text-transform:uppercase}
.cmd{position:sticky;bottom:.75rem;margin-top:.8rem;padding:1rem;border:1px solid var(--line);background:rgba(17,26,32,.98)}
.cmd form{display:grid;grid-template-columns:1fr auto;gap:.5rem}
.cmd input{min-height:2.5rem;padding:.55rem .7rem;border:1px solid var(--strong);border-radius:2px;color:var(--teal);background:#0f171c;font-family:var(--mono)}
.btn{display:inline-flex;min-height:2.5rem;align-items:center;justify-content:center;padding:.55rem .8rem;border:1px solid var(--strong);border-radius:2px;background:var(--surface-2);font-weight:700}
.btn.primary{border-color:#a37d48;color:var(--void);background:var(--brass)}.btn.primary:hover{background:#f0c783}
.btn.quiet{background:transparent;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.65rem}
.chip{padding:.35rem .5rem;border:1px solid var(--line);color:var(--muted);background:transparent;font:.6rem var(--mono);letter-spacing:.06em;text-transform:uppercase}
.chip:hover{border-color:var(--brass);color:var(--brass)}
.notice{min-height:1.2rem;margin:.55rem 0 0;color:var(--muted);font-size:.8rem}.notice.ok{color:var(--teal)}.notice.bad{color:var(--ember)}
.side .pad{padding:1rem}
.side label{display:block;margin:.55rem 0 .25rem;color:var(--muted);font-size:.74rem}
.side input,.side select{width:100%;min-height:2.4rem;padding:.5rem .65rem;border:1px solid var(--strong);border-radius:2px;color:var(--ink);background:#0f171c}
.side .btn{width:100%;margin-top:.7rem}
.trail{margin:0;padding:0;list-style:none;display:grid;gap:.15rem}
.trail li{display:grid;grid-template-columns:4rem 1fr;gap:.5rem;padding:.5rem 0;border-bottom:1px solid rgba(42,58,66,.55);font-size:.8rem}
.trail .k{color:var(--brass);font:.58rem var(--mono);text-transform:uppercase}
.trail .t{color:var(--ink)}
.foot{margin-top:2rem;color:var(--faint);font:.62rem var(--mono)}
.empty{color:var(--faint);font-size:.82rem}
code{color:var(--teal);font-family:var(--mono);font-size:.86em}
</style>
</head>
<body>
<header class="top">
  <div class="brand"><a href="/play">NOEMA</a><span>stage 0 · text world</span></div>
  <nav class="nav" aria-label="Primary">
    <a href="/play" aria-current="page">Play</a>
    <a href="/health">Health</a>
    <a href="https://github.com/Zero-State-LLC/Noema/blob/main/docs/AGENT-STAGE0.md" target="_blank" rel="noopener">Agent docs</a>
  </nav>
  <div class="runtime"><span class="dot" id="dot"></span><span id="rt-label">checking</span></div>
</header>
<main class="wrap">
  <div class="kicker">PLAY / enter the world</div>
  <h1>Take a position.</h1>
  <p class="lead">Text-first Chamber. Humans and agents are both Players. Commands go through the same gateway as Hermes and other controllers.</p>
  <div class="grid">
    <section>
      <article class="card location pad">
        <div class="kicker">Location</div>
        <h2 id="room-name">Outside the world</h2>
        <p id="room-desc">Start a session to enter. Your observation defines what is visible.</p>
        <div class="meta"><span id="meta-cycle">cycle —</span><span id="meta-seq">seq —</span><span id="meta-settled">settled —</span></div>
        <ul class="list" id="entity-list"><li class="empty">No local entities yet.</li></ul>
        <ul class="list" id="exit-list"></ul>
      </article>
      <article class="cmd" aria-label="Command line">
        <form class="cmdform" id="cmd-form">
          <label class="sr-only" for="cmd" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Command</label>
          <input id="cmd" autocomplete="off" spellcheck="false" placeholder="look · move east · inspect entity.relay-7 · wait" disabled/>
          <button class="btn primary" id="send" type="submit" disabled>Send</button>
        </form>
        <div class="chips" id="chips"></div>
        <p class="notice" id="notice" role="status"></p>
      </article>
      <article class="card pad" style="margin-top:.8rem">
        <div class="kicker">Your trail</div>
        <ol class="trail" id="trail"><li class="empty">Committed actions appear here.</li></ol>
      </article>
    </section>
    <aside class="side">
      <article class="card pad">
        <div class="kicker">Session</div>
        <label for="handle">Player handle</label>
        <input id="handle" value="player1" autocomplete="username"/>
        <label for="ctype">Controller</label>
        <select id="ctype">
          <option value="human" selected>human (browser)</option>
          <option value="agent">agent</option>
        </select>
        <button class="btn primary" id="enter" type="button">Enter world</button>
        <button class="btn quiet" id="leave" type="button" disabled>New session</button>
        <p class="empty" style="margin-top:.8rem;word-break:break-all">player <code id="pid">—</code><br/>controller <code id="cid">—</code></p>
      </article>
      <article class="card pad" style="margin-top:.8rem">
        <div class="kicker">Commands</div>
        <p class="empty" style="margin:0">look · move &lt;dir&gt; · inspect &lt;id&gt; · wait · observe</p>
      </article>
    </aside>
  </div>
  <p class="foot">NOEMA · humans and agents are both Players · live Stage 0 on Cloudflare</p>
</main>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { token: null, player_id: null, controller_id: null, obs: null, trail: [], busy: false };
  const storeKey = "noema.play.v1";

  const notice = (msg, kind="") => { const el=$("notice"); el.textContent=msg||""; el.className="notice"+(kind?" "+kind:""); };
  const setOnline = (on) => {
    $("cmd").disabled = !on; $("send").disabled = !on; $("leave").disabled = !on; $("enter").disabled = on;
    $("handle").disabled = on; $("ctype").disabled = on;
  };

  async function api(path, opts={}) {
    const headers = Object.assign({ "content-type": "application/json", "user-agent": "NoemaPlay/0.1" }, opts.headers||{});
    if (state.token) headers.Authorization = "Bearer " + state.token;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data.error && data.error.message) || res.statusText || "request failed";
      const err = new Error(msg);
      err.code = data.error && data.error.code;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function renderObs(obs) {
    state.obs = obs;
    if (!obs || !obs.location) {
      $("room-name").textContent = "Outside the world";
      $("room-desc").textContent = "Start a session to enter.";
      $("meta-cycle").textContent = "cycle —";
      $("meta-seq").textContent = "seq —";
      $("entity-list").innerHTML = '<li class="empty">No local entities yet.</li>';
      $("exit-list").innerHTML = "";
      $("chips").innerHTML = "";
      return;
    }
    const loc = obs.location;
    $("room-name").textContent = loc.name || "Unknown";
    $("room-desc").textContent = loc.description || "";
    $("meta-cycle").textContent = "cycle " + (obs.cycle ?? "—");
    $("meta-seq").textContent = "seq " + (obs.sequence ?? "—");
    const ents = loc.entities || [];
    $("entity-list").innerHTML = ents.length
      ? ents.map(e => '<li><button type="button" class="item" data-cmd="inspect '+(e.entity_id||"")+'"><span class="mark">'+(e.entity_type||"?").slice(0,3)+'</span><span><strong>'+(e.label||e.entity_id)+'</strong><span>'+(e.entity_type||"")+' · '+(e.entity_id||"")+'</span></span></button></li>').join("")
      : '<li class="empty">Nothing notable here.</li>';
    const exits = loc.exits || [];
    $("exit-list").innerHTML = exits.map(x => '<li><button type="button" class="route" data-cmd="move '+(x.direction||"")+'"><b>'+(x.direction||"?")+'</b><span><strong>'+(x.to_room_id||"")+'</strong><span>exit</span></span></button></li>').join("");
    const acts = obs.available_actions || ["LOOK","MOVE","INSPECT","WAIT"];
    $("chips").innerHTML = acts.map(a => {
      const c = a.toLowerCase() === "look" ? "look" : a.toLowerCase() === "wait" ? "wait" : a.toLowerCase() === "move" ? "move " : a.toLowerCase() === "inspect" ? "inspect " : a.toLowerCase();
      return '<button type="button" class="chip" data-cmd="'+c+'">'+a+'</button>';
    }).join("");
  }

  function pushTrail(kind, text) {
    state.trail.unshift({ kind, text });
    state.trail = state.trail.slice(0, 14);
    $("trail").innerHTML = state.trail.map(t => '<li><span class="k">'+t.kind+'</span><span class="t">'+t.text+'</span></li>').join("");
  }

  function parseLine(line) {
    const parts = line.trim().split(/\\s+/);
    const v = (parts.shift() || "").toLowerCase();
    if (!v) return { error: "Enter a command." };
    if (v === "look" || v === "l") return { command: "LOOK", arguments: {} };
    if (v === "wait") return { command: "WAIT", arguments: {} };
    if (v === "observe") return { command: "OBSERVE", arguments: {} };
    if (v === "enter") return { command: "ENTER_WORLD", arguments: {} };
    if (v === "move" || v === "go") {
      const dir = (parts[0] || "").toLowerCase();
      if (!dir) return { error: "move needs a direction (east, west, up, down…)." };
      return { command: "MOVE", arguments: { direction: dir } };
    }
    if (v === "inspect") {
      const id = parts.join(" ");
      if (!id) return { error: "inspect needs an entity id." };
      return { command: "INSPECT", arguments: { entity_id: id } };
    }
    return { error: "Unknown: "+v+". Try look, move, inspect, wait." };
  }

  async function sendCommand(line) {
    if (!state.token || state.busy) return;
    const parsed = parseLine(line);
    if (parsed.error) { notice(parsed.error, "bad"); return; }
    state.busy = true; $("send").disabled = true; notice("Committing…");
    try {
      const body = {
        request_id: "web." + Date.now(),
        idempotency_key: "web." + Date.now() + "." + Math.random().toString(16).slice(2,8),
        command: parsed.command,
        arguments: parsed.arguments || {},
        client: { type: $("ctype").value || "human", runtime: "play-ui" },
      };
      const res = await api("/v1/command", { method: "POST", body: JSON.stringify(body) });
      renderObs(res.observation);
      $("meta-settled").textContent = "settled " + (res.settled === true ? "yes" : res.settled === false ? "no" : "—");
      const ev = (res.events && res.events[0]) || {};
      pushTrail((ev.event_type || parsed.command).toLowerCase().slice(0,12), parsed.command + (res.settled ? " · settled" : ""));
      $("cmd").value = "";
      notice("Action committed.", "ok");
    } catch (e) {
      notice((e.code ? e.code + " · " : "") + (e.message || "failed"), "bad");
    } finally {
      state.busy = false; $("send").disabled = !state.token;
    }
  }

  async function enterWorld() {
    if (state.busy) return;
    state.busy = true; notice("Opening session…");
    try {
      const handle = ($("handle").value || "player1").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player1";
      const mint = await api("/v1/auth/dev-token", {
        method: "POST",
        body: JSON.stringify({ handle, controller_type: $("ctype").value || "human" }),
      });
      state.token = mint.access_token;
      state.player_id = mint.player_id;
      state.controller_id = mint.controller_id;
      $("pid").textContent = state.player_id || "—";
      $("cid").textContent = state.controller_id || "—";
      setOnline(true);
      localStorage.setItem(storeKey, JSON.stringify({ handle, ctype: $("ctype").value }));
      $("dot").className = "dot ok"; $("rt-label").textContent = "in world";
      state.busy = false;
      await sendCommand("enter");
      await sendCommand("look");
    } catch (e) {
      setOnline(false);
      $("dot").className = "dot bad"; $("rt-label").textContent = "error";
      notice((e.message || "could not enter"), "bad");
      state.busy = false;
    }
  }

  function leave() {
    state.token = null; state.player_id = null; state.controller_id = null; state.obs = null; state.trail = [];
    $("pid").textContent = "—"; $("cid").textContent = "—";
    $("trail").innerHTML = '<li class="empty">Committed actions appear here.</li>';
    renderObs(null);
    setOnline(false);
    $("dot").className = "dot ok"; $("rt-label").textContent = "ready";
    notice("Session cleared. Enter again when ready.");
  }

  $("enter").addEventListener("click", enterWorld);
  $("leave").addEventListener("click", leave);
  $("cmd-form").addEventListener("submit", (e) => { e.preventDefault(); sendCommand($("cmd").value); });
  document.body.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmd]");
    if (!b) return;
    const c = b.getAttribute("data-cmd") || "";
    if (c.endsWith(" ")) { $("cmd").value = c; $("cmd").focus(); }
    else sendCommand(c);
  });

  (async () => {
    try {
      const h = await api("/health");
      $("dot").className = h.status === "ok" ? "dot ok" : "dot bad";
      $("rt-label").textContent = h.status === "ok" ? "ready" : "offline";
    } catch (_) {
      $("dot").className = "dot bad"; $("rt-label").textContent = "offline";
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved && saved.handle) $("handle").value = saved.handle;
      if (saved && saved.ctype) $("ctype").value = saved.ctype;
    } catch (_) {}
    renderObs(null);
  })();
})();
</script>
</body>
</html>`;
}
