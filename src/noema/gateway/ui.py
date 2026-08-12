"""Minimal operator / WATCH / PLAY HTML shells (C14 application + spectator surfaces)."""

from __future__ import annotations

CSS = """
:root {
  --bg: #0d1117;
  --panel: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #58a6ff;
  --ok: #3fb950;
  --bad: #f85149;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --sans: system-ui, -apple-system, Segoe UI, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: var(--sans); line-height: 1.45;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
header {
  border-bottom: 1px solid var(--border);
  padding: 0.85rem 1.25rem;
  display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;
  background: var(--panel);
}
header .brand { font-weight: 700; letter-spacing: 0.04em; }
header nav { display: flex; gap: 0.85rem; flex-wrap: wrap; }
main { max-width: 960px; margin: 0 auto; padding: 1.25rem; }
.card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 8px; padding: 1rem 1.1rem; margin-bottom: 1rem;
}
h1,h2 { margin: 0 0 0.6rem; font-size: 1.15rem; }
.muted { color: var(--muted); font-size: 0.92rem; }
.grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.stat { font-family: var(--mono); font-size: 0.9rem; }
.pill {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px;
  border: 1px solid var(--border); font-size: 0.8rem; font-family: var(--mono);
}
.pill.ok { color: var(--ok); border-color: #238636; }
.pill.bad { color: var(--bad); border-color: #da3633; }
pre {
  background: #0a0e14; border: 1px solid var(--border); border-radius: 6px;
  padding: 0.75rem; overflow: auto; font-family: var(--mono); font-size: 0.82rem;
  max-height: 28rem;
}
button, .btn {
  background: #21262d; color: var(--text); border: 1px solid var(--border);
  border-radius: 6px; padding: 0.4rem 0.75rem; cursor: pointer; font: inherit;
}
button:hover, .btn:hover { border-color: var(--accent); }
input, select {
  background: #0a0e14; color: var(--text); border: 1px solid var(--border);
  border-radius: 6px; padding: 0.4rem 0.55rem; font: inherit; width: 100%;
}
.row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin: 0.5rem 0; }
.row > * { flex: 1 1 auto; }
label { font-size: 0.85rem; color: var(--muted); display: block; margin-bottom: 0.2rem; }
"""


def _shell(title: str, body: str, active: str = "") -> str:
    def nav(href: str, label: str, key: str) -> str:
        mark = " style=\"font-weight:700\"" if key == active else ""
        return f'<a href="{href}"{mark}>{label}</a>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{title} · NOEMA</title>
  <style>{CSS}</style>
</head>
<body>
  <header>
    <div class="brand">NOEMA</div>
    <nav>
      {nav("/", "Home", "home")}
      {nav("/watch", "Watch", "watch")}
      {nav("/play", "Play", "play")}
      {nav("/health", "Health JSON", "health")}
      {nav("/ready", "Ready JSON", "ready")}
      {nav("/version", "Version JSON", "version")}
      {nav("/manifest", "Manifest JSON", "manifest")}
    </nav>
  </header>
  <main>
{body}
  </main>
</body>
</html>
"""


def index_html() -> str:
    body = """
    <div class="card">
      <h1>Operator surface</h1>
      <p class="muted">Modular monolith · PLAY / WATCH / agent protocol · Specs C14 local golden path.</p>
      <div class="grid" id="stats">
        <div class="card stat">Health: <span id="health">…</span></div>
        <div class="card stat">Ready: <span id="ready">…</span></div>
        <div class="card stat">Phase: <span id="phase">…</span></div>
      </div>
    </div>
    <div class="card">
      <h2>Surfaces</h2>
      <ul>
        <li><a href="/watch">WATCH</a> — public spectator projection (redacted)</li>
        <li><a href="/play">PLAY</a> — minimal browser text loop</li>
        <li><a href="/protocol/v1">POST /protocol/v1</a> — agent protocol endpoint</li>
        <li><code>GET /health</code> · <code>/ready</code> · <code>/version</code> · <code>/manifest</code></li>
      </ul>
    </div>
    <script>
    async function j(path){ const r=await fetch(path); return r.json(); }
    (async()=>{
      try {
        const h=await j('/health');
        document.getElementById('health').innerHTML =
          '<span class="pill '+(h.status==='ok'?'ok':'bad')+'">'+(h.status||'?')+'</span>';
        const r=await j('/ready');
        document.getElementById('ready').innerHTML =
          '<span class="pill '+(r.ready?'ok':'bad')+'">'+(r.ready?'ready':'not ready')+'</span>';
        const v=await j('/version');
        document.getElementById('phase').textContent = v.implementation_phase || v.runtime_version || '—';
      } catch(e) {
        document.getElementById('health').textContent = 'error';
      }
    })();
    </script>
    """
    return _shell("Home", body, "home")


def watch_html() -> str:
    body = """
    <div class="card">
      <h1>WATCH</h1>
      <p class="muted">Spectator surface — public projection only. Research overlays are redacted.</p>
      <div class="row">
        <button id="refresh" type="button">Refresh now</button>
        <label style="flex:0"><input type="checkbox" id="auto" checked/> auto 2s</label>
        <span class="muted" id="status">connecting…</span>
      </div>
    </div>
    <div class="card">
      <h2>Live projection</h2>
      <pre id="live">{}</pre>
    </div>
    <script>
    const el = document.getElementById('live');
    const st = document.getElementById('status');
    async function tick(){
      try {
        const r = await fetch('/watch/live');
        const j = await r.json();
        el.textContent = JSON.stringify(j, null, 2);
        st.textContent = 'ok · ' + new Date().toLocaleTimeString();
        st.className = 'muted';
      } catch(e) {
        st.textContent = 'error: ' + e;
      }
    }
    document.getElementById('refresh').onclick = tick;
    tick();
    setInterval(()=>{ if(document.getElementById('auto').checked) tick(); }, 2000);
    </script>
    """
    return _shell("Watch", body, "watch")


def play_html() -> str:
    body = """
    <div class="card">
      <h1>PLAY</h1>
      <p class="muted">Minimal browser loop. Creates a PLAYER session and issues Chamber verbs.</p>
      <div class="row">
        <div>
          <label>Agent id</label>
          <input id="agent" value="agent.player.1"/>
        </div>
        <div style="flex:0;align-self:end">
          <button id="boot" type="button">Start session</button>
        </div>
      </div>
      <div class="row">
        <input id="cmd" placeholder="look | move &lt;exit&gt; | wait | inspect &lt;id&gt;" disabled/>
        <button id="go" type="button" disabled>Send</button>
      </div>
      <p class="muted">Session: <code id="sess">—</code> · seq <code id="seq">0</code></p>
    </div>
    <div class="card">
      <h2>Observation</h2>
      <pre id="obs">Start a session to play.</pre>
    </div>
    <script>
    let sessionId=null, seq=0, agent='agent.player.1';
    const obs=document.getElementById('obs');
    const sessEl=document.getElementById('sess');
    const seqEl=document.getElementById('seq');
    const cmd=document.getElementById('cmd');
    const go=document.getElementById('go');

    function parse(line){
      const p=line.trim().split(/\\s+/);
      if(!p[0]) return null;
      const base={agent_id:agent, client_action_sequence:seq+1, action_id:'act.'+(seq+1), idempotency_key:'idem.'+(seq+1)};
      const c=p[0].toLowerCase();
      if(c==='enter') return {...base, verb:'ENTER_WORLD', parameters:{}};
      if(c==='look') return {...base, verb:'LOOK', parameters:{attention_spent:1}};
      if(c==='wait') return {...base, verb:'WAIT', parameters:{cycles:1}};
      if(c==='move' && p[1]) return {...base, verb:'MOVE', parameters:{exit_id:p[1], cost_paid:{energy:1}}};
      if(c==='inspect' && p[1]) return {...base, verb:'INSPECT', parameters:{entity_id:p[1], attention_spent:1}};
      return null;
    }

    async function start(){
      agent=document.getElementById('agent').value || 'agent.player.1';
      const r=await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({role:'PLAYER', agent_id:agent})});
      const j=await r.json();
      sessionId=j.session_id; seq=0;
      sessEl.textContent=sessionId;
      cmd.disabled=false; go.disabled=false;
      // auto enter
      await send('enter');
    }

    async function send(line){
      if(!sessionId) return;
      const action=parse(line);
      if(!action){ obs.textContent='unknown command'; return; }
      const r=await fetch('/play/action',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Session-Id':sessionId},
        body:JSON.stringify({action})
      });
      const j=await r.json();
      if(j.error){ obs.textContent=JSON.stringify(j,null,2); return; }
      seq += 1; seqEl.textContent=String(seq);
      obs.textContent=JSON.stringify(j.observation || j, null, 2);
      cmd.value='';
    }

    document.getElementById('boot').onclick=()=>start().catch(e=>obs.textContent=String(e));
    go.onclick=()=>send(cmd.value).catch(e=>obs.textContent=String(e));
    cmd.addEventListener('keydown', e=>{ if(e.key==='Enter') send(cmd.value); });
    </script>
    """
    return _shell("Play", body, "play")
