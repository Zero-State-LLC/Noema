/** Presentation adapter only. Public payloads and canonical history remain unchanged. */
export function anonymousWatchView(data: Record<string, any>): Record<string, any> {
  const view = JSON.parse(JSON.stringify(data));
  const labels: string[] = [];
  const pending: any[] = [view];
  while (pending.length) {
    const item = pending.pop();
    if (!item || typeof item !== "object") continue;
    if (typeof item.actor_label === "string" && item.actor_label) labels.push(item.actor_label);
    if (Array.isArray(item.public_player_labels)) labels.push(...item.public_player_labels);
    for (const key of Object.keys(item)) {
      if (item[key] && typeof item[key] === "object") pending.push(item[key]);
    }
  }
  const escaped: string[] = [];
  for (const label of new Set(labels)) {
    if (typeof label === "string" && label) escaped.push(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }
  escaped.sort();
  const names = escaped.length ? new RegExp("(^|[^\\p{L}\\p{N}_-])(?:" + escaped.join("|") + ")(?=$|[^\\p{L}\\p{N}_-])", "gu") : null;
  pending.push(view);
  while (pending.length) {
    const item = pending.pop();
    if (!item || typeof item !== "object") continue;
    for (const key of Object.keys(item)) {
      if (key === "actor_label") item[key] = item[key] ? "An agent" : item[key];
      else if (key === "public_player_labels") item[key] = [];
      else if (["public_title_lines", "public_focus_lines", "public_descriptor_lines"].includes(key)) item[key] = [];
      else if (names && ["line", "text", "detail", "consequence", "description"].includes(key) && typeof item[key] === "string") {
        item[key] = item[key].replace(names, function(_match: string, prefix: string, offset: number) {
          return prefix + (offset === 0 && !prefix ? "An agent" : "an agent");
        });
      } else if (item[key] && typeof item[key] === "object") pending.push(item[key]);
    }
  }
  return view;
}

export function anonymousWatchInlineSource(): string {
  const source = anonymousWatchView.toString();
  if (source.includes("__name")) throw new Error("WATCH anonymity helper leaked bundler keepNames");
  return source;
}

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
