/**
 * WATCH local predictions (Noema-Specs specify/watch-single-3d-stage.md D6 item 9).
 *
 * Optional, off by default, and strictly spectator-side: guesses and scores stay
 * in the visitor's browser, are never sent over the network, never shown to
 * agents or other visitors, and never influence the world (RFC-0120 — humans
 * watch, agents play). No leaderboard, no server endpoint.
 *
 * Every leaf below is injected into the /watch IIFE with fn.toString(), so each
 * one must stay self-contained and free of inner functions: wrangler keepNames
 * would wrap those in __name, and watchHtml() rejects such a leak.
 */

export const PREDICT_KEY = "noema.watch.predict.v1";

export type PredictState = {
  on: boolean;
  hits: number;
  tries: number;
  guess: string;
  after: number;
};

/** Tolerant read of the localStorage text. Off by default, always a fresh object. */
export function parsePredictState(raw: string | null): PredictState {
  const out: PredictState = { on: false, hits: 0, tries: 0, guess: "", after: 0 };
  if (typeof raw !== "string" || raw === "") return out;
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return out;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return out;
  const d = data as { [key: string]: unknown };
  out.on = d.on === true;
  let hits = typeof d.hits === "number" ? d.hits : 0;
  if (!isFinite(hits)) hits = 0;
  hits = Math.floor(hits);
  if (hits < 0) hits = 0;
  if (hits > 1000000) hits = 1000000;
  out.hits = hits;
  let tries = typeof d.tries === "number" ? d.tries : 0;
  if (!isFinite(tries)) tries = 0;
  tries = Math.floor(tries);
  if (tries < 0) tries = 0;
  if (tries > 1000000) tries = 1000000;
  out.tries = tries;
  let after = typeof d.after === "number" ? d.after : 0;
  if (!isFinite(after)) after = 0;
  after = Math.floor(after);
  if (after < 0) after = 0;
  if (after > 9007199254740991) after = 9007199254740991;
  out.after = after;
  out.guess = typeof d.guess === "string" ? d.guess.slice(0, 80) : "";
  return out;
}

/**
 * Score the pending guess against the first public event after `state.after`.
 * Returns a new state object; the input is never mutated.
 */
export function resolvePrediction(
  state: PredictState,
  events: unknown[],
  publicRoomIds: string[],
): { state: PredictState; outcome: "" | "hit" | "miss"; site: string } {
  if (!state || state.on !== true || !state.guess) return { state: state, outcome: "", site: "" };
  const list = Array.isArray(events) ? events : [];
  const ids = Array.isArray(publicRoomIds) ? publicRoomIds : [];
  const after = typeof state.after === "number" && isFinite(state.after) ? state.after : 0;
  let best = -1;
  let site = "";
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    if (!raw || typeof raw !== "object") continue;
    const ev = raw as { sequence?: unknown; room_id?: unknown };
    const seq = ev.sequence;
    const room = ev.room_id;
    if (typeof seq !== "number" || !isFinite(seq)) continue;
    if (typeof room !== "string" || room === "") continue;
    if (seq <= after) continue;
    if (ids.indexOf(room) < 0) continue;
    if (best < 0 || seq < best) {
      best = seq;
      site = room;
    }
  }
  if (best < 0) return { state: state, outcome: "", site: "" };
  const hit = site === state.guess;
  let hits = typeof state.hits === "number" && isFinite(state.hits) ? state.hits : 0;
  let tries = typeof state.tries === "number" && isFinite(state.tries) ? state.tries : 0;
  if (hit) hits += 1;
  tries += 1;
  if (hits > 1000000) hits = 1000000;
  if (tries > 1000000) tries = 1000000;
  const next: PredictState = { on: true, hits: hits, tries: tries, guess: "", after: best };
  return { state: next, outcome: hit ? "hit" : "miss", site: site };
}

/** Record a guess for a public site. Off, or a non-public site, changes nothing. */
export function placeGuess(
  state: PredictState,
  roomId: string,
  latestSequence: number,
  publicRoomIds: string[],
): PredictState {
  if (!state || state.on !== true) return state;
  const id = typeof roomId === "string" ? roomId : "";
  const ids = Array.isArray(publicRoomIds) ? publicRoomIds : [];
  if (id === "" || ids.indexOf(id) < 0) return state;
  const after = typeof latestSequence === "number" && isFinite(latestSequence) ? Math.max(0, Math.floor(latestSequence)) : 0;
  return { on: true, hits: state.hits, tries: state.tries, guess: id, after: after };
}

/** Leaf source for the /watch IIFE. Fail if wrangler keepNames leaked. */
export function predictInlineSource(): string {
  const src =
    "const parsePredictState = " + parsePredictState.toString() + ";\n" +
    "const resolvePrediction = " + resolvePrediction.toString() + ";\n" +
    "const placeGuess = " + placeGuess.toString() + ";\n";
  if (src.indexOf("__name") >= 0) {
    throw new Error("watch predict helper leaked bundler keepNames");
  }
  return src;
}
