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
  ["pressure", "Pressure band: the plate warms toward amber, low to high"],
  ["scar", "Scar residue band: dashed violet outline, faint to deep"],
  ["agent", "Agent present: one pip per agent, handles in the label"],
  ["trace", "Trace: a small mark on the site"],
  ["route", "Route: solid line"],
  ["uncertain", "Uncertain route: dashed line"],
  ["oneway", "One-way route: arrow toward its destination"],
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
.watch-stage[data-mode="3d"]{grid-template-columns:minmax(0,1fr) minmax(17.5rem,22rem);align-items:start}
body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(80rem,calc(100% - 2*var(--pad)))}
#watch-stage3d[hidden],#watch-stage3d [hidden]{display:none!important}
body.is-low-noise #watch-stage3d{display:none!important}
.stage3d-frame{
  position:relative;height:clamp(340px,60vh,660px);overflow:hidden;
  background:var(--void);border:1px solid var(--line);border-radius:var(--r);
}
.stage3d-frame:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:2px}
.stage3d-frame canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none}
.stage3d-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.stage3d-label{
  pointer-events:auto;cursor:pointer;max-width:12rem;padding:.25rem .5rem;
  border:1px solid var(--line);border-radius:4px;background:color-mix(in srgb,var(--void) 88%,transparent);
  color:var(--ink);font:500 .75rem/1.25 var(--font-interface);text-align:center;white-space:nowrap;
  transition:border-color .15s var(--ease),background .15s var(--ease);
}
.stage3d-label:hover{border-color:var(--line-hot);background:color-mix(in srgb,var(--panel) 92%,transparent)}
.stage3d-label .stage3d-handles{display:block;margin-top:.125rem;color:var(--color-state-social);font:400 .6875rem/1.2 var(--font-mono);overflow:hidden;text-overflow:ellipsis}
.stage3d-label .stage3d-bands{display:block;margin-top:.125rem;color:var(--muted);font:400 .625rem/1.2 var(--font-interface)}
.stage3d-health{display:flex;flex-wrap:wrap;gap:.25rem 1.25rem;margin:.5rem 0 0;color:var(--muted);font:.75rem/1.4 var(--font-interface)}
.stage3d-health:empty{display:none}
.stage3d-health div{display:flex;gap:.375rem;align-items:baseline}
.stage3d-health dt{color:var(--faint);text-transform:uppercase;letter-spacing:.08em;font-size:.6875rem}
.stage3d-health dd{margin:0;color:var(--ink)}
.stage3d-label .stage3d-state{display:block;margin-top:.125rem;color:var(--faint);font:600 .625rem/1.2 var(--font-interface);letter-spacing:.12em;text-transform:uppercase}
.stage3d-label[data-state~="active"]{border-color:color-mix(in srgb,var(--color-state-active) 55%,var(--line))}
.stage3d-label[data-state~="followed"]{border-color:var(--color-state-active)}
.stage3d-label[data-state~="selected"]{border-color:var(--ink)}
.stage3d-label[data-state~="major"]{border-color:var(--color-state-warning)}
.stage3d-label[data-state~="partial"]{border-style:dashed;color:var(--muted)}
.stage3d-label.is-tucked{max-width:.75rem;max-height:.75rem;padding:0;overflow:hidden;color:transparent;border-radius:999px;background:var(--line-hot)}
.stage3d-label.is-tucked>*{visibility:hidden}
.stage3d-label.is-tucked:hover>*{visibility:visible}
.stage3d-label.is-tucked:hover{max-width:12rem;max-height:none;padding:.25rem .5rem;color:var(--ink);border-radius:4px;background:color-mix(in srgb,var(--panel) 96%,transparent);z-index:1}
/* Text straight over the canvas sits on the labels' --void chip: the camera can put any plate behind it (#783). */
.stage3d-compass{padding:.125rem .25rem .125rem calc(.25rem + .2em);border-radius:var(--r);background:color-mix(in srgb,var(--void) 88%,transparent);color:var(--faint);font:600 .6875rem/1 var(--font-interface);letter-spacing:.2em}
.stage3d-reset{position:absolute;top:.5rem;right:.5rem;min-height:44px;background:color-mix(in srgb,var(--void) 80%,transparent)}
.stage3d-help{position:absolute;left:.375rem;bottom:.375rem;margin:0;padding:.125rem .375rem;border-radius:var(--r);background:color-mix(in srgb,var(--void) 88%,transparent);color:var(--faint);font:.6875rem/1.4 var(--font-interface);pointer-events:none}
.stage3d-key{margin:.5rem 0 0}
.stage3d-key summary{cursor:pointer;color:var(--muted);font:600 .75rem/1.5 var(--font-interface);letter-spacing:.08em;text-transform:uppercase}
.stage3d-key ul{display:grid;gap:.25rem .75rem;margin:.5rem 0 0;padding:0 0 0 1rem;color:var(--muted);font:.8125rem/1.4 var(--font-interface)}
@media(min-width:720px){.stage3d-key ul{grid-template-columns:1fr 1fr}}
.stage3d-caption{margin:.5rem 0 1rem;color:var(--faint);font:.75rem/1.4 var(--font-interface)}
@media(max-width:860px){
  .watch-stage[data-mode="3d"]{grid-template-columns:1fr}
  body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(var(--max),calc(100% - 2*var(--pad)))}
  .stage3d-frame{height:52vh;min-height:320px}
  .stage3d-help{display:none}
}
`;
