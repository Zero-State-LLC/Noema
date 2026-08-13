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
