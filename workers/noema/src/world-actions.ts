/**
 * Hosted world command application — Tier 1 Player Action Map.
 * Same semantics for human text, GUI, and agent structured commands.
 */

import {
  COSTS,
  allocateOrgId,
  assignedOrgRole,
  canPay,
  cloneBudgets,
  debit,
  deriveAffordances,
  enrichEntity,
  helpText,
  isHarvestable,
  isOrgMember,
  isOrgOfficer,
  isRepairable,
  normalizeStructuredCommand,
  parseHumanCommand,
  sanitizeTradeAmounts,
  titleCaseLabel,
  type Budgets,
  type CanonicalAction,
  type EntityRuntime,
  type InboxMessage,
  type OpenTrade,
  type Organization,
  type OrgRole,
  type PlayerRuntime,
} from "./actions";
import { actorKindFromPrincipal } from "./ops";
import { commitCycleIfReady } from "./world-time";
import {
  collectLiveRelaysWithRoom,
  emptyPressure,
  ensurePressure,
  previewAfter,
  scheduleDue,
  selectScheduleRelay,
} from "./pressure";
import {
  applyPracticeCredits,
  creditsFromEvent,
  practiceLines,
  type PracticeCredit,
  type PracticeEvent,
} from "./practice";
import {
  creditAcceptedTrade,
  creditsFromTradeAccepted,
  socialMemoryLines,
  type SocialEvent,
} from "./social-memory";
import { applyCultureEvents, cultureLines, emptyCulture, type CultureEvent } from "./culture";
import { applyInspectEvidence, discoveryLines } from "./discovery";
import {
  UNREACHABLE_MESSAGE,
  UNREACHABLE_REASON,
  bestLiveRelayCondition,
  collectLiveRelays,
  longRangeDeliverable,
} from "./communication";
import { consultLine, isServiceConsultLine, resolveService, servicesAtRoom } from "./world-services";
import {
  CONSTRUCT_COSTS,
  DISMANTLE_COST,
  SALVAGE_STORAGE,
  allocateInfraId,
  clampSalvage,
  constructLabel,
  infraClassOf,
  isHiddenRoom,
  liveClassInRoom,
} from "./construction";
import {
  DECLARE_COST,
  DEFEND_COST,
  FORM_SPECS,
  MAX_OPEN_PER_AGENT,
  MAX_OPEN_PER_ROOM,
  defaultExpiresCycle,
  disruptionAfter,
  maxExpiresCycle,
  meetsMinimumStake,
  outcomeFromScore,
  publicContestProjection,
  resolutionDigest,
  sanitizeStake,
  scoreContest,
  seedPerturbation,
  seizureAmount,
  targetKindAllowed,
  type ContestForm,
  type ContestTarget,
  type OpenContest,
  type StakeMap,
} from "./contest";
import type { CommandEnvelope, CommandResult, Observation, PlayerPrincipal } from "./types";

export type UnsettledEvent = {
  event_id: string;
  payload: Record<string, unknown>;
  event_type?: string;
  sequence?: number;
  cycle?: number;
  player_id?: string;
  controller_id?: string;
  session_id?: string;
};

export type RoomState = {
  room_id: string;
  name: string;
  description: string;
  exits: Array<{ direction: string; to_room_id: string }>;
  entities: EntityRuntime[];
  /** GC2-S0: hidden rooms are not construct targets. */
  hidden?: boolean;
  tags?: string[];
};

export type WorldRuntime = {
  world_id: string;
  world_name?: string;
  world_seed?: string;
  cycle: number;
  sequence: number;
  entry_room_id: string;
  rooms: Record<string, RoomState>;
  players: Record<string, PlayerRuntime>;
  trades: Record<string, OpenTrade>;
  messages: InboxMessage[];
  organizations: Record<string, Organization>;
  contests?: Record<string, OpenContest>;
  access_restrictions?: Array<{
    restriction_id: string;
    scope: "EXIT" | "ROOM";
    mode: "DENY";
    applies_to: string;
    room_id?: string;
    exit_id?: string;
    expires_cycle: number;
  }>;
  seen_idempotency: Record<string, CommandResult>;
  unsettled: UnsettledEvent[];
  /** GC9-S0 derived site custom cache. Not WorldState. */
  culture?: import("./culture").CultureState;
  /** GC10-S0 schedule activation count. Not a PLAY label. */
  pressure?: import("./pressure").PressureState;
};

function ensurePlayer(w: WorldRuntime, principal: PlayerPrincipal, room_id: string): PlayerRuntime {
  let p = w.players[principal.player_id];
  if (!p) {
    p = {
      room_id,
      entered: false,
      budgets: cloneBudgets(null),
      handle: principal.player_id.replace(/^player\./, "").slice(0, 32),
    };
    w.players[principal.player_id] = p;
  } else if (!p.budgets) {
    p.budgets = cloneBudgets(null);
  } else {
    p.budgets = cloneBudgets(p.budgets);
  }
  if (!p.handle) p.handle = principal.player_id.replace(/^player\./, "").slice(0, 32);
  p.actor_kind = actorKindFromPrincipal(principal);
  p.last_seen_ms = Date.now();
  return p;
}

function roomEntities(room: RoomState): EntityRuntime[] {
  room.entities = (room.entities || []).map((e) => enrichEntity(e));
  return room.entities;
}

function findEntity(room: RoomState, idOrLabel: string): EntityRuntime | null {
  const ents = roomEntities(room);
  const t = idOrLabel.toLowerCase();
  return (
    ents.find((e) => e.entity_id.toLowerCase() === t || e.label.toLowerCase() === t) ||
    null
  );
}

function deriveRoomCondition(room: RoomState): string {
  const ents = roomEntities(room);
  const blob = `${room.description} ${ents.map((e) => `${e.label} ${e.entity_type}`).join(" ")}`.toLowerCase();
  const bits: string[] = [];
  if (/scar|damag|broken|fail/.test(blob) || ents.some((e) => (e.condition ?? 100) < 50)) {
    bits.push("Infrastructure shows damage.");
  }
  if (/trade|market|exchange|bond|contract/.test(blob)) bits.push("Trade structures are nearby.");
  if (/archive|ledger|record/.test(blob)) bits.push("A surviving record is nearby.");
  if (ents.some(isHarvestable)) bits.push("A resource node can be worked.");
  if (!bits.length) {
    bits.push(ents.length ? "Objects here can be examined." : "Open ground — routes lead outward.");
  }
  return bits.slice(0, 2).join(" ");
}

function inspectDetail(entity: EntityRuntime): string {
  const label = titleCaseLabel(entity.label);
  if (entity.condition != null && entity.condition < 100) {
    return `${label} condition ${entity.condition}%. ${
      entity.condition < 50 ? "Damaged — repair may restore it." : "Present and serviceable."
    }`;
  }
  if (isHarvestable(entity)) {
    return `${label} holds ${entity.stock_amount} ${entity.stock_resource} available to harvest.`;
  }
  const t = (entity.entity_type || "").toUpperCase();
  if (t === "ARTIFACT") return `${label} is a surviving record. Incomplete, but readable up close.`;
  if (t === "RUIN") return `${label} is a ruin. Entry may be legal; meaning is not free.`;
  return `${label} (${entity.entity_type.toLowerCase()}) is present and can be examined.`;
}

export function buildObservation(
  w: WorldRuntime,
  principal: PlayerPrincipal,
  consequence?: string,
): Observation {
  const pl = ensurePlayer(w, principal, w.entry_room_id || "room.relay-quarter");
  const room_id = pl.entered ? pl.room_id : w.entry_room_id || "room.relay-quarter";
  const room = w.rooms[room_id] || Object.values(w.rooms)[0];
  const entities = roomEntities(room);
  const exits = (room.exits || []).map((e) => ({
    direction: e.direction,
    to_room_id: e.to_room_id,
    to_room_name: w.rooms[e.to_room_id]?.name,
  }));
  const otherPlayers = Object.entries(w.players)
    .filter(([, p]) => p.entered)
    .map(([id, p]) => ({ player_id: id, handle: p.handle }));
  const openTrades = Object.values(w.trades || {}).filter(
    (t) =>
      t.status === "OPEN" &&
      (t.proposer_id === principal.player_id || t.counterparty_id === principal.player_id),
  );
  const orgs = Object.values(w.organizations || {}).filter((o) => o.status === "ACTIVE");
  const affordances = deriveAffordances({
    entities,
    exits,
    budgets: pl.budgets,
    otherPlayers,
    openTrades,
    organizations: orgs,
    selfId: principal.player_id,
  });
  const available_actions = [
    ...new Set(
      affordances.filter((a) => a.available).map((a) => a.operation || a.verb),
    ),
  ];
  const inbox = (w.messages || [])
    .filter((m) => m.recipient_id === principal.player_id)
    .slice(-20)
    .map((m) => ({
      message_id: m.message_id,
      sender_id: m.sender_id,
      text: m.text,
      delivered_cycle: m.delivered_cycle,
    }));

  return {
    cycle: w.cycle,
    sequence: w.sequence,
    world_name: w.world_name,
    location: {
      room_id: room.room_id,
      name: room.name,
      description: room.description,
      condition: deriveRoomCondition(room),
      exits,
      entities: entities.map((e) => ({
        entity_id: e.entity_id,
        label: e.label,
        entity_type: e.entity_type,
        condition: e.condition,
        stock_resource: e.stock_resource,
        stock_amount: e.stock_amount,
        repairable: isRepairable(e),
        harvestable: isHarvestable(e),
      })),
    },
    player_id: principal.player_id,
    budgets: { ...pl.budgets },
    messages: inbox,
    trades: openTrades.map((t) => ({
      trade_id: t.trade_id,
      proposer_id: t.proposer_id,
      counterparty_id: t.counterparty_id,
      offered: t.offered,
      requested: t.requested,
      status: t.status,
      role: t.proposer_id === principal.player_id ? ("proposer" as const) : ("counterparty" as const),
    })),
    organizations: orgs
      .map((o) => ({
        org_id: o.org_id,
        name: o.name,
        charter: o.charter,
        status: o.status,
        creator_id: o.creator_id,
        members: o.members.map((m) => ({ agent_id: m.agent_id, role: m.role })),
        my_role: o.members.find((m) => m.agent_id === principal.player_id)?.role || null,
        created_cycle: o.created_cycle,
      }))
      // Prefer memberships first, then newest — avoids stale org[0] selection in clients
      .sort((a, b) => {
        const am = a.my_role ? 0 : 1;
        const bm = b.my_role ? 0 : 1;
        if (am !== bm) return am - bm;
        return (b.created_cycle || 0) - (a.created_cycle || 0);
      }),
    in_world: pl.entered,
    players_here: otherPlayers.filter(
      (p) =>
        p.player_id !== principal.player_id &&
        w.players[p.player_id]?.entered &&
        w.players[p.player_id]?.room_id === room.room_id,
    ),
    services: servicesAtRoom({
      room_id: room.room_id,
      name: room.name,
      description: room.description,
      entities: entities.map((e) => ({
        label: e.label,
        entity_type: e.entity_type,
        condition: e.condition,
        harvestable: isHarvestable(e),
        stock_amount: e.stock_amount,
        repairable: isRepairable(e),
      })),
    }).map((s) => ({
      service_id: s.service_id,
      display_name: s.display_name,
      role: s.role,
      status: s.status,
      operations: s.operations,
      cannot: s.cannot,
      suggested_cmds: s.suggested_cmds,
      line: s.line,
    })),
    available_actions,
    affordances: affordances.map((a) => ({
      action: a.action,
      verb: a.verb,
      operation: a.operation,
      label: a.label,
      cmd: a.cmd,
      target_id: a.target_id,
      target_label: a.target_label,
      requires: a.requires as Record<string, number> | undefined,
      available: a.available,
      reason: a.reason,
      kind: a.kind,
    })),
    consequence,
    practice_lines: practiceLines(pl.practice),
    social_memory_lines: socialMemoryLines(
      pl.trade_memory,
      Object.fromEntries(
        Object.entries(w.players).map(([id, p]) => [id, p.handle]),
      ),
    ),
    culture_lines: cultureLines(
      w.culture,
      entities.map((e) => e.entity_id),
      principal.player_id,
    ),
    discovery_lines: discoveryLines(pl.discovery),
    contests: Object.values(w.contests || {})
      .filter((c) => c.status === "OPEN")
      .map((c) => publicContestProjection(c)),
  };
}

function fail(
  request_id: string,
  code: string,
  message: string,
  choices?: string[],
): CommandResult {
  return { ok: false, request_id, error: { code, message, choices } };
}

function recordPractice(
  w: WorldRuntime,
  actingPlayerId: string,
  events: NonNullable<CommandResult["events"]> | undefined,
): void {
  if (!events?.length) return;
  const trades: Record<string, { proposer_id: string; counterparty_id: string }> = {};
  for (const [id, trade] of Object.entries(w.trades || {})) {
    trades[id] = { proposer_id: trade.proposer_id, counterparty_id: trade.counterparty_id };
  }
  const byPlayer = new Map<string, PracticeCredit[]>();
  for (const ev of events) {
    for (const credit of creditsFromEvent(ev as PracticeEvent, { actingPlayerId, trades })) {
      const list = byPlayer.get(credit.player_id) || [];
      list.push({
        track_id: credit.track_id,
        unit: credit.unit,
        recognition_unit: credit.recognition_unit,
      });
      byPlayer.set(credit.player_id, list);
    }
  }
  for (const [playerId, credits] of byPlayer) {
    const player = w.players[playerId];
    if (!player) continue;
    player.practice = applyPracticeCredits(player.practice, credits);
  }
}

function recordCulture(
  w: WorldRuntime,
  actingPlayerId: string,
  events: NonNullable<CommandResult["events"]> | undefined,
): void {
  if (!events?.length) return;
  w.culture = applyCultureEvents(w.culture, events as CultureEvent[], actingPlayerId);
}

function recordTradeMemory(
  w: WorldRuntime,
  events: NonNullable<CommandResult["events"]> | undefined,
): void {
  if (!events?.length) return;
  const trades: Record<string, { proposer_id: string; counterparty_id: string }> = {};
  for (const [id, trade] of Object.entries(w.trades || {})) {
    trades[id] = { proposer_id: trade.proposer_id, counterparty_id: trade.counterparty_id };
  }
  for (const ev of events) {
    for (const credit of creditsFromTradeAccepted(ev as SocialEvent, trades)) {
      const player = w.players[credit.player_id];
      if (!player) continue;
      player.trade_memory = creditAcceptedTrade(
        player.trade_memory,
        credit.other_id,
        credit.trade_id,
      );
    }
  }
}

function success(
  w: WorldRuntime,
  principal: PlayerPrincipal,
  request_id: string,
  events: CommandResult["events"],
  consequence: string,
  settled: boolean,
): CommandResult {
  recordPractice(w, principal.player_id, events);
  recordTradeMemory(w, events);
  recordCulture(w, principal.player_id, events);
  return {
    ok: true,
    request_id,
    observation: buildObservation(w, principal, consequence),
    events,
    provenance: {
      player_id: principal.player_id,
      controller_id: principal.controller_id,
      session_id: principal.session_id,
      agent_id: principal.agent_id,
    },
    settled,
  };
}

export async function applyWorldCommand(
  w: WorldRuntime,
  principal: PlayerPrincipal,
  envl: CommandEnvelope,
  settle: (ev: {
    event_id: string;
    event_type: string;
    sequence: number;
    payload: Record<string, unknown>;
  }) => Promise<boolean>,
): Promise<CommandResult> {
  const request_id = envl.request_id || crypto.randomUUID();
  const idem = `${principal.player_id}::${envl.idempotency_key || request_id}`;
  if (w.seen_idempotency[idem]) return w.seen_idempotency[idem];

  if (envl.player_id && envl.player_id !== principal.player_id) {
    return fail(request_id, "FORBIDDEN", "player_id does not match principal");
  }

  const rawLine =
    typeof (envl.arguments || {}).line === "string"
      ? String((envl.arguments as { line?: string }).line)
      : envl.command;
  const askM = rawLine.trim().match(/^(?:ask|talk|use|consult|service)\s+(.+)$/i);
  if (askM && (isServiceConsultLine(rawLine) || /^ask\s+/i.test(rawLine))) {
    const pl0 = w.players[principal.player_id];
    const room0 = w.rooms[pl0?.room_id || w.entry_room_id];
    const present0 = servicesAtRoom({
      room_id: room0?.room_id || "",
      name: room0?.name || "",
      description: room0?.description || "",
      entities: room0 ? roomEntities(room0) : [],
    });
    const svc0 = resolveService(askM[1].replace(/^["']|["']$/g, ""), present0);
    if (svc0 || isServiceConsultLine(rawLine)) {
      const text = svc0
        ? consultLine(svc0)
        : present0.length
          ? `Desks here: ${present0.map((s) => s.display_name).join(", ")}.`
          : "No World Service desk is reachable here.";
      const result = success(w, principal, request_id, [], text, false);
      result.observation = { ...buildObservation(w, principal, text), consequence: text };
      w.seen_idempotency[idem] = result;
      return result;
    }
  }

  // Client may send human line or structured command
  const rawArgs = (envl.arguments || {}) as Record<string, unknown>;
  let parsed =
    typeof rawArgs.line === "string"
      ? parseHumanCommand(String(rawArgs.line), {
          entities: roomEntities(
            w.rooms[w.players[principal.player_id]?.room_id || w.entry_room_id] ||
              Object.values(w.rooms)[0],
          ),
          players: Object.entries(w.players).map(([id, p]) => ({
            player_id: id,
            handle: p.handle,
          })),
          selfId: principal.player_id,
          openTrades: Object.values(w.trades || {}),
        })
      : normalizeStructuredCommand(envl.command, rawArgs);

  // Also accept command as human line if arguments empty and command looks lower-case multiword
  if (
    !parsed.ok &&
    envl.command &&
    ![
      "LOOK",
      "MOVE",
      "INSPECT",
      "WAIT",
      "MESSAGE",
      "TRADE",
      "COMMIT",
      "HARVEST",
      "REPAIR",
      "ORG_CREATE",
      "ORG_MEMBER_ADD",
      "ORG_MEMBER_REMOVE",
      "ENTER_WORLD",
      "LEAVE_WORLD",
      "JOIN",
      "OBSERVE",
      "TALK",
      "USE",
      "CONSULT",
      "SERVICE",
      "BUILD",
      "CONTEST_DECLARE",
      "CONTEST_DEFEND",
    ].includes(envl.command.toUpperCase())
  ) {
    const pl = w.players[principal.player_id];
    const room = w.rooms[pl?.room_id || w.entry_room_id];
    parsed = parseHumanCommand(envl.command, {
      entities: room ? roomEntities(room) : [],
      players: Object.entries(w.players).map(([id, p]) => ({ player_id: id, handle: p.handle })),
      selfId: principal.player_id,
      openTrades: Object.values(w.trades || {}),
    });
  }

  if (!parsed.ok) {
    if (parsed.code === "SERVICE") {
      const pl = ensurePlayer(w, principal, w.entry_room_id);
      const room = w.rooms[pl.room_id || w.entry_room_id];
      const present = servicesAtRoom({
        room_id: room?.room_id || "",
        name: room?.name || "",
        description: room?.description || "",
        entities: room ? roomEntities(room) : [],
      });
      const raw = (parsed.choices || []).join(" ");
      const svc = resolveService(raw, present);
      const text = svc
        ? consultLine(svc)
        : present.length
          ? `Desks here: ${present.map((s) => s.display_name).join(", ")}. Try: talk ${present[0].display_name.toLowerCase()}`
          : "No World Service desk is reachable here. Canonical commands still work.";
      const result = success(w, principal, request_id, [], text, false);
      result.observation = { ...buildObservation(w, principal, text), consequence: text };
      w.seen_idempotency[idem] = result;
      return result;
    }
    if (parsed.code === "HELP") {
      const topic = parsed.choices?.[0];
      const pl = ensurePlayer(w, principal, w.entry_room_id);
      const room = w.rooms[pl.room_id || w.entry_room_id];
      const aff = deriveAffordances({
        entities: room ? roomEntities(room) : [],
        exits: room?.exits || [],
        budgets: pl.budgets,
        otherPlayers: Object.entries(w.players).map(([id, p]) => ({
          player_id: id,
          handle: p.handle,
        })),
        openTrades: Object.values(w.trades || {}).filter((t) => t.status === "OPEN"),
        organizations: Object.values(w.organizations || {}).filter((o) => o.status === "ACTIVE"),
        selfId: principal.player_id,
      });
      const text = helpText(topic, aff);
      const result = success(w, principal, request_id, [], text, false);
      // HELP does not mutate — still return ok observation
      result.observation = {
        ...buildObservation(w, principal, text),
        consequence: text,
      };
      w.seen_idempotency[idem] = result;
      return result;
    }
    return fail(request_id, parsed.code || "INVALID_REQUEST", parsed.error, parsed.choices);
  }

  const action = parsed.action;
  const events: NonNullable<CommandResult["events"]> = [];
  let settled = false;
  const entry = w.entry_room_id || "room.relay-quarter";

  const pushEvent = (event_type: string, payload: Record<string, unknown>) => {
    w.sequence += 1;
    const event_id = `evt.${w.sequence.toString().padStart(6, "0")}`;
    events.push({ event_id, event_type, sequence: w.sequence, payload });
    return { event_id, event_type, sequence: w.sequence, payload };
  };

  const settleEv = async (ev: {
    event_id: string;
    event_type: string;
    sequence: number;
    payload: Record<string, unknown>;
  }) => {
    const ok = await settle(ev);
    if (!ok) {
      w.unsettled = w.unsettled || [];
      if (!w.unsettled.some((u) => u.event_id === ev.event_id)) {
        w.unsettled.push({
          event_id: ev.event_id,
          event_type: ev.event_type,
          sequence: ev.sequence,
          cycle: w.cycle,
          player_id: principal.player_id,
          controller_id: principal.controller_id,
          session_id: principal.session_id,
          payload: ev.payload,
        });
      }
    }
    settled = ok || settled;
  };

  // ——— ENTER ———
  if (action.verb === "ENTER_WORLD") {
    const pl = ensurePlayer(w, principal, entry);
    pl.room_id = entry;
    pl.entered = true;
    const ev = pushEvent("AGENT_ENTERED_WORLD", {
      player_id: principal.player_id,
      room_id: entry,
      budgets: { ...pl.budgets },
    });
    await settleEv(ev);
    const result = success(
      w,
      principal,
      request_id,
      events,
      `You enter ${w.world_name || "the world"}.`,
      settled,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— LEAVE (lifecycle; not a strategic verb) ———
  if (action.verb === "LEAVE_WORLD") {
    const leaving = ensurePlayer(w, principal, entry);
    if (!leaving.entered) {
      return fail(request_id, "NOT_IN_WORLD", "You are not in the world.");
    }
    const fromRoom = leaving.room_id;
    leaving.entered = false;
    const ev = pushEvent("AGENT_LEFT_WORLD", {
      player_id: principal.player_id,
      room_id: fromRoom,
      reason: action.arguments.reason || "VOLUNTARY",
    });
    await settleEv(ev);
    const result = success(w, principal, request_id, events, "You leave the world.", settled);
    w.seen_idempotency[idem] = result;
    return result;
  }

  const pl = ensurePlayer(w, principal, entry);

  // ——— LOOK / OBSERVE ———
  if (action.verb === "LOOK" || action.verb === "OBSERVE") {
    if (!pl.entered) {
      pl.room_id = entry;
      pl.entered = true;
    }
    if (action.verb === "LOOK") {
      if (!canPay(pl.budgets, COSTS.LOOK)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
      }
      debit(pl.budgets, COSTS.LOOK);
      const room_id = pl.room_id;
      const lookEv = pushEvent("LOOK", {
        player_id: principal.player_id,
        room_id,
        cost_paid: COSTS.LOOK,
      });
      await settleEv(lookEv);
      // Specs: LOOK → OBSERVATION_GENERATED (same cycle batch)
      const obsEv = pushEvent("OBSERVATION_GENERATED", {
        observation_id: `obs.${lookEv.sequence}`,
        player_id: principal.player_id,
        kind: "LOOK",
        room_id,
        source_event_id: lookEv.event_id,
      });
      await settleEv(obsEv);
    }
    const room = w.rooms[pl.room_id];
    const result = success(
      w,
      principal,
      request_id,
      events,
      room ? `You take in ${room.name}.` : "You look around.",
      settled,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  if (!pl.entered) {
    return fail(request_id, "NOT_IN_WORLD", "Enter the world first.");
  }

  if (
    pl.disabled_until_cycle != null &&
    w.cycle < pl.disabled_until_cycle &&
    action.verb !== "LOOK" &&
    action.verb !== "OBSERVE" &&
    action.verb !== "WAIT" &&
    action.verb !== "INSPECT"
  ) {
    return fail(request_id, "FORBIDDEN", "You are under presence pressure.");
  }

  // ——— WAIT ———
  if (action.verb === "WAIT") {
    const waitCycles = 1;
    pl.wait_until_cycle = w.cycle + waitCycles;
    pl.budgets.attention = Math.min(8, pl.budgets.attention + 2);
    pl.budgets.compute = Math.min(64, pl.budgets.compute + 4);
    const committed = commitCycleIfReady(w);
    pushEvent("WAIT", {
      player_id: principal.player_id,
      cycles: waitCycles,
      wait_until_cycle: pl.wait_until_cycle,
      world_cycle: w.cycle,
      cycle_committed: committed,
    });
    if (committed) {
      await resolveDueContests(w, pushEvent, settleEv);
      await applyScheduledPressure(w, pushEvent, settleEv);
    }
    const result = success(w, principal, request_id, events, "You wait.", false);
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— MOVE ———
  if (action.verb === "MOVE") {
    if (!canPay(pl.budgets, COSTS.MOVE)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough energy.");
    }
    const direction = action.arguments.direction;
    const room = w.rooms[pl.room_id];
    const exit = room?.exits.find(
      (e) => e.direction === direction || e.to_room_id === direction,
    );
    if (!exit) {
      return fail(
        request_id,
        "MOVE_REJECTED",
        direction ? `There is no exit ${direction} from here.` : "Choose a direction to move.",
      );
    }
    if (isAccessDenied(w, principal.player_id, room.room_id, exit.direction)) {
      return fail(request_id, "MOVE_REJECTED", "That route is restricted.");
    }
    debit(pl.budgets, COSTS.MOVE);
    const from = room.room_id;
    pl.room_id = exit.to_room_id;
    const ev = pushEvent("MOVE", {
      player_id: principal.player_id,
      from,
      to: exit.to_room_id,
      direction: exit.direction,
      cost_paid: COSTS.MOVE,
    });
    await settleEv(ev);
    const dest = w.rooms[exit.to_room_id];
    const result = success(
      w,
      principal,
      request_id,
      events,
      dest ? `You arrive at ${dest.name}.` : `You move ${exit.direction}.`,
      settled,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— INSPECT ———
  if (action.verb === "INSPECT") {
    if (!canPay(pl.budgets, COSTS.INSPECT)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
    }
    const room = w.rooms[pl.room_id];
    const entity = findEntity(room, action.arguments.entity_id);
    if (!entity) {
      return fail(request_id, "INSPECT_FAILED", `You do not see “${action.arguments.entity_id}” here.`);
    }
    debit(pl.budgets, COSTS.INSPECT);
    const detail = inspectDetail(entity);
    const inspEv = pushEvent("INSPECT", {
      player_id: principal.player_id,
      entity_id: entity.entity_id,
      room_id: pl.room_id,
      cost_paid: COSTS.INSPECT,
      detail,
    });
    await settleEv(inspEv);
    // Specs: INSPECT → OBSERVATION_GENERATED
    const obsEv = pushEvent("OBSERVATION_GENERATED", {
      observation_id: `obs.${inspEv.sequence}`,
      player_id: principal.player_id,
      kind: "INSPECT",
      room_id: pl.room_id,
      entity_id: entity.entity_id,
      source_event_id: inspEv.event_id,
    });
    await settleEv(obsEv);
    recordPractice(w, principal.player_id, events);
    recordCulture(w, principal.player_id, events);
    pl.discovery = applyInspectEvidence(pl.discovery, entity);
    const obs = buildObservation(w, principal, detail);
    obs.location = {
      ...obs.location,
      description: `${obs.location.description} You inspect ${titleCaseLabel(entity.label)}: ${detail}`,
    };
    const result: CommandResult = {
      ok: true,
      request_id,
      observation: obs,
      events,
      provenance: {
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        agent_id: principal.agent_id,
      },
      settled,
    };
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— MESSAGE ———
  if (action.verb === "MESSAGE") {
    if (!canPay(pl.budgets, COSTS.MESSAGE)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough compute.");
    }
    const recipient_id = action.arguments.recipient_id;
    const text = action.arguments.text.slice(0, 500);
    const recipient = w.players[recipient_id];
    if (!recipient?.entered) {
      return fail(request_id, "FORBIDDEN", "Recipient is not addressable in this world.");
    }
    if (pl.room_id !== recipient.room_id) {
      const best = bestLiveRelayCondition(collectLiveRelays(w.rooms));
      if (!longRangeDeliverable(best)) {
        return fail(request_id, UNREACHABLE_REASON, UNREACHABLE_MESSAGE);
      }
    }
    debit(pl.budgets, COSTS.MESSAGE);
    const message_id = `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`;
    const ev1 = pushEvent("MESSAGE", {
      message_id,
      sender_id: principal.player_id,
      recipient_id,
      text,
      cost_paid: COSTS.MESSAGE,
    });
    const ev2 = pushEvent("MESSAGE_DELIVERED", {
      message_id,
      recipient_id,
      delivered_cycle: w.cycle,
    });
    w.messages = w.messages || [];
    w.messages.push({
      message_id,
      sender_id: principal.player_id,
      recipient_id,
      text,
      status: "DELIVERED",
      delivered_cycle: w.cycle,
    });
    await settleEv(ev1);
    await settleEv(ev2);
    const result = success(
      w,
      principal,
      request_id,
      events,
      `Message delivered to ${recipient.handle || recipient_id}.`,
      settled,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— TRADE ———
  if (action.verb === "TRADE") {
    const phase = action.arguments.phase;

    if (phase === "propose") {
      if (!canPay(pl.budgets, COSTS.TRADE)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough compute.");
      }
      const counterparty_id = action.arguments.counterparty_id || "";
      const offered = sanitizeTradeAmounts(action.arguments.offered);
      const requested = sanitizeTradeAmounts(action.arguments.requested);
      if (!counterparty_id || !offered || !requested) {
        return fail(request_id, "INVALID_REQUEST", "counterparty, offer, and want are required.");
      }
      if (!w.players[counterparty_id]?.entered) {
        return fail(request_id, "FORBIDDEN", "Counterparty is not active.");
      }
      for (const [res, amt] of Object.entries(offered)) {
        if ((pl.budgets[res as keyof Budgets] ?? 0) < amt) {
          return fail(request_id, "BUDGET_EXCEEDED", `You do not have enough ${res} to offer.`);
        }
      }
      debit(pl.budgets, COSTS.TRADE);
      // reserve offered
      const reserved: Record<string, number> = {};
      for (const [res, amt] of Object.entries(offered)) {
        pl.budgets[res as keyof Budgets] = (pl.budgets[res as keyof Budgets] ?? 0) - amt;
        reserved[res] = amt;
      }
      const trade_id = `trade.${(w.sequence + 1).toString().padStart(4, "0")}`;
      w.trades[trade_id] = {
        trade_id,
        proposer_id: principal.player_id,
        counterparty_id,
        offered: { ...offered },
        requested: { ...requested },
        status: "OPEN",
        reserved,
        expires_cycle: action.arguments.expires_cycle,
      };
      const ev = pushEvent("TRADE_PROPOSED", {
        trade_id,
        proposer_id: principal.player_id,
        counterparty_id,
        offered,
        requested,
        cost_paid: COSTS.TRADE,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Trade ${trade_id} offered. Resources reserved.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    if (phase === "accept") {
      if (!canPay(pl.budgets, COSTS.TRADE)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough compute.");
      }
      const trade = w.trades[action.arguments.trade_id || ""];
      if (!trade || trade.status !== "OPEN") {
        return fail(request_id, "TRADE_FAILED", "Unknown or closed trade.");
      }
      if (trade.counterparty_id !== principal.player_id) {
        return fail(request_id, "FORBIDDEN", "Only the counterparty can accept.");
      }
      if (trade.expires_cycle != null && w.cycle > trade.expires_cycle) {
        // release reservation
        const proposer = w.players[trade.proposer_id];
        if (proposer) {
          for (const [res, amt] of Object.entries(trade.reserved || {})) {
            proposer.budgets[res as keyof Budgets] =
              (proposer.budgets[res as keyof Budgets] ?? 0) + amt;
          }
        }
        trade.status = "REJECTED";
        trade.reserved = {};
        return fail(request_id, "TRADE_FAILED", "Trade expired.");
      }
      for (const [res, amt] of Object.entries(trade.requested)) {
        if ((pl.budgets[res as keyof Budgets] ?? 0) < amt) {
          return fail(request_id, "BUDGET_EXCEEDED", `You do not have enough ${res}.`);
        }
      }
      debit(pl.budgets, COSTS.TRADE);
      const proposer = w.players[trade.proposer_id];
      if (!proposer) return fail(request_id, "TRADE_FAILED", "Proposer missing.");

      // Atomic both legs: counterparty pays requested → proposer; reserved offered → counterparty
      for (const [res, amt] of Object.entries(trade.requested)) {
        pl.budgets[res as keyof Budgets] = (pl.budgets[res as keyof Budgets] ?? 0) - amt;
        proposer.budgets[res as keyof Budgets] = (proposer.budgets[res as keyof Budgets] ?? 0) + amt;
      }
      for (const [res, amt] of Object.entries(trade.offered)) {
        // reserved already removed from proposer; credit counterparty
        pl.budgets[res as keyof Budgets] = (pl.budgets[res as keyof Budgets] ?? 0) + amt;
      }
      trade.reserved = {};
      trade.status = "SETTLED";
      const evA = pushEvent("TRADE_ACCEPTED", {
        trade_id: trade.trade_id,
        accepted_by: principal.player_id,
      });
      const evT1 = pushEvent("RESOURCE_TRANSFER", {
        trade_id: trade.trade_id,
        from_id: principal.player_id,
        to_id: trade.proposer_id,
        leg: "requested",
        resources: trade.requested,
      });
      const evT2 = pushEvent("RESOURCE_TRANSFER", {
        trade_id: trade.trade_id,
        from_id: trade.proposer_id,
        to_id: principal.player_id,
        leg: "offered",
        resources: trade.offered,
      });
      await settleEv(evA);
      await settleEv(evT1);
      await settleEv(evT2);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Trade ${trade.trade_id} settled.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    if (phase === "reject" || phase === "cancel") {
      const trade = w.trades[action.arguments.trade_id || ""];
      if (!trade || trade.status !== "OPEN") {
        return fail(request_id, "TRADE_FAILED", "Unknown or closed trade.");
      }
      const isCounter = trade.counterparty_id === principal.player_id;
      const isProposer = trade.proposer_id === principal.player_id;
      if (phase === "reject" && !isCounter) {
        return fail(request_id, "FORBIDDEN", "Only the counterparty can reject.");
      }
      if (phase === "cancel" && !isProposer) {
        return fail(request_id, "FORBIDDEN", "Only the proposer can cancel.");
      }
      const proposer = w.players[trade.proposer_id];
      if (proposer) {
        for (const [res, amt] of Object.entries(trade.reserved || {})) {
          proposer.budgets[res as keyof Budgets] =
            (proposer.budgets[res as keyof Budgets] ?? 0) + amt;
        }
      }
      trade.reserved = {};
      trade.status = phase === "cancel" ? "CANCELLED" : "REJECTED";
      const reason = action.arguments.reason || (phase === "cancel" ? "CANCELLED" : "DECLINED");
      const ev = pushEvent(phase === "cancel" ? "TRADE_CANCELLED" : "TRADE_REJECTED", {
        trade_id: trade.trade_id,
        reason,
        by: principal.player_id,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Trade ${trade.trade_id} closed (${reason}).`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }
  }

  // ——— COMMIT (REPAIR / HARVEST / ORG_* / CONTEST_*) ———
  if (action.verb === "COMMIT") {
    if (action.arguments.operation === "CONTEST_DECLARE") {
      return applyContestDeclare(
        w,
        principal,
        request_id,
        idem,
        action.arguments,
        pl,
        events,
        pushEvent,
        settleEv,
      );
    }
    if (action.arguments.operation === "CONTEST_DEFEND") {
      return applyContestDefend(
        w,
        principal,
        request_id,
        idem,
        action.arguments,
        pl,
        events,
        pushEvent,
        settleEv,
      );
    }
    // ——— ORG_CREATE ———
    if (action.arguments.operation === "ORG_CREATE") {
      if (!canPay(pl.budgets, COSTS.ORG_CREATE)) {
        return fail(
          request_id,
          "BUDGET_EXCEEDED",
          "You need influence 5 and compute 2 to form an organization.",
        );
      }
      const name = String(action.arguments.name || "").trim();
      const charter = String(action.arguments.charter || "").trim();
      if (!name || !charter) {
        return fail(request_id, "INVALID_REQUEST", "name and charter required");
      }
      // Server allocates org_id unless agent supplied a fresh unused id
      let org_id = action.arguments.org_id?.trim();
      if (org_id) {
        if (w.organizations[org_id]) {
          return fail(request_id, "FORBIDDEN", "org_id already exists");
        }
      } else {
        org_id = allocateOrgId(name);
        while (w.organizations[org_id]) org_id = allocateOrgId(name);
      }
      debit(pl.budgets, COSTS.ORG_CREATE);
      const members =
        action.arguments.initial_members && action.arguments.initial_members.length
          ? action.arguments.initial_members.map((m) => ({
              agent_id: m.agent_id,
              role: assignedOrgRole(m.role),
            }))
          : [{ agent_id: principal.player_id, role: "founder" as OrgRole }];
      if (!members.some((m) => m.agent_id === principal.player_id)) {
        members.unshift({ agent_id: principal.player_id, role: "founder" });
      } else {
        // Ensure creator is founder
        members.forEach((m) => {
          if (m.agent_id === principal.player_id) m.role = "founder";
        });
      }
      w.organizations[org_id] = {
        org_id,
        name,
        charter,
        status: "ACTIVE",
        creator_id: principal.player_id,
        members,
        created_cycle: w.cycle,
      };
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: COSTS.ORG_CREATE,
        reason: "ORG_CREATE",
      });
      const ev = pushEvent("ORG_CREATE", {
        org_id,
        name,
        charter,
        creator_id: principal.player_id,
        members,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Organization formed: ${name} (${org_id}). You are founder.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    // ——— ORG_MEMBER_ADD ———
    if (action.arguments.operation === "ORG_MEMBER_ADD") {
      if (!canPay(pl.budgets, COSTS.ORG_MEMBER_ADD)) {
        return fail(
          request_id,
          "BUDGET_EXCEEDED",
          "You need influence 1 and compute 2 to invite a member.",
        );
      }
      const org_id = String(action.arguments.org_id || "").trim();
      const agent_id = String(action.arguments.agent_id || "").trim();
      const role = assignedOrgRole(action.arguments.role);
      const org = w.organizations[org_id];
      if (!org || org.status !== "ACTIVE") {
        return fail(request_id, "NOT_FOUND", "Organization not found.");
      }
      if (!isOrgOfficer(org, principal.player_id)) {
        return fail(request_id, "FORBIDDEN", "Only a founder or officer may invite.");
      }
      if (!w.players[agent_id]?.entered) {
        return fail(request_id, "FORBIDDEN", "Invitee is not active in the world.");
      }
      if (isOrgMember(org, agent_id)) {
        return fail(request_id, "FORBIDDEN", "Already a member.");
      }
      if (role === "founder") {
        return fail(request_id, "FORBIDDEN", "Cannot invite as founder.");
      }
      debit(pl.budgets, COSTS.ORG_MEMBER_ADD);
      org.members.push({
        agent_id,
        role: role === "officer" ? "officer" : role === "advisor" ? "advisor" : "member",
      });
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: COSTS.ORG_MEMBER_ADD,
        reason: "ORG_MEMBER_ADD",
      });
      const ev = pushEvent("ORG_MEMBER_ADD", {
        org_id,
        agent_id,
        role: role === "officer" ? "officer" : role === "advisor" ? "advisor" : "member",
        by: principal.player_id,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Invited ${agent_id} to ${org.name} as ${role === "officer" ? "officer" : role === "advisor" ? "advisor" : "member"}.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    // ——— ORG_MEMBER_REMOVE (leave or remove) ———
    if (action.arguments.operation === "ORG_MEMBER_REMOVE") {
      const org_id = String(action.arguments.org_id || "").trim();
      let agent_id = String(action.arguments.agent_id || "").trim() || principal.player_id;
      const reason = String(action.arguments.reason || "REMOVED");
      const org = w.organizations[org_id];
      if (!org || org.status !== "ACTIVE") {
        return fail(request_id, "NOT_FOUND", "Organization not found.");
      }
      const selfLeave = agent_id === principal.player_id;
      if (!selfLeave && !isOrgOfficer(org, principal.player_id)) {
        return fail(request_id, "FORBIDDEN", "Only a founder or officer may remove members.");
      }
      if (!isOrgMember(org, agent_id)) {
        return fail(request_id, "NOT_FOUND", "That Player is not a member.");
      }
      // Prevent removing last founder without another founder
      const target = org.members.find((m) => m.agent_id === agent_id)!;
      if (target.role === "founder") {
        const founders = org.members.filter((m) => m.role === "founder");
        if (founders.length <= 1 && org.members.length > 1) {
          return fail(
            request_id,
            "FORBIDDEN",
            "Cannot remove the only founder while other members remain.",
          );
        }
      }
      if (!canPay(pl.budgets, COSTS.ORG_MEMBER_REMOVE)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
      }
      debit(pl.budgets, COSTS.ORG_MEMBER_REMOVE);
      org.members = org.members.filter((m) => m.agent_id !== agent_id);
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: COSTS.ORG_MEMBER_REMOVE,
        reason: "ORG_MEMBER_REMOVE",
      });
      const ev = pushEvent("ORG_MEMBER_REMOVE", {
        org_id,
        agent_id,
        reason,
        by: principal.player_id,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        selfLeave
          ? `You left ${org.name}.`
          : `Removed ${agent_id} from ${org.name} (${reason}).`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    // Entity-targeted ops
    const room = w.rooms[pl.room_id];
    const entity = findEntity(room, action.arguments.entity_id || "");
    if (!entity) {
      return fail(
        request_id,
        "NOT_FOUND",
        `You do not see “${action.arguments.entity_id || "that"}” here.`,
      );
    }

    if (action.arguments.operation === "REPAIR") {
      if (!isRepairable(entity)) {
        return fail(request_id, "FORBIDDEN", "That is not repairable here.");
      }
      if (!canPay(pl.budgets, COSTS.REPAIR)) {
        return fail(
          request_id,
          "BUDGET_EXCEEDED",
          "You need energy 3, compute 2, and storage 1 to repair.",
        );
      }
      const before = entity.condition ?? 0;
      debit(pl.budgets, COSTS.REPAIR);
      entity.condition = Math.min(100, before + 15);
      // persist entity back
      const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
      if (idx >= 0) room.entities[idx] = entity;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: COSTS.REPAIR,
        reason: "REPAIR",
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: entity.entity_id,
        field: "condition",
        from: before,
        to: entity.condition,
        operation: "REPAIR",
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `${titleCaseLabel(entity.label)} repaired. Condition ${before}% → ${entity.condition}%.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    if (action.arguments.operation === "HARVEST") {
      if (!isHarvestable(entity)) {
        return fail(request_id, "FORBIDDEN", "Nothing to harvest there.");
      }
      const amount = Math.max(1, Math.floor(action.arguments.amount || 1));
      if ((entity.stock_amount ?? 0) < amount) {
        return fail(request_id, "FORBIDDEN", "Not enough stock available.");
      }
      if ((pl.budgets.storage ?? 0) < amount) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough free storage.");
      }
      if (!canPay(pl.budgets, COSTS.HARVEST)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need energy 2 and compute 1 to harvest.");
      }
      const resource = entity.stock_resource || "energy";
      debit(pl.budgets, COSTS.HARVEST);
      entity.stock_amount = (entity.stock_amount ?? 0) - amount;
      pl.budgets.storage = (pl.budgets.storage ?? 0) - amount;
      // harvested resource credit (energy/compute/etc.)
      if (resource in pl.budgets) {
        pl.budgets[resource as keyof Budgets] =
          (pl.budgets[resource as keyof Budgets] ?? 0) + amount;
      } else {
        pl.budgets.energy = (pl.budgets.energy ?? 0) + amount;
      }
      const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
      if (idx >= 0) room.entities[idx] = entity;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: COSTS.HARVEST,
        reason: "HARVEST",
      });
      pushEvent("RESOURCE_TRANSFER", {
        from_id: entity.entity_id,
        to_id: principal.player_id,
        resource,
        amount,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: entity.entity_id,
        field: "stock_amount",
        to: entity.stock_amount,
        operation: "HARVEST",
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Harvested ${amount} ${resource} from ${titleCaseLabel(entity.label)}.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }
  }

  // ——— BUILD (GC2-S0 CONSTRUCT / DISMANTLE) ———
  if (action.verb === "BUILD") {
    const room = w.rooms[pl.room_id];
    if (!room) {
      return fail(request_id, "NOT_FOUND", "You are not in a known room.");
    }

    if (action.arguments.operation === "CONSTRUCT") {
      const classId = action.arguments.class;
      const targetRoomId = action.arguments.room_id || pl.room_id;
      const target = w.rooms[targetRoomId];
      if (!target) {
        return fail(request_id, "NOT_FOUND", "That room is not here.");
      }
      if (isHiddenRoom(target)) {
        return fail(request_id, "NOT_OBSERVABLE", "That place cannot be used for construction.");
      }
      if (target.room_id !== pl.room_id) {
        return fail(request_id, "NOT_COLOCATED", "You must be in that room to construct.");
      }
      if (liveClassInRoom(roomEntities(target), classId)) {
        return fail(request_id, "SLOT_OCCUPIED", `A ${classId.replace(/_/g, " ")} is already here.`);
      }
      const cost = CONSTRUCT_COSTS[classId];
      if (!canPay(pl.budgets, cost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to construct.");
      }
      debit(pl.budgets, cost);
      const entity_id = allocateInfraId(classId);
      const label = constructLabel(classId);
      const created: EntityRuntime = {
        entity_id,
        label,
        entity_type: "INFRASTRUCTURE",
        condition: 100,
        owner_id: principal.player_id,
        infra_type: classId,
      };
      target.entities = [...roomEntities(target), created];
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: cost,
        reason: "CONSTRUCT",
        class: classId,
      });
      const ev = pushEvent("ENTITY_CREATE", {
        entity_id,
        entity_type: "INFRASTRUCTURE",
        owner_id: principal.player_id,
        location: target.room_id,
        room_id: target.room_id,
        label,
        properties: { infra_type: classId },
        state: { condition: 100 },
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Constructed ${label.replace(/-/g, " ")} (${entity_id}).`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    if (action.arguments.operation === "DISMANTLE") {
      const rawId = action.arguments.entity_id;
      const here = findEntity(room, rawId);
      if (!here) {
        let elsewhere = false;
        for (const other of Object.values(w.rooms)) {
          if (other.room_id === room.room_id) continue;
          if (findEntity(other, rawId)) {
            elsewhere = true;
            break;
          }
        }
        if (elsewhere) {
          return fail(request_id, "NOT_COLOCATED", "You must be in the same room to dismantle that.");
        }
        return fail(request_id, "NOT_FOUND", `You do not see “${rawId}” here.`);
      }
      const classId = infraClassOf(here);
      if (!classId) {
        return fail(request_id, "NOT_FOUND", "That is not constructible infrastructure.");
      }
      if (here.owner_id !== principal.player_id) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      if (!canPay(pl.budgets, DISMANTLE_COST)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need energy 4 and compute 2 to dismantle.");
      }
      debit(pl.budgets, DISMANTLE_COST);
      const salvage = SALVAGE_STORAGE[classId];
      const clamped = clampSalvage(pl.budgets.storage ?? 0, salvage);
      pl.budgets.storage = clamped.next;
      room.entities = roomEntities(room).filter((e) => e.entity_id !== here.entity_id);
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: DISMANTLE_COST,
        reason: "DISMANTLE",
        salvage_storage: clamped.added,
        salvage_overflow: clamped.overflow,
      });
      const ev = pushEvent("ENTITY_DESTROY", {
        entity_id: here.entity_id,
        reason: "DISMANTLED",
        class: classId,
        owner_id: here.owner_id,
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        `Dismantled ${titleCaseLabel(here.label)}.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }
  }

  return fail(
    request_id,
    "UNKNOWN_COMMAND",
    `That action (${(action as CanonicalAction).verb}) is not available in this stage of the world.`,
  );
}

/** Migrate legacy player/entity shapes after load. */
export function migrateWorldRuntime(w: WorldRuntime): void {
  w.trades = w.trades || {};
  w.messages = w.messages || [];
  w.organizations = w.organizations || {};
  if (!w.culture) w.culture = emptyCulture();
  for (const room of Object.values(w.rooms)) {
    room.entities = (room.entities || []).map((e) => enrichEntity(e));
  }
  for (const p of Object.values(w.players)) {
    if (!p.budgets) p.budgets = cloneBudgets(null);
    else p.budgets = cloneBudgets(p.budgets);
    if (!p.practice) p.practice = { catalog_id: "mastery-catalog/gc1-s1", tracks: {}, recognition: {} };
    if (!p.trade_memory) p.trade_memory = { catalog_id: "social-memory-catalog/gc3-s0", edges: {} };
  }
  w.contests = w.contests || {};
  w.access_restrictions = w.access_restrictions || [];
  if (!w.pressure) w.pressure = emptyPressure();
}

type PushEv = (
  event_type: string,
  payload: Record<string, unknown>,
) => { event_id: string; event_type: string; sequence: number; payload: Record<string, unknown> };

type SettleEv = (ev: {
  event_id: string;
  event_type: string;
  sequence: number;
  payload: Record<string, unknown>;
}) => Promise<void>;

function isAccessDenied(
  w: WorldRuntime,
  playerId: string,
  roomId: string,
  direction?: string,
): boolean {
  for (const r of w.access_restrictions || []) {
    if (r.mode !== "DENY") continue;
    if (w.cycle > r.expires_cycle) continue;
    if (r.applies_to !== playerId && r.applies_to !== "*") continue;
    if (r.scope === "ROOM" && r.room_id === roomId) return true;
    if (r.scope === "EXIT" && r.room_id === roomId && direction && r.exit_id === direction) return true;
  }
  return false;
}

function reserveStake(budgets: Budgets, stake: StakeMap): void {
  for (const [k, amt] of Object.entries(stake)) {
    budgets[k as keyof Budgets] = (budgets[k as keyof Budgets] ?? 0) - amt;
  }
}

function releaseStake(budgets: Budgets | undefined, stake: StakeMap): void {
  if (!budgets) return;
  for (const [k, amt] of Object.entries(stake)) {
    budgets[k as keyof Budgets] = (budgets[k as keyof Budgets] ?? 0) + amt;
  }
}

function canAffordStake(budgets: Budgets, cost: Partial<Budgets>, stake: StakeMap): boolean {
  const merged: Partial<Budgets> = { ...cost };
  for (const [k, amt] of Object.entries(stake)) {
    merged[k as keyof Budgets] = (merged[k as keyof Budgets] || 0) + amt;
  }
  return canPay(budgets, merged);
}

function openContests(w: WorldRuntime): OpenContest[] {
  return Object.values(w.contests || {}).filter((c) => c.status === "OPEN");
}

function normalizeDeclareTarget(
  w: WorldRuntime,
  room: RoomState,
  form: ContestForm,
  target: ContestTarget,
  actorId: string,
): { ok: true; target: ContestTarget } | { ok: false; code: string; message: string } {
  if (!targetKindAllowed(form, target.kind)) {
    return { ok: false, code: "FORM_FORBIDDEN", message: "That target kind is not allowed for this form." };
  }
  if (target.kind === "ENTITY") {
    const ent = findEntity(room, target.entity_id);
    if (!ent) return { ok: false, code: "NOT_FOUND", message: "You do not see that target here." };
    if (form === "INFRASTRUCTURE_DISRUPTION" && ent.entity_type.toUpperCase() !== "INFRASTRUCTURE") {
      return { ok: false, code: "FORBIDDEN", message: "Disruption requires live infrastructure." };
    }
    return { ok: true, target: { kind: "ENTITY", entity_id: ent.entity_id } };
  }
  if (target.kind === "ROOM") {
    return { ok: true, target: { kind: "ROOM", room_id: room.room_id } };
  }
  if (target.kind === "EXIT") {
    const exit = room.exits.find(
      (e) => e.direction === target.exit_id || e.to_room_id === target.exit_id,
    );
    if (!exit) return { ok: false, code: "NOT_FOUND", message: "There is no such exit here." };
    return { ok: true, target: { kind: "EXIT", exit_id: exit.direction } };
  }
  if (target.kind === "AGENT") {
    const other = w.players[target.agent_id];
    if (!other?.entered || other.room_id !== room.room_id) {
      return { ok: false, code: "NOT_COLOCATED", message: "That Player is not here." };
    }
    if (target.agent_id === actorId) {
      return { ok: false, code: "FORBIDDEN", message: "You cannot pressure yourself." };
    }
    return { ok: true, target };
  }
  if (target.kind === "HOLDING") {
    const holder = w.players[target.holder_id];
    if (!holder?.entered || holder.room_id !== room.room_id) {
      return { ok: false, code: "NOT_COLOCATED", message: "That holder is not here." };
    }
    return { ok: true, target };
  }
  return { ok: false, code: "FORM_FORBIDDEN", message: "Unknown target." };
}

async function applyContestDeclare(
  w: WorldRuntime,
  principal: PlayerPrincipal,
  request_id: string,
  idem: string,
  args: Extract<CanonicalAction, { verb: "COMMIT" }>["arguments"],
  pl: PlayerRuntime,
  events: NonNullable<CommandResult["events"]>,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<CommandResult> {
  const form = args.contest_form;
  if (!form) return fail(request_id, "FORM_FORBIDDEN", "contest_form required");
  const stake = sanitizeStake(args.stake);
  if (!stake) return fail(request_id, "INVALID_REQUEST", "stake required");
  if (!meetsMinimumStake(stake, form)) {
    return fail(request_id, "BUDGET_EXCEEDED", "Stake is below the form minimum.");
  }
  if (!args.target) return fail(request_id, "INVALID_REQUEST", "target required");
  const room = w.rooms[pl.room_id];
  if (!room) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
  if (isHiddenRoom(room)) {
    return fail(request_id, "NOT_OBSERVABLE", "That place cannot be contested.");
  }
  const target = normalizeDeclareTarget(w, room, form, args.target, principal.player_id);
  if (!target.ok) return fail(request_id, target.code, target.message);
  if (!canAffordStake(pl.budgets, DECLARE_COST, stake)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to declare.");
  }
  w.contests = w.contests || {};
  const open = openContests(w);
  if (open.filter((c) => c.declarer_id === principal.player_id).length >= MAX_OPEN_PER_AGENT) {
    return fail(request_id, "FORBIDDEN", "You already have the maximum open contests.");
  }
  if (open.filter((c) => c.room_id === room.room_id).length >= MAX_OPEN_PER_ROOM) {
    return fail(request_id, "FORBIDDEN", "This room already has the maximum open contests.");
  }
  let expires = args.expires_cycle ?? defaultExpiresCycle(w.cycle, form);
  if (expires <= w.cycle) expires = defaultExpiresCycle(w.cycle, form);
  if (expires > maxExpiresCycle(w.cycle, form)) expires = maxExpiresCycle(w.cycle, form);
  debit(pl.budgets, DECLARE_COST);
  reserveStake(pl.budgets, stake);
  const contest_id = `contest.${(w.sequence + 1).toString().padStart(4, "0")}`;
  const seed_stream_id = args.seed_stream_id || `stream.contest.${w.world_id || "world"}`;
  w.contests[contest_id] = {
    contest_id,
    declarer_id: principal.player_id,
    defender_id: args.defender_id,
    contest_form: form,
    target: target.target,
    room_id: room.room_id,
    stake,
    defender_stake: {},
    expires_cycle: expires,
    seed_stream_id,
    status: "OPEN",
  };
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: DECLARE_COST,
    reason: "CONTEST_DECLARE",
  });
  const ev = pushEvent("CONTEST_DECLARED", {
    contest_id,
    declarer_id: principal.player_id,
    contest_form: form,
    target: target.target,
    room_id: room.room_id,
    stake,
    defender_id: args.defender_id || null,
    expires_cycle: expires,
    seed_stream_id,
  });
  await settleEv(ev);
  const result = success(
    w,
    principal,
    request_id,
    events,
    `Contest ${contest_id} declared (${form.replace(/_/g, " ").toLowerCase()}).`,
    false,
  );
  w.seen_idempotency[idem] = result;
  return result;
}

async function applyContestDefend(
  w: WorldRuntime,
  principal: PlayerPrincipal,
  request_id: string,
  idem: string,
  args: Extract<CanonicalAction, { verb: "COMMIT" }>["arguments"],
  pl: PlayerRuntime,
  events: NonNullable<CommandResult["events"]>,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<CommandResult> {
  const contest_id = String(args.contest_id || "").trim();
  const stake = sanitizeStake(args.stake);
  if (!contest_id || !stake) {
    return fail(request_id, "INVALID_REQUEST", "contest_id and stake required");
  }
  const contest = (w.contests || {})[contest_id];
  if (!contest || contest.status !== "OPEN") {
    return fail(request_id, "NOT_FOUND", "Unknown or closed contest.");
  }
  if (w.cycle >= contest.expires_cycle) {
    return fail(request_id, "FORBIDDEN", "The response deadline has passed.");
  }
  if (contest.declarer_id === principal.player_id) {
    return fail(request_id, "FORBIDDEN", "The declarer cannot defend.");
  }
  if (contest.defender_id && contest.defender_id !== principal.player_id) {
    return fail(request_id, "FORBIDDEN", "Another Player is already defending.");
  }
  if (pl.room_id !== contest.room_id) {
    return fail(request_id, "NOT_COLOCATED", "You must be in the contest room to defend.");
  }
  if (Object.keys(contest.defender_stake).length) {
    return fail(request_id, "FORBIDDEN", "Defense is already reserved.");
  }
  if (!canAffordStake(pl.budgets, DEFEND_COST, stake)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to defend.");
  }
  debit(pl.budgets, DEFEND_COST);
  reserveStake(pl.budgets, stake);
  contest.defender_id = principal.player_id;
  contest.defender_stake = stake;
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: DEFEND_COST,
    reason: "CONTEST_DEFEND",
  });
  const result = success(w, principal, request_id, events, `Defense reserved on ${contest_id}.`, false);
  w.seen_idempotency[idem] = result;
  return result;
}

async function resolveDueContests(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  for (const contest of openContests(w)) {
    if (w.cycle < contest.expires_cycle) continue;
    const expired = w.cycle > contest.expires_cycle;
    let outcome: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE" | "EXPIRED" = expired
      ? "EXPIRED"
      : "FAILURE";
    let score = 0;
    const spentDeclarer: StakeMap = expired ? {} : { ...contest.stake };
    const spentDefender: StakeMap = expired ? {} : { ...contest.defender_stake };
    if (expired) {
      releaseStake(w.players[contest.declarer_id]?.budgets, contest.stake);
      releaseStake(w.players[contest.defender_id || ""]?.budgets, contest.defender_stake);
    }
    if (!expired) {
      let infra = 0;
      if (contest.target.kind === "ENTITY") {
        const room = w.rooms[contest.room_id];
        const ent = room ? findEntity(room, contest.target.entity_id) : null;
        infra = ent?.condition ?? 0;
      }
      const pert = await seedPerturbation(contest.seed_stream_id, contest.contest_id);
      const scored = scoreContest({
        form: contest.contest_form,
        declarer_stake: contest.stake,
        defender_stake: contest.defender_stake,
        infra_condition: infra,
        seed_perturbation: pert,
      });
      score = scored.score;
      outcome = outcomeFromScore(contest.contest_form, score);
    }
    const digest = await resolutionDigest({
      contest_id: contest.contest_id,
      outcome,
      score_millipoints: score,
      declarer_stake_spent: spentDeclarer,
      defender_stake_spent: spentDefender,
      seed_stream_id: contest.seed_stream_id,
    });
    contest.status = "CLOSED";
    const targetEntityId =
      contest.target.kind === "ENTITY" ? contest.target.entity_id : undefined;
    const ev = pushEvent("CONTEST_RESOLVED", {
      contest_id: contest.contest_id,
      outcome,
      resolved_by: "world.scheduler",
      defender_id: contest.defender_id || null,
      declarer_stake_spent: spentDeclarer,
      defender_stake_spent: spentDefender,
      target_entity_id: targetEntityId,
      score_millipoints: score,
      resolution_digest: digest,
    });
    await settleEv(ev);
    if (outcome !== "SUCCESS" && outcome !== "PARTIAL_SUCCESS") continue;
    if (contest.contest_form === "INFRASTRUCTURE_DISRUPTION" && contest.target.kind === "ENTITY") {
      const room = w.rooms[contest.room_id];
      const ent = room ? findEntity(room, contest.target.entity_id) : null;
      if (ent && room) {
        const before = ent.condition ?? 0;
        const after = disruptionAfter(contest.contest_form, outcome, before);
        if (after != null) {
          ent.condition = after;
          const idx = room.entities.findIndex((e) => e.entity_id === ent.entity_id);
          if (idx >= 0) room.entities[idx] = ent;
          const d = pushEvent("INFRASTRUCTURE_DISRUPTED", {
            disruption_id: `dis.${contest.contest_id}`,
            entity_id: ent.entity_id,
            room_id: room.room_id,
            condition_before: before,
            condition_after: after,
            cause: "CONTEST",
            actor_id: contest.declarer_id,
            contest_id: contest.contest_id,
            effect_class: "CONDITION_DROP",
          });
          await settleEv(d);
        }
      }
    }
    if (contest.contest_form === "RESOURCE_SEIZURE" && contest.target.kind === "HOLDING") {
      const holder = w.players[contest.target.holder_id];
      const taker = w.players[contest.declarer_id];
      const resource = contest.target.resource as keyof Budgets;
      const available = holder?.budgets?.[resource] ?? 0;
      const amt = seizureAmount(contest.contest_form, outcome, available);
      if (amt > 0 && holder && taker) {
        holder.budgets[resource] = available - amt;
        taker.budgets[resource] = (taker.budgets[resource] ?? 0) + amt;
        const t = pushEvent("RESOURCE_TRANSFER", {
          from_id: contest.target.holder_id,
          to_id: contest.declarer_id,
          resource,
          amount: amt,
          contest_id: contest.contest_id,
        });
        await settleEv(t);
      }
    }
    if (contest.contest_form === "ACCESS_CONTEST") {
      const dur = FORM_SPECS.ACCESS_CONTEST.restriction_duration_cycles || 8;
      const restriction_id = `restr.${contest.contest_id}`;
      w.access_restrictions = w.access_restrictions || [];
      w.access_restrictions.push({
        restriction_id,
        scope: contest.target.kind === "EXIT" ? "EXIT" : "ROOM",
        mode: "DENY",
        applies_to: "*",
        room_id: contest.room_id,
        exit_id: contest.target.kind === "EXIT" ? contest.target.exit_id : undefined,
        expires_cycle: w.cycle + dur,
      });
      const a = pushEvent("ACCESS_RESTRICTED", {
        restriction_id,
        scope: contest.target.kind === "EXIT" ? "EXIT" : "ROOM",
        mode: "DENY",
        applies_to: "*",
        reason: "CONTEST",
        expires_cycle: w.cycle + dur,
        authorized_by: "world.scheduler",
      });
      await settleEv(a);
    }
    if (contest.contest_form === "PRESENCE_PRESSURE" && contest.target.kind === "AGENT") {
      const target = w.players[contest.target.agent_id];
      const room = w.rooms[contest.room_id];
      if (target && room) {
        const exits = [...(room.exits || [])].sort((a, b) => a.direction.localeCompare(b.direction));
        if (exits[0] && !isAccessDenied(w, contest.target.agent_id, room.room_id, exits[0].direction)) {
          const from = target.room_id;
          target.room_id = exits[0].to_room_id;
          const m = pushEvent("MOVE", {
            player_id: contest.target.agent_id,
            from,
            to: exits[0].to_room_id,
            direction: exits[0].direction,
            reason: "PRESENCE_PRESSURE",
            contest_id: contest.contest_id,
          });
          await settleEv(m);
        } else {
          const disable = FORM_SPECS.PRESENCE_PRESSURE.max_disable_cycles || 3;
          target.disabled_until_cycle = w.cycle + disable;
          const u = pushEvent("ENTITY_UPDATE", {
            entity_id: contest.target.agent_id,
            field: "disabled_until_cycle",
            to: target.disabled_until_cycle,
            operation: "PRESENCE_PRESSURE",
            contest_id: contest.contest_id,
          });
          await settleEv(u);
        }
      }
    }
  }
}

async function applyScheduledPressure(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  w.pressure = ensurePressure(w.pressure);
  if (!scheduleDue(w.cycle, w.pressure.schedule_activations)) return;
  const target = selectScheduleRelay(collectLiveRelaysWithRoom(w.rooms));
  if (!target) return;
  const room = w.rooms[target.room_id];
  if (!room) return;
  const entity = findEntity(room, target.entity_id);
  if (!entity) return;
  const before = entity.condition ?? 0;
  const after = previewAfter(before);
  entity.condition = after;
  const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
  if (idx >= 0) room.entities[idx] = entity;
  w.pressure.schedule_activations += 1;
  w.pressure.last_cycle = w.cycle;
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: entity.entity_id,
    field: "condition",
    from: before,
    to: after,
    authorizer: "schedule",
    preview_after: after,
  });
  await settleEv(ev);
}
