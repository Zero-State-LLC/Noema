/** Env bindings for the Noema gateway Worker. */
export interface Env {
  WORLD_DO: DurableObjectNamespace;
  NOEMA_ENV: string;
  NOEMA_PROTOCOL_VERSION: string;
  DEFAULT_WORLD_ID: string;
  /** Static marketing splash + assets (wrangler [assets]). */
  ASSETS: Fetcher;
  /** Shared with Python IdentityService for controller access tokens. */
  TOKEN_SIGNING_SECRET?: string;
  /** Legacy Supabase JWT secret (HS256). Optional when the project signs with ES256 JWKS. */
  SUPABASE_JWT_SECRET?: string;
  /** Project URL — used for ES256 JWKS at /auth/v1/.well-known/jwks.json */
  SUPABASE_URL?: string;
  /** Optional Supabase Management API token. Break-glass operations only. */
  SUPABASE_ACCESS_TOKEN?: string;
  /** Hosted Supabase project reference. May be derived from SUPABASE_URL for inspection. */
  SUPABASE_PROJECT_REF?: string;
  /** Canonical settlement world row inspected by the admin provider gate. */
  SUPABASE_CANONICAL_WORLD_ID?: string;
  /** Settlement only — never expose to clients/agents. */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /**
   * Operator token for ADMIN control plane (Specs: admin ≠ player).
   * Never grant to player Controllers. Optional in local; required for hosted admin.
   */
  ADMIN_OPERATOR_TOKEN?: string;
  /** Comma-separated operator mailboxes. Secret — never [vars] or /health. */
  ADMIN_ALLOWLIST_EMAILS?: string;
  /**
   * Cloudflare Email Routing send binding.
   * Locked to zer0state@zer0state.com in wrangler.toml.
   */
  ADMIN_MAIL?: {
    send(message: unknown): Promise<void | { messageId?: string }>;
  };
  /** Resend API key — transactional provider for PLAY/ADMIN/agent letters. */
  RESEND_API_KEY?: string;
  /** Optional verified Resend sender override. */
  RESEND_FROM_EMAIL?: string;
}

/** Operator principal — separate from PlayerPrincipal (PLATFORM / AUTH). */
export interface AdminPrincipal {
  role: "ADMIN";
  session_id: string;
  scopes: string[];
  authentication_context: "operator_token" | "email_magic_link";
  /** Opaque operator scope id. Never an email. Shared token operators use `op.token`. */
  operator_id: string;
}

/** Live inhabit issuance is agent-only. human/hybrid remain historical compatibility. */
export type LiveControllerType = "agent";
export type LegacyControllerType = "human" | "hybrid" | "agent";
export type ControllerType = LegacyControllerType;

/** Human platform principal. MUST NOT carry player_id or world-mutation scopes. RFC-0120. */
export interface HumanPrincipal {
  kind: "human";
  identity_id: string;
  account_id?: string;
  session_id: string;
  roles: Array<"spectator" | "authorizer" | "researcher" | "admin">;
  permissions: string[];
  scopes: string[];
  amr?: string;
  protocol_version: string;
  authentication_context: string;
  /** Display-only leftover; never inhabit authority. */
  controller_type?: "human" | "hybrid";
}

/**
 * Agent Player principal consumed by the World Engine.
 * Only `controller_type: "agent"` may inhabit via applyPlayerCommand.
 */
export interface PlayerPrincipal {
  kind?: "agent_player";
  player_id: string;
  agent_id: string;
  identity_id?: string;
  session_id: string;
  controller_id: string;
  controller_type: ControllerType;
  issued_by?: string;
  /** Set when an ADMIN minted or enrolled this Controller. Opaque — not an email. */
  operator_id?: string;
  amr?: string;
  /** JWT id; used for credential rotation. */
  jti?: string;
  scopes: string[];
  protocol_version: string;
  authentication_context: string;
}

export type Principal = HumanPrincipal | PlayerPrincipal;

export function isHumanPrincipal(p: Principal): p is HumanPrincipal {
  return p.kind === "human";
}

export function isAgentPlayerPrincipal(p: Principal): p is PlayerPrincipal {
  if (p.kind === "human") return false;
  return typeof (p as PlayerPrincipal).player_id === "string" && (p as PlayerPrincipal).player_id.length > 0;
}

export interface CommandEnvelope {
  protocol_version?: string;
  request_id: string;
  idempotency_key?: string;
  session_id?: string;
  command: string;
  arguments?: Record<string, unknown>;
  client?: { type?: string; runtime?: string };
  /** Never trusted for authority — observational only. */
  player_id?: string;
  /** Isolated test tenant only when dual-auth is present. Omitted = DEFAULT_WORLD_ID. */
  world_id?: string;
}

export interface ObservationTrace {
  kind: "scar" | "construction" | "notice";
  text: string;
  visibility: "public";
}

export interface ObservationEntity {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  stock_resource?: string;
  stock_amount?: number;
  max_stock?: number;
  regen_rate?: number;
  repairable?: boolean;
  harvestable?: boolean;
  scar?: boolean;
}

export interface ObservationAffordance {
  action: string;
  verb: string;
  operation?: string;
  label: string;
  cmd: string;
  target_id?: string;
  target_label?: string;
  /** GC1-S8. Structured REPAIR overhaul. Omitted for standard repair. */
  extent?: "overhaul";
  /** GC1-S7. Structured FOCUS track. Omitted when `clear` is set. */
  track?: "explorer" | "surveyor" | "broker" | "engineer";
  /** GC1-S7. Structured FOCUS clear. */
  clear?: boolean;
  /** GC2. Structured BUILD.CONSTRUCT class. */
  class?: string;
  /** RFC-0020. Structured ATTEST subject entity. */
  subject_id?: string;
  archive_claim?: "DESTROYED" | "OPERATING";
  /** GC2-S10. Structured BUILD.VEST institution. */
  org_id?: string;
  /** GC2-S11. Structured BUILD.SHARE partner. */
  player_id?: string;
  /** GC2-S12. Structured BUILD.CONNECT dest (direction or room id). */
  dest?: string;
  /** GC7. Structured CONTEST form / target / stake. */
  contest_form?: string;
  target?: {
    kind: string;
    entity_id?: string;
    exit_id?: string;
    room_id?: string;
    agent_id?: string;
    holder_id?: string;
    resource?: string;
    amount?: number;
  };
  contest_id?: string;
  stake?: Record<string, number>;
  /** RFC-0100. Structured AGREEMENT type / parties / id. */
  agreement_type?: string;
  party_ids?: string[];
  agreement_id?: string;
  /** RFC-0100. Catalog terminate reason. Not the unavailable-copy `reason`. */
  agreement_reason?: string;
  /** RFC-0104. Structured ACCESS_POLICY. */
  scope?: "EXIT" | "ROOM";
  mode?: "DENY" | "CLEAR" | "ALLOW_ONLY";
  applies_to?: string;
  direction?: string;
  acting_for?: string;
  office_id?: string;
  /** RFC-0024. Structured RECONSTRUCT subject / account / record. */
  subject_ref?: string;
  claim?: string;
  visibility?: "PRIVATE" | "INSTITUTIONAL" | "PUBLIC";
  reconstruction_id?: string;
  evidence?: string[];
  /** GC4. Structured emergency / succession. */
  template_id?: string;
  target_ref?: string;
  emergency_scope_id?: string;
  successors?: string[];
  rule_id?: string;
  requires?: Record<string, number>;
  available: boolean;
  reason?: string;
  kind: string;
}

export interface Observation {
  cycle: number;
  sequence: number;
  /** World display name when known (never seed / profile / story seeds). */
  world_name?: string;
  /** Absent when the live snapshot has no playable room. */
  location?: {
    room_id: string;
    name: string;
    description: string;
    /** Short local condition derived for UI (presentation only). */
    condition?: string;
    exits: Array<{ direction: string; to_room_id: string; to_room_name?: string }>;
    entities: ObservationEntity[];
    traces?: ObservationTrace[];
    co_evolution?: { harvest_pressure?: number; regen_mod?: number };
    genesis_evolutions?: Array<{ cycle: number; kind: string; details: string }>;
  };
  /** AGENT-ORIENTATION-S1: live place + strain-if-present. Never a thesis. */
  situation?: { place: string; strain?: string };
  /** Feature B PRESSURE. Same local band as location.condition. Derived, not WorldState. */
  pressure?: string;
  /** GC1-S7 self focus line. */
  focus_lines?: string[];
  player_id: string;
  signaling_quality?: number;
  drift_alerts?: string[];
  cascading_risk?: number;
  /** False after LEAVE_WORLD or before ENTER_WORLD. */
  in_world?: boolean;
  /** Self budgets (Player-visible). */
  budgets?: {
    attention: number;
    compute: number;
    energy: number;
    influence: number;
    storage: number;
  };
  /** Delivered inbox (private — never WATCH). */
  messages?: Array<{
    message_id: string;
    sender_id: string;
    text: string;
    delivered_cycle: number;
  }>;
  /** Open trades involving self. */
  trades?: Array<{
    trade_id: string;
    proposer_id: string;
    counterparty_id: string;
    offered: Record<string, number>;
    requested: Record<string, number>;
    status: string;
    role: "proposer" | "counterparty";
  }>;
  /** Active organizations (public membership projection). */
  organizations?: Array<{
    org_id: string;
    name: string;
    charter: string;
    status: string;
    creator_id: string;
    members: Array<{ agent_id: string; role: string }>;
    my_role: string | null;
    offices?: Array<{
      office_id: string;
      display_name: string;
      status: string;
      holder_player_id?: string;
      holder_handle?: string;
      authority_profile: string;
    }>;
    public_notice?: string;
    treasury?: {
      attention: number;
      compute: number;
      energy: number;
      influence: number;
      storage: number;
    };
  }>;
  /** Other active players (addressable handles, no secrets). GC1-S6 may add public_practice_lines. */
  players_here?: Array<{
    player_id: string;
    handle?: string;
    public_practice_lines?: string[];
    public_focus_lines?: string[];
  }>;
  /** Legacy string list + structured affordances */
  available_actions: string[];
  affordances?: ObservationAffordance[];
  /** Last action consequence for UI */
  consequence?: string;
  /** Feature B room text (name → HERE → EXITS → STATUS → HAPPENED). Derived. */
  play_text?: string;
  /** GC1 self-only practice lines. Never put first-person lines on WATCH. */
  practice_lines?: string[];
  /** GC8-S1 self-only worn holdings. Never put on WATCH. */
  lot_lines?: string[];
  /** GC3-S0 self-only trade-memory lines. Never put on WATCH or players_here. */
  social_memory_lines?: string[];
  /** GC9-S0 site custom lines for the current room. Never put on WATCH. */
  culture_lines?: string[];
  /** GC6-S0 self-only archive/inspect contradiction. Never put on WATCH. */
  discovery_lines?: string[];
  /** GC4-S1 institution office summary. Public names/holders only. */
  office_lines?: string[];
  /** GC6-S1 reconstruction accounts the viewer may see. Not canonical truth. */
  reconstruction_lines?: string[];
  /** GC5-S2 held-claim lines. Never put on WATCH. Not truth. */
  rumor_lines?: string[];
  /** GC5-S5 room board notices. Last 5. Public room only. Never put on WATCH. */
  board_lines?: string[];
  /** GC5-S4 last room shout. Public room only. Never put on WATCH. */
  shout_lines?: string[];
  /** GC5-S6 last institution notice. Public room only. Never put on WATCH. */
  notice_lines?: string[];
  /** GC5-S7 last org channel notes. Current members only. Never put on WATCH. */
  channel_lines?: string[];
  /** GC5-S8 last trade notice. Public room only. Never put on WATCH. */
  trade_notice_lines?: string[];
  /** WR-S0 last public world report. Never put on WATCH. */
  report_lines?: string[];
  /** GC2-S7 UNCLAIMED public constructibles. Never put on WATCH. */
  unclaimed_lines?: string[];
  /** GC7-S0 public contest band. No hidden ids, holdings, or HP. */
  contests?: Array<{
    contest_id: string;
    contest_form: string;
    room_id: string;
    status: string;
    expires_cycle: number;
  }>;
  /** Location-bound World Services (adapters, not Players). */
  services?: Array<{
    service_id: string;
    display_name: string;
    role: string;
    status: string;
    operations: string[];
    cannot: string[];
    suggested_cmds: string[];
    line: string;
  }>;
}

export type { ActionSignal, SignalGrounding } from "./signal";

/** P3: Lightweight per-agent belief state (expectations, policy prefs). */
export interface BeliefState {
  expected_regen?: number;
  org_threshold?: number;
  preferred_actions?: string[];
  counterparty_reliability?: Record<string, number>;
}

/** P3: Heterogeneous agent role profiles (production bias, risk). */
export type AgentRole = "salvager" | "trader" | "archivist" | "maintainer" | "generalist";

export interface CommandResult {
  ok: boolean;
  request_id: string;
  observation?: Observation;
  events?: Array<{ event_id: string; event_type: string; sequence: number; payload?: Record<string, unknown> }>;
  provenance?: {
    player_id: string;
    controller_id: string;
    session_id: string;
    agent_id: string;
  };
  settled?: boolean;
  error?: { code: string; message: string; choices?: string[] };
}

export interface Checkpoint {
  checkpoint_id: string;
  cycle: number;
  sequence: number;
  world_name: string;
  world_seed?: string;
  snapshot: {
    room_stocks: Record<string, Record<string, number>>;
    player_budgets: Record<string, Record<string, number>>;
    co_evolution?: any;
    genesis_evolutions?: any;
  };
  created_at: number;
  note?: string;
}


/** P3-04: Full resource economy model (production, conversion, decay). */
export interface ProductionFunction {
  role: string;
  action: string;
  outputs: Record<string, number>;  // e.g. { materials: 1.8, influence: 0.3 }
  costs: Record<string, number>;
}

export interface ConversionRule {
  input: string;
  output: string;
  rate: number;
  unlocked_by_org?: boolean;
}

export interface ResourceEconomyState {
  conversion_table: Record<string, ConversionRule>;
  decay_rate: number;
  production_functions: ProductionFunction[];
  unlocked_affordances: string[];
}
