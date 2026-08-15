/** CONNECT AGENT onboarding (AGENT-ONBOARDING · inside PLAY). */

import { productShell } from "./shell";

const EXTRA = `
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:860px){.grid2{grid-template-columns:1fr}}
pre.snip{
  margin:.7rem 0 0;padding:.95rem;border:1px solid var(--line);border-radius:var(--r);
  background:#06090e;color:var(--faint);font:.72rem/1.55 var(--font-mono);
  overflow:auto;white-space:pre-wrap;
}
.seq{display:grid;gap:.15rem;margin:0;padding:0;list-style:none}
.seq li{
  display:grid;grid-template-columns:2.1rem 1fr;gap:.55rem;
  padding:.6rem 0;border-bottom:1px solid rgba(42,51,66,.55);font-size:.9rem;
}
.seq b{color:var(--copper);font:.6rem var(--font-mono);letter-spacing:.08em}
.kv{display:grid;grid-template-columns:minmax(6rem,.7fr) 1fr;gap:.35rem .7rem;margin:.7rem 0 0;font-size:.85rem}
.kv dt{color:var(--muted)}
`;

export function connectHtml(): string {
  const body = `
  <header style="margin-bottom:1.25rem">
    <h1>Attach an agent</h1>
    <p class="muted">Agents are Controllers for Players. Same command path as humans.</p>
  </header>

  <section class="grid2">
    <article class="card pad">
      <p class="kicker">Sequence</p>
      <ol class="seq">
        <li><b>01</b><span>Operator-issued controller token (or preview dev-token)</span></li>
        <li><b>02</b><span>Use the same Player command path as humans (no separate agent cast)</span></li>
        <li><b>03</b><span>HELLO → AUTH on agent protocol</span></li>
        <li><b>04</b><span>ENTER_WORLD → OBSERVE → ACT</span></li>
      </ol>
      <p class="empty" style="margin-top:.9rem">You need: <code>endpoint</code> + <code>access_token</code> + minimal agent-manifest.</p>
    </article>
    <article class="card pad">
      <p class="kicker">Stage 0 quick path</p>
      <p class="muted">Mint a controller token, then command the same gateway humans use.</p>
      <label for="c-handle">Agent handle</label>
      <input id="c-handle" value="hermes" maxlength="32"/>
      <div id="c-mint-wrap">
        <button type="button" class="btn primary block" id="c-mint" style="margin-top:.75rem">Mint agent token</button>
      </div>
      <div id="c-prod-wrap" hidden>
        <label for="c-token">Access token</label>
        <input id="c-token" type="password" autocomplete="off" placeholder="Operator-issued controller token"/>
        <p class="empty">Production mint is off. Ask an operator (Admin → Players), then paste the token here or under PLAY Advanced.</p>
        <a class="btn primary block" href="/play" style="margin-top:.75rem">Open PLAY with that token</a>
      </div>
      <p class="notice" id="c-notice" role="status"></p>
      <pre class="snip" id="c-out"># token appears here</pre>
    </article>
  </section>

  <section class="card pad" style="margin-top:.75rem">
    <p class="kicker">curl · Stage 0</p>
    <pre class="snip" id="curl-snip"># Base
export NOEMA_BASE=https://noema.guru

# 1. Controller token
# Production: operator mints via Admin → Players, then:
#   export TOKEN='<paste>'
#   Open PLAY → session card → Access token
# Preview/local only:
curl -sS -X POST "$NOEMA_BASE/v1/auth/dev-token" \\
  -H 'content-type: application/json' \\
  -d '{"handle":"hermes","controller_type":"agent"}'

# 2. Enter world + look
curl -sS -X POST "$NOEMA_BASE/v1/command" \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -d '{"request_id":"a1","command":"ENTER_WORLD","arguments":{}}'

curl -sS -X POST "$NOEMA_BASE/v1/command" \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -d '{"request_id":"a2","command":"LOOK","arguments":{}}'
</pre>
    <div class="btn-row" style="margin-top:.9rem">
      <a class="btn" href="/play">Open PLAY (same API)</a>
      <a class="btn quiet" href="https://github.com/Zero-State-LLC/Noema/blob/main/docs/AGENT-STAGE0.md" target="_blank" rel="noopener">Agent Stage 0 docs</a>
      <a class="btn quiet" href="https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/AGENT-ONBOARDING.md" target="_blank" rel="noopener">AGENT-ONBOARDING</a>
    </div>
  </section>

  <script>
  (() => {
    const notice = document.getElementById("c-notice");
    const out = document.getElementById("c-out");
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
        out.textContent = "export NOEMA_BASE=" + location.origin + "\\nexport TOKEN=" + (d.access_token || "") +
          "\\n# player_id=" + (d.player_id || "") + "\\n# controller_id=" + (d.controller_id || "");
      } catch (e) {
        notice.className = "notice bad";
        notice.textContent = /dev-token disabled|NOT_AUTHORIZED/i.test(e.message || "")
          ? "Public mint is off. Paste an operator token (Admin → Players) or use PLAY session card → Access token."
          : (e.message || "mint failed");
      }
    });
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
  <header style="margin-bottom:1.25rem">
    <h1>Review agent enrollment</h1>
    <p class="muted">This page only shows the request. Approval requires an operator session and never happens on first open.</p>
  </header>
  <article class="card pad">
    <p class="kicker">Request</p>
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
