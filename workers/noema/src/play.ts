/** Text-first PLAY shell — Chamber workspace (readable world text first). */

import { productShell } from "./shell";

const EXTRA = `
.play-head{margin-bottom:1.25rem}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 16.5rem;gap:.75rem;align-items:start}
@media(max-width:860px){.grid{grid-template-columns:1fr}}

.location{padding:clamp(1.1rem,2.5vw,1.5rem)}
.location .loc-name{
  margin:.25rem 0 .5rem;
  font:550 clamp(1.85rem,4.5vw,2.85rem)/1.05 var(--font-display);
  letter-spacing:-.02em;
}
.location .loc-desc{
  margin:0;max-width:42rem;color:var(--muted);
  font-size:1.02rem;line-height:1.6;
  font-family:var(--font-body);
}

.list{display:grid;gap:.4rem;margin:.95rem 0 0;padding:0;list-style:none}
.item,.route{
  width:100%;padding:.7rem .75rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.4);text-align:left;transition:border-color .12s;
}
.item{display:flex;gap:.65rem;align-items:center}
.item:hover,.route:hover{border-color:var(--teal)}
.mark{
  display:grid;place-items:center;width:1.65rem;height:1.65rem;flex:0 0 auto;
  border:1px solid var(--line-hot);border-radius:var(--r);
  color:var(--teal);font:.55rem var(--font-mono);letter-spacing:.04em;
}
.item strong,.route strong{display:block;font-size:.86rem;font-weight:600;color:var(--ink)}
.item span,.route span{display:block;margin-top:.12rem;color:var(--muted);font-size:.74rem}
.route{display:flex;gap:.55rem;align-items:center;color:var(--muted)}
.route b{min-width:2.9rem;color:var(--copper);font:.6rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase}

.cmd{
  position:sticky;bottom:.7rem;margin-top:.75rem;padding:1rem;
  border:1px solid var(--line);border-radius:var(--r);
  background:rgba(12,18,24,.96);backdrop-filter:blur(10px);
  box-shadow:0 -8px 40px rgba(0,0,0,.25);
}
.cmd form{display:grid;grid-template-columns:1fr auto;gap:.5rem}
.cmd input{
  min-height:2.6rem;font-family:var(--font-mono);font-size:.9rem;
  color:var(--teal);border-color:var(--line-hot);
}
.chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.65rem}
.chip{
  padding:.38rem .55rem;border:1px solid var(--line);border-radius:var(--r);
  color:var(--muted);background:transparent;
  font:.58rem var(--font-mono);letter-spacing:.07em;text-transform:uppercase;
  transition:border-color .12s,color .12s;
}
.chip:hover{border-color:var(--copper);color:var(--copper)}

.side .btn{width:100%;margin-top:.65rem}
.trail{margin:0;padding:0;list-style:none;display:grid;gap:.1rem}
.trail li{
  display:grid;grid-template-columns:4.2rem 1fr;gap:.5rem;
  padding:.55rem 0;border-bottom:1px solid rgba(42,51,66,.55);font-size:.82rem;
}
.trail .k{color:var(--copper);font:.56rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase}
.trail .t{color:var(--ink)}

.session-ids{margin-top:.85rem;word-break:break-all;font-size:.78rem;line-height:1.55}
`;

export function playHtml(): string {
  const body = `
  <header class="play-head">
    <p class="kicker">PLAY / enter the world</p>
    <h1>Take a position.</h1>
    <p class="lead">Text-first Chamber. Read where you are, then issue a command. Humans and agents share the same Player path.</p>
  </header>

  <div class="grid">
    <section>
      <article class="card location">
        <p class="kicker">Current location</p>
        <h2 class="loc-name" id="room-name">Outside the world</h2>
        <p class="loc-desc" id="room-desc">Start a session to enter. Your observation defines what is visible.</p>
        <div class="meta" style="margin-top:.9rem">
          <span id="meta-cycle">cycle —</span>
          <span id="meta-seq">seq —</span>
          <span id="meta-settled">settled —</span>
        </div>
        <ul class="list" id="entity-list"><li class="empty">No local entities yet.</li></ul>
        <ul class="list" id="exit-list"></ul>
      </article>

      <article class="cmd" aria-label="Command line">
        <form class="cmdform" id="cmd-form">
          <label class="sr" for="cmd">Command</label>
          <input id="cmd" autocomplete="off" spellcheck="false" placeholder="look · move east · inspect entity.relay-7 · wait" disabled/>
          <button class="btn primary" id="send" type="submit" disabled>Send</button>
        </form>
        <div class="chips" id="chips"></div>
        <p class="notice" id="notice" role="status"></p>
      </article>

      <article class="card pad" style="margin-top:.75rem">
        <p class="kicker">Your trail</p>
        <ol class="trail" id="trail"><li class="empty">Committed actions appear here.</li></ol>
      </article>
    </section>

    <aside class="side">
      <article class="card pad">
        <p class="kicker">Session</p>
        <label for="handle">Player handle</label>
        <input id="handle" value="player1" autocomplete="username"/>
        <label for="ctype">Controller</label>
        <select id="ctype">
          <option value="human" selected>human (browser)</option>
          <option value="agent">agent</option>
        </select>
        <button class="btn primary" id="enter" type="button">Enter world</button>
        <button class="btn quiet" id="leave" type="button" disabled>New session</button>
        <p class="empty session-ids">player <code id="pid">—</code><br/>controller <code id="cid">—</code></p>
        <p class="empty" style="margin-top:.55rem"><a href="/connect">Connect an agent</a></p>
      </article>
      <article class="card pad" style="margin-top:.75rem">
        <p class="kicker">Commands</p>
        <p class="empty" style="margin:0;line-height:1.55">look · move &lt;dir&gt;<br/>inspect &lt;id&gt; · wait</p>
      </article>
    </aside>
  </div>

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
      const headers = Object.assign({ "content-type": "application/json" }, opts.headers||{});
      if (state.token) headers.Authorization = "Bearer " + state.token;
      const res = await fetch(path, Object.assign({}, opts, { headers }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        const err = new Error(msg);
        err.code = data.error && data.error.code;
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

    async function enterWorld(preToken) {
      if (state.busy) return;
      state.busy = true; notice("Opening session…");
      try {
        if (preToken) {
          state.token = preToken;
          state.player_id = "from-wizard";
          state.controller_id = "browser";
        } else {
          const handle = ($("handle").value || "player1").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player1";
          const mint = await api("/v1/auth/dev-token", {
            method: "POST",
            body: JSON.stringify({ handle, controller_type: $("ctype").value || "human" }),
          });
          state.token = mint.access_token;
          state.player_id = mint.player_id;
          state.controller_id = mint.controller_id;
          localStorage.setItem(storeKey, JSON.stringify({ handle, ctype: $("ctype").value }));
        }
        $("pid").textContent = state.player_id || "—";
        $("cid").textContent = state.controller_id || "—";
        setOnline(true);
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

    $("enter").addEventListener("click", () => enterWorld());
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

      const qs = new URLSearchParams(location.search);
      if (qs.get("autostart") === "1") {
        const tok = sessionStorage.getItem("noema.play.token");
        const handle = sessionStorage.getItem("noema.play.handle");
        const ctype = sessionStorage.getItem("noema.play.ctype");
        if (handle) $("handle").value = handle;
        if (ctype) $("ctype").value = ctype;
        if (tok) {
          sessionStorage.removeItem("noema.play.token");
          await enterWorld(tok);
        } else {
          await enterWorld();
        }
      }
    })();
  })();
  </script>
  `;
  return productShell({
    title: "Play",
    active: "play",
    body,
    extraCss: EXTRA,
    description: "Enter the NOEMA Chamber. Text-first PLAY for humans and agents.",
  });
}
