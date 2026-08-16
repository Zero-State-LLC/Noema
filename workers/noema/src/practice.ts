/**
 * GC1-S0/S1 derived practice. Rebuildable cache, not WorldState.
 * Authority: Noema-Specs GC1-FIRST-SLICE / GC1-S1-RECOGNITION / RFC-0004 / RFC-0005.
 */

export const MASTERY_CATALOG_ID = "mastery-catalog/gc1-s1";
export const MAX_PLAY_LINES = 3;

export const PRACTICE_TRACKS = [
  {
    track_id: "track.explorer.01",
    display_order: 1,
    recognition_threshold: 5,
    play_line: "You have been learning the rooms.",
    recognized_play_line: "You know these rooms.",
  },
  {
    track_id: "track.surveyor.01",
    display_order: 2,
    recognition_threshold: 5,
    play_line: "You have been doing survey work.",
    recognized_play_line: "You are known for survey work.",
  },
  {
    track_id: "track.broker.01",
    display_order: 3,
    recognition_threshold: 3,
    play_line: "You have been closing exchanges.",
    recognized_play_line: "You are known for closing exchanges.",
  },
  {
    track_id: "track.engineer.01",
    display_order: 4,
    recognition_threshold: 3,
    play_line: "You have been keeping infrastructure alive.",
    recognized_play_line: "You are known for keeping infrastructure alive.",
  },
] as const;

export type PracticeTrackId = (typeof PRACTICE_TRACKS)[number]["track_id"];

export type PracticeState = {
  catalog_id: typeof MASTERY_CATALOG_ID | "mastery-catalog/gc1-s0";
  tracks: Partial<Record<PracticeTrackId, string[]>>;
  recognition?: Partial<Record<PracticeTrackId, string[]>>;
};

export type PracticeEvent = {
  event_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
};

export type PracticeTrade = {
  proposer_id: string;
  counterparty_id: string;
};

export function emptyPractice(): PracticeState {
  return { catalog_id: MASTERY_CATALOG_ID, tracks: {}, recognition: {} };
}

function ensurePractice(raw: PracticeState | undefined | null): PracticeState {
  if (!raw) return emptyPractice();
  const tracks = { ...(raw.tracks || {}) };
  const recognition = { ...(raw.recognition || {}) };
  // S0 caches: reuse distinct units as recognition except engineer (entity ids unknown).
  if (raw.catalog_id === "mastery-catalog/gc1-s0") {
    for (const track of PRACTICE_TRACKS) {
      if (track.track_id === "track.engineer.01") continue;
      if (!recognition[track.track_id]?.length && tracks[track.track_id]?.length) {
        recognition[track.track_id] = [...(tracks[track.track_id] || [])];
      }
    }
  }
  return { catalog_id: MASTERY_CATALOG_ID, tracks, recognition };
}

function payloadPlayer(payload: Record<string, unknown> | undefined): string | null {
  if (!payload) return null;
  for (const key of ["agent_id", "player_id"]) {
    const value = payload[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function credit(
  state: PracticeState,
  trackId: PracticeTrackId,
  unit: string,
  recognitionUnit?: string,
): PracticeState {
  if (!unit && !recognitionUnit) return state;
  const next = ensurePractice(state);
  if (unit) {
    const units = [...(next.tracks[trackId] || [])];
    if (!units.includes(unit)) {
      units.push(unit);
      next.tracks[trackId] = units;
    }
  }
  if (recognitionUnit) {
    const rec = [...(next.recognition?.[trackId] || [])];
    if (!rec.includes(recognitionUnit)) {
      rec.push(recognitionUnit);
      next.recognition = { ...(next.recognition || {}), [trackId]: rec };
    }
  }
  return next;
}

/** Catalog-shaped and hosted-shaped events. */
export function creditsFromEvent(
  ev: PracticeEvent,
  opts: {
    actingPlayerId?: string;
    trades?: Record<string, PracticeTrade>;
  } = {},
): PracticeEventCredit[] {
  const payload = ev.payload || {};
  const out: PracticeEventCredit[] = [];
  if (ev.event_type === "LOOK") {
    const playerId = payloadPlayer(payload);
    const roomId = payload.room_id;
    if (playerId && typeof roomId === "string") {
      out.push({ player_id: playerId, track_id: "track.explorer.01", unit: roomId });
    }
  } else if (ev.event_type === "INSPECT") {
    const playerId = payloadPlayer(payload);
    const entityId = payload.entity_id;
    if (playerId && typeof entityId === "string") {
      out.push({ player_id: playerId, track_id: "track.surveyor.01", unit: entityId });
    }
  } else if (ev.event_type === "TRADE_ACCEPTED") {
    const tradeId = payload.trade_id;
    if (typeof tradeId !== "string") return out;
    const trade = opts.trades?.[tradeId];
    const acceptedBy = typeof payload.accepted_by === "string" ? payload.accepted_by : "";
    const parties = new Set<string>();
    if (trade?.proposer_id) parties.add(trade.proposer_id);
    if (trade?.counterparty_id) parties.add(trade.counterparty_id);
    if (acceptedBy) parties.add(acceptedBy);
    for (const player_id of parties) {
      out.push({ player_id, track_id: "track.broker.01", unit: tradeId });
    }
  } else if (ev.event_type === "ENTITY_UPDATE") {
    const hostedRepair = payload.operation === "REPAIR";
    const catalogRepair =
      payload.set && typeof payload.set === "object" && payload.set !== null && "condition" in payload.set;
    const actor =
      (typeof payload.actor_id === "string" && payload.actor_id) || opts.actingPlayerId || "";
    if ((hostedRepair || catalogRepair) && actor) {
      const entityId = typeof payload.entity_id === "string" ? payload.entity_id : undefined;
      out.push({
        player_id: actor,
        track_id: "track.engineer.01",
        unit: ev.event_id,
        recognition_unit: entityId,
      });
    }
  }
  return out;
}

export type PracticeCredit = {
  track_id: PracticeTrackId;
  unit: string;
  recognition_unit?: string;
};

export type PracticeEventCredit = PracticeCredit & { player_id: string };

export function applyPracticeCredits(
  state: PracticeState | undefined,
  credits: PracticeCredit[],
): PracticeState {
  let next = ensurePractice(state);
  for (const c of credits) next = credit(next, c.track_id, c.unit, c.recognition_unit ?? c.unit);
  return next;
}

export const ENGINEER_TRACK: PracticeTrackId = "track.engineer.01";
export const REPAIR_BASE = 15;
export const REPAIR_REPEAT_BONUS = 5;
export const CONDITION_CAP = 100;
export const PRACTICED_REPAIR_LINE = "You work this {label} with practiced hands.";

export function isRecognizedEngineer(state: PracticeState | undefined | null): boolean {
  const rec = ensurePractice(state).recognition?.[ENGINEER_TRACK] || [];
  return rec.length >= 3;
}

export function hasRepairedEntity(state: PracticeState | undefined | null, entityId: string): boolean {
  if (!entityId) return false;
  const rec = ensurePractice(state).recognition?.[ENGINEER_TRACK] || [];
  return rec.includes(entityId);
}

export function repairConditionDelta(
  state: PracticeState | undefined | null,
  entityId: string,
): { delta: 15 | 20; bonus: 0 | 5 } {
  if (isRecognizedEngineer(state) && hasRepairedEntity(state, entityId)) {
    return { delta: 20, bonus: 5 };
  }
  return { delta: 15, bonus: 0 };
}

export function practiceLines(state: PracticeState | undefined | null): string[] {
  const snap = ensurePractice(state);
  const ordered = [...PRACTICE_TRACKS].sort((a, b) => a.display_order - b.display_order);
  const recognized: string[] = [];
  const practicing: string[] = [];
  for (const track of ordered) {
    const practiceCount = (snap.tracks[track.track_id] || []).length;
    const recogCount = (snap.recognition?.[track.track_id] || []).length;
    if (practiceCount <= 0) continue;
    if (recogCount >= track.recognition_threshold) recognized.push(track.recognized_play_line);
    else practicing.push(track.play_line);
  }
  return [...recognized, ...practicing].slice(0, MAX_PLAY_LINES);
}
