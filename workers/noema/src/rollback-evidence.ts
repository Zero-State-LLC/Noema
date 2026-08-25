import { canonicalStateMaterial, CANONICAL_STATE_VERSION } from "./canonical-state";
import { sha256Hex, stableStringify } from "./genesis";
import type { WorldRuntime } from "./world-actions";

export interface RollbackEvidence {
  pin: "rollback-rehearsal-evidence/1";
  canonicalization_version: typeof CANONICAL_STATE_VERSION;
  state_digest: string;
  history_digest: string;
  history_count: number;
  history_head_event_id: string | null;
  history_head_sequence: number | null;
  idempotency_count: number;
}

/**
 * Read-only, non-secret evidence for proving that a Durable Object kept the
 * same semantic world state and event history across a Worker rollback.
 */
export async function buildRollbackEvidence(
  world: WorldRuntime,
  digestEvents: Array<{ event_id?: string; sequence?: number }> = [],
): Promise<RollbackEvidence> {
  const state = await canonicalStateMaterial(world);
  const historyJson = stableStringify(digestEvents);
  const head = digestEvents.at(-1);
  return {
    pin: "rollback-rehearsal-evidence/1",
    canonicalization_version: CANONICAL_STATE_VERSION,
    state_digest: state.state_digest,
    history_digest: `sha256:${await sha256Hex(historyJson)}`,
    history_count: digestEvents.length,
    history_head_event_id: typeof head?.event_id === "string" ? head.event_id : null,
    history_head_sequence: typeof head?.sequence === "number" ? head.sequence : null,
    idempotency_count: Object.keys(world.seen_idempotency || {}).length,
  };
}
