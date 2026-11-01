/**
 * Opt-in 3D WATCH view (Three.js "fluid" stage, originally by Ruffian-L in #736).
 * Markup and styles only. The stage script is fetched lazily from FLUID_SRC when
 * the spectator picks 3D; TEXT / PIXEL / MAP never load it.
 */
export const FLUID_SRC = "/assets/watch-fluid.js";

/** Shown on the MAP stage when the 3D view cannot start (no WebGL2, load error, lost context). */
export const FLUID_FALLBACK_LINE = "3D view is unavailable here. Showing MAP.";

export function fluidStageHtml(): string {
  return `
      <div id="watch-fluid" hidden>
        <div class="watch-fluid-frame">
          <canvas id="watch-fluid-flat" aria-hidden="true"></canvas>
          <canvas id="watch-fluid-gl" hidden aria-hidden="true"></canvas>
          <pre id="watch-fluid-text" class="sr" aria-label="Public map as text"></pre>
          <p id="watch-fluid-help" hidden>Drag to turn - scroll to zoom</p>
        </div>
        <p id="watch-fluid-note" role="status"></p>
        <p class="watch-fluid-caption">3D view of the public map. It builds from public events received while this window is open.</p>
      </div>
      <p class="map-parity" id="watch-fluid-fallback" role="status" hidden></p>`;
}

export const FLUID_STAGE_CSS = `
.watch-stage[data-mode="3d"]{grid-template-columns:minmax(0,1fr) minmax(17.5rem,22rem);align-items:start}
body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(80rem,calc(100% - 2*var(--pad)))}
#watch-fluid[hidden],#watch-fluid [hidden]{display:none!important}
.watch-fluid-frame{position:relative;height:clamp(330px,58vh,640px);background:var(--panel);border:1px solid var(--line)}
.watch-fluid-frame canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.watch-fluid-frame pre:not(.sr){position:relative;max-width:100%;height:100%;overflow:auto;padding:1rem;font:400 .8rem/1.4 var(--font-mono);white-space:pre}
#watch-fluid-help{position:absolute;left:1rem;bottom:1rem;margin:0;color:var(--muted);font:.72rem/1.4 var(--font-interface);pointer-events:none}
#watch-fluid-note:empty{display:none}
#watch-fluid-note{color:var(--color-state-warning);font:.8rem/1.4 var(--font-interface)}
.watch-fluid-caption{color:var(--faint);font:.75rem/1.4 var(--font-interface);margin:.5rem 0 1rem}
@media(max-width:860px){
  .watch-stage[data-mode="3d"]{grid-template-columns:1fr}
  body:has(.watch-stage[data-mode="3d"]) .wrap{width:min(var(--max),calc(100% - 2*var(--pad)))}
  .watch-fluid-frame{height:44vh;min-height:330px}
}
`;
