/** Fluid stage markup and styles within the existing public WATCH shell. */
export const FLUID_STAGE_HTML = `
      <div id="watch-fluid" hidden>
        <div class="watch-fluid-frame">
          <canvas id="watch-fluid-flat" aria-hidden="true"></canvas>
          <canvas id="watch-fluid-gl" hidden aria-hidden="true"></canvas>
          <pre id="watch-fluid-text" class="sr" aria-label="Public map as text"></pre>
          <p id="watch-fluid-help" hidden>Drag to turn · scroll to zoom</p>
        </div>
        <p id="watch-fluid-note" role="status"></p>
        <p class="watch-fluid-caption">One public map, three looks. MAP builds from public events received while this window is open.</p>
      </div>`;

export const FLUID_STAGE_CSS = `
.watch-stage [hidden]{display:none!important}
body:has(.has-fluid-stage) .wrap{width:min(80rem,calc(100% - 2*var(--pad)))}
.watch-fluid-frame{position:relative;height:clamp(330px,58vh,640px);background:var(--panel);border:1px solid var(--line)}
.watch-fluid-frame canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.watch-fluid-frame canvas[hidden],#watch-fluid[hidden]{display:none!important}
.watch-fluid-frame pre:not(.sr){position:relative;max-width:100%;height:100%;overflow:auto;padding:1rem;font:400 .8rem/1.4 var(--font-mono);white-space:pre}
#watch-fluid-help{position:absolute;left:1rem;bottom:1rem;margin:0;color:var(--muted);font:.72rem/1.4 var(--font-interface);pointer-events:none}
#watch-fluid-note:empty{display:none}
#watch-fluid-note{color:var(--color-state-warning);font:.8rem/1.4 var(--font-interface)}
.watch-fluid-caption{color:var(--faint);font:.75rem/1.4 var(--font-interface);margin:.5rem 0 1rem}
.has-fluid-stage #watch-phos-wrap,.has-fluid-stage #watch-pre,.has-fluid-stage #watch-stage-map{display:none!important}
.has-fluid-stage #watch-graph-label,.has-fluid-stage #watch-stage-places>.lede{display:none}
.has-fluid-stage .watch-fluid-sites{margin-top:.75rem;border-top:1px solid var(--line);padding-top:.75rem}
.watch-fluid-sites>summary{cursor:pointer;min-height:44px;font:.9rem/1.4 var(--font-interface)}
.has-fluid-stage .watch-modes .btn{min-height:44px}
.has-fluid-stage[data-mode]{grid-template-columns:minmax(0,1fr) minmax(17rem,22rem)}
@media(max-width:860px){.has-fluid-stage[data-mode]{grid-template-columns:1fr}.watch-fluid-frame{height:44vh;min-height:330px}}
`;
