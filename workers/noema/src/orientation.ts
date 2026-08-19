/**
 * GC / AGENT-ORIENTATION-S1 derived situation.
 * Restates live room facts. Not a thesis. Not WorldState.
 */

export const SITUATION_STRAIN_BELOW = 70;

export type Situation = {
  place: string;
  strain?: string;
};

type LiveEntity = {
  label?: string;
  condition?: number;
  harvestable?: boolean;
  stock_amount?: number;
};

/** Shared S0–S2 withhold. CONNECT/bootstrap/skills use the same scan. */
export const ORIENTATION_THESIS_RE =
  /point of the game|win the game|\bvictory\b|your goal is|the point is|you should (repair|trade|organize)|being tested|research objective|\bbenchmark\b|you are an (engineer|surveyor|explorer|broker)|the world remembers|welcome, agent/i;

const FORBIDDEN = ORIENTATION_THESIS_RE;

function entityLabel(e: LiveEntity): string {
  return String(e.label || "infrastructure").replace(/-/g, " ").trim();
}

/** First live strain fact, or undefined when the room is quiet. */
export function liveStrainLine(
  condition?: string,
  entities?: LiveEntity[],
  reportLines?: string[],
): string | undefined {
  const worn = (entities || []).find((e) => typeof e.condition === "number" && e.condition < SITUATION_STRAIN_BELOW);
  if (worn) return `${entityLabel(worn)} condition ${worn.condition}.`;
  const empty = (entities || []).find((e) => e.harvestable && e.stock_amount === 0);
  if (empty) return `${entityLabel(empty)} stock 0.`;
  const report = (reportLines || []).map((l) => String(l || "").trim()).find(Boolean);
  if (report) return report;
  void condition;
  return undefined;
}

export function situationFromLive(input: {
  name?: string;
  condition?: string;
  entities?: LiveEntity[];
  report_lines?: string[];
}): Situation | undefined {
  const place = String(input.name || "").trim();
  if (!place) return undefined;
  let strain = liveStrainLine(input.condition, input.entities, input.report_lines);
  if (strain && FORBIDDEN.test(strain)) strain = undefined;
  return strain ? { place, strain } : { place };
}
