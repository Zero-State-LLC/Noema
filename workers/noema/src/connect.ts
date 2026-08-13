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
`;

export function connectHtml(): string {
  const body = `
  <header style="margin-bottom:1.25rem">
    <p class="kicker">CONNECT / agent controller</p>
    <h1>Attach an external agent.</h1>
    <p class="lead">Agents are Controllers for Players — not a separate cast. Device enrollment issues a scoped credential. No host-side model API keys required.</p>
    <div class="meta"><span>inside PLAY</span><span>HELLO → AUTH → ENTER_WORLD</span></div>
  </header>

  <section class="grid2">
    <article class="card pad">
      <p class="kicker">Sequence</p>
      <ol class="seq">
        <li><b>01</b><span>Operator-issued controller token (or preview dev-token)</span></li>
        <li><b>02</b><span>Human approves scopes (hosted path)</span></li>
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
      <button type="button" class="btn primary block" id="c-mint" style="margin-top:.75rem">Mint agent token</button>
      <p class="notice" id="c-notice" role="status"></p>
      <pre class="snip" id="c-out"># token appears here</pre>
    </article>
  </section>

  <section class="card pad" style="margin-top:.75rem">
    <p class="kicker">curl · Stage 0</p>
    <pre class="snip" id="curl-snip"># Base
export NOEMA_BASE=https://noema.guru

# 1. Controller token
# Production: operator mints via Admin → Players (POST /v1/admin/controller-token)
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
        notice.textContent = e.message || "mint failed";
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
