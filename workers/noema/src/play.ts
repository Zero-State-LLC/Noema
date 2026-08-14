/** Text-first PLAY — situation, opportunity, action, consequence. */

import { playEmailGateMarkup } from "./play-login-html";
import { playUiRuntimeSource } from "./play-ui";
import { productShell } from "./shell";

const EXTRA = `
.role-place,.role-you{color:var(--copper)}
.role-here{color:var(--teal)}
.role-fail{color:var(--ember)}
.role-ok{color:var(--ok)}
#play-chamber{display:none}
body.is-chamber .top,body.is-chamber .foot{display:none}
body.is-chamber #main.wrap{width:100%;max-width:none;padding:0;margin:0}
body.is-chamber #play-door{display:none}
body.is-chamber #play-chamber{
  display:grid;grid-template-rows:auto 1fr auto;height:100dvh;min-height:100dvh;overflow:hidden;
}
.ch-mast{
  display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:center;
  min-height:2.6rem;padding:.45rem .85rem;border-bottom:1px solid var(--line);
  font:500 .68rem/1.3 var(--font-mono);letter-spacing:.06em;text-transform:uppercase;
}
.ch-mast a{color:var(--ink);text-decoration:none}
.ch-mast #leave{margin-left:auto;text-transform:none;letter-spacing:0}
.ch-body{
  display:grid;grid-template-columns:minmax(0,1fr) 16rem;min-height:0;overflow:auto;
}
@media(max-width:900px){
  .ch-body{grid-template-columns:1fr}
  .ch-rail{order:2}
}
.ch-scroll{min-height:0;overflow:auto;padding:.85rem 1rem 1.25rem}
.look .where{margin:0 0 .2rem;font:500 .62rem var(--font-mono);letter-spacing:.14em}
.look #room-name,#room-name{
  margin:0 0 .35rem;font:550 clamp(1.4rem,3vw,2.1rem)/1.05 var(--font-display);
  color:var(--copper);
}
.look #room-desc{margin:0;max-width:44rem;color:var(--muted)}
.look #loc-custom{margin:.55rem 0 0;max-width:44rem;color:var(--ink)}
.look #loc-cond{margin:.65rem 0 0}
.look #look-exits{margin:.45rem 0 0;color:var(--muted);font-size:.84rem}
.ch-rail{
  border-left:1px solid var(--line);padding:.75rem .8rem;overflow:auto;
  font-size:.84rem;min-height:0;
}
.ch-rail h3,.ch-rail h4{
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
.trail .k.world{color:var(--muted)}
.trail .t{color:var(--ink)}
.trail .d{color:var(--muted)}
.ch-cmd{
  border-top:1px solid var(--line);padding:.65rem .85rem .75rem;
  background:rgba(12,18,24,.97);position:sticky;bottom:0;z-index:2;
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
`;

export function playHtml(): string {
  const body = `
  <div id="play-door">
    <article class="card gate" id="session-card">
      <p class="kicker">Play</p>
      <div id="session-out">
        ${playEmailGateMarkup({ operatorLink: false })}
        <label for="handle">Your name</label>
        <input id="handle" value="player1" autocomplete="username" maxlength="32"/>
        <details class="adv" id="token-primary">
          <summary>Advanced</summary>
          <label for="token-paste">Access token</label>
          <input id="token-paste" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
          <p class="empty" style="margin-top:.45rem" id="token-hint">Production entry requires an operator-issued access token. Public minting is disabled. Paste it in the Access token field.</p>
        </details>
        <button class="btn primary block" id="enter" type="button" style="margin-top:.65rem">Enter world</button>
        <p class="empty" style="margin-top:.65rem"><a href="/connect">Connect an agent</a></p>
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
          <p id="loc-custom" hidden></p>
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
      document.body.classList.toggle("is-chamber", on);
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
      $("trail").innerHTML = state.trail.length
        ? renderTrailHtml(state.trail)
        : "";
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
        $("world-line").textContent = "—";
        $("room-name").textContent = "";
        $("room-desc").textContent = "Waiting for the world.";
        const locCustomOff = $("loc-custom");
        if (locCustomOff) { locCustomOff.hidden = true; locCustomOff.textContent = ""; }
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
      const loc = Object.assign({}, obs.location, { services: obs.location.services || obs.services || [] });
      $("world-line").textContent = obs.world_name || "In world";
      const cyc = $("ch-cycle");
      if (cyc) cyc.textContent = typeof obs.cycle === "number" ? "Cycle " + obs.cycle : "";
      $("room-name").textContent = loc.name || "Unknown place";
      $("room-desc").textContent = loc.description || "";
      const customLine = (obs.culture_lines && obs.culture_lines[0]) || "";
      const locCustom = $("loc-custom");
      if (locCustom) {
        locCustom.hidden = !customLine;
        locCustom.textContent = customLine;
      }
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
      $("exit-list").innerHTML = renderExitTokensHtml(exits);
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

      const rd = routeDiagram(loc.name, exits);
      if (rd.hasRoutes) {
        $("route-box").hidden = false;
        $("route-box").textContent = rd.lines.join("\\n");
      } else {
        $("route-box").hidden = true;
      }

      $("opp-list").innerHTML = renderOpportunitiesHtml(loc);

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
        if (e.code === "NOT_AUTHORIZED" || /dev-token disabled/i.test(e.message || "")) {
          state.token = null;
          try { sessionStorage.removeItem("noema.play.token"); } catch (_) {}
          setSessionUi(false);
          notice("");
          sessionNotice(primary, "bad");
        } else {
          if (e.choices && e.choices.length) primary = primary + "\\n" + e.choices.map((c, i) => (i + 1) + ". " + c).join("\\n");
          notice(primary, "bad");
          $("err-advanced").textContent = h.advanced || "";
          pushTrailItems([{ kind: "fail", title: primary.split("\\n")[0] }]);
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
        setSessionUi(true);
        state.busy = false;
        sessionNotice("");
        await sendCommand("enter");
        await sendCommand("look");
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
      const tok = sessionStorage.getItem("noema.play.token");
      const handle = sessionStorage.getItem("noema.play.handle");
      if (handle) {
        $("handle").value = handle;
        state.handle = handle;
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
      if (tok) {
        await enterWorld(tok);
      } else if (qs.get("autostart") === "1" && state.env !== "production") {
        await enterWorld();
      }
    })();
  })();
  `;
}
