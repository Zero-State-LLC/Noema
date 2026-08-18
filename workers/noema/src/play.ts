/** Text-first PLAY — situation, opportunity, action, consequence. */

import { playEmailGateMarkup } from "./play-login-html";
import { legendHtml, glyphMeta } from "./presentation/glyphs";
import { playUiRuntimeSource } from "./play-ui";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · pre-emit critique: P5 H4 E4 S5 R5 V4
 * genre: atmospheric · macrostructure: Letter · design-system: site/design.md · designed-as-app
 */
.role-place{color:var(--color-text-primary)}
.role-you{color:var(--color-state-social)}
.role-here{color:var(--color-state-active)}
.role-fail{color:var(--color-state-critical)}
.role-ok{color:var(--color-state-active)}
#play-chamber{display:none}
body.is-chamber .top,body.is-chamber .foot{display:none}
body.is-chamber #main.wrap{width:100%;max-width:none;padding:0;margin:0}
body.is-chamber #play-door{display:none}
body.is-chamber #play-chamber{
  display:grid;grid-template-rows:auto auto 1fr auto;height:100dvh;min-height:100dvh;overflow:hidden;
}
body.is-arrive #world-strip,body.is-arrive #signals,body.is-arrive .sys,
body.is-arrive #world-key,body.is-arrive #advanced,body.is-arrive #status-rows,
body.is-arrive .status-head,body.is-arrive #route-box,body.is-arrive #desk-list,
body.is-arrive #bonds-card,body.is-arrive .hint-more,body.is-arrive .where,
body.is-arrive #loc-cond,body.is-arrive #exit-wrap,body.is-arrive .acts-head{
  display:none!important;
}
body.is-arrive.show-exits #exit-wrap{display:block!important}
body.is-arrive.show-bonds #bonds-card{display:block!important}
body.is-arrive #trail li:nth-child(n+4){display:none}
.strain-line{margin:.55rem 0 0;max-width:44rem;color:var(--color-text-primary)}
.strain-line[hidden]{display:none}
.bite-status{margin:.35rem 0 0;color:var(--color-text-secondary);font-size:.82rem}
.bite-status[hidden]{display:none}
#arrive-name{margin:1rem 0;padding:.75rem 0;border-top:1px solid var(--line)}
#arrive-name[hidden]{display:none}
.ch-mast{
  display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:center;
  min-height:2.6rem;padding:.45rem .85rem;border-bottom:1px solid var(--line);
  font:500 .68rem/1.3 var(--font-interface);letter-spacing:.06em;text-transform:uppercase;
}
.ch-mast a{color:var(--ink);text-decoration:none}
.ch-mast #leave{margin-left:auto;text-transform:none;letter-spacing:0}
.ch-strip{
  display:flex;flex-wrap:wrap;gap:.35rem 1rem;align-items:baseline;
  min-height:1.9rem;padding:.35rem .85rem;
  background:var(--color-surface-band);border-bottom:1px solid var(--line);
  font:500 .78rem/1.3 var(--font-interface);
}
.ch-strip[hidden]{display:none}
.strip-item{display:inline-flex;gap:.35rem;align-items:baseline}
.strip-k{color:var(--color-text-secondary);letter-spacing:.04em;text-transform:uppercase;font-size:.62rem}
.strip-v{color:var(--color-text-primary);font-weight:600}
.signals{margin:1rem 0 0}
.signals h3{
  margin:0 0 .35rem;color:var(--color-text-secondary);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.signals[hidden]{display:none}
#signal-feed{margin:0;padding:0;list-style:none}
#signal-feed li{padding:.35rem 0;border-bottom:1px solid var(--line);font-size:.86rem}
#signal-feed li.signal-new{animation:signal-in 200ms var(--ease) 1 both}
@keyframes signal-in{
  from{background:color-mix(in srgb,var(--color-state-active) 12%,transparent)}
  to{background:transparent}
}
@keyframes threshold-in{
  from{box-shadow:inset 0 -2px 0 var(--color-state-warning);background:color-mix(in srgb,var(--color-state-warning) 14%,transparent)}
  to{box-shadow:none;background:transparent}
}
@keyframes panel-in{
  from{opacity:.35}
  to{opacity:1}
}
.ch-strip .strip-v{transition:opacity 160ms var(--ease)}
.trail li{animation:panel-in 160ms var(--ease) 1 both}
.just-happened.threshold-in,.play-health.threshold-in,.sys-list li.threshold-in{
  animation:threshold-in 240ms var(--ease) 1 both;
}
@media(prefers-reduced-motion:reduce){
  #signal-feed li.signal-new,.just-happened.threshold-in,.play-health.threshold-in,
  .sys-list li.threshold-in,.trail li,.ch-strip .strip-v{
    animation:none!important;transition:none!important;
  }
}
.sys{margin:.85rem 0 0;border-top:1px solid var(--line);padding-top:.45rem}
.sys[hidden]{display:none}
.sys summary{
  cursor:pointer;color:var(--color-text-secondary);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.sys-hedge{margin:.35rem 0 .25rem;color:var(--color-state-unknown);font-size:.78rem}
.sys-list{margin:0;padding:0;list-style:none}
.sys-list li{padding:.3rem 0;border-bottom:1px solid var(--line);font-size:.84rem}
.sys-list li.rumor{color:var(--color-state-unknown)}
.ch-body{
  display:grid;grid-template-columns:minmax(0,1fr) 16rem;min-height:0;overflow:auto;
}
@media(max-width:900px){
  .ch-body{display:block;grid-template-columns:1fr}
  .ch-mast #world-line,.ch-mast #ch-cycle,.ch-mast #handle-live,.ch-mast #play-health,.ch-strip,#look-exits{display:none!important}
  .hint-more{display:none}
  #trail li:nth-child(n+6){display:none}
  #here-open{display:block;width:100%;min-height:44px;margin:.4rem 0 0}
  .here-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:0 0 .65rem}
  .here-head strong{font:500 .78rem/1.3 var(--font-interface);letter-spacing:.06em;text-transform:uppercase}
  #here-close{min-height:44px;min-width:44px}
  .here-backdrop{display:none;position:fixed;inset:0;z-index:5;background:var(--color-overlay)}
  .here-backdrop.is-open{display:block}
  .ch-rail{
    position:fixed;left:0;right:0;bottom:0;z-index:6;order:0;
    height:min(78dvh,36rem);max-height:78dvh;
    border-left:0;border-top:1px solid var(--line);
    background:var(--color-surface-raised);
    transform:translateY(110%);visibility:hidden;pointer-events:none;
    transition:transform 180ms var(--ease),visibility 0s linear 180ms;
  }
  .ch-rail.is-open{
    transform:none;visibility:visible;pointer-events:auto;transition:transform 180ms var(--ease);
  }
}
@media(min-width:901px){
  #here-open{display:none}
  .here-head,.here-backdrop{display:none}
}
@media(prefers-reduced-motion:reduce){
  .ch-rail{transition:opacity 150ms var(--ease);transform:none}
  .ch-rail:not(.is-open){opacity:0}
  .ch-rail.is-open{opacity:1}
}
@media(max-width:640px){
  body.is-chamber #play-chamber{overflow-x:clip}
  .ch-mast{gap:.45rem .75rem;padding:.4rem .7rem}
  .ch-mast #leave{min-height:44px;min-width:44px;padding:.45rem .7rem}
  .ch-strip{gap:.25rem .7rem;padding:.4rem .7rem;align-items:flex-start}
  .strip-item{flex:1 1 calc(50% - .7rem);min-width:8rem}
  .ch-scroll{padding:.7rem .7rem 1rem}
  .ch-rail{padding:.65rem .7rem}
  .ch-cmd{
    position:sticky;bottom:0;z-index:3;
    padding:.55rem .7rem calc(.55rem + env(safe-area-inset-bottom,0px));
  }
  .cmdform input,.cmdform .btn,#enter,.door-gate .btn{
    min-height:44px;font-size:16px;
  }
  .tok-list button,.ch-cmd .hint [data-cmd],.sys summary,.legend summary,.adv summary{
    min-height:44px;display:inline-flex;align-items:center;
  }
  .look #room-name,#room-name{font-size:1.25rem}
}
.ch-scroll{min-height:0;overflow:auto;padding:.85rem 1rem 1.25rem}
.look .where{margin:0 0 .2rem;font:500 .62rem var(--font-interface);letter-spacing:.14em}
.look #room-name,#room-name{
  margin:0 0 .35rem;font:600 clamp(1.4rem,3vw,2.1rem)/1.05 var(--font-display);
  color:var(--color-text-primary);
}
.look #room-desc{margin:0;max-width:44rem;color:var(--muted)}
.look #loc-custom{margin:.55rem 0 0;max-width:44rem;color:var(--ink)}
.look #loc-cond{margin:.65rem 0 0}
.look #look-exits{margin:.45rem 0 0;color:var(--muted);font-size:.84rem}
.just-happened{
  margin:.85rem 0 0;padding:.55rem 0 0;border-top:1px solid var(--line);
  color:var(--color-text-primary);font:500 .95rem/1.4 var(--font-interface);
}
.just-happened[hidden]{display:none}
.just-happened .k{
  display:block;margin:0 0 .2rem;color:var(--color-text-secondary);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.ch-rail{
  border-left:1px solid var(--line);padding:.75rem .8rem;overflow:auto;
  font-size:.84rem;min-height:0;
}
.ch-rail h3,.ch-rail h4{
  margin:.85rem 0 .35rem;color:var(--color-text-secondary);
  font:500 .62rem/1.3 var(--font-interface);letter-spacing:.14em;text-transform:uppercase;
}
.ch-rail h3:first-child{margin-top:0}
.tok-list,.trail{margin:0;padding:0;list-style:none}
.tok-list li{padding:.28rem 0;border-bottom:1px solid var(--color-rule-soft)}
.tok-list button{
  padding:0;border:0;background:none;color:var(--color-state-active);font:inherit;text-align:left;
}
.tok-list button:hover{color:var(--ink)}
.trail{margin-top:1rem}
.trail li{
  display:grid;grid-template-columns:3.4rem 1fr;gap:.45rem;
  padding:.45rem 0;border-bottom:1px solid var(--color-rule-soft);font-size:.84rem;
}
.trail .k{font:.56rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;padding-top:.2rem}
.trail .k.world{color:var(--muted)}
.trail .t{color:var(--ink)}
.trail .d{color:var(--muted)}
.ch-cmd{
  border-top:1px solid var(--line);padding:.65rem .85rem .75rem;
  background:var(--color-cmd-bar);position:sticky;bottom:0;z-index:2;
}
.cmdform{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem}
.cmdform input{
  min-height:2.5rem;font-family:var(--font-machine);font-size:.9rem;color:var(--color-text-machine);
}
.ch-cmd .hint{margin:.4rem 0 0;color:var(--faint);font-size:.72rem}
.ch-cmd .hint [data-cmd]{color:var(--color-state-active);cursor:pointer}
.status-rows{margin:.35rem 0 0;padding:0;list-style:none}
.status-rows li{display:flex;justify-content:space-between;gap:.75rem;font-size:.8rem}
.status-rows span{color:var(--muted)}
#play-door.door{
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(16rem,20rem);
  gap:var(--space-lg) var(--space-xl);align-items:end;
  margin:var(--space-xl) 0 0;max-width:52rem;
}
#play-door.door h1{margin:0;max-width:none;min-width:0;font-size:clamp(2.4rem,6vw,3.5rem);overflow-wrap:anywhere}
#play-door .place{margin:0 0 .4rem;color:var(--color-state-active);font:600 1rem/1.35 var(--font-display)}
#play-door .door-gate{min-width:0}
@media(max-width:760px){#play-door.door{grid-template-columns:1fr;gap:var(--space-lg)}}
.adv{margin-top:.75rem}
.adv summary{
  cursor:pointer;color:var(--muted);font:.62rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.mono-ids{margin-top:.55rem;word-break:break-all;font-size:.72rem;color:var(--faint)}
`;

export function playHtml(): string {
  const loc = glyphMeta("loc");
  const body = `
  <section class="door" id="play-door" aria-labelledby="play-title">
    <div>
      <p class="place">Perihelion Reach</p>
      <h1 id="play-title">Enter</h1>
    </div>
    <div class="door-gate" id="session-card">
      <div id="session-out">
        ${playEmailGateMarkup({ operatorLink: false })}
        <label for="handle">Your name</label>
        <input id="handle" value="" autocomplete="username" maxlength="32" minlength="2" placeholder="choose a name" required/>
        <details class="adv" id="token-primary">
          <summary>Advanced</summary>
          <label for="token-paste">Access token</label>
          <input id="token-paste" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
          <p class="empty" id="token-hint">If you already have a key, paste it here.</p>
        </details>
        <button class="btn primary block form-submit" id="enter" type="button">Enter world</button>
      </div>
      <p class="notice" id="session-notice" role="status"></p>
    </div>
  </section>

  <div id="play-chamber" aria-label="Chamber">
    <header class="ch-mast">
      <a href="/">NOEMA</a>
      <span id="world-line" class="role-place">—</span>
      <span id="ch-cycle"></span>
      <p class="play-health" id="play-health" hidden role="status"></p>
      <span id="handle-live">—</span>
      <button class="btn quiet" id="leave" type="button">Leave</button>
    </header>
    <div id="world-strip" class="ch-strip" hidden role="status" aria-label="World state"></div>
    <div class="ch-body">
      <section class="ch-scroll" aria-label="World">
        <article class="look" id="loc-card">
          <p class="where role-place"><span class="glyph glyph-loc" role="img" aria-label="${loc.label}" title="${loc.meaning}"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="${loc.d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg><span class="sr">${loc.fallback}</span></span>WHERE</p>
          <div id="arrive-name" hidden>
            <label for="arrive-handle">What should they call you here?</label>
            <input id="arrive-handle" maxlength="32" minlength="2" autocomplete="username"/>
            <button class="btn primary" id="arrive-ok" type="button" style="margin-top:.55rem">Enter</button>
          </div>
          <h2 id="room-name"></h2>
          <p id="room-desc"></p>
          <p id="strain-line" class="strain-line" hidden></p>
          <p id="loc-custom" hidden></p>
          <div id="loc-cond" hidden>
            <b class="role-place">CONDITION</b>
            <span id="loc-cond-text"></span>
          </div>
          <p id="look-exits" hidden></p>
        </article>
        <p id="just-happened" class="just-happened" hidden role="status"></p>
        <section class="signals" id="signals" hidden>
          <h3>Signals</h3>
          <ul id="signal-feed" aria-label="Signals"></ul>
        </section>
        <details class="sys" id="sys-rumors" hidden>
          <summary>Rumors</summary>
          <p class="sys-hedge">Unconfirmed. A record says — not world truth.</p>
          <ul id="rumor-list" class="sys-list" aria-label="Rumors"></ul>
        </details>
        <details class="sys" id="sys-comms" hidden>
          <summary>Traffic</summary>
          <ul id="comms-list" class="sys-list" aria-label="Traffic"></ul>
        </details>
        <details class="sys" id="sys-archive" hidden>
          <summary>Archive</summary>
          <ul id="archive-list" class="sys-list" aria-label="Archive"></ul>
        </details>
        <details class="sys" id="sys-contest" hidden>
          <summary>Contested</summary>
          <ul id="contest-list" class="sys-list" aria-label="Contests"></ul>
        </details>
        <details class="sys" id="sys-unclaimed" hidden>
          <summary>Unclaimed</summary>
          <ul id="unclaimed-list" class="sys-list" aria-label="Unclaimed works"></ul>
        </details>
        <details class="sys" id="sys-offices" hidden>
          <summary>Offices</summary>
          <ul id="office-list" class="sys-list" aria-label="Offices"></ul>
        </details>
        <ol class="trail" id="trail" aria-live="polite"></ol>
      </section>
      <aside class="ch-rail" id="here-sheet" aria-label="Here">
        <div class="here-head">
          <strong>Here</strong>
          <button class="btn quiet" id="here-close" type="button" aria-label="Close">×</button>
        </div>
        <h3 class="role-here">HERE</h3>
        <ul class="tok-list" id="entity-list" aria-label="Nearby objects"></ul>
        <div id="players-here"></div>
        <div id="desk-list"></div>
        <div id="bonds-card"><div id="bonds-body"></div></div>
        <div id="exit-wrap">
        <h3>EXITS</h3>
        <ul class="tok-list" id="exit-list" aria-label="Exits"></ul>
        <div class="route-box" id="route-box" hidden aria-label="Local routes"></div>
        </div>
        <h3 class="acts-head">AVAILABLE HERE</h3>
        <ul class="tok-list" id="action-rail" aria-label="Available here"></ul>
        <h3 class="status-head">STATUS</h3>
        <ul class="status-rows" id="status-rows"></ul>
        ${legendHtml()}
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
      <button class="btn quiet" id="here-open" type="button" aria-expanded="false" aria-controls="here-sheet">Here</button>
      <p class="hint" id="cmd-hint"><button type="button" data-cmd="look">look</button> · <button type="button" data-cmd="help">help</button><span class="hint-more"> · <button type="button" data-cmd="move ">move east</button> · <button type="button" data-cmd="inspect ">inspect</button> · <button type="button" data-cmd="talk ">talk</button> · message nacre "hi" · trade nacre offer=energy:1 want=compute:1 · accept · form · leave &lt;org&gt;</span></p>
      <p id="bite-status" class="bite-status" hidden></p>
      <p class="notice" id="notice" role="status"></p>
    </footer>
    <div class="here-backdrop" id="here-backdrop" hidden></div>
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
    description: "PLAY — enter the world and act.",
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
      handle: "",
      obs: null,
      trail: [],
      busy: false,
      prevRoomId: null,
      env: "local",
      prevContestKey: "",
      worldName: "",
      attachCode: "",
      attachReason: "",
      playerActs: 0,
      arriving: true,
    };

    function pulseThreshold(el) {
      if (!el) return;
      el.classList.remove("threshold-in");
      void el.offsetWidth;
      el.classList.add("threshold-in");
    }
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

    function setHereOpen(on) {
      const sheet = $("here-sheet");
      const btn = $("here-open");
      const back = $("here-backdrop");
      if (!sheet || !btn) return;
      sheet.classList.toggle("is-open", !!on);
      if (back) {
        back.classList.toggle("is-open", !!on);
        back.hidden = !on;
      }
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      if (on) {
        const close = $("here-close");
        if (close) close.focus();
      } else if ($("cmd") && !$("cmd").disabled) {
        $("cmd").focus();
      }
    }

    function setArrive(on) {
      state.arriving = !!on;
      document.body.classList.toggle("is-arrive", !!on);
    }

    function setSessionUi(on) {
      document.body.classList.toggle("is-chamber", on);
      if (on) setArrive(state.playerActs < 5);
      else setArrive(false);
      $("cmd").disabled = !on;
      $("send").disabled = !on;
      $("handle-live").textContent = state.handle || "—";
      if (!on) setHereOpen(false);
      if (on && $("arrive-name") && !$("arrive-name").hidden) {
        const ah = $("arrive-handle");
        if (ah) ah.focus();
      } else if (on) $("cmd").focus();
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
        err.observation = data.observation;
        throw err;
      }
      return data;
    }

    function renderTrail() {
      const el = $("trail");
      if (state.trail.length) fillTrail(el, state.trail);
      else el.replaceChildren();
    }

    function pushTrailItems(items) {
      for (const it of items.reverse()) state.trail.unshift(it);
      state.trail = state.trail.slice(0, 18);
      renderTrail();
    }

    function renderObs(obs) {
      try {
        renderObsInner(obs);
      } catch (err) {
        notice("The view could not refresh. Type look.", "bad");
        const adv = $("err-advanced");
        if (adv) adv.textContent = String(err && err.message || err || "render failed");
      }
    }

    function renderObsInner(obs) {
      state.obs = obs;
      const desksEl = $("desk-list");
      const playersEl = $("players-here");
      const bondsCard = $("bonds-card");
      const bondsBody = $("bonds-body");
      if (!obs || !obs.location) {
        const wait = waitingCopy({
          code: state.attachCode,
          message: (obs && obs.consequence) || state.attachReason,
          worldName: (obs && obs.world_name) || state.worldName,
        });
        $("world-line").textContent = wait.worldLine;
        $("room-name").textContent = "";
        $("room-desc").textContent = wait.roomDesc;
        const locCustomOff = $("loc-custom");
        if (locCustomOff) { locCustomOff.hidden = true; locCustomOff.textContent = ""; }
        $("loc-cond").hidden = true;
        const lookExits = $("look-exits");
        if (lookExits) { lookExits.hidden = true; lookExits.textContent = ""; }
        $("entity-list").replaceChildren();
        if (playersEl) playersEl.replaceChildren();
        if (desksEl) desksEl.replaceChildren();
        if (bondsCard) bondsCard.hidden = true;
        if (bondsBody) bondsBody.replaceChildren();
        const actionRailOff = $("action-rail");
        if (actionRailOff) actionRailOff.replaceChildren();
        $("exit-list").replaceChildren();
        $("route-box").hidden = true;
        $("status-rows").replaceChildren();
        const stripOff = $("world-strip");
        if (stripOff) { stripOff.hidden = true; stripOff.replaceChildren(); }
        const sigOff = $("signals");
        if (sigOff) sigOff.hidden = true;
        const happenedOff = $("just-happened");
        if (happenedOff) { happenedOff.hidden = true; happenedOff.textContent = ""; }
        const strainOff = $("strain-line");
        if (strainOff) { strainOff.hidden = true; strainOff.textContent = ""; }
        ["sys-rumors","sys-comms","sys-archive","sys-contest","sys-unclaimed","sys-offices"].forEach((id) => {
          const n = $(id); if (n) n.hidden = true;
        });
        $("meta-seq").textContent = "—";
        const cyc = $("ch-cycle");
        if (cyc) cyc.textContent = "";
        return;
      }
      const loc = Object.assign({}, obs.location, { services: obs.location.services || obs.services || [] });
      let view;
      try {
        view = toPlayerView(obs);
      } catch (err) {
        const look = lookCopyFromObservation(obs, { code: "INTERNAL", message: err && err.message });
        const h = humanizeError("INTERNAL", err && err.message);
        view = {
          worldName: look.worldLine,
          cycleLabel: "",
          locationName: look.roomName,
          locationDescription: look.roomDesc,
          cultureLine: "",
          strip: [],
          signals: [],
          actions: [],
          status: [],
          systems: { rumors: [], comms: [], archive: [], contests: [], unclaimed: [], offices: [] },
        };
        const adv = $("err-advanced");
        if (adv) adv.textContent = h.advanced || "";
      }
      $("world-line").textContent = view.worldName || "In world";
      const cyc = $("ch-cycle");
      if (cyc) cyc.textContent = view.cycleLabel;
      $("room-name").textContent = view.locationName || "Unknown place";
      $("room-desc").textContent = view.locationDescription || "";
      const customLine = view.cultureLine;
      const locCustom = $("loc-custom");
      if (locCustom) {
        locCustom.hidden = !customLine;
        locCustom.textContent = customLine;
      }
      const cond = deriveLocalCondition(loc);
      $("loc-cond").hidden = !cond;
      $("loc-cond-text").textContent = cond;
      const strainEl = $("strain-line");
      if (strainEl) {
        const strain = firstStrainLine(loc);
        strainEl.hidden = !strain;
        strainEl.textContent = strain;
      }

      const ents = loc.entities || [];
      fillEntityList($("entity-list"), state.arriving ? ents.slice(0, 4) : ents);
      if (playersEl) fillPlayersHere(playersEl, obs.players_here, obs.organizations, obs.player_id);
      if (desksEl) fillServiceDesks(desksEl, loc.services);
      if (bondsCard && bondsBody) {
        bondsCard.hidden = false;
        fillBonds(bondsBody, {
          messages: obs.messages,
          trades: obs.trades,
          organizations: obs.organizations,
        });
      }

      const exits = loc.exits || [];
      fillExitTokens($("exit-list"), exits);
      const lookExits = $("look-exits");
      if (lookExits) {
        lookExits.hidden = true;
        lookExits.textContent = "";
      }

      const rd = routeDiagram(loc.name, exits);
      if (rd.hasRoutes) {
        $("route-box").hidden = false;
        $("route-box").textContent = rd.lines.join("\\n");
      } else {
        $("route-box").hidden = true;
      }

      fillWorldStrip($("world-strip"), view.strip);
      fillSignalFeed($("signal-feed"), view.signals);
      const others = (obs.players_here || []).filter((p) => {
        const id = p && p.player_id;
        return id && id !== obs.player_id && id !== state.player_id;
      });
      const sessionActs = state.arriving ? firstSessionActs(loc, view.actions, others) : null;
      if (sessionActs) {
        fillActionRail($("action-rail"), sessionActs, loc);
        const encouraged = sessionActs[0];
        if (encouraged && $("cmd") && !$("cmd").value) $("cmd").placeholder = encouraged.cmd;
      } else {
        fillActionRail($("action-rail"), view.actions, loc);
      }
      const statusRows = (view.status || []).slice();
      if (state.handle && !statusRows.some((r) => r.label === "You")) {
        statusRows.unshift({ label: "You", value: state.handle });
      }
      fillStatusRows($("status-rows"), statusRows);
      const sys = view.systems || { rumors: [], comms: [], archive: [], contests: [], unclaimed: [], offices: [] };
      fillDisclosure($("sys-rumors"), $("rumor-list"), sys.rumors, "rumor");
      fillDisclosure($("sys-comms"), $("comms-list"), sys.comms);
      fillDisclosure($("sys-archive"), $("archive-list"), sys.archive);
      fillDisclosure($("sys-contest"), $("contest-list"), sys.contests);
      fillDisclosure($("sys-unclaimed"), $("unclaimed-list"), sys.unclaimed);
      fillDisclosure($("sys-offices"), $("office-list"), sys.offices);
      const contestList = $("contest-list");
      const contestKey = (sys.contests || []).join("\\n");
      if (contestList && contestKey && contestKey !== state.prevContestKey) {
        const first = contestList.firstElementChild;
        if (first) pulseThreshold(first);
      }
      state.prevContestKey = contestKey;
      $("meta-seq").textContent = String(obs.sequence ?? "—");
      state.prevRoomId = loc.room_id;
    }

    function paintHappened(text) {
      const happened = $("just-happened");
      if (!happened) return;
      const line = String(text || "").split("\\n")[0].trim();
      if (!line) return;
      happened.hidden = false;
      happened.replaceChildren();
      const k = document.createElement("span");
      k.className = "k";
      k.textContent = "Just happened";
      happened.append(k, document.createTextNode(line));
      pulseThreshold(happened);
    }

    function applyDisclosure(raw, code) {
      if (state.playerActs >= 3 || /^(move|walk)\\b/i.test(raw)) {
        document.body.classList.add("show-exits");
        const exits = $("exit-wrap");
        if (exits) exits.style.display = "";
      }
      if (/^(talk|message|trade|accept)\\b/i.test(raw)) {
        document.body.classList.add("show-bonds");
      }
      if (String(code || "").toUpperCase() === "BUDGET_EXCEEDED") {
        const bite = $("bite-status");
        if (bite) {
          bite.hidden = false;
          bite.textContent = resourceBiteLabel(code, raw);
        }
      }
      if (state.playerActs >= 5) setArrive(false);
    }

    async function sendCommand(line, opts) {
      if (!state.token || state.busy) return;
      const silent = !!(opts && opts.silent);
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
        $("cmd").value = "";
        if (!silent) {
          const line = String(consequence).split("\\n")[0].trim();
          paintHappened(line);
          if (state.playerActs >= 1) {
            pushTrailItems([{ kind: "you", title: line }]);
          }
          state.playerActs += 1;
          applyDisclosure(raw, "");
        }
        if (res.observation && res.observation.world_name) state.worldName = res.observation.world_name;
        state.attachCode = "";
        state.attachReason = "";
        notice("");
      } catch (e) {
        const h = humanizeError(e.code, e.message);
        let primary = h.primary;
        state.attachCode = e.code || "";
        state.attachReason = primary;
        if (e.observation && e.observation.world_name) state.worldName = e.observation.world_name;
        if (e.code === "NOT_AUTHORIZED" || /dev-token disabled/i.test(e.message || "")) {
          state.token = null;
          try { sessionStorage.removeItem("noema.play.token"); } catch (_) {}
          setSessionUi(false);
          notice("");
          sessionNotice(primary, "bad");
        } else {
          if (e.choices && e.choices.length) primary = primary + "\\n" + e.choices.map((c, i) => (i + 1) + ". " + c).join("\\n");
          const failLine = primary.split("\\n")[0];
          paintHappened(failLine);
          if (state.playerActs >= 1) pushTrailItems([{ kind: "fail", title: failLine }]);
          $("err-advanced").textContent = h.advanced || "";
          notice("");
          if (!silent) {
            state.playerActs += 1;
            applyDisclosure(raw, e.code);
          }
          renderObs(e.observation || null);
        }
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
      sessionNotice("Entering…");
      try {
        let handle = (
          ($("arrive-handle") && $("arrive-handle").value) ||
          ($("handle") && $("handle").value) ||
          state.handle ||
          ""
        ).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
        const pasted = readPastedToken();
        if (handle.length < 2 && (preToken || state.token) && !pasted) {
          state.busy = false;
          setSessionUi(true);
          if ($("arrive-name")) $("arrive-name").hidden = false;
          const ah = $("arrive-handle");
          if (ah) ah.focus();
          return;
        }
        if (handle.length < 2) {
          state.busy = false;
          sessionNotice("What should they call you here?", "bad");
          $("handle").focus();
          return;
        }
        state.handle = handle;
        try { sessionStorage.setItem("noema.play.handle", handle); } catch (_) {}
        if (preToken) {
          state.token = preToken;
          state.player_id = "session";
          state.controller_id = "browser";
        } else if (pasted) {
          state.token = pasted;
          state.player_id = "token";
          state.controller_id = "browser";
        } else if (state.env === "production") {
          throw Object.assign(new Error("Request a play link to enter. If you already have a token, paste it under Advanced."), { code: "NOT_AUTHORIZED" });
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
        if ($("arrive-name")) $("arrive-name").hidden = true;
        setSessionUi(true);
        state.busy = false;
        sessionNotice("");
        await sendCommand("enter", { silent: true });
        await sendCommand("look", { silent: true });
      } catch (e) {
        const h = humanizeError(e.code, e.message);
        let msg = h.primary;
        if (e.code === "NOT_AUTHORIZED" || /dev-token disabled/i.test(e.message || "")) {
          msg = e.message || "Request a play link to enter. If you already have a token, paste it under Advanced.";
          state.token = null;
          try { sessionStorage.removeItem("noema.play.token"); } catch (_) {}
          setSessionUi(false);
          notice("");
          sessionNotice(msg, "bad");
        } else if (state.token) {
          setSessionUi(true);
          sessionNotice("");
          notice(msg, "bad");
          state.attachCode = e.code || state.attachCode;
          state.attachReason = msg;
          if (e.observation) renderObs(e.observation);
          else renderObs(null);
          pushTrailItems([{ kind: "fail", title: (msg || "Action failed.").split("\\n")[0] }]);
        } else {
          setSessionUi(false);
          sessionNotice(msg, "bad");
        }
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
    const arriveOk = $("arrive-ok");
    if (arriveOk) arriveOk.addEventListener("click", () => enterWorld(state.token));
    const arriveHandle = $("arrive-handle");
    if (arriveHandle) {
      arriveHandle.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); enterWorld(state.token); }
      });
    }
    const tokenPaste = $("token-paste");
    if (tokenPaste) {
      tokenPaste.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); enterWorld(); }
      });
    }
    $("leave").addEventListener("click", leave);
    $("cmd-form").addEventListener("submit", (e) => {
      e.preventDefault();
      sendCommand($("cmd").value);
    });
    const hereOpen = $("here-open");
    const hereClose = $("here-close");
    const hereBack = $("here-backdrop");
    if (hereOpen) hereOpen.addEventListener("click", () => setHereOpen(true));
    if (hereClose) hereClose.addEventListener("click", () => setHereOpen(false));
    if (hereBack) hereBack.addEventListener("click", () => setHereOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const sheet = $("here-sheet");
      if (!sheet || !sheet.classList.contains("is-open")) return;
      e.preventDefault();
      setHereOpen(false);
    });
    document.body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cmd]");
      if (!b) return;
      const c = b.getAttribute("data-cmd") || "";
      if (c.endsWith(" ") || c.endsWith("=") || c.endsWith('"')) {
        $("cmd").value = c;
        setHereOpen(false);
        $("cmd").focus();
      } else {
        setHereOpen(false);
        sendCommand(c);
      }
    });

    (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
        if (saved && saved.handle) $("handle").value = saved.handle;
      } catch (_) {}
      const tok = sessionStorage.getItem("noema.play.token");
      const handle = sessionStorage.getItem("noema.play.handle");
      if (handle) {
        $("handle").value = handle;
        state.handle = handle;
        if ($("arrive-handle")) $("arrive-handle").value = handle;
      }
      if (tok) {
        state.token = tok;
        setSessionUi(true);
      }
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
        if (ready && ready.world && ready.world.world_name) state.worldName = ready.world.world_name;
        if (ready && (ready.play_blocked || (ready.world && ready.world.playable === false))) {
          state.attachCode = ready.code || "WORLD_NOT_READY";
          state.attachReason = humanizeError(state.attachCode, "").primary;
          if (banner) {
            banner.hidden = false;
            banner.textContent = "The Reach is still. Wait.";
            pulseThreshold(banner);
          }
        }
      } catch (_) {}
      renderObs(null);
      renderTrail();

      const qs = new URLSearchParams(location.search);
      if (qs.get("error") === "1") {
        sessionNotice("That login link is expired or invalid. Request a new one.", "bad");
      }
      if (tok) {
        await enterWorld(tok);
      } else if (qs.get("autostart") === "1" && state.env !== "production") {
        await enterWorld();
      }
    })();
  })();
  `;
}
