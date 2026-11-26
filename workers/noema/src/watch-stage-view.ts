/**
 * WATCH Chamber stage markup and styles (Noema-Specs specify/watch-single-3d-stage.md).
 * The renderer is fetched lazily from STAGE_SRC.
 * The canvas and labels are aria-hidden: the Places list beside the stage is
 * the accessible authority and carries every fact the stage draws (WS3-07, WS3-11).
 */

import { STAGE_VERSION } from "./watch-stage-version";

/**
 * Stage chunk URL. Assets are cached for an hour; the content-hash version
 * makes each deploy's page load exactly its own chunk. Kept out of the stage
 * model, which is bundled into the chunk itself.
 */
export const STAGE_SRC = "/assets/watch-stage.js?v=" + STAGE_VERSION;

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

export function stageViewHtml(): string {
  const key = STAGE_KEY.map(([k, text]) => `<li data-mark="${k}">${text}</li>`).join("");
  return `
      <div id="watch-stage3d" hidden>
        <div class="stage3d-frame" id="watch-stage3d-frame" tabindex="0" role="region"
          aria-label="3D public map. Arrow keys pan, Shift with arrow keys turns. Every site is also in the Places list.">
          <canvas id="watch-stage3d-gl" aria-hidden="true"></canvas>
          <div class="stage3d-labels" id="watch-stage3d-labels" aria-hidden="true"></div>
          <button type="button" class="btn stage3d-reset" id="watch-stage3d-reset">Reset view</button>
          <p class="stage3d-help" aria-hidden="true">Drag to turn · scroll to zoom · right-drag to pan</p>
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
`;
