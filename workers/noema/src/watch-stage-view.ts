/**
 * WATCH Chamber stage markup and styles (Noema-Specs specify/watch-single-3d-stage.md).
 * The renderer is fetched lazily from STAGE_SRC.
 * The canvas and labels are aria-hidden: the Places list beside the stage is
 * the accessible authority and carries every fact the stage draws (WS3-07, WS3-11).
 */

import { ROOM_STAGE_VERSION, STAGE_VERSION, VENDOR_VERSION } from "./watch-stage-version";

/**
 * Shared Three.js vendor chunk URL (D5). Cached and reused by both the
 * World Overview and Full-Screen Place View so Three.js downloads once.
 */
export const VENDOR_SRC = "/assets/three-vendor.js?v=" + VENDOR_VERSION;

/**
 * Stage chunk URL. Assets are cached for an hour; the content-hash version
 * makes each deploy's page load exactly its own chunk. Kept out of the stage
 * model, which is bundled into the chunk itself.
 */
export const STAGE_SRC = "/assets/watch-stage.js?v=" + STAGE_VERSION;

/**
 * Full-Screen Place View chunk URL (D5/D7). Lazy-loaded only when a spectator
 * opens a specific Place view.
 */
export const ROOM_STAGE_SRC = "/assets/watch-room-stage.js?v=" + ROOM_STAGE_VERSION;

/** Plain-language key for every mark the stage draws (WS3-06). HTML text, not canvas. */
export const STAGE_KEY: Array<[string, string]> = [
  ["site", "Site: a public place, labelled with its full name"],
  ["active", "Active site: cyan edge"],
  ["selected", "Selected site: bright edge, raised"],
  ["followed", "Followed site: cyan ring"],
  ["major", "MAJOR event: amber ring"],
  ["moment", "Moment: a MAJOR event holds its site for a few seconds; the camera may cut to NOTABLE and MAJOR sites unless you move it"],
  ["pressure", "Pressure band: the plate warms toward amber, low to high"],
  ["scar", "Scar residue band: dashed violet outline, faint to deep"],
  ["glow", "Glow: a soft halo under sites where agents are present; amber for MAJOR, cyan when followed"],
  ["agent", "Agent: one token per agent; named tokens carry their public handle"],
  ["nameplate", "Nameplate: a public agent handle above its token"],
  ["trace", "Trace: a small mark on the site"],
  ["route", "Route: solid line"],
  ["uncertain", "Uncertain route: dashed line"],
  ["oneway", "One-way route: arrow toward its destination"],
  ["lit", "Lit route: an agent just moved through this site"],
  ["travel", "Travel: an agent token moving along a drawn public route"],
  ["caption", "Caption: what just happened at a site, same words as Recently"],
];

export function placeSelectHtml(): string {
  return `
        <div class="watch-place-bar">
          <label class="watch-place-label" for="watch-place-select">Places</label>
          <select id="watch-place-select" class="watch-place-select" aria-label="Enter a Place view">
            <option value="">Overview — Perihelion Reach</option>
          </select>
        </div>`;
}

export function roomOverlayHtml(): string {
  return `
  <div id="watch-room-overlay" class="room-overlay" role="dialog" aria-modal="true" aria-labelledby="watch-room-title" hidden>
    <header class="room-bar">
      <div class="room-bar-left">
        <button type="button" class="btn quiet room-back-btn" id="watch-room-back">← Back to World</button>
        <label class="sr" for="watch-room-select">Switch place</label>
        <select id="watch-room-select" class="watch-place-select room-place-select" aria-label="Switch Place view">
          <option value="">Overview — Perihelion Reach</option>
        </select>
      </div>
      <div class="room-bar-center">
        <h2 id="watch-room-title" class="room-title">Place</h2>
        <div id="watch-room-bands" class="room-bands" hidden></div>
        <nav id="watch-room-exits" class="room-exits" aria-label="Room exits"></nav>
      </div>
      <div class="room-bar-right">
        <button type="button" class="btn quiet room-follow-chip" id="watch-room-follow-chip" hidden></button>
        <button type="button" class="btn quiet room-ctrl-btn" id="watch-room-reset">Reset view</button>
        <button type="button" class="btn quiet room-ctrl-btn" id="watch-room-drawer-btn" aria-expanded="true" aria-controls="watch-room-drawer">Activity</button>
      </div>
    </header>
    <div class="room-body">
      <div class="room-frame" id="watch-room-frame" tabindex="0" role="region"
        aria-label="3D Place view. Drag to orbit, scroll to zoom, Esc to return to World Overview.">
        <canvas id="watch-room-gl" aria-hidden="true"></canvas>
        <div class="room3d-labels" id="watch-room-labels" aria-hidden="true"></div>
        <p class="room3d-help" id="watch-room-help" aria-hidden="true">Drag to turn · scroll to zoom · click agent to follow · Esc to exit</p>
        <div class="room-text-fallback" id="watch-room-text" hidden></div>
      </div>
      <aside class="room-drawer" id="watch-room-drawer" aria-label="Room activity and details">
        <div class="room-drawer-inner">
          <p class="room-drawer-desc" id="watch-room-desc"></p>
          <section class="room-drawer-sec" aria-labelledby="watch-room-agents-label">
            <h3 id="watch-room-agents-label">Present here</h3>
            <div class="room-agents-list" id="watch-room-agents"></div>
          </section>
          <section class="room-drawer-sec" aria-labelledby="watch-room-activity-label">
            <h3 id="watch-room-activity-label">Room activity &amp; dialogue</h3>
            <ol class="room-activity-list" id="watch-room-activity"></ol>
          </section>
          <section class="room-drawer-sec" aria-labelledby="watch-room-works-label">
            <h3 id="watch-room-works-label">Works &amp; traces</h3>
            <div class="room-works-list" id="watch-room-works"></div>
          </section>
        </div>
      </aside>
    </div>
  </div>`;
}

export function stageViewHtml(): string {
  const key = STAGE_KEY.map(([k, text]) => `<li data-mark="${k}">${text}</li>`).join("");
  return `
      <div id="watch-stage3d" hidden>
        <div class="stage3d-frame" id="watch-stage3d-frame" tabindex="0" role="region"
          aria-label="3D public map. Arrow keys pan, Shift with arrow keys turns. Every site is also in the Places list.">
          <canvas id="watch-stage3d-gl" aria-hidden="true"></canvas>
          <div class="stage3d-labels" id="watch-stage3d-labels" aria-hidden="true"></div>
          <button type="button" class="btn stage3d-reset" id="watch-stage3d-reset">Reset view</button>
          <p class="stage3d-help" aria-hidden="true">Drag to turn · scroll to zoom · double-click site to enter</p>
        </div>
        <dl class="stage3d-health" id="watch-stage3d-health" aria-label="World health"></dl>
        <p class="map-parity" id="watch-stage3d-parity" role="status" hidden></p>
        <details class="stage3d-key">
          <summary>Map key</summary>
          <ul>${key}</ul>
        </details>
        <p class="stage3d-caption">A public sketch, not the world. North is up the screen in the default view.</p>
      </div>
      <p class="map-parity" id="watch-stage3d-fallback" role="status" hidden></p>`;
}

export const STAGE_VIEW_CSS = `
.watch-stage[data-mode="3d"]{grid-template-columns:minmax(0,1fr) minmax(18.5rem,22.5rem);align-items:start}
body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(88rem,calc(100% - 2*var(--pad)))}
#watch-stage3d[hidden],#watch-stage3d [hidden]{display:none!important}
body.is-low-noise #watch-stage3d{display:none!important}
.stage3d-frame{
  position:relative;height:clamp(380px,calc(100vh - 340px),600px);overflow:hidden;
  background:var(--void);
  border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  border-radius:var(--r-lg,12px);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 7%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--void) 76%,transparent),0 24px 60px -28px rgb(0 0 0/.88);
}
.stage3d-frame::after{
  content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;
  background:radial-gradient(ellipse at center,transparent 58%,rgba(7,10,16,.55) 100%);
  box-shadow:inset 0 0 38px color-mix(in srgb,var(--void) 68%,transparent);
}
.stage3d-frame:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:2px}
.stage3d-frame canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none}
.stage3d-labels{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.stage3d-label{
  pointer-events:auto;cursor:pointer;max-width:10.5rem;padding:3px 9px;
  border:1px solid color-mix(in srgb,var(--line-hot) 55%,var(--line));border-radius:999px;
  background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(6px);
  box-shadow:0 4px 14px -4px rgb(0 0 0/.76),inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent);
  color:var(--ink);font:500 .6875rem/1.2 var(--font-interface);letter-spacing:.01em;text-align:center;white-space:nowrap;
  transition:border-color .15s var(--ease),background .15s var(--ease),border-radius .15s var(--ease),box-shadow .15s var(--ease);
}
.stage3d-label:hover,.stage3d-label[data-state~="selected"],.stage3d-label[data-state~="followed"]{
  max-width:13.5rem;padding:5px 10px;border-radius:8px;
  border-color:var(--line-hot);background:rgba(11,15,21,.94);
  box-shadow:0 10px 26px -8px rgb(0 0 0/.88),inset 0 1px 0 color-mix(in srgb,var(--ink) 9%,transparent);
  z-index:3;
}
.stage3d-label .stage3d-handles,.stage3d-label .stage3d-lines,.stage3d-label .stage3d-bands,.stage3d-label .stage3d-state{display:none}
.stage3d-label:hover .stage3d-handles,.stage3d-label[data-state~="selected"] .stage3d-handles,.stage3d-label[data-state~="followed"] .stage3d-handles{
  display:block;margin-top:2px;color:var(--color-state-social);font:400 .66rem/1.2 var(--font-mono);overflow:hidden;text-overflow:ellipsis;
}
.stage3d-label:hover .stage3d-lines,.stage3d-label[data-state~="selected"] .stage3d-lines{
  display:block;margin-top:2px;color:var(--ink);font:400 .64rem/1.25 var(--font-interface);white-space:normal;
}
.stage3d-label:hover .stage3d-bands,.stage3d-label[data-state~="selected"] .stage3d-bands{
  display:block;margin-top:2px;color:var(--muted);font:400 .62rem/1.2 var(--font-interface);
}
.stage3d-label:hover .stage3d-state,.stage3d-label[data-state~="selected"] .stage3d-state{
  display:block;margin-top:2px;color:var(--faint);font:600 .6rem/1.2 var(--font-interface);letter-spacing:.12em;text-transform:uppercase;
}
.stage3d-health{
  display:flex;flex-wrap:wrap;gap:.35rem 1.5rem;align-items:center;
  margin:.5rem 0 0;padding:.4rem .75rem;
  border:1px solid color-mix(in srgb,var(--line) 82%,transparent);border-radius:var(--r-md,8px);
  background:color-mix(in srgb,var(--void) 76%,var(--panel));
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 5%,transparent);
  color:var(--muted);font:.75rem/1.35 var(--font-interface);
}
.stage3d-health:empty{display:none}
.stage3d-health div{display:flex;gap:.45rem;align-items:baseline}
.stage3d-health dt{color:var(--faint);text-transform:uppercase;letter-spacing:.1em;font:600 .65rem/1 var(--font-mono)}
.stage3d-health dd{margin:0;color:var(--ink);font:500 .76rem/1.2 var(--font-mono)}
.stage3d-label[data-state~="active"]{
  border-color:color-mix(in srgb,var(--color-state-active) 40%,var(--line));
  box-shadow:0 4px 14px -4px rgb(0 0 0/.78),inset 0 1px 0 color-mix(in srgb,var(--color-state-active) 12%,transparent);
}
.stage3d-label[data-state~="followed"]{
  border-color:var(--color-state-active);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--color-state-active) 32%,transparent),0 8px 22px -8px rgb(0 0 0/.85);
}
.stage3d-label[data-state~="selected"]{border-color:var(--ink)}
.stage3d-label[data-state~="major"]{
  border-color:var(--color-state-warning);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--color-state-warning) 30%,transparent),0 8px 22px -8px rgb(0 0 0/.85);
}
.stage3d-label.is-moment{outline:2px solid var(--color-state-warning);outline-offset:1px;box-shadow:0 0 0 4px color-mix(in srgb,var(--color-state-warning) 32%,transparent)}
.stage3d-label[data-state~="partial"]{border-style:dashed;color:var(--muted)}
.stage3d-label.is-tucked{max-width:.75rem;max-height:.75rem;padding:0;overflow:hidden;color:transparent;border-radius:999px;background:var(--line-hot);box-shadow:none}
.stage3d-label.is-tucked>*{visibility:hidden}
.stage3d-label.is-tucked:hover>*{visibility:visible}
.stage3d-label.is-tucked:hover{max-width:12rem;max-height:none;padding:.25rem .55rem;color:var(--ink);border-radius:6px;background:color-mix(in srgb,var(--panel) 96%,transparent);z-index:3}
/* Text straight over the canvas sits on the labels' --void chip: the camera can put any plate behind it (#783). */
.stage3d-compass{
  padding:.18rem .35rem .18rem calc(.35rem + .2em);
  border:1px solid color-mix(in srgb,var(--line-hot) 55%,var(--line));border-radius:999px;
  background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(4px);
  box-shadow:0 4px 12px rgb(0 0 0/.6);
  color:var(--faint);font:600 .6875rem/1 var(--font-interface);letter-spacing:.2em;
}
.stage3d-reset{
  position:absolute;top:.6rem;right:.6rem;z-index:3;min-height:44px;padding:.45rem .85rem;
  border:1px solid color-mix(in srgb,var(--ink) 16%,var(--line));border-radius:var(--r-md,8px);
  background:color-mix(in srgb,var(--void) 84%,transparent);backdrop-filter:blur(8px);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 8%,transparent),0 10px 24px -12px rgb(0 0 0/.88);
  color:var(--ink);font:600 .75rem/1 var(--font-interface);letter-spacing:.04em;
  transition:border-color .15s var(--ease),color .15s var(--ease),background .15s var(--ease);
}
.stage3d-reset:hover{
  border-color:var(--color-state-active);color:var(--color-state-active);
  background:color-mix(in srgb,var(--panel) 92%,transparent);
}
.stage3d-help{
  position:absolute;left:.6rem;bottom:.6rem;z-index:3;margin:0;padding:.24rem .55rem;
  border:1px solid color-mix(in srgb,var(--line) 78%,transparent);border-radius:999px;
  background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(6px);
  color:var(--faint);font:500 .68rem/1.35 var(--font-interface);letter-spacing:.01em;pointer-events:none;
}
.stage3d-key{margin:.45rem 0 0}
.stage3d-key summary{
  cursor:pointer;display:inline-flex;align-items:center;gap:.4rem;padding:.15rem 0;
  color:var(--muted);font:600 .72rem/1.4 var(--font-interface);letter-spacing:.1em;text-transform:uppercase;
  transition:color .15s var(--ease);
}
.stage3d-key summary:hover{color:var(--ink)}
.stage3d-key ul{
  display:grid;row-gap:.45rem;column-gap:2rem;
  margin:.5rem 0 .25rem;padding:.65rem .85rem .65rem 1.65rem;
  border:1px solid color-mix(in srgb,var(--line) 78%,transparent);border-radius:var(--r-md,8px);
  background:color-mix(in srgb,var(--void) 76%,var(--panel));
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 5%,transparent);
  color:var(--muted);font:.8rem/1.45 var(--font-interface);
}
@media(min-width:720px){.stage3d-key ul{grid-template-columns:1fr 1fr}}
.stage3d-caption{margin:.4rem 0 .6rem;color:var(--faint);font:.74rem/1.4 var(--font-interface)}
.stage3d-says{position:relative;width:12.5rem;height:0;pointer-events:none}
.stage3d-says-list{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:.25rem}
.stage3d-say{
  pointer-events:none;max-width:12.5rem;padding:4px 8px;
  border:1px solid color-mix(in srgb,var(--color-state-active) 55%,var(--line));
  border-left:2px solid var(--color-state-active);
  border-radius:6px;background:rgba(11,15,21,.9);backdrop-filter:blur(6px);
  box-shadow:0 8px 20px -6px rgb(0 0 0/.84),inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent);
  color:var(--ink);font:500 .66rem/1.28 var(--font-interface);
  text-align:left;white-space:normal;
}
.stage3d-say.is-major{border-color:var(--color-state-warning);border-left-color:var(--color-state-warning)}
.stage3d-say .stage3d-say-consequence{display:block;margin-top:2px;color:var(--muted);font-size:.6rem}
.stage3d-nameplate{
  pointer-events:none;display:inline-flex;align-items:center;padding:2px 7px 2px 6px;
  border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  border-radius:999px;background:rgba(11,15,21,.84);backdrop-filter:blur(5px);
  box-shadow:0 3px 10px rgb(0 0 0/.72),0 0 0 1px rgba(7,10,16,.65),inset 0 1px 0 color-mix(in srgb,var(--ink) 7%,transparent);
  color:var(--ink);font:500 .61rem/1.15 var(--font-mono);letter-spacing:.01em;white-space:nowrap;
}
.stage3d-dot{
  display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:middle;flex:0 0 auto;
  box-shadow:0 0 0 1px rgba(7,10,16,.7);
}
.stage3d-nameplate.is-tucked{display:none}
.stage3d-lines{display:block;max-width:14rem;white-space:nowrap;margin-top:.125rem;color:var(--muted);font:400 .66rem/1.2 var(--font-interface);overflow:hidden;text-overflow:ellipsis}
.stage3d-more{
  pointer-events:none;padding:1px 5px;border:1px solid var(--line);border-radius:999px;background:rgba(11,15,21,.9);
  color:var(--faint);font:600 .62rem/1.2 var(--font-mono);
}
@media(max-width:860px){
  .watch-stage[data-mode="3d"]{grid-template-columns:1fr}
  body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(var(--max),calc(100% - 2*var(--pad)))}
  .stage3d-frame{height:52vh;min-height:320px}
  .stage3d-help{display:none}
}
/* D7 Places dropdown, collapsed text index drawer, and Full-Screen Place View overlay */
.watch-place-bar{
  display:inline-flex;align-items:center;gap:.45rem;flex:0 0 auto;max-width:100%;
}
.watch-place-label{
  color:var(--faint);font:600 .66rem/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;
}
.watch-place-select{
  min-height:36px;max-width:100%;padding:.35rem 1.85rem .35rem .65rem;
  border:1px solid color-mix(in srgb,var(--line-hot) 65%,var(--line));border-radius:var(--r-md,8px);
  background-color:color-mix(in srgb,var(--void) 86%,var(--panel));
  background-image:linear-gradient(45deg,transparent 50%,var(--color-state-active) 50%),linear-gradient(135deg,var(--color-state-active) 50%,transparent 50%);
  background-position:calc(100% - 13px) 50%,calc(100% - 8px) 50%;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat;
  appearance:none;-webkit-appearance:none;
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 7%,transparent),0 8px 20px -12px rgb(0 0 0/.82);
  color:var(--ink);font:500 .78rem/1.2 var(--font-interface);letter-spacing:.01em;cursor:pointer;
  transition:border-color .15s var(--ease),box-shadow .15s var(--ease),background-color .15s var(--ease);
}
.watch-place-select:hover{
  border-color:color-mix(in srgb,var(--color-state-active) 68%,var(--line));
  background-color:color-mix(in srgb,var(--panel) 84%,var(--void));
}
.watch-place-select:focus-visible{
  outline:2px solid var(--color-border-focus,var(--color-state-active));outline-offset:2px;
  border-color:var(--color-state-active);
}
.watch-place-select option{background:#0b0f15;color:#e8e4dc}
.watch-places-drawer{
  margin:.65rem 0 0;border:1px solid color-mix(in srgb,var(--line) 82%,transparent);
  border-radius:var(--r-md,8px);background:color-mix(in srgb,var(--void) 76%,var(--panel));
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 5%,transparent);
}
.watch-places-drawer > summary{
  cursor:pointer;list-style:none;display:flex;align-items:center;gap:.45rem;
  padding:.5rem .75rem;color:var(--muted);
  font:600 .72rem/1.3 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;
  transition:color .15s var(--ease);
}
.watch-places-drawer > summary::-webkit-details-marker{display:none}
.watch-places-drawer > summary::before{
  content:"▸";color:var(--color-state-active);font-size:.82rem;line-height:1;
}
.watch-places-drawer[open] > summary::before{content:"▾"}
.watch-places-drawer > summary:hover{color:var(--ink)}
.watch-places-drawer > summary:focus-visible{outline:2px solid var(--color-state-active);outline-offset:2px;border-radius:var(--r-md,8px)}
.watch-places-drawer #watch-stage-places{
  margin:0;padding:.25rem .75rem .75rem;border-top:1px solid color-mix(in srgb,var(--line) 75%,transparent);
}
.watch-enter-room-btn{
  border-color:color-mix(in srgb,var(--color-state-active) 48%,var(--line))!important;
  color:var(--color-state-active)!important;
}
.watch-enter-room-btn:hover{
  background:color-mix(in srgb,var(--color-state-active) 14%,var(--void))!important;
}
body.is-room-open{overflow:hidden}
#watch-room-overlay[hidden],#watch-room-overlay [hidden]{display:none!important}
.room-overlay{
  position:fixed;inset:0;z-index:40;background:var(--void);
  display:flex;flex-direction:column;overflow:hidden;
}
.room-bar{
  flex:0 0 auto;min-height:54px;height:54px;z-index:4;
  display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;gap:.55rem;
  padding:0 .65rem;
  background:color-mix(in srgb,var(--void) 92%,var(--panel));
  backdrop-filter:blur(10px);
  border-bottom:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  box-shadow:0 12px 32px -18px rgb(0 0 0/.9);
}
.room-bar-left,.room-bar-right{
  flex:0 0 auto;display:flex;flex-wrap:nowrap;align-items:center;gap:.38rem;min-width:0;
}
.room-bar-center{
  flex:1 1 0;min-width:0;display:flex;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:.4rem;
  overflow-x:auto;scrollbar-width:none;
}
.room-bar-center::-webkit-scrollbar{display:none}
.room-back-btn,.room-ctrl-btn,.room-follow-chip{
  min-height:44px;padding:.35rem .68rem;white-space:nowrap;flex:0 0 auto;
  border:1px solid color-mix(in srgb,var(--line-hot) 58%,var(--line));border-radius:var(--r-md,8px);
  background:color-mix(in srgb,var(--void) 84%,var(--panel));
  color:var(--ink);font:600 .73rem/1 var(--font-interface);letter-spacing:.03em;
  transition:border-color .15s var(--ease),color .15s var(--ease),background .15s var(--ease);
}
.room-back-btn:hover,.room-ctrl-btn:hover{
  border-color:var(--color-state-active);color:var(--color-state-active);
  background:color-mix(in srgb,var(--panel) 90%,var(--void));
}
.room-ctrl-btn[aria-expanded="true"]{
  border-color:color-mix(in srgb,var(--color-state-active) 55%,var(--line));
  color:var(--color-state-active);
}
.room-follow-chip{
  border-color:var(--color-state-active);color:var(--color-state-active);
  background:color-mix(in srgb,var(--color-state-active) 12%,var(--void));
}
.room-place-select{min-height:44px;max-width:12rem;padding:.3rem 1.65rem .3rem .55rem;font-size:.74rem}
.room-title{
  margin:0;flex:0 0 auto;color:var(--ink);font:600 .95rem/1.15 var(--font-display);letter-spacing:.01em;white-space:nowrap;
}
.room-bands{flex:0 0 auto;display:inline-flex;flex-wrap:nowrap;align-items:center;gap:.25rem}
.room-band-chip{
  display:inline-flex;align-items:center;padding:2px 6px;border-radius:999px;white-space:nowrap;
  border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  background:color-mix(in srgb,var(--void) 88%,var(--panel));
  color:var(--muted);font:600 .6rem/1.2 var(--font-mono);letter-spacing:.05em;text-transform:uppercase;
}
.room-band-chip.is-pressure{
  border-color:color-mix(in srgb,var(--color-state-warning) 56%,var(--line));
  color:var(--color-state-warning);
}
.room-band-chip.is-scar{
  border-color:color-mix(in srgb,#9b6dff 56%,var(--line));
  color:#c5a8ff;
}
.room-exits{flex:0 0 auto;display:inline-flex;flex-wrap:nowrap;align-items:center;gap:.25rem}
.room-exit-pill{
  cursor:pointer;flex:0 0 auto;min-height:30px;padding:.18rem .52rem;
  border:1px solid color-mix(in srgb,var(--color-state-active) 40%,var(--line));border-radius:999px;
  background:color-mix(in srgb,var(--void) 86%,var(--panel));
  color:var(--ink);font:500 .66rem/1.2 var(--font-mono);white-space:nowrap;
  transition:border-color .15s var(--ease),color .15s var(--ease),background .15s var(--ease);
}
.room-exit-pill:hover,.room-exit-pill:focus-visible{
  border-color:var(--color-state-active);color:var(--color-state-active);
  background:color-mix(in srgb,var(--color-state-active) 12%,var(--void));
}
.room-body{
  flex:1;position:relative;display:flex;min-height:0;min-width:0;overflow:hidden;
}
.room-frame{
  flex:1;position:relative;min-height:0;min-width:0;overflow:hidden;background:var(--void);
}
.room-frame:focus-visible{outline:2px solid var(--color-border-focus,var(--color-state-active));outline-offset:-2px}
.room-frame canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none}
.room3d-labels{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.room3d-help{
  position:absolute;left:.75rem;bottom:.75rem;z-index:3;margin:0;padding:.24rem .6rem;
  border:1px solid color-mix(in srgb,var(--line) 78%,transparent);border-radius:999px;
  background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(6px);
  color:var(--faint);font:500 .68rem/1.35 var(--font-interface);pointer-events:none;
}
/* Room View 3D DOM chips (CSS2DRenderer overlays) */
.room3d-portal{
  pointer-events:auto;cursor:pointer;display:inline-flex;align-items:center;gap:.3rem;
  padding:4px 10px;border:1px solid color-mix(in srgb,var(--color-state-active) 50%,var(--line));
  border-radius:999px;background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(6px);
  box-shadow:0 6px 18px -4px rgb(0 0 0/.84),inset 0 1px 0 color-mix(in srgb,var(--color-state-active) 14%,transparent);
  color:var(--ink);font:600 .68rem/1.2 var(--font-mono);letter-spacing:.02em;white-space:nowrap;
  transition:border-color .15s var(--ease),color .15s var(--ease),box-shadow .15s var(--ease);
}
.room3d-portal:hover,.room3d-portal:focus-visible{
  border-color:var(--color-state-active);color:var(--color-state-active);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--color-state-active) 40%,transparent),0 8px 22px -6px rgb(0 0 0/.92);
}
.room3d-entity{
  pointer-events:auto;cursor:pointer;max-width:11.5rem;padding:2px 8px;
  border:1px solid color-mix(in srgb,var(--line-hot) 60%,var(--line));border-radius:6px;
  background:color-mix(in srgb,var(--void) 86%,var(--panel));backdrop-filter:blur(5px);
  box-shadow:0 4px 12px -4px rgb(0 0 0/.8);
  color:var(--muted);font:500 .64rem/1.2 var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  transition:border-color .15s var(--ease),color .15s var(--ease);
}
.room3d-entity:hover,.room3d-entity.is-selected{
  border-color:var(--color-state-active);color:var(--ink);
}
.room3d-trace{
  pointer-events:auto;cursor:pointer;max-width:13rem;padding:3px 8px;
  border:1px solid color-mix(in srgb,#d9c7a3 36%,var(--line));
  border-left:2px solid color-mix(in srgb,#d9c7a3 76%,var(--color-state-warning));
  border-radius:5px;background:color-mix(in srgb,var(--void) 88%,#231d14);backdrop-filter:blur(5px);
  box-shadow:0 5px 14px -4px rgb(0 0 0/.82);
  color:#e7dcc6;font:400 .63rem/1.28 var(--font-interface);text-align:left;white-space:normal;
}
.room3d-agent-label{
  pointer-events:auto;cursor:pointer;display:inline-flex;align-items:center;gap:5px;
  padding:3px 9px 3px 7px;border:1px solid color-mix(in srgb,var(--line-hot) 64%,var(--line));
  border-radius:999px;background:color-mix(in srgb,var(--void) 88%,transparent);backdrop-filter:blur(6px);
  box-shadow:0 5px 14px -4px rgb(0 0 0/.84),inset 0 1px 0 color-mix(in srgb,var(--ink) 8%,transparent);
  color:var(--ink);font:600 .68rem/1.15 var(--font-mono);white-space:nowrap;
  transition:border-color .15s var(--ease),box-shadow .15s var(--ease);
}
.room3d-agent-label:hover,.room3d-agent-label.is-followed{
  border-color:var(--color-state-active);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--color-state-active) 36%,transparent),0 8px 20px -6px rgb(0 0 0/.9);
}
.room3d-dot{
  display:inline-block;width:7px;height:7px;border-radius:50%;flex:0 0 auto;
  box-shadow:0 0 0 1px rgba(7,10,16,.75);
}
.room3d-verb{
  color:var(--muted);font:500 .6rem/1 var(--font-interface);letter-spacing:.02em;margin-left:2px;
}
.room3d-speech{
  position:relative;pointer-events:none;max-width:14rem;padding:5px 9px;
  border:1px solid color-mix(in srgb,var(--speech-accent,var(--color-state-active)) 56%,var(--line));
  border-left:2.5px solid var(--speech-accent,var(--color-state-active));
  border-radius:9px;background:color-mix(in srgb,var(--void) 92%,var(--panel));backdrop-filter:blur(8px);
  box-shadow:0 10px 26px -6px rgb(0 0 0/.9),inset 0 1px 0 color-mix(in srgb,var(--ink) 8%,transparent);
  color:var(--ink);font:500 .68rem/1.32 var(--font-interface);text-align:left;white-space:normal;
}
.room3d-speech::after{
  content:"";position:absolute;left:50%;bottom:-5px;width:8px;height:8px;margin-left:-4px;
  transform:rotate(45deg);background:color-mix(in srgb,var(--void) 92%,var(--panel));
  border-right:1px solid color-mix(in srgb,var(--speech-accent,var(--color-state-active)) 56%,var(--line));
  border-bottom:1px solid color-mix(in srgb,var(--speech-accent,var(--color-state-active)) 56%,var(--line));
}
.room3d-speech-meta{
  display:block;margin-bottom:2px;color:var(--muted);font:600 .6rem/1.2 var(--font-mono);letter-spacing:.03em;
}
/* Collapsible Room Activity & Details Drawer: docked on desktop (>=1024px), floating on narrower viewports */
.room-drawer{
  position:static;flex:0 0 21rem;width:21rem;height:100%;z-index:3;
  display:flex;flex-direction:column;
  border-left:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  background:color-mix(in srgb,var(--void) 90%,var(--panel));
  box-shadow:inset 1px 0 0 color-mix(in srgb,var(--ink) 5%,transparent);
  overflow:hidden;
}
.room-drawer-inner{
  flex:1;min-height:0;overflow-y:auto;padding:.8rem .9rem;
  display:flex;flex-direction:column;gap:.85rem;
  scrollbar-width:thin;scrollbar-color:var(--line-hot) transparent;
}
.room-drawer-desc{margin:0;color:var(--muted);font:.78rem/1.45 var(--font-body)}
.room-drawer-desc:empty{display:none}
.room-drawer-sec h3{
  margin:0 0 .4rem;color:var(--faint);font:600 .64rem/1.2 var(--font-mono);
  letter-spacing:.12em;text-transform:uppercase;
}
.room-agents-list{display:flex;flex-direction:column;gap:.35rem}
.room-agent-card{
  width:100%;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:.18rem;
  padding:.48rem .65rem;border:1px solid color-mix(in srgb,var(--line) 82%,transparent);
  border-left:2.5px solid var(--agent-accent,var(--line-hot));border-radius:var(--r-md,8px);
  background:color-mix(in srgb,var(--void) 76%,var(--panel));color:var(--ink);
  font:.74rem/1.3 var(--font-interface);
  transition:border-color .15s var(--ease),background .15s var(--ease);
}
.room-agent-card:hover,.room-agent-card.is-followed{
  border-color:var(--agent-accent,var(--color-state-active));
  background:color-mix(in srgb,var(--panel-2) 66%,var(--void));
}
.room-agent-card-head{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.room-agent-card-head strong{font-weight:600;color:var(--ink)}
.room-resident-badge{
  padding:1px 6px;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--color-state-active) 50%,var(--line));
  background:color-mix(in srgb,var(--color-state-active) 12%,var(--void));
  color:var(--color-state-active);font:600 .58rem/1.25 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;
}
.room-verb-tag{
  padding:1px 6px;border-radius:4px;border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));
  background:color-mix(in srgb,var(--void) 82%,var(--panel));
  color:var(--muted);font:600 .6rem/1.25 var(--font-mono);letter-spacing:.04em;
}
.room-agent-card-sub{color:var(--muted);font:.68rem/1.3 var(--font-mono);padding-left:.85rem}
.room-activity-list{
  margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.4rem;
}
.room-activity-item{
  padding:.48rem .6rem;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);
  border-radius:var(--r-md,8px);background:color-mix(in srgb,var(--void) 78%,var(--panel));
  font:.74rem/1.36 var(--font-interface);color:var(--ink);
}
.room-activity-item.is-speech{
  border-color:color-mix(in srgb,var(--speech-accent,var(--color-state-active)) 44%,var(--line));
  border-left:2.5px solid var(--speech-accent,var(--color-state-active));
  background:color-mix(in srgb,var(--panel) 72%,var(--void));
}
.room-activity-item.is-posture{
  border-style:dashed;color:var(--muted);font-size:.7rem;
}
.room-activity-meta{
  display:flex;flex-wrap:wrap;align-items:center;gap:.3rem .45rem;margin-bottom:.2rem;
  color:var(--muted);font:600 .64rem/1.2 var(--font-mono);
}
.room-activity-speech{margin:.12rem 0 0;color:var(--ink);font:.76rem/1.38 var(--font-body)}
.room-activity-line{margin:0;color:inherit;overflow-wrap:anywhere}
.room-target-chip{
  display:inline-block;padding:1px 5px;border-radius:4px;
  border:1px solid color-mix(in srgb,var(--line-hot) 52%,var(--line));
  color:var(--color-state-social);font:500 .62rem/1.2 var(--font-mono);
}
.room-works-list{display:flex;flex-direction:column;gap:.45rem}
.room-works-entities{display:flex;flex-wrap:wrap;gap:.35rem}
.room-work-chip{
  display:inline-flex;align-items:center;gap:.28rem;padding:.24rem .55rem;
  border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));border-radius:6px;
  background:color-mix(in srgb,var(--void) 82%,var(--panel));
  color:var(--ink);font:500 .68rem/1.2 var(--font-mono);
}
.room-work-chip.is-selected{border-color:var(--color-state-active);color:var(--color-state-active)}
.room-trace-item{
  margin:0;padding:.4rem .58rem;
  border:1px solid color-mix(in srgb,#d9c7a3 32%,var(--line));
  border-left:2px solid color-mix(in srgb,#d9c7a3 72%,var(--color-state-warning));
  border-radius:6px;background:color-mix(in srgb,var(--void) 86%,#231d14);
  color:#e7dcc6;font:.72rem/1.38 var(--font-interface);
}
.room-empty-note{margin:0;color:var(--faint);font:.72rem/1.35 var(--font-mono)}
.room-text-fallback{
  position:absolute;inset:0;z-index:3;overflow-y:auto;padding:1.1rem clamp(.85rem,3vw,2rem) 2rem;
  background:var(--void);color:var(--ink);
}
.room-text-inner{max-width:52rem;margin:0 auto;display:flex;flex-direction:column;gap:1rem}
.room-text-note{margin:0;color:var(--faint);font:.74rem/1.4 var(--font-mono)}
@media(max-width:1099px){
  .room-bar{height:auto;flex-wrap:wrap;padding:.35rem .6rem;gap:.35rem .55rem}
  .room-bar-center{flex:1 1 100%;order:3;flex-wrap:wrap;overflow-x:visible}
  .room-bands,.room-exits{flex-wrap:wrap}
}
@media(max-width:1023px){
  .room-drawer{
    position:absolute;top:.65rem;right:.65rem;bottom:.65rem;height:auto;flex:none;
    width:min(21rem,calc(100vw - 1.3rem));
    border:1px solid color-mix(in srgb,var(--line-hot) 56%,var(--line));border-radius:var(--r-lg,12px);
    background:color-mix(in srgb,var(--void) 88%,var(--panel));backdrop-filter:blur(12px);
    box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ink) 7%,transparent),0 22px 48px -20px rgb(0 0 0/.92);
  }
}
@media(max-width:860px){
  .room-bar{padding:.35rem .5rem;gap:.35rem}
  .room-bar-left{width:100%;justify-content:space-between}
  .room-bar-center{width:100%;justify-content:flex-start}
  .room-bar-right{width:100%;justify-content:flex-end}
  .room-place-select{flex:1 1 auto;max-width:none}
  .room3d-help{display:none}
  .room-drawer{left:.5rem;right:.5rem;top:auto;bottom:.5rem;width:auto;max-height:54vh}
}
`;
