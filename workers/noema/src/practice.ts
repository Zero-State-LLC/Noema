/**
 * GC1-S0 derived practice. Rebuildable cache, not WorldState.
 * Authority: Noema-Specs docs/GC1-FIRST-SLICE.md / RFC-0004.
 */

export const MASTERY_CATALOG_ID = "mastery-catalog/gc1-s0";
export const MAX_PLAY_LINES = 3;

export const PRACTICE_TRACKS = [
  {
    track_id: "track.explorer.01",
    display_order: 1,
    play_line: "You have been learning the rooms.",
  },
  {
    track_id: "track.surveyor.01",
    display_order: 2,
    play_line: "You have been doing survey work.",
  },
  {
    track_id: "track.broker.01",
    display_order: 3,
    play_line: "You have been closing exchanges.",
  },
  {
    track_id: "track.engineer.01",
    display_order: 4,
    play_line: "You have been keeping infrastructure alive.",
  },
] as const;

export type PracticeTrackId = (typeof PRACTICE_TRACKS)[number]["track_id"];

export type PracticeState = {
  catalog_id: typeof MASTERY_CATALOG_ID;
  tracks: Partial<Record<PracticeTrackId, string[]>>;
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
  return { catalog_id: MASTERY_CATALOG_ID, tracks: {} };
}

function ensurePractice(raw: PracticeState | undefined | null): PracticeState {
  if (!raw || raw.catalog_id !== MASTERY_CATALOG_ID) return emptyPractice();
  return { catalog_id: MASTERY_CATALOG_ID, tracks: { ...(raw.tracks || {}) } };
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
): PracticeState {
  if (!unit) return state;
  const next = ensurePractice(state);
  const units = [...(next.tracks[trackId] || [])];
  if (units.includes(unit)) return next;
  units.push(unit);
  next.tracks[trackId] = units;
  return next;
}

/** Catalog-shaped and hosted-shaped events. */
export function creditsFromEvent(
  ev: PracticeEvent,
  opts: {
    actingPlayerId?: string;
    trades?: Record<string, PracticeTrade>;
  } = {},
): Array<{ player_id: string; track_id: PracticeTrackId; unit: string }> {
  const payload = ev.payload || {};
  const out: Array<{ player_id: string; track_id: PracticeTrackId; unit: string }> = [];
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
      out.push({ player_id: actor, track_id: "track.engineer.01", unit: ev.event_id });
    }
  }
  return out;
}

export type PracticeCredit = { track_id: PracticeTrackId; unit: string };

export function applyPracticeCredits(
  state: PracticeState | undefined,
  credits: PracticeCredit[],
): PracticeState {
  let next = ensurePractice(state);
  for (const c of credits) next = credit(next, c.track_id, c.unit);
  return next;
}

export function practiceLines(state: PracticeState | undefined | null): string[] {
  const tracks = ensurePractice(state).tracks;
  const lines: string[] = [];
  for (const track of [...PRACTICE_TRACKS].sort((a, b) => a.display_order - b.display_order)) {
    if ((tracks[track.track_id] || []).length > 0) lines.push(track.play_line);
    if (lines.length >= MAX_PLAY_LINES) break;
  }
  return lines;
}
