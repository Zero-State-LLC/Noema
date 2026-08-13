/**
 * Hosted Player Action Map — Specs-aligned costs, normalization, affordances.
 * Authority: Noema-Specs PLAYER-ACTION-MAP + action-contracts.v01
 * No new verbs. COMMIT is wire/internal; humans use intent language.
 */

export type Budgets = {
  attention: number;
  compute: number;
  energy: number;
  influence: number;
  storage: number;
};

export type EntityRuntime = {
  entity_id: string;
  label: string;
  entity_type: string;
  /** Infrastructure condition 0–100 when known/observable */
  condition?: number;
  /** Harvest node stock */
  stock_resource?: string;
  stock_amount?: number;
};

export type PlayerRuntime = {
  room_id: string;
  entered: boolean;
  budgets: Budgets;
  handle?: string;
  controlling_session_id?: string;
  last_seen_ms?: number;
  actor_kind?: "live" | "system";
  /** GC1 derived cache. Not WorldState. Rebuildable. */
  practice?: {
    catalog_id: "mastery-catalog/gc1-s0" | "mastery-catalog/gc1-s1";
    tracks: Partial<Record<string, string[]>>;
    recognition?: Partial<Record<string, string[]>>;
  };
  /** GC3-S0 derived dyadic trade memory. Not WorldState. */
  trade_memory?: {
    catalog_id: "social-memory-catalog/gc3-s0";
    edges: Record<string, string[]>;
  };
};

export type OpenTrade = {
  trade_id: string;
  proposer_id: string;
  counterparty_id: string;
  offered: Record<string, number>;
  requested: Record<string, number>;
  status: "OPEN" | "SETTLED" | "REJECTED" | "CANCELLED";
  reserved: Record<string, number>;
  expires_cycle?: number;
};

export type InboxMessage = {
  message_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  status: "DELIVERED";
  delivered_cycle: number;
};

/** Specs seed defaults (RESOURCE-ECONOMY / ENVIRONMENT). */
export const DEFAULT_BUDGETS: Budgets = {
  attention: 8,
  compute: 64,
  energy: 80,
  influence: 40,
  storage: 16,
};

const TRADE_RESOURCE_KEYS = new Set(Object.keys(DEFAULT_BUDGETS));

/** Structured TRADE maps must use known budget keys and safe positive integers. */
export function sanitizeTradeAmounts(
  raw: Record<string, number> | undefined | null,
): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = String(key).toLowerCase();
    if (!TRADE_RESOURCE_KEYS.has(name)) return null;
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return null;
    out[name] = value;
  }
  return Object.keys(out).length ? out : null;
}

/** Hosted v0.1 Chamber surface (orientation + interaction + orgs). */
export const HOSTED_TIER1 = [
  "LOOK",
  "MOVE",
  "INSPECT",
  "WAIT",
  "MESSAGE",
  "TRADE",
  "HARVEST",
  "REPAIR",
  "ORG_CREATE",
  "ORG_MEMBER_ADD",
  "ORG_MEMBER_REMOVE",
] as const;

/** Remaining Specs v0.2 strategic gap. */
export const BACKEND_GAPS_TIER2 = [] as const;

export const BACKEND_GAPS_TIER3 = [
  "CONTEST_DECLARE",
  "CONTEST_DEFEND",
  "AGREEMENT_FORM",
  "AGREEMENT_TERMINATE",
  "ACCESS_POLICY",
] as const;

export type OrgRole = "founder" | "officer" | "member" | "advisor";

export function assignedOrgRole(raw: string | undefined | null): OrgRole {
  const role = String(raw || "member").toLowerCase();
  if (role === "officer") return "officer";
  if (role === "advisor") return "advisor";
  if (role === "founder") return "founder";
  return "member";
}

export type OrgMember = { agent_id: string; role: OrgRole };

export type Organization = {
  org_id: string;
  name: string;
  charter: string;
  status: "ACTIVE";
  creator_id: string;
  members: OrgMember[];
  created_cycle: number;
};

export const COSTS = {
  LOOK: { attention: 1 } as Partial<Budgets>,
  INSPECT: { attention: 2 } as Partial<Budgets>,
  MOVE: { energy: 1 } as Partial<Budgets>,
  MESSAGE: { compute: 1 } as Partial<Budgets>,
  TRADE: { compute: 1 } as Partial<Budgets>,
  HARVEST: { energy: 2, compute: 1 } as Partial<Budgets>,
  REPAIR: { energy: 3, compute: 2, storage: 1 } as Partial<Budgets>,
  ORG_CREATE: { influence: 5, compute: 2 } as Partial<Budgets>,
  ORG_MEMBER_ADD: { influence: 1, compute: 2 } as Partial<Budgets>,
  ORG_MEMBER_REMOVE: { compute: 1 } as Partial<Budgets>,
  WAIT: {} as Partial<Budgets>,
};

export type CanonicalAction =
  | { verb: "LOOK"; arguments: Record<string, never> }
  | { verb: "WAIT"; arguments: Record<string, never> }
  | { verb: "OBSERVE"; arguments: Record<string, never> }
  | { verb: "ENTER_WORLD"; arguments: Record<string, never> }
  | { verb: "LEAVE_WORLD"; arguments: { reason?: string } }
  | { verb: "MOVE"; arguments: { direction: string } }
  | { verb: "INSPECT"; arguments: { entity_id: string } }
  | { verb: "MESSAGE"; arguments: { recipient_id: string; text: string } }
  | {
      verb: "TRADE";
      arguments: {
        phase: "propose" | "accept" | "reject" | "cancel";
        counterparty_id?: string;
        offered?: Record<string, number>;
        requested?: Record<string, number>;
        trade_id?: string;
        expires_cycle?: number;
        reason?: string;
      };
    }
  | {
      verb: "COMMIT";
      arguments: {
        operation: "HARVEST" | "REPAIR" | "ORG_CREATE" | "ORG_MEMBER_ADD" | "ORG_MEMBER_REMOVE";
        entity_id?: string;
        amount?: number;
        org_id?: string;
        name?: string;
        charter?: string;
        agent_id?: string;
        role?: OrgRole;
        reason?: string;
        initial_members?: OrgMember[];
      };
    };

export type Affordance = {
  action: string;
  verb: string;
  operation?: string;
  label: string;
  cmd: string;
  target_id?: string;
  target_label?: string;
  requires?: Partial<Budgets>;
  available: boolean;
  reason?: string;
  kind: "primary" | "secondary" | "move" | "utility" | "social" | "resource" | "org";
};

/** Stage-0 adapter: server allocates org_id (Specs SPEC GAP — human form does not invent free IDs). */
export function allocateOrgId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "org";
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `org.${slug}.${hex}`;
}

export function isOrgOfficer(org: Organization, playerId: string): boolean {
  const m = org.members.find((x) => x.agent_id === playerId);
  return Boolean(m && (m.role === "founder" || m.role === "officer"));
}

export function isOrgMember(org: Organization, playerId: string): boolean {
  return org.members.some((x) => x.agent_id === playerId);
}

export function cloneBudgets(b?: Partial<Budgets> | null): Budgets {
  return {
    attention: Math.max(0, Math.floor(b?.attention ?? DEFAULT_BUDGETS.attention)),
    compute: Math.max(0, Math.floor(b?.compute ?? DEFAULT_BUDGETS.compute)),
    energy: Math.max(0, Math.floor(b?.energy ?? DEFAULT_BUDGETS.energy)),
    influence: Math.max(0, Math.floor(b?.influence ?? DEFAULT_BUDGETS.influence)),
    storage: Math.max(0, Math.floor(b?.storage ?? DEFAULT_BUDGETS.storage)),
  };
}

export function canPay(budgets: Budgets, cost: Partial<Budgets>): boolean {
  for (const [k, v] of Object.entries(cost)) {
    const need = Number(v) || 0;
    if (need <= 0) continue;
    if ((budgets[k as keyof Budgets] ?? 0) < need) return false;
  }
  return true;
}

/** Debit only after success path is guaranteed. Mutates budgets. */
export function debit(budgets: Budgets, cost: Partial<Budgets>): void {
  for (const [k, v] of Object.entries(cost)) {
    const need = Number(v) || 0;
    if (need <= 0) continue;
    budgets[k as keyof Budgets] = (budgets[k as keyof Budgets] ?? 0) - need;
  }
}

export function titleCaseLabel(raw: string): string {
  return String(raw || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Harvest-node ontology (Stage 0):
 * - Explicit stock fields always win
 * - entity_type RESOURCE is a resource node
 * - INFRASTRUCTURE in the storage/cache/salvage class is a resource node
 * - Trade boards / market posts are NOT harvest nodes (trade surface only)
 * Does not invent new Genesis entities — classifies existing ones.
 */
export function classifyResourceNode(e: {
  entity_id: string;
  label: string;
  entity_type: string;
  stock_resource?: string;
  stock_amount?: number;
}): { is_node: boolean; resource?: string; amount?: number } {
  if (e.stock_resource != null) {
    return {
      is_node: true,
      resource: e.stock_resource,
      amount: e.stock_amount ?? 0,
    };
  }
  const type = (e.entity_type || "").toUpperCase();
  if (type === "RESOURCE") {
    return { is_node: true, resource: "energy", amount: e.stock_amount ?? 8 };
  }
  if (type === "INFRASTRUCTURE") {
    const id = e.entity_id.toLowerCase();
    const lab = e.label.toLowerCase();
    // Storage/cache/salvage class only — not market/trade boards
    if (
      /storage|cache|scrap|salvage|deposit|stockpile|cell/.test(id) ||
      /storage|cache|scrap|salvage|deposit|stockpile|cell/.test(lab)
    ) {
      return { is_node: true, resource: "energy", amount: e.stock_amount ?? 8 };
    }
  }
  return { is_node: false };
}

/** Derive runtime fields without inventing new genesis content. */
export function enrichEntity(e: {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  stock_resource?: string;
  stock_amount?: number;
}): EntityRuntime {
  const s = `${e.label} ${e.entity_type}`.toLowerCase();
  let condition = e.condition;
  if (condition === undefined) {
    if (/scar|damag|broken|fail/.test(s)) condition = 35;
    else if (e.entity_type === "RUIN" || /ruin|dead|ghost/.test(s)) condition = 20;
    else if (e.entity_type === "INFRASTRUCTURE") condition = 70;
    else if (e.entity_type === "ARTIFACT") condition = 50;
  }
  const node = classifyResourceNode(e);
  return {
    entity_id: e.entity_id,
    label: e.label,
    entity_type: e.entity_type,
    condition,
    stock_resource: node.is_node ? node.resource : undefined,
    stock_amount: node.is_node ? node.amount : undefined,
  };
}

export function isRepairable(e: EntityRuntime): boolean {
  if (e.entity_type !== "INFRASTRUCTURE" && e.entity_type !== "RUIN") return false;
  const c = e.condition ?? 100;
  return c < 100;
}

export function isHarvestable(e: EntityRuntime): boolean {
  return Boolean(e.stock_resource && (e.stock_amount ?? 0) > 0);
}

export type ResolveResult =
  | { ok: true; entity: EntityRuntime }
  | { ok: false; code: "NOT_FOUND" | "AMBIGUOUS_TARGET"; message: string; choices?: string[] };

export function resolveVisibleEntity(raw: string, entities: EntityRuntime[]): ResolveResult {
  const t = normalizeKey(raw);
  if (!t) return { ok: false, code: "NOT_FOUND", message: "Choose something visible." };

  const exactId = entities.filter((e) => e.entity_id.toLowerCase() === t);
  if (exactId.length === 1) return { ok: true, entity: exactId[0] };

  const exactLabel = entities.filter((e) => normalizeKey(e.label) === t || normalizeKey(titleCaseLabel(e.label)) === t);
  if (exactLabel.length === 1) return { ok: true, entity: exactLabel[0] };
  if (exactLabel.length > 1) {
    return {
      ok: false,
      code: "AMBIGUOUS_TARGET",
      message: "More than one match.",
      choices: exactLabel.map((e) => titleCaseLabel(e.label)),
    };
  }

  const partial = entities.filter((e) => {
    const lab = normalizeKey(e.label);
    if (lab.includes(t) || t.includes(lab)) return true;
    const tw = new Set(t.split(" ").filter((w) => w.length > 2));
    return lab.split(" ").some((w) => tw.has(w));
  });
  if (partial.length === 1) return { ok: true, entity: partial[0] };
  if (partial.length > 1) {
    return {
      ok: false,
      code: "AMBIGUOUS_TARGET",
      message: "More than one match.",
      choices: partial.map((e) => titleCaseLabel(e.label)),
    };
  }
  return { ok: false, code: "NOT_FOUND", message: `You do not see “${raw}” here.` };
}

export function resolvePlayerTarget(
  raw: string,
  players: Array<{ player_id: string; handle?: string }>,
  selfId: string,
): { ok: true; player_id: string } | { ok: false; code: string; message: string; choices?: string[] } {
  const t = normalizeKey(raw);
  if (!t) return { ok: false, code: "NOT_FOUND", message: "Name a Player." };
  const others = players.filter((p) => p.player_id !== selfId);
  const byId = others.filter((p) => p.player_id.toLowerCase() === t || p.player_id.toLowerCase().endsWith("." + t));
  if (byId.length === 1) return { ok: true, player_id: byId[0].player_id };
  const byHandle = others.filter((p) => normalizeKey(p.handle || "") === t || normalizeKey(p.player_id.replace(/^player\./, "")) === t);
  if (byHandle.length === 1) return { ok: true, player_id: byHandle[0].player_id };
  if (byHandle.length > 1) {
    return {
      ok: false,
      code: "AMBIGUOUS_TARGET",
      message: "More than one Player matches.",
      choices: byHandle.map((p) => p.handle || p.player_id),
    };
  }
  // partial handle
  const partial = others.filter((p) => {
    const h = normalizeKey(p.handle || p.player_id.replace(/^player\./, ""));
    return h.includes(t) || t.includes(h);
  });
  if (partial.length === 1) return { ok: true, player_id: partial[0].player_id };
  if (partial.length > 1) {
    return {
      ok: false,
      code: "AMBIGUOUS_TARGET",
      message: "More than one Player matches.",
      choices: partial.map((p) => p.handle || p.player_id),
    };
  }
  return { ok: false, code: "NOT_FOUND", message: `No addressable Player “${raw}”.` };
}

function parseResourceMap(spec: string): Record<string, number> | null {
  // energy:3,storage:1
  const out: Record<string, number> = {};
  if (!spec.trim()) return out;
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^([a-zA-Z_]+):(-?\d+)$/);
    if (!m) return null;
    const n = Number(m[2]);
    if (!Number.isFinite(n) || n <= 0) return null;
    out[m[1].toLowerCase()] = n;
  }
  return out;
}

export type ParseResult =
  | { ok: true; action: CanonicalAction; display: string }
  | { ok: false; error: string; code?: string; choices?: string[] };

/**
 * Human command → canonical action (no world mutation).
 * Target resolution uses visible entities/players when provided.
 */
export function parseHumanCommand(
  line: string,
  ctx: {
    entities?: EntityRuntime[];
    players?: Array<{ player_id: string; handle?: string }>;
    selfId?: string;
    openTrades?: OpenTrade[];
  } = {},
): ParseResult {
  const trimmed = line.trim();
  if (!trimmed) return { ok: false, error: "Type a command, or use an action below." };

  // message / msg with quoted text
  const msgM = trimmed.match(/^(?:message|msg)\s+(\S+)\s+["'](.+)["']\s*$/i);
  if (msgM) {
    const who = msgM[1];
    const text = msgM[2];
    if (!ctx.players || !ctx.selfId) {
      return {
        ok: true,
        action: { verb: "MESSAGE", arguments: { recipient_id: who, text } },
        display: `You message ${who}.`,
      };
    }
    const r = resolvePlayerTarget(who, ctx.players, ctx.selfId);
    if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
    return {
      ok: true,
      action: { verb: "MESSAGE", arguments: { recipient_id: r.player_id, text } },
      display: `You message ${who}.`,
    };
  }

  // trade Nacre offer=energy:3 want=storage:1
  const tradeM = trimmed.match(
    /^trade(?:\s+propose)?\s+(\S+)\s+offer=([^\s]+)\s+want=([^\s]+)(?:\s+expires=(\d+))?\s*$/i,
  );
  if (tradeM) {
    const offered = parseResourceMap(tradeM[2]);
    const requested = parseResourceMap(tradeM[3]);
    if (!offered || !requested) {
      return { ok: false, error: "Trade syntax: trade <player> offer=energy:3 want=storage:1" };
    }
    let counterparty_id = tradeM[1];
    if (ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(tradeM[1], ctx.players, ctx.selfId);
      if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
      counterparty_id = r.player_id;
    }
    return {
      ok: true,
      action: {
        verb: "TRADE",
        arguments: {
          phase: "propose",
          counterparty_id,
          offered,
          requested,
          expires_cycle: tradeM[4] ? Number(tradeM[4]) : undefined,
        },
      },
      display: `You propose a trade to ${tradeM[1]}.`,
    };
  }

  const parts = trimmed.split(/\s+/);
  const v = (parts.shift() || "").toLowerCase();

  if (v === "help") {
    return { ok: false, error: "__HELP__", code: "HELP", choices: parts };
  }
  if (v === "look" || v === "l") {
    return { ok: true, action: { verb: "LOOK", arguments: {} }, display: "You look around." };
  }
  if (v === "wait") {
    return { ok: true, action: { verb: "WAIT", arguments: {} }, display: "You wait a moment." };
  }
  if (v === "observe") {
    return { ok: true, action: { verb: "OBSERVE", arguments: {} }, display: "You observe carefully." };
  }
  if (v === "enter") {
    return { ok: true, action: { verb: "ENTER_WORLD", arguments: {} }, display: "You enter the world." };
  }
  if (v === "move" || v === "go") {
    const dir = (parts[0] || "").toLowerCase();
    if (!dir) return { ok: false, error: "Move where? Try: move east" };
    return {
      ok: true,
      action: { verb: "MOVE", arguments: { direction: dir } },
      display: `You move ${dir}.`,
    };
  }
  if (v === "inspect" || v === "examine" || v === "x") {
    const raw = parts.join(" ");
    if (!raw) return { ok: false, error: "Inspect what? Click an object or type its name." };
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(raw, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return {
        ok: true,
        action: { verb: "INSPECT", arguments: { entity_id: r.entity.entity_id } },
        display: `You inspect ${titleCaseLabel(r.entity.label)}.`,
      };
    }
    return {
      ok: true,
      action: { verb: "INSPECT", arguments: { entity_id: raw } },
      display: `You try to inspect ${raw}.`,
    };
  }
  if (v === "repair") {
    const raw = parts.join(" ").replace(/^["']|["']$/g, "");
    if (!raw) return { ok: false, error: "Repair what? Name visible infrastructure." };
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(raw, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return {
        ok: true,
        action: { verb: "COMMIT", arguments: { operation: "REPAIR", entity_id: r.entity.entity_id } },
        display: `You repair ${titleCaseLabel(r.entity.label)}.`,
      };
    }
    return {
      ok: true,
      action: { verb: "COMMIT", arguments: { operation: "REPAIR", entity_id: raw } },
      display: `You try to repair ${raw}.`,
    };
  }
  if (v === "harvest") {
    const amountTok = parts[parts.length - 1];
    let amount = 1;
    let nameParts = parts;
    if (parts.length >= 2 && /^\d+$/.test(amountTok)) {
      amount = Number(amountTok);
      nameParts = parts.slice(0, -1);
    }
    const raw = nameParts.join(" ").replace(/^["']|["']$/g, "");
    if (!raw) return { ok: false, error: "Harvest what? Name a resource node." };
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(raw, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "HARVEST", entity_id: r.entity.entity_id, amount },
        },
        display: `You harvest from ${titleCaseLabel(r.entity.label)}.`,
      };
    }
    return {
      ok: true,
      action: { verb: "COMMIT", arguments: { operation: "HARVEST", entity_id: raw, amount } },
      display: `You try to harvest ${raw}.`,
    };
  }
  if (v === "accept") {
    const trade_id = parts[0];
    if (!trade_id) return { ok: false, error: "Accept which trade? accept <trade_id>" };
    return {
      ok: true,
      action: { verb: "TRADE", arguments: { phase: "accept", trade_id } },
      display: `You accept trade ${trade_id}.`,
    };
  }
  if (v === "reject") {
    const trade_id = parts[0];
    if (!trade_id) return { ok: false, error: "Reject which trade? reject <trade_id>" };
    return {
      ok: true,
      action: {
        verb: "TRADE",
        arguments: { phase: "reject", trade_id, reason: "DECLINED" },
      },
      display: `You reject trade ${trade_id}.`,
    };
  }
  if (v === "cancel") {
    const trade_id = parts[0];
    if (!trade_id) return { ok: false, error: "Cancel which trade? cancel <trade_id>" };
    return {
      ok: true,
      action: {
        verb: "TRADE",
        arguments: { phase: "cancel", trade_id, reason: "CANCELLED" },
      },
      display: `You cancel trade ${trade_id}.`,
    };
  }

  // form <name> charter="..."
  // form organization <name> charter="..."
  if (v === "form") {
    if (parts[0]?.toLowerCase() === "organization") parts.shift();
    if (parts[0]?.toLowerCase() === "agreement") {
      return {
        ok: false,
        error: "“form agreement” is a v0.2 strategic action — not available in this stage.",
        code: "NOT_IMPLEMENTED",
      };
    }
    const rest = parts.join(" ");
    const cm = rest.match(/^(.+?)\s+charter=["'](.+)["']\s*$/i);
    if (!cm) {
      return {
        ok: false,
        error: 'Form syntax: form <name> charter="purpose of the organization"',
      };
    }
    const name = cm[1].trim();
    const charter = cm[2].trim();
    if (!name || !charter) {
      return { ok: false, error: "Organization name and charter are required." };
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "ORG_CREATE", name, charter },
      },
      display: `You form ${name}.`,
    };
  }

  // invite <player> to <org> role=<role>
  if (v === "invite") {
    const rest = parts.join(" ");
    const m = rest.match(/^(\S+)\s+to\s+(\S+)(?:\s+role=(\S+))?\s*$/i);
    if (!m) {
      return { ok: false, error: "Invite syntax: invite <player> to <org> role=member" };
    }
    let agent_id = m[1];
    if (ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(m[1], ctx.players, ctx.selfId);
      if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
      agent_id = r.player_id;
    }
    const role = assignedOrgRole(m[3] || "member");
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "ORG_MEMBER_ADD",
          org_id: m[2],
          agent_id,
          role,
        },
      },
      display: `You invite ${m[1]} to ${m[2]}.`,
    };
  }

  // leave world (lifecycle) vs leave <org>
  if (v === "leave" || v === "exit") {
    const org_id = parts[0];
    if (!org_id || /^(world|chamber)$/i.test(org_id)) {
      return {
        ok: true,
        action: { verb: "LEAVE_WORLD", arguments: { reason: "VOLUNTARY" } },
        display: "You leave the world.",
      };
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "ORG_MEMBER_REMOVE",
          org_id,
          agent_id: ctx.selfId || "",
          reason: "SELF_LEAVE",
        },
      },
      display: `You leave ${org_id}.`,
    };
  }

  // remove <player> from <org> reason="..."
  if (v === "remove") {
    const rest = parts.join(" ");
    const m = rest.match(/^(\S+)\s+from\s+(\S+)(?:\s+reason=["'](.+)["'])?\s*$/i);
    if (!m) {
      return {
        ok: false,
        error: 'Remove syntax: remove <player> from <org> reason="cause"',
      };
    }
    let agent_id = m[1];
    if (ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(m[1], ctx.players, ctx.selfId);
      if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
      agent_id = r.player_id;
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "ORG_MEMBER_REMOVE",
          org_id: m[2],
          agent_id,
          reason: m[3] || "REMOVED",
        },
      },
      display: `You remove ${m[1]} from ${m[2]}.`,
    };
  }

  // Known but not hosted yet (v0.2 strategic)
  if (["contest", "defend", "agreement", "terminate", "access"].includes(v)) {
    return {
      ok: false,
      error: `“${v}” is a v0.2 strategic action — not available in this stage.`,
      code: "NOT_IMPLEMENTED",
    };
  }

  return {
    ok: false,
    error: `Unknown command “${v}”. Try help.`,
    code: "UNKNOWN_COMMAND",
  };
}

function formatAmbiguous(r: ResolveResult & { ok: false }): string {
  if (r.code === "AMBIGUOUS_TARGET" && r.choices?.length) {
    return `Which one?\n${r.choices.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;
  }
  return r.message;
}

/** Map agent/structured envelope to canonical action. */
export function normalizeStructuredCommand(
  command: string,
  args: Record<string, unknown> = {},
): ParseResult {
  const cmd = command.toUpperCase();
  if (cmd === "LOOK" || cmd === "WAIT" || cmd === "OBSERVE" || cmd === "ENTER_WORLD" || cmd === "JOIN") {
    const verb = cmd === "JOIN" ? "ENTER_WORLD" : (cmd as "LOOK" | "WAIT" | "OBSERVE" | "ENTER_WORLD");
    return { ok: true, action: { verb, arguments: {} }, display: verb };
  }
  if (cmd === "LEAVE_WORLD") {
    return {
      ok: true,
      action: { verb: "LEAVE_WORLD", arguments: { reason: String(args.reason || "VOLUNTARY") } },
      display: "LEAVE_WORLD",
    };
  }
  if (cmd === "MOVE") {
    const direction = String(args.direction || args.exit_id || "").toLowerCase();
    if (!direction) return { ok: false, error: "direction required", code: "INVALID_REQUEST" };
    return { ok: true, action: { verb: "MOVE", arguments: { direction } }, display: `MOVE ${direction}` };
  }
  if (cmd === "INSPECT") {
    const entity_id = String(args.entity_id || args.target || "").trim();
    if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
    return { ok: true, action: { verb: "INSPECT", arguments: { entity_id } }, display: `INSPECT ${entity_id}` };
  }
  if (cmd === "MESSAGE") {
    const recipient_id = String(args.recipient_id || args.target || "").trim();
    const text = String(args.text || "").trim();
    if (!recipient_id || !text) return { ok: false, error: "recipient_id and text required", code: "INVALID_REQUEST" };
    return {
      ok: true,
      action: { verb: "MESSAGE", arguments: { recipient_id, text } },
      display: `MESSAGE ${recipient_id}`,
    };
  }
  if (cmd === "TRADE") {
    const phase = String(args.phase || "propose").toLowerCase() as "propose" | "accept" | "reject" | "cancel";
    return {
      ok: true,
      action: {
        verb: "TRADE",
        arguments: {
          phase,
          counterparty_id: args.counterparty_id ? String(args.counterparty_id) : undefined,
          offered: (args.offered as Record<string, number>) || undefined,
          requested: (args.requested as Record<string, number>) || undefined,
          trade_id: args.trade_id ? String(args.trade_id) : undefined,
          expires_cycle: args.expires_cycle != null ? Number(args.expires_cycle) : undefined,
          reason: args.reason ? String(args.reason) : undefined,
        },
      },
      display: `TRADE ${phase}`,
    };
  }
  if (cmd === "COMMIT") {
    const operation = String(args.operation || "").toUpperCase();
    if (operation === "REPAIR" || operation === "HARVEST") {
      const entity_id = String(args.entity_id || args.target || "").trim();
      if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: operation as "REPAIR" | "HARVEST",
            entity_id,
            amount: args.amount != null ? Number(args.amount) : 1,
          },
        },
        display: `COMMIT.${operation}`,
      };
    }
    if (operation === "ORG_CREATE") {
      const name = String(args.name || "").trim();
      const charter = String(args.charter || "").trim();
      if (!name || !charter) {
        return { ok: false, error: "name and charter required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_CREATE",
            name,
            charter,
            org_id: args.org_id ? String(args.org_id) : undefined,
            initial_members: Array.isArray(args.initial_members)
              ? (args.initial_members as OrgMember[])
              : undefined,
          },
        },
        display: "COMMIT.ORG_CREATE",
      };
    }
    if (operation === "ORG_MEMBER_ADD") {
      const org_id = String(args.org_id || "").trim();
      const agent_id = String(args.agent_id || args.player_id || "").trim();
      if (!org_id || !agent_id) {
        return { ok: false, error: "org_id and agent_id required", code: "INVALID_REQUEST" };
      }
      const role = assignedOrgRole(String(args.role || "member"));
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_MEMBER_ADD", org_id, agent_id, role },
        },
        display: "COMMIT.ORG_MEMBER_ADD",
      };
    }
    if (operation === "ORG_MEMBER_REMOVE") {
      const org_id = String(args.org_id || "").trim();
      const agent_id = String(args.agent_id || args.player_id || "").trim();
      if (!org_id || !agent_id) {
        return { ok: false, error: "org_id and agent_id required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_MEMBER_REMOVE",
            org_id,
            agent_id,
            reason: String(args.reason || "REMOVED"),
          },
        },
        display: "COMMIT.ORG_MEMBER_REMOVE",
      };
    }
  }
  if (cmd === "REPAIR") {
    const entity_id = String(args.entity_id || args.target || "").trim();
    if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
    return {
      ok: true,
      action: { verb: "COMMIT", arguments: { operation: "REPAIR", entity_id } },
      display: "COMMIT.REPAIR",
    };
  }
  if (cmd === "HARVEST") {
    const entity_id = String(args.entity_id || args.target || "").trim();
    if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "HARVEST", entity_id, amount: args.amount != null ? Number(args.amount) : 1 },
      },
      display: "COMMIT.HARVEST",
    };
  }
  if (cmd === "ORG_CREATE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_CREATE" });
  }
  if (cmd === "ORG_MEMBER_ADD") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_MEMBER_ADD" });
  }
  if (cmd === "ORG_MEMBER_REMOVE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_MEMBER_REMOVE" });
  }
  return { ok: false, error: `unsupported command ${cmd}`, code: "UNKNOWN_COMMAND" };
}

export function deriveAffordances(input: {
  entities: EntityRuntime[];
  exits: Array<{ direction: string; to_room_name?: string }>;
  budgets: Budgets;
  otherPlayers: Array<{ player_id: string; handle?: string }>;
  openTrades: OpenTrade[];
  organizations?: Organization[];
  selfId: string;
}): Affordance[] {
  const out: Affordance[] = [];
  const { entities, exits, budgets, otherPlayers, openTrades, organizations = [], selfId } = input;

  for (const e of entities) {
    const name = titleCaseLabel(e.label);
    out.push({
      action: "INSPECT",
      verb: "INSPECT",
      label: `Inspect ${name}`,
      cmd: `inspect ${e.label}`,
      target_id: e.entity_id,
      target_label: e.label,
      requires: COSTS.INSPECT,
      available: canPay(budgets, COSTS.INSPECT),
      reason: canPay(budgets, COSTS.INSPECT) ? undefined : "You do not have enough attention.",
      kind: "primary",
    });
    if (isRepairable(e)) {
      const ok = canPay(budgets, COSTS.REPAIR);
      out.push({
        action: "REPAIR",
        verb: "COMMIT",
        operation: "REPAIR",
        label: `Repair ${name}`,
        cmd: `repair ${e.label}`,
        target_id: e.entity_id,
        target_label: e.label,
        requires: COSTS.REPAIR,
        available: ok,
        reason: ok ? undefined : "You do not have enough energy, compute, or storage.",
        kind: "primary",
      });
    }
    if (isHarvestable(e)) {
      const ok = canPay(budgets, COSTS.HARVEST) && (budgets.storage ?? 0) >= 1;
      out.push({
        action: "HARVEST",
        verb: "COMMIT",
        operation: "HARVEST",
        label: `Harvest ${name}`,
        cmd: `harvest ${e.label} 1`,
        target_id: e.entity_id,
        target_label: e.label,
        requires: COSTS.HARVEST,
        available: ok,
        reason: ok ? undefined : "You need energy, compute, and free storage.",
        kind: "resource",
      });
    }
  }

  for (const x of exits) {
    const ok = canPay(budgets, COSTS.MOVE);
    out.push({
      action: "MOVE",
      verb: "MOVE",
      label: `Move ${x.direction}${x.to_room_name ? " · " + x.to_room_name : ""}`,
      cmd: `move ${x.direction}`,
      requires: COSTS.MOVE,
      available: ok,
      reason: ok ? undefined : "You do not have enough energy.",
      kind: "move",
    });
  }

  for (const p of otherPlayers) {
    if (p.player_id === selfId) continue;
    const handle = p.handle || p.player_id.replace(/^player\./, "");
    const msgOk = canPay(budgets, COSTS.MESSAGE);
    out.push({
      action: "MESSAGE",
      verb: "MESSAGE",
      label: `Message ${handle}`,
      cmd: `message ${handle} "hello"`,
      target_id: p.player_id,
      target_label: handle,
      requires: COSTS.MESSAGE,
      available: msgOk,
      reason: msgOk ? undefined : "You do not have enough compute.",
      kind: "social",
    });
    const tradeOk = canPay(budgets, COSTS.TRADE);
    out.push({
      action: "TRADE",
      verb: "TRADE",
      label: `Trade with ${handle}`,
      cmd: `trade ${handle} offer=energy:1 want=energy:1`,
      target_id: p.player_id,
      target_label: handle,
      requires: COSTS.TRADE,
      available: tradeOk,
      reason: tradeOk ? undefined : "You do not have enough compute.",
      kind: "social",
    });
  }

  for (const t of openTrades) {
    if (t.status !== "OPEN") continue;
    if (t.counterparty_id === selfId) {
      out.push({
        action: "TRADE_ACCEPT",
        verb: "TRADE",
        label: `Accept ${t.trade_id}`,
        cmd: `accept ${t.trade_id}`,
        target_id: t.trade_id,
        requires: COSTS.TRADE,
        available: canPay(budgets, COSTS.TRADE),
        kind: "social",
      });
      out.push({
        action: "TRADE_REJECT",
        verb: "TRADE",
        label: `Reject ${t.trade_id}`,
        cmd: `reject ${t.trade_id}`,
        target_id: t.trade_id,
        available: true,
        kind: "social",
      });
    }
    if (t.proposer_id === selfId) {
      out.push({
        action: "TRADE_CANCEL",
        verb: "TRADE",
        label: `Cancel ${t.trade_id}`,
        cmd: `cancel ${t.trade_id}`,
        target_id: t.trade_id,
        available: true,
        kind: "social",
      });
    }
  }

  // Organization affordances (role-gated; never a permanent global panel)
  const formOk = canPay(budgets, COSTS.ORG_CREATE);
  out.push({
    action: "ORG_CREATE",
    verb: "COMMIT",
    operation: "ORG_CREATE",
    label: "Form organization",
    cmd: 'form My Compact charter="local coordination"',
    requires: COSTS.ORG_CREATE,
    available: formOk,
    reason: formOk ? undefined : "You need influence 5 and compute 2 to form an organization.",
    kind: "org",
  });
  for (const org of organizations) {
    if (org.status !== "ACTIVE") continue;
    const mine = isOrgMember(org, selfId);
    const officer = isOrgOfficer(org, selfId);
    if (mine) {
      out.push({
        action: "ORG_LEAVE",
        verb: "COMMIT",
        operation: "ORG_MEMBER_REMOVE",
        label: `Leave ${org.name}`,
        cmd: `leave ${org.org_id}`,
        target_id: org.org_id,
        target_label: org.name,
        requires: COSTS.ORG_MEMBER_REMOVE,
        available: canPay(budgets, COSTS.ORG_MEMBER_REMOVE),
        kind: "org",
      });
    }
    if (officer) {
      for (const p of otherPlayers) {
        if (p.player_id === selfId || isOrgMember(org, p.player_id)) continue;
        const handle = p.handle || p.player_id.replace(/^player\./, "");
        const invOk = canPay(budgets, COSTS.ORG_MEMBER_ADD);
        out.push({
          action: "ORG_INVITE",
          verb: "COMMIT",
          operation: "ORG_MEMBER_ADD",
          label: `Invite ${handle} to ${org.name}`,
          cmd: `invite ${handle} to ${org.org_id} role=member`,
          target_id: org.org_id,
          target_label: handle,
          requires: COSTS.ORG_MEMBER_ADD,
          available: invOk,
          reason: invOk ? undefined : "You need influence 1 and compute 2 to invite.",
          kind: "org",
        });
      }
    }
  }

  out.push({
    action: "LOOK",
    verb: "LOOK",
    label: "Look around",
    cmd: "look",
    requires: COSTS.LOOK,
    available: canPay(budgets, COSTS.LOOK),
    kind: "utility",
  });
  out.push({
    action: "WAIT",
    verb: "WAIT",
    label: "Wait",
    cmd: "wait",
    available: true,
    kind: "utility",
  });

  return out;
}

export function helpText(topic?: string, available?: Affordance[]): string {
  const lines: string[] = [];
  if (available?.length) {
    lines.push("AVAILABLE HERE");
    for (const a of available.filter((x) => x.available).slice(0, 12)) {
      lines.push(`  ${a.cmd}`);
    }
    lines.push("");
  }
  const t = (topic || "").toLowerCase();
  if (!t || t === "commands") {
    lines.push("KNOWN COMMANDS");
    lines.push("  look · move <dir> · inspect <thing> · wait");
    lines.push("  message <player> \"text\"");
    lines.push("  repair <infrastructure> · harvest <node> [amount]");
    lines.push("  trade <player> offer=energy:3 want=storage:1");
    lines.push("  accept <trade> · reject <trade> · cancel <trade>");
    lines.push('  form <name> charter="purpose"');
    lines.push("  invite <player> to <org> role=member");
    lines.push("  leave <org> · remove <player> from <org>");
    lines.push("  talk <desk>     World Service (not a Player)");
    lines.push("  help [trade|repair|harvest|message|org]");
  } else if (t === "org" || t === "organization" || t === "organizations") {
    lines.push("ORGANIZATIONS");
    lines.push('  form <name> charter="purpose"');
    lines.push("  invite <player> to <org_id> role=member|officer|advisor");
    lines.push("  leave <org_id>");
    lines.push('  remove <player> from <org_id> reason="cause"');
    lines.push("  Costs: form influence 5 + compute 2; invite influence 1 + compute 2; leave/remove compute 1");
    lines.push("  org_id is assigned by the world (org.<slug>.<id>) — do not invent free IDs.");
    lines.push("  No self-join; officers invite. Founder/officer may remove.");
  } else if (t === "trade") {
    lines.push("TRADE");
    lines.push("  trade <player> offer=energy:3 want=storage:1");
    lines.push("  accept <trade_id> · reject <trade_id> · cancel <trade_id>");
    lines.push("  Offered resources are reserved until accept/reject.");
  } else if (t === "repair") {
    lines.push("REPAIR");
    lines.push("  repair <visible infrastructure>");
    lines.push("  Costs: energy 3, compute 2, storage 1");
    lines.push("  Condition +15 (max 100). No debit on failure.");
  } else if (t === "harvest") {
    lines.push("HARVEST");
    lines.push("  harvest <resource-node> [amount]");
    lines.push("  Costs: energy 2, compute 1 · needs free storage");
  } else if (t === "message") {
    lines.push("MESSAGE");
    lines.push("  message <player> \"text\"");
    lines.push("  Costs: compute 1 · private (not on WATCH)");
  } else {
    lines.push(`No help topic “${topic}”. Try help trade.`);
  }
  return lines.join("\n");
}

export function humanizeActionError(code?: string, message?: string): { primary: string; advanced?: string } {
  const c = (code || "").toUpperCase();
  const m = message || "That did not work.";
  if (c === "BUDGET_EXCEEDED") return { primary: "You do not have enough resources for that.", advanced: `${c}: ${m}` };
  if (c === "FORBIDDEN") return { primary: "You do not have authority to do that.", advanced: `${c}: ${m}` };
  if (c === "AMBIGUOUS_TARGET") return { primary: m, advanced: c };
  if (c === "MOVE_REJECTED") return { primary: "You cannot go that way from here.", advanced: `${c}: ${m}` };
  if (c === "INSPECT_FAILED" || c === "NOT_FOUND") return { primary: m.includes("see") ? m : "You do not see that here.", advanced: `${c}: ${m}` };
  if (c === "NOT_IN_WORLD") return { primary: "Enter the world first.", advanced: `${c}: ${m}` };
  if (c === "UNKNOWN_COMMAND") return { primary: "That action is not available here yet.", advanced: `${c}: ${m}` };
  if (c === "TRADE_REJECTED" || c === "TRADE_FAILED") return { primary: m, advanced: c };
  if (m && !/^[A-Z_]+$/.test(m)) return { primary: m, advanced: c || undefined };
  return { primary: "Something blocked that action.", advanced: c ? `${c}: ${m}` : m };
}
