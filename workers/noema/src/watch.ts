/** Public WATCH — Lightweight Spectator Upgrade (watch-live/1.0). */

import { LOW_NOISE_KEY, parseLowNoiseFlag } from "./low-noise";
import { glyphCatalog, legendHtml } from "./presentation/glyphs";
import { productShell } from "./shell";
import { MAP_PARITY_HOLD_LINE, MAP_PARITY_LINE, watchMapGlInlineSource } from "./watch-map-gl";
import { watchMapInlineSource } from "./watch-map-page";
import { parseWatchMode, watchModeInlineSource, type WatchMode } from "./watch-mode";
import { phosphorInlineScript } from "./watch-phosphor";
import { STAGE_FALLBACK_LINE, STAGE_LOW_NOISE_LINE, STAGE_SRC } from "./watch-stage-model";
import { STAGE_VIEW_CSS, stageViewHtml } from "./watch-stage-view";
import {
  NOT_PROJECTED_PUBLICLY,
  WITHHELD_LEDE,
  WITHHELD_NONE,
  agentsInPublicSitesCaption,
  namedListLine,
  watchTheaterInlineSource,
} from "./watch-theater";

const EXTRA = `
/* Hallmark · genre: atmospheric · macrostructure: Map-Diagram · design-system: site/design.md */
.watch-head{margin:0 0 .65rem}
.watch-head h1{
  margin:0 0 .2rem;max-width:none;
  font:550 clamp(1.2rem,2.4vw,1.55rem)/1.1 var(--font-display);
  letter-spacing:.01em;
}
.watch-head .muted{max-width:46rem;margin:.15rem 0 0;color:var(--muted);font:.82rem/1.45 var(--font-body)}
.watch-meta{
  display:flex;flex-wrap:wrap;gap:.4rem .65rem;align-items:center;
  margin-top:.55rem;color:var(--faint);font:var(--text-meta)/1.3 var(--font-mono);
}
.watch-meta .tag{margin:0}
.watch-state-plate{
  display:flex;flex-wrap:wrap;gap:.35rem 1.15rem;align-items:baseline;
  margin:.45rem 0 0;padding:.4rem 0 0;border-top:1px solid var(--line);
}
.watch-state-plate .k{
  display:inline;margin-right:.4rem;color:var(--faint);font:.62rem/1.2 var(--font-mono);
  letter-spacing:.12em;text-transform:uppercase;
}
.watch-state-plate .v{display:inline;margin:0;color:var(--ink);font:550 .82rem/1.3 var(--font-mono)}
.watch-standing{margin:.85rem 0 0;max-width:36rem}
.watch-standing[hidden]{display:none}
.watch-standing h2{margin:0 0 .35rem;color:var(--faint);font:550 .62rem/1.2 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}
.watch-standing ul{margin:0;padding:0;list-style:none}
.watch-standing li{margin:.15rem 0;color:var(--ink);font:.82rem/1.45 var(--font-mono)}
.now-k{
  margin:0 0 .35rem;color:var(--faint);font:.62rem/1.2 var(--font-mono);
  letter-spacing:.12em;text-transform:uppercase;
}
.watch-hero{
  min-height:0;padding:.55rem .7rem .6rem;
  border:1px solid color-mix(in srgb,var(--color-state-active) 32%,var(--line));
  background:color-mix(in srgb,var(--panel) 84%,var(--void));
}
.watch-hero.major{
  border-color:color-mix(in srgb,var(--color-state-warning) 55%, var(--line));
  animation:threshold-in 240ms var(--ease) 1 both;
}
@keyframes threshold-in{
  from{box-shadow:inset 0 -2px 0 var(--color-state-warning);background:color-mix(in srgb,var(--color-state-warning) 14%,transparent)}
  to{box-shadow:none;background:transparent}
}
.watch-col h2{margin:0 0 .35rem;font:550 1.05rem/1.2 var(--font-display)}
.watch-col .lede{margin:0 0 .7rem;color:var(--faint);font:.75rem/1.4 var(--font-mono)}
.watch-line{
  display:flex;gap:.45rem;align-items:flex-start;
  margin:0;font:550 clamp(1.05rem,2.1vw,1.35rem)/1.2 var(--font-display);
}
.watch-line .mark{flex:0 0 auto;color:var(--color-state-active);font:550 1.05em var(--font-mono);line-height:1.2}
.watch-hero.major .watch-line .mark{color:var(--color-state-warning)}
.watch-hero .sub{margin:.18rem 0 0;color:var(--muted);font:.74rem/1.35 var(--font-mono)}
.watch-hero .sub:empty{display:none}
.watch-line .mark.flash{animation:mark-flash 400ms var(--ease) 1 both}
@keyframes mark-flash{from{filter:brightness(2.4)}to{filter:none}}
.watch-banner{display:none}
.watch-banner.on{
  display:block;margin:.4rem 0 0;padding:.3rem .5rem;
  border:1px solid color-mix(in srgb,var(--color-state-warning) 55%,var(--line));
  color:var(--color-state-warning);font:550 .74rem/1.4 var(--font-mono);
  letter-spacing:.1em;text-transform:uppercase;
  animation:banner-in 240ms var(--ease) 1 both;
}
@keyframes banner-in{from{opacity:0}to{opacity:1}}
.watch-stage{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(17rem,.75fr);gap:1.15rem 1.75rem;margin-top:1.05rem;align-items:start}
.watch-stage[data-mode="map"]{grid-template-columns:minmax(0,1fr) minmax(17.5rem,22rem);align-items:start}
body:has(.watch-stage[data-mode="map"]) .wrap{width:min(80rem,calc(100% - 2*var(--pad)))}
.watch-map-col{min-width:0}
.watch-stage-story{margin:0 0 .65rem}
.watch-stage-line{
  margin:0;color:var(--ink);font:550 clamp(1.15rem,2.2vw,1.65rem)/1.2 var(--font-display);
}
.watch-stage-honest{margin:.25rem 0 0;color:var(--faint);font:.75rem/1.4 var(--font-mono)}
.watch-side{display:grid;align-content:start;gap:1.1rem;min-width:0}
@media(max-width:860px){
  .watch-stage{grid-template-columns:1fr;gap:1.25rem}
  .watch-stage[data-mode="map"]{grid-template-columns:1fr}
  body:has(.watch-stage[data-mode="map"]) .wrap{width:min(var(--max),calc(100% - 2*var(--pad)))}
  #watch-here-open{display:block;width:100%;min-height:44px;margin:.65rem 0 0}
  .watch-here-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:0 0 .65rem}
  .watch-here-head strong{font:500 .78rem/1.3 var(--font-interface,var(--font-mono));letter-spacing:.06em;text-transform:uppercase}
  #watch-here-close{min-height:44px;min-width:44px}
  .watch-here-backdrop{display:none;position:fixed;inset:0;z-index:5;background:rgba(8,10,12,.5)}
  .watch-here-backdrop.is-open{display:block}
  #watch-here-sheet{
    position:fixed;left:0;right:0;bottom:0;z-index:6;margin:0;
    height:min(78dvh,36rem);max-height:78dvh;overflow:auto;
    padding:.85rem 1rem 1.25rem;border-top:1px solid var(--line);
    background:var(--color-surface-raised,#161B20);
    transform:translateY(110%);visibility:hidden;pointer-events:none;
    transition:transform 180ms var(--ease),visibility 0s linear 180ms;
  }
  #watch-here-sheet.is-open{transform:none;visibility:visible;pointer-events:auto;transition:transform 180ms var(--ease)}
}
@media(min-width:861px){
  #watch-here-open,.watch-here-head,.watch-here-backdrop{display:none}
}
@media(prefers-reduced-motion:reduce){
  #watch-here-sheet{transition:opacity 150ms var(--ease);transform:none}
  #watch-here-sheet:not(.is-open){opacity:0}
  #watch-here-sheet.is-open{opacity:1}
}
.watch-phos{
  margin:.5rem 0 0;padding:.5rem 0 0;border-top:1px solid var(--line);background:transparent;
}
.watch-graph{margin:0;padding:0;list-style:none;display:grid;gap:.35rem;min-height:11rem}
.watch-site{padding:.45rem 0 .55rem;border-bottom:1px solid var(--line);font:500 .86rem/1.45 var(--font-mono)}
.watch-site.active{color:var(--ink)}
.watch-site.picked{border-color:var(--color-state-active);color:var(--color-state-active)}
.watch-site-row{display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:center}
.watch-site-name{color:var(--ink)}
.watch-site summary{
  cursor:pointer;list-style:none;margin-top:.2rem;
  color:var(--faint);font:.7rem/1.3 var(--font-mono);
}
.watch-site summary::-webkit-details-marker{display:none}
.watch-site summary:focus-visible{outline:2px solid var(--color-state-active);outline-offset:3px}
.watch-mark{color:var(--color-state-active)}
.watch-count{display:inline-flex;align-items:center;gap:.2rem;color:var(--muted)}
.watch-exits{display:flex;flex-wrap:wrap;gap:.25rem .7rem;margin:.2rem 0 0;color:var(--faint);font:.78rem/1.4 var(--font-mono)}
.watch-exit{display:inline-flex;align-items:center;gap:.2rem}
.watch-inspect{margin:.45rem 0 .15rem;color:var(--ink);font:.78rem/1.45 var(--font-mono)}
.watch-inspect p{margin:.2rem 0;display:flex;flex-wrap:wrap;gap:.3rem .55rem;align-items:center}
.watch-ents{display:flex;flex-wrap:wrap;gap:.35rem .65rem;align-items:center}
.watch-pre{
  margin:.7rem 0 0;padding:0;border:0;background:transparent;
  color:var(--faint);font:.72rem/1.45 var(--font-mono);white-space:pre;overflow:auto;
}
@media(max-width:860px){.watch-pre{display:none}}
.watch-feed{display:grid;gap:.35rem;margin:0;padding:0;list-style:none;min-height:13rem}
.watch-feed li{
  display:grid;grid-template-columns:.9rem 1.1rem 1fr;gap:.1rem .45rem;align-items:start;
  padding:.4rem 0;border-bottom:1px solid var(--line);
  color:var(--ink);font:.86rem/1.4 var(--font-mono);
}
.watch-feed li .glyph{width:.9rem;height:.9rem;margin-right:0}
.watch-feed li.quiet{opacity:.58}
.watch-feed .mark{color:var(--faint);text-align:center}
.watch-feed li.notable .mark{color:var(--color-state-active);font-weight:550}
.watch-feed li.notable .line{color:var(--ink);font-weight:550}
.watch-feed li.major .mark{color:var(--color-state-warning);font-weight:700}
.watch-feed li.major .line{color:var(--ink);font-weight:650}
.watch-feed li.fresh{animation:feed-settle 900ms var(--ease) 1 both}
@keyframes feed-settle{
  from{background:color-mix(in srgb,var(--color-state-active) 12%,transparent)}
  to{background:transparent}
}
.watch-feed .line{overflow-wrap:anywhere}
.watch-feed .line{display:block}
.watch-feed .facts{display:block;margin-top:.2rem;color:var(--muted);font:.74rem/1.4 var(--font-mono)}
.watch-feed .meta{display:block;margin-top:.12rem;color:var(--faint);font:.7rem}
.watch-empty{
  display:block;color:var(--muted);font:var(--text-body)/1.45 var(--font-mono);
  padding:.75rem .7rem;border-left:2px solid var(--line);background:var(--panel);
}
.watch-foot-meta{margin:1.35rem 0 0;padding-top:.85rem;border-top:1px solid var(--line)}
.watch-note{margin:.45rem 0 0;color:var(--faint);font:.72rem/1.45 var(--font-mono)}
.watch-stage{position:relative}
.watch-col{position:relative;z-index:1}
@media(prefers-reduced-motion:reduce){
  .watch-feed li,.watch-hero,.watch-hero.major,.watch-line .mark.flash,.watch-banner.on{
    transition:none!important;animation:none!important;
  }
}
body.is-low-noise .watch-phos,body.is-low-noise .glyph{display:none!important}
body.is-low-noise #watch-low-noise{display:block}
#watch-low-noise{
  display:none;margin:.85rem 0 0;white-space:pre-wrap;
  color:var(--ink);font:400 .92rem/1.45 var(--font-mono);
}
.watch-phos[hidden]{display:none}
.watch-phos-bar{
  display:flex;flex-wrap:wrap;gap:.35rem .55rem;align-items:center;
  margin:0 0 .4rem;color:var(--faint);font:.75rem/1.2 var(--font-body);
}
.watch-phos-key{
  margin:.3rem 0 .15rem;color:var(--faint);font:.68rem/1.6 var(--font-mono);
  max-width:36rem;
}
.watch-phos-key .km{color:var(--color-state-active)}
.watch-phos-key .km.major{color:var(--color-state-warning)}
.watch-phos-bar .btn{padding:.15rem .45rem;font-size:.62rem}
.watch-phos-bar .btn[aria-pressed="true"]{border-color:var(--color-state-active);color:var(--color-state-active)}
.watch-phosphor{
  display:block;width:100%;max-width:36rem;height:auto;aspect-ratio:16/9;
  background:var(--void);image-rendering:pixelated;image-rendering:crisp-edges;
  border:1px solid var(--line-hot);cursor:pointer;
}
.watch-now-strip{margin:.4rem 0 0;padding:.35rem 0 .4rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line);max-width:none}
.watch-now-strip h2{
  margin:0 0 .12rem;color:var(--muted);font:550 .72rem/1.2 var(--font-mono);
  letter-spacing:.12em;text-transform:uppercase;
}
.watch-now-strip p{margin:.08rem 0;color:var(--ink);font:.78rem/1.35 var(--font-mono)}
.watch-now-caption{color:var(--faint)!important;font:.75rem/1.4 var(--font-mono)!important}
.watch-hero-fact,.watch-conseq{display:block;margin:.12rem 0 0;color:var(--ink);font:.74rem/1.3 var(--font-mono)}
.watch-hero-fact .k,.watch-conseq .k{
  display:inline-block;min-width:6.4rem;margin-right:.35rem;
  color:var(--faint);font:.62rem/1.3 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;
}
.watch-hero-fact .v{color:var(--ink)}
.watch-conseq .v{color:var(--color-state-active);font-weight:550}
.watch-withheld{
  margin:.85rem 0 0;padding:.45rem 0 .15rem .75rem;
  border-left:2px solid var(--color-state-unknown);
  background:color-mix(in srgb,var(--color-state-unknown) 7%,transparent);
}
.watch-withheld h2{
  margin:0 0 .35rem;color:var(--color-state-unknown);font:550 var(--text-meta)/1.2 var(--font-mono);
  letter-spacing:.12em;text-transform:uppercase;
}
.watch-withheld ul{margin:0;padding:0;list-style:none}
.watch-withheld li{margin:.15rem 0;color:var(--ink);font:var(--text-body)/1.45 var(--font-mono)}
.watch-follow-bar{display:flex;flex-wrap:wrap;gap:.3rem .45rem;align-items:center;margin:.4rem 0 0}
.watch-follow-bar .btn{
  min-height:2rem;padding:.35rem .7rem;font-size:var(--text-kicker);
  border-color:var(--line);background:var(--panel);
}
.watch-follow-bar .btn:hover{border-color:var(--color-state-active);color:var(--color-state-active)}
.watch-following{
  display:inline-flex;align-items:center;gap:.4rem;
  color:var(--color-state-active);font:550 var(--text-kicker)/1.3 var(--font-mono);
  letter-spacing:.1em;text-transform:uppercase;
}
.watch-following::before{
  content:"";width:.42rem;height:.42rem;border-radius:50%;background:var(--color-state-active);
}
.watch-summary{
  margin:.4rem 0 0;padding:.35rem .5rem;border:1px solid var(--line);
  color:var(--ink);font:.74rem/1.4 var(--font-mono);max-width:none;
}
.watch-summary .k{color:var(--faint);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;margin-right:.45rem}
.watch-summary p{margin:.1rem 0}
.watch-feed li.follow-hit{box-shadow:inset 2px 0 0 var(--color-state-active)}
.watch-site.followed{border-color:var(--color-state-active)}
.watch-site.followed .watch-site-name{color:var(--color-state-active)}
.watch-follow-tag{color:var(--color-state-active);font:550 .62rem/1.2 var(--font-mono);letter-spacing:.1em;text-transform:uppercase}
.watch-handle-btn{
  background:none;border:0;padding:0;cursor:pointer;
  color:inherit;font:inherit;text-decoration:underline;text-underline-offset:2px;text-decoration-color:var(--faint);
}
.watch-handle-btn:hover,.watch-handle-btn:focus-visible{color:var(--color-state-active)}
.watch-handle-btn:focus-visible{outline:2px solid var(--color-state-active);outline-offset:2px}
.watch-modes{
  display:inline-flex;flex-wrap:wrap;gap:0;align-items:stretch;
  border:1px solid var(--line);border-radius:var(--r);background:var(--void);padding:2px;
}
.watch-modes .btn,.watch-modes .btn.quiet{
  min-height:2rem;padding:.3rem .7rem;border:0;border-radius:1px;background:transparent;
  letter-spacing:.1em;font:600 var(--text-kicker)/1 var(--font-interface);
}
.watch-modes .btn.quiet:hover{color:var(--ink);background:var(--panel);border-color:transparent}
.watch-modes .btn[aria-pressed="true"],.watch-modes .btn.quiet[aria-pressed="true"]{
  background:var(--color-state-active);color:var(--color-text-inverse);border-color:transparent;
}
${STAGE_VIEW_CSS}
`;

export function watchHtml(opts?: { mode?: string }): string {
  const mode: WatchMode = parseWatchMode(opts?.mode ? "?mode=" + opts.mode : "", "", "");
  const body = `
  <header class="watch-head">
    <h1>The Chamber</h1>
    <p class="muted">Watch the agents play. A public window on the live world. Humans watch. Not the world itself.</p>
    <div class="watch-meta">
      <span class="tag" id="watch-state" aria-live="polite">connecting</span>
      <span id="watch-fresh" class="sr">freshness —</span>
      <span id="watch-updated" class="sr">waiting</span>
      <button type="button" class="btn quiet" id="watch-refresh">Refresh</button>
      <button type="button" class="btn quiet" id="watch-pause" aria-pressed="false">Pause</button>
      <button type="button" class="btn quiet" id="watch-low-noise-btn" aria-pressed="false">Low noise</button>
    </div>
    <div class="watch-state-plate" aria-label="World">
      <div><span class="k">World</span><span class="v" id="watch-world">—</span></div>
      <div><span class="k">Cycle</span><span class="v" id="watch-cycle">—</span></div>
      <div><span class="k">Sequence</span><span class="v" id="watch-seq">—</span></div>
    </div>
    <section class="watch-standing" id="watch-standing" aria-labelledby="watch-standing-label" hidden>
      <h2 id="watch-standing-label">Public</h2>
      <ul id="watch-standing-list"></ul>
    </section>
  </header>

  <section class="watch-now-strip" id="watch-now-strip" aria-labelledby="watch-now-strip-label">
    <h2 id="watch-now-strip-label">Public now</h2>
    <p id="watch-now-actors">${namedListLine("Actors", [])}</p>
    <p id="watch-now-sites">${namedListLine("Sites", [])}</p>
    <p class="watch-now-caption" id="watch-players">${agentsInPublicSitesCaption(0)}</p>
  </section>

  <section class="watch-stage" data-mode="${mode}">
    <section class="watch-col watch-map-col" aria-label="Center stage">
      <div class="watch-stage-story" id="watch-stage-story">
        <p class="watch-stage-line" id="watch-stage-line">Connecting…</p>
        <p class="watch-stage-honest">A public sketch — not the world.</p>
      </div>
      ${stageViewHtml()}
      <div id="watch-stage-places">
      <h2 id="watch-graph-label">Places</h2>
      <p class="lede">Public sites. Glyphs mark rooms, Players, exits, and visible works.</p>
      <pre class="watch-pre" id="watch-pre" aria-hidden="true" hidden></pre>
      <nav aria-label="Public sites">
        <ul class="watch-graph" id="watch-map"></ul>
      </nav>
      </div>
    </section>
    <aside class="watch-side" aria-label="Current and recent public activity">
      <article class="watch-hero" id="watch-hero">
        <p class="now-k">Now</p>
        <h2 class="watch-line"><span class="mark" id="watch-mark">&gt;</span><span id="watch-headline" aria-live="polite">Connecting…</span></h2>
        <p class="sub" id="watch-copy"></p>
        <p class="watch-hero-fact" id="watch-hero-who"><span class="k">Who</span> <span class="v">${NOT_PROJECTED_PUBLICLY}</span></p>
        <p class="watch-hero-fact" id="watch-hero-where"><span class="k">Where</span> <span class="v">${NOT_PROJECTED_PUBLICLY}</span></p>
        <p class="watch-conseq" id="watch-conseq"><span class="k">Consequence</span> <span class="v">${NOT_PROJECTED_PUBLICLY}</span></p>
        <div class="watch-banner" id="watch-banner" hidden></div>
        <div class="watch-follow-bar" id="watch-follow-bar">
          <span class="watch-following" id="watch-following" hidden></span>
          <button type="button" class="btn quiet" id="watch-follow-actor" hidden></button>
          <button type="button" class="btn quiet" id="watch-follow-site" hidden></button>
          <button type="button" class="btn quiet" id="watch-follow-clear" hidden>Clear follow</button>
        </div>
        <div class="watch-summary" id="watch-summary" hidden></div>
        <pre id="watch-low-noise" hidden></pre>
      </article>
      <section class="watch-col" id="watch-here-sheet" aria-labelledby="watch-feed-label">
        <div class="watch-here-head">
          <strong>Recently</strong>
          <button class="btn quiet" id="watch-here-close" type="button" aria-label="Close">×</button>
        </div>
        <h2 id="watch-feed-label">Recently</h2>
        <p class="lede">Public movement and change. Private LOOK and MESSAGE stay off this window.</p>
        <ol class="watch-feed" id="watch-feed"></ol>
        <details id="watch-public-recent" aria-live="off">
          <summary id="watch-public-recent-summary">Recent public events</summary>
          <p class="lede">Bounded public projection, not world truth or complete history.</p>
          <p id="watch-public-recent-status">Public events unavailable.</p>
          <ol class="watch-feed" id="watch-public-recent-list"></ol>
        </details>
        <section class="watch-withheld" id="watch-withheld" aria-labelledby="watch-withheld-label">
          <h2 id="watch-withheld-label">Withheld</h2>
          <p class="lede">${WITHHELD_LEDE}</p>
          <ul id="watch-withheld-list"><li>${WITHHELD_NONE}</li></ul>
        </section>
      </section>
    </aside>
  </section>
  <button class="btn quiet" id="watch-here-open" type="button" aria-expanded="false" aria-controls="watch-here-sheet">Here</button>
  <div class="watch-here-backdrop" id="watch-here-backdrop" hidden></div>

  <div class="watch-foot-meta">
    ${legendHtml()}
    <p class="watch-note">This window is a projection, not the world.</p>
  </div>

  <script>
  (() => {
    const POLL_MS = 10000;
    const TIER_RANK = { NORMAL: 1, NOTABLE: 2, MAJOR: 3 };
    const GLYPHS = ${JSON.stringify(glyphCatalog())};
    const state = { paused: false, busy: false, held: null, majorLeft: 0, reduce: false, sock: null, focusRoomId: "", last: null, prevTopSeq: 0, headKey: "", follow: null, mode: "3d", mapBusy: false, mapLast: null, mapCoords: [], mapCamId: "", mapFollowId: "" };
    const $ = id => document.getElementById(id);

    try {
      state.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { state.reduce = false; }
    const LOW_NOISE_KEY = ${JSON.stringify(LOW_NOISE_KEY)};
    const parseLowNoiseFlag = ${parseLowNoiseFlag.toString()};
    function applyLowNoise(on) {
      document.body.classList.toggle("is-low-noise", !!on);
      const btn = $("watch-low-noise-btn");
      if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
      const ln = $("watch-low-noise");
      if (ln) ln.hidden = !on;
      try { localStorage.setItem(LOW_NOISE_KEY, on ? "1" : "0"); } catch (e) {}
      // D2: Low noise unmounts the 3D stage; the text map carries the page.
      // Repaint now so the cartogram replaces the stage without waiting for a poll.
      // At boot this runs before the stage code initializes; mode apply handles it then.
      if (state.mode === "3d" && state.stageReady) {
        tryStage();
        if (state.last) render(state.last);
      }
    }
    (function bootLowNoise() {
      let stored = null;
      try { stored = localStorage.getItem(LOW_NOISE_KEY); } catch (e) {}
      applyLowNoise(parseLowNoiseFlag(stored, location.search || "", state.reduce));
      const btn = $("watch-low-noise-btn");
      if (btn) btn.addEventListener("click", () => applyLowNoise(!document.body.classList.contains("is-low-noise")));
    })();

    function el(tag, className, text) {
      const n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null && text !== "") n.textContent = text;
      return n;
    }
    ${watchTheaterInlineSource()}
    ${watchModeInlineSource()}
    ${watchMapInlineSource()}
    ${watchMapGlInlineSource()}
    const MAP_PARITY_LINE = ${JSON.stringify(MAP_PARITY_LINE)};
    const MAP_PARITY_HOLD_LINE = ${JSON.stringify(MAP_PARITY_HOLD_LINE)};
    const STAGE_SRC = ${JSON.stringify(STAGE_SRC)};
    const STAGE_FALLBACK_LINE = ${JSON.stringify(STAGE_FALLBACK_LINE)};
    const STAGE_LOW_NOISE_LINE = ${JSON.stringify(STAGE_LOW_NOISE_LINE)};

    // D3: the view is per visit. Clear the legacy mode key; Low noise is the
    // lasting text-only preference. The URL keeps ?mode=text for sharing.
    try { localStorage.removeItem("noema.watch.mode"); } catch (e) { /* preference only */ }
    function persistWatchMode(next) {
      try {
        const u = new URL(location.href);
        if (next === "text") u.searchParams.set("mode", "text");
        else u.searchParams.delete("mode");
        const h = String(u.hash || "").replace(/^#/, "").toLowerCase();
        if (h === "text" || h === "pixel" || h === "map" || h === "3d") u.hash = "";
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) { /* history optional */ }
    }
    function paintMapParity(kind) {
      const text = kind === "hold" ? MAP_PARITY_HOLD_LINE : kind === "behind" ? MAP_PARITY_LINE : "";
      const ids = ["watch-map-parity", "watch-stage3d-parity"];
      for (let i = 0; i < ids.length; i++) {
        const parity = $(ids[i]);
        if (!parity) continue;
        parity.hidden = !kind;
        parity.textContent = text;
      }
    }
    // The 3D stage shows the same world-health bands as MAP (WS3-05), under the stage.
    function paintStageHealth(d) {
      const dl = $("watch-stage3d-health");
      if (!dl) return;
      dl.replaceChildren();
      if (!d || !d.health) return;
      const pairs = mapHealthPairs(d.health);
      for (let i = 0; i < pairs.length; i++) {
        const row = el("div", "", "");
        row.append(el("dt", "", pairs[i][0]));
        row.append(el("dd", "", pairs[i][1]));
        dl.append(row);
      }
    }
    async function refreshMap() {
      if (state.mode !== "3d" || state.mapBusy) return;
      state.mapBusy = true;
      try {
        const data = await fetch("/v1/watch/map").then(async function(r) {
          const d = await r.json();
          if (!r.ok) throw new Error((d.error && d.error.message) || r.statusText);
          return d;
        });
        state.mapLast = data;
        const fetchedRooms = data && data.base && Array.isArray(data.base.rooms) ? data.base.rooms : [];
        state.mapCoords = mapHoldCoordRooms(data, state.mapCoords);
        paintMapParity(mapParityState({ live: state.last, map: data, failed: false, holding: !fetchedRooms.length && state.mapCoords.length > 0 }));
        paintStageHealth(data);
        syncStage();
      } catch (e) {
        // Poll failed: say so, keep the last agreed sketch, never wipe labels.
        paintMapParity(mapParityState({ live: state.last, map: state.mapLast, failed: true, holding: state.mapCoords.length > 0 }));
        if (state.mapLast) paintStageHealth(state.mapLast);
        syncStage();
      } finally {
        state.mapBusy = false;
      }
    }
    function applyMapFocus(head, rooms, events) {
      state.mapCamId = mapCameraTarget({ head: head, rooms: rooms, events: events, follow: state.follow });
      state.mapFollowId = mapFollowedRoomId(state.follow, rooms);
      syncStage();
    }
    // 3D Chamber stage (Noema-Specs specify/watch-single-3d-stage.md). Its chunk
    // is fetched only after 3D is chosen. Any failure, or Low noise, shows the
    // text map: the Places list stays beside the stage in 3D (D2, WS3-07).
    const stage3d = { api: null, loading: false, failed: false };
    state.stageReady = true;
    function paintStageFallback(msg) {
      const note = $("watch-stage3d-fallback");
      if (!note) return;
      note.textContent = msg || "";
      note.hidden = !msg;
    }
    function disposeStage() {
      if (stage3d.api) {
        try { stage3d.api.dispose(); } catch (e) { /* stage is display-only */ }
      }
      stage3d.api = null;
      const root = $("watch-stage3d");
      if (root) root.hidden = true;
    }
    function stageFallback() {
      stage3d.failed = true;
      stage3d.loading = false;
      disposeStage();
      if (state.mode === "3d") applyWatchMode("text", false);
      paintStageFallback(STAGE_FALLBACK_LINE);
    }
    function stageGlUsable() {
      try {
        const c = document.createElement("canvas");
        return !!(c && c.getContext && c.getContext("webgl2"));
      } catch (e) {
        return false;
      }
    }
    function lowNoiseOn() {
      return !!(document.body && document.body.classList && document.body.classList.contains("is-low-noise"));
    }
    function stageContext() {
      const head = state.held || {};
      return {
        selectedId: state.focusRoomId || "",
        followRoomId: state.mapFollowId || "",
        majorRoomId: head.tier === "MAJOR" ? (state.mapCamId || "") : "",
        map: state.mapLast,
      };
    }
    function syncStage() {
      if (!stage3d.api || state.mode !== "3d") return;
      if (state.last && state.last.projection === "public") stage3d.api.update(state.last, stageContext());
    }
    function mountStage() {
      if (state.mode !== "3d" || stage3d.api || lowNoiseOn()) return;
      const api = window.NoemaWatchStage;
      if (!api || !api.mount) { stageFallback(); return; }
      const root = $("watch-stage3d");
      try {
        if (root) root.hidden = false;
        stage3d.api = api.mount($("watch-stage3d-frame"), {
          canvas: $("watch-stage3d-gl"),
          labels: $("watch-stage3d-labels"),
          reset: $("watch-stage3d-reset"),
          reduce: state.reduce,
          onSelect: function(id) { if (window.NoemaPhosphorPick) window.NoemaPhosphorPick(id); },
          onLost: stageFallback,
        });
        paintStageFallback("");
        // Repaint so the cartogram painted before mount gives way to the stage.
        if (state.last) render(state.last);
        else syncStage();
      } catch (e) {
        stageFallback();
      }
    }
    function tryStage() {
      if (state.mode !== "3d") return;
      if (lowNoiseOn()) { disposeStage(); paintStageFallback(STAGE_LOW_NOISE_LINE); return; }
      if (stage3d.failed || !stageGlUsable()) { stageFallback(); return; }
      if (stage3d.api) { syncStage(); return; }
      if (window.NoemaWatchStage) { mountStage(); return; }
      if (stage3d.loading) return;
      if (!document.head || !document.head.appendChild) { stageFallback(); return; }
      stage3d.loading = true;
      const s = document.createElement("script");
      s.type = "module";
      s.src = STAGE_SRC;
      s.addEventListener("load", function() { stage3d.loading = false; mountStage(); });
      s.addEventListener("error", stageFallback);
      document.head.appendChild(s);
    }
    function applyWatchMode(next, persist) {
      const mode = next === "text" ? "text" : "3d";
      state.mode = mode;
      paintStageFallback("");
      const stage = document.querySelector(".watch-stage");
      if (stage) stage.setAttribute("data-mode", mode);
      // The Phosphor client stays mounted without a canvas: it only supplies the cartogram.
      if (window.NoemaPhosphor) window.NoemaPhosphor.setMode("text");
      if (persist !== false) persistWatchMode(mode);
      if (mode === "3d") {
        tryStage();
        // A synchronous fallback already re-applied TEXT; do not undo it here.
        if (state.mode !== "3d") return;
        refreshMap();
      } else {
        disposeStage();
      }
      if (state.last) render(state.last);
    }
    state.mode = parseWatchMode(location.search || "", location.hash || "");

    // §4.G Follow — client-local spectator preference. Emphasis only, never a
    // filter, never a server request. Matches only public snapshot identifiers.
    const FOLLOW_KEY = "noema.watch.follow";
    function loadFollow() {
      try {
        const raw = localStorage.getItem(FOLLOW_KEY);
        if (!raw) return null;
        const f = JSON.parse(raw);
        if (f && (f.kind === "agent" || f.kind === "site") && typeof f.id === "string" && f.id) {
          return { kind: f.kind, id: f.id.slice(0, 64) };
        }
      } catch (e) { /* preference only */ }
      return null;
    }
    function setFollow(next) {
      state.follow = next;
      try {
        if (next) localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
        else localStorage.removeItem(FOLLOW_KEY);
      } catch (e) { /* preference only */ }
      if (state.last) render(state.last);
    }
    state.follow = loadFollow();
    function followedRoomId(rooms) {
      const f = state.follow;
      if (!f) return "";
      if (f.kind === "site") {
        const hit = (rooms || []).find((r) => r && r.room_id === f.id);
        return hit ? f.id : "";
      }
      const home = (rooms || []).find((r) =>
        Array.isArray(r.public_player_labels) && r.public_player_labels.indexOf(f.id) >= 0);
      return home ? home.room_id : "";
    }
    function isFollowHit(ev) {
      const f = state.follow;
      if (!f || !ev) return false;
      if (f.kind === "agent") return ev.actor_label === f.id;
      return ev.room_id === f.id;
    }
    function followButton(kind, id, label) {
      const b = el("button", "btn quiet", label);
      b.type = "button";
      b.addEventListener("click", () => setFollow({ kind, id }));
      return b;
    }
    function followButtonClear(label) {
      const b = el("button", "btn quiet", label);
      b.type = "button";
      b.addEventListener("click", () => setFollow(null));
      return b;
    }
    function handleButton(handle) {
      const b = el("button", "watch-handle-btn", handle);
      b.type = "button";
      b.setAttribute("aria-label", "Follow " + handle);
      b.addEventListener("click", () => setFollow({ kind: "agent", id: handle }));
      return b;
    }
    function occupantLabelsForRoom(r) {
      const roomName = String((r && r.name) || "").trim().toLowerCase();
      const roomId = String((r && r.room_id) || "").trim().toLowerCase();
      const roomSlug = roomId.replace(/^room\./, "");
      const raw = Array.isArray(r && r.public_player_labels) ? r.public_player_labels : [];
      const out = [];
      for (let i = 0; i < raw.length; i++) {
        const h = String(raw[i] || "").trim();
        if (!h) continue;
        const n = h.toLowerCase();
        if (n.startsWith("room.")) continue;
        if (roomName && n === roomName) continue;
        if (roomId && (n === roomId || n === roomSlug)) continue;
        if (out.indexOf(h) >= 0) continue;
        out.push(h);
      }
      return out;
    }
    function knownForLine(data, handle) {
      const pools = [data.public_title_lines, data.public_focus_lines, data.public_descriptor_lines];
      for (let i = 0; i < pools.length; i++) {
        const lines = Array.isArray(pools[i]) ? pools[i] : [];
        const hit = lines.find((l) => typeof l === "string" && l.indexOf(handle + " ") === 0);
        if (hit) return hit;
      }
      return "";
    }
    function publicStandingLines(data) {
      const raw = Array.isArray(data.public_descriptor_lines) ? data.public_descriptor_lines : [];
      const out = [];
      for (let i = 0; i < raw.length && out.length < 6; i++) {
        const t = String(raw[i] || "").replace(/\s+/g, " ").trim();
        if (!t) continue;
        if (/reliable|unknown/i.test(t)) continue;
        if (/\b(?:player|room|entity|ctrl)\./i.test(t)) continue;
        if (out.indexOf(t) >= 0) continue;
        out.push(t);
      }
      return out;
    }
    function renderStanding(data) {
      const standing = $("watch-standing");
      const list = $("watch-standing-list");
      if (!standing || !list) return;
      const lines = publicStandingLines(data);
      list.replaceChildren();
      standing.hidden = !lines.length;
      for (let i = 0; i < lines.length; i++) list.append(el("li", "", lines[i]));
    }
    function renderFollowChrome(data, rooms, events, head) {
      const actorBtn = $("watch-follow-actor");
      const siteBtn = $("watch-follow-site");
      const clearBtn = $("watch-follow-clear");
      const chip = $("watch-following");
      const sum = $("watch-summary");
      const f = state.follow;
      const headActor = head && head.actor_label ? String(head.actor_label) : "";
      const headSite = head && head.room_id ? roomName(rooms, head.room_id) : "";
      const showActorBtn = headActor && !(f && f.kind === "agent" && f.id === headActor);
      const showSiteBtn = head && head.room_id && !(f && f.kind === "site" && f.id === head.room_id);
      actorBtn.hidden = !showActorBtn;
      if (showActorBtn) actorBtn.textContent = "Follow " + headActor;
      actorBtn.onclick = showActorBtn ? (() => setFollow({ kind: "agent", id: headActor })) : null;
      siteBtn.hidden = !showSiteBtn;
      if (showSiteBtn) siteBtn.textContent = "Follow " + (headSite || "this site");
      siteBtn.onclick = showSiteBtn ? (() => setFollow({ kind: "site", id: head.room_id })) : null;
      chip.hidden = !f;
      clearBtn.hidden = !f;
      sum.hidden = true;
      sum.replaceChildren();
      if (!f) return;
      const fName = f.kind === "site" ? (roomName(rooms, f.id) || f.id) : f.id;
      chip.textContent = "Following " + fName;
      if (f.kind === "agent") {
        const home = followedRoomId(rooms);
        sum.hidden = false;
        const nowP = el("p", "");
        nowP.append(el("span", "k", "Followed"));
        nowP.append(document.createTextNode(home ? (roomName(rooms, home) || home) : f.id + " is not in a public site."));
        sum.append(nowP);
        const known = knownForLine(data, f.id);
        if (known) {
          const kP = el("p", "");
          kP.append(el("span", "k", "Known for"));
          kP.append(document.createTextNode(known));
          sum.append(kP);
        }
        const mine = (events || []).filter((e) => e && e.actor_label === f.id).slice(0, 3);
        if (mine.length) {
          const rP = el("p", "");
          rP.append(el("span", "k", "Recently"));
          rP.append(document.createTextNode(mine.map((e) => e.line || "").filter(Boolean).join(" · ")));
          sum.append(rP);
        }
      }
    }
    function glyphNode(id) {
      const m = GLYPHS[id] || GLYPHS.unknown;
      const wrap = el("span", "glyph glyph-" + (id || "unknown"));
      wrap.setAttribute("role", "img");
      wrap.setAttribute("aria-label", m.label);
      wrap.setAttribute("title", m.meaning);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 16 16");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", m.d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.4");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-linecap", "round");
      svg.append(path);
      wrap.append(svg);
      const sr = el("span", "sr", m.fallback);
      wrap.append(sr);
      return wrap;
    }
    function roomName(rooms, id) {
      const r = (rooms || []).find(x => x.room_id === id);
      return r ? (r.name || r.room_id) : "";
    }
    function ago(ms) {
      const t = Number(ms);
      if (!Number.isFinite(t) || t <= 0) return "";
      const s = Math.max(0, Math.round((Date.now() - t) / 1000));
      if (s < 60) return s + " sec ago";
      if (s < 3600) return Math.round(s / 60) + " min ago";
      return Math.round(s / 3600) + " hr ago";
    }
    // §9 flood guard, same reason as setTag below: the headline is an
    // aria-live node and this page repaints every POLL_MS.
    function setLiveText(node, text) {
      if (node.textContent !== text) node.textContent = text;
    }
    function setTag(text, cls) {
      const tag = $("watch-state");
      if (tag.textContent !== text) tag.textContent = text;
      if (tag.className !== cls) tag.className = cls;
    }
    function rankPick(events) {
      return [...events].sort((a, b) => {
        const t = (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
        return t || (b.sequence - a.sequence);
      })[0] || null;
    }
    function pickHeadline(data) {
      const events = Array.isArray(data.recent_events) ? data.recent_events : [];
      const notable = (data.narrative && data.narrative.now) || data.notable_event || null;
      if (data.freshness === "incident") {
        return notable && notable.projection_id === "world_status"
          ? notable
          : { sequence: data.sequence || 0, tier: "MAJOR", projection_id: "world_status",
              line: "World incident — projection is stale." };
      }
      const window = notable ? [notable, ...events.filter(e => e.sequence !== notable.sequence)] : events;
      if (state.held) {
        const inWin = window.some(e => e.sequence === state.held.sequence && e.projection_id === state.held.projection_id);
        const higher = window.some(e => (TIER_RANK[e.tier] || 0) > (TIER_RANK[state.held.tier] || 0));
        // Age by newer PUBLIC candidates only — the world head (data.sequence)
        // also advances on private traffic and must not rotate the headline.
        const aged = window.filter(e => (e.sequence || 0) > state.held.sequence).length > 8;
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
    function paintPublicTheater(head, events, rooms, players) {
      const site = roomName(rooms, head && head.room_id);
      const pool = theaterEventPool(head, events);
      const actorNames = [];
      const siteNames = [];
      const marks = [];
      for (let i = 0; i < pool.length; i++) {
        const ev = pool[i];
        const who = String(ev.actor_label || "").trim();
        if (who && actorNames.indexOf(who) < 0) actorNames.push(who);
        const where = roomName(rooms, ev.room_id);
        if (where && siteNames.indexOf(where) < 0) siteNames.push(where);
        const withheld = withheldFromProjection(ev.projection_id || "", ev.actor_label || "");
        if (withheld && marks.indexOf(withheld) < 0) marks.push(withheld);
      }
      const followExtra = followedSiteWithheld(state.follow ? state.follow.kind : "", !!followedRoomId(rooms));
      if (followExtra) marks.push(followExtra);
      const whoLine = "Who " + heroFactValue(head && head.actor_label);
      const whereLine = "Where " + heroFactValue(site);
      const conLine = "Consequence " + heroFactValue(head && head.consequence);
      $("watch-hero-who").textContent = whoLine;
      $("watch-hero-where").textContent = whereLine;
      const conseq = $("watch-conseq");
      conseq.hidden = false;
      conseq.textContent = conLine;
      const when = ago(head && head.occurred_at);
      $("watch-copy").textContent = [when, head && head.detail].filter(Boolean).join(" · ");
      const actorsLine = namedListLine("Actors", actorNames);
      const sitesLine = namedListLine("Sites", siteNames);
      const occupancy = agentsInPublicSitesCaption(players);
      $("watch-now-actors").textContent = actorsLine;
      $("watch-now-sites").textContent = sitesLine;
      $("watch-players").textContent = occupancy;
      const heldLines = withheldBandLines(marks);
      const heldList = $("watch-withheld-list");
      heldList.replaceChildren();
      for (let i = 0; i < heldLines.length; i++) heldList.append(el("li", "", heldLines[i]));
      return { whoLine, whereLine, conLine, actorsLine, sitesLine, occupancy, heldLines };
    }
    function renderPublicRecent(data) {
      const list = $("watch-public-recent-list");
      const status = $("watch-public-recent-status");
      list.replaceChildren();
      const events = data && data.projection === "public" && Array.isArray(data.recent_events)
        ? data.recent_events : null;
      if (!events || data.freshness === "stale" || data.freshness === "incident" ||
          events.some((event) => !event || typeof event.line !== "string" || !event.line.trim() ||
            !Number.isSafeInteger(event.sequence))) {
        status.textContent = "Public events unavailable.";
        return;
      }
      const rows = [...events].sort((a, b) => b.sequence - a.sequence).slice(0, 8);
      for (const row of rows) list.append(el("li", "", row.line));
      status.textContent = rows.length ? "Showing " + rows.length + " recent public events." : "No recent public events.";
    }

    function render(data) {
      renderPublicRecent(data);
      state.last = data;
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      const players = data.players_present ?? 0;
      const status = data.world_status || "";
      const fresh = data.freshness || "live";
      const events = Array.isArray(data.narrative?.recently)
        ? data.narrative.recently
        : Array.isArray(data.recent_events) ? data.recent_events : [];
      $("watch-cycle").textContent = String(data.cycle ?? "—");
      $("watch-seq").textContent = String(data.sequence ?? "—");
      $("watch-world").textContent = data.world_id || "—";
      $("watch-updated").textContent = "updated " + new Date().toLocaleTimeString();
      $("watch-fresh").textContent = (status ? status + " · " : "") + (fresh || "live");

      const head = pickHeadline(data);
      state.held = head;
      const mark = $("watch-mark");
      mark.textContent = markFor(head.tier || "NORMAL");
      const headKey = (head.sequence || 0) + ":" + (head.projection_id || "") + ":" + (head.line || "");
      if (state.headKey && headKey !== state.headKey && head.tier !== "NORMAL" && !state.reduce) {
        mark.classList.remove("flash");
        void mark.offsetWidth;
        mark.classList.add("flash");
      }
      state.headKey = headKey;
      const story = head.line || "The Chamber is quiet.";
      setLiveText($("watch-headline"), story);
      const stageLine = $("watch-stage-line");
      if (stageLine) stageLine.textContent = story;
      const painted = paintPublicTheater(head, events, rooms, players);
      if (state.mode === "3d") applyMapFocus(head, rooms, events);
      renderFollowChrome(data, rooms, events, head);
      renderStanding(data);
      const ln = $("watch-low-noise");
      if (ln) {
        const recent = events.map((e) => {
          const facts = joinWatchPhrases(recentFactParts(e.actor_label, roomName(rooms, e.room_id), e.consequence));
          return joinWatchPhrases([e.line || e.text || "", facts]);
        }).filter(Boolean);
        const standing = publicStandingLines(data);
        ln.textContent = [head.line, painted.whoLine, painted.whereLine, painted.conLine, painted.actorsLine, painted.sitesLine, painted.occupancy, ...standing, ...recent.slice(0, 6), ...painted.heldLines].filter(Boolean).join("\\n");
        ln.hidden = !document.body.classList.contains("is-low-noise");
      }
      const hero = $("watch-hero");
      hero.className = "watch-hero" + (head.tier === "MAJOR" ? " major" : "");
      const banner = $("watch-banner");
      if (head.tier === "MAJOR") {
        state.majorLeft = 2;
        banner.hidden = false;
        banner.className = "watch-banner on";
        banner.textContent = head.line;
      } else if (state.majorLeft > 1) {
        // §4E / §8: temporary banner ≤ 2 poll intervals — hidden by the third render.
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
      const topSeq = Math.max(0, ...events.map(e => e.sequence || 0));
      if (!events.length) {
        feed.append(el("li", "watch-empty", "Nothing public yet."));
      } else {
        events.forEach((ev, i) => {
          const fresh = !state.reduce && state.prevTopSeq > 0 && (ev.sequence || 0) > state.prevTopSeq;
          const tierClass = ev.tier === "MAJOR" ? "major" : ev.tier === "NOTABLE" ? "notable" : "";
          // §9: tiers are never color-only — every row carries a text mark, and
          // NOTABLE/MAJOR rows never fade into the i>=2 quiet treatment.
          // §4.G: follow adds restrained emphasis only; every row stays visible.
          const li = el("li", tierClass + (i >= 2 && !tierClass ? " quiet" : "") + (fresh ? " fresh" : "") + (isFollowHit(ev) ? " follow-hit" : ""));
          li.append(el("span", "mark", markFor(ev.tier)));
          li.append(glyphNode(ev.glyph || "event"));
          const wrap = el("div", "");
          wrap.append(el("span", "line", ev.line || ""));
          const facts = joinWatchPhrases(recentFactParts(ev.actor_label, roomName(rooms, ev.room_id), ev.consequence));
          if (facts) {
            wrap.append(document.createTextNode(" · "));
            wrap.append(el("span", "facts", facts));
          }
          const meta = ago(ev.occurred_at);
          if (meta) {
            wrap.append(document.createTextNode(" · "));
            wrap.append(el("span", "meta", meta));
          }
          li.append(wrap);
          feed.append(li);
        });
      }
      state.prevTopSeq = Math.max(state.prevTopSeq, topSeq);

      const map = $("watch-map");
      // §8 replace-in-place: a poll must not snap open room details shut or
      // destroy keyboard focus. Record both before the rebuild, restore after.
      const openRooms = {};
      const prevSites = map.children || [];
      for (let i = 0; i < prevSites.length; i++) {
        const site = prevSites[i];
        if (!site || !site.getAttribute) continue;
        const rid = site.getAttribute("data-room") || "";
        const det = site.querySelector ? site.querySelector("details") : null;
        if (rid && det && det.open) openRooms[rid] = true;
      }
      const focusEl = document.activeElement;
      const focusRoom = focusEl && focusEl.getAttribute ? (focusEl.getAttribute("data-room") || "") : "";
      let refocus = null;
      map.replaceChildren();
      if (!rooms.length) {
        map.append(el("li", "watch-empty", "No public sites exposed yet."));
      } else {
        const fRoom = followedRoomId(rooms);
        rooms.forEach(r => {
          const picked = state.focusRoomId && r.room_id === state.focusRoomId;
          const followed = fRoom && r.room_id === fRoom;
          const li = el("li", "watch-site" + (r.active || r.players_present > 0 ? " active" : "") + (picked ? " picked" : "") + (followed ? " followed" : ""));
          li.setAttribute("data-room", r.room_id || "");
          const row = el("div", "watch-site-row");
          row.append(glyphNode(r.glyph || "loc"));
          row.append(el("span", "watch-site-name", r.name || r.room_id || "site"));
          if (followed) row.append(el("span", "watch-follow-tag", "following"));
          if (r.active || r.players_present > 0) row.append(el("span", "watch-mark", "*"));
          if (r.players_present > 0) {
            const count = el("span", "watch-count");
            count.append(glyphNode(r.player_glyph || "player"));
            const occ = occupantLabelsForRoom(r);
            count.append(document.createTextNode(" " + (occ.length ? occ.join(", ") : String(r.players_present))));
            row.append(count);
          }
          li.append(row);
          const exits = Array.isArray(r.exits) ? r.exits : [];
          const exitRow = el("div", "watch-exits");
          if (exits.length) {
            exits.forEach(x => {
              const item = el("span", "watch-exit");
              item.append(glyphNode(x.glyph || "threshold"));
              item.append(document.createTextNode((x.direction || "") + " → " + (x.to_room_name || x.to_room_id || "")));
              exitRow.append(item);
            });
          } else {
            exitRow.append(document.createTextNode("no listed exits"));
          }
          li.append(exitRow);
          const det = document.createElement("details");
          det.setAttribute("data-room", r.room_id || "");
          const sum = document.createElement("summary");
          sum.textContent = "Look closer";
          sum.setAttribute("data-room", r.room_id || "");
          det.append(sum);
          const box = el("div", "watch-inspect");
          const labels = occupantLabelsForRoom(r);
          const present = Number(r.players_present || 0);
          const pLine = el("p", "");
          pLine.append(glyphNode("player"));
          if (labels.length) {
            // §4.G: public handles are follow affordances — buttons, not URLs.
            labels.forEach((h, hi) => {
              if (hi > 0) pLine.append(document.createTextNode(", "));
              pLine.append(handleButton(String(h)));
            });
          } else {
            pLine.append(document.createTextNode(present > 0 ? (present === 1 ? "an agent" : present + " agents") : "none visible"));
          }
          box.append(pLine);
          const fBtnRow = el("p", "");
          const isFollowedSite = state.follow && state.follow.kind === "site" && state.follow.id === r.room_id;
          fBtnRow.append(isFollowedSite
            ? followButtonClear("Following — clear")
            : followButton("site", r.room_id || "", "Follow " + (r.name || "site")));
          box.append(fBtnRow);
          const ents = Array.isArray(r.entities) ? r.entities : [];
          const eLine = el("p", "watch-ents");
          if (!ents.length) {
            eLine.append(document.createTextNode("no visible objects"));
          } else {
            ents.forEach(e => {
              const item = el("span", "watch-exit");
              item.append(glyphNode(e.glyph || "event"));
              item.append(document.createTextNode(e.label || ""));
              eLine.append(item);
            });
          }
          box.append(eLine);
          const traces = Array.isArray(r.traces) ? r.traces : [];
          if (traces.length) {
            const tLine = el("p", "watch-traces");
            traces.forEach((t) => {
              const item = el("span", "watch-exit");
              item.append(document.createTextNode(t && t.text ? String(t.text) : ""));
              tLine.append(item);
            });
            box.append(tLine);
          }
          const rec = siteRecent(events, r.room_id);
          box.append(el("p", "", "Recent:    " + (rec.length ? rec.map(e => e.line).join(" · ") : "nothing public yet")));
          det.append(box);
          const followedAgentHere = followed && state.follow && state.follow.kind === "agent";
          if (picked || openRooms[r.room_id] || followedAgentHere) det.open = true;
          li.append(det);
          if (focusRoom && r.room_id === focusRoom) refocus = sum;
          map.append(li);
        });
      }
      if (refocus && refocus.focus) refocus.focus();

      if (window.NoemaPhosphor) {
        // §4.G: PIXEL highlights the picked site, else the followed subject's site.
        const focusId = state.focusRoomId || followedRoomId(rooms);
        const snap = focusId ? Object.assign({}, data, { focus_room_id: focusId }) : data;
        window.NoemaPhosphor.update(snap);
      }
      // §4.B.1: cartogram from the shared layout; line list only as fallback.
      const pre = $("watch-pre");
      // §18 / §4.B.1: one map at a time — the ASCII cartogram is the TEXT-mode /
      // no-canvas fallback and never renders alongside the live PIXEL sketch.
      // One map at a time: the mounted 3D stage is the map; otherwise the cartogram is (D2).
      const pixelOn = state.mode === "3d" && !!stage3d.api;
      let art = "";
      if (!pixelOn && window.NoemaPhosphor && window.NoemaPhosphor.ascii) {
        art = window.NoemaPhosphor.ascii({
          majorRoomId: head.tier === "MAJOR" ? head.room_id || "" : "",
          pickedRoomId: state.focusRoomId || "",
        }) || "";
      }
      if (!pixelOn && !art && shouldPre(rooms)) art = drawPre(rooms);
      if (art && window.matchMedia("(min-width: 861px)").matches) {
        pre.hidden = false;
        pre.textContent = art;
      } else {
        pre.hidden = true;
        pre.textContent = "";
      }
      paintPhosCaption();
    }

    function showUnavailable(msg) {
      renderPublicRecent(null);
      setLiveText($("watch-headline"), "Projection unavailable.");
      const stageGone = $("watch-stage-line");
      if (stageGone) stageGone.textContent = "Projection unavailable.";
      $("watch-copy").textContent = msg || "";
      paintPublicTheater({ line: "Projection unavailable." }, [], [], 0);
      setTag("unavailable", "tag");
      $("watch-map").replaceChildren(el("li", "watch-empty", "Projection unavailable."));
      $("watch-feed").replaceChildren(el("li", "watch-empty", "Projection unavailable."));
      $("watch-pre").hidden = true;
      $("watch-pre").textContent = "";
      if (window.NoemaPhosphor) window.NoemaPhosphor.fail();
    }

    function applyLive(data) {
      render(data);
      if (state.mode === "3d") refreshMap();
      if (state.paused) {
        setTag("paused", "tag warn");
        return;
      }
      // §8/§9: the status tag is polite — write only sanctioned states, and
      // only when the displayed state actually changes. No transient churn.
      const fresh = data.freshness || "live";
      setTag(fresh === "live" ? "live" : fresh, "tag " + (fresh === "incident" ? "bad" : fresh === "live" ? "ok" : "warn"));
    }

    async function refreshHttp() {
      if (state.busy || document.hidden) return;
      state.busy = true;
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
          try { applyLive(JSON.parse(ev.data)); } catch (e) {
            renderPublicRecent(null); // Keep the rest of the last frame, never stale disclosure rows.
          }
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

    function paintPhosCaption() {
      const cap = $("watch-phos-caption");
      if (!cap) return;
      if (!state.focusRoomId) {
        cap.textContent = "Public sketch — not the world. Click a site to look closer.";
        return;
      }
      const rooms = state.last && Array.isArray(state.last.rooms) ? state.last.rooms : [];
      const hit = rooms.find((r) => r && r.room_id === state.focusRoomId);
      const name = (hit && (hit.name || hit.room_id)) || "this site";
      cap.textContent = "Looking at " + name + " — not the world.";
    }
    window.NoemaPhosphorPick = function(roomId) {
      const id = String(roomId || "");
      if (!id) return;
      state.focusRoomId = state.focusRoomId === id ? "" : id;
      if (state.last) render(state.last);
      else paintPhosCaption();
      if (state.focusRoomId) {
        const site = document.querySelector('[data-room="' + CSS.escape(state.focusRoomId) + '"]');
        if (site && site.scrollIntoView) site.scrollIntoView({ block: "nearest" });
      }
    };
    // Mode rail swaps the center stage. Phosphor also binds TEXT/PIXEL;
    // apply after that handler so canvas mode and Chamber stage agree.
    applyWatchMode(state.mode, true);
    if (window.addEventListener) {
      window.addEventListener("popstate", () => {
        applyWatchMode(parseWatchMode(location.search || "", location.hash || ""), false);
      });
      window.addEventListener("hashchange", () => {
        applyWatchMode(parseWatchMode(location.search || "", location.hash || ""), false);
      });
    }
    $("watch-refresh").addEventListener("click", refresh);
    $("watch-pause").addEventListener("click", () => {
      state.paused = !state.paused;
      $("watch-pause").textContent = state.paused ? "Resume updates" : "Pause updates";
      $("watch-pause").setAttribute("aria-pressed", state.paused ? "true" : "false");
      if (state.paused) {
        setTag("paused", "tag warn");
      } else {
        refresh();
      }
    });
    function setHereOpen(on) {
      const sheet = $("watch-here-sheet");
      const btn = $("watch-here-open");
      const back = $("watch-here-backdrop");
      if (!sheet || !btn) return;
      sheet.classList.toggle("is-open", !!on);
      if (back) {
        back.classList.toggle("is-open", !!on);
        back.hidden = !on;
      }
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      if (on) {
        const close = $("watch-here-close");
        if (close) close.focus();
      } else {
        // Do not leave focus on a control in the dismissed sheet (#857).
        btn.focus();
      }
    }
    const hereOpen = $("watch-here-open");
    const hereClose = $("watch-here-close");
    const hereBack = $("watch-here-backdrop");
    if (hereOpen) hereOpen.addEventListener("click", () => setHereOpen(true));
    if (hereClose) hereClose.addEventListener("click", () => setHereOpen(false));
    if (hereBack) hereBack.addEventListener("click", () => setHereOpen(false));
    // §4F: Esc closes an open room detail and returns focus to its summary.
    $("watch-map").addEventListener("keydown", (ev) => {
      if (!ev || ev.key !== "Escape") return;
      const t = ev.target;
      const det = t && typeof t.closest === "function" ? t.closest("details") : null;
      if (!det || !det.open) return;
      det.open = false;
      const sum = typeof det.querySelector === "function" ? det.querySelector("summary") : null;
      if (sum && sum.focus) sum.focus();
      if (typeof ev.preventDefault === "function") ev.preventDefault();
    });
    // §4.G: CLEAR is one obvious control and Esc-reachable at the page level.
    $("watch-follow-clear").addEventListener("click", () => setFollow(null));
    document.addEventListener("keydown", (ev) => {
      if (!ev || ev.key !== "Escape") return;
      const sheet = $("watch-here-sheet");
      if (sheet && sheet.classList.contains("is-open")) {
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        setHereOpen(false);
        return;
      }
      if (!state.follow) return;
      const t = ev.target;
      const inDetails = t && typeof t.closest === "function" && t.closest("details[open]");
      if (inDetails) return;
      setFollow(null);
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
