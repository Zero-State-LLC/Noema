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

/**
 * Raised when the canonical serializer produced text that is not valid JSON.
 * This must never be silently persisted or hashed: RFC-0003 requires
 * noema-jcs/1 canonical text to be valid I-JSON. Producers are responsible
 * for filtering `undefined` out of optional-field objects before building
 * semantic world state (see world-actions.ts RECONSTRUCT handling); this is
 * the last-resort backstop so a future producer bug fails loudly here
 * instead of shipping unparsable text into settlement.
 */
export class CanonicalStateSerializationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "CanonicalStateSerializationError";
    if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
  }
}

export async function canonicalStateMaterial(world: WorldRuntime): Promise<{
  state_json: Record<string, unknown>;
  canonical_json: string;
  state_digest: string;
}> {
  const state_json = canonicalWorldState(world);
  const canonical_json = stableStringify(state_json);
  try {
    // stableStringify skips `undefined` object values but cannot repair an
    // `undefined` array element or other non-JSON-representable value
    // (NaN, Infinity, bigint, etc). Validate the produced text is real JSON
    // before it is ever hashed or handed to a settlement/rollback caller.
    JSON.parse(canonical_json);
  } catch (cause) {
    throw new CanonicalStateSerializationError(
      "canonical world state serialized to non-JSON text; refusing to hash or persist it. " +
        "An upstream producer wrote an unsupported value (e.g. undefined) into semantic world state.",
      { cause },
    );
  }
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
  const canonical_json = stableStringify(input);
  try {
    // Same I-JSON backstop as canonicalStateMaterial(): event payloads are
    // producer-built `Record<string, unknown>` (settle.ts settlement commit),
    // so an undefined array element in a payload would otherwise be hashed
    // into the durable event digest chain as non-JSON text — the same class
    // of #634 regression, one function lower in the same file.
    JSON.parse(canonical_json);
  } catch (cause) {
    throw new CanonicalStateSerializationError(
      "canonical event digest serialized to non-JSON text; refusing to hash it into the settlement chain. " +
        "An upstream producer wrote an unsupported value (e.g. undefined) into an event payload.",
      { cause },
    );
  }
  return `sha256:${await sha256Hex(canonical_json)}`;
}
