/**
 * Review-stage player-tempo/1.0 admission.
 * RFC-0128 remains Review. This module admits and freezes; it does not apply verbs.
 * Wall-clock values open or close windows only. They never enter reducer order.
 */

import catalogJson from "./player-tempo-catalog.1.0.json";
import { isAdmittedTestWorldId } from "./test-world";
import type { CommandEnvelope, PlayerPrincipal } from "./types";
import { presentPlayerIds } from "./world-time";

export const PLAYER_TEMPO_POLICY_VERSION = "player-tempo/1.0" as const;
export const PLAYER_TEMPO_CATALOG_ID = "player-tempo-catalog/1.0" as const;

export type TempoMode = "OBSERVED_LIVE" | "FAST_TEST" | "STEP_TEST";
export type TempoPhase = "COLLECT" | "RESOLVE" | "PRESENT";
export type WorldKind = "PRODUCTION" | "ORDINARY_LIVE" | "ISOLATED_TEST";
export type FreezeTrigger =
  | "PARTICIPANT_QUORUM"
  | "COLLECT_DEADLINE_WITH_ACTION"
  | "OPERATOR_BATCH_CLOSE"
  | "OPERATOR_STEP";

export type TempoModePolicy = {
  mode: TempoMode;
  allowed_world_kinds: WorldKind[];
  collect_window_ms: number | null;
  presentation_hold_ms: number;
  freeze_triggers: FreezeTrigger[];
  max_mutating_actions_per_player_per_cycle: 1;
  empty_window_advances: false;
  surplus_action_policy: "REJECT";
};

export type PlayerTempoCatalog = {
  catalog_id: typeof PLAYER_TEMPO_CATALOG_ID;
  policy_version: typeof PLAYER_TEMPO_POLICY_VERSION;
  modes: TempoModePolicy[];
  errors: Array<"ACTION_SLOT_FILLED" | "PACE_LIMITED">;
  invariants: {
    canonical_clock: "World.cycle";
    canonical_order: "action_priority,agent_id,client_action_sequence,action_id";
    wall_clock_is_reducer_input: false;
    client_selects_mode: false;
    missing_action_is_wait: false;
    test_mode_bypasses_settlement: false;
  };
};

export type TempoProvenance = {
  reason: string;
  at_ms: number;
  actor: "system" | "admin" | "quorum" | "deadline" | "operator";
};

export type AcceptedTempoAction = {
  player_id: string;
  agent_id: string;
  action_id: string;
  verb: string;
  action_priority: number;
  client_action_sequence: number;
  idempotency_key: string;
  envelope: CommandEnvelope;
  principal: PlayerPrincipal;
};

export type RecordedTempoAction = {
  player_id: string;
  agent_id: string;
  action_id: string;
  verb: string;
  action_priority: number;
  client_action_sequence: number;
  idempotency_key: string;
};

export type PlayerTempoState = {
  policy_version: typeof PLAYER_TEMPO_POLICY_VERSION;
  mode: TempoMode;
  phase: TempoPhase;
  cycle: number;
  active_participant_ids: string[];
  accepted: AcceptedTempoAction[];
  phase_open: TempoProvenance;
  phase_close?: TempoProvenance;
  presentation_not_before_ms?: number;
  collect_deadline_ms?: number | null;
  prior_cycle: number;
  prior_ledger_sequence: number;
  last_used_sequence: Record<string, number>;
  last_accepted_snapshot: RecordedTempoAction[];
  operator_close?: FreezeTrigger;
  settlement_failed?: boolean;
  mode_audit: Array<{ mode: TempoMode; reason: string; at_ms: number; actor: "admin" }>;
};

export type TempoWorld = {
  world_id: string;
  cycle: number;
  sequence: number;
  unsettled?: unknown[];
  world_kind?: WorldKind;
  player_tempo_policy_version?: string;
  player_tempo_mode?: TempoMode;
  player_tempo?: PlayerTempoState;
  players: Record<string, { entered?: boolean; last_seen_ms?: number }>;
};

export type TempoErrorDetail = {
  code: "ACTION_SLOT_FILLED" | "PACE_LIMITED" | "TEMPO_POLICY_UNAVAILABLE" | "CONFLICT" | "TEMPO_PIN_FORBIDDEN";
  message: string;
  cycle?: number;
  phase?: TempoPhase;
  retry_after_ms?: number;
};

export type CatalogLoad =
  | { ok: true; catalog: PlayerTempoCatalog }
  | { ok: false; code: "TEMPO_POLICY_UNAVAILABLE"; message: string };

export type TempoPinResult =
  | { ok: true; state: PlayerTempoState }
  | { ok: false; code: string; message: string };

const PASSIVE_VERBS = new Set(["OBSERVE", "HELP", "QUERY"]);

const ACTION_PRIORITY: Record<string, number> = {
  WAIT: 10,
  ENTER_WORLD: 15,
  LEAVE_WORLD: 15,
  MOVE: 20,
  LOOK: 25,
  INSPECT: 30,
  HARVEST: 35,
  REPAIR: 36,
  MESSAGE: 40,
  TRADE: 50,
  COMMIT: 51,
};

let cachedCatalog: CatalogLoad | null = null;

export function validatePlayerTempoCatalog(raw: unknown): CatalogLoad {
  if (!raw || typeof raw !== "object") {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog is missing." };
  }
  const catalog = raw as PlayerTempoCatalog;
  if (catalog.catalog_id !== PLAYER_TEMPO_CATALOG_ID) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog id is invalid." };
  }
  if (catalog.policy_version !== PLAYER_TEMPO_POLICY_VERSION) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo policy version is invalid." };
  }
  if (!Array.isArray(catalog.modes) || catalog.modes.length !== 3) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog modes are invalid." };
  }
  const modes = new Set(catalog.modes.map((m) => m.mode));
  if (!modes.has("OBSERVED_LIVE") || !modes.has("FAST_TEST") || !modes.has("STEP_TEST")) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog is missing a required mode." };
  }
  for (const mode of catalog.modes) {
    if (mode.max_mutating_actions_per_player_per_cycle !== 1) {
      return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog slot count is invalid." };
    }
    if (mode.empty_window_advances !== false) {
      return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog must not advance empty windows." };
    }
    if (mode.surplus_action_policy !== "REJECT") {
      return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo surplus policy must reject." };
    }
  }
  const errors = new Set(catalog.errors || []);
  if (!errors.has("ACTION_SLOT_FILLED") || !errors.has("PACE_LIMITED")) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog errors are invalid." };
  }
  const inv = catalog.invariants;
  if (
    !inv ||
    inv.canonical_clock !== "World.cycle" ||
    inv.canonical_order !== "action_priority,agent_id,client_action_sequence,action_id" ||
    inv.wall_clock_is_reducer_input !== false ||
    inv.client_selects_mode !== false ||
    inv.missing_action_is_wait !== false ||
    inv.test_mode_bypasses_settlement !== false
  ) {
    return { ok: false, code: "TEMPO_POLICY_UNAVAILABLE", message: "Pinned player-tempo catalog invariants are invalid." };
  }
  return { ok: true, catalog };
}

export function loadPlayerTempoCatalog(): CatalogLoad {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = validatePlayerTempoCatalog(catalogJson);
  return cachedCatalog;
}

export function tempoModePolicy(mode: TempoMode): TempoModePolicy | null {
  const loaded = loadPlayerTempoCatalog();
  if (!loaded.ok) return null;
  return loaded.catalog.modes.find((item) => item.mode === mode) || null;
}

export function inferWorldKind(worldId: string, defaultWorldId?: string): WorldKind {
  const id = String(worldId || "").trim();
  if (isAdmittedTestWorldId(id)) return "ISOLATED_TEST";
  const fallback = String(defaultWorldId || "").trim();
  if (
    id === "world-01" ||
    (fallback && id === fallback) ||
    id === "world.perihelion-reach" ||
    id.startsWith("world.perihelion")
  ) {
    return "PRODUCTION";
  }
  return "ORDINARY_LIVE";
}

export function worldKindOf(w: TempoWorld, defaultWorldId?: string): WorldKind {
  return w.world_kind || inferWorldKind(w.world_id, defaultWorldId);
}

export function modeAllowedForKind(mode: TempoMode, kind: WorldKind): boolean {
  const policy = tempoModePolicy(mode);
  if (!policy) return false;
  return policy.allowed_world_kinds.includes(kind);
}

export function isPlayerTempoPinned(w: { player_tempo_policy_version?: string } | null | undefined): boolean {
  return w?.player_tempo_policy_version === PLAYER_TEMPO_POLICY_VERSION;
}

export function fillsActionSlot(verb: string): boolean {
  const normalized = String(verb || "").trim().toUpperCase();
  if (!normalized) return true;
  if (PASSIVE_VERBS.has(normalized)) return false;
  return true;
}

export function actionPriorityForVerb(verb: string): number {
  const normalized = String(verb || "").trim().toUpperCase();
  return ACTION_PRIORITY[normalized] ?? 80;
}

export function sortAcceptedActions<T extends RecordedTempoAction>(actions: T[]): T[] {
  return [...actions].sort((a, b) => {
    if (a.action_priority !== b.action_priority) return a.action_priority - b.action_priority;
    if (a.agent_id !== b.agent_id) return a.agent_id < b.agent_id ? -1 : 1;
    if (a.client_action_sequence !== b.client_action_sequence) {
      return a.client_action_sequence - b.client_action_sequence;
    }
    if (a.action_id === b.action_id) return 0;
    return a.action_id < b.action_id ? -1 : 1;
  });
}

export function recordAcceptedAction(action: AcceptedTempoAction): RecordedTempoAction {
  return {
    player_id: action.player_id,
    agent_id: action.agent_id,
    action_id: action.action_id,
    verb: action.verb,
    action_priority: action.action_priority,
    client_action_sequence: action.client_action_sequence,
    idempotency_key: action.idempotency_key,
  };
}

function compactAgent(agentId: string): string {
  return String(agentId || "agent")
    .replace(/^agent\./, "")
    .replace(/[^a-zA-Z0-9._-]+/g, ".")
    .slice(0, 48) || "agent";
}

export function tempoCanonicalFingerprint(input: {
  cycle: number;
  sequence: number;
  accepted: RecordedTempoAction[];
  events?: Array<{ event_type: string; sequence: number; event_id?: string }>;
}): string {
  const accepted = sortAcceptedActions(input.accepted).map((action) => ({
    action_id: action.action_id,
    action_priority: action.action_priority,
    agent_id: action.agent_id,
    client_action_sequence: action.client_action_sequence,
  }));
  const events = (input.events || []).map((event) => ({
    event_type: event.event_type,
    sequence: event.sequence,
    event_id: event.event_id || "",
  }));
  return JSON.stringify({ cycle: input.cycle, sequence: input.sequence, accepted, events });
}

export function publicTempoProjection(
  w: TempoWorld,
  now: number,
): {
  policy_version: string | null;
  mode: TempoMode | null;
  phase: TempoPhase | null;
  cycle: number;
  step_required: boolean;
  collect_deadline_ms: number | null;
  accepted_slot_count: number;
  active_participant_count: number;
  presentation_hold_remaining_ms: number;
  settlement_failed: boolean;
} {
  const tempo = w.player_tempo;
  if (!isPlayerTempoPinned(w) || !tempo) {
    return {
      policy_version: w.player_tempo_policy_version || null,
      mode: null,
      phase: null,
      cycle: w.cycle,
      step_required: false,
      collect_deadline_ms: null,
      accepted_slot_count: 0,
      active_participant_count: 0,
      presentation_hold_remaining_ms: 0,
      settlement_failed: false,
    };
  }
  const hold = Math.max(0, (tempo.presentation_not_before_ms ?? 0) - now);
  return {
    policy_version: tempo.policy_version,
    mode: tempo.mode,
    phase: tempo.phase,
    cycle: w.cycle,
    step_required: tempo.mode === "STEP_TEST" && tempo.phase === "COLLECT",
    collect_deadline_ms: tempo.phase === "COLLECT" ? tempo.collect_deadline_ms ?? null : null,
    accepted_slot_count: tempo.accepted.length,
    active_participant_count: tempo.active_participant_ids.length,
    presentation_hold_remaining_ms: tempo.phase === "PRESENT" ? hold : 0,
    settlement_failed: Boolean(tempo.settlement_failed),
  };
}

export function redactedTempoState(tempo: PlayerTempoState | undefined): Record<string, unknown> | null {
  if (!tempo) return null;
  return {
    policy_version: tempo.policy_version,
    mode: tempo.mode,
    phase: tempo.phase,
    cycle: tempo.cycle,
    active_participant_count: tempo.active_participant_ids.length,
    accepted_slot_count: tempo.accepted.length,
    accepted_action_ids: tempo.accepted.map((action) => action.action_id),
    phase_open: tempo.phase_open,
    phase_close: tempo.phase_close || null,
    presentation_not_before_ms: tempo.presentation_not_before_ms ?? null,
    collect_deadline_ms: tempo.collect_deadline_ms ?? null,
    settlement_failed: Boolean(tempo.settlement_failed),
  };
}

export function nextTempoAlarmAt(tempo: PlayerTempoState | undefined, now: number): number | null {
  if (!tempo) return null;
  if (tempo.phase === "COLLECT" && typeof tempo.collect_deadline_ms === "number" && tempo.collect_deadline_ms > now) {
    return tempo.collect_deadline_ms;
  }
  if (tempo.phase === "PRESENT" && typeof tempo.presentation_not_before_ms === "number" && tempo.presentation_not_before_ms > now) {
    return tempo.presentation_not_before_ms;
  }
  return null;
}

export function paceLimitedError(
  w: TempoWorld,
  now: number,
  message = "The world is not collecting actions right now.",
): TempoErrorDetail {
  const tempo = w.player_tempo;
  const phase = tempo?.phase || "COLLECT";
  let retry_after_ms: number | undefined;
  if (phase === "PRESENT" && typeof tempo?.presentation_not_before_ms === "number") {
    retry_after_ms = Math.max(0, tempo.presentation_not_before_ms - now);
  } else if (phase === "COLLECT" && typeof tempo?.collect_deadline_ms === "number") {
    retry_after_ms = Math.max(0, tempo.collect_deadline_ms - now);
  }
  return {
    code: "PACE_LIMITED",
    message,
    cycle: w.cycle,
    phase,
    retry_after_ms,
  };
}

export function slotFilledError(w: TempoWorld): TempoErrorDetail {
  return {
    code: "ACTION_SLOT_FILLED",
    message: "You already submitted an action this cycle.",
    cycle: w.cycle,
    phase: w.player_tempo?.phase || "COLLECT",
  };
}

function requirePinnedCatalog(): CatalogLoad {
  return loadPlayerTempoCatalog();
}

function atBoundary(tempo: PlayerTempoState | undefined): boolean {
  if (!tempo) return true;
  if (tempo.accepted.length > 0) return false;
  if (tempo.phase === "RESOLVE") return false;
  return true;
}

function hasUnresolvedSettlement(w: TempoWorld): boolean {
  return Array.isArray(w.unsettled) && w.unsettled.length > 0;
}

function freezeParticipants(w: TempoWorld, now: number): string[] {
  return presentPlayerIds(w.players, now).sort();
}

function collectDeadlineMs(mode: TempoMode, openedAt: number): number | null {
  const policy = tempoModePolicy(mode);
  if (!policy || policy.collect_window_ms == null) return null;
  return openedAt + policy.collect_window_ms;
}

export function openCollectPhase(w: TempoWorld, now: number, reason: string, actor: TempoProvenance["actor"]): void {
  const tempo = w.player_tempo;
  if (!tempo) return;
  tempo.phase = "COLLECT";
  tempo.cycle = w.cycle;
  tempo.active_participant_ids = freezeParticipants(w, now);
  tempo.accepted = [];
  tempo.operator_close = undefined;
  tempo.settlement_failed = false;
  tempo.collect_deadline_ms = collectDeadlineMs(tempo.mode, now);
  tempo.presentation_not_before_ms = undefined;
  tempo.phase_open = { reason, at_ms: now, actor };
  tempo.phase_close = undefined;
}

export function pinPlayerTempo(
  w: TempoWorld,
  input: { mode: TempoMode; now: number; reason: string; defaultWorldId?: string },
): TempoPinResult {
  const loaded = requirePinnedCatalog();
  if (!loaded.ok) return loaded;
  if (hasUnresolvedSettlement(w)) {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: "Player-tempo pin changes require a committed cycle boundary with no unresolved settlement candidates.",
    };
  }
  if (isPlayerTempoPinned(w) && !atBoundary(w.player_tempo)) {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: "Player-tempo pin changes only at a committed cycle boundary with no unresolved action set.",
    };
  }
  const kind = worldKindOf(w, input.defaultWorldId);
  if (!modeAllowedForKind(input.mode, kind)) {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: `${input.mode} is not allowed on a ${kind} world.`,
    };
  }
  w.world_kind = kind;
  w.player_tempo_policy_version = PLAYER_TEMPO_POLICY_VERSION;
  w.player_tempo_mode = input.mode;
  const state: PlayerTempoState = {
    policy_version: PLAYER_TEMPO_POLICY_VERSION,
    mode: input.mode,
    phase: "COLLECT",
    cycle: w.cycle,
    active_participant_ids: freezeParticipants(w, input.now),
    accepted: [],
    phase_open: { reason: input.reason, at_ms: input.now, actor: "admin" },
    collect_deadline_ms: collectDeadlineMs(input.mode, input.now),
    prior_cycle: w.cycle,
    prior_ledger_sequence: w.sequence,
    last_used_sequence: {},
    last_accepted_snapshot: [],
    mode_audit: [{ mode: input.mode, reason: input.reason, at_ms: input.now, actor: "admin" }],
  };
  w.player_tempo = state;
  return { ok: true, state };
}

export const migrateToPlayerTempo = pinPlayerTempo;

export function changeTempoMode(
  w: TempoWorld,
  input: { mode: TempoMode; now: number; reason: string; defaultWorldId?: string },
): TempoPinResult {
  if (!isPlayerTempoPinned(w) || !w.player_tempo) {
    return { ok: false, code: "TEMPO_PIN_FORBIDDEN", message: "This world is not pinned to player-tempo/1.0." };
  }
  if (hasUnresolvedSettlement(w)) {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: "Tempo mode changes require a committed cycle boundary with no unresolved settlement candidates.",
    };
  }
  if (!String(input.reason || "").trim()) {
    return { ok: false, code: "TEMPO_PIN_FORBIDDEN", message: "A tempo mode change requires a reason." };
  }
  if (!atBoundary(w.player_tempo) || w.player_tempo.phase === "RESOLVE") {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: "Tempo mode changes only at a committed cycle boundary with no unresolved action set.",
    };
  }
  const kind = worldKindOf(w, input.defaultWorldId);
  if (!modeAllowedForKind(input.mode, kind)) {
    return {
      ok: false,
      code: "TEMPO_PIN_FORBIDDEN",
      message: `${input.mode} is not allowed on a ${kind} world.`,
    };
  }
  w.player_tempo.mode = input.mode;
  w.player_tempo_mode = input.mode;
  w.player_tempo.mode_audit.push({
    mode: input.mode,
    reason: input.reason.trim(),
    at_ms: input.now,
    actor: "admin",
  });
  openCollectPhase(w, input.now, `mode:${input.mode}`, "admin");
  return { ok: true, state: w.player_tempo };
}

export function operatorTempoTrigger(
  w: TempoWorld,
  input: { trigger: "OPERATOR_BATCH_CLOSE" | "OPERATOR_STEP"; now: number },
): { ok: true; should_resolve: boolean } | { ok: false; code: string; message: string } {
  if (!isPlayerTempoPinned(w) || !w.player_tempo) {
    return { ok: false, code: "TEMPO_PIN_FORBIDDEN", message: "This world is not pinned to player-tempo/1.0." };
  }
  const policy = tempoModePolicy(w.player_tempo.mode);
  if (!policy || !policy.freeze_triggers.includes(input.trigger)) {
    return { ok: false, code: "TEMPO_PIN_FORBIDDEN", message: "That operator close is not valid for this tempo mode." };
  }
  if (w.player_tempo.phase !== "COLLECT") {
    return { ok: false, code: "PACE_LIMITED", message: "Operator close is only valid during COLLECT." };
  }
  w.player_tempo.operator_close = input.trigger;
  return { ok: true, should_resolve: shouldFreezeTempo(w, input.now) };
}

export function shouldFreezeTempo(w: TempoWorld, now: number): boolean {
  const tempo = w.player_tempo;
  if (!tempo || tempo.phase !== "COLLECT") return false;
  const policy = tempoModePolicy(tempo.mode);
  if (!policy) return false;
  const triggers = new Set(policy.freeze_triggers);
  const participants = tempo.active_participant_ids;
  const quorum =
    triggers.has("PARTICIPANT_QUORUM") &&
    participants.length > 0 &&
    participants.every((id) => tempo.accepted.some((action) => action.player_id === id));
  if (quorum) return true;
  if (
    triggers.has("COLLECT_DEADLINE_WITH_ACTION") &&
    typeof tempo.collect_deadline_ms === "number" &&
    now >= tempo.collect_deadline_ms &&
    tempo.accepted.length > 0
  ) {
    return true;
  }
  if (tempo.operator_close && triggers.has(tempo.operator_close)) {
    return tempo.accepted.length > 0;
  }
  return false;
}

export function advanceTempoAdmissionClock(
  w: TempoWorld,
  now: number,
): { should_resolve: boolean; opened_collect: boolean } {
  const tempo = w.player_tempo;
  if (!isPlayerTempoPinned(w) || !tempo) return { should_resolve: false, opened_collect: false };
  if (tempo.phase === "PRESENT") {
    const ready = tempo.presentation_not_before_ms == null || now >= tempo.presentation_not_before_ms;
    if (!ready) return { should_resolve: false, opened_collect: false };
    openCollectPhase(w, now, "presentation-hold-elapsed", "system");
    return { should_resolve: false, opened_collect: true };
  }
  if (tempo.phase === "COLLECT") {
    if (shouldFreezeTempo(w, now)) return { should_resolve: true, opened_collect: false };
    if (
      typeof tempo.collect_deadline_ms === "number" &&
      now >= tempo.collect_deadline_ms &&
      tempo.accepted.length === 0
    ) {
      tempo.collect_deadline_ms = collectDeadlineMs(tempo.mode, now);
      tempo.phase_open = { reason: "empty-window-held", at_ms: now, actor: "deadline" };
      return { should_resolve: false, opened_collect: false };
    }
  }
  return { should_resolve: false, opened_collect: false };
}

function readClientActionSequence(envl: CommandEnvelope): number | undefined {
  if (typeof envl.client_action_sequence === "number" && Number.isFinite(envl.client_action_sequence)) {
    return Math.floor(envl.client_action_sequence);
  }
  const raw = envl.arguments?.client_action_sequence;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
  return undefined;
}

export function admitTempoAction(
  w: TempoWorld,
  input: {
    principal: PlayerPrincipal;
    envelope: CommandEnvelope;
    verb: string;
    now: number;
    worldPaused?: boolean;
  },
): { ok: true; action: AcceptedTempoAction } | { ok: false; error: TempoErrorDetail } {
  const loaded = requirePinnedCatalog();
  if (!loaded.ok) {
    return { ok: false, error: { code: loaded.code, message: loaded.message, cycle: w.cycle } };
  }
  if (!w.player_tempo) {
    return {
      ok: false,
      error: {
        code: "TEMPO_POLICY_UNAVAILABLE",
        message: "Pinned player-tempo state is missing.",
        cycle: w.cycle,
      },
    };
  }
  if (input.worldPaused) {
    return { ok: false, error: paceLimitedError(w, input.now, "The world is paused.") };
  }
  if (w.player_tempo.phase !== "COLLECT" || w.player_tempo.settlement_failed) {
    return { ok: false, error: paceLimitedError(w, input.now) };
  }
  const playerId = input.principal.player_id;
  const existing = w.player_tempo.accepted.find((action) => action.player_id === playerId);
  const idempotencyKey = input.envelope.idempotency_key || input.envelope.request_id;
  if (existing) {
    if (existing.idempotency_key === idempotencyKey) {
      return { ok: true, action: existing };
    }
    return { ok: false, error: slotFilledError(w) };
  }
  let sequence = readClientActionSequence(input.envelope);
  const last = w.player_tempo.last_used_sequence[playerId] ?? 0;
  if (sequence == null) {
    sequence = last + 1;
  } else if (sequence <= last) {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "That client_action_sequence was already used.",
        cycle: w.cycle,
        phase: "COLLECT",
      },
    };
  }
  const action: AcceptedTempoAction = {
    player_id: playerId,
    agent_id: input.principal.agent_id,
    action_id: `act.${w.cycle}.${compactAgent(input.principal.agent_id)}.${sequence}`,
    verb: String(input.verb || "").toUpperCase(),
    action_priority: actionPriorityForVerb(input.verb),
    client_action_sequence: sequence,
    idempotency_key: idempotencyKey,
    envelope: input.envelope,
    principal: input.principal,
  };
  w.player_tempo.accepted.push(action);
  w.player_tempo.last_used_sequence[playerId] = sequence;
  return { ok: true, action };
}

export function markTempoResolveOpen(w: TempoWorld, now: number, reason: string): RecordedTempoAction[] {
  const tempo = w.player_tempo;
  if (!tempo) return [];
  const snapshot = sortAcceptedActions(tempo.accepted).map(recordAcceptedAction);
  tempo.phase = "RESOLVE";
  tempo.phase_close = { reason, at_ms: now, actor: reason.includes("operator") ? "operator" : "system" };
  tempo.last_accepted_snapshot = snapshot;
  return snapshot;
}

export function markTempoPresent(w: TempoWorld, now: number): void {
  const tempo = w.player_tempo;
  if (!tempo) return;
  const policy = tempoModePolicy(tempo.mode);
  tempo.phase = "PRESENT";
  tempo.cycle = w.cycle;
  tempo.accepted = [];
  tempo.operator_close = undefined;
  tempo.settlement_failed = false;
  tempo.presentation_not_before_ms = now + (policy?.presentation_hold_ms ?? 0);
  tempo.collect_deadline_ms = null;
  tempo.phase_open = { reason: "committed-batch", at_ms: now, actor: "system" };
}

export function markTempoSettlementFailed(w: TempoWorld): void {
  if (!w.player_tempo) return;
  w.player_tempo.phase = "RESOLVE";
  w.player_tempo.settlement_failed = true;
}

/**
 * Admin recover returns a pinned world to a COLLECT boundary after an
 * uncommitted RESOLVE freeze. Unpinned worlds are unchanged. Pending
 * idempotency keys for discarded uncommitted slots are cleared so a retry
 * can fill the new COLLECT slot. Already-committed client sequences stay.
 */
export function recoverPinnedTempoFromIncident(
  w: TempoWorld & { seen_idempotency?: Record<string, unknown> },
  now: number,
): boolean {
  if (!isPlayerTempoPinned(w) || !w.player_tempo) return false;
  if (!w.player_tempo.settlement_failed && w.player_tempo.phase !== "RESOLVE") return false;
  const discarded = [...w.player_tempo.accepted];
  openCollectPhase(w, now, "admin-recover", "admin");
  for (const action of discarded) {
    const idem = `${action.player_id}::${action.idempotency_key}`;
    if (w.seen_idempotency) delete w.seen_idempotency[idem];
    if (w.player_tempo.last_used_sequence[action.player_id] === action.client_action_sequence) {
      const prior = action.client_action_sequence - 1;
      if (prior > 0) w.player_tempo.last_used_sequence[action.player_id] = prior;
      else delete w.player_tempo.last_used_sequence[action.player_id];
    }
  }
  return true;
}
