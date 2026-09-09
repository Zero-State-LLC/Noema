/**
 * MAP stage paint helpers for the unified /watch Chamber.
 * Board + Health read watch-map JSON. River/Recently stays on watch-live.
 * Each function is a leaf so the inlined script does not depend on bundler names.
 */

export const MAP_STAGE_CSS = `
.map-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.45rem;min-height:16rem}
.map-node{position:relative;padding:.55rem .5rem;border:1px solid var(--line);background:var(--paper);min-height:4.2rem;transition:transform .35s ease,box-shadow .35s ease}
.map-node.is-active{outline:2px solid var(--ink)}
.map-node .n{font:550 .78rem/1.2 var(--font-mono)}
.map-node .m{color:var(--faint);font:.62rem/1.3 var(--font-mono)}
.map-node .scar{position:absolute;inset:auto .3rem .3rem auto;width:.55rem;height:.55rem;border-radius:50%;background:var(--color-state-warning)}
.map-node[data-scar=""] .scar{display:none}
.map-node[data-scar="faint"] .scar{opacity:.4}
.map-node[data-scar="marked"] .scar{opacity:.7}
.layer-toggles{display:flex;flex-wrap:wrap;gap:.35rem;margin:.6rem 0}
.layer-toggles button{font:.62rem/1.2 var(--font-mono)}
.health dl{display:grid;grid-template-columns:1fr auto;gap:.2rem .8rem;margin:0;min-height:4.5rem}
.health dt{color:var(--faint);font:.62rem/1.2 var(--font-mono);text-transform:uppercase;letter-spacing:.08em}
.health dd{margin:0;font:550 .82rem/1.2 var(--font-mono)}
@media (prefers-reduced-motion:reduce){.map-node{transition:none}}
body.map-hide-activity .map-node .m.act{display:none}
body.map-hide-state .map-node .scar{display:none}
body.map-hide-health .health{display:none}
#watch-stage-map[hidden],#watch-stage-places[hidden]{display:none}
`;

export type MapNodePaint = {
  name?: string;
  public_player_labels?: unknown;
  players_present?: unknown;
  scar_band?: unknown;
  pressure_band?: unknown;
};

export function mapOccupantLabels(n?: MapNodePaint | null): string[] {
  const occ = n && Array.isArray(n.public_player_labels) ? n.public_player_labels : [];
  const roomName = String((n && n.name) || "").trim().toLowerCase();
  const out: string[] = [];
  for (let i = 0; i < occ.length; i++) {
    const h = String(occ[i] || "").trim();
    if (!h) continue;
    if (h.toLowerCase() === roomName) continue;
    if (/^room\./i.test(h)) continue;
    if (out.indexOf(h) >= 0) continue;
    out.push(h);
  }
  return out;
}

export function mapOccupantCaption(n?: MapNodePaint | null): string {
  const occ = n && Array.isArray(n.public_player_labels) ? n.public_player_labels : [];
  const roomName = String((n && n.name) || "").trim().toLowerCase();
  const labels: string[] = [];
  for (let i = 0; i < occ.length; i++) {
    const h = String(occ[i] || "").trim();
    if (!h) continue;
    if (h.toLowerCase() === roomName) continue;
    if (/^room\./i.test(h)) continue;
    if (labels.indexOf(h) >= 0) continue;
    labels.push(h);
  }
  if (labels.length) return labels.join(", ");
  return String(Number(n && n.players_present) || 0) + " here";
}

export function mapNodeMetaLine(n?: MapNodePaint | null): string {
  const scar = String((n && n.scar_band) || "").trim();
  const pressure = String((n && n.pressure_band) || "").trim();
  const parts: string[] = [];
  if (scar) parts.push("scar: " + scar);
  if (pressure) parts.push("pressure: " + pressure);
  return parts.join(" · ");
}

export function mapHealthPairs(h?: {
  scar_band?: unknown;
  reconstruction_fidelity?: unknown;
  players_present?: unknown;
} | null): Array<[string, string]> {
  const health = h || {};
  const recon = health.reconstruction_fidelity;
  return [
    ["Scars", String(health.scar_band || "none")],
    ["Reconstruction", recon == null || recon === "" ? "—" : String(recon)],
    ["Players", health.players_present == null || health.players_present === "" ? "—" : String(health.players_present)],
  ];
}

/** Layers that hide MAP-stage chrome only. Never the shared Recently feed. */
export function mapLayerHideable(id?: string | null): boolean {
  const k = String(id || "");
  return k === "activity" || k === "state" || k === "health";
}

const MAP_INLINE_FNS = [
  mapOccupantCaption,
  mapNodeMetaLine,
  mapHealthPairs,
  mapLayerHideable,
] as const;

/**
 * Leaf sources for the /watch IIFE. Wrangler keepNames wraps nested named
 * functions as `__name(fn, "name")`; those calls abort the browser script.
 */
export function watchMapInlineSource(): string {
  return MAP_INLINE_FNS.map((fn) => {
    const src = fn.toString();
    if (src.includes("__name")) {
      throw new Error("watch map helper leaked bundler keepNames");
    }
    return src;
  }).join("\n");
}

export function mapStageHtml(visible = false): string {
  return `
      <div id="watch-stage-map"${visible ? "" : " hidden"}>
        <h2 id="watch-map-stage-label">Map</h2>
        <p class="lede">Richer spectator projection. Derived, not world truth.</p>
        <div class="layer-toggles" id="watch-map-toggles" role="group" aria-label="Layers"></div>
        <div class="map-board" id="watch-map-board"></div>
        <section class="health" aria-label="World health">
          <h2 class="now-k">Health</h2>
          <dl id="watch-map-health"></dl>
        </section>
      </div>`;
}
