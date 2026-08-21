/** Privileged image scores. Never a WATCH public scalar (GC3-S0). */

import type { PlayerRuntime } from "./actions";
import type { ActionSignal } from "./signal";
import { mutationGroundingOk } from "./signal";

export function ensureImage(pl: PlayerRuntime): PlayerRuntime {
  if (typeof pl.image_score !== "number") pl.image_score = 0;
  if (!pl.conduct_toward) pl.conduct_toward = {};
  return pl;
}

export function bumpImage(pl: PlayerRuntime, delta: number): number {
  ensureImage(pl);
  pl.image_score = (pl.image_score || 0) + delta;
  return pl.image_score;
}

export function noteConduct(actor: PlayerRuntime, targetId: string, delta: number): void {
  ensureImage(actor);
  actor.conduct_toward = actor.conduct_toward || {};
  actor.conduct_toward[targetId] = (actor.conduct_toward[targetId] || 0) + delta;
}

/** Second-order: how this agent treated counterparties who themselves have positive image. */
export function secondOrderReputation(
  players: Record<string, PlayerRuntime>,
  playerId: string,
): number {
  const actor = players[playerId];
  if (!actor?.conduct_toward) return 0;
  let acc = 0;
  let n = 0;
  for (const [otherId, conduct] of Object.entries(actor.conduct_toward)) {
    if (otherId === playerId) continue;
    const other = players[otherId];
    if (!other || (other.image_score || 0) <= 0) continue;
    acc += conduct;
    n += 1;
  }
  return n ? acc / n : 0;
}

/** Write privileged second_order onto the player. Call from ATTEST/TRADE/ORG outcomes. */
export function refreshSecondOrder(
  players: Record<string, PlayerRuntime>,
  playerId: string,
): number {
  const pl = players[playerId];
  if (!pl) return 0;
  ensureImage(pl);
  pl.second_order = secondOrderReputation(players, playerId);
  return pl.second_order;
}

export type WorldImageSlice = {
  players: Record<string, PlayerRuntime>;
  co_evolution?: { harvest_pressure: Record<string, number>; regen_mod: Record<string, number> };
};

/** Punisher pays influence; target image drops; room harvest_pressure eases (collective). */
export function justifiedPunish(
  w: WorldImageSlice,
  punisherId: string,
  targetId: string,
  roomId: string,
): { ok: boolean; punisher_influence: number; target_image: number; harvest_pressure: number } {
  const punisher = w.players[punisherId];
  const target = w.players[targetId];
  if (!punisher || !target) {
    return { ok: false, punisher_influence: 0, target_image: 0, harvest_pressure: 0 };
  }
  ensureImage(punisher);
  ensureImage(target);
  const inf = punisher.budgets?.influence ?? 0;
  if (inf < 1) {
    return {
      ok: false,
      punisher_influence: inf,
      target_image: target.image_score || 0,
      harvest_pressure: w.co_evolution?.harvest_pressure?.[roomId] || 0,
    };
  }
  punisher.budgets.influence = inf - 1;
  bumpImage(target, -2);
  noteConduct(punisher, targetId, -1);
  refreshSecondOrder(w.players, punisherId);
  if (!w.co_evolution) w.co_evolution = { harvest_pressure: {}, regen_mod: {} };
  const prev = w.co_evolution.harvest_pressure[roomId] || 0;
  w.co_evolution.harvest_pressure[roomId] = Math.max(0, prev - 1);
  return {
    ok: true,
    punisher_influence: punisher.budgets.influence,
    target_image: target.image_score || 0,
    harvest_pressure: w.co_evolution.harvest_pressure[roomId],
  };
}

export function semanticAttach(w: {
  trades?: Record<string, { proposer_id: string; counterparty_id: string; status: string }>;
  organizations?: Record<string, unknown>;
  messages?: unknown[];
}): { signaling_quality: number; drift_alerts: string[]; cascading_risk: number } {
  const trades = Object.values(w.trades || {});
  const open = trades.filter((t) => t.status === "OPEN" || t.status === "ACCEPTED" || t.status === "FULFILLED");
  const edges = open.length + Object.keys(w.organizations || {}).length;
  const cascading_risk = Math.max(0, Math.min(1, edges / 8));
  const signaling_quality = 1;
  const drift_alerts: string[] = cascading_risk > 0.7 ? ["CASCADING_RISK"] : [];
  return { signaling_quality, drift_alerts, cascading_risk };
}

export function signalQuarantineMessage(signal: ActionSignal | undefined): string | null {
  if (mutationGroundingOk(signal)) return null;
  return "That claim is not grounded enough to change the world.";
}
