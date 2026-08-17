/**
 * Observation → player-facing view. No invented Pressure / Population / Trade Index.
 */
import { label } from "./terms";

export type PlayerStatusRow = { label: string; value: string };

export type PlayerAction = { label: string; cmd: string; available: boolean };

export type PlayerWorldView = {
  worldName: string;
  cycle: number | null;
  cycleLabel: string;
  locationName: string;
  locationDescription: string;
  condition: string;
  cultureLine: string;
  relayIntegrity: number | null;
  strip: PlayerStatusRow[];
  signals: string[];
  actions: PlayerAction[];
  status: PlayerStatusRow[];
};

type ViewObs = {
  cycle?: number;
  sequence?: number;
  world_name?: string;
  in_world?: boolean;
  location?: {
    name?: string;
    description?: string;
    condition?: string;
    exits?: unknown[];
    entities?: Array<{
      label?: string;
      entity_type?: string;
      condition?: number;
    }>;
  };
  budgets?: {
    attention?: number;
    compute?: number;
    energy?: number;
    influence?: number;
    storage?: number;
  };
  messages?: unknown[];
  trades?: unknown[];
  organizations?: unknown[];
  players_here?: unknown[];
  practice_lines?: string[];
  lot_lines?: string[];
  social_memory_lines?: string[];
  culture_lines?: string[];
  discovery_lines?: string[];
  report_lines?: string[];
  affordances?: Array<{
    label?: string;
    cmd?: string;
    available?: boolean;
  }>;
} | null;

export function toPlayerView(obs: ViewObs): PlayerWorldView {
  const empty: PlayerWorldView = {
    worldName: "",
    cycle: null,
    cycleLabel: "",
    locationName: "",
    locationDescription: "",
    condition: "",
    cultureLine: "",
    relayIntegrity: null,
    strip: [],
    signals: [],
    actions: [],
    status: [],
  };
  if (!obs?.location) return empty;

  const loc = obs.location;
  const cycle = typeof obs.cycle === "number" ? obs.cycle : null;
  let relayIntegrity: number | null = null;
  const ents = loc.entities || [];
  const relays = ents.filter((e) => {
    const t = String(e.entity_type || "").toUpperCase();
    const lab = String(e.label || "").toLowerCase();
    return t === "INFRASTRUCTURE" && /relay|conduit|trunk/.test(lab) && typeof e.condition === "number";
  });
  const infra = relays.length
    ? relays
    : ents.filter((e) => String(e.entity_type || "").toUpperCase() === "INFRASTRUCTURE" && typeof e.condition === "number");
  if (infra[0] && typeof infra[0].condition === "number") relayIntegrity = infra[0].condition;
  if (relayIntegrity === null) {
    for (const line of obs.report_lines || []) {
      const m = String(line).match(/condition\s+(\d+)\s*\.?$/i);
      if (m) {
        relayIntegrity = Number(m[1]);
        break;
      }
    }
  }
  const status: PlayerStatusRow[] = [];

  if (obs.world_name) status.push({ label: label("world"), value: obs.world_name });
  status.push({ label: label("place"), value: loc.name || "" });
  status.push({ label: "Exits", value: String(loc.exits?.length ?? 0) });
  status.push({ label: "Nearby", value: String(loc.entities?.length ?? 0) });
  if (cycle !== null) status.push({ label: label("cycle"), value: String(cycle) });
  if (relayIntegrity !== null) {
    status.push({ label: label("relay_integrity"), value: `${relayIntegrity}%` });
  }
  for (const line of (obs.practice_lines || []).slice(0, 3)) {
    if (line) status.push({ label: label("work"), value: line });
  }
  for (const line of (obs.lot_lines || []).slice(0, 4)) {
    if (line) status.push({ label: label("lot"), value: line });
  }
  for (const line of (obs.social_memory_lines || []).slice(0, 3)) {
    if (line) status.push({ label: label("tie"), value: line });
  }
  for (const line of (obs.discovery_lines || []).slice(0, 1)) {
    if (line) status.push({ label: label("record"), value: line });
  }
  for (const line of (obs.report_lines || []).slice(0, 4)) {
    if (line) status.push({ label: label("world"), value: line });
  }
  if (obs.budgets) {
    if (obs.budgets.energy !== undefined) status.push({ label: "Energy", value: String(obs.budgets.energy) });
    if (obs.budgets.compute !== undefined) status.push({ label: "Compute", value: String(obs.budgets.compute) });
    if (obs.budgets.storage !== undefined) status.push({ label: "Storage", value: String(obs.budgets.storage) });
    if (obs.budgets.attention !== undefined) status.push({ label: "Attention", value: String(obs.budgets.attention) });
    if (obs.budgets.influence !== undefined) status.push({ label: "Influence", value: String(obs.budgets.influence) });
  }
  status.push({ label: label("messages"), value: String((obs.messages || []).length) });
  status.push({ label: label("trades"), value: String((obs.trades || []).length) });
  status.push({ label: label("organizations"), value: String((obs.organizations || []).length) });
  if (obs.players_here) {
    status.push({ label: label("here"), value: String(obs.players_here.length) });
  }

  const condition = String(loc.condition || "").trim();
  const strip: PlayerStatusRow[] = [];
  if (obs.world_name) strip.push({ label: label("world"), value: obs.world_name });
  if (loc.name) strip.push({ label: label("place"), value: loc.name });
  if (cycle !== null) strip.push({ label: label("cycle"), value: String(cycle) });
  if (relayIntegrity !== null) strip.push({ label: label("relay_integrity"), value: `${relayIntegrity}%` });
  if (condition) strip.push({ label: "Local", value: condition });
  if (obs.players_here) strip.push({ label: label("here"), value: String(obs.players_here.length) });

  const signals = (obs.report_lines || []).map((l) => String(l || "").trim()).filter(Boolean).slice(0, 6);

  const actions: PlayerAction[] = [];
  for (const a of obs.affordances || []) {
    if (a.available === false) continue;
    const cmd = String(a.cmd || "").trim();
    const lab = String(a.label || "").trim();
    if (!cmd || !lab) continue;
    actions.push({ label: lab, cmd, available: true });
    if (actions.length >= 8) break;
  }

  return {
    worldName: obs.world_name || "",
    cycle,
    cycleLabel: cycle === null ? "" : `${label("cycle")} ${cycle}`,
    locationName: loc.name || "",
    locationDescription: loc.description || "",
    condition,
    cultureLine: (obs.culture_lines && obs.culture_lines[0]) || "",
    relayIntegrity,
    strip,
    signals,
    actions,
    status,
  };
}
