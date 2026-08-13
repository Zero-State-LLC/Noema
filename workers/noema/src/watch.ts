/** Stage 0 WATCH — public projection (SPECTATOR-ONBOARDING). */

import { productShell } from "./shell";

const EXTRA = `
.watch-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(14rem,.65fr);gap:.75rem}
@media(max-width:860px){.watch-grid{grid-template-columns:1fr}}
.watch-hero h2{margin:.35rem 0 .5rem;font-size:clamp(1.5rem,3.5vw,2.2rem)}
.summary{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.45rem;padding:1rem}
@media(max-width:540px){.summary{grid-template-columns:1fr}}
.summary-cell{padding:.75rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016}
.summary-cell strong{display:block;margin-top:.25rem;font:500 1.25rem var(--font-mono);color:var(--ink);overflow-wrap:anywhere}
.feed{display:grid;gap:.4rem;margin:1rem 0 0;padding:0;list-style:none}
.feed li{
  padding:.7rem .8rem;border:1px solid var(--line);border-left:2px solid var(--copper);
  border-radius:var(--r);background:rgba(7,10,16,.4);
}
.feed strong{display:block;font-size:.88rem}.feed span{display:block;margin-top:.15rem;color:var(--muted);font-size:.74rem;overflow-wrap:anywhere}
.feed p{margin:.35rem 0 0;color:var(--ink);font-size:.86rem;line-height:1.45}
.watch-empty{margin-top:.85rem}
.limit{margin:1rem 0 0;padding:.75rem;border-left:2px solid var(--line-hot);color:var(--faint);font-size:.78rem;line-height:1.45}
.map-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr));gap:.5rem;margin:.85rem 0 0;padding:0;list-style:none}
.map-node{min-height:5.2rem;padding:.8rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016}
.map-node strong{font:550 1rem var(--font-display)}.map-node span{display:block;margin-top:.3rem;color:var(--faint);font:.6rem var(--font-mono)}
`;

export function watchHtml(): string {
  const body = `
  <header style="margin-bottom:1.25rem">
    <h1>Public projection</h1>
    <p class="muted">Read-only. Redacted. Not world truth.</p>
    <div class="meta">
      <span>read-only</span>
      <span id="watch-cycle">cycle —</span>
      <span id="watch-seq">seq —</span>
      <span id="watch-updated">waiting</span>
    </div>
  </header>

  <section class="watch-grid">
    <article class="card pad watch-hero">
      <h2 id="watch-headline" aria-live="polite">Connecting…</h2>
      <p class="muted" id="watch-copy"></p>
      <div class="btn-row" style="margin-top:1rem">
        <button type="button" class="btn primary" id="watch-refresh">Refresh projection</button>
        <button type="button" class="btn quiet" id="watch-pause" aria-pressed="false">Pause updates</button>
        <span class="tag" id="watch-state" aria-live="polite">connecting</span>
        <span class="tag" id="watch-fresh">freshness —</span>
      </div>
      <ul class="feed" id="watch-feed"></ul>
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

    function esc(s) {
      return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
    }
    function titleCase(raw) {
      return String(raw || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    function render(data) {
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      const players = data.players_present ?? data.player_count ?? 0;
      const status = data.world_status || "";
      const fresh = data.freshness || "live";
      $("watch-cycle").textContent = "cycle " + (data.cycle ?? "—");
      $("watch-seq").textContent = "seq " + (data.sequence ?? "—");
      $("watch-players").textContent = String(players);
      $("watch-rooms").textContent = String(rooms.length);
      $("watch-world").textContent = data.world_id || "—";
      $("watch-updated").textContent = "updated " + new Date().toLocaleTimeString();
      $("watch-fresh").textContent = (status ? status + " · " : "") + (fresh || "live");
      $("watch-headline").textContent = players
        ? players + " player" + (players === 1 ? " is" : "s are") + " present in the public projection."
        : "World not moving yet.";
      $("watch-copy").textContent = rooms.length
        ? "Known Chamber sites are listed as text — not a graphic map."
        : "No public sites exposed yet.";

      const feed = $("watch-feed");
      feed.replaceChildren();
      if (!rooms.length) {
        const li = document.createElement("li");
        li.className = "empty watch-empty";
        li.innerHTML = "World not moving yet. <a class='btn' href='/play'>Open PLAY</a>";
        feed.append(li);
      } else {
        rooms.slice(0, 8).forEach(r => {
          const li = document.createElement("li");
          const ents = Array.isArray(r.entities) ? r.entities : [];
          const exits = Array.isArray(r.exits) ? r.exits : [];
          const entLine = ents.length
            ? ents.map(e => titleCase(e.label || e.entity_id)).join(" · ")
            : "no visible objects";
          const exitLine = exits.length
            ? exits.map(x => (x.direction || "") + (x.to_room_name ? " to " + x.to_room_name : "")).join(" · ")
            : (r.exit_count ? r.exit_count + " exits" : "no listed exits");
          li.innerHTML = "<strong>" + esc(r.name || r.room_id || "site") + "</strong>" +
            (r.description ? "<p>" + esc(r.description) + "</p>" : "") +
            "<span>" + esc(entLine) + "</span><span>" + esc(exitLine) + "</span>";
          feed.append(li);
        });
      }

      const map = $("watch-map");
      map.replaceChildren();
      if (!rooms.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "World not moving yet.";
        map.append(li);
      } else {
        rooms.forEach(r => {
          const li = document.createElement("li");
          li.className = "map-node";
          const ents = Array.isArray(r.entities) ? r.entities : [];
          li.innerHTML = "<strong>" + esc(r.name || r.room_id) + "</strong><span>" +
            esc(ents.map(e => titleCase(e.label || "")).filter(Boolean).join(" · ") || "empty") +
            "</span>";
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
        if (state.paused) {
          tag.textContent = "paused";
          tag.className = "tag warn";
        } else {
          const fresh = data.freshness || "live";
          tag.textContent = fresh === "live" ? "live" : fresh;
          tag.className = "tag " + (fresh === "incident" ? "bad" : fresh === "live" ? "ok" : "warn");
        }
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
      $("watch-pause").setAttribute("aria-pressed", state.paused ? "true" : "false");
      const tag = $("watch-state");
      if (state.paused) {
        tag.textContent = "paused";
        tag.className = "tag warn";
      }
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
