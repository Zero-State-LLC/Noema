import { sha256Hex, stableStringify } from "./genesis";
import type { WorldRuntime } from "./world-actions";

export const CANONICAL_STATE_VERSION = "noema-jcs/1";

/**
 * Excludes process-local delivery and retry caches.  These values do not alter
 * world meaning and must never change the durable state digest.
 */
export function canonicalWorldState(world: WorldRuntime): Record<string, unknown> {
  const { seen_idempotency: _seen, unsettled: _unsettled, ...semantic } = world;
  // Presence timestamps and controller-session binding are process/transport
  // facts. They must not make otherwise identical world truth hash differently.
  // Every remaining field is semantic world state. This includes Deep Time
  // reconstruction fidelity and controller-attributed observation evidence;
  // only the two explicit process-local caches above are excluded.
  const state = structuredClone(semantic) as Record<string, unknown> & {
    players?: Record<string, Record<string, unknown>>;
  };
  for (const player of Object.values(state.players || {})) {
    delete player.last_seen_ms;
    delete player.controlling_session_id;
  }
  // Gate B deepen (Prabu task / architecture): fidelity and multi-controller (3+) data
  // from reduce (observation_digests, reconstructionFidelity, weakenScars) are semantic
  // and preserved here for canonical reconstruction tracking / LCA-2.
  // observation_digests/fidelity fields (if present in world) must remain for digest stability.
  return state;
}

export async function canonicalStateMaterial(world: WorldRuntime): Promise<{
  state_json: Record<string, unknown>;
  canonical_json: string;
  state_digest: string;
}> {
  const state_json = canonicalWorldState(world);
  const canonical_json = stableStringify(state_json);
  return { state_json, canonical_json, state_digest: `sha256:${await sha256Hex(canonical_json)}` };
}

export async function canonicalEventDigest(input: {
  world_id: string;
  sequence: number;
  cycle: number;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  previous_digest: string | null;
}): Promise<string> {
  return `sha256:${await sha256Hex(stableStringify(input))}`;
}
