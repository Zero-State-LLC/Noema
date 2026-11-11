/**
 * watch-map/1.0 paint helpers for the /watch Chamber stage (world health,
 * band captions). River/Recently stays on watch-live.
 * Each function is a leaf so the inlined script does not depend on bundler names.
 */

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
