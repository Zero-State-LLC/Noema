/**
 * GC1-S7 focus declaration. Player snapshot, not WorldState.
 * Authority: GC1-S7-FOCUS / RFC-0110. No FOCUS_DECLARED event.
 */

import { isTrackLatent, titleHandle, type PracticeState, type PracticeTrackId } from "./practice";

export const FOCUS_TRACKS = [
  { id: "explorer" as const, track_id: "track.explorer.01" as PracticeTrackId, self: "You are focusing on the rooms.", pub: "{handle} is focusing on the rooms." },
  { id: "surveyor" as const, track_id: "track.surveyor.01" as PracticeTrackId, self: "You are focusing on survey work.", pub: "{handle} is focusing on survey work." },
  { id: "broker" as const, track_id: "track.broker.01" as PracticeTrackId, self: "You are focusing on exchanges.", pub: "{handle} is focusing on exchanges." },
  { id: "engineer" as const, track_id: "track.engineer.01" as PracticeTrackId, self: "You are focusing on infrastructure.", pub: "{handle} is focusing on infrastructure." },
];

/** RFC-0138: extended focus tracks accepted by FOCUS without altering GC1-S7 default affordance menus. */
export const EXTENDED_FOCUS_TRACKS = [
  { id: "archivist" as const, track_id: "track.archivist.01" as PracticeTrackId, self: "You are focusing on the archive.", pub: "{handle} is focusing on the archive." },
  { id: "herald" as const, track_id: "track.herald.01" as PracticeTrackId, self: "You are focusing on public news.", pub: "{handle} is focusing on public news." },
];

const ALL_FOCUS_TRACKS = [...FOCUS_TRACKS, ...EXTENDED_FOCUS_TRACKS];

export type FocusId = (typeof ALL_FOCUS_TRACKS)[number]["id"];

export type FocusState = { track: FocusId; declared_cycle: number };

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

export function publicFocusLine(
  handle: string | undefined | null,
  focus: FocusState | undefined | null,
  practice: PracticeState | undefined | null,
  now: number,
  playerId?: string | null,
): string | undefined {
  if (!focus) return undefined;
  const spec = ALL_FOCUS_TRACKS.find((x) => x.id === focus.track);
  if (!spec) return undefined;
  if (isTrackLatent(practice, spec.track_id, now)) return undefined;
  const name = titleHandle(handle, playerId);
  if (!name) return undefined;
  return spec.pub.replace("{handle}", name);
}
