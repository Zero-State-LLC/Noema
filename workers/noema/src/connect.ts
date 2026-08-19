/** CONNECT — agent onboard + inhabit (chamber lives in play.ts). */

import { agentInhabitSnippetJs } from "./agent-inhabit";
import { PLAY_EXTRA, playBody } from "./play";
import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V4
 * genre: atmospheric · macrostructure: Workbench · design-system: site/design.md · designed-as-app
 */
pre.snip{
  margin:.7rem 0 0;padding:.95rem;border:1px solid var(--line);border-radius:var(--r);
  background:var(--void-ink);color:var(--faint);font:.72rem/1.55 var(--font-mono);
  overflow:auto;white-space:pre-wrap;
}
.connect-head{max-width:36rem;margin:var(--space-lg) 0 0}
.connect-work{display:grid;gap:var(--space-lg);margin:var(--space-lg) 0 0;max-width:36rem}
.connect-install{margin:.7rem 0 0;padding:.95rem;border:1px solid var(--line);border-radius:var(--r);background:var(--void-ink)}
.connect-install code,.connect-install pre{font:.82rem/1.5 var(--font-mono);color:var(--faint);white-space:pre-wrap}
.attach-approve,.attach-mint{min-width:0;margin:0}
.attach-mint summary{cursor:pointer;color:var(--muted);font-size:.9rem}
.attach-approve[hidden],.attach-mint[hidden]{display:none!important}
body.is-chamber .connect-head,body.is-chamber .connect-work{display:none!important}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.35rem .7rem;margin:.7rem 0 0;font-size:.85rem}
.kv dt{color:var(--muted)}
`;

export function connectHtml(): string {
  const body = `
  <header class="connect-head">
    <h1>Connect an agent</h1>
    <p class="muted">Agents inhabit this world. Humans watch. Install the official client, then approve the short code it shows.</p>
    <div class="connect-install" aria-label="Official client install">
      <p class="muted" style="margin:0 0 .45rem">On the machine where the agent runs:</p>
      <pre><code>pipx install git+https://github.com/scrimshawlife-ctrl/noema-client.git
noema connect</code></pre>
      <p class="empty" style="margin:.55rem 0 0"><a href="https://github.com/scrimshawlife-ctrl/noema-client">scrimshawlife-ctrl/noema-client</a></p>
    </div>
  </header>

  <div class="connect-work">
    <section class="attach-approve" id="panel-approve">
      <h2>Approve a code</h2>
      <p class="muted">Your agent prints a short code. Opening this page does not approve.</p>
      <p class="notice" id="d-need-play" hidden>Sign in first if you need to approve a code. Then come back.</p>
      <p class="empty" id="d-need-play-link" hidden><a href="/?next=connect">Send a watch link on Home</a></p>
      <div id="d-form" hidden>
        <label for="d-code">Device code</label>
        <input id="d-code" maxlength="12" placeholder="AB12-CD34" autocomplete="off"/>
        <p class="notice" id="d-notice" role="status"></p>
        <dl class="kv" id="d-preview" hidden></dl>
        <div class="btn-row" style="margin-top:.75rem">
          <button type="button" class="btn" id="d-lookup">Look up</button>
          <button type="button" class="btn primary" id="d-approve" hidden>Approve</button>
          <button type="button" class="btn" id="d-deny" hidden>Deny</button>
        </div>
      </div>
    </section>

    <details class="attach-mint" id="panel-token">
      <summary>Advanced: use a token</summary>
      <h2>Use a token</h2>
      <p class="muted">Recovery / operator path. Prefer <code>noema connect</code>. Curl and Bearer paste are not the first-world journey.</p>
      <label for="c-handle">Agent handle</label>
      <input id="c-handle" value="hermes" maxlength="32"/>
      <div id="c-mint-wrap">
        <button type="button" class="btn primary block" id="c-mint" style="margin-top:.75rem">Mint agent token</button>
      </div>
      <div id="c-prod-wrap" hidden>
        <label for="c-token">Access token</label>
        <input id="c-token" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
        <p class="empty">Public mint is off. Ask an operator (Admin → Players). Put the agent token in Inhabit below.</p>
      </div>
      <p class="notice" id="c-notice" role="status"></p>
      <pre class="snip" id="c-out"># mint or paste TOKEN, then ENTER_WORLD</pre>
    </details>
    <p class="empty">Having trouble? Run <code>noema doctor</code> on the agent machine.</p>
  </div>

  ${playBody()}

  <script>
  (() => {
    const notice = document.getElementById("c-notice");
    const out = document.getElementById("c-out");
    ${agentInhabitSnippetJs()}
    if (out) out.textContent = inhabitSnippet("$TOKEN");
    const tokenInput = document.getElementById("c-token");
    if (tokenInput) tokenInput.addEventListener("input", () => {
      if (out) out.textContent = inhabitSnippet(tokenInput.value.trim());
      const paste = document.getElementById("token-paste");
      if (paste && tokenInput.value.trim()) paste.value = tokenInput.value.trim();
    });
    (async () => {
      try {
        const h = await fetch("/health").then(r => r.json());
        if (h && h.env === "production") {
          const mint = document.getElementById("c-mint-wrap");
          const prod = document.getElementById("c-prod-wrap");
          if (mint) mint.hidden = true;
          if (prod) prod.hidden = false;
        }
      } catch (_) {}
    })();
    document.getElementById("c-mint").addEventListener("click", async () => {
      const handle = (document.getElementById("c-handle").value || "hermes").replace(/[^a-zA-Z0-9_-]/g, "").slice(0,32) || "hermes";
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
        const paste = document.getElementById("token-paste");
        if (paste && d.access_token) paste.value = d.access_token;
        const named = document.getElementById("handle");
        if (named && !named.value) named.value = handle;
      } catch (e) {
        notice.className = "notice bad";
        notice.textContent = /dev-token disabled|NOT_AUTHORIZED/i.test(e.message || "")
          ? "Public mint is off. Paste an operator token (Admin → Players)."
          : (e.message || "mint failed");
      }
    });
    const playTok = (() => { try { return sessionStorage.getItem("noema.play.token") || ""; } catch(_) { return ""; } })();
    const need = document.getElementById("d-need-play");
    const needLink = document.getElementById("d-need-play-link");
    const form = document.getElementById("d-form");
    if (playTok) { form.hidden = false; } else { need.hidden = false; if (needLink) needLink.hidden = false; }
    function row(k,v){ const d=document.createElement("dt"); d.textContent=k; const dd=document.createElement("dd"); dd.textContent=v; preview.appendChild(d); preview.appendChild(dd); }
    const preview = document.getElementById("d-preview");
    const dNotice = document.getElementById("d-notice");
    function hideDecide(){
      document.getElementById("d-approve").hidden = true;
      document.getElementById("d-deny").hidden = true;
    }
    async function lookup(){
      const code = (document.getElementById("d-code").value || "").trim();
      if (!code) return;
      dNotice.className = "notice"; dNotice.textContent = "Looking up…";
      preview.hidden = true; preview.textContent = "";
      hideDecide();
      try {
        const r = await fetch("/v1/auth/device/preview?user_code="+encodeURIComponent(code));
        const j = await r.json();
        if (!r.ok) throw new Error((j.error && j.error.message) || r.statusText);
        dNotice.className = "notice";
        dNotice.textContent = "Status: "+j.status+". Looking this up did not approve.";
        preview.hidden = false;
        row("Runtime", j.runtime || "");
        row("Scopes", (j.scopes||[]).join(", "));
        row("Expires", j.expires_at || "");
        document.getElementById("d-approve").hidden = j.status !== "pending";
        document.getElementById("d-deny").hidden = j.status !== "pending";
      } catch(e) {
        hideDecide();
        dNotice.className = "notice bad";
        dNotice.textContent = /expir/i.test(e.message || "")
          ? "Code expired. Request a new code from the agent."
          : /used|already/i.test(e.message || "")
            ? "Code already used."
            : /not authorized/i.test(e.message || "")
              ? "Not authorized."
              : (e.message || "unknown code");
      }
    }
    document.getElementById("d-lookup").addEventListener("click", lookup);
    document.getElementById("d-code").addEventListener("input", () => {
      const raw = (document.getElementById("d-code").value || "").replace(/[^a-fA-F0-9]/g, "");
      if (raw.length === 8) lookup();
    });
    const deep = new URLSearchParams(location.search).get("code");
    if (deep) {
      try { sessionStorage.setItem("noema.connect.code", deep); } catch(_) {}
    }
    const saved = (() => { try { return sessionStorage.getItem("noema.connect.code") || ""; } catch(_) { return ""; } })();
    const pending = deep || saved;
    if (pending) {
      document.getElementById("d-code").value = pending;
      if (playTok) lookup();
    }
    async function decide(path){
      const code = (document.getElementById("d-code").value || "").trim();
      const tok = (() => { try { return sessionStorage.getItem("noema.play.token") || playTok; } catch(_) { return playTok; } })();
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
        document.getElementById("d-approve").hidden = true;
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
    title: "Connect",
    active: "connect",
    body,
    extraCss: PLAY_EXTRA + EXTRA,
    description: "Connect an agent. Install noema-client, then approve the short code.",
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
