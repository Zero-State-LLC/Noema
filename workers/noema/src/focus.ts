/**
 * GC1-S7 focus declaration + RFC-0144 multi-focus (ACTIVE_FOCUS_CAP = 2)
 * and 18-cycle focused latency extension.
 * Authority: GC1-S7-FOCUS / RFC-0110 / RFC-0144. No FOCUS_DECLARED event.
 */

import { isTrackLatent, titleHandle, type PracticeState, type PracticeTrackId } from "./practice";

export const ACTIVE_FOCUS_CAP = 2;
export const FOCUSED_LATENT_AFTER_CYCLES = 18;

/** Exact 4 GC1-S7 default tracks advertised on default affordance menus. */
export const FOCUS_TRACKS = [
  { id: "explorer" as const, track_id: "track.explorer.01" as PracticeTrackId, self: "You are focusing on the rooms.", pub: "{handle} is focusing on the rooms." },
  { id: "surveyor" as const, track_id: "track.surveyor.01" as PracticeTrackId, self: "You are focusing on survey work.", pub: "{handle} is focusing on survey work." },
  { id: "broker" as const, track_id: "track.broker.01" as PracticeTrackId, self: "You are focusing on exchanges.", pub: "{handle} is focusing on exchanges." },
  { id: "engineer" as const, track_id: "track.engineer.01" as PracticeTrackId, self: "You are focusing on infrastructure.", pub: "{handle} is focusing on infrastructure." },
];

/** RFC-0138 & RFC-0144: extended focus tracks accepted by FOCUS without altering GC1-S7 default affordance menus. */
export const EXTENDED_FOCUS_TRACKS = [
  { id: "archivist" as const, track_id: "track.archivist.01" as PracticeTrackId, self: "You are focusing on the archive.", pub: "{handle} is focusing on the archive." },
  { id: "herald" as const, track_id: "track.herald.01" as PracticeTrackId, self: "You are focusing on public news.", pub: "{handle} is focusing on public news." },
  { id: "artificer" as const, track_id: "track.artificer.01" as PracticeTrackId, self: "You are focusing on shaping tools.", pub: "{handle} is focusing on shaping tools." },
];

const ALL_FOCUS_TRACKS = [...FOCUS_TRACKS, ...EXTENDED_FOCUS_TRACKS];

export type FocusId = (typeof ALL_FOCUS_TRACKS)[number]["id"];

export type FocusEntry = { track: FocusId; declared_cycle: number };

/**
 * Backward-compatible focus snapshot: single `track`/`declared_cycle` stays
 * populated with the newest focus while `tracks` holds up to ACTIVE_FOCUS_CAP (2) entries.
 */
export type FocusState = {
  track: FocusId;
  declared_cycle: number;
  tracks?: FocusEntry[];
};

export function activeFocusEntries(focus: FocusState | undefined | null): FocusEntry[] {
  if (!focus) return [];
  if (Array.isArray(focus.tracks) && focus.tracks.length > 0) {
    return focus.tracks.slice(-ACTIVE_FOCUS_CAP);
  }
  return [{ track: focus.track, declared_cycle: focus.declared_cycle }];
}

export function activeFocusTrackIds(focus: FocusState | undefined | null): PracticeTrackId[] {
  const out: PracticeTrackId[] = [];
  for (const entry of activeFocusEntries(focus)) {
    const spec = ALL_FOCUS_TRACKS.find((x) => x.id === entry.track);
    if (spec && !out.includes(spec.track_id)) out.push(spec.track_id);
  }
  return out;
}

export function declareFocusTrack(
  current: FocusState | undefined | null,
  track: FocusId,
  cycle: number,
): FocusState {
  const existing = activeFocusEntries(current).filter((e) => e.track !== track);
  const next = [...existing, { track, declared_cycle: cycle }].slice(-ACTIVE_FOCUS_CAP);
  const newest = next[next.length - 1];
  if (next.length <= 1) {
    return {
      track: newest.track,
      declared_cycle: newest.declared_cycle,
    };
  }
  return {
    track: newest.track,
    declared_cycle: newest.declared_cycle,
    tracks: next,
  };
}

export function parseFocusTrack(raw: string): FocusId | "clear" | null {
  const t = String(raw || "").trim().toLowerCase();
  if (!t || t === "clear" || t === "none" || t === "off") return "clear";
  if (ALL_FOCUS_TRACKS.some((x) => x.id === t)) return t as FocusId;
  return null;
}

export function focusSelfLine(focus: FocusState | undefined | null): string | undefined {
  if (!focus) return undefined;
  return ALL_FOCUS_TRACKS.find((x) => x.id === focus.track)?.self;
}

export function focusSelfLines(focus: FocusState | undefined | null): string[] {
  return activeFocusEntries(focus)
    .map((entry) => ALL_FOCUS_TRACKS.find((x) => x.id === entry.track)?.self)
    .filter((line): line is string => Boolean(line));
}

export function publicFocusLine(
  handle: string | undefined | null,
  focus: FocusState | undefined | null,
  practice: PracticeState | undefined | null,
  now: number,
  playerId?: string | null,
): string | undefined {
  if (!focus) return undefined;
  const focusedIds = activeFocusTrackIds(focus);
  const spec = ALL_FOCUS_TRACKS.find((x) => x.id === focus.track);
  if (!spec) return undefined;
  if (isTrackLatent(practice, spec.track_id, now, focusedIds)) return undefined;
  const name = titleHandle(handle, playerId);
  if (!name) return undefined;
  return spec.pub.replace("{handle}", name);
}
