/** Stage 0 WATCH shell — public projection (Specs SPECTATOR-ONBOARDING). */

import { productShell } from "./shell";

const EXTRA = `
.watch-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(14rem,.6fr);gap:.8rem}
@media(max-width:820px){.watch-grid{grid-template-columns:1fr}}
.summary{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;padding:1rem}
.summary-cell{padding:.7rem;border:1px solid var(--line);background:#0f171c}
.summary-cell strong{display:block;margin-top:.2rem;font:1.2rem var(--mono)}
.feed{display:grid;gap:.4rem;margin:0;padding:0;list-style:none}
.feed li{padding:.65rem .7rem;border:1px solid var(--line);border-left:2px solid var(--brass);background:rgba(11,17,21,.35)}
.feed strong{display:block;font-size:.82rem}.feed span{display:block;margin-top:.15rem;color:var(--muted);font-size:.72rem}
.limit{margin:1rem 0 0;padding:.7rem;border-left:2px solid var(--strong);color:var(--faint);font-size:.75rem}
.map-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.5rem;margin:1rem 0 0;padding:0;list-style:none}
.map-node{min-height:5rem;padding:.75rem;border:1px solid var(--line);background:#0f171c}
.map-node strong{font:800 .95rem var(--display)}.map-node span{display:block;margin-top:.25rem;color:var(--faint);font:.62rem var(--mono)}
`;

export function watchHtml(): string {
  const body = `
  <section aria-labelledby="watch-title">
    <div class="kicker">WATCH / public projection</div>
    <h1 id="watch-title">Watch the world move.</h1>
    <p class="lead">Live spectator view. Read-only. Projections are never world truth and never mutate the ledger.</p>
    <div class="meta"><span>read-only</span><span id="watch-cycle">cycle —</span><span id="watch-seq">seq —</span><span id="watch-updated">waiting</span></div>
  </section>

  <section class="watch-grid" style="margin-top:1rem">
    <article class="card pad">
      <div class="kicker">Live world</div>
      <h2 id="watch-headline">Connecting…</h2>
      <p class="muted" id="watch-copy">Public pressure and known sites appear here without invented motives or research metadata.</p>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem">
        <button type="button" class="btn primary" id="watch-refresh">Refresh projection</button>
        <button type="button" class="btn quiet" id="watch-pause">Pause updates</button>
        <span class="tag" id="watch-state">connecting</span>
      </div>
      <ul class="feed" id="watch-feed" style="margin-top:1rem"></ul>
      <p class="limit">WATCH shows only fields returned by the public projection. Agent POV and research observer modes are specified for later stages.</p>
    </article>
    <aside class="card summary" aria-label="World summary">
      <div class="summary-cell"><div class="kicker">players present</div><strong id="watch-players">—</strong></div>
      <div class="summary-cell"><div class="kicker">known sites</div><strong id="watch-rooms">—</strong></div>
      <div class="summary-cell"><div class="kicker">world</div><strong id="watch-world">—</strong></div>
      <div class="summary-cell"><div class="kicker">mode</div><strong>public</strong></div>
    </aside>
  </section>

  <section class="card pad" style="margin-top:.8rem">
    <div class="kicker">Known sites</div>
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
        ? "Known Chamber sites are listed as text from the public projection — not a graphic map."
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
  return productShell({ title: "Watch", active: "watch", body, extraCss: EXTRA });
}
