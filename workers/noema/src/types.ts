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
  /** Postmark server token — standby Worker-sent PLAY/ADMIN/agent letters. Secret. */
  POSTMARK_SERVER_TOKEN?: string;
  /** Optional Postmark account token. Break-glass operations only. */
  POSTMARK_ACCOUNT_TOKEN?: string;
  /** Optional verified sender override. */
  POSTMARK_FROM_EMAIL?: string;
  /** Postmark transactional stream; defaults to outbound. */
  POSTMARK_MESSAGE_STREAM?: string;
  /** Resend API key — production-primary transactional provider when configured. */
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
}

export type ControllerType = "human" | "agent" | "hybrid";

/** Authenticated principal — sole gameplay authority input to the World DO. */
export interface PlayerPrincipal {
  player_id: string;
  agent_id: string;
  identity_id?: string;
  session_id: string;
  controller_id: string;
  controller_type: ControllerType;
  issued_by?: string;
  amr?: string;
  scopes: string[];
  protocol_version: string;
  authentication_context: string;
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
}

export interface ObservationEntity {
  entity_id: string;
  label: string;
  entity_type: string;
  condition?: number;
  stock_resource?: string;
  stock_amount?: number;
  repairable?: boolean;
  harvestable?: boolean;
}

export interface ObservationAffordance {
  action: string;
  verb: string;
  operation?: string;
  label: string;
  cmd: string;
  target_id?: string;
  target_label?: string;
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
  location: {
    room_id: string;
    name: string;
    description: string;
    /** Short local condition derived for UI (presentation only). */
    condition?: string;
    exits: Array<{ direction: string; to_room_id: string; to_room_name?: string }>;
    entities: ObservationEntity[];
  };
  player_id: string;
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
  /** Other active players (addressable handles, no secrets). */
  players_here?: Array<{ player_id: string; handle?: string }>;
  /** Legacy string list + structured affordances */
  available_actions: string[];
  affordances?: ObservationAffordance[];
  /** Last action consequence for UI */
  consequence?: string;
  /** GC1 self-only practice lines. Never put on WATCH or players_here. */
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
  /** GC5-S3 room board notices. Public room only. Never put on WATCH. */
  board_lines?: string[];
  /** GC5-S4 last room shout. Public room only. Never put on WATCH. */
  shout_lines?: string[];
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
