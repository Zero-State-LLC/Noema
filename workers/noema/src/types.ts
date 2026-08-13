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
  /** Supabase JWT secret (HS256) for human access tokens. */
  SUPABASE_JWT_SECRET?: string;
  SUPABASE_URL?: string;
  /** Settlement only — never expose to clients/agents. */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /**
   * Operator token for ADMIN control plane (Specs: admin ≠ player).
   * Never grant to player Controllers. Optional in local; required for hosted admin.
   */
  ADMIN_OPERATOR_TOKEN?: string;
}

/** Operator principal — separate from PlayerPrincipal (PLATFORM / AUTH). */
export interface AdminPrincipal {
  role: "ADMIN";
  session_id: string;
  scopes: string[];
  authentication_context: "operator_token";
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
  /** Other active players (addressable handles, no secrets). */
  players_here?: Array<{ player_id: string; handle?: string }>;
  /** Legacy string list + structured affordances */
  available_actions: string[];
  affordances?: ObservationAffordance[];
  /** Last action consequence for UI */
  consequence?: string;
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
