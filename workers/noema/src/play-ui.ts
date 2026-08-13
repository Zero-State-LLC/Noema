/**
 * Pure PLAY presentation helpers — testable without DOM.
 * Hosted action parity: Specs-aligned parser adapter + presentation.
 */

import {
  helpText,
  humanizeActionError,
  parseHumanCommand,
} from "./actions";

export type ExitObs = {
  direction: string;
  to_room_id: string;
  to_room_name?: string;
};

export type EntityObs = {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  repairable?: boolean;
  harvestable?: boolean;
  stock_resource?: string;
  stock_amount?: number;
};

export type LocationObs = {
  room_id: string;
  name: string;
  description: string;
  exits: ExitObs[];
  entities: EntityObs[];
  condition?: string;
};

export type Opportunity = {
  id: string;
  text: string;
  actionLabel: string;
  /** Command line that runs the same backend path as the button */
  cmd: string;
  priority: number;
};

export type ContextualAction = {
  label: string;
  cmd: string;
  kind: "primary" | "secondary" | "move" | "utility";
};

export type TrailKind = "you" | "local" | "world" | "fail";

export type TrailItem = {
  kind: TrailKind;
  title: string;
  detail?: string;
};

/** Hosted Tier 1 + navigation (Player Action Map). */
export const HOSTED_ACTIONS = [
  "ENTER_WORLD",
  "LOOK",
  "MOVE",
  "INSPECT",
  "WAIT",
  "OBSERVE",
  "MESSAGE",
  "TRADE",
  "HARVEST",
  "REPAIR",
] as const;

/** Not yet on hosted Worker (Tier 2/3). */
export const BACKEND_GAPS = [
  "ORG_CREATE",
  "ORG_MEMBER_ADD",
  "ORG_MEMBER_REMOVE",
  "CONTEST_DECLARE",
  "CONTEST_DEFEND",
  "AGREEMENT_FORM",
  "AGREEMENT_TERMINATE",
  "ACCESS_POLICY",
] as const;

const DIR_ARROW: Record<string, string> = {
  north: "↑",
  south: "↓",
  east: "→",
  west: "←",
  up: "↑",
  down: "↓",
  n: "↑",
  s: "↓",
  e: "→",
  w: "←",
};

export function titleCaseLabel(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function entityKindPhrase(entity_type: string): string {
  const t = (entity_type || "").toUpperCase();
  if (t === "INFRASTRUCTURE") return "infrastructure";
  if (t === "RUIN") return "ruin";
  if (t === "ARTIFACT") return "artifact";
  if (t === "INSTITUTION" || t === "ORG") return "organization mark";
  if (t === "RESOURCE") return "resource site";
  return "object";
}

export function entityConditionGlyph(label: string, entity_type: string): string {
  const s = `${label} ${entity_type}`.toLowerCase();
  if (/scar|damag|fail|broken|ruin|ghost|dead/.test(s)) return "◐";
  if (/unknown|fragment|partial|incomplete/.test(s)) return "?";
  if (/market|board|compact|active|post/.test(s)) return "●";
  return "●";
}

export function entityConditionText(label: string, entity_type: string): string {
  const s = `${label} ${entity_type}`.toLowerCase();
  if (/scar|damag|broken/.test(s)) return "damaged";
  if (/fail|ruin|dead/.test(s)) return "ruined";
  if (/ghost|partial|fragment|incomplete/.test(s)) return "partial / incomplete";
  if (/market|board|post/.test(s)) return "trade access present";
  if (entity_type === "ARTIFACT") return "surviving record";
  if (entity_type === "INFRASTRUCTURE") return "present";
  return "present";
}

/** Local condition line derived from room text + entities (no invented lore). */
export function deriveLocalCondition(loc: LocationObs): string {
  if (loc.condition) return loc.condition;
  const blob = `${loc.description} ${loc.entities.map((e) => e.label).join(" ")}`.toLowerCase();
  const bits: string[] = [];
  if (/scar|damag|broken|fail/.test(blob)) bits.push("Local infrastructure shows damage.");
  if (/trade|market|exchange|bond/.test(blob)) bits.push("Trade structures are nearby.");
  if (/archive|ledger|record/.test(blob)) bits.push("A surviving record is nearby.");
  if (/route|ghost|thin|spindle|link/.test(blob)) bits.push("Routes continue outward.");
  if (!bits.length) {
    if (loc.entities.length) bits.push("Objects here can be inspected.");
    else bits.push("Open ground — exits are your next information.");
  }
  return bits.slice(0, 2).join(" ");
}

export function deriveOpportunities(loc: LocationObs): Opportunity[] {
  const out: Opportunity[] = [];
  for (const e of loc.entities || []) {
    const name = titleCaseLabel(e.label);
    const cond = entityConditionText(e.label, e.entity_type);
    const inspectCmd = `inspect ${e.label}`;
    if (e.repairable || /scar|damag|broken|fail|ruin/i.test(`${e.label} ${e.entity_type}`)) {
      out.push({
        id: `opp-${e.entity_id}-dmg`,
        text: `${name} looks ${cond}${e.condition != null ? ` (${e.condition}%)` : ""}.`,
        actionLabel: e.repairable !== false ? `Repair ${name}` : `Inspect ${name}`,
        cmd: e.repairable !== false ? `repair ${e.label}` : inspectCmd,
        priority: 10,
      });
    } else if (e.harvestable || (e.stock_amount != null && e.stock_amount > 0)) {
      out.push({
        id: `opp-${e.entity_id}-harv`,
        text: `${name} has ${e.stock_amount ?? "?"} ${e.stock_resource || "resource"} available.`,
        actionLabel: `Harvest ${name}`,
        cmd: `harvest ${e.label}`,
        priority: 9,
      });
    } else if (/market|board|post|trade/i.test(e.label)) {
      out.push({
        id: `opp-${e.entity_id}-trade`,
        text: `${name} — trade access may be reachable here.`,
        actionLabel: `Inspect ${name}`,
        cmd: inspectCmd,
        priority: 8,
      });
    } else if (e.entity_type === "ARTIFACT" || /ledger|archive|record/i.test(e.label)) {
      out.push({
        id: `opp-${e.entity_id}-art`,
        text: `${name} is a surviving record.`,
        actionLabel: `Inspect ${name}`,
        cmd: inspectCmd,
        priority: 9,
      });
    } else {
      out.push({
        id: `opp-${e.entity_id}`,
        text: `${name} is here (${cond}).`,
        actionLabel: `Inspect ${name}`,
        cmd: inspectCmd,
        priority: 5,
      });
    }
  }
  for (const x of loc.exits || []) {
    const dest = x.to_room_name || titleCaseLabel(x.to_room_id.replace(/^room\./, ""));
    out.push({
      id: `opp-exit-${x.direction}`,
      text: `A route leads ${x.direction} toward ${dest}.`,
      actionLabel: `Move ${x.direction}`,
      cmd: `move ${x.direction}`,
      priority: 3,
    });
  }
  out.sort((a, b) => b.priority - a.priority);
  // Cap for clarity
  return out.slice(0, 6);
}

export function contextualActionsForEntity(e: EntityObs): ContextualAction[] {
  const label = titleCaseLabel(e.label);
  const acts: ContextualAction[] = [
    { label: `Inspect ${label}`, cmd: `inspect ${e.label}`, kind: "primary" },
  ];
  if (e.repairable || (e.condition != null && e.condition < 100 && e.entity_type !== "ARTIFACT")) {
    acts.push({ label: `Repair ${label}`, cmd: `repair ${e.label}`, kind: "primary" });
  }
  if (e.harvestable || (e.stock_amount != null && e.stock_amount > 0)) {
    acts.push({ label: `Harvest ${label}`, cmd: `harvest ${e.label}`, kind: "secondary" });
  }
  return acts;
}

export function contextualActionsForLocation(loc: LocationObs): ContextualAction[] {
  const acts: ContextualAction[] = [];
  // Primary: first entity inspect or first opportunity
  const ents = loc.entities || [];
  if (ents[0]) {
    acts.push({
      label: `Inspect ${titleCaseLabel(ents[0].label)}`,
      cmd: `inspect ${ents[0].label}`,
      kind: "primary",
    });
  }
  for (const e of ents.slice(1, 3)) {
    acts.push({
      label: `Inspect ${titleCaseLabel(e.label)}`,
      cmd: `inspect ${e.label}`,
      kind: "secondary",
    });
  }
  for (const x of loc.exits || []) {
    const dest = x.to_room_name || x.direction;
    acts.push({
      label: `${(DIR_ARROW[x.direction] || "·") + " "}Move ${x.direction}`.trim(),
      cmd: `move ${x.direction}`,
      kind: "move",
    });
    void dest;
  }
  acts.push({ label: "Look around", cmd: "look", kind: "utility" });
  acts.push({ label: "Wait", cmd: "wait", kind: "utility" });
  return acts;
}

/** Match free-text target to a visible entity (label, title case, or id). */
export function resolveEntityTarget(
  raw: string,
  entities: EntityObs[],
): { entity_id: string; label: string } | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  for (const e of entities) {
    if (e.entity_id.toLowerCase() === t) return { entity_id: e.entity_id, label: e.label };
    if (e.label.toLowerCase() === t) return { entity_id: e.entity_id, label: e.label };
    if (titleCaseLabel(e.label).toLowerCase() === t) return { entity_id: e.entity_id, label: e.label };
    // partial: "relay trunk" matches "scarred-conduit" only if words overlap? Prefer loose contains on label words
    const lab = e.label.toLowerCase().replace(/[_-]+/g, " ");
    if (lab.includes(t) || t.includes(lab)) return { entity_id: e.entity_id, label: e.label };
    // word overlap
    const tw = new Set(t.split(" ").filter(Boolean));
    const lw = lab.split(" ").filter(Boolean);
    if (lw.some((w) => tw.has(w) && w.length > 2)) return { entity_id: e.entity_id, label: e.label };
  }
  return null;
}

export type ParsedCommand =
  | { ok: true; command: string; arguments: Record<string, unknown>; display: string }
  | { ok: false; error: string; code?: string; choices?: string[] };

/** Adapter: human line → wire command for /v1/command (same path as GUI). */
export function parsePlayCommand(line: string, entities: EntityObs[] = []): ParsedCommand {
  const r = parseHumanCommand(line, {
    entities: entities.map((e) => ({
      entity_id: e.entity_id,
      label: e.label,
      entity_type: e.entity_type,
      condition: e.condition,
      stock_resource: e.stock_resource,
      stock_amount: e.stock_amount,
    })),
  });
  if (!r.ok) {
    if (r.code === "HELP") {
      return { ok: false, error: helpText(r.choices?.[0]), code: "HELP" };
    }
    return { ok: false, error: r.error, code: r.code, choices: r.choices };
  }
  const a = r.action;
  return {
    ok: true,
    command: a.verb,
    arguments: a.arguments as Record<string, unknown>,
    display: r.display,
  };
}

export function humanizeError(code?: string, message?: string): { primary: string; advanced?: string } {
  if (code === "NOT_AUTHORIZED" || code === "UNAUTHORIZED") {
    return { primary: "You need a session to act here.", advanced: `${code}: ${message || ""}` };
  }
  return humanizeActionError(code, message);
}

export function trailFromResult(opts: {
  display: string;
  command: string;
  ok: boolean;
  events?: Array<{ event_type?: string; sequence?: number }>;
  observation?: { location?: LocationObs };
  previousRoomId?: string;
  errorPrimary?: string;
}): TrailItem[] {
  if (!opts.ok) {
    return [{ kind: "fail", title: opts.errorPrimary || "Action failed." }];
  }
  const items: TrailItem[] = [{ kind: "you", title: opts.display }];
  const cmd = opts.command.toUpperCase();
  const loc = opts.observation?.location;
  if (cmd === "MOVE" && loc) {
    items.push({
      kind: "local",
      title: `You arrive at ${loc.name}.`,
      detail: loc.description?.slice(0, 160),
    });
  } else if (cmd === "INSPECT" && loc) {
    // description may have been augmented with inspect prose
    const desc = loc.description || "";
    const inspectBit = desc.includes("You inspect")
      ? desc.split("You inspect").slice(1).join("You inspect").trim()
      : "";
    items.push({
      kind: "local",
      title: inspectBit
        ? `You learn more: ${inspectBit.slice(0, 180)}`
        : "Closer look — details become clearer.",
    });
  } else if (cmd === "LOOK" && loc) {
    items.push({
      kind: "local",
      title: `${loc.name} is clear to you now.`,
    });
  } else if (cmd === "WAIT") {
    items.push({ kind: "world", title: "Time passes." });
  } else if (cmd === "ENTER_WORLD" && loc) {
    items.push({
      kind: "local",
      title: `You stand in ${loc.name}.`,
      detail: loc.description?.slice(0, 160),
    });
  }
  return items;
}

/** ASCII-ish local route diagram from exits (plain text). */
export function routeDiagram(
  hereName: string,
  exits: ExitObs[],
): { lines: string[]; hasRoutes: boolean } {
  if (!exits?.length) return { lines: [], hasRoutes: false };
  const byDir: Record<string, string> = {};
  for (const x of exits) {
    const dest = x.to_room_name || titleCaseLabel(x.to_room_id.replace(/^room\./, ""));
    byDir[x.direction.toLowerCase()] = dest;
  }
  const n = byDir.north || byDir.up || byDir.n;
  const s = byDir.south || byDir.down || byDir.s;
  const e = byDir.east || byDir.e;
  const w = byDir.west || byDir.w;
  const lines: string[] = [];
  if (n) {
    lines.push(`        ${n}`);
    lines.push("           ↑");
  }
  const left = w || "";
  const right = e || "";
  const mid = `YOU · ${hereName}`;
  if (left || right) {
    const L = left ? `${left} ← ` : "        ";
    const R = right ? ` → ${right}` : "";
    lines.push(`${L}${mid}${R}`);
  } else {
    lines.push(`        ${mid}`);
  }
  if (s) {
    lines.push("           ↓");
    lines.push(`        ${s}`);
  }
  // Any non cardinal
  for (const [dir, dest] of Object.entries(byDir)) {
    if (["north", "south", "east", "west", "up", "down", "n", "s", "e", "w"].includes(dir)) continue;
    lines.push(`${dir} → ${dest}`);
  }
  return { lines, hasRoutes: lines.length > 0 };
}

export function statusFromObservation(obs: {
  cycle?: number;
  sequence?: number;
  location?: LocationObs;
  world_name?: string;
} | null): Array<{ label: string; value: string }> {
  if (!obs?.location) return [];
  const loc = obs.location;
  const rows: Array<{ label: string; value: string }> = [];
  if (obs.world_name) rows.push({ label: "World", value: obs.world_name });
  rows.push({ label: "Place", value: loc.name });
  rows.push({ label: "Exits", value: String(loc.exits?.length ?? 0) });
  rows.push({ label: "Nearby", value: String(loc.entities?.length ?? 0) });
  // Only include cycle if meaningful — hide raw sequence from normal status
  if (typeof obs.cycle === "number") rows.push({ label: "Time", value: `cycle ${obs.cycle}` });
  return rows;
}

/** Redaction check helper for tests */
export function containsHiddenHistory(text: string): boolean {
  const forbidden = [
    "OLD_TRADE_NETWORK",
    "LOST_ARCHIVE",
    "FRACTURED_OLD_WORLD",
    "world_seed",
    "PlayerPrincipal",
    "ADMIN_OPERATOR",
    "17011984",
  ];
  return forbidden.some((f) => text.includes(f));
}
