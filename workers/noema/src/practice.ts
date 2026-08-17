/**
 * GC1-S0/S1 derived practice. Rebuildable cache, not WorldState.
 * Authority: Noema-Specs GC1-FIRST-SLICE / GC1-S1-RECOGNITION / GC1-S6-PUBLIC-TITLES / RFC-0004 / RFC-0005 / RFC-0105.
 */

export const MASTERY_CATALOG_ID = "mastery-catalog/gc1-s1";
export const MAX_PLAY_LINES = 3;
export const PUBLIC_TITLE_CAP = 1;

export const PRACTICE_TRACKS = [
  {
    track_id: "track.explorer.01",
    display_order: 1,
    recognition_threshold: 5,
    play_line: "You have been learning the rooms.",
    recognized_play_line: "You know these rooms.",
    latent_play_line: "You were learning the rooms.",
    public_title_line: "{handle} knows these rooms.",
  },
  {
    track_id: "track.surveyor.01",
    display_order: 2,
    recognition_threshold: 5,
    play_line: "You have been doing survey work.",
    recognized_play_line: "You are known for survey work.",
    latent_play_line: "You were known for survey work.",
    public_title_line: "{handle} is known for survey work.",
  },
  {
    track_id: "track.broker.01",
    display_order: 3,
    recognition_threshold: 3,
    play_line: "You have been closing exchanges.",
    recognized_play_line: "You are known for closing exchanges.",
    latent_play_line: "You were known for closing exchanges.",
    public_title_line: "{handle} is known for closing exchanges.",
  },
  {
    track_id: "track.engineer.01",
    display_order: 4,
    recognition_threshold: 3,
    play_line: "You have been keeping infrastructure alive.",
    recognized_play_line: "You are known for keeping infrastructure alive.",
    latent_play_line: "You were known for keeping infrastructure alive.",
    public_title_line: "{handle} is known for keeping infrastructure alive.",
  },
] as const;

export type PracticeTrackId = (typeof PRACTICE_TRACKS)[number]["track_id"];

export type PracticeState = {
  catalog_id: typeof MASTERY_CATALOG_ID | "mastery-catalog/gc1-s0";
  tracks: Partial<Record<PracticeTrackId, string[]>>;
  recognition?: Partial<Record<PracticeTrackId, string[]>>;
  last_work_cycle?: Partial<Record<PracticeTrackId, number>>;
  latent_progress?: Partial<Record<PracticeTrackId, number>>;
  counterparties?: Partial<Record<PracticeTrackId, string[]>>;
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
  const last_work_cycle = { ...(raw.last_work_cycle || {}) };
  const latent_progress = { ...(raw.latent_progress || {}) };
  const counterparties = { ...(raw.counterparties || {}) };
  // S0 caches: reuse distinct units as recognition except engineer (entity ids unknown).
  if (raw.catalog_id === "mastery-catalog/gc1-s0") {
    for (const track of PRACTICE_TRACKS) {
      if (track.track_id === "track.engineer.01") continue;
      if (!recognition[track.track_id]?.length && tracks[track.track_id]?.length) {
        recognition[track.track_id] = [...(tracks[track.track_id] || [])];
      }
    }
  }
  return { catalog_id: MASTERY_CATALOG_ID, tracks, recognition, last_work_cycle, latent_progress, counterparties };
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
      const others = [...parties].filter((id) => id !== player_id);
      if (others.length) {
        for (const other of others) {
          out.push({ player_id, track_id: "track.broker.01", unit: tradeId, party_id: other });
        }
      } else {
        out.push({ player_id, track_id: "track.broker.01", unit: tradeId });
      }
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
  party_id?: string;
};

export type PracticeEventCredit = PracticeCredit & { player_id: string };

export function applyPracticeCredits(
  state: PracticeState | undefined,
  credits: PracticeCredit[],
  cycle?: number,
): PracticeState {
  let next = ensurePractice(state);
  for (const c of credits) {
    const wasLatent = cycle != null && isTrackLatent(next, c.track_id, cycle);
    next = credit(next, c.track_id, c.unit, c.recognition_unit ?? c.unit);
    if (c.party_id) {
      const parties = [...(next.counterparties?.[c.track_id] || [])];
      if (!parties.includes(c.party_id)) {
        parties.push(c.party_id);
        next.counterparties = { ...(next.counterparties || {}), [c.track_id]: parties };
      }
    }
    if (cycle == null) continue;
    if (wasLatent) {
      const progress = (next.latent_progress?.[c.track_id] || 0) + 1;
      if (progress >= REHAB_WORKS) {
        next.last_work_cycle = { ...(next.last_work_cycle || {}), [c.track_id]: cycle };
        next.latent_progress = { ...(next.latent_progress || {}), [c.track_id]: 0 };
      } else {
        next.latent_progress = { ...(next.latent_progress || {}), [c.track_id]: progress };
      }
    } else {
      next.last_work_cycle = { ...(next.last_work_cycle || {}), [c.track_id]: cycle };
      next.latent_progress = { ...(next.latent_progress || {}), [c.track_id]: 0 };
    }
  }
  return next;
}

export const EXPLORER_TRACK: PracticeTrackId = "track.explorer.01";
export const SURVEYOR_TRACK: PracticeTrackId = "track.surveyor.01";
export const BROKER_TRACK: PracticeTrackId = "track.broker.01";
export const ENGINEER_TRACK: PracticeTrackId = "track.engineer.01";
export const REPAIR_BASE = 15;
export const REPAIR_REPEAT_BONUS = 5;
export const CONDITION_CAP = 100;
export const LATENT_AFTER_CYCLES = 12;
export const REHAB_WORKS = 3;
export const PRACTICED_REPAIR_LINE = "You work this {label} with practiced hands.";
export const OVERHAUL_ENERGY_EXTRA = 1;
export const OVERHAUL_CONDITION_EXTRA = 5;
export const OVERHAUL_LINE = "You overhaul {label}.";
export const ENGINEER_LATENT_LINE = "You were known for keeping infrastructure alive.";

export function isTrackRecognized(state: PracticeState | undefined | null, trackId: PracticeTrackId): boolean {
  const track = PRACTICE_TRACKS.find((t) => t.track_id === trackId);
  if (!track) return false;
  return (ensurePractice(state).recognition?.[trackId] || []).length >= track.recognition_threshold;
}

export function isTrackLatent(
  state: PracticeState | undefined | null,
  trackId: PracticeTrackId,
  now: number,
): boolean {
  if (!isTrackRecognized(state, trackId)) return false;
  const snap = ensurePractice(state);
  const last = snap.last_work_cycle?.[trackId];
  if (last == null) return false;
  if (now - last < LATENT_AFTER_CYCLES) return false;
  return (snap.latent_progress?.[trackId] || 0) < REHAB_WORKS;
}

export function isRecognizedEngineer(state: PracticeState | undefined | null): boolean {
  const rec = ensurePractice(state).recognition?.[ENGINEER_TRACK] || [];
  return rec.length >= 3;
}

export function hasRepairedEntity(state: PracticeState | undefined | null, entityId: string): boolean {
  if (!entityId) return false;
  const rec = ensurePractice(state).recognition?.[ENGINEER_TRACK] || [];
  return rec.includes(entityId);
}

export function canOverhaul(state: PracticeState | undefined | null, now = 0): boolean {
  return isRecognizedEngineer(state) && !isTrackLatent(state, ENGINEER_TRACK, now);
}

export function repairConditionDelta(
  state: PracticeState | undefined | null,
  entityId: string,
  now = 0,
): { delta: 15 | 20; bonus: 0 | 5 } {
  if (
    isRecognizedEngineer(state) &&
    hasRepairedEntity(state, entityId) &&
    !isTrackLatent(state, ENGINEER_TRACK, now)
  ) {
    return { delta: 20, bonus: 5 };
  }
  return { delta: 15, bonus: 0 };
}

export function practiceLines(state: PracticeState | undefined | null, now = 0): string[] {
  const snap = ensurePractice(state);
  const ordered = [...PRACTICE_TRACKS].sort((a, b) => a.display_order - b.display_order);
  const recognized: string[] = [];
  const practicing: string[] = [];
  for (const track of ordered) {
    const practiceCount = (snap.tracks[track.track_id] || []).length;
    const recogCount = (snap.recognition?.[track.track_id] || []).length;
    if (practiceCount <= 0) continue;
    if (recogCount >= track.recognition_threshold) {
      recognized.push(
        isTrackLatent(snap, track.track_id, now) ? track.latent_play_line : track.recognized_play_line,
      );
    } else practicing.push(track.play_line);
  }
  return [...recognized, ...practicing].slice(0, MAX_PLAY_LINES);
}

/** World-native handle only. Raw player ids and hex suffixes stay unpublished. */
export function titleHandle(handle?: string | null, playerId?: string | null): string | undefined {
  const h = String(handle || "").trim();
  if (!h) return undefined;
  if (/^player\./i.test(h)) return undefined;
  if (playerId && h === playerId) return undefined;
  if (/^[0-9a-f]{12}$/i.test(h)) return undefined;
  return h.slice(0, 32);
}

/** GC1-S6: at most one third-person public title. LATENT and unnamed handles withhold. */
export function publicTitleLine(
  handle: string | undefined | null,
  state: PracticeState | undefined | null,
  now = 0,
  playerId?: string | null,
): string | undefined {
  const name = titleHandle(handle, playerId);
  if (!name) return undefined;
  const snap = ensurePractice(state);
  const ordered = [...PRACTICE_TRACKS].sort((a, b) => a.display_order - b.display_order);
  for (const track of ordered) {
    if (!isTrackRecognized(snap, track.track_id)) continue;
    if (isTrackLatent(snap, track.track_id, now)) continue;
    return track.public_title_line.replace("{handle}", name);
  }
  return undefined;
}

export function publicTitleLines(
  handle: string | undefined | null,
  state: PracticeState | undefined | null,
  now = 0,
  playerId?: string | null,
): string[] {
  const line = publicTitleLine(handle, state, now, playerId);
  return line ? [line].slice(0, PUBLIC_TITLE_CAP) : [];
}

export function trackMaintained(
  state: PracticeState | undefined | null,
  trackId: PracticeTrackId,
  now: number,
): boolean {
  return isTrackRecognized(state, trackId) && !isTrackLatent(state, trackId, now);
}

export function hasVisitedRoom(state: PracticeState | undefined | null, roomId: string): boolean {
  if (!roomId) return false;
  return (ensurePractice(state).tracks[EXPLORER_TRACK] || []).includes(roomId);
}

export function hasSurveyedEntity(state: PracticeState | undefined | null, entityId: string): boolean {
  if (!entityId) return false;
  return (ensurePractice(state).tracks[SURVEYOR_TRACK] || []).includes(entityId);
}

export function hasBrokeredWith(state: PracticeState | undefined | null, otherId: string): boolean {
  if (!otherId) return false;
  return (ensurePractice(state).counterparties?.[BROKER_TRACK] || []).includes(otherId);
}

export function lookAttentionCost(
  state: PracticeState | undefined | null,
  roomId: string,
  now: number,
): Partial<{ attention: number }> {
  if (trackMaintained(state, EXPLORER_TRACK, now) && hasVisitedRoom(state, roomId)) return {};
  return { attention: 1 };
}

export function inspectAttentionCost(
  state: PracticeState | undefined | null,
  entityId: string,
  now: number,
): Partial<{ attention: number }> {
  if (trackMaintained(state, SURVEYOR_TRACK, now) && hasSurveyedEntity(state, entityId)) return {};
  return { attention: 2 };
}

export function brokerWaivesCaution(
  state: PracticeState | undefined | null,
  otherId: string,
  now: number,
): boolean {
  return trackMaintained(state, BROKER_TRACK, now) && hasBrokeredWith(state, otherId);
}
