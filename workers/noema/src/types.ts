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

export interface Observation {
  cycle: number;
  sequence: number;
  location: {
    room_id: string;
    name: string;
    description: string;
    exits: Array<{ direction: string; to_room_id: string }>;
    entities: Array<{ entity_id: string; label: string; entity_type: string }>;
  };
  player_id: string;
  available_actions: string[];
}

export interface CommandResult {
  ok: boolean;
  request_id: string;
  observation?: Observation;
  events?: Array<{ event_id: string; event_type: string; sequence: number }>;
  provenance?: {
    player_id: string;
    controller_id: string;
    session_id: string;
    agent_id: string;
  };
  settled?: boolean;
  error?: { code: string; message: string };
}
