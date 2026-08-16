/**
 * Hosted Player Action Map — Specs-aligned costs, normalization, affordances.
 * Authority: Noema-Specs PLAYER-ACTION-MAP + action-contracts.v01
 * COMMIT is wire/internal; humans use intent language.
 * GC2-S0 BUILD is accepted but not listed in Chamber help (S0 out-of-list).
 */

import {
  parseConstructibleClass,
  type ConstructibleClass,
} from "./construction";
import {
  isForbiddenContestVerb,
  parseContestForm,
  type ContestForm,
  type ContestTarget,
} from "./contest";
import {
  parseOfficeProfile,
  sanitizeIdList,
  sanitizePrecedence,
  type OfficeProfile,
  type OfficeRecord,
} from "./offices";
import { parseVisibility } from "./reconstruction";

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
  /** RFC-0015 explicit archive claim. Never inferred. */
  archive_subject_entity_id?: string;
  archive_claim?: "DESTROYED" | "OPERATING";
  /** GC2-S0 constructing Player. Genesis assets have none. */
  owner_id?: string;
  /** GC2-S0 class. Explicit wins over id/label matching. */
  infra_type?: ConstructibleClass;
  /** Spectator / LOOK-hidden. Never inferred. */
  hidden?: boolean;
};

export type PlayerRuntime = {
  room_id: string;
  entered: boolean;
  budgets: Budgets;
  handle?: string;
  controlling_session_id?: string;
  last_seen_ms?: number;
  actor_kind?: "live" | "system";
  /** RFC WAIT: actor wait-until. Does not advance World.cycle. */
  wait_until_cycle?: number;
  /** GC7-S0 PRESENCE_PRESSURE disable. Never permanent. */
  disabled_until_cycle?: number;
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
  /** GC3-S1 derived danger edges. Not WorldState. Separate from trade reliability. */
  danger_memory?: {
    catalog_id: "social-memory-catalog/gc3-s1";
    edges: Record<string, string[]>;
  };
  /** GC6-S0 derived archive/inspect members. Not WorldState. */
  discovery?: {
    catalog_id: "discovery-catalog/gc6-s0";
    archives: Record<string, "DESTROYED" | "OPERATING">;
    inspects: Record<string, "DESTROYED" | "OPERATING">;
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
  acting_for?: string;
  office_id?: string;
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
  /** GC4-S1 named seats. Not membership. Not WorldState geography. */
  offices?: Record<string, OfficeRecord>;
  public_notice?: string;
  /** GC4-S2 institution resource account. Not officer personal lots. */
  treasury?: import("./offices").Treasury;
  emergency_templates?: import("./emergency").EmergencyTemplate[];
  emergency_scopes?: import("./emergency").EmergencyScope[];
  /** Published office_id order. Earlier wins exclusive overlap. */
  office_precedence?: string[];
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
  ORG_OFFICE_CREATE: { influence: 1, compute: 2 } as Partial<Budgets>,
  ORG_OFFICE_ASSIGN: { compute: 1 } as Partial<Budgets>,
  ORG_OFFICE_VACATE: { compute: 1 } as Partial<Budgets>,
  ORG_OFFICE_RETIRE: { compute: 1 } as Partial<Budgets>,
  ORG_OFFICE_ACT: { compute: 1 } as Partial<Budgets>,
  RECONSTRUCT: { attention: 2, compute: 1 } as Partial<Budgets>,
  ATTEST: { attention: 2 } as Partial<Budgets>,
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
  | {
      verb: "MESSAGE";
      arguments: {
        recipient_id: string;
        text: string;
        subject_ref?: string;
        parent_claim_id?: string;
        as_claim?: boolean;
      };
    }
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
        acting_for?: string;
        office_id?: string;
        emergency_scope_id?: string;
      };
    }
  | {
      verb: "COMMIT";
      arguments: {
        operation:
          | "HARVEST"
          | "REPAIR"
          | "ORG_CREATE"
          | "ORG_MEMBER_ADD"
          | "ORG_MEMBER_REMOVE"
          | "ORG_OFFICE_CREATE"
          | "ORG_OFFICE_ASSIGN"
          | "ORG_OFFICE_VACATE"
          | "ORG_OFFICE_RETIRE"
          | "ORG_OFFICE_ACT"
          | "ORG_EMERGENCY_DEFINE"
          | "ORG_EMERGENCY_ACTIVATE"
          | "ORG_EMERGENCY_REVOKE"
          | "ORG_SUCCESSION_DESIGNATE"
          | "RECONSTRUCT"
          | "RECONSTRUCT_SUPERSEDE"
          | "RECONSTRUCT_PUBLISH"
          | "CONTEST_DECLARE"
          | "CONTEST_DEFEND"
          | "CONTEST_WITHDRAW"
          | "ATTEST";
        entity_id?: string;
        amount?: number;
        org_id?: string;
        name?: string;
        charter?: string;
        agent_id?: string;
        role?: OrgRole;
        reason?: string;
        initial_members?: OrgMember[];
        contest_form?: ContestForm;
        target?: ContestTarget;
        stake?: Record<string, number>;
        expires_cycle?: number;
        seed_stream_id?: string;
        defender_id?: string;
        contest_id?: string;
        expected_status?: "OPEN" | "CLOSED";
        subject_entity_id?: string;
        archive_claim?: "DESTROYED" | "OPERATING";
        office_id?: string;
        display_name?: string;
        authority_profile?: OfficeProfile;
        replace?: boolean;
        notice?: string;
        reconstruction_id?: string;
        subject_ref?: string;
        claim?: string;
        evidence?: string[];
        visibility?: "PRIVATE" | "INSTITUTIONAL" | "PUBLIC";
        supersedes_reconstruction_id?: string;
        acting_for?: string;
        emergency_scope_id?: string;
        template_id?: string;
        target_ref?: string;
        duration_cycles?: number;
        successors?: string[];
        object_set?: string[];
        office_precedence?: string[] | "append" | "lead";
      };
    }
  | {
      verb: "BUILD";
      arguments:
        | { operation: "CONSTRUCT"; class: ConstructibleClass; room_id?: string }
        | { operation: "DISMANTLE"; entity_id: string };
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
  archive_subject_entity_id?: string;
  archive_claim?: "DESTROYED" | "OPERATING";
  owner_id?: string;
  infra_type?: ConstructibleClass;
  hidden?: boolean;
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
    archive_subject_entity_id: e.archive_subject_entity_id,
    archive_claim: e.archive_claim,
    owner_id: e.owner_id,
    infra_type: e.infra_type,
    hidden: e.hidden === true ? true : undefined,
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

  const rawLower = String(raw || "").toLowerCase().trim();
  const exactId = entities.filter(
    (e) => e.entity_id.toLowerCase() === rawLower || e.entity_id.toLowerCase() === t,
  );
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

function resolveContestTarget(
  form: ContestForm,
  raw: string,
  ctx: {
    entities?: EntityRuntime[];
    players?: Array<{ player_id: string; handle?: string }>;
    selfId?: string;
  },
):
  | { ok: true; target: ContestTarget }
  | { ok: false; error: string; code?: string; choices?: string[] } {
  const t = raw.replace(/^["']|["']$/g, "").trim();
  if (form === "INFRASTRUCTURE_DISRUPTION") {
    if (ctx.entities?.length) {
      const r = resolveVisibleEntity(t, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return { ok: true, target: { kind: "ENTITY", entity_id: r.entity.entity_id } };
    }
    return { ok: true, target: { kind: "ENTITY", entity_id: t } };
  }
  if (form === "PRESENCE_PRESSURE") {
    if (ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(t, ctx.players, ctx.selfId);
      if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
      return { ok: true, target: { kind: "AGENT", agent_id: r.player_id } };
    }
    return { ok: true, target: { kind: "AGENT", agent_id: t } };
  }
  if (form === "ACCESS_CONTEST") {
    if (/^(here|room|this)$/i.test(t)) {
      return { ok: true, target: { kind: "ROOM", room_id: t } };
    }
    return { ok: true, target: { kind: "EXIT", exit_id: t.toLowerCase() } };
  }
  if (form === "RESOURCE_SEIZURE") {
    if (ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(t, ctx.players, ctx.selfId);
      if (r.ok) {
        return {
          ok: true,
          target: { kind: "HOLDING", holder_id: r.player_id, resource: "energy", amount: 5 },
        };
      }
    }
    if (ctx.entities?.length) {
      const r = resolveVisibleEntity(t, ctx.entities);
      if (r.ok) return { ok: true, target: { kind: "ENTITY", entity_id: r.entity.entity_id } };
    }
    return { ok: true, target: { kind: "HOLDING", holder_id: t, resource: "energy", amount: 5 } };
  }
  return { ok: false, error: "That contest form is not allowed.", code: "FORM_FORBIDDEN" };
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

  const reportM = trimmed.match(/^(?:report)\s+(\S+)\s+["'](.+)["'](?:\s+about\s+(\S+))?\s*$/i);
  if (reportM) {
    const who = reportM[1];
    const text = reportM[2];
    const subject_ref = reportM[3];
    if (!ctx.players || !ctx.selfId) {
      return {
        ok: true,
        action: { verb: "MESSAGE", arguments: { recipient_id: who, text, as_claim: true, subject_ref } },
        display: `You report to ${who}.`,
      };
    }
    const r = resolvePlayerTarget(who, ctx.players, ctx.selfId);
    if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
    return {
      ok: true,
      action: {
        verb: "MESSAGE",
        arguments: { recipient_id: r.player_id, text, as_claim: true, subject_ref },
      },
      display: `You report to ${who}.`,
    };
  }
  const passM = trimmed.match(/^(?:pass|share)\s+(\S+)\s+(\S+)\s*$/i);
  if (passM) {
    const who = passM[1];
    const parent_claim_id = passM[2];
    if (!ctx.players || !ctx.selfId) {
      return {
        ok: true,
        action: {
          verb: "MESSAGE",
          arguments: { recipient_id: who, text: parent_claim_id, as_claim: true, parent_claim_id },
        },
        display: `You pass a report to ${who}.`,
      };
    }
    const r = resolvePlayerTarget(who, ctx.players, ctx.selfId);
    if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
    return {
      ok: true,
      action: {
        verb: "MESSAGE",
        arguments: { recipient_id: r.player_id, text: parent_claim_id, as_claim: true, parent_claim_id },
      },
      display: `You pass a report to ${who}.`,
    };
  }
  const repeatM = trimmed.match(/^(?:repeat)\s+(\S+)\s+["'](.+)["'](?:\s+from\s+(\S+))?\s*$/i);
  if (repeatM) {
    const who = repeatM[1];
    const text = repeatM[2];
    const parent_claim_id = repeatM[3];
    if (!ctx.players || !ctx.selfId) {
      return {
        ok: true,
        action: {
          verb: "MESSAGE",
          arguments: { recipient_id: who, text, as_claim: true, parent_claim_id },
        },
        display: `You repeat a report to ${who}.`,
      };
    }
    const r = resolvePlayerTarget(who, ctx.players, ctx.selfId);
    if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
    return {
      ok: true,
      action: {
        verb: "MESSAGE",
        arguments: { recipient_id: r.player_id, text, as_claim: true, parent_claim_id },
      },
      display: `You repeat a report to ${who}.`,
    };
  }
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

  // trade for <org> <player|org> offer=energy:3 want=storage:1
  const instTradeM = trimmed.match(
    /^trade(?:\s+propose)?\s+for\s+(\S+)\s+(\S+)\s+offer=([^\s]+)\s+want=([^\s]+)(?:\s+expires=(\d+))?\s*$/i,
  );
  if (instTradeM) {
    const offered = parseResourceMap(instTradeM[3]);
    const requested = parseResourceMap(instTradeM[4]);
    if (!offered || !requested) {
      return { ok: false, error: "Trade syntax: trade for <org> <player> offer=energy:3 want=storage:1" };
    }
    let counterparty_id = instTradeM[2];
    if (!counterparty_id.startsWith("org.") && ctx.players && ctx.selfId) {
      const r = resolvePlayerTarget(instTradeM[2], ctx.players, ctx.selfId);
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
          expires_cycle: instTradeM[5] ? Number(instTradeM[5]) : undefined,
          acting_for: instTradeM[1],
        },
      },
      display: `You propose a trade for ${instTradeM[1]}.`,
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
    let acting_for: string | undefined;
    const forIdx = parts.findIndex((p) => p.toLowerCase() === "for");
    if (forIdx >= 0 && parts[forIdx + 1]) {
      acting_for = parts[forIdx + 1];
      parts.splice(forIdx, 2);
    }
    const raw = parts.join(" ").replace(/^["']|["']$/g, "");
    if (!raw) return { ok: false, error: "Repair what? Name visible infrastructure." };
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(raw, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return {
        ok: true,
        action: { verb: "COMMIT", arguments: { operation: "REPAIR", entity_id: r.entity.entity_id, acting_for } },
        display: acting_for
          ? `You repair ${titleCaseLabel(r.entity.label)} for ${acting_for}.`
          : `You repair ${titleCaseLabel(r.entity.label)}.`,
      };
    }
    return {
      ok: true,
      action: { verb: "COMMIT", arguments: { operation: "REPAIR", entity_id: raw, acting_for } },
      display: acting_for ? `You try to repair ${raw} for ${acting_for}.` : `You try to repair ${raw}.`,
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
    const acting_for = parts[1]?.toLowerCase() === "for" ? parts[2] : undefined;
    if (!trade_id) return { ok: false, error: "Accept which trade? accept <trade_id>" };
    return {
      ok: true,
      action: { verb: "TRADE", arguments: { phase: "accept", trade_id, acting_for } },
      display: acting_for ? `You accept trade ${trade_id} for ${acting_for}.` : `You accept trade ${trade_id}.`,
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

  // RFC-0023: office create/assign/vacate/retire — not listed in Chamber help.
  if (v === "office") {
    const sub = (parts[0] || "").toLowerCase();
    const rest = parts.slice(1).join(" ");
    if (sub === "create") {
      const nameM = rest.match(/name=["']([^"']+)["']/i);
      const profileM = rest.match(/\bprofile=(\S+)/i);
      const org_id = rest.replace(/name=["'][^"']+["']/i, "").replace(/\bprofile=\S+/i, "").trim();
      const display_name = nameM?.[1]?.trim() || "";
      const profile = parseOfficeProfile(profileM?.[1]);
      if (!org_id || !display_name || !profile) {
        return {
          ok: false,
          error: 'Office syntax: office create <org> name="Treasurer" profile=PUBLISH_NOTICE',
        };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_CREATE", org_id, display_name, authority_profile: profile },
        },
        display: `You create office ${display_name}.`,
      };
    }
    if (sub === "assign") {
      const replace = /\breplace\b/i.test(rest);
      const cleaned = rest.replace(/\breplace\b/i, "").trim();
      const bits = cleaned.split(/\s+/);
      const office_id = bits[0] || "";
      let agent_id = bits.slice(1).join(" ").trim();
      if (!office_id || !agent_id) {
        return { ok: false, error: "Office syntax: office assign <office_id> <player> [replace]" };
      }
      if (ctx.players && ctx.selfId) {
        const r = resolvePlayerTarget(agent_id, ctx.players, ctx.selfId);
        if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
        agent_id = r.player_id;
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_ASSIGN", office_id, agent_id, replace },
        },
        display: `You assign ${office_id}.`,
      };
    }
    if (sub === "resign" || sub === "vacate") {
      const office_id = rest.trim();
      if (!office_id) return { ok: false, error: "Office syntax: office resign <office_id>" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_VACATE", office_id },
        },
        display: `You vacate ${office_id}.`,
      };
    }
    if (sub === "retire") {
      const office_id = rest.trim();
      if (!office_id) return { ok: false, error: "Office syntax: office retire <office_id>" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_RETIRE", office_id },
        },
        display: `You retire ${office_id}.`,
      };
    }
    return {
      ok: false,
      error: 'Office syntax: office create <org> name="Treasurer" profile=PUBLISH_NOTICE',
    };
  }
  if (v === "resign") {
    const office_id = parts.join(" ").trim();
    if (!office_id) return { ok: false, error: "Resign syntax: resign <office_id>" };
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "ORG_OFFICE_VACATE", office_id },
      },
      display: `You resign ${office_id}.`,
    };
  }
  if (v === "notice") {
    const rest = parts.join(" ");
    const quoted = rest.match(/^(\S+)\s+["'](.+)["']\s*$/);
    if (!quoted) {
      return { ok: false, error: 'Notice syntax: notice <org> "text"' };
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "ORG_OFFICE_ACT", org_id: quoted[1], notice: quoted[2] },
      },
      display: `You post a notice to ${quoted[1]}.`,
    };
  }
  if (v === "emergency") {
    const sub = (parts[0] || "").toLowerCase();
    if (sub === "activate") {
      const org_id = parts[1];
      const template_id = parts[2];
      const target_ref = parts[3];
      if (!org_id || !template_id || !target_ref) {
        return { ok: false, error: "Emergency syntax: emergency activate <org> <template> <target>" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_EMERGENCY_ACTIVATE",
            org_id,
            template_id,
            target_ref,
            agent_id: parts[4],
          },
        },
        display: `You declare an emergency for ${org_id}.`,
      };
    }
    if (sub === "revoke") {
      const scope_id = parts[1];
      if (!scope_id) return { ok: false, error: "Emergency syntax: emergency revoke <scope>" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_EMERGENCY_REVOKE", emergency_scope_id: scope_id },
        },
        display: `You revoke ${scope_id}.`,
      };
    }
    return { ok: false, error: "Emergency syntax: emergency activate <org> <template> <target>" };
  }
  if (v === "succession") {
    const sub = (parts[0] || "").toLowerCase();
    let office_id: string | undefined;
    let emergency_scope_id: string | undefined;
    let names: string[] = [];
    if (sub === "scope") {
      emergency_scope_id = parts[1];
      names = parts.slice(2);
    } else {
      office_id = parts[0];
      names = parts.slice(1);
    }
    if ((!office_id && !emergency_scope_id) || !names.length) {
      return {
        ok: false,
        error: "Succession syntax: succession <office> <player> [player2]",
      };
    }
    if (names.length > 2) {
      return { ok: false, error: "At most two designated successors.", code: "FORBIDDEN" };
    }
    const successors: string[] = [];
    for (const raw of names) {
      let id = raw;
      if (ctx.players && ctx.selfId) {
        const r = resolvePlayerTarget(raw, ctx.players, ctx.selfId);
        if (!r.ok) return { ok: false, error: r.message, code: r.code, choices: r.choices };
        id = r.player_id;
      }
      if (id && !successors.includes(id)) successors.push(id);
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "ORG_SUCCESSION_DESIGNATE",
          office_id,
          emergency_scope_id,
          successors,
        },
      },
      display: "You designate a successor.",
    };
  }

  // RFC-0024: reconstruct / revise — not listed in Chamber help.
  if (v === "reconstruct" || v === "assemble") {
    const rest = parts.join(" ");
    const quoted = rest.match(/["'](.+)["']/);
    const claim = quoted?.[1]?.trim() || "";
    const visM = rest.match(/\b(public|private|institutional)\b/i);
    const evM = rest.match(/\bevidence=([a-z,_-]+)/i);
    const orgM = rest.match(/\borg=(\S+)/i);
    const before = rest
      .replace(/["'](.+)["']/, "")
      .replace(/\bevidence=\S+/i, "")
      .replace(/\borg=\S+/i, "")
      .replace(/\b(public|private|institutional)\b/i, "")
      .trim();
    if (!before || !claim) {
      return {
        ok: false,
        error: 'Reconstruct syntax: reconstruct <subject> "account" evidence=archive,inspect [private|public]',
      };
    }
    const evidence = (evM?.[1] || "archive,inspect")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "RECONSTRUCT",
          subject_ref: before,
          claim,
          evidence,
          visibility: parseVisibility(visM?.[1]),
          org_id: orgM?.[1],
        },
      },
      display: `You record a reconstruction of ${before}.`,
    };
  }
  if (v === "revise") {
    const rest = parts.join(" ");
    const quoted = rest.match(/["'](.+)["']/);
    const claim = quoted?.[1]?.trim() || "";
    const reconstruction_id = rest.replace(/["'](.+)["']/, "").trim();
    if (!reconstruction_id || !claim) {
      return { ok: false, error: 'Revise syntax: revise <reconstruction_id> "account"' };
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "RECONSTRUCT_SUPERSEDE", reconstruction_id, claim },
      },
      display: `You revise ${reconstruction_id}.`,
    };
  }

  // RFC-0020: attest <artifact> subject=<id> claim=DESTROYED|OPERATING
  // Not listed in Chamber help. Do not infer subject/claim from labels.
  if (v === "attest") {
    const rest = parts.join(" ");
    const subjectM = rest.match(/\bsubject=(\S+)/i);
    const claimM = rest.match(/\bclaim=(\S+)/i);
    if (!subjectM && !claimM) {
      return {
        ok: false,
        error: "Attest syntax: attest <artifact> subject=<entity_id> claim=DESTROYED|OPERATING",
      };
    }
    if (!subjectM || !claimM) {
      return { ok: false, error: "Subject and claim must be set together.", code: "FORBIDDEN" };
    }
    const claimRaw = claimM[1].toUpperCase();
    if (claimRaw !== "DESTROYED" && claimRaw !== "OPERATING") {
      return { ok: false, error: "Claim must be DESTROYED or OPERATING.", code: "FORBIDDEN" };
    }
    const before = rest
      .replace(/\bsubject=\S+/i, "")
      .replace(/\bclaim=\S+/i, "")
      .trim();
    if (!before) return { ok: false, error: "Name a visible artifact." };
    let entity_id = before;
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(before, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      entity_id = r.entity.entity_id;
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "ATTEST",
          entity_id,
          subject_entity_id: subjectM[1],
          archive_claim: claimRaw,
        },
      },
      display: `You attest ${entity_id}.`,
    };
  }

  if (isForbiddenContestVerb(v)) {
    return {
      ok: false,
      error: `“${v}” is not a legal verb.`,
      code: "VERB_FORBIDDEN",
    };
  }

  // GC7-S0: contest <form> <target> stake=energy:10,influence:6
  // Not listed in Chamber help.
  if (v === "contest") {
    const rest = parts.join(" ");
    const stakeM = rest.match(/\bstake=([^\s]+)/i);
    if (!stakeM) {
      return { ok: false, error: "Contest syntax: contest <form> <target> stake=energy:10,influence:6" };
    }
    const stake = parseResourceMap(stakeM[1]);
    if (!stake) return { ok: false, error: "Stake must be resource:amount pairs.", code: "INVALID_REQUEST" };
    const beforeStake = rest.slice(0, stakeM.index).trim();
    const bits = beforeStake.split(/\s+/).filter(Boolean);
    const form = parseContestForm(bits.shift() || "");
    if (!form) return { ok: false, error: "That contest form is not allowed.", code: "FORM_FORBIDDEN" };
    const targetRaw = bits.join(" ");
    if (!targetRaw) return { ok: false, error: "Name a contest target." };
    const expiresM = rest.match(/\bexpires=(\d+)/i);
    const target = resolveContestTarget(form, targetRaw, ctx);
    if (!target.ok) return { ok: false, error: target.error, code: target.code, choices: target.choices };
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: {
          operation: "CONTEST_DECLARE",
          contest_form: form,
          target: target.target,
          stake,
          expires_cycle: expiresM ? Number(expiresM[1]) : undefined,
        },
      },
      display: `You declare a ${form.replace(/_/g, " ").toLowerCase()} contest.`,
    };
  }
  if (v === "defend") {
    const rest = parts.join(" ");
    const stakeM = rest.match(/\bstake=([^\s]+)/i);
    const contest_id = (stakeM ? rest.slice(0, stakeM.index) : rest).trim().split(/\s+/)[0] || "";
    if (!contest_id || !stakeM) {
      return { ok: false, error: "Defend syntax: defend <contest_id> stake=energy:10,influence:6" };
    }
    const stake = parseResourceMap(stakeM[1]);
    if (!stake) return { ok: false, error: "Stake must be resource:amount pairs.", code: "INVALID_REQUEST" };
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "CONTEST_DEFEND", contest_id, stake },
      },
      display: `You defend ${contest_id}.`,
    };
  }
  // RFC-0026: withdraw <contest_id> — not listed in Chamber help. Not MOVE.
  if (v === "withdraw" || v === "retreat" || v === "disengage") {
    const contest_id = parts.join(" ").trim().split(/\s+/)[0] || "";
    if (!contest_id) {
      return { ok: false, error: "Withdraw syntax: withdraw <contest_id>" };
    }
    return {
      ok: true,
      action: {
        verb: "COMMIT",
        arguments: { operation: "CONTEST_WITHDRAW", contest_id },
      },
      display: `You withdraw from ${contest_id}.`,
    };
  }

  // GC2-S0: construct <class> / build <class> / dismantle <entity>
  // Not listed in Chamber help.
  if (v === "construct" || v === "build") {
    const classRaw = parts.join(" ");
    if (!classRaw) {
      return { ok: false, error: "Name a class: relay, generator, storage_bay, production_node." };
    }
    const classId = parseConstructibleClass(classRaw);
    if (!classId) {
      return { ok: false, error: "That class cannot be constructed.", code: "CLASS_FORBIDDEN" };
    }
    return {
      ok: true,
      action: { verb: "BUILD", arguments: { operation: "CONSTRUCT", class: classId } },
      display: `You construct a ${classId.replace(/_/g, " ")}.`,
    };
  }
  if (v === "dismantle") {
    const raw = parts.join(" ").replace(/^["']|["']$/g, "");
    if (!raw) return { ok: false, error: "Dismantle what? Name visible infrastructure." };
    if (ctx.entities && ctx.entities.length) {
      const r = resolveVisibleEntity(raw, ctx.entities);
      if (!r.ok) return { ok: false, error: formatAmbiguous(r), code: r.code, choices: r.choices };
      return {
        ok: true,
        action: { verb: "BUILD", arguments: { operation: "DISMANTLE", entity_id: r.entity.entity_id } },
        display: `You dismantle ${titleCaseLabel(r.entity.label)}.`,
      };
    }
    return {
      ok: true,
      action: { verb: "BUILD", arguments: { operation: "DISMANTLE", entity_id: raw } },
      display: `You try to dismantle ${raw}.`,
    };
  }

  // Known but not hosted yet (v0.2 strategic)
  if (["agreement", "terminate", "access"].includes(v)) {
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
    const parent_claim_id = args.parent_claim_id ? String(args.parent_claim_id) : undefined;
    const subject_ref = args.subject_ref ? String(args.subject_ref) : undefined;
    const as_claim = Boolean(args.as_claim || parent_claim_id || subject_ref);
    if (!recipient_id || (!text && !parent_claim_id)) {
      return { ok: false, error: "recipient_id and text required", code: "INVALID_REQUEST" };
    }
    return {
      ok: true,
      action: {
        verb: "MESSAGE",
        arguments: { recipient_id, text: text || parent_claim_id || "", as_claim, parent_claim_id, subject_ref },
      },
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
          acting_for: args.acting_for ? String(args.acting_for) : undefined,
          office_id: args.office_id ? String(args.office_id) : undefined,
          emergency_scope_id: args.emergency_scope_id ? String(args.emergency_scope_id) : undefined,
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
            amount: args.amount != null ? Number(args.amount) : undefined,
            acting_for: args.acting_for ? String(args.acting_for) : undefined,
            office_id: args.office_id ? String(args.office_id) : undefined,
            emergency_scope_id: args.emergency_scope_id ? String(args.emergency_scope_id) : undefined,
          },
        },
        display: `${operation} ${entity_id}`,
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
    if (operation === "CONTEST_DECLARE") {
      const form = parseContestForm(String(args.contest_form || args.form || ""));
      if (!form) {
        return { ok: false, error: "contest_form must be one of the four closed forms", code: "FORM_FORBIDDEN" };
      }
      const stake = (args.stake as Record<string, number>) || undefined;
      if (!stake) return { ok: false, error: "stake required", code: "INVALID_REQUEST" };
      const target = args.target as ContestTarget | undefined;
      if (!target || typeof target !== "object" || !("kind" in target)) {
        return { ok: false, error: "target required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "CONTEST_DECLARE",
            contest_form: form,
            target,
            stake,
            expires_cycle: args.expires_cycle != null ? Number(args.expires_cycle) : undefined,
            seed_stream_id: args.seed_stream_id ? String(args.seed_stream_id) : undefined,
            defender_id: args.defender_id ? String(args.defender_id) : undefined,
          },
        },
        display: `COMMIT.CONTEST_DECLARE ${form}`,
      };
    }
    if (operation === "CONTEST_DEFEND") {
      const contest_id = String(args.contest_id || "").trim();
      const stake = (args.stake as Record<string, number>) || undefined;
      if (!contest_id || !stake) {
        return { ok: false, error: "contest_id and stake required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "CONTEST_DEFEND", contest_id, stake },
        },
        display: `COMMIT.CONTEST_DEFEND ${contest_id}`,
      };
    }
    if (operation === "CONTEST_WITHDRAW") {
      const contest_id = String(args.contest_id || "").trim();
      if (!contest_id) return { ok: false, error: "contest_id required", code: "INVALID_REQUEST" };
      const expectedRaw = args.expected_status ? String(args.expected_status).toUpperCase() : "";
      const expected_status =
        expectedRaw === "OPEN" || expectedRaw === "CLOSED" ? (expectedRaw as "OPEN" | "CLOSED") : undefined;
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "CONTEST_WITHDRAW", contest_id, expected_status },
        },
        display: `COMMIT.CONTEST_WITHDRAW ${contest_id}`,
      };
    }
    if (operation === "ATTEST") {
      const entity_id = String(args.entity_id || args.target || "").trim();
      const subject_entity_id = String(args.subject_entity_id || args.subject || "").trim();
      const claimRaw = String(args.archive_claim || args.claim || "").toUpperCase();
      if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
      if (!subject_entity_id || (claimRaw !== "DESTROYED" && claimRaw !== "OPERATING")) {
        return { ok: false, error: "subject_entity_id and claim must be set together", code: "FORBIDDEN" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ATTEST",
            entity_id,
            subject_entity_id,
            archive_claim: claimRaw as "DESTROYED" | "OPERATING",
          },
        },
        display: `COMMIT.ATTEST ${entity_id}`,
      };
    }
    if (operation === "ORG_OFFICE_CREATE") {
      const org_id = String(args.org_id || "").trim();
      const display_name = String(args.display_name || args.name || "").trim();
      const profile = parseOfficeProfile(String(args.authority_profile || args.profile || ""));
      if (!org_id || !display_name || !profile) {
        return { ok: false, error: "org_id, display_name, and profile required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_OFFICE_CREATE",
            org_id,
            display_name,
            authority_profile: profile,
            object_set: sanitizeIdList(args.object_set),
            office_precedence: sanitizePrecedence(args.office_precedence),
          },
        },
        display: `COMMIT.ORG_OFFICE_CREATE ${display_name}`,
      };
    }
    if (operation === "ORG_OFFICE_ASSIGN") {
      const office_id = String(args.office_id || "").trim();
      const agent_id = String(args.agent_id || args.player_id || "").trim();
      if (!office_id || !agent_id) {
        return { ok: false, error: "office_id and agent_id required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_OFFICE_ASSIGN",
            office_id,
            agent_id,
            replace: Boolean(args.replace),
          },
        },
        display: `COMMIT.ORG_OFFICE_ASSIGN ${office_id}`,
      };
    }
    if (operation === "ORG_OFFICE_VACATE") {
      const office_id = String(args.office_id || "").trim();
      if (!office_id) return { ok: false, error: "office_id required", code: "INVALID_REQUEST" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_VACATE", office_id },
        },
        display: `COMMIT.ORG_OFFICE_VACATE ${office_id}`,
      };
    }
    if (operation === "ORG_OFFICE_RETIRE") {
      const office_id = String(args.office_id || "").trim();
      if (!office_id) return { ok: false, error: "office_id required", code: "INVALID_REQUEST" };
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_RETIRE", office_id },
        },
        display: `COMMIT.ORG_OFFICE_RETIRE ${office_id}`,
      };
    }
    if (operation === "ORG_OFFICE_ACT") {
      const org_id = String(args.org_id || "").trim();
      const office_id = String(args.office_id || "").trim();
      const notice = args.notice != null ? String(args.notice) : undefined;
      if (!org_id && !office_id) {
        return { ok: false, error: "org_id or office_id required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_OFFICE_ACT", org_id: org_id || undefined, office_id: office_id || undefined, notice },
        },
        display: "COMMIT.ORG_OFFICE_ACT",
      };
    }
    if (operation === "ORG_EMERGENCY_ACTIVATE") {
      const org_id = String(args.org_id || "").trim();
      const template_id = String(args.template_id || "").trim();
      const target_ref = String(args.target_ref || args.entity_id || "").trim();
      if (!org_id || !template_id || !target_ref) {
        return { ok: false, error: "org_id, template_id, and target_ref required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_EMERGENCY_ACTIVATE",
            org_id,
            template_id,
            target_ref,
            agent_id: args.agent_id ? String(args.agent_id) : undefined,
            office_id: args.office_id ? String(args.office_id) : undefined,
            reason: args.reason ? String(args.reason) : undefined,
          },
        },
        display: `COMMIT.ORG_EMERGENCY_ACTIVATE ${template_id}`,
      };
    }
    if (operation === "ORG_EMERGENCY_REVOKE") {
      const emergency_scope_id = String(args.emergency_scope_id || args.scope_id || "").trim();
      if (!emergency_scope_id) {
        return { ok: false, error: "emergency_scope_id required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: { operation: "ORG_EMERGENCY_REVOKE", emergency_scope_id },
        },
        display: `COMMIT.ORG_EMERGENCY_REVOKE ${emergency_scope_id}`,
      };
    }
    if (operation === "ORG_EMERGENCY_DEFINE") {
      return { ok: false, error: "Define is founder-only via structured template in this slice", code: "FORBIDDEN" };
    }
    if (operation === "ORG_SUCCESSION_DESIGNATE") {
      const office_id = String(args.office_id || "").trim();
      const emergency_scope_id = String(args.emergency_scope_id || args.scope_id || "").trim();
      const successors = Array.isArray(args.successors)
        ? (args.successors as unknown[]).map((s) => String(s || "").trim()).filter(Boolean)
        : [String(args.agent_id || args.player_id || "").trim()].filter(Boolean);
      if ((!office_id && !emergency_scope_id) || !successors.length) {
        return { ok: false, error: "office_id or emergency_scope_id and successors required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "ORG_SUCCESSION_DESIGNATE",
            office_id: office_id || undefined,
            emergency_scope_id: emergency_scope_id || undefined,
            successors: successors.slice(0, 2),
          },
        },
        display: "COMMIT.ORG_SUCCESSION_DESIGNATE",
      };
    }
    if (operation === "RECONSTRUCT") {
      const subject_ref = String(args.subject_ref || args.subject || args.entity_id || "").trim();
      const claim = String(args.claim || args.narrative || "").trim();
      if (!subject_ref || !claim) {
        return { ok: false, error: "subject_ref and claim required", code: "INVALID_REQUEST" };
      }
      const evidence = Array.isArray(args.evidence)
        ? (args.evidence as string[]).map(String)
        : [];
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "RECONSTRUCT",
            subject_ref,
            claim,
            evidence,
            visibility: parseVisibility(String(args.visibility || "PRIVATE")),
            org_id: args.org_id ? String(args.org_id) : undefined,
          },
        },
        display: `COMMIT.RECONSTRUCT ${subject_ref}`,
      };
    }
    if (operation === "RECONSTRUCT_SUPERSEDE") {
      const reconstruction_id = String(args.reconstruction_id || args.supersedes_reconstruction_id || "").trim();
      const claim = String(args.claim || args.narrative || "").trim();
      if (!reconstruction_id || !claim) {
        return { ok: false, error: "reconstruction_id and claim required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "RECONSTRUCT_SUPERSEDE",
            reconstruction_id,
            claim,
            evidence: Array.isArray(args.evidence) ? (args.evidence as string[]).map(String) : undefined,
          },
        },
        display: `COMMIT.RECONSTRUCT_SUPERSEDE ${reconstruction_id}`,
      };
    }
    if (operation === "RECONSTRUCT_PUBLISH") {
      const reconstruction_id = String(args.reconstruction_id || "").trim();
      if (!reconstruction_id) {
        return { ok: false, error: "reconstruction_id required", code: "INVALID_REQUEST" };
      }
      return {
        ok: true,
        action: {
          verb: "COMMIT",
          arguments: {
            operation: "RECONSTRUCT_PUBLISH",
            reconstruction_id,
            visibility: parseVisibility(String(args.visibility || "PUBLIC")),
            org_id: args.org_id ? String(args.org_id) : undefined,
          },
        },
        display: `COMMIT.RECONSTRUCT_PUBLISH ${reconstruction_id}`,
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
  if (cmd === "BUILD") {
    const operation = String(args.operation || "").toUpperCase();
    if (operation === "CONSTRUCT") {
      const classId = parseConstructibleClass(String(args.class || args.class_id || args.target || ""));
      if (!classId) {
        return { ok: false, error: "class required (relay|generator|storage_bay|production_node)", code: "CLASS_FORBIDDEN" };
      }
      return {
        ok: true,
        action: {
          verb: "BUILD",
          arguments: {
            operation: "CONSTRUCT",
            class: classId,
            room_id: args.room_id ? String(args.room_id) : undefined,
          },
        },
        display: `BUILD.CONSTRUCT ${classId}`,
      };
    }
    if (operation === "DISMANTLE") {
      const entity_id = String(args.entity_id || args.target || "").trim();
      if (!entity_id) return { ok: false, error: "entity_id required", code: "INVALID_REQUEST" };
      return {
        ok: true,
        action: { verb: "BUILD", arguments: { operation: "DISMANTLE", entity_id } },
        display: `BUILD.DISMANTLE ${entity_id}`,
      };
    }
    return { ok: false, error: "BUILD operation must be CONSTRUCT or DISMANTLE", code: "INVALID_REQUEST" };
  }
  if (cmd === "CONTEST_DECLARE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "CONTEST_DECLARE" });
  }
  if (cmd === "CONTEST_DEFEND") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "CONTEST_DEFEND" });
  }
  if (cmd === "CONTEST_WITHDRAW") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "CONTEST_WITHDRAW" });
  }
  if (cmd === "ATTEST") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ATTEST" });
  }
  if (isForbiddenContestVerb(cmd.toLowerCase())) {
    return { ok: false, error: `“${cmd}” is not a legal verb.`, code: "VERB_FORBIDDEN" };
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
  if (cmd === "ORG_OFFICE_CREATE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_OFFICE_CREATE" });
  }
  if (cmd === "ORG_OFFICE_ASSIGN") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_OFFICE_ASSIGN" });
  }
  if (cmd === "ORG_OFFICE_VACATE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_OFFICE_VACATE" });
  }
  if (cmd === "ORG_OFFICE_RETIRE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_OFFICE_RETIRE" });
  }
  if (cmd === "ORG_OFFICE_ACT") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_OFFICE_ACT" });
  }
  if (cmd === "ORG_SUCCESSION_DESIGNATE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "ORG_SUCCESSION_DESIGNATE" });
  }
  if (cmd === "RECONSTRUCT") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "RECONSTRUCT" });
  }
  if (cmd === "RECONSTRUCT_SUPERSEDE") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "RECONSTRUCT_SUPERSEDE" });
  }
  if (cmd === "RECONSTRUCT_PUBLISH") {
    return normalizeStructuredCommand("COMMIT", { ...args, operation: "RECONSTRUCT_PUBLISH" });
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
      const createOk = canPay(budgets, COSTS.ORG_OFFICE_CREATE);
      out.push({
        action: "ORG_OFFICE_CREATE",
        verb: "COMMIT",
        operation: "ORG_OFFICE_CREATE",
        label: `Create notice office in ${org.name}`,
        cmd: `office create ${org.org_id} name="Notice" profile=PUBLISH_NOTICE`,
        target_id: org.org_id,
        requires: COSTS.ORG_OFFICE_CREATE,
        available: createOk,
        kind: "org",
      });
    }
    for (const office of Object.values(org.offices || {})) {
      if (office.status === "RETIRED") continue;
      if (officer && office.status === "VACANT") {
        for (const p of otherPlayers) {
          if (p.player_id === selfId || !isOrgMember(org, p.player_id)) continue;
          const handle = p.handle || p.player_id.replace(/^player\./, "");
          out.push({
            action: "ORG_OFFICE_ASSIGN",
            verb: "COMMIT",
            operation: "ORG_OFFICE_ASSIGN",
            label: `Assign ${office.display_name} to ${handle}`,
            cmd: `office assign ${office.office_id} ${handle}`,
            target_id: office.office_id,
            target_label: handle,
            requires: COSTS.ORG_OFFICE_ASSIGN,
            available: canPay(budgets, COSTS.ORG_OFFICE_ASSIGN),
            kind: "org",
          });
        }
      }
      if (office.status === "OCCUPIED" && office.holder_player_id === selfId) {
        out.push({
          action: "ORG_OFFICE_VACATE",
          verb: "COMMIT",
          operation: "ORG_OFFICE_VACATE",
          label: `Resign ${office.display_name}`,
          cmd: `resign ${office.office_id}`,
          target_id: office.office_id,
          requires: COSTS.ORG_OFFICE_VACATE,
          available: canPay(budgets, COSTS.ORG_OFFICE_VACATE),
          kind: "org",
        });
        if (office.authority_profile === "PUBLISH_NOTICE") {
          out.push({
            action: "ORG_OFFICE_ACT",
            verb: "COMMIT",
            operation: "ORG_OFFICE_ACT",
            label: `Post notice for ${org.name}`,
            cmd: `notice ${org.org_id} "posted"`,
            target_id: org.org_id,
            requires: COSTS.ORG_OFFICE_ACT,
            available: canPay(budgets, COSTS.ORG_OFFICE_ACT),
            kind: "org",
          });
        }
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
    lines.push("  trade for <org> <player> offer=energy:3 want=storage:1");
    lines.push("  accept <trade> for <org>");
    lines.push("  repair <infrastructure> for <org>");
    lines.push("  Institution lots come from that org's treasury. A vacant office cannot act.");
    lines.push("  emergency activate <org> <template> <target>");
    lines.push("  emergency revoke <scope>");
    lines.push("  Emergency authority is temporary and predeclared. Saying emergency is not a grant.");
    lines.push("  succession <office> <player> [player2]");
    lines.push("  succession scope <scope> <player> [player2]");
    lines.push("  Designation is explicit. Vacancy without a successor is allowed.");
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
  if (c === "SLOT_OCCUPIED") return { primary: "That class is already present here.", advanced: `${c}: ${m}` };
  if (c === "NOT_OWNER") return { primary: "You do not own that.", advanced: `${c}: ${m}` };
  if (c === "NOT_COLOCATED") return { primary: "You must be in that room.", advanced: `${c}: ${m}` };
  if (c === "NOT_OBSERVABLE") return { primary: "That place cannot be used for construction.", advanced: `${c}: ${m}` };
  if (c === "CLASS_FORBIDDEN") return { primary: "That class cannot be constructed.", advanced: `${c}: ${m}` };
  if (c === "FORM_FORBIDDEN") return { primary: "That contest form is not allowed.", advanced: `${c}: ${m}` };
  if (c === "VERB_FORBIDDEN") return { primary: "That action is not used here.", advanced: `${c}: ${m}` };
  if (c === "TRADE_REJECTED" || c === "TRADE_FAILED") return { primary: m, advanced: c };
  if (m && !/^[A-Z_]+$/.test(m)) return { primary: m, advanced: c || undefined };
  return { primary: "Something blocked that action.", advanced: c ? `${c}: ${m}` : m };
}
