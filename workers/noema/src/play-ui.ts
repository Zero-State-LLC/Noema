/**
 * Pure PLAY presentation helpers — testable without DOM.
 * Hosted action parity: Specs-aligned parser adapter + presentation.
 */

import { helpText, parseHumanCommand } from "./actions";

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
export const BACKEND_GAPS = [
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
  if (c === "BUDGET_EXCEEDED") return { primary: "You do not have enough resources for that.", advanced: `${c}: ${m}` };
  if (c === "FORBIDDEN") return { primary: "You do not have authority to do that.", advanced: `${c}: ${m}` };
  if (c === "AMBIGUOUS_TARGET") return { primary: m, advanced: c };
  if (c === "MOVE_REJECTED") return { primary: "You cannot go that way from here.", advanced: `${c}: ${m}` };
  if (c === "INSPECT_FAILED" || c === "NOT_FOUND") {
    return { primary: m.includes("see") ? m : "You do not see that here.", advanced: `${c}: ${m}` };
  }
  if (c === "NOT_IN_WORLD") return { primary: "Enter the world first.", advanced: `${c}: ${m}` };
  if (c === "UNKNOWN_COMMAND") return { primary: "That action is not available here yet.", advanced: `${c}: ${m}` };
  if (c === "TRADE_REJECTED" || c === "TRADE_FAILED") return { primary: m, advanced: c };
  if (m && !/^[A-Z_]+$/.test(m)) return { primary: m, advanced: c || undefined };
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
  } else if (cmd === "LEAVE_WORLD") {
    items.push({ kind: "world", title: "You leave the world." });
  } else if (cmd === "MESSAGE") {
    items.push({ kind: "world", title: "A message is delivered." });
  } else if (cmd === "TRADE") {
    items.push({ kind: "world", title: "A trade changes hands." });
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

export function escHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
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
      let acts =
        '<button type="button" class="btn" data-cmd="' +
        escHtml(msgCmd) +
        '">Message ' +
        name +
        "</button>" +
        '<button type="button" class="btn" data-cmd="' +
        escHtml(tradeCmd) +
        '">Trade ' +
        name +
        "</button>";
      for (const o of officerOrgs) {
        acts +=
          '<button type="button" class="btn" data-cmd="invite ' +
          escHtml(handle) +
          " to " +
          escHtml(o.org_id) +
          ' role=member">Invite ' +
          name +
          " to " +
          escHtml(o.name) +
          "</button>";
      }
      void selfId;
      return (
        '<li class="ent player-here">' +
        '<span class="glyph" aria-hidden="true">○</span>' +
        "<span><strong>" +
        name +
        '</strong><span class="sub">Player</span></span>' +
        '<span class="acts">' +
        acts +
        "</span></li>"
      );
    })
    .join("");
  return '<ul class="ent-list players-here" aria-label="Other players">' + rows + "</ul>";
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
              ? '<button type="button" class="btn primary" data-cmd="accept ' +
                escHtml(t.trade_id) +
                '">Accept</button>' +
                '<button type="button" class="btn" data-cmd="reject ' +
                escHtml(t.trade_id) +
                '">Reject</button>'
              : '<button type="button" class="btn" data-cmd="cancel ' +
                escHtml(t.trade_id) +
                '">Cancel</button>';
          return (
            '<li class="ent"><span><strong>' +
            escHtml(label) +
            '</strong><span class="sub">' +
            escHtml(t.role) +
            "</span></span><span class=\"acts\">" +
            acts +
            "</span></li>"
          );
        })
        .join("")
    : '<li class="empty">No open trades.</li>';
  const orgHtml = orgs.length
    ? orgs
        .map((o) => {
          const role = o.my_role || "not a member";
          const leave = o.my_role
            ? '<button type="button" class="btn" data-cmd="leave ' +
              escHtml(o.org_id) +
              '">Leave ' +
              escHtml(o.name) +
              "</button>"
            : "";
          return (
            '<li class="ent"><span><strong>' +
            escHtml(o.name) +
            '</strong><span class="sub">' +
            escHtml(role) +
            "</span></span><span class=\"acts\">" +
            leave +
            "</span></li>"
          );
        })
        .join("")
    : '<li class="empty">No public organizations.</li>';
  return (
    '<div class="bonds-block"><h4 class="sec-title">Mail</h4><ul class="bond-list" aria-label="Mail">' +
    mailHtml +
    '</ul></div><div class="bonds-block"><h4 class="sec-title">Open trades</h4><ul class="ent-list" aria-label="Open trades">' +
    tradeHtml +
    '</ul></div><div class="bonds-block"><h4 class="sec-title">Organizations</h4><ul class="ent-list" aria-label="Organizations">' +
    orgHtml +
    '</ul><button type="button" class="btn" data-cmd="form " style="margin-top:.55rem">Form organization</button></div>'
  );
}

export function renderServiceDesksHtml(
  services?: LocationObs["services"] | null,
): string {
  if (!services || !services.length) return "";
  return (
    '<ul class="desk-list" aria-label="World Services">' +
    services
      .map((s) => {
        const unavailable = String(s.status || "").toUpperCase() === "UNAVAILABLE";
        const name = s.display_name || "Desk";
        const talkCmd = "talk " + String(name).toLowerCase();
        const talk = unavailable
          ? '<button type="button" class="btn" disabled aria-disabled="true">Talk unavailable</button>'
          : '<button type="button" class="btn" data-cmd="' +
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
              '<button type="button" class="btn" data-cmd="' +
              escHtml(c) +
              '">' +
              escHtml(c) +
              "</button>"
            );
          })
          .join("");
        return (
          '<li class="desk">' +
          '<div class="desk-head"><strong>' +
          escHtml(name) +
          '</strong><span class="tag">' +
          escHtml(s.status || "") +
          "</span></div>" +
          '<p class="sub">World Service · ' +
          escHtml(s.role || "") +
          "</p>" +
          (s.line ? '<p class="desk-line">' + escHtml(s.line) + "</p>" : "") +
          (cannot
            ? '<p class="sec-title">Cannot</p><ul class="desk-cannot">' + cannot + "</ul>"
            : "") +
          '<div class="acts">' +
          talk +
          cmds +
          "</div></li>"
        );
      })
      .join("") +
    "</ul>"
  );
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
      const glyph = entityConditionGlyph(e.label, e.entity_type);
      let acts =
        '<button type="button" class="btn" data-cmd="inspect ' +
        escHtml(e.label) +
        '">Inspect ' +
        escHtml(name) +
        "</button>";
      if (e.repairable) {
        acts +=
          '<button type="button" class="btn primary" data-cmd="repair ' +
          escHtml(e.label) +
          '">Repair ' +
          escHtml(name) +
          "</button>";
      }
      if (e.harvestable) {
        acts +=
          '<button type="button" class="btn" data-cmd="harvest ' +
          escHtml(e.label) +
          '">Harvest ' +
          escHtml(name) +
          "</button>";
      }
      return (
        '<li class="ent">' +
        '<span class="glyph" aria-hidden="true">' +
        glyph +
        "</span>" +
        "<span><strong>" +
        escHtml(name) +
        '</strong><span class="sub">' +
        escHtml(sub) +
        "</span></span>" +
        '<span class="acts">' +
        acts +
        "</span></li>"
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
        '<li class="opp"><p>' +
        escHtml(o.text) +
        '</p><button type="button" class="btn primary" data-cmd="' +
        escHtml(o.cmd) +
        '">' +
        escHtml(o.actionLabel) +
        "</button></li>"
      );
    })
    .join("");
}

/** Serialized into the PLAY page so the browser uses these helpers, not a fork. */
export function playUiRuntimeSource(): string {
  return [
    escHtml,
    titleCaseLabel,
    entityKindPhrase,
    entityConditionGlyph,
    entityConditionText,
    deriveLocalCondition,
    deriveOpportunities,
    humanizeError,
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
