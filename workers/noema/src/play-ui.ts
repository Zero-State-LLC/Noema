/**
 * Pure PLAY presentation helpers — testable without DOM.
 * Hosted action parity: Specs-aligned parser adapter + presentation.
 */

import { helpText, parseHumanCommand } from "./actions";
import { glyphEl, glyphForEntity, glyphForLine, glyphMeta } from "./presentation/glyphs";
import { toPlayerView } from "./presentation/player-view";
import { label } from "./presentation/terms";

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
  services?: Array<{
    service_id: string;
    display_name: string;
    role: string;
    status: string;
    operations?: string[];
    cannot?: string[];
    line?: string;
    suggested_cmds?: string[];
  }>;
};

export type PlayerHere = {
  player_id: string;
  handle?: string;
  public_practice_lines?: string[];
};

export type MailItem = {
  message_id: string;
  sender_id: string;
  text: string;
  delivered_cycle: number;
};

export type TradeItem = {
  trade_id: string;
  proposer_id: string;
  counterparty_id: string;
  offered: Record<string, number>;
  requested: Record<string, number>;
  status: string;
  role: "proposer" | "counterparty";
};

export type OrgItem = {
  org_id: string;
  name: string;
  charter?: string;
  status: string;
  my_role: string | null;
  offices?: Array<{
    office_id: string;
    display_name: string;
    status: string;
    holder_handle?: string;
  }>;
  public_notice?: string;
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
  "LEAVE_WORLD",
  "LOOK",
  "MOVE",
  "INSPECT",
  "WAIT",
  "OBSERVE",
  "MESSAGE",
  "TRADE",
  "HARVEST",
  "REPAIR",
  "ORG_CREATE",
  "ORG_MEMBER_ADD",
  "ORG_MEMBER_REMOVE",
] as const;

/** v0.2 strategic — not hosted yet. */
export const BACKEND_GAPS = [] as const;

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
  if (loc.condition) return String(loc.condition);
  const ents = loc.entities || [];
  const blob = `${loc.description || ""} ${ents.map((e) => e.label || "").join(" ")}`.toLowerCase();
  const bits: string[] = [];
  if (/scar|damag|broken|fail/.test(blob)) bits.push("Local infrastructure shows damage.");
  if (/trade|market|exchange|bond/.test(blob)) bits.push("Trade structures are nearby.");
  if (/archive|ledger|record/.test(blob)) bits.push("A surviving record is nearby.");
  if (/route|ghost|thin|spindle|link/.test(blob)) bits.push("Routes continue outward.");
  if (!bits.length) {
    if (ents.length) bits.push("Objects here can be inspected.");
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
    const dest = x.to_room_name || titleCaseLabel(String(x.to_room_id || "").replace(/^room\./, "") || x.direction || "ahead");
    out.push({
      id: `opp-exit-${x.direction}`,
      text: `A route leads ${x.direction} toward ${dest}.`,
      actionLabel: `Move ${x.direction}`,
      cmd: `move ${x.direction}`,
      priority: 3,
    });
  }
  for (const s of loc.services || []) {
    if (String(s.status || "").toUpperCase() === "UNAVAILABLE") continue;
    out.push({
      id: `opp-svc-${s.service_id}`,
      text: `${s.display_name} desk — ${s.role} [${s.status}].`,
      actionLabel: `Talk ${s.display_name}`,
      cmd: `talk ${s.display_name.toLowerCase()}`,
      priority: 7,
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
  const c = (code || "").toUpperCase();
  const m = message || "That did not work.";
  if (c === "NOT_AUTHORIZED" || c === "UNAUTHORIZED") {
    return { primary: "You need a session to act here.", advanced: `${c}: ${m}` };
  }
  if (c === "WORLD_PAUSED") {
    return { primary: "The world is paused for maintenance. You can look, but actions that change it are blocked.", advanced: `${c}: ${m}` };
  }
  if (c === "WORLD_INCIDENT") {
    return { primary: "The world is in incident. Mutation is blocked until an operator restores it.", advanced: `${c}: ${m}` };
  }
  if (c === "SETTLEMENT_BLOCKED") {
    return { primary: "Play is blocked until settlement recovers. Looking still works.", advanced: `${c}: ${m}` };
  }
  if (c === "WORLD_NOT_READY") {
    return { primary: "The world is not ready to enter yet.", advanced: `${c}: ${m}` };
  }
  if (c === "COMMAND_FAILED") {
    return { primary: m && m !== "internal error" ? m : "The world could not apply that action.", advanced: `${c}: ${m}` };
  }
  if (c === "INTERNAL") {
    return {
      primary: "The world could not apply that action.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "BUDGET_EXCEEDED") return { primary: "You do not have enough resources for that.", advanced: `${c}: ${m}` };
  if (c === "FORBIDDEN") return { primary: "You do not have authority to do that.", advanced: `${c}: ${m}` };
  if (c === "AUTHORITY_CONFLICT") {
    return {
      primary:
        "Another office already has precedence over that object. Create with object_set=… and precedence=append|lead.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "AMBIGUOUS_TARGET") return { primary: m, advanced: c };
  if (c === "MOVE_REJECTED") return { primary: "You cannot go that way from here.", advanced: `${c}: ${m}` };
  if (c === "INSPECT_FAILED" || c === "NOT_FOUND") {
    return { primary: m.includes("see") ? m : "You do not see that here.", advanced: `${c}: ${m}` };
  }
  if (c === "NOT_IN_WORLD") return { primary: "Enter the world first.", advanced: `${c}: ${m}` };
  if (c === "UNKNOWN_COMMAND") return { primary: "That action is not available here yet.", advanced: `${c}: ${m}` };
  if (c === "TRADE_CAUTION") {
    return {
      primary: "You proceed with caution toward that counterparty. It costs one extra compute.",
      advanced: `${c}: ${m}`,
    };
  }
  if (c === "TRADE_REJECTED" || c === "TRADE_FAILED") return { primary: m, advanced: c };
  if (m && !/^[A-Z_]+$/.test(m)) return { primary: m, advanced: c || undefined };
  return { primary: "Something blocked that action.", advanced: c ? `${c}: ${m}` : m };
}

/** WHERE / mast copy when the snapshot has no location or attach failed. */
export function waitingCopy(opts: {
  code?: string;
  message?: string;
  worldName?: string;
}): { worldLine: string; roomDesc: string } {
  const worldLine = String(opts.worldName || "").trim() || "—";
  if (opts.code || opts.message) {
    return { worldLine, roomDesc: humanizeError(opts.code, opts.message).primary };
  }
  return { worldLine, roomDesc: "Waiting for the world." };
}

export function trailFromResult(opts: {
  display: string;
  command: string;
  ok: boolean;
  events?: Array<{ event_type?: string; sequence?: number }>;
  observation?: { location?: LocationObs; report_lines?: string[] };
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
  } else if (cmd === "LEAVE_WORLD") {
    items.push({ kind: "world", title: "You leave the world." });
  } else if (cmd === "MESSAGE") {
    items.push({ kind: "world", title: "A message is delivered." });
  } else if (cmd === "TRADE") {
    items.push({ kind: "world", title: "A trade changes hands." });
  }
  for (const line of (opts.observation?.report_lines || []).slice(0, 4)) {
    if (line) items.push({ kind: "world", title: line });
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
    const dest = x.to_room_name || titleCaseLabel(String(x.to_room_id || "").replace(/^room\./, "") || x.direction || "ahead");
    const dir = String(x.direction || "").toLowerCase();
    if (!dir) continue;
    byDir[dir] = dest;
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
  practice_lines?: string[];
  lot_lines?: string[];
  social_memory_lines?: string[];
  culture_lines?: string[];
  discovery_lines?: string[];
  report_lines?: string[];
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
} | null): Array<{ label: string; value: string }> {
  return toPlayerView(obs).status;
}

export function escHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export function renderLookHtml(opts: {
  name?: string;
  description?: string;
  condition?: string;
  exitsLine?: string;
  cultureLine?: string;
}): string {
  const name = escHtml(opts.name || "");
  const desc = escHtml(opts.description || "");
  const cond = String(opts.condition || "").trim();
  const exits = String(opts.exitsLine || "").trim();
  const culture = String(opts.cultureLine || "").trim();
  return (
    '<p class="where role-place">WHERE</p>' +
    '<h2 id="room-name">' + name + "</h2>" +
    '<p id="room-desc">' + desc + "</p>" +
    (cond
      ? '<div id="loc-cond"><b class="role-place">CONDITION</b><span id="loc-cond-text">' +
        escHtml(cond) +
        "</span></div>"
      : '<div id="loc-cond" hidden><b class="role-place">CONDITION</b><span id="loc-cond-text"></span></div>') +
    (culture
      ? '<p id="loc-custom">' + escHtml(culture) + "</p>"
      : '<p id="loc-custom" hidden></p>') +
    (exits
      ? '<p id="look-exits">exits: ' + escHtml(exits) + "</p>"
      : '<p id="look-exits" hidden></p>')
  );
}

export function renderTrailHtml(items: TrailItem[]): string {
  if (!items.length) return "";
  const label: Record<TrailKind, string> = {
    you: "YOU",
    local: "LOCAL",
    world: "WORLD",
    fail: "FAIL",
  };
  const role: Record<TrailKind, string> = {
    you: "role-you",
    local: "role-here",
    world: "",
    fail: "role-fail",
  };
  return items
    .map((t) => {
      const k = t.kind;
      const detail = t.detail
        ? '<span class="d">' + escHtml(t.detail) + "</span>"
        : "";
      return (
        "<li><span class=\"k " +
        k +
        (role[k] ? " " + role[k] : "") +
        '">' +
        label[k] +
        '</span><span class="t">' +
        escHtml(t.title) +
        detail +
        "</span></li>"
      );
    })
    .join("");
}

export function playerHandle(p: { player_id?: string; handle?: string; sender_id?: string }): string {
  return String(p.handle || p.player_id || p.sender_id || "player").replace(/^player\./, "");
}

export function formatResourceMap(m?: Record<string, number> | null): string {
  const entries = Object.entries(m || {}).filter(([, n]) => n);
  if (!entries.length) return "nothing";
  return entries.map(([k, n]) => n + " " + k).join(", ");
}

export function renderPlayersHereHtml(
  players?: PlayerHere[] | null,
  orgs?: OrgItem[] | null,
  selfId?: string,
): string {
  if (!players || !players.length) return "";
  const officerOrgs = (orgs || []).filter((o) => {
    const role = String(o.my_role || "").toLowerCase();
    return role === "founder" || role === "officer";
  });
  const rows = players
    .map((p) => {
      const handle = playerHandle(p);
      const name = escHtml(handle);
      const msgCmd = "message " + handle + ' "';
      const tradeCmd = "trade " + handle + " offer=";
      let extra = "";
      for (const o of officerOrgs) {
        extra +=
          ' <button type="button" class="role-here" data-cmd="invite ' +
          escHtml(handle) +
          " to " +
          escHtml(o.org_id) +
          ' role=member">invite ' +
          escHtml(o.name) +
          "</button>";
      }
      void selfId;
      const title = (p.public_practice_lines || []).find((line) => String(line || "").trim());
      const titleHtml = title ? ' <span class="d">' + escHtml(title) + "</span>" : "";
      return (
        '<li><button type="button" class="role-here" data-cmd="' +
        escHtml(msgCmd) +
        '" aria-label="Message ' +
        name +
        '">' +
        name +
        '</button> <button type="button" class="role-here" data-cmd="' +
        escHtml(tradeCmd) +
        '" aria-label="Trade ' +
        name +
        '">trade</button>' +
        extra +
        titleHtml +
        "</li>"
      );
    })
    .join("");
  return '<ul class="tok-list players-here" aria-label="Other players">' + rows + "</ul>";
}

export function renderBondsHtml(opts: {
  messages?: MailItem[] | null;
  trades?: TradeItem[] | null;
  organizations?: OrgItem[] | null;
}): string {
  const mail = opts.messages || [];
  const trades = opts.trades || [];
  const orgs = opts.organizations || [];
  const mailHtml = mail.length
    ? mail
        .slice()
        .reverse()
        .map((m) => {
          return (
            "<li><strong>" +
            escHtml(playerHandle({ player_id: m.sender_id })) +
            "</strong> · cycle " +
            escHtml(String(m.delivered_cycle)) +
            '<span class="d">' +
            escHtml(m.text) +
            "</span></li>"
          );
        })
        .join("")
    : '<li class="empty">No messages.</li>';
  const tradeHtml = trades.length
    ? trades
        .map((t) => {
          const label =
            formatResourceMap(t.offered) + " → " + formatResourceMap(t.requested);
          const acts =
            t.role === "counterparty"
              ? '<button type="button" class="role-here" data-cmd="accept ' +
                escHtml(t.trade_id) +
                '">accept</button> ' +
                '<button type="button" class="role-here" data-cmd="reject ' +
                escHtml(t.trade_id) +
                '">reject</button>'
              : '<button type="button" class="role-here" data-cmd="cancel ' +
                escHtml(t.trade_id) +
                '">cancel</button>';
          return (
            "<li>" +
            escHtml(label) +
            ' <span class="muted">' +
            escHtml(t.role) +
            "</span> " +
            acts +
            "</li>"
          );
        })
        .join("")
    : '<li class="empty">No open trades.</li>';
  const orgHtml = orgs.length
    ? orgs
        .map((o) => {
          const role = o.my_role || "not a member";
          const seats = (o.offices || [])
            .map((off) => {
              const who = off.status === "VACANT" ? "vacant" : off.holder_handle || "occupied";
              return escHtml(off.display_name) + " — " + escHtml(who);
            })
            .join("; ");
          const notice = o.public_notice ? ' · notice: "' + escHtml(o.public_notice) + '"' : "";
          return (
            "<li>" +
            escHtml(o.name) +
            ' <span class="muted">' +
            escHtml(role) +
            (seats ? " · " + seats : "") +
            notice +
            "</span></li>"
          );
        })
        .join("")
    : '<li class="empty">No public organizations.</li>';
  return (
    '<div class="bonds-block"><h4>Mail</h4><ul class="tok-list" aria-label="Mail">' +
    mailHtml +
    '</ul></div><div class="bonds-block"><h4>Open trades</h4><ul class="tok-list" aria-label="Open trades">' +
    tradeHtml +
    '</ul></div><div class="bonds-block"><h4>Organizations</h4><ul class="tok-list" aria-label="Organizations">' +
    orgHtml +
    '</ul><button type="button" class="role-here" data-cmd="form ">Form organization</button></div>'
  );
}

export function renderServiceDesksHtml(
  services?: LocationObs["services"] | null,
): string {
  if (!services || !services.length) return "";
  return (
    '<ul class="tok-list" aria-label="World Services">' +
    services
      .map((s) => {
        const unavailable = String(s.status || "").toUpperCase() === "UNAVAILABLE";
        const name = s.display_name || "Desk";
        const talkCmd = "talk " + String(name).toLowerCase();
        const talk = unavailable
          ? '<button type="button" class="role-here" disabled aria-disabled="true">Talk unavailable</button>'
          : '<button type="button" class="role-here" data-cmd="' +
            escHtml(talkCmd) +
            '">Talk ' +
            escHtml(name) +
            "</button>";
        const cannot = (s.cannot || [])
          .map((c) => "<li>" + escHtml(c) + "</li>")
          .join("");
        const cmds = (s.suggested_cmds || [])
          .map((c) => {
            return (
              ' <button type="button" class="role-here" data-cmd="' +
              escHtml(c) +
              '">' +
              escHtml(c) +
              "</button>"
            );
          })
          .join("");
        const sub = [s.status, s.role].filter(Boolean).join(" · ");
        return (
          "<li>" +
          escHtml(name) +
          (sub ? ' <span class="muted">' + escHtml(sub) + "</span>" : "") +
          (s.line ? ' <span class="muted">' + escHtml(s.line) + "</span>" : "") +
          (cannot
            ? ' <span class="muted">Cannot</span><ul>' + cannot + "</ul>"
            : "") +
          " " +
          talk +
          cmds +
          "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

export function renderExitTokensHtml(exits?: ExitObs[] | null): string {
  if (!exits || !exits.length) return "";
  return exits
    .map((x) => {
      const dest = x.to_room_name || titleCaseLabel(String(x.to_room_id || "").replace(/^room\./, "") || x.direction || "ahead");
      return (
        '<li><button type="button" class="role-here" data-cmd="move ' +
        escHtml(x.direction) +
        '">' +
        escHtml(x.direction) +
        "</button> <span class=\"muted\">" +
        escHtml(dest) +
        "</span></li>"
      );
    })
    .join("");
}

export function renderEntityListHtml(entities?: EntityObs[] | null): string {
  if (!entities || !entities.length) {
    return '<li class="empty">Nothing notable right here.</li>';
  }
  return entities
    .map((e) => {
      const name = titleCaseLabel(e.label);
      let sub = entityConditionText(e.label, e.entity_type) + " · " + entityKindPhrase(e.entity_type);
      if (e.condition != null) sub = "condition " + e.condition + "% · " + sub;
      if (e.harvestable && e.stock_amount != null) {
        sub = e.stock_amount + " " + (e.stock_resource || "resource") + " · " + sub;
      }
      return (
        '<li><button type="button" class="role-here" data-cmd="inspect ' +
        escHtml(e.label) +
        '">' +
        escHtml(name) +
        "</button> <span class=\"muted\">" +
        escHtml(sub) +
        "</span>" +
        (e.repairable
          ? ' <button type="button" class="role-here" data-cmd="repair ' +
            escHtml(e.label) +
            '">repair</button>'
          : "") +
        (e.harvestable
          ? ' <button type="button" class="role-here" data-cmd="harvest ' +
            escHtml(e.label) +
            '">harvest</button>'
          : "") +
        "</li>"
      );
    })
    .join("");
}

export function renderOpportunitiesHtml(loc: LocationObs): string {
  const opps = deriveOpportunities(loc);
  if (!opps.length) {
    return '<li class="empty">No clear local pressure — try looking or following a route.</li>';
  }
  return opps
    .map((o) => {
      return (
        '<li><button type="button" class="role-here" data-cmd="' +
        escHtml(o.cmd) +
        '">' +
        escHtml(o.actionLabel) +
        "</button> <span class=\"muted\">" +
        escHtml(o.text) +
        "</span></li>"
      );
    })
    .join("");
}

type DomNode = {
  className: string;
  type?: string;
  hidden?: boolean;
  disabled?: boolean;
  textContent: string;
  setAttribute(name: string, value: string): void;
  append(...nodes: unknown[]): void;
};

type DomRoot = {
  replaceChildren(...nodes: unknown[]): void;
  append(...nodes: unknown[]): void;
};

function pageDoc(): { createElement(tag: string): DomNode } {
  return (globalThis as unknown as { document: { createElement(tag: string): DomNode } }).document;
}

function h(tag: string, className?: string, text?: string): DomNode {
  const n = pageDoc().createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function cmdBtn(cmd: string, text: string, aria?: string): DomNode {
  const b = h("button", "role-here", text);
  b.type = "button";
  b.setAttribute("data-cmd", cmd);
  if (aria) b.setAttribute("aria-label", aria);
  return b;
}

export function fillTrail(el: DomRoot, items: TrailItem[]): void {
  el.replaceChildren();
  const label: Record<TrailKind, string> = {
    you: "YOU",
    local: "LOCAL",
    world: "WORLD",
    fail: "FAIL",
  };
  const role: Record<TrailKind, string> = {
    you: "role-you",
    local: "role-here",
    world: "",
    fail: "role-fail",
  };
  for (const t of items) {
    const li = h("li");
    const k = h("span", "k " + t.kind + (role[t.kind] ? " " + role[t.kind] : ""), label[t.kind]);
    const title = h("span", "t", t.title || "");
    if (t.detail) title.append(h("span", "d", t.detail));
    li.append(k, title);
    el.append(li);
  }
}

export function fillPlayersHere(
  el: DomRoot,
  players?: PlayerHere[] | null,
  orgs?: OrgItem[] | null,
  selfId?: string,
): void {
  el.replaceChildren();
  if (!players || !players.length) return;
  const officerOrgs = (orgs || []).filter((o) => {
    const role = String(o.my_role || "").toLowerCase();
    return role === "founder" || role === "officer";
  });
  const ul = h("ul", "tok-list players-here");
  ul.setAttribute("aria-label", "Other players");
  for (const p of players) {
    const handle = playerHandle(p);
    const li = h("li");
    li.append(
      glyphEl("player"),
      cmdBtn("message " + handle + ' "', handle, "Message " + handle),
      " ",
      cmdBtn("trade " + handle + " offer=", "trade", "Trade " + handle),
    );
    for (const o of officerOrgs) {
      li.append(
        " ",
        cmdBtn("invite " + handle + " to " + o.org_id + " role=member", "invite " + o.name),
      );
    }
    const title = (p.public_practice_lines || []).find((line) => String(line || "").trim());
    if (title) li.append(" ", h("span", "d", title));
    ul.append(li);
  }
  void selfId;
  el.append(ul);
}

export function fillBonds(
  el: DomRoot,
  opts: {
    messages?: MailItem[] | null;
    trades?: TradeItem[] | null;
    organizations?: OrgItem[] | null;
  },
): void {
  el.replaceChildren();
  const mail = opts.messages || [];
  const trades = opts.trades || [];
  const orgs = opts.organizations || [];
  const mailBlock = h("div", "bonds-block");
  mailBlock.append(h("h4", "", "Mail"));
  const mailUl = h("ul", "tok-list");
  mailUl.setAttribute("aria-label", "Mail");
  if (!mail.length) mailUl.append(h("li", "empty", "No messages."));
  else {
    for (const m of mail.slice().reverse()) {
      const li = h("li");
      li.append(
        h("strong", "", playerHandle({ player_id: m.sender_id })),
        " · cycle " + String(m.delivered_cycle),
        h("span", "d", m.text),
      );
      mailUl.append(li);
    }
  }
  mailBlock.append(mailUl);

  const tradeBlock = h("div", "bonds-block");
  tradeBlock.append(h("h4", "", "Open trades"));
  const tradeUl = h("ul", "tok-list");
  tradeUl.setAttribute("aria-label", "Open trades");
  if (!trades.length) tradeUl.append(h("li", "empty", "No open trades."));
  else {
    for (const t of trades) {
      const label = formatResourceMap(t.offered) + " → " + formatResourceMap(t.requested);
      const li = h("li");
      li.append(label + " ", h("span", "muted", t.role || ""), " ");
      if (t.role === "counterparty") {
        li.append(cmdBtn("accept " + t.trade_id, "accept"), " ", cmdBtn("reject " + t.trade_id, "reject"));
      } else {
        li.append(cmdBtn("cancel " + t.trade_id, "cancel"));
      }
      tradeUl.append(li);
    }
  }
  tradeBlock.append(tradeUl);

  const orgBlock = h("div", "bonds-block");
  orgBlock.append(h("h4", "", "Organizations"));
  const orgUl = h("ul", "tok-list");
  orgUl.setAttribute("aria-label", "Organizations");
  if (!orgs.length) orgUl.append(h("li", "empty", "No public organizations."));
  else {
    for (const o of orgs) {
      const role = o.my_role || "not a member";
      const seats = (o.offices || [])
        .map((off) => {
          const who = off.status === "VACANT" ? "vacant" : off.holder_handle || "occupied";
          return (off.display_name || "") + " — " + who;
        })
        .join("; ");
      const notice = o.public_notice ? ' · notice: "' + o.public_notice + '"' : "";
      const li = h("li");
      li.append(o.name || "", " ", h("span", "muted", role + (seats ? " · " + seats : "") + notice));
      orgUl.append(li);
    }
  }
  orgBlock.append(orgUl, cmdBtn("form ", "Form organization"));
  el.append(mailBlock, tradeBlock, orgBlock);
}

export function fillServiceDesks(el: DomRoot, services?: LocationObs["services"] | null): void {
  el.replaceChildren();
  if (!services || !services.length) return;
  const ul = h("ul", "tok-list");
  ul.setAttribute("aria-label", "World Services");
  for (const s of services) {
    const unavailable = String(s.status || "").toUpperCase() === "UNAVAILABLE";
    const name = s.display_name || "Desk";
    const li = h("li");
    li.append(name);
    const sub = [s.status, s.role].filter(Boolean).join(" · ");
    if (sub) li.append(" ", h("span", "muted", sub));
    if (s.line) li.append(" ", h("span", "muted", s.line));
    if (s.cannot && s.cannot.length) {
      li.append(" ", h("span", "muted", "Cannot"));
      const nest = h("ul");
      for (const c of s.cannot) nest.append(h("li", "", c));
      li.append(nest);
    }
    li.append(" ");
    if (unavailable) {
      const b = h("button", "role-here", "Talk unavailable");
      b.type = "button";
      b.disabled = true;
      b.setAttribute("aria-disabled", "true");
      li.append(b);
    } else {
      li.append(cmdBtn("talk " + String(name).toLowerCase(), "Talk " + name));
    }
    for (const c of s.suggested_cmds || []) li.append(" ", cmdBtn(c, c));
    ul.append(li);
  }
  el.append(ul);
}

export function fillExitTokens(el: DomRoot, exits?: ExitObs[] | null): void {
  el.replaceChildren();
  if (!exits || !exits.length) return;
  for (const x of exits) {
    const dest = x.to_room_name || titleCaseLabel(String(x.to_room_id || "").replace(/^room\./, "") || x.direction || "ahead");
    const li = h("li");
    const dir = String(x.direction || "").trim() || "ahead";
    li.append(cmdBtn("move " + dir, dir), " ", h("span", "muted", dest));
    el.append(li);
  }
}

export function fillEntityList(el: DomRoot, entities?: EntityObs[] | null): void {
  el.replaceChildren();
  if (!entities || !entities.length) {
    el.append(h("li", "empty", "Nothing notable right here."));
    return;
  }
  for (const e of entities) {
    const name = titleCaseLabel(e.label);
    let sub = entityConditionText(e.label, e.entity_type) + " · " + entityKindPhrase(e.entity_type);
    if (e.condition != null) sub = "condition " + e.condition + "% · " + sub;
    if (e.harvestable && e.stock_amount != null) {
      sub = e.stock_amount + " " + (e.stock_resource || "resource") + " · " + sub;
    }
    const li = h("li");
    li.append(
      glyphEl(glyphForEntity(e.entity_type, e.label, e.condition)),
      cmdBtn("inspect " + e.label, name),
      " ",
      h("span", "muted", sub),
    );
    if (e.repairable) li.append(" ", cmdBtn("repair " + e.label, "repair"));
    if (e.harvestable) li.append(" ", cmdBtn("harvest " + e.label, "harvest"));
    el.append(li);
  }
}

export function fillOpportunities(el: DomRoot, loc: LocationObs): void {
  el.replaceChildren();
  const opps = deriveOpportunities(loc);
  if (!opps.length) {
    el.append(h("li", "empty", "No clear local pressure — try looking or following a route."));
    return;
  }
  for (const o of opps) {
    const li = h("li");
    li.append(cmdBtn(o.cmd, o.actionLabel), " ", h("span", "muted", o.text));
    el.append(li);
  }
}

export function fillStatusRows(el: DomRoot, rows: { label: string; value: string }[]): void {
  el.replaceChildren();
  for (const r of rows) {
    const li = h("li");
    li.append(h("span", "", r.label), h("b", "", r.value));
    el.append(li);
  }
}

export function fillWorldStrip(
  el: DomRoot & { hidden?: boolean },
  rows: { label: string; value: string }[],
): void {
  el.replaceChildren();
  if (!rows.length) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  for (const r of rows) {
    const item = h("span", "strip-item");
    item.append(h("span", "strip-k", r.label), h("b", "strip-v", r.value));
    el.append(item);
  }
}

export function fillSignalFeed(
  el: DomRoot & {
    hidden?: boolean;
    getAttribute?: (name: string) => string | null;
    setAttribute?: (name: string, value: string) => void;
  },
  lines: string[],
): void {
  const wrap = (el as { parentElement?: (DomRoot & { hidden?: boolean }) | null }).parentElement;
  const prev = (el.getAttribute && el.getAttribute("data-head")) || "";
  const head = lines[0] || "";
  el.replaceChildren();
  if (!lines.length) {
    el.append(h("li", "empty", "No public signals this cycle."));
    if (wrap) wrap.hidden = true;
    if (el.setAttribute) el.setAttribute("data-head", "");
    return;
  }
  if (wrap) wrap.hidden = false;
  lines.forEach((line, i) => {
    const li = h("li", i === 0 && head !== prev ? "signal-new" : "");
    li.append(glyphEl(glyphForLine(line)), " ", line);
    el.append(li);
  });
  if (el.setAttribute) el.setAttribute("data-head", head);
}

export function fillActionRail(
  el: DomRoot,
  actions: Array<{ label: string; cmd: string; available?: boolean }>,
  loc?: LocationObs,
): void {
  if (actions.length) {
    el.replaceChildren();
    for (const a of actions) {
      const li = h("li");
      li.append(cmdBtn(a.cmd, a.label));
      el.append(li);
    }
    return;
  }
  if (loc) {
    fillOpportunities(el, loc);
    return;
  }
  el.replaceChildren();
  el.append(h("li", "empty", "Look, wait, or follow a route."));
}

export function fillDisclosure(
  details: (DomRoot & { hidden?: boolean }) | null,
  list: DomRoot | null,
  lines: string[],
  itemClass?: string,
): void {
  if (!details || !list) return;
  list.replaceChildren();
  if (!lines.length) {
    details.hidden = true;
    return;
  }
  details.hidden = false;
  for (const line of lines) {
    const li = h("li", itemClass || "");
    const mark =
      itemClass === "rumor"
        ? "rumor"
        : /contest|danger/i.test(line)
          ? "danger"
          : glyphForLine(line);
    li.append(glyphEl(mark), " ", line);
    list.append(li);
  }
}

/** Serialized into the PLAY page so the browser uses these helpers, not a fork. */
export function playUiRuntimeSource(): string {
  return [
    label,
    toPlayerView,
    glyphMeta,
    glyphForEntity,
    glyphForLine,
    glyphEl,
    escHtml,
    titleCaseLabel,
    entityKindPhrase,
    entityConditionGlyph,
    entityConditionText,
    deriveLocalCondition,
    deriveOpportunities,
    humanizeError,
    waitingCopy,
    trailFromResult,
    routeDiagram,
    statusFromObservation,
    playerHandle,
    formatResourceMap,
    renderPlayersHereHtml,
    renderBondsHtml,
    renderServiceDesksHtml,
    renderEntityListHtml,
    renderOpportunitiesHtml,
    renderLookHtml,
    renderTrailHtml,
    renderExitTokensHtml,
    pageDoc,
    h,
    cmdBtn,
    fillTrail,
    fillPlayersHere,
    fillBonds,
    fillServiceDesks,
    fillExitTokens,
    fillEntityList,
    fillOpportunities,
    fillStatusRows,
    fillWorldStrip,
    fillSignalFeed,
    fillActionRail,
    fillDisclosure,
  ]
    .map((fn) => fn.toString())
    .join("\n");
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
