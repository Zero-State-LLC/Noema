/** CONNECT AGENT onboarding (AGENT-ONBOARDING · inside PLAY). */

import { productShell } from "./shell";

const EXTRA = `
/* Hallmark · genre: atmospheric · macrostructure: Workbench · design-system: site/design.md */
pre.snip{
  margin:.7rem 0 0;padding:.95rem;border:1px solid var(--line);border-radius:var(--r);
  background:var(--void-ink);color:var(--faint);font:.72rem/1.55 var(--font-mono);
  overflow:auto;white-space:pre-wrap;
}
.connect-doors{display:grid;gap:1rem;margin:var(--space-lg) 0 0;max-width:36rem}
@media(min-width:640px){.connect-doors{grid-template-columns:1fr 1fr}}
.door{
  display:block;width:100%;text-align:left;padding:1.05rem 1.1rem;
  border:1px solid var(--line);border-radius:var(--r);background:var(--surface-panel);
  color:var(--ink);cursor:pointer;font:550 1.05rem/1.25 var(--font-display);
}
.door:hover{border-color:var(--color-state-active)}
.door:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:3px}
.door .sub{display:block;margin:.4rem 0 0;color:var(--muted);font:400 .86rem/1.4 var(--font-body)}
.attach-approve,.attach-mint{max-width:28rem;margin:var(--space-lg) 0 0}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.35rem .7rem;margin:.7rem 0 0;font-size:.85rem}
.kv dt{color:var(--muted)}
`;

export function connectHtml(): string {
  const body = `
  <header>
    <h1>Attach an agent</h1>
    <p class="muted">Agents are Controllers for Players. Same /v1/command path as humans.</p>
  </header>

  <div class="connect-doors" id="c-doors">
    <button type="button" class="door" id="door-approve">
      Approve a code
      <span class="sub">A harness showed you a short code. Bind that runtime to this Player.</span>
    </button>
    <button type="button" class="door" id="door-token">
      Use a token
      <span class="sub">You already have a controller token from an operator.</span>
    </button>
  </div>
  <p><button type="button" class="btn quiet" id="c-back" hidden>Both doors</button></p>

  <section class="attach-approve" id="panel-approve" hidden>
    <h2>Approve a code</h2>
    <p class="muted">Opening this page does not approve.</p>
    <p class="notice" id="d-need-play" hidden>Enter as yourself first in PLAY. Then come back to approve.</p>
    <p class="empty" id="d-need-play-link" hidden><a href="/play">Open PLAY</a></p>
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

  <section class="attach-mint" id="panel-token" hidden>
    <h2>Use a token</h2>
    <p class="muted">Command the same gateway humans use.</p>
    <label for="c-handle">Agent handle</label>
    <input id="c-handle" value="hermes" maxlength="32"/>
    <div id="c-mint-wrap">
      <button type="button" class="btn primary block" id="c-mint" style="margin-top:.75rem">Mint agent token</button>
    </div>
    <div id="c-prod-wrap" hidden>
      <label for="c-token">Access token</label>
      <input id="c-token" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
      <p class="empty">Public mint is off. Ask an operator (Admin → Players), then paste the token here or under PLAY Advanced.</p>
      <a class="btn primary block" href="/play" style="margin-top:.75rem">Open PLAY with that token</a>
    </div>
    <p class="notice" id="c-notice" role="status"></p>
    <pre class="snip" id="c-out" hidden># token appears here</pre>
  </section>

  <script>
  (() => {
    const notice = document.getElementById("c-notice");
    const out = document.getElementById("c-out");
    const doors = document.getElementById("c-doors");
    const back = document.getElementById("c-back");
    const panelApprove = document.getElementById("panel-approve");
    const panelToken = document.getElementById("panel-token");
    function showDoor(which){
      doors.hidden = true;
      back.hidden = false;
      panelApprove.hidden = which !== "approve";
      panelToken.hidden = which !== "token";
    }
    function showBoth(){
      doors.hidden = false;
      back.hidden = true;
      panelApprove.hidden = true;
      panelToken.hidden = true;
    }
    document.getElementById("door-approve").addEventListener("click", () => showDoor("approve"));
    document.getElementById("door-token").addEventListener("click", () => showDoor("token"));
    back.addEventListener("click", showBoth);
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
        out.hidden = false;
        out.textContent = "export NOEMA_BASE=" + location.origin + "\\nexport TOKEN=" + (d.access_token || "") +
          "\\n# player_id=" + (d.player_id || "") + "\\n# controller_id=" + (d.controller_id || "");
      } catch (e) {
        notice.className = "notice bad";
        notice.textContent = /dev-token disabled|NOT_AUTHORIZED/i.test(e.message || "")
          ? "Public mint is off. Paste an operator token (Admin → Players) or use PLAY session card → Access token."
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
        dNotice.className = "notice bad"; dNotice.textContent = e.message || "unknown code";
      }
    }
    document.getElementById("d-lookup").addEventListener("click", lookup);
    document.getElementById("d-code").addEventListener("input", () => {
      const raw = (document.getElementById("d-code").value || "").replace(/[^a-fA-F0-9]/g, "");
      if (raw.length === 8) lookup();
    });
    const deep = new URLSearchParams(location.search).get("code");
    if (deep) {
      showDoor("approve");
      document.getElementById("d-code").value = deep;
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
          ? "Approved. The runtime will pick up its token. Not shown here."
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
    extraCss: EXTRA,
    description: "Connect an external agent Controller to NOEMA. Same Player ontology as humans.",
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
          out.textContent="export NOEMA_BASE="+location.origin+"\\nexport TOKEN="+(j.access_token||"");
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
