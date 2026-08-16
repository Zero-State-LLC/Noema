/**
 * First-world operational envelope (Noema-Specs WORLD-OPERATIONS / INCIDENT-RECOVERY).
 * Machine World.status remains ACTIVE | PAUSED | INCIDENT | ARCHIVED.
 * DEMO_SEED / NOT_ACTIVE are pre-activation hosted states, not extra frozen enums.
 */

export type WorldOpStatus = "NOT_ACTIVE" | "DEMO_SEED" | "ACTIVE" | "PAUSED" | "INCIDENT" | "ARCHIVED";
export type SettlementHealth = "HEALTHY" | "DEGRADED" | "BLOCKING";

export const READ_COMMANDS = new Set([
  "LOOK",
  "INSPECT",
  "HELP",
  "QUERY",
  "WAIT",
  "OBSERVE",
  "ENTER_WORLD",
  "JOIN",
  "TALK",
  "USE",
  "CONSULT",
  "SERVICE",
]);

const COMMAND_ALIASES: Record<string, string> = {
  ENTER: "ENTER_WORLD",
  JOIN: "ENTER_WORLD",
  EXIT: "LEAVE_WORLD",
  L: "LOOK",
  ASK: "TALK",
  MSG: "MESSAGE",
};

export function normalizeCommandName(command: string): string {
  const raw = String(command || "")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
  return COMMAND_ALIASES[raw] || raw;
}

/** PLAY sends command=LOOK plus arguments.line — gate/telemetry must use the line. */
export function commandForOps(command: string, args?: { line?: unknown } | null): string {
  if (args && typeof args.line === "string" && args.line.trim()) return args.line.trim();
  return command;
}

export function countEnteredPlayers(players: Record<string, { entered?: boolean }> | undefined): number {
  if (!players) return 0;
  return Object.values(players).filter((p) => p.entered).length;
}

export function enteredPlayerIds(players: Record<string, { entered?: boolean }> | undefined): string[] {
  if (!players) return [];
  return Object.entries(players)
    .filter(([, p]) => p.entered)
    .map(([id]) => id);
}

/** Present now: commanded within this window. Missing last_seen is stale. */
export const PRESENCE_IDLE_MS = 30 * 60 * 1000;

export type ActorKind = "live" | "system";

export type PresencePlayer = {
  entered?: boolean;
  last_seen_ms?: number;
  actor_kind?: ActorKind;
  handle?: string;
  room_id?: string;
};

/** Magic-link humans use player.{12 hex}. Operator mint uses player.{handle}. */
export function inferActorKind(playerId: string, stored?: ActorKind): ActorKind {
  if (stored === "live" || stored === "system") return stored;
  return /^player\.[0-9a-f]{12}$/i.test(playerId) ? "live" : "system";
}

export function actorKindFromPrincipal(p: {
  player_id: string;
  controller_type?: string;
  authentication_context?: string;
  issued_by?: string;
  amr?: string;
  identity_id?: string;
}): ActorKind {
  if (p.controller_type === "agent") return "system";
  if (p.authentication_context === "dev_token") return "system";
  if (p.issued_by === "admin") return "system";
  if (p.amr === "email_magic_link" || p.authentication_context === "supabase_jwt" || p.identity_id) {
    return "live";
  }
  return inferActorKind(p.player_id);
}

export function isPresentNow(
  p: PresencePlayer | undefined,
  now: number,
  idleMs = PRESENCE_IDLE_MS,
): boolean {
  if (!p?.entered) return false;
  if (p.last_seen_ms == null) return false;
  return now - p.last_seen_ms <= idleMs;
}

export function countLivePlayers(
  players: Record<string, PresencePlayer> | undefined,
  now = Date.now(),
  idleMs = PRESENCE_IDLE_MS,
): number {
  if (!players) return 0;
  return Object.entries(players).filter(
    ([id, p]) => inferActorKind(id, p.actor_kind) === "live" && isPresentNow(p, now, idleMs),
  ).length;
}

export function expireStalePresence(
  players: Record<string, PresencePlayer> | undefined,
  now = Date.now(),
  idleMs = PRESENCE_IDLE_MS,
): boolean {
  if (!players) return false;
  let dirty = false;
  for (const [id, p] of Object.entries(players)) {
    const kind = inferActorKind(id, p.actor_kind);
    if (p.actor_kind !== kind) {
      p.actor_kind = kind;
      dirty = true;
    }
    // Idle expires live-count only (last_seen). Do not set entered=false
    // or emit AGENT_LEFT_WORLD — disconnect ≠ leave world.
  }
  return dirty;
}

export type ActorRow = {
  player_id: string;
  handle: string;
  room_id?: string;
  entered: boolean;
  last_seen_ms?: number;
  actor_kind: ActorKind;
};

export function listLivePlayers(
  players: Record<string, PresencePlayer> | undefined,
  now = Date.now(),
  idleMs = PRESENCE_IDLE_MS,
): ActorRow[] {
  if (!players) return [];
  return Object.entries(players)
    .filter(([id, p]) => inferActorKind(id, p.actor_kind) === "live" && isPresentNow(p, now, idleMs))
    .map(([id, p]) => ({
      player_id: id,
      handle: p.handle || id.replace(/^player\./, ""),
      room_id: p.room_id,
      entered: true,
      last_seen_ms: p.last_seen_ms,
      actor_kind: "live" as const,
    }));
}

export function listSystemActors(players: Record<string, PresencePlayer> | undefined): ActorRow[] {
  if (!players) return [];
  return Object.entries(players)
    .filter(([id, p]) => inferActorKind(id, p.actor_kind) === "system")
    .map(([id, p]) => ({
      player_id: id,
      handle: p.handle || id.replace(/^player\./, ""),
      room_id: p.room_id,
      entered: Boolean(p.entered),
      last_seen_ms: p.last_seen_ms,
      actor_kind: "system" as const,
    }));
}

export function isMutatingCommand(command: string): boolean {
  const verb = normalizeCommandName(command);
  if (!verb) return true;
  if (READ_COMMANDS.has(verb)) return false;
  return true;
}

export function mutationBlocked(
  status: WorldOpStatus,
  settlement: SettlementHealth,
): { blocked: boolean; code: string; message: string } | null {
  if (status === "PAUSED") {
    return {
      blocked: true,
      code: "WORLD_PAUSED",
      message: "World is in maintenance (PAUSED). Mutating PLAY is rejected.",
    };
  }
  if (status === "INCIDENT" || status === "ARCHIVED") {
    return {
      blocked: true,
      code: "WORLD_INCIDENT",
      message: "World mutation is blocked until authority is restored.",
    };
  }
  if (settlement === "BLOCKING") {
    return {
      blocked: true,
      code: "SETTLEMENT_BLOCKED",
      message: "Settlement bound exceeded. No further mutating PLAY until settlement confirms.",
    };
  }
  return null;
}

export type PlayReady = {
  ready: boolean;
  play_blocked: boolean;
  code: string | null;
  status: WorldOpStatus;
  settlement_health: SettlementHealth;
};

/** PLAY mutation readiness — not “Durable Object answered”. */
export type LifecycleAction = "pause" | "resume" | "incident" | "close";

export type LifecycleResult =
  | { ok: true; status: WorldOpStatus }
  | { ok: false; code: string; message: string; http: number };

/** CONTROL_PLANE world status transitions. Does not reseed or activate Genesis. */
export function applyWorldLifecycle(
  current: WorldOpStatus,
  action: LifecycleAction,
  settlement: SettlementHealth,
): LifecycleResult {
  if (action === "pause") {
    if (current !== "ACTIVE" && current !== "PAUSED") {
      return { ok: false, code: "INVALID_STATE", message: `cannot pause from ${current}`, http: 409 };
    }
    return { ok: true, status: "PAUSED" };
  }
  if (action === "resume") {
    if (current !== "PAUSED") {
      return { ok: false, code: "INVALID_STATE", message: `cannot resume from ${current}`, http: 409 };
    }
    if (settlement === "BLOCKING") {
      return { ok: false, code: "RECOVERY_REQUIRED", message: "settlement must recover before resume", http: 409 };
    }
    return { ok: true, status: "ACTIVE" };
  }
  if (action === "incident") {
    return { ok: true, status: "INCIDENT" };
  }
  if (action === "close") {
    if (current !== "INCIDENT") {
      return { ok: false, code: "INVALID_STATE", message: `cannot close incident from ${current}`, http: 409 };
    }
    if (settlement === "BLOCKING") {
      return { ok: false, code: "RECOVERY_REQUIRED", message: "settlement must recover before close", http: 409 };
    }
    return { ok: true, status: "ACTIVE" };
  }
  return { ok: false, code: "INVALID_REQUEST", message: "action=pause|resume|incident|close", http: 400 };
}

export function playReady(
  status?: string | null,
  settlement?: string | null,
): PlayReady {
  const st = (status || "NOT_ACTIVE") as WorldOpStatus;
  const sh = (settlement || "HEALTHY") as SettlementHealth;
  if (st === "NOT_ACTIVE") {
    return {
      ready: false,
      play_blocked: true,
      code: "WORLD_NOT_READY",
      status: st,
      settlement_health: sh,
    };
  }
  const gate = mutationBlocked(st, sh);
  if (gate) {
    return {
      ready: false,
      play_blocked: true,
      code: gate.code,
      status: st,
      settlement_health: sh,
    };
  }
  return {
    ready: true,
    play_blocked: false,
    code: null,
    status: st,
    settlement_health: sh,
  };
}

/** After a mutating batch's durable settle attempt. */
export function nextSettlementHealth(current: SettlementHealth, settleOk: boolean): SettlementHealth {
  if (settleOk) return "HEALTHY";
  if (current === "HEALTHY") return "DEGRADED";
  return "BLOCKING";
}

export interface SessionTakeover {
  takeover: boolean;
  previous_session_id: string | null;
  session_id: string;
}

export function applyControllingSession(
  current: string | undefined,
  incoming: string,
  mutating: boolean,
): SessionTakeover {
  if (!mutating) {
    return { takeover: false, previous_session_id: current || null, session_id: current || incoming };
  }
  if (current && current !== incoming) {
    return { takeover: true, previous_session_id: current, session_id: incoming };
  }
  return { takeover: false, previous_session_id: current || null, session_id: incoming };
}
