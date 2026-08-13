/** Text-first PLAY — situation, opportunity, action, consequence. */

import { playEmailGateMarkup } from "./play-login-html";
import { playUiRuntimeSource } from "./play-ui";
import { productShell } from "./shell";

const EXTRA = `
.play-head{margin-bottom:1rem}
.play-head h1{max-width:18ch}
.play-grid{
  display:grid;grid-template-columns:minmax(0,1fr) 15.5rem;gap:.75rem;align-items:start;
}
@media(max-width:900px){
  .play-grid{grid-template-columns:1fr}
  .side{order:-1}
}
.play-health{
  margin:0 0 .75rem;padding:.7rem .85rem;border:1px solid rgba(196,120,74,.45);
  border-radius:var(--r);background:var(--copper-soft);font-size:.88rem;
}
.play-health[hidden]{display:none!important}
.desk-list{display:grid;gap:.55rem;margin:.65rem 0 0;padding:0;list-style:none}
.desk{
  padding:.75rem .8rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.45);
}
.desk-head{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;justify-content:space-between}
.desk-line{margin:.45rem 0 0;color:var(--ink);font-size:.88rem;line-height:1.45;overflow-wrap:anywhere}
.desk-cannot{margin:.25rem 0 0;padding-left:1.1rem;color:var(--muted);font-size:.8rem}
.desk .acts{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.55rem}
.players-here{margin:.55rem 0 0}
.bonds-block{margin-top:.7rem}
.bonds-block:first-child{margin-top:0}
.bond-list{margin:0;padding:0;list-style:none;display:grid;gap:.35rem}
.bond-list li{padding:.45rem 0;border-bottom:1px solid rgba(42,51,66,.5);font-size:.86rem;overflow-wrap:anywhere}
.bond-list .d{display:block;margin-top:.15rem;color:var(--muted)}

/* —— WHERE YOU ARE —— */
.loc{
  padding:clamp(1.05rem,2.4vw,1.45rem);
  border-left:3px solid var(--copper);
}
.loc .world-line{
  margin:0 0 .2rem;color:var(--copper);
  font:500 .62rem/1.3 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;
}
.loc .loc-name{
  margin:0 0 .45rem;
  font:550 clamp(1.75rem,4.2vw,2.65rem)/1.05 var(--font-display);
  letter-spacing:-.02em;
}
.loc .loc-desc{
  margin:0;max-width:44rem;color:var(--muted);
  font-size:1.02rem;line-height:1.6;
}
.loc .loc-cond{
  margin:.75rem 0 0;padding:.55rem .7rem;
  border:1px solid rgba(196,120,74,.35);border-radius:var(--r);
  background:var(--copper-soft);color:var(--ink);font-size:.9rem;
}
.loc .loc-cond b{color:var(--copper);font:500 .58rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase;display:block;margin-bottom:.25rem}

/* —— sections —— */
.sec{margin-top:.75rem}
.sec-title{
  margin:0 0 .45rem;color:var(--copper);
  font:500 .62rem/1.3 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;
}
.sec-body{margin:0}

/* opportunities */
.opp-list{display:grid;gap:.4rem;margin:0;padding:0;list-style:none}
.opp{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.55rem;align-items:center;
  padding:.65rem .75rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.35);text-align:left;overflow-wrap:anywhere;
}
.opp p{margin:0;color:var(--ink);font-size:.9rem;line-height:1.4}
.opp .btn{min-height:2.15rem;padding:.4rem .7rem;font-size:.78rem}

/* entities */
.ent-list{display:grid;gap:.4rem;margin:0;padding:0;list-style:none}
.ent{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.55rem;align-items:center;
  padding:.65rem .75rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.4);overflow-wrap:anywhere;
}
.ent .glyph{
  width:1.55rem;height:1.55rem;display:grid;place-items:center;
  border:1px solid var(--line-hot);border-radius:var(--r);
  color:var(--teal);font-size:.85rem;line-height:1;
}
.ent strong{display:block;font-size:.9rem;font-weight:600}
.ent .sub{display:block;margin-top:.1rem;color:var(--muted);font-size:.74rem}
.ent .acts{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:flex-end}

/* routes */
.route-box{
  margin-top:.55rem;padding:.65rem .75rem;border:1px dashed var(--line-hot);border-radius:var(--r);
  background:#0a1016;font:500 .72rem/1.45 var(--font-mono);color:var(--muted);white-space:pre;
  overflow-x:auto;
}
.exit-list{display:flex;flex-wrap:wrap;gap:.35rem;margin:.55rem 0 0;padding:0;list-style:none}
.exit-list .btn{min-height:2.15rem;font-size:.78rem}

/* actions strip */
.act-strip{display:flex;flex-wrap:wrap;gap:.4rem;margin:.35rem 0 0}
.act-strip .btn{min-height:2.25rem}
.act-strip .btn.util{color:var(--muted);background:transparent;border-color:var(--line)}
.act-strip .btn.move{border-color:rgba(107,155,143,.45)}

/* command */
.cmd{
  margin-top:.75rem;padding:1rem;
  border:1px solid var(--line);border-radius:var(--r);
  background:rgba(12,18,24,.97);
}
@media(min-width:901px){
  .cmd{
    position:sticky;bottom:.55rem;z-index:5;
    backdrop-filter:blur(10px);box-shadow:0 -8px 40px rgba(0,0,0,.28);
  }
  .play-main{padding-bottom:1.25rem}
}
.cmdform{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem}
.cmd input{
  min-height:2.6rem;font-family:var(--font-mono);font-size:.9rem;
  color:var(--teal);border-color:var(--line-hot);
}
.cmd .hint{margin:.45rem 0 0;color:var(--faint);font-size:.72rem}

/* trail */
.trail{margin:0;padding:0;list-style:none;display:grid;gap:.15rem}
.trail li{
  display:grid;grid-template-columns:3.4rem 1fr;gap:.45rem;
  padding:.55rem 0;border-bottom:1px solid rgba(42,51,66,.55);font-size:.84rem;
}
.trail .k{font:.56rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;padding-top:.2rem}
.trail .k.you{color:var(--copper)}
.trail .k.local{color:var(--teal)}
.trail .k.world{color:var(--muted)}
.trail .k.fail{color:var(--ember)}
.trail .t{color:var(--ink);line-height:1.4}
.trail .d{display:block;margin-top:.15rem;color:var(--muted);font-size:.78rem}

/* status */
.status-rows{display:grid;gap:.35rem;margin:0;padding:0;list-style:none}
.status-rows li{display:flex;justify-content:space-between;gap:.75rem;font-size:.84rem}
.status-rows span{color:var(--muted)}
.status-rows b{color:var(--ink);font-weight:600;text-align:right}

/* session gate */
.gate{padding:1.15rem}
.gate .btn{margin-top:.55rem}
.adv{margin-top:.75rem;border-top:1px solid var(--line);padding-top:.65rem}
.adv summary{
  cursor:pointer;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.adv summary:hover{color:var(--ink)}
.adv .mono-ids{margin-top:.55rem;word-break:break-all;font-size:.72rem;line-height:1.5;color:var(--faint)}
.adv label{margin-top:.55rem}

@media(max-width:640px){
  .play-head .lead{font-size:.95rem}
  .ent{grid-template-columns:auto 1fr; }
  .ent .acts{grid-column:1/-1;justify-content:flex-start}
  .opp{grid-template-columns:1fr}
  .play-side-desktop-only{display:none}
  .mobile-collapse{border:1px solid var(--line);border-radius:var(--r);padding:.65rem .75rem;margin-top:.65rem;background:rgba(12,18,24,.9)}
  .mobile-collapse summary{cursor:pointer;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
}
@media(min-width:641px){
  .mobile-only-collapse{display:contents}
  .mobile-only-collapse > summary{display:none}
}
`;

export function playHtml(): string {
  const body = `
  <header class="play-head">
    <p class="kicker">Play</p>
    <h1>Where you stand.</h1>
    <p class="lead">Read the place, notice what matters, act. Type a command or use the buttons — same world, same results.</p>
  </header>

  <div class="play-grid">
    <section class="play-main" aria-label="World">
      <p class="play-health" id="play-health" hidden role="status"></p>
      <article class="card loc" id="loc-card">
        <p class="world-line" id="world-line">Not in world</p>
        <h2 class="loc-name" id="room-name">Outside</h2>
        <p class="loc-desc" id="room-desc">Enter to take a position. What you see is what the world shows you.</p>
        <div class="loc-cond" id="loc-cond" hidden>
          <b>Current condition</b>
          <span id="loc-cond-text"></span>
        </div>
      </article>

      <article class="card pad sec" id="here-card">
        <h3 class="sec-title">What is here</h3>
        <ul class="ent-list" id="entity-list" aria-label="Nearby objects">
          <li class="empty">Nothing visible until you enter.</li>
        </ul>
        <div id="players-here"></div>
        <div id="desk-list"></div>
        <div class="route-box" id="route-box" hidden aria-label="Local routes"></div>
        <ul class="exit-list" id="exit-list" aria-label="Exits"></ul>
      </article>

      <article class="card pad sec" id="bonds-card" hidden>
        <h3 class="sec-title">Between you</h3>
        <div id="bonds-body"></div>
      </article>

      <article class="card pad sec" id="matters-card">
        <h3 class="sec-title">What matters here</h3>
        <ul class="opp-list" id="opp-list" aria-label="Local opportunities">
          <li class="empty">Enter the world to see local opportunities.</li>
        </ul>
      </article>

      <article class="card pad sec" id="actions-card">
        <h3 class="sec-title">What you can do</h3>
        <div class="act-strip" id="act-strip" role="group" aria-label="Actions"></div>
      </article>

      <article class="cmd" aria-label="Command line">
        <form class="cmdform" id="cmd-form">
          <label class="sr" for="cmd">Command</label>
          <input id="cmd" autocomplete="off" spellcheck="false" placeholder="look" disabled
            aria-describedby="cmd-hint"/>
          <button class="btn primary" id="send" type="submit" disabled>Send</button>
        </form>
        <p class="hint" id="cmd-hint">look · move east · inspect · talk · message nacre "hi" · trade nacre offer=energy:1 want=compute:1 · accept · form · leave &lt;org&gt; · help. Buttons run the same actions.</p>
        <p class="notice" id="notice" role="status"></p>
      </article>

      <details class="mobile-collapse mobile-only-collapse" open>
        <summary>What just happened</summary>
        <article class="card pad sec play-trail-card" style="margin-top:.55rem">
          <h3 class="sec-title">What just happened</h3>
          <ol class="trail" id="trail" aria-live="polite"><li class="empty">Your actions and consequences appear here.</li></ol>
        </article>
      </details>
    </section>

    <aside class="side" aria-label="Session and status">
      <article class="card gate" id="session-card">
        <p class="kicker">Session</p>
        <div id="session-out">
          ${playEmailGateMarkup()}
          <label for="handle">Your name</label>
          <input id="handle" value="player1" autocomplete="username" maxlength="32"/>
          <div id="token-primary" hidden>
            <label for="token-paste">Access token</label>
            <input id="token-paste" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
            <p class="empty" style="margin-top:.45rem" id="token-hint">Production entry requires a token from <a href="/admin#players">Admin → Players</a> (operator mint). Public minting is disabled. Paste it in the Access token field on this session card.</p>
          </div>
          <button class="btn primary block" id="enter" type="button" style="margin-top:.65rem">Enter world</button>
          <p class="empty" style="margin-top:.65rem">Agents: use <a href="/connect">Connect</a>.</p>
        </div>
        <div id="session-in" hidden>
          <p class="muted" style="margin:0">You are in the world as <strong id="handle-live">—</strong>.</p>
          <button class="btn quiet block" id="leave" type="button">Leave world</button>
        </div>
        <p class="notice" id="session-notice" role="status"></p>
        <details class="adv" id="advanced">
          <summary>Advanced details</summary>
          <div id="token-advanced-wrap">
            <label for="token-paste-adv">Access token (optional on preview/local)</label>
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
      </article>

      <article class="card pad play-status-card" style="margin-top:.75rem">
        <p class="kicker">Status</p>
        <ul class="status-rows" id="status-rows">
          <li class="empty">—</li>
        </ul>
      </article>

      <article class="card pad play-side-desktop-only" style="margin-top:.75rem">
        <p class="kicker">What just happened</p>
        <ol class="trail" id="trail-side" aria-hidden="true"></ol>
        <p class="empty" id="trail-side-empty">Actions show in the main trail.</p>
      </article>
    </aside>
  </div>

  <script type="module">
  // Presentation helpers are serialized from play-ui.ts (single source).
  ${playClientBundle()}
  </script>
  `;
  return productShell({
    title: "Play",
    active: "play",
    body,
    extraCss: EXTRA,
    description: "Enter the world. Read the place, notice opportunities, act.",
  });
}

/** Client script embedded in PLAY page (no build step). */
function playClientBundle(): string {
  // Keep client self-contained for Worker HTML delivery.
  return `
  (() => {
    const $ = (id) => document.getElementById(id);
    const state = {
      token: null,
      player_id: null,
      controller_id: null,
      handle: "player1",
      obs: null,
      trail: [],
      busy: false,
      prevRoomId: null,
      env: "local",
    };
    const storeKey = "noema.play.v2";

    ${playUiRuntimeSource()}

    const notice = (msg, kind) => {
      const el = $("notice");
      el.textContent = msg || "";
      el.className = "notice" + (kind ? " " + kind : "");
    };
    const sessionNotice = (msg, kind) => {
      const el = $("session-notice");
      el.textContent = msg || "";
      el.className = "notice" + (kind ? " " + kind : "");
    };

    function setSessionUi(on) {
      $("session-out").hidden = on;
      $("session-in").hidden = !on;
      $("cmd").disabled = !on;
      $("send").disabled = !on;
      $("handle-live").textContent = state.handle || "—";
      if (on) $("cmd").focus();
      else $("handle").focus();
    }

    async function api(path, opts) {
      opts = opts || {};
      const headers = Object.assign({ "content-type": "application/json" }, opts.headers || {});
      if (state.token) headers.Authorization = "Bearer " + state.token;
      const res = await fetch(path, Object.assign({}, opts, { headers }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        const err = new Error(msg);
        err.code = data.error && data.error.code;
        err.choices = data.error && data.error.choices;
        throw err;
      }
      return data;
    }

    function esc(s) {
      return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
    }

    function renderTrail() {
      const html = state.trail.length
        ? state.trail.map(t =>
            '<li><span class="k ' + t.kind + '">' + (t.kind === "you" ? "You" : t.kind === "local" ? "Local" : t.kind === "world" ? "World" : "Fail") +
            '</span><span class="t">' + esc(t.title) + (t.detail ? '<span class="d">' + esc(t.detail) + '</span>' : '') + '</span></li>'
          ).join("")
        : '<li class="empty">Your actions and consequences appear here.</li>';
      $("trail").innerHTML = html;
      const side = $("trail-side");
      if (side) {
        side.innerHTML = state.trail.slice(0, 6).map(t =>
          '<li><span class="k ' + t.kind + '">' + t.kind + '</span><span class="t">' + esc(t.title) + '</span></li>'
        ).join("");
        $("trail-side-empty").hidden = state.trail.length > 0;
      }
    }

    function pushTrailItems(items) {
      for (const it of items.reverse()) state.trail.unshift(it);
      state.trail = state.trail.slice(0, 18);
      renderTrail();
    }

    function renderObs(obs) {
      state.obs = obs;
      const desksEl = $("desk-list");
      const playersEl = $("players-here");
      const bondsCard = $("bonds-card");
      const bondsBody = $("bonds-body");
      if (!obs || !obs.location || obs.in_world === false) {
        $("world-line").textContent = "Not in world";
        $("room-name").textContent = "Outside";
        $("room-desc").textContent = "Enter to take a position. What you see is what the world shows you.";
        $("loc-cond").hidden = true;
        $("entity-list").innerHTML = '<li class="empty">Nothing visible until you enter.</li>';
        if (playersEl) playersEl.innerHTML = "";
        if (desksEl) desksEl.innerHTML = "";
        if (bondsCard) bondsCard.hidden = true;
        if (bondsBody) bondsBody.innerHTML = "";
        $("opp-list").innerHTML = '<li class="empty">Enter the world to see local opportunities.</li>';
        $("exit-list").innerHTML = "";
        $("route-box").hidden = true;
        $("act-strip").innerHTML = "";
        $("status-rows").innerHTML = '<li class="empty">—</li>';
        $("meta-seq").textContent = "—";
        return;
      }
      const loc = Object.assign({}, obs.location, { services: obs.location.services || obs.services || [] });
      $("world-line").textContent = obs.world_name || "In world";
      $("room-name").textContent = loc.name || "Unknown place";
      $("room-desc").textContent = loc.description || "";
      const cond = deriveLocalCondition(loc);
      $("loc-cond").hidden = !cond;
      $("loc-cond-text").textContent = cond;

      const ents = loc.entities || [];
      $("entity-list").innerHTML = ents.length
        ? renderEntityListHtml(ents)
        : '<li class="empty">Nothing notable right here.</li>';
      if (playersEl) playersEl.innerHTML = renderPlayersHereHtml(obs.players_here, obs.organizations, obs.player_id);
      if (desksEl) desksEl.innerHTML = renderServiceDesksHtml(loc.services);
      if (bondsCard && bondsBody) {
        bondsCard.hidden = false;
        bondsBody.innerHTML = renderBondsHtml({
          messages: obs.messages,
          trades: obs.trades,
          organizations: obs.organizations,
        });
      }

      const exits = loc.exits || [];
      $("exit-list").innerHTML = exits.map(x => {
        const dest = x.to_room_name || titleCaseLabel(String(x.to_room_id||"").replace(/^room\\./,""));
        return '<li><button type="button" class="btn move" data-cmd="move ' + escHtml(x.direction) + '">Move ' + escHtml(x.direction) + ' · ' + escHtml(dest) + '</button></li>';
      }).join("");

      const rd = routeDiagram(loc.name, exits);
      if (rd.hasRoutes) {
        $("route-box").hidden = false;
        $("route-box").textContent = rd.lines.join("\\n");
      } else {
        $("route-box").hidden = true;
      }

      $("opp-list").innerHTML = renderOpportunitiesHtml(loc);

      let acts = [];
      if (obs.affordances && obs.affordances.length) {
        acts = obs.affordances.filter(a => a.available && a.kind !== "social" && a.kind !== "org").slice(0, 10).map(a => ({
          label: a.label,
          cmd: a.cmd,
          cls: a.kind === "primary" ? "primary" : a.kind === "move" ? "move" : a.kind === "utility" ? "util" : "",
        }));
      } else {
        if (ents[0]) acts.push({ label: "Inspect " + titleCaseLabel(ents[0].label), cmd: "inspect " + ents[0].label, cls: "primary" });
        for (const e of ents) {
          if (e.repairable) acts.push({ label: "Repair " + titleCaseLabel(e.label), cmd: "repair " + e.label, cls: "primary" });
          if (e.harvestable) acts.push({ label: "Harvest " + titleCaseLabel(e.label), cmd: "harvest " + e.label, cls: "" });
        }
        for (const x of exits.slice(0, 3)) acts.push({ label: "Move " + x.direction, cmd: "move " + x.direction, cls: "move" });
        acts.push({ label: "Look around", cmd: "look", cls: "util" });
        acts.push({ label: "Wait", cmd: "wait", cls: "util" });
      }
      $("act-strip").innerHTML = acts.map(a =>
        '<button type="button" class="btn ' + a.cls + '" data-cmd="' + escHtml(a.cmd) + '">' + escHtml(a.label) + '</button>'
      ).join("");

      const rows = statusFromObservation(obs);
      if (obs.budgets) {
        rows.push({ label: "Energy", value: String(obs.budgets.energy) });
        rows.push({ label: "Compute", value: String(obs.budgets.compute) });
        rows.push({ label: "Storage", value: String(obs.budgets.storage) });
        rows.push({ label: "Attention", value: String(obs.budgets.attention) });
      }
      rows.push({ label: "Mail", value: String((obs.messages || []).length) });
      rows.push({ label: "Trades", value: String((obs.trades || []).length) });
      rows.push({ label: "Orgs", value: String((obs.organizations || []).length) });
      $("status-rows").innerHTML = rows.map(r =>
        '<li><span>' + escHtml(r.label) + '</span><b>' + escHtml(r.value) + '</b></li>'
      ).join("");
      $("meta-seq").textContent = String(obs.sequence ?? "—");
      state.prevRoomId = loc.room_id;
    }

    async function sendCommand(line) {
      if (!state.token || state.busy) return;
      const raw = String(line || "").trim();
      if (!raw) { notice("Type a command, or use an action below.", "bad"); return; }
      // HELP client-side shortcut when offline observation needed
      if (/^help\\b/i.test(raw) && !state.token) {
        notice("Enter the world first.", "bad");
        return;
      }
      state.busy = true;
      $("send").disabled = true;
      notice("Acting…");
      $("err-advanced").textContent = "";
      try {
        // Single path: human line → server parseHumanCommand (same as agent structured verbs)
        const body = {
          request_id: "web." + Date.now(),
          idempotency_key: "web." + Date.now() + "." + Math.random().toString(16).slice(2, 8),
          command: "LOOK",
          arguments: { line: raw },
          client: { type: "human", runtime: "play-ui", client_action_sequence: Date.now() },
        };
        const res = await api("/v1/command", { method: "POST", body: JSON.stringify(body) });
        renderObs(res.observation);
        $("meta-settled").textContent = res.settled === true ? "settled" : "";
        const consequence = (res.observation && res.observation.consequence) || raw;
        pushTrailItems([
          { kind: "you", title: consequence.split("\\n")[0] },
          ...(res.observation && res.observation.location
            ? [{ kind: "local", title: "You are at " + res.observation.location.name + "." }]
            : []),
        ]);
        $("cmd").value = "";
        notice(res.observation && res.observation.consequence ? res.observation.consequence.split("\\n")[0] : "Done.", "ok");
        setTimeout(() => { if (($("notice").textContent || "").indexOf("Done") === 0 || ($("notice").className || "").indexOf("ok") >= 0) notice(""); }, 1600);
      } catch (e) {
        const h = humanizeError(e.code, e.message);
        let primary = h.primary;
        if (e.choices && e.choices.length) primary = primary + "\\n" + e.choices.map((c, i) => (i + 1) + ". " + c).join("\\n");
        notice(primary, "bad");
        $("err-advanced").textContent = h.advanced || "";
        pushTrailItems([{ kind: "fail", title: primary.split("\\n")[0] }]);
      } finally {
        state.busy = false;
        $("send").disabled = !state.token;
      }
    }

    function readPastedToken() {
      const a = ($("token-paste") && $("token-paste").value || "").trim();
      const b = ($("token-paste-adv") && $("token-paste-adv").value || "").trim();
      return a || b;
    }

    async function enterWorld(preToken) {
      if (state.busy) return;
      state.busy = true;
      sessionNotice("Opening session…");
      try {
        const handle = ($("handle").value || "player1").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "player1";
        state.handle = handle;
        const pasted = readPastedToken();
        if (preToken) {
          state.token = preToken;
          state.player_id = "session";
          state.controller_id = "browser";
        } else if (pasted) {
          state.token = pasted;
          state.player_id = "token";
          state.controller_id = "browser";
        } else if (state.env === "production") {
          throw Object.assign(new Error("Request a play link to enter. If you already have a token, paste it under Advanced details."), { code: "NOT_AUTHORIZED" });
        } else {
          // Preview/local only — public mint for demos. Never in production.
          const mint = await api("/v1/auth/dev-token", {
            method: "POST",
            body: JSON.stringify({ handle, controller_type: "human" }),
          });
          state.token = mint.access_token;
          state.player_id = mint.player_id;
          state.controller_id = mint.controller_id;
        }
        localStorage.setItem(storeKey, JSON.stringify({ handle }));
        $("pid").textContent = state.player_id || "—";
        $("cid").textContent = state.controller_id || "—";
        setSessionUi(true);
        state.busy = false;
        sessionNotice("");
        await sendCommand("enter");
        await sendCommand("look");
      } catch (e) {
        setSessionUi(false);
        state.token = null;
        const h = humanizeError(e.code, e.message);
        let msg = h.primary;
        if (e.code === "NOT_AUTHORIZED" || /dev-token disabled/i.test(e.message || "")) {
          msg = e.message || "Request a play link to enter. If you already have a token, paste it under Advanced details.";
        }
        sessionNotice(msg, "bad");
        $("err-advanced").textContent = h.advanced || e.message || "";
        state.busy = false;
      }
    }

    async function leave() {
      if (state.token) {
        try {
          await sendCommand("leave");
        } catch (_) {}
      }
      const left = !state.obs || state.obs.in_world === false;
      const blocked = ($("notice").className || "").indexOf("bad") >= 0 && !left;
      if (blocked && state.token) {
        sessionNotice($("notice").textContent || "Could not leave the world.", "bad");
        return;
      }
      state.token = null;
      state.player_id = null;
      state.controller_id = null;
      try { sessionStorage.removeItem("noema.play.token"); } catch (_) {}
      state.obs = null;
      state.trail = [];
      $("pid").textContent = "—";
      $("cid").textContent = "—";
      renderTrail();
      renderObs(null);
      setSessionUi(false);
      sessionNotice("You left the world.");
      notice("");
      $("handle").focus();
    }

    $("enter").addEventListener("click", () => enterWorld());
    $("leave").addEventListener("click", leave);
    $("cmd-form").addEventListener("submit", (e) => {
      e.preventDefault();
      sendCommand($("cmd").value);
    });
    document.body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cmd]");
      if (!b) return;
      const c = b.getAttribute("data-cmd") || "";
      if (c.endsWith(" ") || c.endsWith("=") || c.endsWith('"')) {
        $("cmd").value = c;
        $("cmd").focus();
      } else {
        sendCommand(c);
      }
    });

    (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
        if (saved && saved.handle) $("handle").value = saved.handle;
      } catch (_) {}
      // Detect production so we never attempt open mint on this host
      try {
        const h = await fetch("/health").then(r => r.json());
        state.env = (h && h.env) || "local";
      } catch (_) {
        state.env = "unknown";
      }
      try {
        const ready = await fetch("/ready").then(r => r.json());
        const banner = $("play-health");
        if (banner && ready && ready.play_blocked) {
          const h = humanizeError(ready.code, "");
          banner.hidden = false;
          banner.textContent = h.primary;
        }
      } catch (_) {}
      renderObs(null);
      renderTrail();

      const qs = new URLSearchParams(location.search);
      if (qs.get("error") === "1") {
        sessionNotice("That login link is expired or invalid. Request a new one.", "bad");
      }
      const tok = sessionStorage.getItem("noema.play.token");
      const handle = sessionStorage.getItem("noema.play.handle");
      if (handle) $("handle").value = handle;
      if (tok) {
        await enterWorld(tok);
      } else if (qs.get("autostart") === "1" && state.env !== "production") {
        await enterWorld();
      }
    })();
  })();
  `;
}
