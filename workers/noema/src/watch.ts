/** Public WATCH — Lightweight Spectator Upgrade (watch-live/1.0). */

import { productShell } from "./shell";
import { phosphorInlineScript } from "./watch-phosphor";

const EXTRA = `
/* Hallmark · genre: atmospheric · macrostructure: Map-Diagram · design-system: site/design.md */
.watch-head{margin:0 0 1.25rem}
.watch-head h1{
  margin:0 0 .35rem;max-width:none;
  font:550 clamp(1.8rem,4.5vw,2.6rem)/1.05 var(--font-display);
  letter-spacing:-.02em;
}
.watch-head .muted{max-width:42rem}
.watch-meta{
  display:flex;flex-wrap:wrap;gap:.45rem .7rem;align-items:center;
  margin-top:.75rem;color:var(--faint);font:.68rem/1.3 var(--font-mono);
}
.watch-meta .tag{margin:0}
.watch-hero{
  min-height:5.5rem;padding:1.05rem 0 1.15rem;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.watch-hero.major{border-color:color-mix(in srgb,var(--ember) 55%, var(--line))}
.watch-col h2{margin:0 0 .55rem;font:550 1.05rem/1.2 var(--font-display)}
.watch-line{
  display:flex;gap:.65rem;align-items:flex-start;
  margin:0;font:550 clamp(1.25rem,2.8vw,1.85rem)/1.25 var(--font-display);
}
.watch-line .mark{flex:0 0 auto;color:var(--copper);font:550 1.05em var(--font-mono);line-height:1.2}
.watch-hero.major .watch-line .mark{color:var(--ember)}
.watch-hero .sub{margin:.4rem 0 0 1.7rem;color:var(--muted);font:.8rem/1.4 var(--font-mono)}
.watch-banner{display:none}
.watch-stage{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(15rem,.8fr);gap:1.25rem 2rem;margin-top:1.15rem}
@media(max-width:860px){.watch-stage{grid-template-columns:1fr;gap:1.25rem}}
.watch-phos{
  margin:.85rem 0 0;padding:0;border:0;background:transparent;
}
.watch-graph{margin:0;padding:0;list-style:none;display:grid;gap:.15rem}
.watch-site{padding:.2rem 0 .45rem;border-bottom:1px solid var(--line);font:500 .86rem/1.45 var(--font-mono)}
.watch-site.active{color:var(--ink)}
.watch-site-row{display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:baseline}
.watch-site summary{
  cursor:pointer;list-style:none;margin-top:.15rem;
  color:var(--faint);font:.7rem/1.3 var(--font-mono);
}
.watch-site summary::-webkit-details-marker{display:none}
.watch-site summary:focus-visible{outline:2px solid var(--copper);outline-offset:3px}
.watch-mark{color:var(--copper)}
.watch-count{color:var(--muted)}
.watch-exits{display:block;margin:.1rem 0 0 0;color:var(--faint);font:.78rem/1.4 var(--font-mono)}
.watch-inspect{margin:.45rem 0 .15rem;color:var(--ink);font:.78rem/1.45 var(--font-mono)}
.watch-inspect p{margin:.15rem 0}
.watch-pre{
  margin:.7rem 0 0;padding:0;border:0;background:transparent;
  color:var(--faint);font:.72rem/1.45 var(--font-mono);white-space:pre;overflow:auto;
}
@media(max-width:860px){.watch-pre{display:none}}
.watch-feed{display:grid;gap:.15rem;margin:0;padding:0;list-style:none}
.watch-feed li{
  display:grid;grid-template-columns:1.1rem 1fr;gap:.1rem .45rem;align-items:baseline;
  padding:.28rem 0;border-bottom:1px solid rgba(42,51,66,.35);
  color:var(--ink);font:.86rem/1.4 var(--font-mono);
}
.watch-feed li.quiet{opacity:.58}
.watch-feed .mark{color:var(--faint)}
.watch-feed li.notable .mark,.watch-feed li.notable .line{color:var(--ink);font-weight:550}
.watch-feed li.major .mark{color:var(--ember);font-weight:700}
.watch-feed .line{overflow-wrap:anywhere}
.watch-feed .meta{grid-column:2;color:var(--faint);font:.7rem}
.watch-empty{color:var(--muted);font:.86rem var(--font-mono);padding:.2rem 0}
.watch-note{margin:1.25rem 0 0;color:var(--faint);font:.72rem/1.45 var(--font-mono)}
.watch-stage{position:relative}
.watch-atmos{
  position:absolute;inset:0;pointer-events:none;opacity:.14;
  background:url(/assets/watch-spectator.jpg) center/cover no-repeat;
}
.watch-key{
  margin:1.15rem 0 0;padding-top:.75rem;border-top:1px solid var(--line);
  color:var(--faint);font:.75rem/1.4 var(--font-mono);
}
.watch-key summary{cursor:pointer;color:var(--muted)}
.watch-key img{display:block;width:min(100%,40rem);height:auto;margin:.65rem 0;image-rendering:pixelated}
.watch-key .more{margin:.35rem 0 0}
@media(prefers-reduced-motion:reduce){
  .watch-feed li,.watch-hero{transition:none}
}
.watch-phos[hidden]{display:none}
.watch-phos-bar{
  display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:center;
  margin:0 0 .4rem;color:var(--faint);font:.75rem/1.2 var(--font-body);
}
.watch-phos-bar .btn{padding:.15rem .45rem;font-size:.62rem}
.watch-phos-bar .btn[aria-pressed="true"]{border-color:var(--copper);color:var(--copper)}
.watch-phosphor{
  display:block;width:100%;max-width:36rem;height:auto;aspect-ratio:16/9;
  background:var(--void);image-rendering:pixelated;image-rendering:crisp-edges;
}
`;

export function watchHtml(): string {
  const body = `
  <header class="watch-head">
    <h1>The Chamber</h1>
    <p class="muted">A public window on the live world. Not the world itself.</p>
    <div class="watch-meta">
      <span id="watch-world" class="sr">world —</span>
      <span id="watch-cycle">cycle —</span>
      <span id="watch-seq">seq —</span>
      <span id="watch-players">0 players</span>
      <span class="tag" id="watch-state" aria-live="polite">connecting</span>
      <span id="watch-fresh" class="sr">freshness —</span>
      <span id="watch-updated" class="sr">waiting</span>
      <button type="button" class="btn quiet" id="watch-refresh">Refresh</button>
      <button type="button" class="btn quiet" id="watch-pause" aria-pressed="false">Pause</button>
      <button type="button" class="btn quiet" id="watch-mode-text" aria-pressed="true">TEXT</button>
      <button type="button" class="btn quiet" id="watch-mode-pixel" aria-pressed="false">PIXEL</button>
    </div>
  </header>

  <article class="watch-hero" id="watch-hero">
    <h2 class="watch-line"><span class="mark" id="watch-mark">&gt;</span><span id="watch-headline" aria-live="polite">Connecting…</span></h2>
    <p class="sub" id="watch-copy"></p>
    <div class="watch-banner" id="watch-banner" hidden></div>
  </article>

  <section class="watch-stage">
    <div class="watch-atmos" aria-hidden="true"></div>
    <section class="watch-col" aria-labelledby="watch-graph-label">
      <h2 id="watch-graph-label">Places</h2>
      <nav aria-label="Public sites">
        <ul class="watch-graph" id="watch-map"></ul>
      </nav>
      <div class="watch-phos" id="watch-phos-wrap" hidden>
        <div class="watch-phos-bar">
          <span>Public sketch — not the world.</span>
        </div>
        <canvas class="watch-phosphor" id="watch-phosphor" width="320" height="180" role="img" aria-label="Public topology sketch"></canvas>
      </div>
      <pre class="watch-pre" id="watch-pre" aria-hidden="true" hidden></pre>
    </section>
    <section class="watch-col" aria-labelledby="watch-feed-label">
      <h2 id="watch-feed-label">Recent</h2>
      <ol class="watch-feed" id="watch-feed"></ol>
    </section>
  </section>

  <details class="watch-key">
    <summary>Projection key</summary>
    <img src="/assets/legend-mini.png" width="1100" height="168" alt="WATCH key: player, active site, uncertain site, route, recent movement, signal, anomaly"/>
    <p class="more"><a href="/assets/legend.png">Full key</a></p>
  </details>
  <p class="watch-note">This window is a projection, not the world.</p>

  <script>
  (() => {
    const POLL_MS = 10000;
    const TIER_RANK = { NORMAL: 1, NOTABLE: 2, MAJOR: 3 };
    const state = { paused: false, busy: false, held: null, majorLeft: 0, reduce: false, sock: null };
    const $ = id => document.getElementById(id);

    try {
      state.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { state.reduce = false; }

    function el(tag, className, text) {
      const n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null && text !== "") n.textContent = text;
      return n;
    }
    function roomName(rooms, id) {
      const r = (rooms || []).find(x => x.room_id === id);
      return r ? (r.name || r.room_id) : "";
    }
    function ago(ms) {
      if (!ms) return "";
      const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
      if (s < 60) return s + " sec ago";
      if (s < 3600) return Math.round(s / 60) + " min ago";
      return Math.round(s / 3600) + " hr ago";
    }
    function rankPick(events) {
      return [...events].sort((a, b) => {
        const t = (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
        return t || (b.sequence - a.sequence);
      })[0] || null;
    }
    function pickHeadline(data) {
      const events = Array.isArray(data.recent_events) ? data.recent_events : [];
      const notable = data.notable_event || null;
      if (data.freshness === "incident") {
        return notable && notable.projection_id === "world_status"
          ? notable
          : { sequence: data.sequence || 0, tier: "MAJOR", projection_id: "world_status",
              line: "World incident — projection is stale." };
      }
      const window = notable ? [notable, ...events.filter(e => e.sequence !== notable.sequence)] : events;
      const newest = Math.max(data.sequence || 0, ...window.map(e => e.sequence || 0));
      if (state.held) {
        const inWin = window.some(e => e.sequence === state.held.sequence && e.projection_id === state.held.projection_id);
        const higher = window.some(e => (TIER_RANK[e.tier] || 0) > (TIER_RANK[state.held.tier] || 0));
        const aged = newest - state.held.sequence > 8;
        if (inWin && !higher && !aged) return state.held;
        if (aged && inWin) {
          const next = rankPick(window.filter(e => e.sequence !== state.held.sequence));
          if (next) return next;
        }
      }
      if (notable && notable.line) return notable;
      const ranked = rankPick(window);
      if (ranked) return ranked;
      const quiet = { sequence: 0, tier: "NORMAL", projection_id: "world_status", line: "The Chamber is quiet." };
      if ((data.players_present || 0) > 0) quiet.detail = data.players_present + " players present.";
      return quiet;
    }
    function markFor(tier) {
      if (tier === "MAJOR") return "!";
      if (tier === "NOTABLE") return ">";
      return "·";
    }
    function shouldPre(rooms) {
      if (!rooms.length || rooms.length > 8) return false;
      return rooms.every(r => (Array.isArray(r.exits) ? r.exits.length : 0) <= 3);
    }
    function drawPre(rooms) {
      return rooms.map(r => {
        const star = r.active || (r.players_present > 0) ? " *" : "";
        const exits = (r.exits || []).map(x => "--" + (x.direction || "?") + "--> " + (x.to_room_name || x.to_room_id || "")).join("  ");
        return (r.name || r.room_id) + star + (exits ? "  " + exits : "");
      }).join("\\n");
    }
    function siteRecent(events, roomId) {
      return (events || []).filter(e => e.room_id === roomId).slice(0, 3);
    }
    function render(data) {
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      const players = data.players_present ?? 0;
      const status = data.world_status || "";
      const fresh = data.freshness || "live";
      const events = Array.isArray(data.recent_events) ? data.recent_events : [];
      $("watch-cycle").textContent = "cycle " + (data.cycle ?? "—");
      $("watch-seq").textContent = "seq " + (data.sequence ?? "—");
      $("watch-players").textContent = players + " player" + (players === 1 ? "" : "s");
      $("watch-world").textContent = data.world_id || "world —";
      $("watch-updated").textContent = "updated " + new Date().toLocaleTimeString();
      $("watch-fresh").textContent = (status ? status + " · " : "") + (fresh || "live");

      const head = pickHeadline(data);
      state.held = head;
      $("watch-mark").textContent = markFor(head.tier || "NORMAL");
      $("watch-headline").textContent = head.line || "The Chamber is quiet.";
      const site = roomName(rooms, head.room_id);
      const when = ago(head.occurred_at);
      const bits = [site, when, head.detail].filter(Boolean);
      $("watch-copy").textContent = bits.join(" · ");
      const hero = $("watch-hero");
      hero.className = "watch-hero" + (head.tier === "MAJOR" ? " major" : "");
      const banner = $("watch-banner");
      if (head.tier === "MAJOR" && !state.reduce) {
        state.majorLeft = 2;
        banner.hidden = false;
        banner.className = "watch-banner on";
        banner.textContent = head.line;
      } else if (state.majorLeft > 0 && !state.reduce) {
        state.majorLeft -= 1;
        banner.hidden = false;
        banner.className = "watch-banner on";
      } else {
        state.majorLeft = 0;
        banner.hidden = true;
        banner.className = "watch-banner";
        banner.textContent = "";
      }

      const feed = $("watch-feed");
      feed.replaceChildren();
      if (!events.length) {
        feed.append(el("li", "watch-empty", "Nothing public yet."));
      } else {
        events.forEach((ev, i) => {
          const li = el("li", (ev.tier === "MAJOR" ? "major" : ev.tier === "NOTABLE" ? "notable" : "") + (i >= 2 ? " quiet" : ""));
          li.append(el("span", "mark", markFor(ev.tier)));
          const wrap = el("div", "");
          wrap.append(el("span", "line", ev.line || ""));
          const meta = [roomName(rooms, ev.room_id), ago(ev.occurred_at)].filter(Boolean).join(" · ");
          if (meta) wrap.append(el("span", "meta", meta));
          li.append(wrap);
          feed.append(li);
        });
      }

      const map = $("watch-map");
      map.replaceChildren();
      if (!rooms.length) {
        map.append(el("li", "watch-empty", "No public sites exposed yet."));
      } else {
        rooms.forEach(r => {
          const li = el("li", "watch-site" + (r.active || r.players_present > 0 ? " active" : ""));
          const row = el("div", "watch-site-row");
          row.append(el("span", "", r.name || r.room_id || "site"));
          if (r.active || r.players_present > 0) row.append(el("span", "watch-mark", "*"));
          if (r.players_present > 0) row.append(el("span", "watch-count", String(r.players_present)));
          li.append(row);
          const exits = Array.isArray(r.exits) ? r.exits : [];
          const exitLine = exits.length
            ? exits.map(x => (x.direction || "") + " → " + (x.to_room_name || x.to_room_id || "")).join(" · ")
            : "no listed exits";
          li.append(el("span", "watch-exits", exitLine));
          const det = document.createElement("details");
          const sum = document.createElement("summary");
          sum.textContent = "Look closer";
          det.append(sum);
          const box = el("div", "watch-inspect");
          const labels = Array.isArray(r.public_player_labels) ? r.public_player_labels : [];
          box.append(el("p", "", "Players:   " + (labels.length ? labels.join(", ") : "none visible")));
          const ents = Array.isArray(r.entities) ? r.entities : [];
          box.append(el("p", "", "Visible:   " + (ents.length
            ? ents.map(e => e.label || e.entity_id).filter(Boolean).join(" · ")
            : "no visible objects")));
          const rec = siteRecent(events, r.room_id);
          box.append(el("p", "", "Recent:    " + (rec.length ? rec.map(e => e.line).join(" · ") : "nothing public yet")));
          det.append(box);
          li.append(det);
          map.append(li);
        });
      }

      const pre = $("watch-pre");
      if (shouldPre(rooms) && window.matchMedia("(min-width: 861px)").matches) {
        pre.hidden = false;
        pre.textContent = drawPre(rooms);
      } else {
        pre.hidden = true;
        pre.textContent = "";
      }
      if (window.NoemaPhosphor) window.NoemaPhosphor.update(data);
    }

    function showUnavailable(msg) {
      $("watch-headline").textContent = "Projection unavailable.";
      $("watch-copy").textContent = msg || "";
      $("watch-state").textContent = "unavailable";
      $("watch-state").className = "tag";
      $("watch-map").replaceChildren(el("li", "watch-empty", "Projection unavailable."));
      $("watch-feed").replaceChildren(el("li", "watch-empty", "Projection unavailable."));
      $("watch-pre").hidden = true;
      $("watch-pre").textContent = "";
      if (window.NoemaPhosphor) window.NoemaPhosphor.fail();
    }

    function applyLive(data) {
      render(data);
      const tag = $("watch-state");
      if (state.paused) {
        tag.textContent = "paused";
        tag.className = "tag warn";
        return;
      }
      const fresh = data.freshness || "live";
      tag.textContent = fresh === "live" ? "live" : fresh;
      tag.className = "tag " + (fresh === "incident" ? "bad" : fresh === "live" ? "ok" : "warn");
    }

    async function refreshHttp() {
      if (state.busy || document.hidden) return;
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
        applyLive(data);
      } catch (e) {
        showUnavailable(e.message || "Could not load public projection.");
      } finally {
        state.busy = false;
      }
    }

    function openStream() {
      if (!window.WebSocket) return;
      try {
        const proto = location.protocol === "https:" ? "wss:" : "ws:";
        const sock = new WebSocket(proto + "//" + location.host + "/v1/watch/stream");
        sock.onmessage = (ev) => {
          try { applyLive(JSON.parse(ev.data)); } catch (e) { /* keep last frame */ }
        };
        sock.onclose = () => { if (state.sock === sock) state.sock = null; };
        sock.onerror = () => { try { sock.close(); } catch (e) { /* fall back to HTTP */ } };
        state.sock = sock;
      } catch (e) {
        state.sock = null;
      }
    }

    function refresh() {
      if (state.paused || document.hidden) return;
      if (state.sock && state.sock.readyState === 1) {
        state.sock.send("poll");
        return;
      }
      if (!state.sock || state.sock.readyState > 1) openStream();
      refreshHttp();
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
      } else {
        refresh();
      }
    });
    openStream();
    refresh();
    setInterval(() => { if (!state.paused && !document.hidden) refresh(); }, POLL_MS);
  })();
  </script>
  <script>
  ${phosphorInlineScript()}
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
