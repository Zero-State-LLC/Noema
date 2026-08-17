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
  ACCESS_CLASS,
  ACCESS_DURATION_CYCLES,
  RESOURCE_CLASS,
  STOCK_DELTA,
  WATCH_ACCESS_PULSE,
  WATCH_INFRA_PULSE,
  WATCH_RESOURCE_PULSE,
  classDue,
  collectHarvestNodes,
  collectLiveRelaysWithRoom,
  collectPublicExits,
  emptyPressure,
  ensurePressure,
  notePulse,
  previewAfter,
  previewStockAfter,
  selectScheduleExit,
  selectScheduleNode,
  selectScheduleRelay,
} from "./pressure";
import {
  applyPracticeCredits,
  brokerWaivesCaution,
  creditsFromEvent,
  inspectAttentionCost,
  isTrackRecognized,
  lookAttentionCost,
  practiceLines,
  repairConditionDelta,
  BROKER_TRACK,
  ENGINEER_TRACK,
  PRACTICED_REPAIR_LINE,
  type PracticeCredit,
  type PracticeEvent,
} from "./practice";
import {
  creditAcceptedTrade,
  creditDangerEvidence,
  creditDeceptiveEvidence,
  creditInstitutionDanger,
  creditInstitutionMember,
  creditInstitutionTrade,
  creditsFromDangerEvent,
  creditsFromDeceptiveEvent,
  creditsFromTradeAccepted,
  institutionMemoryLines,
  liveHostileToward,
  liveInstitutionHostileToward,
  liveInstitutionReliableToward,
  liveReliableToward,
  socialMemoryLines,
  tradeCautionCost,
  watchPublicDescriptorLines,
  type SocialEvent,
} from "./social-memory";
import { applyCultureEvents, cultureLines, emptyCulture, type CultureEvent } from "./culture";
import { applyInspectEvidence, discoveryLines } from "./discovery";
import {
  HOSTED_ACT_PROFILES,
  REPAIR_PROFILE,
  TRADE_PROFILE,
  allocateOfficeId,
  assetInInstitutionScope,
  emptyTreasury,
  ensureTreasury,
  occupiedOfficesFor,
  findOffice,
  officeLines,
  parseOfficeProfile,
  parseRequiresTrack,
  publicOffices,
  applyPublishedPrecedence,
  resolveInstitutionGrant,
  resolveOfficeConflict,
  sanitizeIdList,
  vacateHolderOffices,
  type OfficeRecord,
} from "./offices";
import {
  allocateScopeId,
  canActivate,
  conditionHolds,
  defaultEmergencyTemplates,
  emergencyLines,
  expireDueScopes,
  findDuplicate,
  findEmergencyScope,
  publicEmergencyPulses,
  resolveEmergencyFor,
  type EmergencyScope,
} from "./emergency";
import {
  activateEmergencySuccession,
  activateOfficeSuccession,
  parseSuccessorList,
  parseSuccessionRuleId,
  WATCH_SUCCESSION_PULSE,
  consentWinner,
  recordConsent,
} from "./succession";
import {
  allocateReconstructionId,
  epistemicFromEvidence,
  evidenceAccessible,
  parseEvidenceKind,
  parseVisibility,
  reconstructionLines,
  visibleTo,
  type ReconstructionEvidence,
  type ReconstructionRecord,
} from "./reconstruction";
import {
  allocateClaimId,
  emptyRumor,
  ensureRumor,
  latestTransmissionTo,
  normalizeClaimText,
  publicRumorPulses,
  recordTransmission,
  rememberClaim,
  resolveRetell,
  rumorLines,
  type ClaimPayload,
  type ClaimRecord,
} from "./rumor";
import {
  DELAY_CYCLES,
  DELAYED_MESSAGE,
  BOARD_EXPIRE_AFTER_CYCLES,
  CHANNEL_EXPIRE_AFTER_CYCLES,
  NOTICE_EXPIRE_AFTER_CYCLES,
  SHOUT_EXPIRE_AFTER_CYCLES,
  TRADE_NOTICE_EXPIRE_AFTER_CYCLES,
  UNREACHABLE_MESSAGE,
  UNREACHABLE_REASON,
  bestLiveRelayCondition,
  collectLiveRelays,
  longRangeBand,
  type PendingMessage,
} from "./communication";
import { consultLine, isServiceConsultLine, resolveService, servicesAtRoom } from "./world-services";
import { publicReportLines, shouldWriteWorldReport } from "./world-reports";
import {
  constructStorageCost,
  creditLot,
  creditOrigin,
  harvestGrade,
  lotLines,
  publicHarvestOrigin,
  spendLot,
  spendOrigin,
  spoilWornLots,
} from "./lots";
import { cargoLine, moveEnergyCost } from "./transport";
import {
  CONSTRUCT_COSTS,
  DISMANTLE_COST,
  SALVAGE_STORAGE,
  UPGRADE_COST,
  REPURPOSE_COST,
  REPURPOSE_FROM_CLASS,
  REPURPOSE_TO_CLASS,
  shouldAbandon,
  RESTORE_CONDITION_CAP,
  MULTI_CYCLE_CLASS,
  isMultiCycleClass,
  VEST_COST,
  SHARE_COST,
  CONNECT_COST,
  isInProgress,
  allocateInfraId,
  clampSalvage,
  constructLabel,
  infraClassOf,
  isHiddenEntity,
  isHiddenRoom,
  liveClassInRoom,
  readyClassInRoom,
  scarFromDismantle,
  withAnnexAttention,
  withWorkshopStorage,
  workshopStorageDiscount,
} from "./construction";
import { hasPrivateCognition } from "./cognition";
import {
  DECLARE_COST,
  DEFEND_COST,
  FORM_SPECS,
  contestOfficeProfile,
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
  type ContestOutcome,
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
  exits: Array<{ direction: string; to_room_id: string; hidden?: boolean }>;
  entities: EntityRuntime[];
  /** GC2-S0: hidden rooms are not construct targets. */
  hidden?: boolean;
  tags?: string[];
  /** GC5-S5 public board notices. Last 5. Never on hidden rooms. */
  board?: Array<{ text: string; cycle: number }>;
  /** GC5-S4 last public shout. Never on hidden rooms. */
  shout?: { text: string; cycle: number };
  /** GC5-S6 last institution notice. Never on hidden rooms. */
  institution_notice?: { text: string; cycle: number; org_id: string; org_name: string };
  /** GC5-S8 last public trade notice. Never on hidden rooms. */
  trade_notice?: { text: string; cycle: number };
};

export type WorldRuntime = {
  world_id: string;
  world_name?: string;
  world_seed?: string;
  cycle: number;
  sequence: number;
  /** WR-S0 last public report. Projection only. Never on WATCH. */
  last_report?: { cycle: number; lines: string[] };
  entry_room_id: string;
  rooms: Record<string, RoomState>;
  players: Record<string, PlayerRuntime>;
  trades: Record<string, OpenTrade>;
  messages: InboxMessage[];
  pending_messages?: PendingMessage[];
  organizations: Record<string, Organization>;
  reconstructions?: Record<string, ReconstructionRecord>;
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
  /** GC5-S2 claim/transmission cache. Projection of MESSAGE, not truth. */
  rumor?: import("./rumor").RumorState;
  /** Public institution consequence pulses. No balances. */
  institution_pulses?: string[];
  /** GC3-S2 public social events for WATCH/PLAY bands. Derived cache. */
  public_social_events?: import("./social-memory").SocialEvent[];
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
  return room.entities.filter((e) => !isHiddenEntity(e));
}

function publicExits(
  w: WorldRuntime,
  room: RoomState | undefined,
): Array<{ direction: string; to_room_id: string }> {
  return (room?.exits || []).filter((exit) => {
    if (exit.hidden === true) return false;
    return !isHiddenRoom(w.rooms[exit.to_room_id]);
  });
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
  const exits = publicExits(w, room).map((e) => ({
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
  const cautionToward: Record<string, boolean> = {};
  for (const p of otherPlayers) {
    const hostile = liveHostileToward(
      pl.danger_memory,
      pl.deceptive_memory,
      pl.trade_memory,
      p.player_id,
      w.cycle,
    );
    const preferred = liveReliableToward(pl.trade_memory, p.player_id, w.cycle);
    cautionToward[p.player_id] = hostile && !preferred;
  }
  const affordances = deriveAffordances({
    entities,
    exits,
    budgets: pl.budgets,
    otherPlayers,
    openTrades,
    organizations: orgs,
    selfId: principal.player_id,
    cautionToward,
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
        offices: publicOffices(
          o.offices,
          Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle])),
        ),
        public_notice: o.public_notice,
        treasury: occupiedOfficesFor(o, principal.player_id, TRADE_PROFILE).length
          ? { ...ensureTreasury(o) }
          : undefined,
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
    practice_lines: practiceLines(pl.practice, w.cycle),
    lot_lines: lotLines(pl.lot_grades, pl.lot_origins, pl.spoil_lines).concat(
      cargoLine(
        pl.budgets.storage ?? 0,
        undefined,
        readyClassInRoom(roomEntities(room), "route_link"),
      ) || [],
    ),
    social_memory_lines: socialMemoryLines(
      pl.trade_memory,
      Object.fromEntries(
        Object.entries(w.players).map(([id, p]) => [id, p.handle]),
      ),
      pl.danger_memory,
      {
        asOfCycle: w.cycle,
        deceptive: pl.deceptive_memory,
        institutionLines: orgs.flatMap((o) =>
          institutionMemoryLines(
            o.institution_memory,
            o.name,
            isOrgOfficer(o, principal.player_id) ? "officer" : isOrgMember(o, principal.player_id) ? "member" : "other",
            principal.player_id,
            Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle])),
            w.cycle,
          ),
        ),
        publicLines: watchPublicDescriptorLines(
          w.public_social_events || [],
          Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle])),
        ),
      },
    ),
    culture_lines: cultureLines(
      w.culture,
      entities.map((e) => e.entity_id),
      principal.player_id,
      w.cycle,
      Object.values(w.reconstructions || {}).map((r) => ({
        subject_ref: r.subject_ref,
        visibility: r.visibility,
        claim: r.claim,
        epistemic: r.epistemic,
      })),
    ),
    discovery_lines: discoveryLines(pl.discovery),
    office_lines: orgs.flatMap((o) => {
      const names = Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle]));
      const base = officeLines(publicOffices(o.offices, names)).map((line) => `${o.name}: ${line}`);
      if (occupiedOfficesFor(o, principal.player_id, TRADE_PROFILE).length) {
        base.push(`You may trade from ${o.name} treasury.`);
      }
      if (occupiedOfficesFor(o, principal.player_id, REPAIR_PROFILE).length) {
        base.push(`You may repair local infrastructure for ${o.name}.`);
      }
      base.push(...emergencyLines(o.emergency_scopes, principal.player_id, w.cycle));
      return base;
    }),
    rumor_lines: rumorLines(
      w.rumor,
      principal.player_id,
      w.cycle,
      Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle])),
    ),
    board_lines: isHiddenRoom(room)
      ? []
      : (room.board || []).map((n) => `A notice on the board: ${n.text}`),
    shout_lines: isHiddenRoom(room) || !room.shout ? [] : [`A shout: ${room.shout.text}`],
    notice_lines:
      isHiddenRoom(room) || !room.institution_notice
        ? []
        : [`A notice from ${room.institution_notice.org_name}: ${room.institution_notice.text}`],
    channel_lines: isHiddenRoom(room)
      ? []
      : Object.values(w.organizations)
          .filter((o) => o.status === "ACTIVE" && o.channel && isOrgMember(o, principal.player_id))
          .map((o) => `A channel note in ${o.name}: ${o.channel!.text}`),
    trade_notice_lines:
      isHiddenRoom(room) || !room.trade_notice ? [] : [`A trade notice: ${room.trade_notice.text}`],
    report_lines: w.last_report?.lines || [],
    unclaimed_lines: isHiddenRoom(room)
      ? []
      : roomEntities(room)
          .filter((e) => e.unclaimed)
          .map((e) => `The ${e.label.replace(/-/g, " ")} is unclaimed.`),
    reconstruction_lines: reconstructionLines(
      Object.values(w.reconstructions || {}).filter((rec) => {
        const org = rec.org_id ? w.organizations[rec.org_id] : undefined;
        const role = org?.members.find((m) => m.agent_id === principal.player_id)?.role || null;
        const held = Object.values(org?.offices || {}).some(
          (o) => o.holder_player_id === principal.player_id && o.status === "OCCUPIED",
        );
        return visibleTo(rec, principal.player_id, role || (held ? "member" : null));
      }),
      Object.fromEntries(Object.entries(w.players).map(([id, p]) => [id, p.handle])),
    ),
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

function holdsNamedAssetOffice(w: WorldRuntime, playerId: string, orgId: string): boolean {
  const org = w.organizations[orgId];
  if (!org || org.status !== "ACTIVE") return false;
  return occupiedOfficesFor(org, playerId, REPAIR_PROFILE).length > 0;
}

function publicExitDest(room: RoomState, raw: string): string | null {
  const t = String(raw || "").trim();
  if (!t) return null;
  const exits = room.exits || [];
  const byDir = exits.find((e) => !e.hidden && e.direction.toLowerCase() === t.toLowerCase());
  if (byDir) return byDir.to_room_id;
  const byId = exits.find((e) => !e.hidden && e.to_room_id === t);
  return byId ? byId.to_room_id : null;
}

function hasPublicReverse(room: RoomState | undefined, fromRoomId: string): boolean {
  if (!room || isHiddenRoom(room)) return false;
  return (room.exits || []).some((e) => !e.hidden && e.to_room_id === fromRoomId);
}

function isConstructSteward(
  w: WorldRuntime,
  entity: {
    owner_id?: string;
    co_owner_id?: string;
    co_owner_2_id?: string;
    co_owner_3_id?: string;
    co_owner_4_id?: string;
    co_owner_5_id?: string;
  },
  playerId: string,
): boolean {
  if (
    entity.owner_id === playerId ||
    entity.co_owner_id === playerId ||
    entity.co_owner_2_id === playerId ||
    entity.co_owner_3_id === playerId ||
    entity.co_owner_4_id === playerId ||
    entity.co_owner_5_id === playerId
  ) {
    return true;
  }
  const orgId = entity.owner_id;
  if (orgId && w.organizations[orgId]) return holdsNamedAssetOffice(w, playerId, orgId);
  return false;
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
        party_id: credit.party_id,
      });
      byPlayer.set(credit.player_id, list);
    }
  }
  for (const [playerId, credits] of byPlayer) {
    const player = w.players[playerId];
    if (!player) continue;
    player.practice = applyPracticeCredits(player.practice, credits, w.cycle);
  }
}

function recordCulture(
  w: WorldRuntime,
  actingPlayerId: string,
  events: NonNullable<CommandResult["events"]> | undefined,
): void {
  if (!events?.length) return;
  w.culture = applyCultureEvents(w.culture, events as CultureEvent[], actingPlayerId, w.cycle);
}

function recordTradeMemory(
  w: WorldRuntime,
  events: NonNullable<CommandResult["events"]> | undefined,
): void {
  if (!events?.length) return;
  const trades: Record<string, { proposer_id: string; counterparty_id: string; acting_for?: string }> = {};
  for (const [id, trade] of Object.entries(w.trades || {})) {
    trades[id] = {
      proposer_id: trade.proposer_id,
      counterparty_id: trade.counterparty_id,
      acting_for: trade.acting_for,
    };
  }
  w.public_social_events = w.public_social_events || [];
  const socialEvents: SocialEvent[] = events.map((ev) => {
    if (ev.event_type === "ENTITY_UPDATE" && ev.payload?.operation === "ATTEST") {
      return {
        event_id: ev.event_id,
        event_type: "ATTEST",
        payload: {
          ...ev.payload,
          attester_id: ev.payload.attester_id,
          visibility: ev.payload.visibility || "PUBLIC",
          subject_entity_id: ev.payload.subject_entity_id || (ev.payload.set as { archive_subject_entity_id?: string } | undefined)?.archive_subject_entity_id,
          archive_claim: ev.payload.archive_claim || (ev.payload.set as { archive_claim?: string } | undefined)?.archive_claim,
        },
      };
    }
    return ev as SocialEvent;
  });
  for (const ev of socialEvents) {
    const et = ev.event_type;
    if (
      et === "CONTEST_RESOLVED" ||
      (et === "AGREEMENT_BROKEN" && ev.payload?.visibility === "PUBLIC") ||
      (et === "CRIME_DETECTED" && ev.payload?.visibility === "PUBLIC") ||
      (et === "ATTEST" && (!ev.payload?.visibility || ev.payload.visibility === "PUBLIC"))
    ) {
      w.public_social_events.push(ev);
    }
    for (const credit of creditsFromTradeAccepted(ev, trades)) {
      const player = w.players[credit.player_id];
      if (!player) continue;
      player.trade_memory = creditAcceptedTrade(
        player.trade_memory,
        credit.other_id,
        credit.trade_id,
        w.cycle,
      );
    }
    if (et === "TRADE_ACCEPTED") {
      const tradeId = ev.payload?.trade_id;
      const trade = typeof tradeId === "string" ? trades[tradeId] : undefined;
      if (trade?.acting_for && w.organizations[trade.acting_for]) {
        const org = w.organizations[trade.acting_for];
        org.institution_memory = creditInstitutionTrade(
          org.institution_memory,
          trade.counterparty_id,
          typeof tradeId === "string" ? tradeId : ev.event_id,
          w.cycle,
        );
      }
    }
    if (et === "ORG_MEMBER_ADD" || et === "ORG_MEMBER_REMOVE") {
      const orgId = ev.payload?.org_id;
      const agentId = ev.payload?.agent_id;
      if (typeof orgId === "string" && typeof agentId === "string" && w.organizations[orgId]) {
        w.organizations[orgId].institution_memory = creditInstitutionMember(
          w.organizations[orgId].institution_memory,
          agentId,
          et === "ORG_MEMBER_ADD" ? "member" : "removed",
        );
      }
    }
    for (const credit of creditsFromDangerEvent(ev)) {
      const player = w.players[credit.player_id];
      if (player) {
        player.danger_memory = creditDangerEvidence(
          player.danger_memory,
          credit.other_id,
          credit.evidence_id,
          w.cycle,
        );
      }
      if (credit.player_id.startsWith("org.") && w.organizations[credit.player_id]) {
        w.organizations[credit.player_id].institution_memory = creditInstitutionDanger(
          w.organizations[credit.player_id].institution_memory,
          credit.other_id,
          credit.evidence_id,
          w.cycle,
        );
      }
    }
    for (const credit of creditsFromDeceptiveEvent(ev, [...(w.public_social_events || []), ...socialEvents])) {
      const targets =
        credit.player_id === "*"
          ? Object.values(w.players)
          : w.players[credit.player_id]
            ? [w.players[credit.player_id]]
            : [];
      for (const player of targets) {
        player.deceptive_memory = creditDeceptiveEvidence(
          player.deceptive_memory,
          credit.other_id,
          credit.evidence_id,
          w.cycle,
        );
      }
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

  if (hasPrivateCognition(envl)) {
    return fail(request_id, "INVALID_REQUEST", "private cognition fields are not accepted");
  }

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
      "ORG_OFFICE_CREATE",
      "ORG_OFFICE_ASSIGN",
      "ORG_OFFICE_VACATE",
      "ORG_OFFICE_RETIRE",
      "ORG_OFFICE_ACT",
      "ORG_EMERGENCY_ACTIVATE",
      "ORG_EMERGENCY_REVOKE",
      "ORG_SUCCESSION_DESIGNATE",
      "ORG_SUCCESSION_CONSENT",
      "ORG_SUCCESSION_RULE",
      "RECONSTRUCT",
      "RECONSTRUCT_SUPERSEDE",
      "RECONSTRUCT_PUBLISH",
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
      "CONTEST_WITHDRAW",
      "ATTEST",
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

  const OBS_EVENT_TYPES = new Set(["LOOK", "OBSERVATION_GENERATED", "INSPECT", "WAIT"]);
  const pushEvent = (
    event_type: string,
    payload: Record<string, unknown>,
    opts?: { ledger?: boolean },
  ) => {
    const ledger = opts?.ledger ?? !OBS_EVENT_TYPES.has(event_type);
    if (ledger) w.sequence += 1;
    const sequence = w.sequence;
    const event_id = ledger
      ? `evt.${sequence.toString().padStart(6, "0")}`
      : `evt.obs.${crypto.randomUUID()}`;
    events.push({ event_id, event_type, sequence, payload });
    return { event_id, event_type, sequence, payload };
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
      return fail(request_id, "NOT_IN_WORLD", "Enter the world first.");
    }
    if (action.verb === "LOOK") {
      const lookCost = lookAttentionCost(pl.practice, pl.room_id, w.cycle);
      if (!canPay(pl.budgets, lookCost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
      }
      debit(pl.budgets, lookCost);
      const room_id = pl.room_id;
      const lookEv = pushEvent("LOOK", {
        player_id: principal.player_id,
        room_id,
        cost_paid: lookCost,
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
    pushEvent(
      "WAIT",
      {
        player_id: principal.player_id,
        cycles: waitCycles,
        wait_until_cycle: pl.wait_until_cycle,
        world_cycle: w.cycle,
        cycle_committed: committed,
      },
      { ledger: committed },
    );
    if (committed) {
      for (const [pid, player] of Object.entries(w.players)) {
        const spoiled = spoilWornLots(player.lot_grades, player.budgets, player.lot_origins);
        player.lot_grades = spoiled.grades;
        player.lot_origins = spoiled.origins;
        player.spoil_lines = spoiled.lines;
        for (const loss of spoiled.losses) {
          const spoilEv = pushEvent("BUDGET_CONSUMED", {
            player_id: pid,
            cost_paid: { [loss.resource]: loss.amount },
            reason: "SPOILAGE",
          });
          await settleEv(spoilEv);
        }
      }
      await resolveDueContests(w, pushEvent, settleEv);
      await applyScheduledPressure(w, pushEvent, settleEv);
      await deliverDelayedMessages(w, pushEvent, settleEv);
      await expireInstitutionEmergencies(w, pushEvent, settleEv);
      for (const room of Object.values(w.rooms)) {
        if (isHiddenRoom(room)) continue;
        for (const ent of roomEntities(room)) {
          if (!shouldAbandon(ent, w.cycle)) continue;
          ent.unclaimed = true;
          const idx = room.entities.findIndex((e) => e.entity_id === ent.entity_id);
          if (idx >= 0) room.entities[idx] = ent;
          const ev = pushEvent("ENTITY_UPDATE", {
            entity_id: ent.entity_id,
            set: { unclaimed: true },
            unset: [],
            operation: "ABANDON",
          });
          await settleEv(ev);
        }
      }
      for (const room of Object.values(w.rooms)) {
        if (isHiddenRoom(room)) continue;
        for (const ent of roomEntities(room)) {
          const classId = infraClassOf(ent);
          if (!isInProgress(ent) || !isMultiCycleClass(classId)) continue;
          ent.in_progress = undefined;
          ent.last_steward_cycle = w.cycle;
          const idx = room.entities.findIndex((e) => e.entity_id === ent.entity_id);
          if (idx >= 0) room.entities[idx] = ent;
          const ev = pushEvent("ENTITY_UPDATE", {
            entity_id: ent.entity_id,
            set: { in_progress: false, last_steward_cycle: w.cycle, infra_type: classId },
            unset: ["in_progress"],
            operation: "PROMOTE",
          });
          await settleEv(ev);
        }
      }
      for (const room of Object.values(w.rooms)) {
        if (isHiddenRoom(room)) continue;
        if (room.shout && w.cycle - room.shout.cycle >= SHOUT_EXPIRE_AFTER_CYCLES) {
          room.shout = undefined;
        }
        if (room.board?.length) {
          room.board = room.board.filter((n) => w.cycle - n.cycle < BOARD_EXPIRE_AFTER_CYCLES);
          if (!room.board.length) room.board = undefined;
        }
        if (room.institution_notice && w.cycle - room.institution_notice.cycle >= NOTICE_EXPIRE_AFTER_CYCLES) {
          room.institution_notice = undefined;
        }
        if (room.trade_notice && w.cycle - room.trade_notice.cycle >= TRADE_NOTICE_EXPIRE_AFTER_CYCLES) {
          room.trade_notice = undefined;
        }
      }
      for (const org of Object.values(w.organizations)) {
        if (org.channel && w.cycle - org.channel.cycle >= CHANNEL_EXPIRE_AFTER_CYCLES) {
          org.channel = undefined;
        }
      }
      if (shouldWriteWorldReport(w.cycle)) {
        w.last_report = {
          cycle: w.cycle,
          lines: publicReportLines(w.rooms, w.organizations, w.contests, w.access_restrictions, w.cycle),
        };
      }
    }
    const spoilNote = (pl.spoil_lines || []).join(" ");
    const result = success(
      w,
      principal,
      request_id,
      events,
      spoilNote ? `You wait. ${spoilNote}` : "You wait.",
      false,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— MOVE ———
  if (action.verb === "MOVE") {
    const room = w.rooms[pl.room_id];
    if (!room) {
      return fail(request_id, "NOT_FOUND", "You are not in a known room.");
    }
    const waivesCargo = readyClassInRoom(roomEntities(room), "route_link");
    const moveCost = { energy: moveEnergyCost(pl.budgets.storage ?? 0, undefined, waivesCargo) };
    if (!canPay(pl.budgets, moveCost)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough energy.");
    }
    const direction = action.arguments.direction;
    const exit = publicExits(w, room).find(
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
    debit(pl.budgets, moveCost);
    const from = room.room_id;
    pl.room_id = exit.to_room_id;
    const ev = pushEvent("MOVE", {
      player_id: principal.player_id,
      from,
      to: exit.to_room_id,
      direction: exit.direction,
      cost_paid: moveCost,
    });
    await settleEv(ev);
    const dest = w.rooms[exit.to_room_id];
    const carrying = (moveCost.energy || 0) > 1;
    const arrive = dest ? `You arrive at ${dest.name}.` : `You move ${exit.direction}.`;
    const result = success(
      w,
      principal,
      request_id,
      events,
      carrying ? `${arrive} Carrying lots cost extra.` : arrive,
      settled,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  // ——— INSPECT ———
  if (action.verb === "INSPECT") {
    const room = w.rooms[pl.room_id];
    const entity = findEntity(room, action.arguments.entity_id);
    if (!entity) {
      return fail(request_id, "INSPECT_FAILED", `You do not see “${action.arguments.entity_id}” here.`);
    }
    if (entity.inspect_restricted_until != null && w.cycle < entity.inspect_restricted_until) {
      return fail(request_id, "FORBIDDEN", "The record is sealed.");
    }
    const inspectCost = withAnnexAttention(
      inspectAttentionCost(pl.practice, entity.entity_id, w.cycle),
      readyClassInRoom(roomEntities(room), "archive_annex"),
    );
    if (!canPay(pl.budgets, inspectCost)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
    }
    debit(pl.budgets, inspectCost);
    const detail = inspectDetail(entity);
    const inspEv = pushEvent("INSPECT", {
      player_id: principal.player_id,
      entity_id: entity.entity_id,
      room_id: pl.room_id,
      cost_paid: inspectCost,
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
    if (action.arguments.surface === "BOARD") {
      const here = w.rooms[pl.room_id];
      if (!here) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
      if (isHiddenRoom(here)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is no board here.");
      }
      const notice = action.arguments.text.slice(0, 500).trim();
      if (!notice) return fail(request_id, "INVALID_REQUEST", "Write a notice.");
      debit(pl.budgets, COSTS.MESSAGE);
      here.board = [...(here.board || []), { text: notice, cycle: w.cycle }].slice(-5);
      const ev = pushEvent("MESSAGE", {
        message_id: `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`,
        sender_id: principal.player_id,
        surface: "BOARD",
        room_id: here.room_id,
        text: notice,
        cost_paid: COSTS.MESSAGE,
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `A notice on the board: ${notice}`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }
    if (action.arguments.surface === "SHOUT") {
      const here = w.rooms[pl.room_id];
      if (!here) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
      if (isHiddenRoom(here)) {
        return fail(request_id, "NOT_OBSERVABLE", "Your voice does not carry here.");
      }
      const utterance = action.arguments.text.slice(0, 500).trim();
      if (!utterance) return fail(request_id, "INVALID_REQUEST", "Say something.");
      debit(pl.budgets, COSTS.MESSAGE);
      here.shout = { text: utterance, cycle: w.cycle };
      const ev = pushEvent("MESSAGE", {
        message_id: `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`,
        sender_id: principal.player_id,
        surface: "SHOUT",
        room_id: here.room_id,
        text: utterance,
        cost_paid: COSTS.MESSAGE,
      });
      await settleEv(ev);
      const shouted = success(
        w,
        principal,
        request_id,
        events,
        `A shout: ${utterance}`,
        settled,
      );
      w.seen_idempotency[idem] = shouted;
      return shouted;
    }
    if (action.arguments.surface === "NOTICE") {
      const here = w.rooms[pl.room_id];
      if (!here) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
      if (isHiddenRoom(here)) {
        return fail(request_id, "NOT_OBSERVABLE", "That notice would not carry here.");
      }
      const utterance = action.arguments.text.slice(0, 500).trim();
      if (!utterance) return fail(request_id, "INVALID_REQUEST", "Write a notice.");
      const wantedOrg = String(action.arguments.org_id || "").trim();
      let orgId = "";
      let orgName = "";
      if (wantedOrg) {
        const org = w.organizations[wantedOrg];
        const held = occupiedOfficesFor(org, principal.player_id, "PUBLISH_NOTICE");
        if (!org || org.status !== "ACTIVE" || !held.length) {
          return fail(request_id, "FORBIDDEN", "You do not hold a notice office here.");
        }
        orgId = org.org_id;
        orgName = org.name;
      } else {
        const found = Object.values(w.organizations).find((org) => {
          if (org.status !== "ACTIVE") return false;
          return occupiedOfficesFor(org, principal.player_id, "PUBLISH_NOTICE").length > 0;
        });
        if (!found) {
          return fail(request_id, "FORBIDDEN", "You do not hold a notice office here.");
        }
        orgId = found.org_id;
        orgName = found.name;
      }
      debit(pl.budgets, COSTS.MESSAGE);
      here.institution_notice = { text: utterance, cycle: w.cycle, org_id: orgId, org_name: orgName };
      const ev = pushEvent("MESSAGE", {
        message_id: `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`,
        sender_id: principal.player_id,
        surface: "NOTICE",
        room_id: here.room_id,
        org_id: orgId,
        text: utterance,
        cost_paid: COSTS.MESSAGE,
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `A notice from ${orgName}: ${utterance}`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }
    if (action.arguments.surface === "CHANNEL") {
      const here = w.rooms[pl.room_id];
      if (!here) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
      if (isHiddenRoom(here)) {
        return fail(request_id, "NOT_OBSERVABLE", "That channel would not carry here.");
      }
      const utterance = action.arguments.text.slice(0, 500).trim();
      if (!utterance) return fail(request_id, "INVALID_REQUEST", "Write a note.");
      const org_id = String(action.arguments.org_id || "").trim();
      const org = org_id ? w.organizations[org_id] : undefined;
      if (!org || org.status !== "ACTIVE" || !isOrgMember(org, principal.player_id)) {
        return fail(request_id, "NOT_ADDRESSABLE", "That channel is not addressable.");
      }
      debit(pl.budgets, COSTS.MESSAGE);
      org.channel = { text: utterance, cycle: w.cycle };
      const ev = pushEvent("MESSAGE", {
        message_id: `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`,
        sender_id: principal.player_id,
        surface: "CHANNEL",
        org_id: org.org_id,
        text: utterance,
        cost_paid: COSTS.MESSAGE,
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `A channel note in ${org.name}: ${utterance}`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }
    if (action.arguments.surface === "TRADE_NOTICE") {
      const here = w.rooms[pl.room_id];
      if (!here) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
      if (isHiddenRoom(here)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is no stall here.");
      }
      const utterance = action.arguments.text.slice(0, 500).trim();
      if (!utterance) return fail(request_id, "INVALID_REQUEST", "Write a trade notice.");
      debit(pl.budgets, COSTS.MESSAGE);
      here.trade_notice = { text: utterance, cycle: w.cycle };
      const ev = pushEvent("MESSAGE", {
        message_id: `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`,
        sender_id: principal.player_id,
        surface: "TRADE_NOTICE",
        room_id: here.room_id,
        text: utterance,
        cost_paid: COSTS.MESSAGE,
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `A trade notice: ${utterance}`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }
    const recipient_id = action.arguments.recipient_id;
    if (!recipient_id) {
      return fail(request_id, "INVALID_REQUEST", "Recipient is required.");
    }
    const text = action.arguments.text.slice(0, 500);
    const recipient = w.players[recipient_id];
    if (!recipient?.entered) {
      return fail(request_id, "FORBIDDEN", "Recipient is not addressable in this world.");
    }
    const local = pl.room_id === recipient.room_id;
    let delayed = false;
    if (!local) {
      const best = bestLiveRelayCondition(collectLiveRelays(w.rooms));
      const band = longRangeBand(best);
      if (band === "UNREACHABLE") {
        return fail(request_id, UNREACHABLE_REASON, UNREACHABLE_MESSAGE);
      }
      delayed = band === "DELAYED";
    }
    w.rumor = ensureRumor(w.rumor);
    const parent_claim_id = action.arguments.parent_claim_id
      ? String(action.arguments.parent_claim_id)
      : undefined;
    const subject_ref = action.arguments.subject_ref ? String(action.arguments.subject_ref) : undefined;
    const as_claim = Boolean(action.arguments.as_claim || parent_claim_id || subject_ref);
    let claimPayload: ClaimPayload | undefined;
    let deliverText = text;
    if (as_claim) {
      if (parent_claim_id && !parent_claim_id.startsWith("claim.")) {
        return fail(request_id, "NOT_FOUND", "That report is not known here.");
      }
      if (parent_claim_id) {
        const held = w.rumor.claims[parent_claim_id];
        const retellText =
          held && (text === parent_claim_id || !text.trim())
            ? held.content
            : text;
        const retell = resolveRetell(w.rumor, principal.player_id, parent_claim_id, retellText, w.cycle);
        if (!retell.ok) {
          return fail(request_id, "NOT_FOUND", "You do not hold that report.");
        }
        rememberClaim(w.rumor, retell.claim, principal.player_id);
        deliverText = retell.same_claim ? retell.claim.content : normalizeClaimText(text);
        const parentTx = latestTransmissionTo(w.rumor, parent_claim_id, principal.player_id);
        claimPayload = {
          claim_id: retell.claim.claim_id,
          originator_ref: retell.claim.originator_ref,
          subject_ref: retell.claim.subject_ref,
          content: retell.claim.content,
          created_cycle: retell.claim.created_cycle,
          derived_from: retell.claim.derived_from,
          origin_class: retell.claim.origin_class,
          visibility: retell.claim.visibility,
          origin_claim_id: retell.claim.origin_claim_id,
          parent_transmission_id: parentTx?.transmission_id,
        };
      } else {
        const claim_id = allocateClaimId();
        const claim: ClaimRecord = {
          claim_id,
          originator_ref: principal.player_id,
          subject_ref,
          content: normalizeClaimText(text),
          created_cycle: w.cycle,
          origin_class: "PLAYER_MESSAGE",
          visibility: "PRIVATE",
          origin_claim_id: claim_id,
        };
        rememberClaim(w.rumor, claim, principal.player_id);
        claimPayload = {
          claim_id,
          originator_ref: claim.originator_ref,
          subject_ref: claim.subject_ref,
          content: claim.content,
          created_cycle: claim.created_cycle,
          origin_class: claim.origin_class,
          visibility: claim.visibility,
          origin_claim_id: claim.origin_claim_id,
        };
        deliverText = claim.content;
      }
    }
    debit(pl.budgets, COSTS.MESSAGE);
    const message_id = `msg.${w.sequence + 1}.${crypto.randomUUID().slice(0, 8)}`;
    const ev1 = pushEvent("MESSAGE", {
      message_id,
      sender_id: principal.player_id,
      recipient_id,
      text: deliverText,
      cost_paid: COSTS.MESSAGE,
      delayed,
      ...(claimPayload ? { claim_id: claimPayload.claim_id, origin_claim_id: claimPayload.origin_claim_id } : {}),
    });
    if (delayed) {
      w.pending_messages = w.pending_messages || [];
      w.pending_messages.push({
        message_id,
        sender_id: principal.player_id,
        recipient_id,
        text: deliverText,
        sent_cycle: w.cycle,
        deliver_at_cycle: w.cycle + DELAY_CYCLES,
        claim: claimPayload,
      });
      await settleEv(ev1);
      const result = success(w, principal, request_id, events, DELAYED_MESSAGE, settled);
      w.seen_idempotency[idem] = result;
      return result;
    }
    const ev2 = pushEvent("MESSAGE_DELIVERED", {
      message_id,
      recipient_id,
      delivered_cycle: w.cycle,
      ...(claimPayload ? { claim_id: claimPayload.claim_id } : {}),
    });
    w.messages = w.messages || [];
    w.messages.push({
      message_id,
      sender_id: principal.player_id,
      recipient_id,
      text: deliverText,
      status: "DELIVERED",
      delivered_cycle: w.cycle,
    });
    if (claimPayload) {
      applyDeliveredClaim(w, message_id, principal.player_id, recipient_id, claimPayload, w.cycle);
    }
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
      const counterparty_id = action.arguments.counterparty_id || "";
      const offered = sanitizeTradeAmounts(action.arguments.offered);
      const requested = sanitizeTradeAmounts(action.arguments.requested);
      if (!counterparty_id || !offered || !requested) {
        return fail(request_id, "INVALID_REQUEST", "counterparty, offer, and want are required.");
      }
      const acting_for = action.arguments.acting_for ? String(action.arguments.acting_for) : undefined;
      const office_id = action.arguments.office_id ? String(action.arguments.office_id) : undefined;
      const counterpartyIsOrg = counterparty_id.startsWith("org.");
      if (!counterpartyIsOrg && !w.players[counterparty_id]?.entered) {
        return fail(request_id, "FORBIDDEN", "Counterparty is not active.");
      }
      if (counterpartyIsOrg && (!w.organizations[counterparty_id] || w.organizations[counterparty_id].status !== "ACTIVE")) {
        return fail(request_id, "NOT_FOUND", "That institution is not known here.");
      }
      const actingPreview = action.arguments.acting_for ? String(action.arguments.acting_for) : undefined;
      const liveHostile = actingPreview && w.organizations[actingPreview]
        ? liveInstitutionHostileToward(w.organizations[actingPreview].institution_memory, counterparty_id, w.cycle)
        : liveHostileToward(pl.danger_memory, pl.deceptive_memory, pl.trade_memory, counterparty_id, w.cycle);
      const liveReliable = actingPreview && w.organizations[actingPreview]
        ? liveInstitutionReliableToward(w.organizations[actingPreview].institution_memory, counterparty_id, w.cycle)
        : liveReliableToward(pl.trade_memory, counterparty_id, w.cycle);
      const brokerKnown = brokerWaivesCaution(pl.practice, counterparty_id, w.cycle);
      const caution = tradeCautionCost(liveHostile, liveReliable || brokerKnown);
      const tradeCost = { compute: caution.total_compute };
      if (!canPay(pl.budgets, tradeCost)) {
        return fail(
          request_id,
          "BUDGET_EXCEEDED",
          caution.reason_code
            ? "TRADE_CAUTION: You do not have enough compute to proceed with caution."
            : "You do not have enough compute.",
        );
      }
      let source = pl.budgets;
      let grantOfficeId: string | undefined;
      let emergencyScope: EmergencyScope | undefined;
      if (acting_for) {
        const grant = resolveInstitutionGrant(w.organizations, principal.player_id, acting_for, office_id, TRADE_PROFILE);
        if (grant.ok) {
          const conflict = resolveOfficeConflict(w.organizations[grant.org_id], grant.office.office_id, "treasury");
          if (!conflict.ok) return fail(request_id, conflict.code, conflict.message);
          source = ensureTreasury(w.organizations[grant.org_id]);
          grantOfficeId = grant.office.office_id;
        } else {
          const org = w.organizations[acting_for];
          if (!org) return fail(request_id, "NOT_FOUND", "That institution is not known here.");
          const em = resolveEmergencyFor(
            org,
            principal.player_id,
            "TRADE",
            "treasury",
            w.cycle,
            action.arguments.emergency_scope_id,
          );
          if (!em.ok) return fail(request_id, grant.code, grant.message);
          const cap = em.scope.spent?.energy || 0;
          const offerEnergy = offered.energy || 0;
          const max = defaultEmergencyTemplates().find((t) => t.template_id === em.scope.template_id)?.max_spend?.energy ?? 10;
          if (cap + offerEnergy > max) {
            return fail(request_id, "FORBIDDEN", "That emergency spend cap is exhausted.");
          }
          source = ensureTreasury(org);
          emergencyScope = em.scope;
        }
      }
      for (const [res, amt] of Object.entries(offered)) {
        if ((source[res as keyof Budgets] ?? 0) < amt) {
          return fail(request_id, "BUDGET_EXCEEDED", `Not enough ${res} in the ${acting_for ? "treasury" : "offer"}.`);
        }
      }
      debit(pl.budgets, tradeCost);
      const reserved: Record<string, number> = {};
      const offered_grades: Partial<Record<keyof Budgets, "SOUND" | "WORN">> = {};
      const offered_origins: NonNullable<OpenTrade["offered_origins"]> = {};
      for (const [res, amt] of Object.entries(offered)) {
        const key = res as keyof Budgets;
        offered_grades[key] = !acting_for ? pl.lot_grades?.[key] || "SOUND" : "SOUND";
        if (!acting_for && pl.lot_origins?.[key]) {
          offered_origins[key] = { ...pl.lot_origins[key] };
        }
        source[key] = (source[key] ?? 0) - amt;
        reserved[res] = amt;
        if (!acting_for) {
          pl.lot_grades = spendLot(pl.lot_grades, pl.budgets[key] ?? 0, key);
          pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets[key] ?? 0, key);
        }
      }
      if (emergencyScope) {
        emergencyScope.spent = emergencyScope.spent || {};
        emergencyScope.spent.energy = (emergencyScope.spent.energy || 0) + (offered.energy || 0);
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
        offered_grades,
        offered_origins,
        expires_cycle: action.arguments.expires_cycle,
        acting_for,
        office_id: grantOfficeId,
      };
      const ev = pushEvent("TRADE_PROPOSED", {
        trade_id,
        proposer_id: principal.player_id,
        counterparty_id,
        offered,
        requested,
        cost_paid: tradeCost,
        caution: caution.reason_code,
        acting_for: acting_for || null,
        office_id: grantOfficeId || null,
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
      const acceptActingFor = action.arguments.acting_for
        ? String(action.arguments.acting_for)
        : trade.counterparty_id.startsWith("org.")
          ? trade.counterparty_id
          : undefined;
      const acceptOfficeId = action.arguments.office_id ? String(action.arguments.office_id) : undefined;
      if (trade.counterparty_id.startsWith("org.")) {
        if (acceptActingFor !== trade.counterparty_id) {
          return fail(request_id, "FORBIDDEN", "Only that institution's officer can accept.");
        }
      } else if (trade.counterparty_id !== principal.player_id) {
        return fail(request_id, "FORBIDDEN", "Only the counterparty can accept.");
      }
      if ((trade.acting_for || acceptActingFor) && trade.proposer_id === principal.player_id) {
        return fail(request_id, "FORBIDDEN", "One Player cannot authorize both sides.");
      }
      if (trade.expires_cycle != null && w.cycle > trade.expires_cycle) {
        releaseTradeReserve(w, trade);
        trade.status = "REJECTED";
        return fail(request_id, "TRADE_FAILED", "Trade expired.");
      }
      let payFrom = pl.budgets;
      let receiveInto = pl.budgets;
      if (acceptActingFor) {
        const grant = resolveInstitutionGrant(
          w.organizations,
          principal.player_id,
          acceptActingFor,
          acceptOfficeId,
          TRADE_PROFILE,
        );
        if (!grant.ok) return fail(request_id, grant.code, grant.message);
        payFrom = ensureTreasury(w.organizations[grant.org_id]);
        receiveInto = payFrom;
      }
      const proposerDest = trade.acting_for
        ? ensureTreasury(w.organizations[trade.acting_for] || { treasury: emptyTreasury() })
        : w.players[trade.proposer_id]?.budgets;
      if (!proposerDest) return fail(request_id, "TRADE_FAILED", "Proposer missing.");
      for (const [res, amt] of Object.entries(trade.requested)) {
        if ((payFrom[res as keyof Budgets] ?? 0) < amt) {
          return fail(request_id, "BUDGET_EXCEEDED", `Not enough ${res} to accept.`);
        }
      }
      debit(pl.budgets, COSTS.TRADE);
      for (const [res, amt] of Object.entries(trade.requested)) {
        const key = res as keyof Budgets;
        const incoming = !acceptActingFor ? pl.lot_grades?.[key] || "SOUND" : "SOUND";
        const incomingOrigin = !acceptActingFor ? pl.lot_origins?.[key] : undefined;
        payFrom[key] = (payFrom[key] ?? 0) - amt;
        proposerDest[key] = (proposerDest[key] ?? 0) + amt;
        if (!acceptActingFor) {
          pl.lot_grades = spendLot(pl.lot_grades, pl.budgets[key] ?? 0, key);
          pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets[key] ?? 0, key);
        }
        const proposer = w.players[trade.proposer_id];
        if (proposer && proposerDest === proposer.budgets) {
          proposer.lot_grades = creditLot(proposer.lot_grades, proposer.budgets, key, amt, incoming);
          proposer.lot_origins = creditOrigin(proposer.lot_origins, proposer.budgets, key, amt, incomingOrigin);
        }
      }
      for (const [res, amt] of Object.entries(trade.offered)) {
        const key = res as keyof Budgets;
        receiveInto[key] = (receiveInto[key] ?? 0) + amt;
        if (receiveInto === pl.budgets) {
          pl.lot_grades = creditLot(
            pl.lot_grades,
            pl.budgets,
            key,
            amt,
            trade.offered_grades?.[key] || "SOUND",
          );
          pl.lot_origins = creditOrigin(
            pl.lot_origins,
            pl.budgets,
            key,
            amt,
            trade.offered_origins?.[key],
          );
        }
      }
      trade.reserved = {};
      trade.status = "SETTLED";
      if (trade.acting_for || acceptActingFor) {
        noteInstitutionPulse(w, "An institution traded from its treasury.");
      }
      const evA = pushEvent("TRADE_ACCEPTED", {
        trade_id: trade.trade_id,
        accepted_by: principal.player_id,
        acting_for: acceptActingFor || null,
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
      releaseTradeReserve(w, trade);
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
    if (action.arguments.operation === "CONTEST_WITHDRAW") {
      return applyContestWithdraw(
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
    if (action.arguments.operation === "ATTEST") {
      return applyAttest(w, principal, request_id, idem, action.arguments, pl, events, pushEvent, settleEv);
    }
    if (
      action.arguments.operation === "ORG_OFFICE_CREATE" ||
      action.arguments.operation === "ORG_OFFICE_ASSIGN" ||
      action.arguments.operation === "ORG_OFFICE_VACATE" ||
      action.arguments.operation === "ORG_OFFICE_RETIRE" ||
      action.arguments.operation === "ORG_OFFICE_ACT"
    ) {
      return applyOfficeCommand(
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
    if (
      action.arguments.operation === "ORG_EMERGENCY_ACTIVATE" ||
      action.arguments.operation === "ORG_EMERGENCY_REVOKE" ||
      action.arguments.operation === "ORG_EMERGENCY_DEFINE"
    ) {
      return applyEmergencyCommand(w, principal, request_id, idem, action.arguments, pl, events, pushEvent, settleEv);
    }
    if (action.arguments.operation === "ORG_SUCCESSION_DESIGNATE") {
      return applySuccessionDesignate(w, principal, request_id, idem, action.arguments, pl, events, pushEvent, settleEv);
    }
    if (action.arguments.operation === "ORG_SUCCESSION_CONSENT") {
      return applySuccessionConsent(w, principal, request_id, idem, action.arguments, pl, events, pushEvent, settleEv);
    }
    if (action.arguments.operation === "ORG_SUCCESSION_RULE") {
      return applySuccessionRule(w, principal, request_id, idem, action.arguments, pl, events, pushEvent, settleEv);
    }
    if (
      action.arguments.operation === "RECONSTRUCT" ||
      action.arguments.operation === "RECONSTRUCT_SUPERSEDE" ||
      action.arguments.operation === "RECONSTRUCT_PUBLISH"
    ) {
      return applyReconstructCommand(
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
        offices: {},
        treasury: emptyTreasury(),
        emergency_templates: defaultEmergencyTemplates(),
        emergency_scopes: [],
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
      const vacated = vacateHolderOffices(org, agent_id, w.cycle);
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
      for (const office of vacated) {
        const vac = pushEvent("ENTITY_UPDATE", {
          entity_id: office.office_id,
          set: {
            office_status: "VACANT",
            holder_player_id: null,
            institution_id: org.org_id,
            office_kind: "INSTITUTION_OFFICE",
          },
          unset: ["holder_player_id"],
        });
        await settleEv(vac);
        await settleOfficeHandoff(w, org, office, agent_id, pushEvent, settleEv);
      }
      for (const scope of org.emergency_scopes || []) {
        await settleEmergencyHandoff(w, org, scope, agent_id, pushEvent, settleEv);
      }
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
      const acting_for = action.arguments.acting_for ? String(action.arguments.acting_for) : undefined;
      const office_id = action.arguments.office_id ? String(action.arguments.office_id) : undefined;
      let payFrom = pl.budgets;
      let grantOfficeId: string | undefined;
      if (acting_for) {
        const grant = resolveInstitutionGrant(
          w.organizations,
          principal.player_id,
          acting_for,
          office_id,
          REPAIR_PROFILE,
        );
        if (grant.ok) {
          if (!assetInInstitutionScope(entity, grant.org_id, principal.player_id)) {
            return fail(request_id, "FORBIDDEN", "That asset is not in this institution's scope.");
          }
          const conflict = resolveOfficeConflict(
            w.organizations[grant.org_id],
            grant.office.office_id,
            entity.entity_id,
          );
          if (!conflict.ok) return fail(request_id, conflict.code, conflict.message);
          payFrom = ensureTreasury(w.organizations[grant.org_id]);
          grantOfficeId = grant.office.office_id;
        } else {
          const org = w.organizations[acting_for];
          if (!org) return fail(request_id, "NOT_FOUND", "That institution is not known here.");
          const em = resolveEmergencyFor(
            org,
            principal.player_id,
            "REPAIR",
            entity.entity_id,
            w.cycle,
            action.arguments.emergency_scope_id,
          );
          if (!em.ok) return fail(request_id, grant.code, grant.message);
          if (!assetInInstitutionScope(entity, acting_for, principal.player_id)) {
            return fail(request_id, "FORBIDDEN", "That asset is not in this institution's scope.");
          }
          payFrom = ensureTreasury(org);
        }
      }
      const repairCost = withWorkshopStorage(
        { ...COSTS.REPAIR },
        workshopStorageDiscount(roomEntities(room)),
      );
      if (!canPay(payFrom, repairCost)) {
        return fail(
          request_id,
          "BUDGET_EXCEEDED",
          acting_for
            ? "The institution treasury cannot pay this repair."
            : "You need energy 3, compute 2, and storage 1 to repair.",
        );
      }
      const before = entity.condition ?? 0;
      const quality = repairConditionDelta(pl.practice, entity.entity_id, w.cycle);
      debit(payFrom, repairCost);
      entity.condition = Math.min(100, before + quality.delta);
      const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
      if (idx >= 0) room.entities[idx] = entity;
      if (
        !entity.unclaimed &&
        ((!acting_for &&
          (entity.owner_id === principal.player_id ||
            entity.co_owner_id === principal.player_id ||
            entity.co_owner_2_id === principal.player_id ||
            entity.co_owner_3_id === principal.player_id ||
            entity.co_owner_4_id === principal.player_id ||
            entity.co_owner_5_id === principal.player_id)) ||
          (acting_for && entity.owner_id === acting_for && holdsNamedAssetOffice(w, principal.player_id, acting_for)))
      ) {
        entity.last_steward_cycle = w.cycle;
      }
      if (acting_for) noteInstitutionPulse(w, "Institution infrastructure was repaired.");
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: repairCost,
        reason: "REPAIR",
        acting_for: acting_for || null,
        office_id: grantOfficeId || null,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: entity.entity_id,
        field: "condition",
        from: before,
        to: entity.condition,
        operation: "REPAIR",
        actor_id: principal.player_id,
        quality_bonus: quality.bonus || undefined,
        acting_for: acting_for || null,
        office_id: grantOfficeId || null,
      });
      await settleEv(ev);
      const practiced =
        quality.bonus > 0
          ? ` ${PRACTICED_REPAIR_LINE.replace("{label}", titleCaseLabel(entity.label))}`
          : "";
      const result = success(
        w,
        principal,
        request_id,
        events,
        `${titleCaseLabel(entity.label)} repaired. Condition ${before}% → ${entity.condition}%.${practiced}`,
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
      const resource = (entity.stock_resource || "energy") as keyof Budgets;
      debit(pl.budgets, COSTS.HARVEST);
      entity.stock_amount = (entity.stock_amount ?? 0) - amount;
      pl.budgets.storage = (pl.budgets.storage ?? 0) - amount;
      const credited = resource in pl.budgets ? resource : "energy";
      const incoming = harvestGrade(entity.condition);
      pl.budgets[credited] = (pl.budgets[credited] ?? 0) + amount;
      pl.lot_grades = creditLot(pl.lot_grades, pl.budgets, credited, amount, incoming);
      pl.lot_origins = creditOrigin(
        pl.lot_origins,
        pl.budgets,
        credited,
        amount,
        publicHarvestOrigin(isHiddenRoom(room) ? undefined : room, principal.player_id),
      );
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
        resource: credited,
        amount,
        grade: incoming,
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
        `Harvested ${amount} ${credited} from ${titleCaseLabel(entity.label)}${incoming === "WORN" ? " — worn." : "."}`,
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
      const base = CONSTRUCT_COSTS[classId];
      const storageNeed = constructStorageCost(base.storage || 0, pl.lot_grades?.storage);
      const cost = withWorkshopStorage(
        { ...base, storage: storageNeed || undefined },
        workshopStorageDiscount(roomEntities(target)),
      );
      if (!canPay(pl.budgets, cost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to construct.");
      }
      debit(pl.budgets, cost);
      if (storageNeed) {
        pl.lot_grades = spendLot(pl.lot_grades, pl.budgets.storage ?? 0, "storage");
        pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets.storage ?? 0, "storage");
      }
      const entity_id = allocateInfraId(classId);
      const label = constructLabel(classId);
      const created: EntityRuntime = {
        entity_id,
        label,
        entity_type: "INFRASTRUCTURE",
        condition: 100,
        owner_id: principal.player_id,
        infra_type: classId,
        last_steward_cycle: w.cycle,
        ...(isMultiCycleClass(classId) ? { in_progress: true } : {}),
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
        properties: { infra_type: classId, ...(isMultiCycleClass(classId) ? { in_progress: true } : {}) },
        state: { condition: 100 },
      });
      await settleEv(ev);
      const result = success(
        w,
        principal,
        request_id,
        events,
        classId === MULTI_CYCLE_CLASS
          ? `A relay is under construction (${entity_id}).`
          : classId === "route_link"
            ? `A route link is under construction (${entity_id}).`
            : classId === "workshop"
              ? `A workshop is under construction (${entity_id}).`
              : classId === "generator"
                ? `A generator is under construction (${entity_id}).`
              : classId === "storage_bay"
                ? `A storage bay is under construction (${entity_id}).`
              : classId === "production_node"
                ? `A production node is under construction (${entity_id}).`
              : classId === "defensive_work"
                ? `A defensive work is under construction (${entity_id}).`
                : classId === "archive_annex"
                  ? `An archive annex is under construction (${entity_id}).`
                  : `Constructed ${label.replace(/-/g, " ")} (${entity_id}).`,
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
      if (!here.unclaimed && !isConstructSteward(w, here, principal.player_id)) {
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
      const leaveScar = !isHiddenRoom(room) && !isInProgress(here);
      if (leaveScar) {
        const scar = scarFromDismantle(classId);
        room.entities = [...roomEntities(room), scar];
        const scarEv = pushEvent("ENTITY_CREATE", {
          entity_id: scar.entity_id,
          entity_type: "RUIN",
          location: room.room_id,
          room_id: room.room_id,
          label: scar.label,
          properties: { scar: true },
          state: { condition: 0 },
        });
        await settleEv(scarEv);
      }
      const result = success(
        w,
        principal,
        request_id,
        events,
        leaveScar
          ? `Dismantled ${titleCaseLabel(here.label)}. A scar remains.`
          : `Dismantled ${titleCaseLabel(here.label)}.`,
        settled,
      );
      w.seen_idempotency[idem] = result;
      return result;
    }

    if (action.arguments.operation === "UPGRADE") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is nothing to upgrade here.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      if (infraClassOf(here) !== "workshop") {
        return fail(request_id, "FORBIDDEN", "Only a workshop can be upgraded.");
      }
      if (isInProgress(here)) {
        return fail(request_id, "FORBIDDEN", "That workshop is still under construction.");
      }
      if (!isConstructSteward(w, here, principal.player_id)) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      if ((here.upgrade_tier || 0) >= 1) {
        return fail(request_id, "FORBIDDEN", "That workshop is already upgraded.");
      }
      if (here.unclaimed) {
        return fail(request_id, "FORBIDDEN", "That workshop is unclaimed.");
      }
      const storageNeed = constructStorageCost(UPGRADE_COST.storage || 0, pl.lot_grades?.storage);
      const cost = { ...UPGRADE_COST, storage: storageNeed || undefined };
      if (!canPay(pl.budgets, cost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to upgrade.");
      }
      debit(pl.budgets, cost);
      if (storageNeed) {
        pl.lot_grades = spendLot(pl.lot_grades, pl.budgets.storage ?? 0, "storage");
        pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets.storage ?? 0, "storage");
      }
      here.upgrade_tier = 1;
      here.last_steward_cycle = w.cycle;
      const idx = room.entities.findIndex((e) => e.entity_id === here.entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: cost,
        reason: "UPGRADE",
        class: "workshop",
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: here.entity_id,
        set: { upgrade_tier: 1, infra_type: "workshop" },
        unset: [],
      });
      await settleEv(ev);
      const posted = success(w, principal, request_id, events, "The workshop was upgraded.", settled);
      w.seen_idempotency[idem] = posted;
      return posted;
    }

    if (action.arguments.operation === "REPURPOSE") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is nothing to repurpose here.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      if (infraClassOf(here) !== REPURPOSE_FROM_CLASS) {
        return fail(request_id, "FORBIDDEN", "Only a workshop can be repurposed as a storage bay.");
      }
      if (isInProgress(here)) {
        return fail(request_id, "FORBIDDEN", "That workshop is still under construction.");
      }
      if (!isConstructSteward(w, here, principal.player_id)) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      const storageNeed = constructStorageCost(REPURPOSE_COST.storage || 0, pl.lot_grades?.storage);
      const cost = { ...REPURPOSE_COST, storage: storageNeed || undefined };
      if (!canPay(pl.budgets, cost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to repurpose.");
      }
      debit(pl.budgets, cost);
      if (storageNeed) {
        pl.lot_grades = spendLot(pl.lot_grades, pl.budgets.storage ?? 0, "storage");
        pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets.storage ?? 0, "storage");
      }
      const entity_id = here.entity_id;
      here.infra_type = REPURPOSE_TO_CLASS;
      here.label = constructLabel(REPURPOSE_TO_CLASS);
      const idx = room.entities.findIndex((e) => e.entity_id === entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: cost,
        reason: "REPURPOSE",
        class: REPURPOSE_TO_CLASS,
        from_class: REPURPOSE_FROM_CLASS,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id,
        set: { infra_type: REPURPOSE_TO_CLASS, label: here.label },
        unset: [],
        operation: "REPURPOSE",
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        "The workshop was repurposed as a storage bay.",
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }

    if (action.arguments.operation === "RESTORE") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is nothing to restore here.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      if (here.scar || here.entity_type === "RUIN") {
        return fail(request_id, "FORBIDDEN", "That scar cannot be restored.");
      }
      const classId = infraClassOf(here);
      if (!classId) {
        return fail(request_id, "NOT_FOUND", "That is not constructible infrastructure.");
      }
      if (!here.unclaimed) {
        return fail(request_id, "FORBIDDEN", "That is not unclaimed.");
      }
      if (!isConstructSteward(w, here, principal.player_id)) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      const base = CONSTRUCT_COSTS[classId];
      const storageNeed = constructStorageCost(base.storage || 0, pl.lot_grades?.storage);
      const cost = { ...base, storage: storageNeed || undefined };
      if (!canPay(pl.budgets, cost)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough resources to restore.");
      }
      debit(pl.budgets, cost);
      if (storageNeed) {
        pl.lot_grades = spendLot(pl.lot_grades, pl.budgets.storage ?? 0, "storage");
        pl.lot_origins = spendOrigin(pl.lot_origins, pl.budgets.storage ?? 0, "storage");
      }
      here.unclaimed = undefined;
      here.last_steward_cycle = w.cycle;
      here.condition = Math.min(here.condition ?? 100, RESTORE_CONDITION_CAP);
      const idx = room.entities.findIndex((e) => e.entity_id === here.entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: cost,
        reason: "RESTORE",
        class: classId,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: here.entity_id,
        set: { unclaimed: false, condition: here.condition, last_steward_cycle: w.cycle },
        unset: ["unclaimed"],
        operation: "RESTORE",
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `You restored the ${here.label.replace(/-/g, " ")}.`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }

    if (action.arguments.operation === "VEST") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is nothing to vest here.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      const classId = infraClassOf(here);
      if (!classId) {
        return fail(request_id, "NOT_FOUND", "That is not constructible infrastructure.");
      }
      if (
        here.scar ||
        here.entity_type === "RUIN" ||
        here.unclaimed ||
        isInProgress(here) ||
        here.co_owner_id ||
        here.co_owner_2_id ||
        here.co_owner_3_id ||
        here.co_owner_4_id ||
        here.co_owner_5_id
      ) {
        return fail(request_id, "FORBIDDEN", "That cannot be vested.");
      }
      if (here.owner_id !== principal.player_id) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      const org_id = String(action.arguments.org_id || "").trim();
      const org = org_id ? w.organizations[org_id] : undefined;
      if (!org || org.status !== "ACTIVE" || !holdsNamedAssetOffice(w, principal.player_id, org_id)) {
        return fail(request_id, "FORBIDDEN", "You do not hold a named-asset office there.");
      }
      if (!canPay(pl.budgets, VEST_COST)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
      }
      debit(pl.budgets, VEST_COST);
      here.owner_id = org.org_id;
      here.last_steward_cycle = w.cycle;
      const idx = room.entities.findIndex((e) => e.entity_id === here.entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: VEST_COST,
        reason: "VEST",
        org_id: org.org_id,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: here.entity_id,
        set: { owner_id: org.org_id, last_steward_cycle: w.cycle, infra_type: classId },
        unset: [],
        operation: "VEST",
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `The ${here.label.replace(/-/g, " ")} is held by ${org.name}.`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }

    if (action.arguments.operation === "SHARE") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "There is nothing to share here.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      const classId = infraClassOf(here);
      if (!classId) {
        return fail(request_id, "NOT_FOUND", "That is not constructible infrastructure.");
      }
      if (here.scar || here.entity_type === "RUIN" || here.unclaimed || isInProgress(here)) {
        return fail(request_id, "FORBIDDEN", "That cannot be shared.");
      }
      if (here.owner_id !== principal.player_id) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      if (here.owner_id && w.organizations[here.owner_id]) {
        return fail(request_id, "FORBIDDEN", "An institution cannot share that way.");
      }
      const partner_id = String(action.arguments.player_id || "").trim();
      const partner = partner_id ? w.players[partner_id] : undefined;
      if (
        !partner?.entered ||
        partner_id === principal.player_id ||
        partner_id === here.owner_id ||
        partner_id === here.co_owner_id ||
        partner_id === here.co_owner_2_id ||
        partner_id === here.co_owner_3_id ||
        partner_id === here.co_owner_4_id ||
        partner_id === here.co_owner_5_id
      ) {
        return fail(request_id, "NOT_ADDRESSABLE", "That Player is not addressable.");
      }
      const slot = !here.co_owner_id
        ? "co_owner_id"
        : !here.co_owner_2_id
          ? "co_owner_2_id"
          : !here.co_owner_3_id
            ? "co_owner_3_id"
            : !here.co_owner_4_id
              ? "co_owner_4_id"
              : !here.co_owner_5_id
                ? "co_owner_5_id"
                : null;
      if (!slot) {
        return fail(request_id, "FORBIDDEN", "That is already shared.");
      }
      if (!canPay(pl.budgets, SHARE_COST)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
      }
      debit(pl.budgets, SHARE_COST);
      if (slot === "co_owner_id") here.co_owner_id = partner_id;
      else if (slot === "co_owner_2_id") here.co_owner_2_id = partner_id;
      else if (slot === "co_owner_3_id") here.co_owner_3_id = partner_id;
      else if (slot === "co_owner_4_id") here.co_owner_4_id = partner_id;
      else here.co_owner_5_id = partner_id;
      here.last_steward_cycle = w.cycle;
      const idx = room.entities.findIndex((e) => e.entity_id === here.entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: SHARE_COST,
        reason: "SHARE",
        [slot]: partner_id,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: here.entity_id,
        set: { [slot]: partner_id, last_steward_cycle: w.cycle, infra_type: classId },
        unset: [],
        operation: "SHARE",
      });
      await settleEv(ev);
      const handle = partner.handle || partner_id;
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `You share the ${here.label.replace(/-/g, " ")} with ${handle}.`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
    }

    if (action.arguments.operation === "CONNECT") {
      if (isHiddenRoom(room)) {
        return fail(request_id, "NOT_OBSERVABLE", "That way is not a public route.");
      }
      const here = findEntity(room, action.arguments.entity_id);
      if (!here) {
        return fail(request_id, "NOT_FOUND", `You do not see “${action.arguments.entity_id}” here.`);
      }
      if (infraClassOf(here) !== "route_link" || here.unclaimed || isInProgress(here) || here.scar) {
        return fail(request_id, "FORBIDDEN", "That is not a live route link.");
      }
      if (!isConstructSteward(w, here, principal.player_id)) {
        return fail(request_id, "NOT_OWNER", "You do not own that.");
      }
      const destId = publicExitDest(room, action.arguments.dest);
      const destRoom = destId ? w.rooms[destId] : undefined;
      if (!destId || !hasPublicReverse(destRoom, room.room_id)) {
        return fail(request_id, "NOT_OBSERVABLE", "That way is not a public route.");
      }
      if (!canPay(pl.budgets, CONNECT_COST)) {
        return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
      }
      debit(pl.budgets, CONNECT_COST);
      here.dest_room_id = destId;
      const idx = room.entities.findIndex((e) => e.entity_id === here.entity_id);
      if (idx >= 0) room.entities[idx] = here;
      pushEvent("BUDGET_CONSUMED", {
        player_id: principal.player_id,
        cost_paid: CONNECT_COST,
        reason: "CONNECT",
        dest_room_id: destId,
      });
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: here.entity_id,
        set: { dest_room_id: destId, infra_type: "route_link" },
        unset: [],
        operation: "CONNECT",
      });
      await settleEv(ev);
      const posted = success(
        w,
        principal,
        request_id,
        events,
        `The route link faces ${destRoom!.name}.`,
        settled,
      );
      w.seen_idempotency[idem] = posted;
      return posted;
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
  w.reconstructions = w.reconstructions || {};
  for (const org of Object.values(w.organizations)) {
    if (!org.offices) org.offices = {};
  }
  if (!w.culture) w.culture = emptyCulture();
  for (const room of Object.values(w.rooms)) {
    room.entities = (room.entities || []).map((e) => enrichEntity(e));
  }
  for (const p of Object.values(w.players)) {
    if (!p.budgets) p.budgets = cloneBudgets(null);
    else p.budgets = cloneBudgets(p.budgets);
    if (!p.practice) p.practice = { catalog_id: "mastery-catalog/gc1-s1", tracks: {}, recognition: {} };
    if (!p.trade_memory) p.trade_memory = { catalog_id: "social-memory-catalog/gc3-s0", edges: {} };
    if (!p.danger_memory) p.danger_memory = { catalog_id: "social-memory-catalog/gc3-s1", edges: {} };
    if (!p.deceptive_memory) p.deceptive_memory = { catalog_id: "social-memory-catalog/gc3-s6", edges: {} };
  }
  w.contests = w.contests || {};
  w.access_restrictions = w.access_restrictions || [];
  if (!w.pressure) w.pressure = emptyPressure();
  if (!w.rumor) w.rumor = emptyRumor();
  w.institution_pulses = w.institution_pulses || [];
  w.public_social_events = w.public_social_events || [];
  w.pending_messages = w.pending_messages || [];
  for (const org of Object.values(w.organizations || {})) {
    ensureTreasury(org);
    if (!org.emergency_templates?.length) org.emergency_templates = defaultEmergencyTemplates();
    org.emergency_scopes = org.emergency_scopes || [];
  }
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

function noteInstitutionPulse(w: WorldRuntime, text: string): void {
  w.institution_pulses = [...(w.institution_pulses || []), text].slice(-4);
}

function officeTrackId(req: NonNullable<OfficeRecord["requires_track"]>) {
  return req === "engineer" ? ENGINEER_TRACK : BROKER_TRACK;
}

function playerMeetsOfficeTrack(w: WorldRuntime, playerId: string, office: OfficeRecord): boolean {
  if (!office.requires_track) return true;
  const player = w.players[playerId];
  return isTrackRecognized(player?.practice, officeTrackId(office.requires_track));
}

function officeTrackReject(track: NonNullable<OfficeRecord["requires_track"]>): string {
  return track === "engineer"
    ? "That office requires a recognized Engineer."
    : "That office requires a recognized Broker.";
}

async function settleOfficeHandoff(
  w: WorldRuntime,
  org: Organization,
  office: OfficeRecord,
  departedId: string,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<string | null> {
  const seated = activateOfficeSuccession(office, org, w.players, departedId, w.cycle, (id) =>
    playerMeetsOfficeTrack(w, id, office),
  );
  if (!seated) return null;
  noteInstitutionPulse(w, WATCH_SUCCESSION_PULSE);
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: office.office_id,
    set: {
      office_status: "OCCUPIED",
      holder_player_id: seated.holder_player_id,
      institution_id: org.org_id,
      office_kind: "INSTITUTION_OFFICE",
      succession_from: departedId,
      succession_to: seated.holder_player_id,
      designated_by: office.succession?.designated_by,
    },
    unset: [],
  });
  await settleEv(ev);
  return seated.holder_player_id;
}

async function settleEmergencyHandoff(
  w: WorldRuntime,
  org: Organization,
  scope: EmergencyScope,
  departedId: string,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<string | null> {
  const seated = activateEmergencySuccession(scope, org, w.players, departedId, w.cycle);
  if (!seated) return null;
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: scope.scope_id,
    set: {
      holder_player_id: seated.holder_player_id,
      succession_from: departedId,
      succession_to: seated.holder_player_id,
      end_cycle: scope.end_cycle,
      office_kind: "EMERGENCY_SCOPE",
    },
    unset: [],
  });
  await settleEv(ev);
  return seated.holder_player_id;
}

async function applySuccessionDesignate(
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
  const office_id = String(args.office_id || "").trim();
  const scope_id = String(args.emergency_scope_id || "").trim();
  const successors = parseSuccessorList(args.successors, args.agent_id);
  if ((!office_id && !scope_id) || !successors.length) {
    return fail(request_id, "INVALID_REQUEST", "Name an office or emergency scope and at least one successor.");
  }
  let org: Organization | undefined;
  let office: OfficeRecord | undefined;
  let scope: EmergencyScope | undefined;
  if (office_id) {
    const found = findOffice(w.organizations, office_id);
    if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
    org = w.organizations[found.org_id];
    office = found.office;
  } else {
    const found = findEmergencyScope(w.organizations, scope_id);
    if (!found) return fail(request_id, "NOT_FOUND", "Emergency scope not found.");
    org = w.organizations[found.org_id];
    scope = found.scope;
  }
  if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
  if (!isOrgOfficer(org, principal.player_id)) {
    return fail(request_id, "FORBIDDEN", "Only a founder or officer may designate a successor.");
  }
  if (office && office.status === "RETIRED") {
    return fail(request_id, "FORBIDDEN", "A retired office cannot succeed.");
  }
  if (scope && scope.status !== "ACTIVE") {
    return fail(request_id, "FORBIDDEN", "That emergency authority is not in force.");
  }
  for (const id of successors) {
    if (!w.players[id]) return fail(request_id, "NOT_FOUND", "That Player is not in this world.");
    if (!isOrgMember(org, id)) {
      return fail(request_id, "FORBIDDEN", "A designated successor must be a current member.");
    }
    if (office && !playerMeetsOfficeTrack(w, id, office)) {
      return fail(request_id, "FORBIDDEN", officeTrackReject(office.requires_track!));
    }
  }
  if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
  }
  debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
  const rule = {
    successors,
    designated_by: principal.player_id,
    designated_cycle: w.cycle,
  };
  if (office) office.succession = rule;
  if (scope) scope.succession = rule;
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: COSTS.ORG_OFFICE_ACT,
    reason: "ORG_SUCCESSION_DESIGNATE",
  });
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: office ? office.office_id : scope!.scope_id,
    set: {
      successors,
      designated_by: principal.player_id,
      designated_cycle: w.cycle,
      office_kind: office ? "INSTITUTION_OFFICE" : "EMERGENCY_SCOPE",
    },
    unset: [],
  });
  await settleEv(ev);
  const result = success(
    w,
    principal,
    request_id,
    events,
    office
      ? `Designated successor for ${office.display_name}.`
      : `Designated successor for ${scope!.scope_id}.`,
    false,
  );
  w.seen_idempotency[idem] = result;
  return result;
}

async function applySuccessionRule(
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
  const office_id = String(args.office_id || "").trim();
  const rule_id = parseSuccessionRuleId(args.rule_id);
  if (!office_id || !rule_id) {
    return fail(request_id, "INVALID_REQUEST", "Name an office and member_order or inherited.");
  }
  const found = findOffice(w.organizations, office_id);
  if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
  const org = w.organizations[found.org_id];
  const office = found.office;
  if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
  if (!isOrgOfficer(org, principal.player_id)) {
    return fail(request_id, "FORBIDDEN", "Only a founder or officer may publish a succession rule.");
  }
  if (office.status === "RETIRED") {
    return fail(request_id, "FORBIDDEN", "A retired office cannot succeed.");
  }
  if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
  }
  debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
  office.succession = {
    rule_id,
    designated_by: principal.player_id,
    designated_cycle: w.cycle,
  };
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: COSTS.ORG_OFFICE_ACT,
    reason: "ORG_SUCCESSION_RULE",
  });
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: office.office_id,
    set: {
      rule_id,
      designated_by: principal.player_id,
      designated_cycle: w.cycle,
      office_kind: "INSTITUTION_OFFICE",
    },
    unset: ["successors"],
    operation: "RULE",
  });
  await settleEv(ev);
  const result = success(
    w,
    principal,
    request_id,
    events,
    rule_id === "INHERITED_BY_ORGANIZATION"
      ? `The organization keeps ${office.display_name}.`
      : `Member-order succession published for ${office.display_name}.`,
    false,
  );
  w.seen_idempotency[idem] = result;
  return result;
}

async function applySuccessionConsent(
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
  const office_id = String(args.office_id || "").trim();
  const candidate_id = String(args.agent_id || "").trim();
  const found = findOffice(w.organizations, office_id);
  if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
  const org = w.organizations[found.org_id];
  const office = found.office;
  if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
  if (office.status === "RETIRED") {
    return fail(request_id, "FORBIDDEN", "A retired office cannot succeed.");
  }
  if (office.status !== "VACANT") {
    return fail(request_id, "FORBIDDEN", "That office is occupied.");
  }
  if (!isOrgMember(org, principal.player_id)) {
    return fail(request_id, "FORBIDDEN", "Only a member may consent.");
  }
  if (!w.players[candidate_id]) return fail(request_id, "NOT_FOUND", "That Player is not in this world.");
  if (!isOrgMember(org, candidate_id)) {
    return fail(request_id, "FORBIDDEN", "A consensus candidate must be a current member.");
  }
  if (!playerMeetsOfficeTrack(w, candidate_id, office)) {
    return fail(request_id, "FORBIDDEN", officeTrackReject(office.requires_track!));
  }
  if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
  }
  debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
  office.consents = recordConsent(office.consents, principal.player_id, candidate_id);
  const memberIds = (org.members || []).map((m) => m.agent_id);
  const winner = consentWinner(office.consents, memberIds);
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: COSTS.ORG_OFFICE_ACT,
    reason: "ORG_SUCCESSION_CONSENT",
  });
  if (winner) {
    office.holder_player_id = winner;
    office.status = "OCCUPIED";
    office.history.push({ cycle: w.cycle, holder_player_id: winner, kind: "ASSIGNED" });
    office.consents = [];
    noteInstitutionPulse(w, WATCH_SUCCESSION_PULSE);
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: office.office_id,
      set: {
        office_status: "OCCUPIED",
        holder_player_id: winner,
        institution_id: org.org_id,
        office_kind: "INSTITUTION_OFFICE",
        succession_to: winner,
      },
      unset: [],
      operation: "CONSENSUS",
    });
    await settleEv(ev);
    const seated = success(
      w,
      principal,
      request_id,
      events,
      `Consensus seated ${w.players[winner]?.handle || winner} in ${office.display_name}.`,
      false,
    );
    w.seen_idempotency[idem] = seated;
    return seated;
  }
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: office.office_id,
    set: { consents: office.consents, office_kind: "INSTITUTION_OFFICE" },
    unset: [],
    operation: "CONSENT",
  });
  await settleEv(ev);
  const recorded = success(
    w,
    principal,
    request_id,
    events,
    `Consent recorded for ${office.display_name}.`,
    false,
  );
  w.seen_idempotency[idem] = recorded;
  return recorded;
}

function releaseTradeReserve(w: WorldRuntime, trade: OpenTrade): void {
  const dest = trade.acting_for
    ? w.organizations[trade.acting_for]
      ? ensureTreasury(w.organizations[trade.acting_for])
      : null
    : w.players[trade.proposer_id]?.budgets;
  if (dest) {
    for (const [res, amt] of Object.entries(trade.reserved || {})) {
      dest[res as keyof Budgets] = (dest[res as keyof Budgets] ?? 0) + amt;
    }
  }
  trade.reserved = {};
}

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

function contestStakeBudgets(
  w: WorldRuntime,
  playerId: string | undefined,
  actingFor?: string,
): Budgets | undefined {
  if (actingFor && w.organizations[actingFor]) return ensureTreasury(w.organizations[actingFor]);
  if (playerId) return w.players[playerId]?.budgets;
  return undefined;
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
    if (form === "INFORMATION_CONTEST" && ent.entity_type.toUpperCase() !== "ARTIFACT") {
      return { ok: false, code: "FORBIDDEN", message: "That is not a public record." };
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
  const acting_for = args.acting_for ? String(args.acting_for) : undefined;
  const office_id = args.office_id ? String(args.office_id) : undefined;
  let payFrom = pl.budgets;
  let grantOfficeId: string | undefined;
  if (acting_for) {
    const grant = resolveInstitutionGrant(
      w.organizations,
      principal.player_id,
      acting_for,
      office_id,
      contestOfficeProfile(form),
    );
    if (!grant.ok) return fail(request_id, grant.code, grant.message);
    const conflict = resolveOfficeConflict(w.organizations[grant.org_id], grant.office.office_id, "contest");
    if (!conflict.ok) return fail(request_id, conflict.code, conflict.message);
    payFrom = ensureTreasury(w.organizations[grant.org_id]);
    grantOfficeId = grant.office.office_id;
  }
  if (!canAffordStake(payFrom, DECLARE_COST, stake)) {
    return fail(
      request_id,
      "BUDGET_EXCEEDED",
      acting_for ? "The institution treasury cannot fund this contest." : "You do not have enough resources to declare.",
    );
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
  if (acting_for) {
    const orgOpen = open.filter((c) => c.acting_for === acting_for).length;
    if (orgOpen >= MAX_OPEN_PER_AGENT) {
      return fail(request_id, "FORBIDDEN", "That institution already has the maximum open contests.");
    }
  }
  debit(payFrom, DECLARE_COST);
  reserveStake(payFrom, stake);
  const contest_id = `contest.${(w.sequence + 1).toString().padStart(4, "0")}`;
  const seed_stream_id = args.seed_stream_id || `stream.contest.${w.world_id || "world"}`;
  w.contests[contest_id] = {
    contest_id,
    declarer_id: principal.player_id,
    defender_id: args.defender_id,
    acting_for,
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
    acting_for: acting_for || null,
    office_id: grantOfficeId || null,
  });
  const ev = pushEvent("CONTEST_DECLARED", {
    contest_id,
    declarer_id: principal.player_id,
    contest_form: form,
    target: target.target,
    room_id: room.room_id,
    stake,
    defender_id: args.defender_id || null,
    acting_for: acting_for || null,
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
  const defendFor = args.acting_for ? String(args.acting_for) : undefined;
  const defendOffice = args.office_id ? String(args.office_id) : undefined;
  let defendPay = pl.budgets;
  let defendOfficeId: string | undefined;
  if (defendFor) {
    if (contest.acting_for && contest.acting_for === defendFor) {
      return fail(request_id, "FORBIDDEN", "That institution is already a party to this contest.");
    }
    const grant = resolveInstitutionGrant(
      w.organizations,
      principal.player_id,
      defendFor,
      defendOffice,
      contestOfficeProfile(contest.contest_form),
    );
    if (!grant.ok) return fail(request_id, grant.code, grant.message);
    const conflict = resolveOfficeConflict(w.organizations[grant.org_id], grant.office.office_id, "contest");
    if (!conflict.ok) return fail(request_id, conflict.code, conflict.message);
    defendPay = ensureTreasury(w.organizations[grant.org_id]);
    defendOfficeId = grant.office.office_id;
  }
  if (!canAffordStake(defendPay, DEFEND_COST, stake)) {
    return fail(
      request_id,
      "BUDGET_EXCEEDED",
      defendFor ? "The institution treasury cannot fund this defense." : "You do not have enough resources to defend.",
    );
  }
  debit(defendPay, DEFEND_COST);
  reserveStake(defendPay, stake);
  contest.defender_id = principal.player_id;
  contest.defender_acting_for = defendFor;
  contest.defender_stake = stake;
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: DEFEND_COST,
    reason: "CONTEST_DEFEND",
    acting_for: defendFor || null,
    office_id: defendOfficeId || null,
  });
  const result = success(w, principal, request_id, events, `Defense reserved on ${contest_id}.`, false);
  w.seen_idempotency[idem] = result;
  return result;
}

async function applyContestWithdraw(
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
  if (!contest_id) return fail(request_id, "INVALID_REQUEST", "contest_id required");
  const contest = (w.contests || {})[contest_id];
  if (!contest) return fail(request_id, "NOT_FOUND", "Unknown contest.");
  if (args.expected_status === "OPEN" && contest.status !== "OPEN") {
    return fail(request_id, "STALE_HEAD", "That contest is no longer open.");
  }
  if (contest.status !== "OPEN") {
    return fail(request_id, "NOT_FOUND", "Unknown or closed contest.");
  }
  if (w.cycle >= contest.expires_cycle) {
    return fail(request_id, "FORBIDDEN", "The response deadline has passed.");
  }
  const isDeclarer = contest.declarer_id === principal.player_id;
  const isDefender = contest.defender_id === principal.player_id;
  if (!isDeclarer && !isDefender) {
    return fail(request_id, "FORBIDDEN", "Only a participant may withdraw.");
  }

  let outcome: "SUCCESS" | "ABORTED" = isDeclarer ? "ABORTED" : "SUCCESS";
  const spentDeclarer: StakeMap = { ...contest.stake };
  const spentDefender: StakeMap = isDeclarer ? {} : { ...contest.defender_stake };
  if (isDeclarer) {
    releaseStake(
      contestStakeBudgets(w, contest.defender_id, contest.defender_acting_for),
      contest.defender_stake,
    );
  }
  contest.status = "CLOSED";
  const digest = await resolutionDigest({
    contest_id: contest.contest_id,
    outcome,
    score_millipoints: 0,
    declarer_stake_spent: spentDeclarer,
    defender_stake_spent: spentDefender,
    seed_stream_id: contest.seed_stream_id,
  });
  const ev = pushEvent("CONTEST_RESOLVED", {
    contest_id: contest.contest_id,
    outcome,
    resolved_by: principal.player_id,
    declarer_id: contest.declarer_id,
    defender_id: contest.defender_id || null,
    target: contest.target,
    declarer_stake_spent: spentDeclarer,
    defender_stake_spent: spentDefender,
    target_entity_id: contest.target.kind === "ENTITY" ? contest.target.entity_id : undefined,
    score_millipoints: 0,
    resolution_digest: digest,
  });
  await settleEv(ev);
  if (outcome === "SUCCESS") {
    await applyContestSuccessFollowOns(w, contest, outcome, pushEvent, settleEv);
  }
  const result = success(
    w,
    principal,
    request_id,
    events,
    isDeclarer
      ? `You withdraw from ${contest_id}. Your stake is forfeit.`
      : `You withdraw from ${contest_id}. The declarer holds the field.`,
    false,
  );
  w.seen_idempotency[idem] = result;
  return result;
}

function findEntityAnywhere(w: WorldRuntime, idOrLabel: string): EntityRuntime | null {
  for (const room of Object.values(w.rooms)) {
    const found = findEntity(room, idOrLabel);
    if (found) return found;
  }
  return null;
}

function canPublishInstitutional(org: Organization | undefined, playerId: string): boolean {
  if (!org || org.status !== "ACTIVE") return false;
  if (isOrgOfficer(org, playerId)) return true;
  return Object.values(org.offices || {}).some(
    (o) => o.status === "OCCUPIED" && o.holder_player_id === playerId,
  );
}

function collectReconstructionEvidence(
  pl: PlayerRuntime,
  subject: string,
  kinds: string[],
  cycle: number,
  sourceEntityId: string,
): { ok: true; refs: ReconstructionEvidence[] } | { ok: false; code: string; message: string } {
  const requested = kinds.length ? kinds : ["ARCHIVE_CLAIM", "LIVE_INSPECT"];
  const refs: ReconstructionEvidence[] = [];
  for (const raw of requested) {
    const kind = parseEvidenceKind(raw);
    if (!kind) {
      return { ok: false, code: "FORBIDDEN", message: "That evidence kind cannot be cited." };
    }
    const label = evidenceAccessible(pl.discovery, kind, subject);
    if (!label) {
      return { ok: false, code: "FORBIDDEN", message: "You cannot cite evidence you have not accessed." };
    }
    refs.push({
      kind,
      subject_ref: subject,
      source_entity_id: sourceEntityId,
      label,
      cycle,
    });
  }
  if (!refs.length) {
    return { ok: false, code: "FORBIDDEN", message: "A reconstruction requires accessible evidence." };
  }
  return { ok: true, refs };
}

async function applyReconstructCommand(
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
  w.reconstructions = w.reconstructions || {};
  const op = args.operation;

  if (op === "RECONSTRUCT_PUBLISH") {
    const rec = w.reconstructions[String(args.reconstruction_id || "")];
    if (!rec) return fail(request_id, "NOT_FOUND", "Reconstruction not found.");
    if (rec.author_player_id !== principal.player_id) {
      return fail(request_id, "FORBIDDEN", "Only the author may publish that reconstruction.");
    }
    const visibility = args.visibility || parseVisibility(String(args.visibility || "PUBLIC"));
    if (visibility === "INSTITUTIONAL") {
      const org = w.organizations[String(args.org_id || rec.org_id || "")];
      if (!canPublishInstitutional(org, principal.player_id)) {
        return fail(request_id, "FORBIDDEN", "You cannot publish that as an institutional record.");
      }
      rec.org_id = org?.org_id;
    }
    if (!canPay(pl.budgets, COSTS.RECONSTRUCT)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
    }
    rec.visibility = visibility;
    debit(pl.budgets, COSTS.RECONSTRUCT);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.RECONSTRUCT,
      reason: "RECONSTRUCT_PUBLISH",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: rec.reconstruction_id,
      set: { reconstruction_visibility: visibility, reconstruction_kind: "PLAYER_RECONSTRUCTION" },
      unset: [],
    });
    await settleEv(ev);
    const result = success(w, principal, request_id, events, `Reconstruction published (${visibility.toLowerCase()}).`, false);
    w.seen_idempotency[idem] = result;
    return result;
  }

  const priorId = String(args.reconstruction_id || args.supersedes_reconstruction_id || "");
  const prior = op === "RECONSTRUCT_SUPERSEDE" ? w.reconstructions[priorId] : undefined;
  if (op === "RECONSTRUCT_SUPERSEDE") {
    if (!prior) return fail(request_id, "NOT_FOUND", "Reconstruction not found.");
    if (prior.author_player_id !== principal.player_id && prior.visibility === "PRIVATE") {
      return fail(request_id, "FORBIDDEN", "You cannot supersede another Player's private reconstruction.");
    }
    if (prior.author_player_id !== principal.player_id) {
      return fail(request_id, "FORBIDDEN", "Only the author may supersede that reconstruction.");
    }
  }

  const rawSubject = String(args.subject_ref || prior?.subject_ref || "").trim();
  const entity = rawSubject ? findEntityAnywhere(w, rawSubject) : null;
  const subject = entity?.entity_id || rawSubject;
  if (!subject) return fail(request_id, "NOT_FOUND", "Name a known subject.");
  if (!entity && !evidenceAccessible(pl.discovery, "LIVE_INSPECT", subject) && !evidenceAccessible(pl.discovery, "ARCHIVE_CLAIM", subject)) {
    return fail(request_id, "NOT_FOUND", "That subject is not known to you.");
  }
  const claim = String(args.claim || "").trim();
  if (!claim) return fail(request_id, "INVALID_REQUEST", "Account text is required.");
  const visibility = args.visibility || prior?.visibility || "PRIVATE";
  if (visibility === "INSTITUTIONAL") {
    const org = w.organizations[String(args.org_id || prior?.org_id || "")];
    if (!canPublishInstitutional(org, principal.player_id)) {
      return fail(request_id, "FORBIDDEN", "You cannot record that as an institutional account.");
    }
  }
  const kinds = (args.evidence && args.evidence.length
    ? args.evidence
    : prior
      ? prior.evidence_refs.map((r) => r.kind)
      : ["ARCHIVE_CLAIM", "LIVE_INSPECT"]
  );
  const collected = collectReconstructionEvidence(
    pl,
    subject,
    kinds,
    w.cycle,
    entity?.entity_id || subject,
  );
  if (!collected.ok) return fail(request_id, collected.code, collected.message);
  if (!canPay(pl.budgets, COSTS.RECONSTRUCT)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
  }

  const reconstruction_id = allocateReconstructionId();
  const rec: ReconstructionRecord = {
    reconstruction_id,
    author_player_id: principal.player_id,
    subject_ref: subject,
    claim: claim.slice(0, 280),
    evidence_refs: collected.refs,
    created_cycle: w.cycle,
    supersedes_reconstruction_id: prior?.reconstruction_id,
    status: "RECORDED",
    visibility,
    epistemic: epistemicFromEvidence(collected.refs),
    org_id: args.org_id || prior?.org_id,
  };
  w.reconstructions[reconstruction_id] = rec;
  if (prior) prior.status = "SUPERSEDED";
  debit(pl.budgets, COSTS.RECONSTRUCT);
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: COSTS.RECONSTRUCT,
    reason: op,
  });
  const created = pushEvent("ENTITY_CREATE", {
    entity_id: reconstruction_id,
    entity_type: "DOCUMENT",
    location: null,
    owner_id: principal.player_id,
    properties: {
      reconstruction_kind: "PLAYER_RECONSTRUCTION",
      subject_ref: subject,
      visibility,
      epistemic: rec.epistemic,
      status: "RECORDED",
    },
    inventory: [],
    state: {},
  });
  await settleEv(created);
  if (prior) {
    const upd = pushEvent("ENTITY_UPDATE", {
      entity_id: prior.reconstruction_id,
      set: { reconstruction_status: "SUPERSEDED", superseded_by: reconstruction_id },
      unset: [],
    });
    await settleEv(upd);
  }
  const result = success(
    w,
    principal,
    request_id,
    events,
    rec.epistemic === "CONTESTED"
      ? `Reconstruction recorded (contested) of ${subject}.`
      : `Reconstruction recorded of ${subject}.`,
    false,
  );
  w.seen_idempotency[idem] = result;
  return result;
}

async function expireInstitutionEmergencies(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  for (const org of Object.values(w.organizations || {})) {
    const changed = expireDueScopes(org.emergency_scopes, w.cycle);
    for (const scope of changed) {
      const ev = pushEvent("ENTITY_UPDATE", {
        entity_id: scope.scope_id,
        set: { emergency_status: "EXPIRED", office_kind: "EMERGENCY_SCOPE" },
        unset: [],
      });
      await settleEv(ev);
    }
  }
}

async function applyEmergencyCommand(
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
  const op = args.operation;
  if (op === "ORG_EMERGENCY_DEFINE") {
    return fail(request_id, "FORBIDDEN", "Use the institution's predeclared emergency templates.");
  }
  if (op === "ORG_EMERGENCY_ACTIVATE") {
    const org_id = String(args.org_id || "").trim();
    const template_id = String(args.template_id || "").trim();
    const target_ref = String(args.target_ref || args.entity_id || "").trim();
    const org = w.organizations[org_id];
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    org.emergency_templates = org.emergency_templates?.length ? org.emergency_templates : defaultEmergencyTemplates();
    org.emergency_scopes = org.emergency_scopes || [];
    const template = org.emergency_templates.find((t) => t.template_id === template_id);
    if (!template) return fail(request_id, "NOT_FOUND", "Unknown emergency template.");
    const role = org.members.find((m) => m.agent_id === principal.player_id)?.role || null;
    const source = canActivate(org, principal.player_id, role, template, args.office_id);
    if (!source.ok) return fail(request_id, source.code, source.message);
    const holder = String(args.agent_id || principal.player_id);
    if (!isOrgMember(org, holder)) return fail(request_id, "FORBIDDEN", "Holder must be a member.");
    if (template.capability === "REPAIR") {
      const entity = findEntityAnywhere(w, target_ref);
      if (!entity) return fail(request_id, "NOT_FOUND", "Name a known target.");
      if (!assetInInstitutionScope(entity, org.org_id, holder)) {
        return fail(request_id, "FORBIDDEN", "That asset is not in this institution's scope.");
      }
      if (!conditionHolds(template, { entityCondition: entity.condition ?? 0 })) {
        return fail(request_id, "FORBIDDEN", "The emergency condition is not met.");
      }
    } else {
      if (target_ref !== "treasury") return fail(request_id, "FORBIDDEN", "Trade emergencies target the treasury.");
      if (!conditionHolds(template, { treasury: ensureTreasury(org) })) {
        return fail(request_id, "FORBIDDEN", "The emergency condition is not met.");
      }
    }
    const dup = findDuplicate(org.emergency_scopes, template.template_id, holder, target_ref, w.cycle);
    if (dup) {
      const result = success(w, principal, request_id, events, `Emergency ${dup.scope_id} already active.`, false);
      w.seen_idempotency[idem] = result;
      return result;
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
    const scope: EmergencyScope = {
      scope_id: allocateScopeId(),
      template_id: template.template_id,
      institution_id: org.org_id,
      holder_player_id: holder,
      source_office_id: source.office_id,
      capability: template.capability,
      target_ref,
      start_cycle: w.cycle,
      end_cycle: w.cycle + template.duration_cycles,
      status: "ACTIVE",
      created_cycle: w.cycle,
      reason: args.reason,
      spent: {},
    };
    org.emergency_scopes.push(scope);
    noteInstitutionPulse(w, "An institution declared a temporary repair authority.");
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_ACT,
      reason: "ORG_EMERGENCY_ACTIVATE",
    });
    const ev = pushEvent("ENTITY_CREATE", {
      entity_id: scope.scope_id,
      entity_type: "DOCUMENT",
      location: null,
      owner_id: org.org_id,
      properties: {
        office_kind: "EMERGENCY_SCOPE",
        template_id: scope.template_id,
        capability: scope.capability,
        target_ref: scope.target_ref,
        start_cycle: scope.start_cycle,
        end_cycle: scope.end_cycle,
        holder_player_id: scope.holder_player_id,
      },
      inventory: [],
      state: {},
    });
    await settleEv(ev);
    const result = success(
      w,
      principal,
      request_id,
      events,
      `Emergency ${scope.scope_id} active until cycle ${scope.end_cycle}.`,
      false,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }
  if (op === "ORG_EMERGENCY_REVOKE") {
    const scope_id = String(args.emergency_scope_id || "").trim();
    let found: { org_id: string; scope: EmergencyScope } | null = null;
    for (const org of Object.values(w.organizations || {})) {
      const scope = (org.emergency_scopes || []).find((s) => s.scope_id === scope_id);
      if (scope) {
        found = { org_id: org.org_id, scope };
        break;
      }
    }
    if (!found) return fail(request_id, "NOT_FOUND", "Emergency scope not found.");
    const org = w.organizations[found.org_id];
    const role = org.members.find((m) => m.agent_id === principal.player_id)?.role || null;
    const may =
      role === "founder" ||
      role === "officer" ||
      (found.scope.source_office_id &&
        org.offices?.[found.scope.source_office_id]?.status === "OCCUPIED" &&
        org.offices[found.scope.source_office_id]?.holder_player_id === principal.player_id);
    if (!may) return fail(request_id, "FORBIDDEN", "You cannot revoke that emergency.");
    if (found.scope.status !== "ACTIVE") {
      const result = success(w, principal, request_id, events, `Emergency ${scope_id} already closed.`, false);
      w.seen_idempotency[idem] = result;
      return result;
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
    found.scope.status = "REVOKED";
    found.scope.revoked_cycle = w.cycle;
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_ACT,
      reason: "ORG_EMERGENCY_REVOKE",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: scope_id,
      set: { emergency_status: "REVOKED", revoked_cycle: w.cycle },
      unset: [],
    });
    await settleEv(ev);
    const result = success(w, principal, request_id, events, `Emergency ${scope_id} revoked.`, false);
    w.seen_idempotency[idem] = result;
    return result;
  }
  return fail(request_id, "UNKNOWN_COMMAND", "That emergency action is not available.");
}

async function applyOfficeCommand(
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
  const op = args.operation;
  if (op === "ORG_OFFICE_CREATE") {
    const org_id = String(args.org_id || "").trim();
    const display_name = String(args.display_name || "").trim();
    const profile = args.authority_profile || parseOfficeProfile(String(args.authority_profile || ""));
    const org = w.organizations[org_id];
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    if (!isOrgOfficer(org, principal.player_id)) {
      return fail(request_id, "FORBIDDEN", "Only a founder or officer may create an office.");
    }
    if (!display_name || !profile) {
      return fail(request_id, "FORBIDDEN", "Office name and a valid authority profile are required.");
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_CREATE)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need influence 1 and compute 2.");
    }
    org.offices = org.offices || {};
    let office_id = allocateOfficeId(org.org_id, display_name);
    while (org.offices[office_id]) office_id = allocateOfficeId(org.org_id, display_name);
    const object_set = sanitizeIdList(args.object_set);
    const requires_track = parseRequiresTrack(args.requires_track);
    if (args.requires_track && requires_track === null) {
      return fail(request_id, "FORBIDDEN", "Only engineer or broker may be required.");
    }
    const office: OfficeRecord = {
      office_id,
      institution_id: org.org_id,
      display_name,
      status: "VACANT",
      authority_profile: profile,
      created_cycle: w.cycle,
      history: [],
      ...(object_set ? { object_set } : {}),
      ...(requires_track ? { requires_track } : {}),
    };
    org.offices[office_id] = office;
    applyPublishedPrecedence(org, office_id, args.office_precedence);
    debit(pl.budgets, COSTS.ORG_OFFICE_CREATE);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_CREATE,
      reason: "ORG_OFFICE_CREATE",
    });
    const ev = pushEvent("ENTITY_CREATE", {
      entity_id: office_id,
      entity_type: "DOCUMENT",
      location: null,
      owner_id: org.org_id,
      properties: {
        office_kind: "INSTITUTION_OFFICE",
        display_name,
        authority_profile: profile,
        office_status: "VACANT",
        institution_id: org.org_id,
        ...(requires_track ? { requires_track } : {}),
      },
      inventory: [],
      state: {},
    });
    await settleEv(ev);
    const result = success(
      w,
      principal,
      request_id,
      events,
      `Office ${display_name} created (${office_id}).`,
      false,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  if (op === "ORG_OFFICE_ASSIGN") {
    const office_id = String(args.office_id || "").trim();
    const agent_id = String(args.agent_id || "").trim();
    const found = findOffice(w.organizations, office_id);
    if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
    const org = w.organizations[found.org_id];
    const office = found.office;
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    if (!isOrgOfficer(org, principal.player_id)) {
      return fail(request_id, "FORBIDDEN", "Only a founder or officer may assign an office.");
    }
    if (office.status === "RETIRED") {
      return fail(request_id, "FORBIDDEN", "A retired office cannot be assigned.");
    }
    if (office.status === "OCCUPIED" && !args.replace) {
      return fail(request_id, "FORBIDDEN", "That office is occupied. Use replace to reassign.");
    }
    const target = w.players[agent_id];
    if (!target) return fail(request_id, "NOT_FOUND", "That Player is not in this world.");
    if (!isOrgMember(org, agent_id)) {
      return fail(request_id, "FORBIDDEN", "Only a member of this institution may hold the office.");
    }
    if (!playerMeetsOfficeTrack(w, agent_id, office)) {
      return fail(request_id, "FORBIDDEN", officeTrackReject(office.requires_track!));
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ASSIGN)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    if (office.status === "OCCUPIED" && office.holder_player_id) {
      office.history.push({
        cycle: w.cycle,
        holder_player_id: office.holder_player_id,
        kind: "VACATED",
      });
    }
    office.holder_player_id = agent_id;
    office.status = "OCCUPIED";
    office.history.push({ cycle: w.cycle, holder_player_id: agent_id, kind: "ASSIGNED" });
    debit(pl.budgets, COSTS.ORG_OFFICE_ASSIGN);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_ASSIGN,
      reason: "ORG_OFFICE_ASSIGN",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: office.office_id,
      set: {
        office_status: "OCCUPIED",
        holder_player_id: agent_id,
        institution_id: org.org_id,
        office_kind: "INSTITUTION_OFFICE",
      },
      unset: [],
    });
    await settleEv(ev);
    const result = success(
      w,
      principal,
      request_id,
      events,
      `Assigned ${office.display_name} to ${target.handle || agent_id}.`,
      false,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  if (op === "ORG_OFFICE_VACATE") {
    const office_id = String(args.office_id || "").trim();
    const found = findOffice(w.organizations, office_id);
    if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
    const org = w.organizations[found.org_id];
    const office = found.office;
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    if (office.status !== "OCCUPIED" || !office.holder_player_id) {
      return fail(request_id, "FORBIDDEN", "That office is not occupied.");
    }
    const self = office.holder_player_id === principal.player_id;
    if (!self && !isOrgOfficer(org, principal.player_id)) {
      return fail(request_id, "FORBIDDEN", "Only the holder or a founder/officer may vacate.");
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_VACATE)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    const prior = office.holder_player_id;
    office.history.push({ cycle: w.cycle, holder_player_id: prior, kind: "VACATED" });
    office.holder_player_id = undefined;
    office.status = "VACANT";
    debit(pl.budgets, COSTS.ORG_OFFICE_VACATE);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_VACATE,
      reason: "ORG_OFFICE_VACATE",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: office.office_id,
      set: {
        office_status: "VACANT",
        institution_id: org.org_id,
        office_kind: "INSTITUTION_OFFICE",
      },
      unset: ["holder_player_id"],
    });
    await settleEv(ev);
    const successorId = await settleOfficeHandoff(w, org, office, prior, pushEvent, settleEv);
    const seated = successorId ? w.players[successorId]?.handle || successorId : "";
    const result = success(
      w,
      principal,
      request_id,
      events,
      successorId
        ? self
          ? `You resign ${office.display_name}. ${seated} succeeds.`
          : `Vacated ${office.display_name}. ${seated} succeeds.`
        : self
          ? `You resign ${office.display_name}.`
          : `Vacated ${office.display_name}.`,
      false,
    );
    w.seen_idempotency[idem] = result;
    return result;
  }

  if (op === "ORG_OFFICE_RETIRE") {
    const office_id = String(args.office_id || "").trim();
    const found = findOffice(w.organizations, office_id);
    if (!found) return fail(request_id, "NOT_FOUND", "Office not found.");
    const org = w.organizations[found.org_id];
    const office = found.office;
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    if (!isOrgOfficer(org, principal.player_id)) {
      return fail(request_id, "FORBIDDEN", "Only a founder or officer may retire an office.");
    }
    if (office.status === "RETIRED") {
      return fail(request_id, "FORBIDDEN", "That office is already retired.");
    }
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_RETIRE)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    if (office.holder_player_id) {
      office.history.push({
        cycle: w.cycle,
        holder_player_id: office.holder_player_id,
        kind: "VACATED",
      });
    }
    office.holder_player_id = undefined;
    office.status = "RETIRED";
    office.retired_cycle = w.cycle;
    office.history.push({ cycle: w.cycle, holder_player_id: null, kind: "RETIRED" });
    debit(pl.budgets, COSTS.ORG_OFFICE_RETIRE);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_RETIRE,
      reason: "ORG_OFFICE_RETIRE",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: office.office_id,
      set: {
        office_status: "RETIRED",
        retired_cycle: w.cycle,
        institution_id: org.org_id,
        office_kind: "INSTITUTION_OFFICE",
      },
      unset: ["holder_player_id"],
    });
    await settleEv(ev);
    const result = success(w, principal, request_id, events, `Retired ${office.display_name}.`, false);
    w.seen_idempotency[idem] = result;
    return result;
  }

  if (op === "ORG_OFFICE_ACT") {
    const org_id = String(args.org_id || "").trim();
    const office_id = String(args.office_id || "").trim();
    const notice = String(args.notice || "").trim();
    let org = org_id ? w.organizations[org_id] : undefined;
    let office: OfficeRecord | undefined;
    if (office_id) {
      const found = findOffice(w.organizations, office_id);
      if (found) {
        org = w.organizations[found.org_id];
        office = found.office;
      }
    } else if (org) {
      office = Object.values(org.offices || {}).find(
        (o) =>
          o.status === "OCCUPIED" &&
          o.holder_player_id === principal.player_id &&
          o.authority_profile === "PUBLISH_NOTICE",
      );
    }
    if (!org || org.status !== "ACTIVE") return fail(request_id, "NOT_FOUND", "Organization not found.");
    if (!office) return fail(request_id, "FORBIDDEN", "You do not hold a notice office here.");
    if (office.status !== "OCCUPIED" || office.holder_player_id !== principal.player_id) {
      return fail(request_id, "FORBIDDEN", "Only the current holder may act.");
    }
    if (!(HOSTED_ACT_PROFILES as readonly string[]).includes(office.authority_profile)) {
      return fail(request_id, "FORBIDDEN", "That office profile cannot act in this stage.");
    }
    if (!notice) return fail(request_id, "INVALID_REQUEST", "Notice text required.");
    if (!canPay(pl.budgets, COSTS.ORG_OFFICE_ACT)) {
      return fail(request_id, "BUDGET_EXCEEDED", "You need compute 1.");
    }
    org.public_notice = notice.slice(0, 280);
    w.rumor = ensureRumor(w.rumor);
    const noticeClaimId = allocateClaimId();
    rememberClaim(
      w.rumor,
      {
        claim_id: noticeClaimId,
        originator_ref: principal.player_id,
        subject_ref: org.org_id,
        content: normalizeClaimText(org.public_notice),
        created_cycle: w.cycle,
        origin_class: "INSTITUTION_NOTICE",
        visibility: "PUBLIC",
        origin_claim_id: noticeClaimId,
      },
      principal.player_id,
    );
    debit(pl.budgets, COSTS.ORG_OFFICE_ACT);
    pushEvent("BUDGET_CONSUMED", {
      player_id: principal.player_id,
      cost_paid: COSTS.ORG_OFFICE_ACT,
      reason: "ORG_OFFICE_ACT",
    });
    const ev = pushEvent("ENTITY_UPDATE", {
      entity_id: office.office_id,
      set: {
        public_notice: org.public_notice,
        office_status: office.status,
        institution_id: org.org_id,
        office_kind: "INSTITUTION_OFFICE",
      },
      unset: [],
    });
    await settleEv(ev);
    const result = success(w, principal, request_id, events, `Notice posted for ${org.name}.`, false);
    w.seen_idempotency[idem] = result;
    return result;
  }

  return fail(request_id, "UNKNOWN_COMMAND", "That office action is not available.");
}

async function applyAttest(
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
  const room = w.rooms[pl.room_id];
  if (!room) return fail(request_id, "NOT_FOUND", "You are not in a known room.");
  if (isHiddenRoom(room)) {
    return fail(request_id, "NOT_OBSERVABLE", "That place cannot be attested.");
  }
  const entity_id = String(args.entity_id || "").trim();
  const subject = String(args.subject_entity_id || "").trim();
  const claim = args.archive_claim;
  if (!entity_id) return fail(request_id, "NOT_FOUND", "Name a visible artifact.");
  if (!subject || (claim !== "DESTROYED" && claim !== "OPERATING")) {
    return fail(request_id, "FORBIDDEN", "Subject and claim must be set together.");
  }
  const entity = findEntity(room, entity_id);
  if (!entity) {
    let elsewhere = false;
    for (const other of Object.values(w.rooms)) {
      if (other.room_id === room.room_id) continue;
      if (findEntity(other, entity_id)) {
        elsewhere = true;
        break;
      }
    }
    if (elsewhere) return fail(request_id, "NOT_COLOCATED", "You must be in the same room to attest.");
    return fail(request_id, "NOT_FOUND", `You do not see “${entity_id}” here.`);
  }
  if ((entity.entity_type || "").toUpperCase() !== "ARTIFACT") {
    return fail(request_id, "FORBIDDEN", "Only an artifact can hold an archive claim.");
  }
  if (entity.archive_subject_entity_id || entity.archive_claim) {
    return fail(request_id, "FORBIDDEN", "That claim is already set.");
  }
  const attestCost = withAnnexAttention(
    { ...COSTS.ATTEST },
    readyClassInRoom(roomEntities(room), "archive_annex"),
  );
  if (!canPay(pl.budgets, attestCost)) {
    return fail(request_id, "BUDGET_EXCEEDED", "You do not have enough attention.");
  }
  debit(pl.budgets, attestCost);
  entity.archive_subject_entity_id = subject;
  entity.archive_claim = claim;
  const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
  if (idx >= 0) room.entities[idx] = entity;
  pushEvent("BUDGET_CONSUMED", {
    player_id: principal.player_id,
    cost_paid: attestCost,
    reason: "ATTEST",
  });
  const ev = pushEvent("ENTITY_UPDATE", {
    entity_id: entity.entity_id,
    operation: "ATTEST",
    attester_id: principal.player_id,
    visibility: "PUBLIC",
    subject_entity_id: subject,
    archive_claim: claim,
    set: {
      archive_subject_entity_id: subject,
      archive_claim: claim,
    },
  });
  await settleEv(ev);
  const result = success(w, principal, request_id, events, `You attest ${titleCaseLabel(entity.label)}.`, false);
  w.seen_idempotency[idem] = result;
  return result;
}

async function applyContestSuccessFollowOns(
  w: WorldRuntime,
  contest: OpenContest,
  outcome: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE" | "EXPIRED" | "ABORTED",
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  if (outcome !== "SUCCESS" && outcome !== "PARTIAL_SUCCESS") return;
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
  if (contest.contest_form === "INFORMATION_CONTEST" && contest.target.kind === "ENTITY") {
    const room = w.rooms[contest.room_id];
    const ent = room ? findEntity(room, contest.target.entity_id) : null;
    if (ent && room) {
      const spec = FORM_SPECS.INFORMATION_CONTEST;
      const dur =
        outcome === "SUCCESS"
          ? spec.restriction_duration_cycles || 8
          : spec.partial_restriction_duration_cycles || 4;
      ent.inspect_restricted_until = w.cycle + dur;
      const idx = room.entities.findIndex((e) => e.entity_id === ent.entity_id);
      if (idx >= 0) room.entities[idx] = ent;
      const u = pushEvent("ENTITY_UPDATE", {
        entity_id: ent.entity_id,
        field: "inspect_restricted_until",
        to: ent.inspect_restricted_until,
        operation: "INFORMATION_CONTEST",
        contest_id: contest.contest_id,
      });
      await settleEv(u);
    }
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

async function resolveDueContests(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  for (const contest of openContests(w)) {
    if (w.cycle < contest.expires_cycle) continue;
    const expired = w.cycle > contest.expires_cycle;
    let outcome: ContestOutcome = expired
      ? "EXPIRED"
      : "FAILURE";
    let score = 0;
    const spentDeclarer: StakeMap = expired ? {} : { ...contest.stake };
    const spentDefender: StakeMap = expired ? {} : { ...contest.defender_stake };
    if (expired) {
      releaseStake(contestStakeBudgets(w, contest.declarer_id, contest.acting_for), contest.stake);
      releaseStake(
        contestStakeBudgets(w, contest.defender_id, contest.defender_acting_for),
        contest.defender_stake,
      );
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
        defensive_work: Boolean(
          w.rooms[contest.room_id] &&
            readyClassInRoom(roomEntities(w.rooms[contest.room_id]), "defensive_work"),
        ),
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
      declarer_id: contest.declarer_id,
      defender_id: contest.defender_id || null,
      target: contest.target,
      declarer_stake_spent: spentDeclarer,
      defender_stake_spent: spentDefender,
      target_entity_id: targetEntityId,
      score_millipoints: score,
      resolution_digest: digest,
    });
    await settleEv(ev);
    if (outcome !== "SUCCESS" && outcome !== "PARTIAL_SUCCESS") continue;
    await applyContestSuccessFollowOns(w, contest, outcome, pushEvent, settleEv);
  }
}

async function applyScheduledPressure(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  w.pressure = ensurePressure(w.pressure);
  const classes = w.pressure.class_activations || {
    infrastructure_failure: w.pressure.schedule_activations,
    resource_scarcity: 0,
    access_restriction: 0,
  };
  const lastBy = w.pressure.last_by_class || {};

  if (classDue(w.cycle, "infrastructure_failure", classes.infrastructure_failure || 0)) {
    const target = selectScheduleRelay(collectLiveRelaysWithRoom(w.rooms));
    if (target) {
      const room = w.rooms[target.room_id];
      const entity = room ? findEntity(room, target.entity_id) : undefined;
      if (entity) {
        const before = entity.condition ?? 0;
        const after = previewAfter(before);
        entity.condition = after;
        const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
        if (idx >= 0) room.entities[idx] = entity;
        classes.infrastructure_failure = (classes.infrastructure_failure || 0) + 1;
        lastBy.infrastructure_failure = w.cycle;
        w.pressure.schedule_activations = classes.infrastructure_failure;
        w.pressure.last_cycle = w.cycle;
        notePulse(w.pressure, WATCH_INFRA_PULSE, 20);
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
    }
  }

  if (classDue(w.cycle, RESOURCE_CLASS, classes.resource_scarcity || 0)) {
    const target = selectScheduleNode(collectHarvestNodes(w.rooms));
    if (target) {
      const room = w.rooms[target.room_id];
      const entity = room ? findEntity(room, target.entity_id) : undefined;
      if (entity) {
        const before = entity.stock_amount ?? 0;
        const after = previewStockAfter(before);
        if (before >= STOCK_DELTA && after >= 0) {
          entity.stock_amount = after;
          const idx = room.entities.findIndex((e) => e.entity_id === entity.entity_id);
          if (idx >= 0) room.entities[idx] = entity;
          classes.resource_scarcity = (classes.resource_scarcity || 0) + 1;
          lastBy.resource_scarcity = w.cycle;
          w.pressure.last_cycle = w.cycle;
          notePulse(w.pressure, WATCH_RESOURCE_PULSE, 20);
          const ev = pushEvent("ENTITY_UPDATE", {
            entity_id: entity.entity_id,
            field: "stock_amount",
            from: before,
            to: after,
            authorizer: "schedule",
            preview_after: after,
          });
          await settleEv(ev);
        }
      }
    }
  }

  if (classDue(w.cycle, ACCESS_CLASS, classes.access_restriction || 0)) {
    const target = selectScheduleExit(collectPublicExits(w.rooms));
    const already = (w.access_restrictions || []).some(
      (r) =>
        r.scope === "EXIT" &&
        target &&
        r.room_id === target.room_id &&
        r.exit_id === target.exit_id &&
        w.cycle <= r.expires_cycle,
    );
    if (target && !already) {
      const restriction_id = `restr.sched.access.${w.cycle}`;
      const expires_cycle = w.cycle + ACCESS_DURATION_CYCLES;
      w.access_restrictions = w.access_restrictions || [];
      w.access_restrictions.push({
        restriction_id,
        scope: "EXIT",
        mode: "DENY",
        applies_to: "*",
        room_id: target.room_id,
        exit_id: target.exit_id,
        expires_cycle,
      });
      classes.access_restriction = (classes.access_restriction || 0) + 1;
      lastBy.access_restriction = w.cycle;
      w.pressure.last_cycle = w.cycle;
      notePulse(w.pressure, WATCH_ACCESS_PULSE, expires_cycle);
      const ev = pushEvent("ACCESS_RESTRICTED", {
        restriction_id,
        scope: "EXIT",
        mode: "DENY",
        applies_to: "*",
        reason: "SCHEDULE",
        expires_cycle,
        authorized_by: "world.scheduler",
        room_id: target.room_id,
        exit_id: target.exit_id,
      });
      await settleEv(ev);
    }
  }

  w.pressure.class_activations = classes;
  w.pressure.last_by_class = lastBy;
}

async function deliverDelayedMessages(
  w: WorldRuntime,
  pushEvent: PushEv,
  settleEv: SettleEv,
): Promise<void> {
  const pending = w.pending_messages || [];
  if (!pending.length) return;
  const keep: PendingMessage[] = [];
  w.messages = w.messages || [];
  for (const msg of pending) {
    if (w.cycle < msg.deliver_at_cycle) {
      keep.push(msg);
      continue;
    }
    if (w.messages.some((m) => m.message_id === msg.message_id)) continue;
    w.messages.push({
      message_id: msg.message_id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      text: msg.text,
      status: "DELIVERED",
      delivered_cycle: w.cycle,
    });
    const ev = pushEvent("MESSAGE_DELIVERED", {
      message_id: msg.message_id,
      recipient_id: msg.recipient_id,
      delivered_cycle: w.cycle,
      ...(msg.claim ? { claim_id: msg.claim.claim_id } : {}),
    });
    if (msg.claim) {
      applyDeliveredClaim(w, msg.message_id, msg.sender_id, msg.recipient_id, msg.claim, w.cycle);
    }
    await settleEv(ev);
  }
  w.pending_messages = keep;
}

function applyDeliveredClaim(
  w: WorldRuntime,
  message_id: string,
  sender_id: string,
  recipient_id: string,
  payload: ClaimPayload,
  cycle: number,
): void {
  w.rumor = ensureRumor(w.rumor);
  rememberClaim(
    w.rumor,
    {
      claim_id: payload.claim_id,
      originator_ref: payload.originator_ref,
      subject_ref: payload.subject_ref,
      content: payload.content,
      created_cycle: payload.created_cycle,
      derived_from: payload.derived_from,
      origin_class: payload.origin_class,
      visibility: payload.visibility,
      origin_claim_id: payload.origin_claim_id,
    },
    sender_id,
  );
  recordTransmission(w.rumor, {
    transmission_id: `tx.${message_id}`,
    claim_id: payload.claim_id,
    sender_ref: sender_id,
    recipient_ref: recipient_id,
    message_id,
    parent_transmission_id: payload.parent_transmission_id,
    received_cycle: cycle,
  });
}
