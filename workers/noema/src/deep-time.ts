/**
 * Deep Time mechanics (Specs DEEP-TIME-MECHANICS-UPDATE v0.1).
 * Scars are compressed trajectory modifiers derived from the ledger, not a second history.
 * Canonical events are never rewritten.
 */

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
};

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

export type DeepTimeSlice = {
  scars?: ScarRecord[];
  evidence_fragments?: EvidenceFragment[];
  trajectory_digest?: Record<string, TrajectoryDigest>;
  norm_ratchets?: Record<string, NormRatchet>;
  lore_attractors?: LoreAttractor[];
  rooms?: Record<string, { entities?: Array<{ entity_id: string; regen_rate?: number; stock_resource?: string }> }>;
  cycle?: number;
  players?: Record<string, { inherited?: InheritedHistory | undefined }>;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function ensureDeepTime(w: DeepTimeSlice): void {
  if (!w.scars) w.scars = [];
  if (!w.evidence_fragments) w.evidence_fragments = [];
  if (!w.trajectory_digest) w.trajectory_digest = {};
  if (!w.norm_ratchets) w.norm_ratchets = {};
  if (!w.lore_attractors) w.lore_attractors = [];
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
    fragment_id: `ev.${frag.cycle}.${Math.random().toString(16).slice(2, 8)}`,
    ...frag,
  };
  w.evidence_fragments = [...(w.evidence_fragments || []), full].slice(-64);
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
  tickLoreAttractors(w);
}

export function reconstructionFidelity(
  claim: string,
  fragments: EvidenceFragment[],
  subject: string,
): number {
  const about = fragments.filter((f) => f.subject_ref === subject);
  if (!about.length) return 0.2;
  const grounded = about.filter((f) => f.grounding === "observed" || f.grounding === "genesis" || f.grounding === "inferred-from-stock");
  const text = claim.toLowerCase();
  const mentionsScar = /scar|over-harvest|deplet|worn|ruin/.test(text);
  const mentionsSubject = text.includes(subject.replace(/^entity\./, "").slice(0, 8).toLowerCase()) || text.length > 8;
  const base = 0.25 + 0.4 * (grounded.length / Math.max(1, about.length)) + (mentionsScar ? 0.2 : 0) + (mentionsSubject ? 0.15 : 0);
  return clamp01(base);
}

export function weakenScarsForReconstruction(
  w: DeepTimeSlice,
  subject: string,
  fidelity: number,
): number {
  if (fidelity < 0.5) return 0;
  let n = 0;
  for (const s of w.scars || []) {
    if (s.fossilized) continue;
    if (s.entity_id === subject || s.room_id && subject.startsWith("entity.")) {
      s.strength = clamp01(s.strength - 0.2);
      s.reconstruction_confidence = clamp01(Math.max(s.reconstruction_confidence, fidelity));
      n += 1;
    }
  }
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
    reversal_cost: (prev?.reversal_cost || 0) + 1,
    path_dependence_strength: clamp01(hits / 5),
    established_cycle: prev?.established_cycle ?? cycle,
    hits,
  };
  w.norm_ratchets!.org_create = next;
  return next;
}

export function ratchetOnAttest(w: DeepTimeSlice, cycle: number): NormRatchet {
  ensureDeepTime(w);
  const prev = w.norm_ratchets!.attest;
  const hits = (prev?.hits || 0) + 1;
  const next: NormRatchet = {
    key: "attest",
    reversal_cost: prev?.reversal_cost || 0,
    path_dependence_strength: clamp01(hits / 8),
    established_cycle: prev?.established_cycle ?? cycle,
    hits,
  };
  w.norm_ratchets!.attest = next;
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
