/** CONNECT — human authorization for an Agent Player. Inhabit is headless (`noema play`). */

import { agentInhabitSnippetJs } from "./agent-inhabit";
import { lowNoiseToggleMarkup } from "./low-noise";
import { canonicalConnectCode } from "./play-mail";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4
 * genre: atmospheric · macrostructure: Workbench · design-system: site/design.md · designed-as-app
 */
pre.snip{
  margin:var(--space-xs) 0 0;padding:var(--space-sm);border:1px solid var(--line);border-radius:var(--r);
  background:var(--void-ink);color:var(--faint);font:.72rem/1.55 var(--font-mono);
  overflow:auto;white-space:pre-wrap;
}
.connect-head{max-width:36rem;margin:var(--space-lg) 0 0}
.connect-work{display:grid;gap:var(--space-lg);margin:var(--space-lg) 0 0;max-width:36rem}
.connect-install{margin:var(--space-sm) 0 0}
.connect-install code,.connect-install pre{font:.82rem/1.5 var(--font-mono);color:var(--faint);white-space:pre-wrap;user-select:all}
.connect-lede{margin:0 0 var(--space-2xs)}
.connect-after{margin:var(--space-sm) 0 var(--space-2xs)}
.connect-links{margin:var(--space-xs) 0 0}
.connect-flow{margin:var(--space-sm) 0 0;padding:0 0 0 var(--space-md)}
.connect-flow li{margin:var(--space-2xs) 0;color:var(--ink)}
.connect-clip{margin:var(--space-xs) 0 0}
.connect-clip .btn{margin-top:var(--space-2xs)}
.connect-work .btn-row{margin-top:var(--space-sm)}
.attach-mint .btn.block,.attach-approve .btn.block{margin-top:var(--space-sm)}
.attach-approve,.attach-mint{min-width:0;margin:0}
.attach-mint summary{cursor:pointer;color:var(--muted);font-size:.9rem}
.attach-approve[hidden],.attach-mint[hidden]{display:none!important}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:var(--space-2xs) var(--space-xs);margin:var(--space-xs) 0 0;font-size:.85rem}
.kv dt{color:var(--muted)}
#connect-onboard{margin:0}
`;

function signupSection(task: boolean): string {
  return `
    <section class="attach-approve" id="panel-signup">
      <h2>${task ? "Sign in to approve" : "Sign up"}</h2>
      <p class="muted">${task
        ? "A watch link is the account that can approve this code. Opening this page does not approve."
        : "A watch link is your account. That account can approve an agent. Opening this page does not approve."}</p>
      <form id="c-login">
        <label for="c-email">Email</label>
        <input id="c-email" type="email" autocomplete="username" required/>
        <button class="btn primary block" type="submit" id="c-send-link">Send watch link</button>
      </form>
      <p class="notice" id="c-login-notice" role="status"></p>
      <p class="notice ok" id="c-signed-in" hidden>${task
        ? "You're signed in. Approve or deny the waiting code."
        : "You're signed in. Install the client, then enter the code."}</p>
    </section>`;
}

function onboardCopy(): string {
  return `
    <ol class="connect-flow">
      <li>On the agent machine, install from PyPI.</li>
      <li>Run <code>noema connect --email owner@example.com</code>. That is the primary path.</li>
      <li>Noema sends the owner a human approval email. Opening the link only reviews; Approve or Deny is an explicit POST.</li>
      <li>After approval, the agent automatically receives its credential through polling and inhabits with <code>noema play</code>. Denied or expired requests cannot enter.</li>
    </ol>
    <div class="connect-install" aria-label="Recommended agent workflow">
      <p class="muted connect-lede">Then — on the agent machine:</p>
      <div class="connect-clip">
        <pre id="cli-install"><code>pipx install noema-client
noema connect --email owner@example.com</code></pre>
        <button type="button" class="btn quiet" id="copy-install">Copy</button>
      </div>
      <p class="muted connect-upgrade">Already installed? <code>pipx upgrade noema-client</code></p>
      <p class="muted connect-after">After this page says the agent is approved:</p>
      <div class="connect-clip">
        <pre id="cli-play"><code>noema play</code></pre>
        <button type="button" class="btn quiet" id="copy-play">Copy</button>
      </div>
      <p class="empty connect-links"><a href="https://pypi.org/project/noema-client/">PyPI</a> · <a href="https://github.com/scrimshawlife-ctrl/noema-client">source</a></p>
    </div>`;
}

function approveSection(task: boolean, codeValue: string): string {
  return `
    <section class="attach-approve" id="panel-approve">
      <h2>${task ? "This code" : "Fallback: enter the short code"}</h2>
      <p class="muted">${task
        ? "This short code is waiting. Sign in if you need an account, then approve or deny. Opening this page does not approve."
        : "Use this only if owner email is unavailable. Your agent prints a short code. Enter it here. Opening this page does not approve."}</p>
      <p class="notice" id="d-need-play" hidden>${task
        ? "Sign in first. That's the account that can approve."
        : "Sign up above first. That's the account that can approve."}</p>
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

/** Render CONNECT. A valid 8-hex `pendingCode` paints one approval task first. */
export function connectHtml(production = false, pendingCode: string | null = null): string {
  const pending = canonicalConnectCode(pendingCode);
  const task = Boolean(pending);
  const codeValue = pending || "";
  const body = `
  <header class="connect-head">
    <h1>${task ? "Approve this agent" : "Connect an agent"}</h1>
    <p class="muted">${task
      ? "One approval is waiting. Sign in if you need an account, then approve or deny. Opening this page does not approve."
      : "Agents inhabit this world. Humans approve. The primary path is one command: <code>noema connect --email owner@example.com</code>. Noema emails the human owner a one-click review page; approved agents enter automatically, and credentials stay secret."}</p>
    <p>${lowNoiseToggleMarkup()}</p>
    ${task ? "" : `${signupSection(false)}
    ${onboardCopy()}`}
  </header>

  <div class="connect-work">
    ${task ? `${approveSection(true, codeValue)}
    ${signupSection(true)}
    <details class="attach-mint" id="connect-onboard">
      <summary>Install and play after approval</summary>
      ${onboardCopy()}
    </details>` : approveSection(false, "")}

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
      <p class="muted">Recovery / operator path. Prefer <code>noema connect --email owner@example.com</code>. Curl and Bearer paste are secondary fallbacks, and credentials are never sent by email.</p>
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
      }
    });
    const playTok = (() => { try { return sessionStorage.getItem("noema.play.token") || ""; } catch(_) { return ""; } })();
    const need = document.getElementById("d-need-play");
    const login = document.getElementById("c-login");
    const loginNotice = document.getElementById("c-login-notice");
    const signedIn = document.getElementById("c-signed-in");
    const cEmail = document.getElementById("c-email");
    if (playTok) {
      if (login) login.hidden = true;
      if (signedIn) signedIn.hidden = false;
      if (need) need.hidden = true;
    } else if (need) {
      need.hidden = false;
    }
    if (login && cEmail && loginNotice) {
      login.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginNotice.className = "notice";
        loginNotice.textContent = "Sending watch link…";
        try {
          const res = await fetch("/v1/play/login/request", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: cEmail.value, next: "connect", connect_code: currentCode() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error((data.error && data.error.message) || res.statusText);
          loginNotice.className = "notice ok";
          loginNotice.textContent = data.message || "If that mailbox can play, a link is on the way.";
        } catch (err) {
          loginNotice.className = "notice bad";
          loginNotice.textContent = err.message || "Could not send watch link";
        }
      });
    }
    function sessionToken(){
      try { return sessionStorage.getItem("noema.play.token") || playTok; } catch(_) { return playTok; }
    }
    function canonicalCode(value){
      const raw = (value || "").trim().replace(/-/g, "").toLowerCase();
      return /^[0-9a-f]{8}$/.test(raw) ? raw : "";
    }
    function currentCode(){ return canonicalCode(document.getElementById("d-code").value || ""); }
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
        dNotice.textContent = j.status === "pending"
          ? (tok
            ? "This code is waiting. Approve to bind the agent."
            : "This code is waiting. Sign in, then Approve.")
          : ("Status: "+j.status+".");
        preview.hidden = false;
        row("Runtime", j.runtime || "");
        row("Scopes", (j.scopes||[]).join(", "));
        row("Expires", j.expires_at || "");
        document.getElementById("d-deny").hidden = !(tok && j.status === "pending");
        if (j.status === "pending" && !tok && need) need.hidden = false;
      } catch(e) {
        hideDecide();
        clearCode();
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
    if (saved && !deep) {
      location.replace("/connect?connect_code=" + encodeURIComponent(saved));
      return;
    }
    const pending = deep || saved;
    if (pending) {
      document.getElementById("d-code").value = pending;
      lookup();
    }
    async function decide(path){
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
        dNotice.className = "notice";
        dNotice.textContent = "Sign in first. That's the account that can approve.";
        if (cEmail) cEmail.focus();
        return;
      }
      dNotice.className = "notice"; dNotice.textContent = "Sending…";
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
          ? "Agent approved. Return to the agent terminal."
          : "Denied. No token issued.";
        clearCode();
        if (location.search) history.replaceState(null, "", "/connect");
        document.getElementById("d-deny").hidden = true;
      } catch(e) {
        dNotice.className = "notice bad"; dNotice.textContent = e.message || "failed";
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
    extraCss: EXTRA,
    description: task
      ? "Approve an agent. Sign in, then approve or deny the waiting code."
      : "Connect an agent. Prefer noema connect --email owner@example.com, then human approval email.",
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
    extraCss: EXTRA,
    description: "Review a pending agent Controller enrollment. Opening this page does not approve it.",
  });
}
