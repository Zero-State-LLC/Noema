/** Public WATCH — Lightweight Spectator Upgrade (watch-live/1.0). */

import { productShell } from "./shell";

const EXTRA = `
.watch-head{margin-bottom:1.1rem}
.watch-head h1{margin:0 0 .3rem}
.watch-meta{display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:center}
.watch-hero{
  min-height:6.5rem;padding:1rem 1.05rem .9rem;
  border:1px solid var(--line);border-left:3px solid var(--copper);
  border-radius:var(--r);background:#0a1016;
}
.watch-hero.major{border-left-color:var(--ember)}
.watch-kicker{margin:0 0 .35rem;color:var(--faint);font:.62rem/1.2 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}
.watch-hero h2{margin:0;font:550 clamp(1.15rem,2.6vw,1.7rem)/1.25 var(--font-display)}
.watch-hero .sub{margin:.4rem 0 0;color:var(--muted);font:.82rem/1.4 var(--font-mono)}
.watch-banner{
  display:none;margin:.75rem 0 0;padding:.55rem .2rem;text-align:center;
  color:var(--ember);font:.72rem/1.3 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.watch-banner.on{display:block}
.watch-stage{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(16rem,.85fr);gap:.75rem;margin-top:.75rem}
@media(max-width:860px){.watch-stage{grid-template-columns:1fr}}
.watch-graph{margin:0;padding:0;list-style:none;display:grid;gap:.4rem}
.watch-site{
  padding:.65rem .75rem;border:1px solid var(--line);border-radius:var(--r);background:#0a1016;
}
.watch-site.active{border-color:var(--line-hot)}
.watch-site summary{
  cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;gap:.35rem .65rem;align-items:baseline;
  font:550 1rem/1.3 var(--font-display);
}
.watch-site summary::-webkit-details-marker{display:none}
.watch-site summary:focus-visible{outline:2px solid var(--copper);outline-offset:3px}
.watch-mark{color:var(--copper);font:550 .85rem var(--font-mono)}
.watch-count{color:var(--muted);font:.68rem var(--font-mono)}
.watch-exits{display:block;margin:.3rem 0 0;color:var(--faint);font:.7rem/1.4 var(--font-mono)}
.watch-inspect{margin:.65rem 0 0;padding-top:.55rem;border-top:1px solid var(--line);font:.8rem/1.45 var(--font-mono);color:var(--ink)}
.watch-inspect p{margin:.2rem 0}
.watch-pre{
  margin:.75rem 0 0;padding:.7rem .8rem;border:1px solid var(--line);border-radius:var(--r);
  background:#080c12;color:var(--faint);font:.68rem/1.45 var(--font-mono);white-space:pre;overflow:auto;
}
@media(max-width:860px){.watch-pre{display:none}}
.watch-feed{display:grid;gap:.35rem;margin:0;padding:0;list-style:none}
.watch-feed li{
  display:grid;grid-template-columns:auto 1fr;gap:.15rem .55rem;align-items:baseline;
  min-height:2.4rem;padding:.55rem .7rem;border:1px solid var(--line);border-radius:var(--r);
  background:rgba(7,10,16,.45);color:var(--ink);
}
.watch-feed li.quiet{opacity:.62}
.watch-feed .mark{color:var(--faint);font:.75rem var(--font-mono)}
.watch-feed li.notable .mark,.watch-feed li.notable .line{color:var(--ink);font-weight:550}
.watch-feed li.major .mark{color:var(--ember);font-weight:700}
.watch-feed .line{font:.86rem/1.35 var(--font-body);overflow-wrap:anywhere}
.watch-feed .meta{grid-column:2;color:var(--faint);font:.68rem var(--font-mono)}
.watch-empty{color:var(--muted);font:.86rem}
@media(prefers-reduced-motion:reduce){
  .watch-feed li,.watch-hero,.watch-banner{transition:none}
}
`;

export function watchHtml(): string {
  const body = `
  <header class="watch-head">
    <h1>Public projection</h1>
    <p class="muted">Read-only. Redacted. Not world truth.</p>
    <div class="watch-meta meta">
      <span>read-only</span>
      <span id="watch-world">world —</span>
      <span id="watch-cycle">cycle —</span>
      <span id="watch-seq">seq —</span>
      <span id="watch-players">players —</span>
      <span id="watch-updated">waiting</span>
      <button type="button" class="btn primary" id="watch-refresh">Refresh projection</button>
      <button type="button" class="btn quiet" id="watch-pause" aria-pressed="false">Pause updates</button>
      <span class="tag" id="watch-state" aria-live="polite">connecting</span>
      <span class="tag" id="watch-fresh">freshness —</span>
    </div>
  </header>

  <article class="watch-hero" id="watch-hero">
    <p class="watch-kicker">Current event</p>
    <h2 id="watch-headline" aria-live="polite">Connecting…</h2>
    <p class="sub" id="watch-copy"></p>
    <div class="watch-banner" id="watch-banner" hidden></div>
  </article>

  <section class="watch-stage">
    <section class="card pad" aria-labelledby="watch-graph-label">
      <p class="kicker" id="watch-graph-label">Public sites</p>
      <nav aria-label="Public sites">
        <ul class="watch-graph" id="watch-map"></ul>
      </nav>
      <pre class="watch-pre" id="watch-pre" aria-hidden="true" hidden></pre>
    </section>
    <section class="card pad" aria-labelledby="watch-feed-label">
      <p class="kicker" id="watch-feed-label">Recent</p>
      <ol class="watch-feed" id="watch-feed"></ol>
    </section>
  </section>

  <p class="limit">Spectator projection is never world truth and never mutates the ledger.</p>

  <script>
  (() => {
    const POLL_MS = 10000;
    const TIER_RANK = { NORMAL: 1, NOTABLE: 2, MAJOR: 3 };
    const state = { paused: false, busy: false, held: null, majorLeft: 0, reduce: false };
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
      $("watch-players").textContent = "players " + players;
      $("watch-world").textContent = data.world_id || "world —";
      $("watch-updated").textContent = "updated " + new Date().toLocaleTimeString();
      $("watch-fresh").textContent = (status ? status + " · " : "") + (fresh || "live");

      const head = pickHeadline(data);
      state.held = head;
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
          const det = document.createElement("details");
          const sum = document.createElement("summary");
          sum.append(el("span", "", r.name || r.room_id || "site"));
          if (r.active || r.players_present > 0) sum.append(el("span", "watch-mark", "*"));
          if (r.players_present > 0) sum.append(el("span", "watch-count", String(r.players_present)));
          det.append(sum);
          const exits = Array.isArray(r.exits) ? r.exits : [];
          const exitLine = exits.length
            ? exits.map(x => (x.direction || "") + (x.to_room_name ? " to " + x.to_room_name : "")).join(" · ")
            : "no listed exits";
          det.append(el("span", "watch-exits", exitLine));
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
    }

    async function refresh() {
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
        showUnavailable(e.message || "Could not load public projection.");
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
      } else {
        refresh();
      }
    });
    refresh();
    setInterval(() => { if (!state.paused && !document.hidden) refresh(); }, POLL_MS);
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
