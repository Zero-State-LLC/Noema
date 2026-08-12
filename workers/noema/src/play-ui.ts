/**
 * Pure PLAY presentation helpers — testable without DOM.
 * Surfaces only hosted-supported actions; no new mechanics.
 */

export type ExitObs = {
  direction: string;
  to_room_id: string;
  to_room_name?: string;
};

export type EntityObs = {
  entity_id: string;
  label: string;
  entity_type: string;
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

/** Hosted Worker supported commands (Stage 0). */
export const HOSTED_ACTIONS = ["ENTER_WORLD", "LOOK", "MOVE", "INSPECT", "WAIT", "OBSERVE"] as const;

/** Canonical verbs present in Python Core but not hosted Worker. */
export const BACKEND_GAPS = [
  "MESSAGE",
  "TRADE_PROPOSE",
  "TRADE_ACCEPT",
  "TRADE_REJECT",
  "ORG_CREATE",
  "HARVEST",
  "REPAIR",
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
    if (/scar|damag|broken|fail|ruin/i.test(`${e.label} ${e.entity_type}`)) {
      out.push({
        id: `opp-${e.entity_id}-dmg`,
        text: `${name} looks ${cond}.`,
        actionLabel: `Inspect ${name}`,
        cmd: inspectCmd,
        priority: 10,
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
  // Only hosted actions
  return [
    {
      label: `Inspect ${label}`,
      cmd: `inspect ${e.label}`,
      kind: "primary",
    },
  ];
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
  | { ok: false; error: string };

export function parsePlayCommand(line: string, entities: EntityObs[] = []): ParsedCommand {
  const parts = line.trim().split(/\s+/);
  const v = (parts.shift() || "").toLowerCase();
  if (!v) return { ok: false, error: "Type a command, or use an action below." };

  if (v === "look" || v === "l") {
    return { ok: true, command: "LOOK", arguments: {}, display: "You look around." };
  }
  if (v === "wait") {
    return { ok: true, command: "WAIT", arguments: {}, display: "You wait a moment." };
  }
  if (v === "observe") {
    return { ok: true, command: "OBSERVE", arguments: {}, display: "You observe carefully." };
  }
  if (v === "enter") {
    return { ok: true, command: "ENTER_WORLD", arguments: {}, display: "You enter the world." };
  }
  if (v === "move" || v === "go") {
    const dir = (parts[0] || "").toLowerCase();
    if (!dir) return { ok: false, error: "Move where? Try: move east" };
    return {
      ok: true,
      command: "MOVE",
      arguments: { direction: dir },
      display: `You move ${dir}.`,
    };
  }
  if (v === "inspect" || v === "examine" || v === "x") {
    const raw = parts.join(" ");
    if (!raw) return { ok: false, error: "Inspect what? Click an object or type its name." };
    const resolved = resolveEntityTarget(raw, entities);
    if (resolved) {
      return {
        ok: true,
        command: "INSPECT",
        arguments: { entity_id: resolved.entity_id },
        display: `You inspect ${titleCaseLabel(resolved.label)}.`,
      };
    }
    // Pass through — backend may match label
    return {
      ok: true,
      command: "INSPECT",
      arguments: { entity_id: raw },
      display: `You try to inspect ${raw}.`,
    };
  }

  // Unsupported strategic verbs → honest gap, not silent fail
  if (["repair", "harvest", "trade", "message", "org", "create"].includes(v)) {
    return {
      ok: false,
      error: `“${v}” is not available in this stage of the world yet. You can look, move, inspect, or wait.`,
    };
  }

  return {
    ok: false,
    error: `Unknown command “${v}”. Try look, move, inspect, or wait.`,
  };
}

export function humanizeError(code?: string, message?: string): { primary: string; advanced?: string } {
  const c = (code || "").toUpperCase();
  const m = message || "That did not work.";
  if (c === "MOVE_REJECTED") {
    return {
      primary: "You cannot go that way from here.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "INSPECT_FAILED") {
    return {
      primary: "You do not see that here.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "NOT_IN_WORLD") {
    return {
      primary: "Enter the world first.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "NOT_AUTHORIZED" || c === "UNAUTHORIZED") {
    return {
      primary: "You need a session to act here.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "UNKNOWN_COMMAND") {
    return {
      primary: "That action is not available here yet.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "PRECONDITION_FAILED") {
    return {
      primary: "You cannot do that yet.",
      advanced: `${c}: ${m}`,
    };
  }
  // Prefer human message when it already is readable
  if (m && !/^[A-Z_]+$/.test(m)) {
    return { primary: m, advanced: c || undefined };
  }
  return { primary: "Something blocked that action.", advanced: c ? `${c}: ${m}` : m };
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
