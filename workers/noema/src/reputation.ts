/** Privileged image scores. Never a WATCH public scalar (GC3-S0). */

import type { PlayerRuntime } from "./actions";
import type { ActionSignal } from "./signal";
import { MUTATION_GROUNDING, mutationGroundingOk } from "./signal";
import { formanCascadingRisk, type InteractionEdge } from "./curvature";
import { orgCreateExtraInfluence, type DeepTimeSlice } from "./deep-time";

export type SignalingStyle = "grounded-first" | "compact" | "verbose";

export type CoEvolutionState = {
  harvest_pressure: Record<string, number>;
  regen_mod: Record<string, number>;
  protocol_strength: Record<string, number>;
  protocol_tokens?: Record<string, string[]>;
  last_evo_cycle?: number;
  last_quarantine_cycle?: number;
  /** Deep Time persistence blob (persistDeepTime). Must survive rebuilds. */
  deep_time?: unknown;
  /** Genesis EWM seeds carried into live state (beliefs/styles await G3). */
  genesis_seeds?: { initial_beliefs?: Record<string, number>; signaling_styles?: Record<string, string> };
};

export function ensureCoevo(w: { co_evolution?: Partial<CoEvolutionState> | CoEvolutionState }): CoEvolutionState {
  const cur = w.co_evolution || {};
  const next: CoEvolutionState = {
    harvest_pressure: cur.harvest_pressure || {},
    regen_mod: cur.regen_mod || {},
    protocol_strength: cur.protocol_strength || {},
    protocol_tokens: cur.protocol_tokens || {},
    last_evo_cycle: cur.last_evo_cycle,
    last_quarantine_cycle: cur.last_quarantine_cycle,
    // Rebuilds must not drop persisted state: losing deep_time here wiped
    // scars/ratchets across DO reloads whenever a coevo touch followed a
    // deep-time persist in the same lifetime.
    deep_time: cur.deep_time,
    genesis_seeds: cur.genesis_seeds,
  };
  w.co_evolution = next;
  return next;
}

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
  co_evolution?: Partial<CoEvolutionState> | CoEvolutionState;
};

/** RFC-0123: costly punishment — punisher pays influence, target image drops.
 *  A social sanction MUST NOT mutate EWM extraction pressure (coupling struck). */
export function justifiedPunish(
  w: WorldImageSlice,
  punisherId: string,
  targetId: string,
  roomId: string,
): { ok: boolean; punisher_influence: number; target_image: number; harvest_pressure: number } {
  const punisher = w.players[punisherId];
  const target = w.players[targetId];
  const pressureNow = () => w.co_evolution?.harvest_pressure?.[roomId] || 0;
  if (!punisher || !target) {
    return { ok: false, punisher_influence: 0, target_image: 0, harvest_pressure: pressureNow() };
  }
  ensureImage(punisher);
  ensureImage(target);
  const inf = punisher.budgets?.influence ?? 0;
  if (inf < 1) {
    return {
      ok: false,
      punisher_influence: inf,
      target_image: target.image_score || 0,
      harvest_pressure: pressureNow(),
    };
  }
  punisher.budgets.influence = inf - 1;
  bumpImage(target, -2);
  noteConduct(punisher, targetId, -1);
  refreshSecondOrder(w.players, punisherId);
  return {
    ok: true,
    punisher_influence: punisher.budgets.influence,
    target_image: target.image_score || 0,
    harvest_pressure: pressureNow(),
  };
}

/** Grounded success only. Missing signal does not increment. Compact + high pressure → +2. */
export function noteGroundedProtocol(
  w: WorldImageSlice & {
    cycle?: number;
    genesis_evolutions?: Array<{
      cycle: number;
      kind: string;
      details: string;
      room_id?: string;
      lineage_id?: string;
      parent_kind?: string;
    }>;
  },
  roomId: string,
  signal: ActionSignal | undefined,
): number {
  if (!signal?.grounding || !MUTATION_GROUNDING.has(signal.grounding)) return 0;
  const co = ensureCoevo(w);
  const pressure = co.harvest_pressure[roomId] || 0;
  const compact = !signal.assumptions || signal.assumptions.length <= 1;
  const delta = compact && pressure > 4 ? 2 : 1;
  co.protocol_strength[roomId] = (co.protocol_strength[roomId] || 0) + delta;
  if (signal.assumptions?.length) {
    co.protocol_tokens = co.protocol_tokens || {};
    const prev = co.protocol_tokens[roomId] || [];
    co.protocol_tokens[roomId] = [...prev, ...signal.assumptions.map(String)].slice(-32);
  }
  if (delta >= 2) {
    w.genesis_evolutions = w.genesis_evolutions || [];
    const lineage_id = `lineage.protocol.${roomId}`;
    const prevKind =
      [...w.genesis_evolutions].reverse().find((e) => e.lineage_id === lineage_id)?.kind || "genesis";
    w.genesis_evolutions.push({
      cycle: w.cycle || 0,
      kind: "PROTOCOL_STRENGTH",
      details: `protocol_strength ${co.protocol_strength[roomId]} in ${roomId}`,
      room_id: roomId,
      lineage_id,
      parent_kind: prevKind,
    });
  }
  return co.protocol_strength[roomId];
}

export function markQuarantine(w: WorldImageSlice & { cycle?: number }): void {
  const co = ensureCoevo(w);
  co.last_quarantine_cycle = w.cycle || 0;
}

export function compositionality(co: CoEvolutionState | undefined, roomId: string): number {
  const toks = co?.protocol_tokens?.[roomId] || [];
  if (!toks.length) return 0;
  return Math.max(0, Math.min(1, new Set(toks).size / toks.length));
}

export type AttestSubject = { entity_id: string; condition?: number; scar?: boolean };

/** Ontological ATTEST gate. Returns FORBIDDEN copy or null. Missing subject is caller NOT_COLOCATED. */
export function attestOntologyError(
  roomEntities: AttestSubject[],
  subjectId: string,
  claim: "DESTROYED" | "OPERATING",
  assumptions?: string[],
): string | null {
  const subject = roomEntities.find((e) => e.entity_id === subjectId);
  if (!subject) return "NOT_COLOCATED";
  const cond = subject.condition ?? 100;
  if (claim === "DESTROYED" && cond >= 80 && !subject.scar) {
    return "That claim does not match what is here.";
  }
  if (claim === "OPERATING" && (subject.scar === true || subject.condition === 0)) {
    return "That claim does not match what is here.";
  }
  if (assumptions) {
    for (const a of assumptions) {
      if (String(a).startsWith("entity.") && !roomEntities.some((e) => e.entity_id === a)) {
        return "An assumption is not visible here.";
      }
    }
  }
  return null;
}

function liveEdges(w: {
  trades?: Record<string, { proposer_id: string; counterparty_id: string; status: string; grounding?: string }>;
  organizations?: Record<string, { members?: Array<{ agent_id: string }> }>;
  messages?: Array<{ sender_id?: string; recipient_id?: string; grounding?: string }>;
}): InteractionEdge[] {
  // SEMANTIC §3.4 weights cascading risk by *degrading grounding* as well as
  // curvature. Edges never carried grounding, so the low_g term was dead and
  // the metric degenerated to pure topology.
  const edges: InteractionEdge[] = [];
  for (const t of Object.values(w.trades || {})) {
    if (t.proposer_id && t.counterparty_id) {
      edges.push({ from: t.proposer_id, to: t.counterparty_id, ...(t.grounding ? { grounding: t.grounding } : {}) });
    }
  }
  for (const m of w.messages || []) {
    if (m.sender_id && m.recipient_id) {
      edges.push({ from: m.sender_id, to: m.recipient_id, ...(m.grounding ? { grounding: m.grounding } : {}) });
    }
  }
  for (const org of Object.values(w.organizations || {})) {
    const ids = (org.members || []).map((x) => x.agent_id).filter(Boolean);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) edges.push({ from: ids[i], to: ids[j] });
    }
  }
  return edges;
}

export function semanticAttach(
  w: {
    players?: Record<string, PlayerRuntime>;
    trades?: Record<string, { proposer_id: string; counterparty_id: string; status: string }>;
    organizations?: Record<string, { members?: Array<{ agent_id: string }> }>;
    messages?: Array<{ sender_id?: string; recipient_id?: string }>;
    co_evolution?: Partial<CoEvolutionState> | CoEvolutionState;
    genesis_evolutions?: Array<{ kind: string }>;
    cycle?: number;
  },
  lookingId?: string,
  roomId?: string,
): {
  signaling_quality: number;
  drift_alerts: string[];
  cascading_risk: number;
  protocol_strength?: number;
  compositionality?: number;
  reputation_summary?: { self_image: number; self_second_order: number };
  active_norms?: { org_create_influence: number; harvest_pressure: number; last_ratchet?: string };
} {
  const co = w.co_evolution;
  const rid = roomId || "";
  const cascading_risk = formanCascadingRisk(liveEdges(w));
  const toks = co?.protocol_tokens?.[rid] || [];
  const signaling_quality = toks.length ? compositionality(co as CoEvolutionState, rid) : 1;
  const drift_alerts: string[] = cascading_risk > 0.7 ? ["CASCADING_RISK"] : [];
  const pl = lookingId ? w.players?.[lookingId] : undefined;
  return {
    signaling_quality,
    drift_alerts,
    cascading_risk,
    protocol_strength: co?.protocol_strength?.[rid] || 0,
    compositionality: compositionality(co as CoEvolutionState | undefined, rid),
    reputation_summary: pl
      ? { self_image: pl.image_score || 0, self_second_order: pl.second_order || 0 }
      : undefined,
    active_norms: {
      // The live cost, ratchet included — must match the ORG_CREATE debit in
      // world-actions (COSTS.ORG_CREATE.influence + orgCreateExtraInfluence).
      // A hardcoded 5 misreported the economy once any org existed.
      org_create_influence: 5 + orgCreateExtraInfluence(w as unknown as DeepTimeSlice),
      harvest_pressure: co?.harvest_pressure?.[rid] || 0,
      last_ratchet: (w.genesis_evolutions || []).slice(-1)[0]?.kind,
    },
  };
}

export function signalQuarantineMessage(signal: ActionSignal | undefined): string | null {
  if (mutationGroundingOk(signal)) return null;
  return "That claim is not grounded enough to change the world.";
}
