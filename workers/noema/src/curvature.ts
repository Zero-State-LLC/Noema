/** Forman–Ricci on an undirected interaction graph. F(e) = 4 - deg(u) - deg(v).
 *  More negative mean curvature → higher cascading_risk. Same formula as economic_health.py. */

export type InteractionEdge = { from: string; to: string; grounding?: string };

const GROUNDED = new Set(["observed", "genesis", "inferred-from-stock"]);

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function formanCascadingRisk(edges: InteractionEdge[]): number {
  const raw = edges.filter((e) => e.from && e.to && e.from !== e.to);
  if (!raw.length) return 0;
  let low_g = 0;
  for (const e of raw) {
    const g = e.grounding || "";
    if (g && !GROUNDED.has(g)) low_g += 1;
  }
  const density = Math.min(1, raw.length / 8);
  const densityRisk = density * (0.4 + (0.6 * low_g) / Math.max(1, raw.length));

  const seen = new Set<string>();
  const uniq: Array<[string, string]> = [];
  const deg = new Map<string, number>();
  for (const e of raw) {
    const key = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push([e.from, e.to]);
    deg.set(e.from, (deg.get(e.from) || 0) + 1);
    deg.set(e.to, (deg.get(e.to) || 0) + 1);
  }
  let formanRisk = 0;
  if (uniq.length >= 2) {
    let sum = 0;
    for (const [u, v] of uniq) {
      sum += 4 - (deg.get(u) || 0) - (deg.get(v) || 0);
    }
    const mean = sum / uniq.length;
    formanRisk = clamp01(-mean / 8);
  }
  return clamp01(Math.max(formanRisk, densityRisk));
}
