/**
 * Deep Time mechanics (Specs DEEP-TIME-MECHANICS-UPDATE v0.1).
 * Scars are compressed trajectory modifiers derived from the ledger, not a second history.
 * Canonical events are never rewritten.
 */

import { deterministicId } from "./ids";

export type ScarDomain = "economic" | "social" | "territorial";
export type ScarVisibility = "public" | "institutional" | "hidden";

export type ScarRecord = {
  scar_id: string;
  domain: ScarDomain;
  strength: number;
  decay_rate: number;
  room_id?: string;
  entity_id?: string;
  cycle_born: number;
  harvest_count?: number;
  visibility: ScarVisibility;
  reconstruction_confidence: number;
  fossilized?: boolean;
};

export type EvidenceFragment = {
  fragment_id: string;
  subject_ref: string;
  kind: "ATTEST" | "HARVEST" | "TRADE";
  cycle: number;
  player_id: string;
  grounding?: string;
  claim?: string;
};

export type TrajectoryDigest = {
  room_id: string;
  harvest_count: number;
  last_cycle: number;
};

export type NormRatchet = {
  key: string;
  reversal_cost: number;
  path_dependence_strength: number;
  established_cycle: number;
  hits: number;
  /** RFC-0123: last reinforcement cycle; drives quiet-decay. */
  last_hit_cycle?: number;
};

/** RFC-0123 bounds: surcharge never exceeds the base cost; quiet norms relax. */
export const ORG_RATCHET_CAP = 5;
export const ORG_RATCHET_QUIET_CYCLES = 10;

export type LoreAttractor = {
  attractor_id: string;
  label: string;
  weight: number;
  room_id?: string;
  basin: "forming" | "crystallized";
};

export type InheritedHistory = {
  scar_vector: ScarRecord[];
  trajectory_digest: TrajectoryDigest[];
  lore_seeds: string[];
};

export type DeepTimeBlob = {
  scars: ScarRecord[];
  evidence_fragments: EvidenceFragment[];
  trajectory_digest: Record<string, TrajectoryDigest>;
  norm_ratchets: Record<string, NormRatchet>;
  lore_attractors: LoreAttractor[];
};

export type DeepTimeSlice = {
  scars?: ScarRecord[];
  evidence_fragments?: EvidenceFragment[];
  trajectory_digest?: Record<string, TrajectoryDigest>;
  norm_ratchets?: Record<string, NormRatchet>;
  lore_attractors?: LoreAttractor[];
  co_evolution?: {
    harvest_pressure?: Record<string, number>;
    regen_mod?: Record<string, number>;
    deep_time?: DeepTimeBlob;
    [key: string]: unknown;
  };
  rooms?: Record<string, { entities?: Array<{ entity_id: string; regen_rate?: number; stock_resource?: string }> }>;
  cycle?: number;
  players?: Record<string, { inherited?: InheritedHistory | undefined }>;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function ensureDeepTime(w: DeepTimeSlice): void {
  const blob = w.co_evolution?.deep_time;
  if ((!w.scars || !w.scars.length) && blob?.scars?.length) w.scars = blob.scars;
  if ((!w.evidence_fragments || !w.evidence_fragments.length) && blob?.evidence_fragments?.length) {
    w.evidence_fragments = blob.evidence_fragments;
  }
  if ((!w.trajectory_digest || !Object.keys(w.trajectory_digest).length) && blob?.trajectory_digest) {
    w.trajectory_digest = blob.trajectory_digest;
  }
  if ((!w.norm_ratchets || !Object.keys(w.norm_ratchets).length) && blob?.norm_ratchets) {
    w.norm_ratchets = blob.norm_ratchets;
  }
  if ((!w.lore_attractors || !w.lore_attractors.length) && blob?.lore_attractors?.length) {
    w.lore_attractors = blob.lore_attractors;
  }
  if (!w.scars) w.scars = [];
  if (!w.evidence_fragments) w.evidence_fragments = [];
  if (!w.trajectory_digest) w.trajectory_digest = {};
  if (!w.norm_ratchets) w.norm_ratchets = {};
  if (!w.lore_attractors) w.lore_attractors = [];
  persistDeepTime(w);
}

/** Ride co_evolution so Deep Time survives the same settlement path as harvest_pressure. */
export function persistDeepTime(w: DeepTimeSlice): void {
  if (!w.co_evolution) w.co_evolution = { harvest_pressure: {}, regen_mod: {} };
  w.co_evolution.deep_time = {
    scars: w.scars || [],
    evidence_fragments: w.evidence_fragments || [],
    trajectory_digest: w.trajectory_digest || {},
    norm_ratchets: w.norm_ratchets || {},
    lore_attractors: w.lore_attractors || [],
  };
}

export function noteHarvestTrajectory(w: DeepTimeSlice, roomId: string, entityId: string, cycle: number): TrajectoryDigest {
  ensureDeepTime(w);
  const prev = w.trajectory_digest![roomId] || { room_id: roomId, harvest_count: 0, last_cycle: cycle };
  const next = { room_id: roomId, harvest_count: prev.harvest_count + 1, last_cycle: cycle };
  w.trajectory_digest![roomId] = next;
  if (next.harvest_count >= 3) {
    const existing = (w.scars || []).find((s) => s.domain === "economic" && s.room_id === roomId && !s.fossilized);
    const strength = clamp01(next.harvest_count / 8);
    if (!existing) {
      w.scars!.push({
        scar_id: `scar.econ.${roomId}.${cycle}`,
        domain: "economic",
        strength,
        decay_rate: 0.08,
        room_id: roomId,
        entity_id: entityId,
        cycle_born: cycle,
        harvest_count: next.harvest_count,
        visibility: "public",
        reconstruction_confidence: 0.4,
      });
    } else {
      existing.strength = clamp01(Math.max(existing.strength, strength));
      existing.harvest_count = next.harvest_count;
    }
    applyScarToRegen(w, roomId);
  }
  persistDeepTime(w);
  return next;
}

function applyScarToRegen(w: DeepTimeSlice, roomId: string): void {
  const scar = (w.scars || []).find((s) => s.domain === "economic" && s.room_id === roomId);
  if (!scar) return;
  const room = w.rooms?.[roomId];
  if (!room) return;
  for (const e of room.entities || []) {
    if (e.stock_resource) {
      const base = typeof e.regen_rate === "number" && e.regen_rate > 0 ? e.regen_rate : 1;
      e.regen_rate = Math.max(0.05, base * (1 - scar.strength * 0.15));
    }
  }
}

export function pushEvidenceFragment(
  w: DeepTimeSlice,
  frag: Omit<EvidenceFragment, "fragment_id">,
): EvidenceFragment {
  ensureDeepTime(w);
  const full: EvidenceFragment = {
    // ADR-008: fragment ids persist in co_evolution.deep_time, so a replay of
    // identical inputs must reproduce them exactly.
    fragment_id: deterministicId(`ev.${frag.cycle}`, frag.subject_ref, frag.kind, frag.player_id, frag.cycle, frag.grounding, frag.claim),
    ...frag,
  };
  w.evidence_fragments = [...(w.evidence_fragments || []), full].slice(-64);
  persistDeepTime(w);
  return full;
}

/** Slow phase: decay scars; fossilize long-lived ones. Call on cycle % 5 === 0. */
export function deepTimeCoEvolve(w: DeepTimeSlice): void {
  ensureDeepTime(w);
  const cycle = w.cycle || 0;
  for (const s of w.scars || []) {
    if (s.fossilized) continue;
    s.strength = clamp01(s.strength * (1 - s.decay_rate));
    if (cycle - s.cycle_born >= 40 && s.strength > 0.3) s.fossilized = true;
  }
  w.scars = (w.scars || []).filter((s) => s.fossilized || s.strength >= 0.05);
  for (const s of w.scars) {
    if (s.domain === "economic" && s.room_id) applyScarToRegen(w, s.room_id);
  }
  // RFC-0123: quiet norms relax — one step per slow pass after ≥10 cycles
  // without reinforcement. Floor 0; established_cycle and hits preserved.
  const org = w.norm_ratchets?.org_create;
  if (org && org.reversal_cost > 0 && cycle - (org.last_hit_cycle ?? org.established_cycle) >= ORG_RATCHET_QUIET_CYCLES) {
    org.reversal_cost -= 1;
  }
  tickLoreAttractors(w);
  persistDeepTime(w);
}

export function reconstructionFidelity(
  claim: string,
  fragments: EvidenceFragment[],
  subject: string,
  controllerCount: number = 1,  // Gate B: multi-controller (3+) support for fidelity boost
): number {
  const about = fragments.filter((f) => f.subject_ref === subject);
  if (!about.length) return 0.2;
  const grounded = about.filter((f) => f.grounding === "observed" || f.grounding === "genesis" || f.grounding === "inferred-from-stock");
  const text = claim.toLowerCase();
  const mentionsScar = /scar|over-harvest|deplet|worn|ruin/.test(text);
  const mentionsSubject = text.includes(subject.replace(/^entity\./, "").slice(0, 8).toLowerCase()) || text.length > 8;
  const base = 0.25 + 0.4 * (grounded.length / Math.max(1, about.length)) + (mentionsScar ? 0.2 : 0) + (mentionsSubject ? 0.15 : 0);
  // Gate B deepen (Prabu task + Python reduce fidelity seam): reward independent multi-controller observations
  const multiBoost = Math.min(0.25, (controllerCount - 1) * 0.08);
  return clamp01(base + multiBoost);
}

export function weakenScarsForReconstruction(
  w: DeepTimeSlice,
  subject: string,
  fidelity: number,
  controllerCount: number = 1,  // Gate B: multi-controller (3+) strengthens weakening + confidence
): number {
  if (fidelity < 0.5) return 0;
  let n = 0;
  // Gate B deepen (graft-driven from weakenScars + reconstructionFidelity): scale effect by controllers
  const weakenDelta = 0.2 * Math.min(2, controllerCount);
  const confBoost = fidelity * (1 + Math.min(0.5, (controllerCount - 1) * 0.15));
  for (const s of w.scars || []) {
    if (s.fossilized) continue;
    if (s.entity_id === subject || s.room_id && subject.startsWith("entity.")) {
      s.strength = clamp01(s.strength - weakenDelta);
      s.reconstruction_confidence = clamp01(Math.max(s.reconstruction_confidence, confBoost));
      n += 1;
    }
  }
  persistDeepTime(w);
  return n;
}

export function publicScarsForRoom(scars: ScarRecord[] | undefined, roomId: string): ScarRecord[] {
  return (scars || []).filter((s) => s.room_id === roomId && s.visibility === "public" && s.strength >= 0.05);
}

export function pathDependenceIndex(
  scars: ScarRecord[] | undefined,
  ratchets?: Record<string, NormRatchet>,
): number {
  const list = scars || [];
  const rvals = Object.values(ratchets || {});
  const scarMean = list.length ? list.reduce((a, s) => a + s.strength, 0) / list.length : 0;
  const ratchetMean = rvals.length
    ? rvals.reduce((a, r) => a + r.path_dependence_strength, 0) / rvals.length
    : 0;
  if (!list.length && !rvals.length) return 0;
  return clamp01(Math.max(scarMean, ratchetMean));
}

export function orgCreateExtraInfluence(w: DeepTimeSlice): number {
  ensureDeepTime(w);
  return w.norm_ratchets!.org_create?.reversal_cost || 0;
}

export function ratchetOnOrgCreate(w: DeepTimeSlice, cycle: number): NormRatchet {
  ensureDeepTime(w);
  const prev = w.norm_ratchets!.org_create;
  const hits = (prev?.hits || 0) + 1;
  const next: NormRatchet = {
    key: "org_create",
    // RFC-0123: bounded — total ORG_CREATE cost never exceeds double the base.
    reversal_cost: Math.min(ORG_RATCHET_CAP, (prev?.reversal_cost || 0) + 1),
    path_dependence_strength: clamp01(hits / 5),
    established_cycle: prev?.established_cycle ?? cycle,
    hits,
    last_hit_cycle: cycle,
  };
  w.norm_ratchets!.org_create = next;
  persistDeepTime(w);
  return next;
}

export function ratchetOnAttest(w: DeepTimeSlice, cycle: number): NormRatchet {
  ensureDeepTime(w);
  const prev = w.norm_ratchets!.attest;
  const hits = (prev?.hits || 0) + 1;
  const next: NormRatchet = {
    key: "attest",
    // ATTEST establishes path dependence but carries no reversal surcharge
    // (RFC-0123 bounds org_create only). Kept at 0 by contract, not by accident.
    reversal_cost: 0,
    path_dependence_strength: clamp01(hits / 8),
    established_cycle: prev?.established_cycle ?? cycle,
    hits,
  };
  w.norm_ratchets!.attest = next;
  persistDeepTime(w);
  return next;
}

export function inheritAtSuccession(
  w: DeepTimeSlice,
  successorId: string,
  roomId?: string,
): InheritedHistory {
  ensureDeepTime(w);
  const scar_vector = (w.scars || [])
    .filter((s) => !roomId || s.room_id === roomId)
    .map((s) => ({ ...s }));
  const trajectory_digest = Object.values(w.trajectory_digest || {}).map((d) => ({ ...d }));
  const lore_seeds = (w.lore_attractors || []).map((a) => a.label);
  const inherited: InheritedHistory = { scar_vector, trajectory_digest, lore_seeds };
  if (w.players?.[successorId]) w.players[successorId].inherited = inherited;
  return inherited;
}

/**
 * Successor-facing projection of inherited history (DEEP-TIME §3.4).
 * Bounded, id-free, and visibility-respecting: only public scars are counted
 * and only lore labels are named. Without this the inheritance was written to
 * player state and never observable by the Player who inherited it.
 */
export function inheritedLines(inherited: InheritedHistory | undefined): string[] {
  if (!inherited) return [];
  const out: string[] = [];
  const publicScars = (inherited.scar_vector || []).filter(
    (s) => s.visibility === "public" && s.strength >= 0.05,
  );
  if (publicScars.length) {
    out.push(
      publicScars.length === 1
        ? "You inherit a record of one marked site."
        : `You inherit a record of ${publicScars.length} marked sites.`,
    );
  }
  const seeds = [...new Set((inherited.lore_seeds || []).map((l) => String(l || "").trim()).filter(Boolean))];
  if (seeds.length) out.push(`Inherited accounts name: ${seeds.slice(0, 3).join(", ")}.`);
  const digests = (inherited.trajectory_digest || []).filter((d) => (d?.harvest_count || 0) > 0);
  if (digests.length) {
    out.push("The record of earlier working of these sites came with the office.");
  }
  return out.slice(0, 3);
}

export function tickLoreAttractors(w: DeepTimeSlice): void {
  ensureDeepTime(w);
  const roomsWithScars = new Set((w.scars || []).filter((s) => s.strength >= 0.05).map((s) => s.room_id).filter(Boolean) as string[]);
  for (const roomId of roomsWithScars) {
    let attr = (w.lore_attractors || []).find((a) => a.room_id === roomId);
    if (!attr) {
      attr = {
        attractor_id: `lore.${roomId}`,
        label: "scarred ground",
        weight: 0.2,
        room_id: roomId,
        basin: "forming",
      };
      w.lore_attractors!.push(attr);
    } else {
      attr.weight = clamp01(attr.weight + 0.15);
    }
    if (attr.weight >= 0.8) attr.basin = "crystallized";
  }
}

export function scarPersistence(scars: ScarRecord[] | undefined, cycle: number): number {
  const list = scars || [];
  if (!list.length) return 0;
  const ages = list.map((s) => Math.max(0, cycle - s.cycle_born));
  return ages.reduce((a, b) => a + b, 0) / list.length;
}
