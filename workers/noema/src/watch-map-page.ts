/** Opt-in WATCH mapping surface. Does not replace lightweight /watch theater. */

import { productShell } from "./shell";

const CSS = `
.map-head{margin:0 0 1rem}
.map-head h1{margin:0 0 .35rem;font:550 clamp(1.6rem,4vw,2.2rem)/1.05 var(--font-display)}
.map-meta{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;color:var(--faint);font:.68rem/1.3 var(--font-mono)}
.map-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(16rem,20rem);gap:1rem}
@media(max-width:70rem){.map-grid{grid-template-columns:1fr}}
.map-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.45rem;min-height:16rem}
.map-node{position:relative;padding:.55rem .5rem;border:1px solid var(--line);background:var(--paper);min-height:4.2rem;transition:transform .35s ease,box-shadow .35s ease}
.map-node.is-active{outline:2px solid var(--ink)}
.map-node .n{font:550 .78rem/1.2 var(--font-mono)}
.map-node .m{color:var(--faint);font:.62rem/1.3 var(--font-mono)}
.map-node .scar{position:absolute;inset:auto .3rem .3rem auto;width:.55rem;height:.55rem;border-radius:50%;background:#7a4}
.map-node[data-scar="0"] .scar{display:none}
.layer-toggles{display:flex;flex-wrap:wrap;gap:.35rem;margin:.6rem 0}
.layer-toggles button{font:.62rem/1.2 var(--font-mono)}
.health dl{display:grid;grid-template-columns:1fr auto;gap:.2rem .8rem;margin:0}
.health dt{color:var(--faint);font:.62rem/1.2 var(--font-mono);text-transform:uppercase;letter-spacing:.08em}
.health dd{margin:0;font:550 .82rem/1.2 var(--font-mono)}
.river{list-style:none;margin:0;padding:0;max-height:18rem;overflow:auto}
.river li{margin:0 0 .45rem;padding:.35rem 0;border-bottom:1px solid var(--line);font:.78rem/1.35 var(--font-mono)}
.highlight{margin:0 0 .8rem;padding:.5rem .6rem;border:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){.map-node{transition:none}}
body.map-hide-activity .map-node .m.act{display:none}
body.map-hide-state .map-node .scar{display:none}
body.map-hide-event .river{display:none}
body.map-hide-health .health{display:none}
body.map-hide-narrative .highlight{display:none}
`;

export function watchMapHtml(): string {
  const body = `
  <header class="map-head">
    <h1>Live map</h1>
    <p class="muted">Richer spectator projection. Theater stays at <a href="/watch">/watch</a>. Derived, not world truth.</p>
    <div class="map-meta"><span class="tag" id="map-state">connecting</span><span id="map-cycle">cycle —</span></div>
    <div class="layer-toggles" id="toggles" role="group" aria-label="Layers"></div>
  </header>
  <div class="map-grid">
    <section aria-label="Map">
      <div class="highlight" id="highlight" hidden></div>
      <div class="map-board" id="board"></div>
    </section>
    <aside>
      <section class="health" aria-label="World health"><h2 class="now-k">Health</h2><dl id="health"></dl></section>
      <section aria-label="Event river"><h2 class="now-k">River</h2><ul class="river" id="river"></ul></section>
    </aside>
  </div>
  <script>
  (function(){
    const $ = (id) => document.getElementById(id);
    function paint(d){
      $("map-state").textContent = d.freshness || "live";
      $("map-cycle").textContent = "cycle " + (d.cycle || "—");
      const layers = d.layers || [];
      const tog = $("toggles");
      if (!tog.dataset.ready) {
        tog.innerHTML = layers.map(l => '<button type="button" class="btn quiet" data-layer="'+l.id+'" aria-pressed="true">'+l.label+'</button>').join("");
        tog.dataset.ready = "1";
        tog.addEventListener("click", (ev) => {
          const b = ev.target.closest("button[data-layer]");
          if (!b) return;
          const on = b.getAttribute("aria-pressed") !== "true";
          b.setAttribute("aria-pressed", on ? "true" : "false");
          document.body.classList.toggle("map-hide-"+b.getAttribute("data-layer"), !on);
        });
      }
      const nodes = (d.base && d.base.rooms) || [];
      $("board").innerHTML = nodes.map(n => {
        const scar = Number(n.scar_residue||0);
        return '<article class="map-node'+(n.active?' is-active':'')+'" data-scar="'+scar+'" style="grid-column:'+(n.x+1)+';grid-row:'+(n.y+1)+'"><div class="n">'+String(n.name||n.room_id)+'</div><div class="m act">'+(n.players_present||0)+' here</div><span class="scar" title="scar residue"></span></article>';
      }).join("");
      const h = d.health || {};
      $("health").innerHTML = [["Scar activity", h.scar_activity],["Reconstruction", h.reconstruction_fidelity],["Path dependence", h.path_dependence_index],["Players", h.players_present]].map(([k,v]) => '<dt>'+k+'</dt><dd>'+(v==null?'—':v)+'</dd>').join("");
      const river = (d.event && d.event.river) || [];
      $("river").innerHTML = river.map(e => '<li><strong>'+String(e.icon||"")+'</strong> '+String(e.line||"")+(e.consequence?' — '+e.consequence:'')+'</li>').join("") || "<li>Quiet.</li>";
      const hi = d.narrative && d.narrative.highlight;
      const box = $("highlight");
      if (hi && hi.line) { box.hidden = false; box.textContent = String(hi.line); }
      else box.hidden = true;
    }
    async function refresh(){
      try {
        const r = await fetch("/v1/watch/map");
        const d = await r.json();
        paint(d);
      } catch (e) { $("map-state").textContent = "offline"; }
    }
    refresh();
    setInterval(() => { if (!document.hidden) refresh(); }, 8000);
  })();
  </script>
  `;
  return productShell({
    title: "Watch map",
    active: "watch",
    body,
    extraCss: CSS,
    description: "Opt-in WATCH real-time mapping. Lightweight theater remains /watch.",
  });
}
