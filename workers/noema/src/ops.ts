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
]);

export function normalizeCommandName(command: string): string {
  return String(command || "")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
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
