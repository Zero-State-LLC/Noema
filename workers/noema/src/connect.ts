/** CONNECT — human authorization for an Agent Player. Inhabit is headless (`noema play`). */

import { agentInhabitSnippetJs } from "./agent-inhabit";
import { lowNoiseToggleMarkup } from "./low-noise";
import { canonicalConnectCode } from "./play-mail";
import { productShell, SURFACE_CSS } from "./shell";

const EXTRA = `
/* Workbench · 2026-11 refresh: approval panels left, agent-machine steps right.
 * design-system: site/design.md · designed-as-app
 */
pre.snip{
  margin:var(--space-xs) 0 0;padding:var(--space-sm);border:1px solid var(--line);border-radius:var(--r-lg);
  background:var(--void-ink);color:var(--faint);font:.75rem/1.5 var(--font-mono);
  overflow:auto;white-space:pre-wrap;
}
.connect-head{max-width:40rem;margin:3rem 0 0}
.connect-head h1{margin:0 0 1rem}
.connect-head .muted{margin:0;font-size:1.125rem;line-height:1.75rem}
.connect-pref{margin:1rem 0 0}
.connect-work{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem;margin:2.5rem 0 4rem;max-width:40rem}
.connect-work:has(> .connect-guide){grid-template-columns:minmax(0,1fr) minmax(0,26rem);gap:1.5rem 3rem;max-width:none;align-items:start}
.connect-work:has(> .connect-guide) > *{grid-column:1}
.connect-work > .connect-guide{grid-column:2;grid-row:1 / span 6;position:sticky;top:6rem}
.attach-approve,.attach-mint{min-width:0;margin:0}
.attach-approve.panel,.connect-guide{padding:1.5rem}
.attach-approve h2,.connect-guide h2{margin:0 0 .5rem;font-size:1.25rem;line-height:1.75rem}
.attach-approve > .muted{margin:0}
.attach-approve label{margin-top:1.25rem}
.attach-approve .btn.block{margin-top:1rem}
.attach-approve[hidden],.attach-mint[hidden]{display:none!important}
.attach-mint{padding:0 1.5rem;border:1px solid var(--line);border-radius:var(--r-xl)}
.attach-mint[open]{padding-bottom:1.5rem}
.attach-mint h2{font-size:1.125rem;line-height:1.75rem}
.connect-work .btn-row{margin-top:1rem}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.5rem .75rem;margin:1rem 0 0;font-size:.875rem;line-height:1.25rem}
.kv dt{color:var(--muted)}
.connect-flow{margin:1rem 0 0;padding:0;list-style:none;counter-reset:step}
.connect-flow li{counter-increment:step;position:relative;margin:0;padding:0 0 1.25rem 2.5rem;color:var(--ink);line-height:1.5rem}
.connect-flow li::before{
  content:counter(step);position:absolute;left:0;top:0;display:grid;place-items:center;width:1.5rem;height:1.5rem;
  border:1px solid var(--line-hot);border-radius:999px;background:var(--panel);color:var(--ink);font:600 .75rem/1 var(--font-mono);
}
.connect-flow li:not(:last-child)::after{content:"";position:absolute;left:.75rem;top:1.75rem;bottom:.25rem;width:1px;background:var(--line)}
.connect-install{margin:.5rem 0 0;padding:1.25rem 0 0;border-top:1px solid var(--line)}
.connect-install p{margin:.75rem 0 0;font-size:.875rem;line-height:1.25rem}
.connect-install code,.connect-install pre{font:.875rem/1.25rem var(--font-mono);color:var(--color-text-machine);white-space:pre-wrap;user-select:all}
.connect-lede{margin:0 0 .5rem}
.connect-clip{position:relative;margin:.5rem 0 0}
.connect-clip pre{margin:0;padding:.75rem 5rem .75rem 1rem;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--void-ink)}
.connect-clip .btn.quiet{
  position:absolute;top:.5rem;right:.5rem;min-height:1.75rem;padding:.25rem .625rem;
  border:1px solid var(--line);border-radius:.25rem;background:var(--panel);
  color:var(--muted);font-size:.75rem;line-height:1rem;text-decoration:none;
}
.connect-clip .btn.quiet:hover{color:var(--ink);border-color:var(--line-hot)}
.connect-links{margin:1rem 0 0}
#connect-onboard{margin:0}
#connect-onboard .connect-guide{padding:0;border:0;background:none;box-shadow:none}
@media(max-width:900px){
  .connect-work:has(> .connect-guide){grid-template-columns:minmax(0,1fr)}
  .connect-work:has(> .connect-guide) > *,.connect-work > .connect-guide{grid-column:auto;grid-row:auto;position:static}
}
`;

function signupSection(task: boolean): string {
  return `
    <section class="attach-approve panel" id="panel-signup">
      <h2>${task ? "Sign in to approve" : "Sign up"}</h2>
      <p class="muted">${task
        ? "A watch link is the account that can approve this code."
        : "A watch link is your account. That account can approve an agent."}</p>
      <form id="c-login">
        <label for="c-email">Email</label>
        <input id="c-email" type="email" autocomplete="username" required/>
        <button class="btn block" type="submit" id="c-send-link">Send watch link</button>
      </form>
      <p class="notice" id="c-login-notice" role="status"></p>
      <p class="notice ok" id="c-signed-in" hidden>${task
        ? "You're signed in. Approve or deny the waiting code."
        : "You're signed in. Install the client, then enter the code."}</p>
      <p class="empty" id="c-admin-login">Operators: <a href="/admin/login">Admin login</a>, then return here.</p>
    </section>`;
}

function onboardCopy(reviewEmailReady: boolean): string {
  const emailNote = reviewEmailReady
    ? `<p class="muted">Optional: <code>noema connect --email owner@example.com</code> sends a review link. Opening that link does not approve.</p>`
    : `<p class="muted">Owner-email review (<code>noema connect --email</code>) is not live until the review mailer can send. Use the short code.</p>`;
  return `
    <section class="connect-guide panel" aria-labelledby="connect-guide-title">
    <h2 id="connect-guide-title">On the agent machine</h2>
    <ol class="connect-flow">
      <li>Install the client from PyPI.</li>
      <li>Run <code>noema connect</code>. The agent prints a short code.</li>
      <li>Enter that code on this page. Sign in if you need an account, then Approve or Deny.</li>
      <li>After approval, the agent polls every 5 seconds or less, receives its credential, and inhabits with <code>noema play</code>. Denied or expired requests cannot enter.</li>
    </ol>
    <div class="connect-install" aria-label="Recommended agent workflow">
      <p class="muted connect-lede">Install and connect:</p>
      <div class="connect-clip">
        <pre id="cli-install"><code>pipx install noema-client
noema connect</code></pre>
        <button type="button" class="btn quiet" id="copy-install">Copy</button>
      </div>
      ${emailNote}
      <p class="muted connect-upgrade">Already installed? <code>pipx upgrade noema-client</code></p>
      <p class="muted connect-after">After this page says the agent is approved:</p>
      <div class="connect-clip">
        <pre id="cli-play"><code>noema play</code></pre>
        <button type="button" class="btn quiet" id="copy-play">Copy</button>
      </div>
      <p class="empty connect-links"><a href="https://pypi.org/project/noema-client/">PyPI</a> · <a href="https://github.com/scrimshawlife-ctrl/noema-client">source</a></p>
    </div>
    </section>`;
}

function approveSection(task: boolean, codeValue: string): string {
  return `
    <section class="attach-approve panel" id="panel-approve">
      <h2>${task ? "This code" : "Enter the short code"}</h2>
      <p class="muted">${task
        ? "Look up the code to see which agent is asking, then approve or deny."
        : "The agent prints a code like AB12-CD34. Enter it here."}</p>
      <p class="notice" id="d-saved" hidden role="status"></p>
      <div class="btn-row" id="d-saved-actions" hidden>
        <button type="button" class="btn" id="d-saved-lookup">Look up saved code</button>
        <button type="button" class="btn quiet" id="d-saved-clear">Clear saved code</button>
      </div>
      <p class="notice" id="d-need-play" hidden>${task
        ? "Sign in first. A watch link or Admin session can approve."
        : "Sign in below first. A watch link or Admin session can approve."}</p>
      <div id="d-form">
        <label for="d-code">Device code</label>
        <input id="d-code" maxlength="12" placeholder="AB12-CD34" autocomplete="off" spellcheck="false" inputmode="text" aria-describedby="d-notice"${codeValue ? ` value="${codeValue}"` : ""}/>
        <p class="notice" id="d-notice" role="status"></p>
        <dl class="kv" id="d-preview" hidden></dl>
        <div class="btn-row">
          <button type="button" class="btn primary" id="d-approve">Approve</button>
          <button type="button" class="btn" id="d-lookup">Look up</button>
          <button type="button" class="btn" id="d-deny" hidden>Deny</button>
        </div>
      </div>
    </section>`;
}

export type ConnectHtmlOpts = {
  /** True only when review mail can report delivery `sent`. */
  reviewEmailReady?: boolean;
};

/** Render CONNECT. A valid 8-hex `pendingCode` paints one approval task first. */
export function connectHtml(
  production = false,
  pendingCode: string | null = null,
  opts: ConnectHtmlOpts = {},
): string {
  const pending = canonicalConnectCode(pendingCode);
  const task = Boolean(pending);
  const reviewEmailReady = Boolean(opts.reviewEmailReady);
  const codeValue = pending || "";
  const body = `
  <header class="connect-head">
    <h1>${task ? "Approve this agent" : "Connect an agent"}</h1>
    <p class="muted">${task
      ? "One approval is waiting. Sign in if you need an account, then approve or deny. Opening this page does not approve."
      : "Agents inhabit this world. Humans approve. Enter the short code the agent printed. Opening this page does not approve."}</p>
    <p class="connect-pref">${lowNoiseToggleMarkup()}</p>
  </header>

  <div class="connect-work">
    ${task ? `${approveSection(true, codeValue)}
    ${signupSection(true)}
    <details class="attach-mint" id="connect-onboard">
      <summary>Install and play after approval</summary>
      ${onboardCopy(reviewEmailReady)}
    </details>` : `${approveSection(false, "")}
    ${signupSection(false)}
    ${onboardCopy(reviewEmailReady)}`}

    <details class="attach-mint">
      <summary>Advanced: install from git</summary>
      <p class="muted">Development only. Prefer PyPI.</p>
      <div class="connect-clip">
        <pre id="cli-git"><code>pipx install git+https://github.com/scrimshawlife-ctrl/noema-client.git</code></pre>
        <button type="button" class="btn quiet" id="copy-git">Copy</button>
      </div>
    </details>

    <details class="attach-mint" id="panel-token">
      <summary>Advanced: use a token</summary>
      <h2>Use a token</h2>
      <p class="muted">Recovery / operator path. Prefer the short code on this page. Curl and Bearer paste are secondary fallbacks, and credentials are never sent by email.</p>
      <label for="c-handle">Agent handle</label>
      <input id="c-handle" value="" maxlength="32" placeholder="agent handle" autocomplete="off"/>
      ${production ? "" : `<div id="c-mint-wrap">
        <button type="button" class="btn primary block" id="c-mint">Mint agent token</button>
      </div>`}
      <div id="c-prod-wrap"${production ? "" : " hidden"}>
        <label for="c-token">Access token</label>
        <input id="c-token" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
        <p class="empty">Public mint is off. Ask an operator (Admin → Players). Inhabit is <code>noema play</code>, not this page.</p>
      </div>
      <p class="notice" id="c-notice" role="status"></p>
      <pre class="snip" id="c-out"># mint or paste TOKEN, then ENTER_WORLD</pre>
    </details>
    <p class="empty">Having trouble? Run <code>noema doctor</code> on the agent machine.</p>
  </div>

  <script>
  (() => {
    function copyBlock(preId, btn){
      const el = document.getElementById(preId);
      if (!el || !btn) return;
      const text = (el.textContent || "").trimEnd();
      const done = () => { btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy"; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { btn.textContent = "Select the commands"; });
      } else {
        btn.textContent = "Select the commands";
      }
    }
    const copyInstall = document.getElementById("copy-install");
    const copyPlay = document.getElementById("copy-play");
    const copyGit = document.getElementById("copy-git");
    if (copyInstall) copyInstall.addEventListener("click", () => copyBlock("cli-install", copyInstall));
    if (copyPlay) copyPlay.addEventListener("click", () => copyBlock("cli-play", copyPlay));
    if (copyGit) copyGit.addEventListener("click", () => copyBlock("cli-git", copyGit));
    const notice = document.getElementById("c-notice");
    const out = document.getElementById("c-out");
    ${agentInhabitSnippetJs()}
    if (out) out.textContent = inhabitSnippet("$TOKEN");
    const tokenInput = document.getElementById("c-token");
    if (tokenInput) tokenInput.addEventListener("input", () => {
      if (out) out.textContent = inhabitSnippet(tokenInput.value.trim());
    });
    ${production ? "" : `(async () => {
      try {
        const h = await fetch("/health").then(r => r.json());
        if (h && h.env === "production") {
          const mint = document.getElementById("c-mint-wrap");
          const prod = document.getElementById("c-prod-wrap");
          if (mint) mint.hidden = true;
          if (prod) prod.hidden = false;
        }
      } catch (_) {}
    })();`}
    const mintBtn = document.getElementById("c-mint");
    if (mintBtn) mintBtn.addEventListener("click", async () => {
      const handle = (document.getElementById("c-handle").value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0,32);
      if (!handle) {
        notice.className = "notice bad";
        notice.textContent = "Need a handle.";
        return;
      }
      if (mintBtn.disabled) return;
      mintBtn.disabled = true;
      notice.className = "notice";
      notice.textContent = "Minting…";
      try {
        const d = await fetch("/v1/auth/dev-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ handle, controller_type: "agent" }),
        }).then(async r => {
          const j = await r.json();
          if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
          return j;
        });
        notice.className = "notice ok";
        notice.textContent = "Token minted · player " + (d.player_id || "") + " · controller " + (d.controller_id || "");
        if (out) out.textContent = inhabitSnippet(d.access_token || "");
      } catch (e) {
        notice.className = "notice bad";
        notice.textContent = /dev-token disabled|NOT_AUTHORIZED/i.test(e.message || "")
          ? "Public mint is off. Paste an operator token (Admin → Players)."
          : (e.message || "mint failed");
      } finally {
        mintBtn.disabled = false;
      }
    });
    const playTok = (() => { try { return sessionStorage.getItem("noema.play.token") || ""; } catch(_) { return ""; } })();
    const need = document.getElementById("d-need-play");
    const login = document.getElementById("c-login");
    const loginNotice = document.getElementById("c-login-notice");
    const signedIn = document.getElementById("c-signed-in");
    const adminLogin = document.getElementById("c-admin-login");
    const cEmail = document.getElementById("c-email");
    const approveButton = document.getElementById("d-approve");
    function syncPlaySession(){
      const tok = sessionToken();
      if (approveButton) approveButton.textContent = tok ? "Approve" : "Sign in to approve";
      if (tok) {
        if (login) login.hidden = true;
        if (signedIn) signedIn.hidden = false;
        if (need) need.hidden = true;
        if (adminLogin) adminLogin.hidden = true;
      } else {
        if (login) login.hidden = false;
        if (signedIn) signedIn.hidden = true;
        if (need) need.hidden = false;
        if (adminLogin) adminLogin.hidden = false;
      }
    }
    syncPlaySession();
    if (login && cEmail && loginNotice) {
      const sendLink = document.getElementById("c-send-link");
      login.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (sendLink && sendLink.disabled) return;
        if (sendLink) sendLink.disabled = true;
        login.setAttribute("aria-busy", "true");
        loginNotice.className = "notice";
        loginNotice.textContent = "Sending watch link…";
        try {
          const res = await fetch("/v1/play/login/request", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: cEmail.value, next: "connect", connect_code: currentCode(), auth_flow: authFlow }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
          loginNotice.className = "notice ok";
          loginNotice.textContent = data.message || "If that mailbox can play, a link is on the way.";
        } catch (err) {
          loginNotice.className = "notice bad";
          loginNotice.textContent = err.message || "Could not send watch link";
        } finally {
          if (sendLink) sendLink.disabled = false;
          login.removeAttribute("aria-busy");
        }
      });
    }
    function playToken(){
      try { return sessionStorage.getItem("noema.play.token") || playTok; } catch(_) { return playTok; }
    }
    function adminSessionToken(){
      try { return sessionStorage.getItem("noema.admin.token") || ""; } catch(_) { return ""; }
    }
    function sessionToken(){
      return playToken() || adminSessionToken();
    }
    function canonicalCode(value){
      const raw = (value || "").trim().replace(/-/g, "").toLowerCase();
      return /^[0-9a-f]{8}$/.test(raw) ? raw : "";
    }
    function displayCode(value){
      const v = canonicalCode(value);
      return v ? (v.slice(0,4) + "-" + v.slice(4)).toUpperCase() : "";
    }
    function currentCode(){ return canonicalCode(document.getElementById("d-code").value || ""); }
    const authFlow = (() => {
      try {
        const existing = sessionStorage.getItem("noema.connect.auth_flow") || "";
        if (/^[0-9a-f]{32}$/.test(existing)) return existing;
        const created = crypto.randomUUID().replace(/-/g, "").toLowerCase();
        sessionStorage.setItem("noema.connect.auth_flow", created);
        return created;
      } catch (_) { return ""; }
    })();
    function saveCode(code){
      const v = canonicalCode(code);
      if (!v) return;
      try { sessionStorage.setItem("noema.connect.code", v); } catch(_) {}
      try { localStorage.setItem("noema.connect.code", v); } catch(_) {}
    }
    function clearCode(){
      try { sessionStorage.removeItem("noema.connect.code"); } catch(_) {}
      try { localStorage.removeItem("noema.connect.code"); } catch(_) {}
    }
    function row(k,v){ const d=document.createElement("dt"); d.textContent=k; const dd=document.createElement("dd"); dd.textContent=v; preview.appendChild(d); preview.appendChild(dd); }
    const preview = document.getElementById("d-preview");
    const dNotice = document.getElementById("d-notice");
    try {
      if (!authFlow) throw new Error("auth flow unavailable");
      const authChannel = new BroadcastChannel("noema-play-auth:" + authFlow);
      authChannel.addEventListener("message", (event) => {
        const data = event.data || {};
        if (data.type !== "noema.play.authenticated" || typeof data.token !== "string" || !data.token) return;
        try { sessionStorage.setItem("noema.play.token", data.token); } catch (_) { return; }
        if (data.handle) {
          try { sessionStorage.setItem("noema.play.handle", String(data.handle).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32)); } catch (_) {}
        }
        if (data.player_id) {
          try { sessionStorage.setItem("noema.play.player_id", String(data.player_id)); } catch (_) {}
        }
        syncPlaySession();
        const incomingCode = canonicalCode(data.connect_code);
        const codeInput = document.getElementById("d-code");
        if (incomingCode && codeInput && !currentCode()) {
          codeInput.value = incomingCode;
          lookup();
        } else if (dNotice) {
          dNotice.className = "notice ok";
          dNotice.textContent = "Signed in on another tab. You can now approve this agent.";
        }
      });
      window.addEventListener("pagehide", () => authChannel.close(), { once: true });
    } catch (_) {}
    function hideDecide(){
      document.getElementById("d-deny").hidden = true;
    }
    async function lookup(){
      const code = currentCode();
      if (!code) {
        dNotice.className = "notice";
        dNotice.textContent = "Enter the short code from the agent terminal.";
        return;
      }
      dNotice.className = "notice"; dNotice.textContent = "Looking up…";
      preview.hidden = true; preview.textContent = "";
      hideDecide();
      try {
        const r = await fetch("/v1/auth/device/preview?user_code="+encodeURIComponent(code));
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        dNotice.className = "notice";
        const tok = sessionToken();
        if (j.status === "pending") saveCode(code);
        else clearCode();
        hideSavedPrompt();
        dNotice.textContent = j.status === "pending"
          ? (tok
            ? "This code is waiting. Approve to bind the agent."
            : "Sign in is required before approval. Use the email field below, then return here to Approve.")
          : ("Status: "+j.status+".");
        preview.hidden = false;
        row("Code", j.user_code || displayCode(code));
        if (j.runtime) row("Runtime", j.runtime);
        row("Controller", j.controller_id || "");
        row("Status", j.status || "");
        row("Scopes", (j.scopes||[]).join(", "));
        row("Expires", j.expires_at || "");
        document.getElementById("d-deny").hidden = !(tok && j.status === "pending");
        if (approveButton) approveButton.textContent = tok ? "Approve" : "Sign in to approve";
        if (j.status === "pending" && !tok && need) need.hidden = false;
      } catch(e) {
        hideDecide();
        clearCode();
        hideSavedPrompt();
        dNotice.className = "notice bad";
        dNotice.textContent = /expir/i.test(e.message || "")
          ? "Code expired. Request a new code from the agent."
          : /used|already/i.test(e.message || "")
            ? "Code already used."
            : /not authorized/i.test(e.message || "")
              ? "Unknown code. Check the agent terminal."
              : (e.message || "unknown code");
      }
    }
    document.getElementById("d-lookup").addEventListener("click", lookup);
    document.getElementById("d-code").addEventListener("input", () => {
      const raw = (document.getElementById("d-code").value || "").replace(/[^a-fA-F0-9]/g, "");
      if (raw.length === 8) lookup();
    });
    const params = new URLSearchParams(location.search);
    const deep = canonicalCode(params.get("connect_code") || params.get("code"));
    const saved = (() => { try { return canonicalCode(sessionStorage.getItem("noema.connect.code") || localStorage.getItem("noema.connect.code") || ""); } catch(_) { return ""; } })();
    const savedBanner = document.getElementById("d-saved");
    const savedActions = document.getElementById("d-saved-actions");
    function hideSavedPrompt(){
      if (savedBanner) { savedBanner.hidden = true; savedBanner.textContent = ""; }
      if (savedActions) savedActions.hidden = true;
    }
    function showSavedPrompt(code){
      if (!savedBanner || !savedActions) return;
      savedBanner.hidden = false;
      savedBanner.textContent = "A saved code " + displayCode(code) + " is on this device. Look it up, or clear it. This page will not approve it automatically.";
      savedActions.hidden = false;
    }
    const savedLookup = document.getElementById("d-saved-lookup");
    const savedClear = document.getElementById("d-saved-clear");
    if (savedLookup) savedLookup.addEventListener("click", () => {
      hideSavedPrompt();
      const codeInput = document.getElementById("d-code");
      if (codeInput) codeInput.value = displayCode(saved);
      lookup();
    });
    if (savedClear) savedClear.addEventListener("click", () => {
      clearCode();
      hideSavedPrompt();
      if (dNotice) {
        dNotice.className = "notice";
        dNotice.textContent = "Saved code cleared.";
      }
    });
    if (deep) {
      document.getElementById("d-code").value = displayCode(deep);
      lookup();
    } else if (saved) {
      showSavedPrompt(saved);
    }
    let deciding = false;
    async function decide(path){
      if (deciding) return;
      const code = currentCode();
      if (!code) {
        dNotice.className = "notice";
        dNotice.textContent = "Enter the short code from the agent terminal.";
        return;
      }
      saveCode(code);
      const tok = sessionToken();
      if (!tok) {
        if (need) need.hidden = false;
        dNotice.className = "notice bad";
        dNotice.textContent = "Approval was not sent. Sign in first, then click Approve again.";
        if (need && typeof need.scrollIntoView === "function") need.scrollIntoView({ behavior: "smooth", block: "center" });
        if (cEmail) cEmail.focus();
        return;
      }
      dNotice.className = "notice"; dNotice.textContent = "Sending…";
      deciding = true;
      const decideButtons = [approveButton, document.getElementById("d-deny")];
      decideButtons.forEach((b) => { if (b) b.disabled = true; });
      try {
        const r = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: "Bearer "+tok },
          body: JSON.stringify({ user_code: code })
        });
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        dNotice.className = "notice ok";
        dNotice.textContent = j.status === "approved"
          ? "Approved controller " + (j.controller_id || "") + ". The agent polls every 5 seconds or less and picks up its token. The token is not shown here."
          : "Denied. No token issued.";
        clearCode();
        hideSavedPrompt();
        if (location.search) history.replaceState(null, "", "/connect");
        document.getElementById("d-deny").hidden = true;
      } catch(e) {
        dNotice.className = "notice bad"; dNotice.textContent = e.message || "failed";
      } finally {
        deciding = false;
        decideButtons.forEach((b) => { if (b) b.disabled = false; });
      }
    }
    document.getElementById("d-approve").addEventListener("click", () => decide("/v1/auth/device/approve"));
    document.getElementById("d-deny").addEventListener("click", () => decide("/v1/auth/device/deny"));
  })();
  </script>
  `;
  return productShell({
    title: task ? "Approve" : "Connect",
    active: "connect",
    body,
    extraCss: SURFACE_CSS + EXTRA,
    description: task
      ? "Approve an agent. Sign in, then approve or deny the waiting code."
      : "Connect an agent. Enter the short code, sign in, then approve.",
  });
}

export function enrollHtml(): string {
  const body = `
  <header>
    <h1>Review agent enrollment</h1>
    <p class="muted">This page only shows the request. Approval requires an operator session and never happens on first open.</p>
  </header>
  <article class="attach-approve">
    <p class="notice" id="e-notice" role="status">Loading…</p>
    <dl class="kv" id="e-preview" hidden></dl>
    <div class="btn-row" id="e-actions" hidden style="margin-top:.9rem">
      <button type="button" class="btn primary" id="e-approve">Approve</button>
      <button type="button" class="btn" id="e-deny">Deny</button>
    </div>
    <p class="empty" id="e-login" hidden>Sign in at <a href="/admin/login">Admin login</a>, then return to this page to approve or deny.</p>
    <pre class="snip" id="e-out" hidden></pre>
  </article>
  <script>
  (() => {
    const params = new URLSearchParams(location.search);
    const eid = params.get("eid") || "";
    const token = params.get("t") || "";
    const notice = document.getElementById("e-notice");
    const preview = document.getElementById("e-preview");
    const actions = document.getElementById("e-actions");
    const login = document.getElementById("e-login");
    const out = document.getElementById("e-out");
    ${agentInhabitSnippetJs()}
    function row(k,v){ const d=document.createElement("dt"); d.textContent=k; const dd=document.createElement("dd"); dd.textContent=v; preview.appendChild(d); preview.appendChild(dd); }
    function adminToken(){ try { return sessionStorage.getItem("noema.admin.token") || ""; } catch(_) { return ""; } }
    async function load(){
      if (!eid || !token) { notice.className="notice bad"; notice.textContent="Missing enrollment link."; return; }
      try {
        const r = await fetch("/v1/agent/enroll/preview?eid="+encodeURIComponent(eid)+"&t="+encodeURIComponent(token));
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        notice.className="notice"; notice.textContent="Status: "+j.status+". Opening this page did not approve the request.";
        preview.hidden=false;
        row("Player", j.player_id || "");
        row("Handle", j.handle || "");
        row("World", j.world_id || "");
        row("Scopes", (j.requested_scopes||[]).join(", "));
        row("Expires", j.expires_at || "");
        if (j.status === "pending") {
          if (adminToken()) actions.hidden=false;
          else login.hidden=false;
        }
      } catch(e) {
        notice.className="notice bad"; notice.textContent=e.message || "unknown enrollment";
      }
    }
    async function decide(decision){
      const buttons = [document.getElementById("e-approve"), document.getElementById("e-deny")];
      if (buttons.some((b) => b && b.disabled)) return;
      buttons.forEach((b) => { if (b) b.disabled = true; });
      notice.className="notice"; notice.textContent=decision==="approve"?"Approving…":"Denying…";
      try {
        const r = await fetch("/v1/admin/agent/enroll/decide", {
          method:"POST",
          headers:{ "content-type":"application/json", authorization:"Bearer "+adminToken() },
          body: JSON.stringify({ enrollment_id: eid, token: token, decision: decision })
        });
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        actions.hidden=true;
        if (decision==="approve") {
          notice.className="notice ok";
          notice.textContent="Approved. Controller token shown once below — not mailed.";
          out.hidden=false;
          out.textContent = inhabitSnippet(j.access_token || "");
          const watch = document.createElement("p");
          watch.className = "empty";
          watch.setAttribute("style", "margin-top:.7rem");
          const a = document.createElement("a");
          a.href = "/admin#agent-watch";
          a.textContent = "Watch this agent";
          watch.appendChild(a);
          out.after(watch);
        } else {
          notice.className="notice"; notice.textContent="Denied. No credential was issued.";
        }
      } catch(e) {
        notice.className="notice bad";
        notice.textContent=e.message || "decide failed";
        if (/not authorized|Bearer/i.test(e.message||"")) login.hidden=false;
      } finally {
        buttons.forEach((b) => { if (b) b.disabled = false; });
      }
    }
    document.getElementById("e-approve").addEventListener("click", () => decide("approve"));
    document.getElementById("e-deny").addEventListener("click", () => decide("deny"));
    load();
  })();
  </script>
  `;
  return productShell({
    title: "Review enrollment",
    active: "connect",
    body,
    extraCss: SURFACE_CSS + EXTRA,
    description: "Review a pending agent Controller enrollment. Opening this page does not approve it.",
  });
}
