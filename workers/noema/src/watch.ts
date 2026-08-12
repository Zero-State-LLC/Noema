/** Stage 0 WATCH — public projection (SPECTATOR-ONBOARDING). */

import { productShell } from "./shell";

const EXTRA = `
.watch-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(14rem,.65fr);gap:.75rem}
@media(max-width:860px){.watch-grid{grid-template-columns:1fr}}
.watch-hero h2{margin:.35rem 0 .5rem;font-size:clamp(1.5rem,3.5vw,2.2rem)}
.summary{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;padding:1rem}
.summary-cell{padding:.75rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016}
.summary-cell strong{display:block;margin-top:.25rem;font:500 1.25rem var(--font-mono);color:var(--ink)}
.feed{display:grid;gap:.4rem;margin:1rem 0 0;padding:0;list-style:none}
.feed li{
  padding:.7rem .8rem;border:1px solid var(--line);border-left:2px solid var(--copper);
  border-radius:var(--r);background:rgba(7,10,16,.4);
}
.feed strong{display:block;font-size:.88rem}.feed span{display:block;margin-top:.15rem;color:var(--muted);font-size:.74rem}
.limit{margin:1rem 0 0;padding:.75rem;border-left:2px solid var(--line-hot);color:var(--faint);font-size:.78rem;line-height:1.45}
.map-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr));gap:.5rem;margin:.85rem 0 0;padding:0;list-style:none}
.map-node{min-height:5.2rem;padding:.8rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016}
.map-node strong{font:550 1rem var(--font-display)}.map-node span{display:block;margin-top:.3rem;color:var(--faint);font:.6rem var(--font-mono)}
`;

export function watchHtml(): string {
  const body = `
  <header style="margin-bottom:1.25rem">
    <p class="kicker">WATCH / public projection</p>
    <h1>Watch the world move.</h1>
    <p class="lead">Live spectator view. Read-only. Projections are never world truth and never mutate the ledger.</p>
    <div class="meta">
      <span>read-only</span>
      <span id="watch-cycle">cycle —</span>
      <span id="watch-seq">seq —</span>
      <span id="watch-updated">waiting</span>
    </div>
  </header>

  <section class="watch-grid">
    <article class="card pad watch-hero">
      <p class="kicker">Live world</p>
      <h2 id="watch-headline">Connecting…</h2>
      <p class="muted" id="watch-copy">Public sites appear here without invented motives or research metadata.</p>
      <div class="btn-row" style="margin-top:1rem">
        <button type="button" class="btn primary" id="watch-refresh">Refresh projection</button>
        <button type="button" class="btn quiet" id="watch-pause">Pause updates</button>
        <span class="tag" id="watch-state">connecting</span>
      </div>
      <ul class="feed" id="watch-feed"></ul>
      <p class="limit">WATCH shows only fields returned by the public projection. Agent POV and research observer modes arrive in later stages.</p>
    </article>
    <aside class="card summary" aria-label="World summary">
      <div class="summary-cell"><div class="kicker">players present</div><strong id="watch-players">—</strong></div>
      <div class="summary-cell"><div class="kicker">known sites</div><strong id="watch-rooms">—</strong></div>
      <div class="summary-cell"><div class="kicker">world</div><strong id="watch-world">—</strong></div>
      <div class="summary-cell"><div class="kicker">mode</div><strong style="font-size:.85rem">public</strong></div>
    </aside>
  </section>

  <section class="card pad" style="margin-top:.75rem">
    <p class="kicker">Known sites</p>
    <ul class="map-list" id="watch-map"></ul>
  </section>

  <script>
  (() => {
    const state = { paused: false, busy: false };
    const $ = id => document.getElementById(id);

    function render(data) {
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      const players = data.players_present ?? data.player_count ?? 0;
      $("watch-cycle").textContent = "cycle " + (data.cycle ?? "—");
      $("watch-seq").textContent = "seq " + (data.sequence ?? "—");
      $("watch-players").textContent = String(players);
      $("watch-rooms").textContent = String(rooms.length);
      $("watch-world").textContent = data.world_id || "—";
      $("watch-updated").textContent = "updated " + new Date().toLocaleTimeString();
      $("watch-headline").textContent = players
        ? players + " player" + (players === 1 ? " is" : "s are") + " present in the public projection."
        : "The public projection is waiting for its next visible change.";
      $("watch-copy").textContent = rooms.length
        ? "Known Chamber sites are listed as text — not a graphic map."
        : "No public sites exposed yet.";

      const feed = $("watch-feed");
      feed.replaceChildren();
      if (!rooms.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No public pressure or sites in this projection.";
        feed.append(li);
      } else {
        rooms.slice(0, 8).forEach(r => {
          const li = document.createElement("li");
          const ents = Array.isArray(r.entities) ? r.entities.length : (r.entity_count || 0);
          li.innerHTML = "<strong>" + (r.name || r.room_id || "site") + "</strong><span>" +
            (r.room_id || "") + " · " + ents + " visible entit" + (ents === 1 ? "y" : "ies") + "</span>";
          feed.append(li);
        });
      }

      const map = $("watch-map");
      map.replaceChildren();
      if (!rooms.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "The public map has no known sites yet.";
        map.append(li);
      } else {
        rooms.forEach(r => {
          const li = document.createElement("li");
          li.className = "map-node";
          const ents = Array.isArray(r.entities) ? r.entities.length : (r.entity_count || 0);
          li.innerHTML = "<strong>" + (r.name || r.room_id) + "</strong><span>" + ents +
            " entities · " + (r.room_id || "") + "</span>";
          map.append(li);
        });
      }
    }

    async function refresh() {
      if (state.busy) return;
      state.busy = true;
      const tag = $("watch-state");
      tag.textContent = "refreshing";
      tag.className = "tag warn";
      try {
        const data = await fetch("/v1/watch/live").then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error((d.error && d.error.message) || r.statusText);
          return d;
        });
        render(data);
        tag.textContent = "live";
        tag.className = "tag ok";
      } catch (e) {
        tag.textContent = "unavailable";
        tag.className = "tag";
        $("watch-headline").textContent = "Projection unavailable";
        $("watch-copy").textContent = e.message || "Could not load public projection.";
      } finally {
        state.busy = false;
      }
    }

    $("watch-refresh").addEventListener("click", refresh);
    $("watch-pause").addEventListener("click", () => {
      state.paused = !state.paused;
      $("watch-pause").textContent = state.paused ? "Resume updates" : "Pause updates";
    });
    refresh();
    setInterval(() => { if (!state.paused && !document.hidden) refresh(); }, 4000);
  })();
  </script>
  `;
  return productShell({
    title: "Watch",
    active: "watch",
    body,
    extraCss: EXTRA,
    description: "WATCH the NOEMA public world projection. Read-only spectator view.",
  });
}
