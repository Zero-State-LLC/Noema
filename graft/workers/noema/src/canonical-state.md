# workers/noema/src/canonical-state.ts

- canonicalWorldState · function · L10-L29 — function canonicalWorldState(world: WorldRuntime): Record<string, unknown>
- CanonicalStateSerializationError · class · L40-L46 — class CanonicalStateSerializationError extends Error
- constructor · method · L41-L45 — constructor(message: string, options?: { cause?: unknown })
- canonicalStateMaterial · function · L48-L69 — async function canonicalStateMaterial(world: WorldRuntime): Promise<{ state_json: Record<string, unknown>; canonical_json: string; state_digest: string; }>
- canonicalEventDigest · function · L71-L96 — async function canonicalEventDigest(input: { world_id: string; sequence: number; cycle: number; event_id: string; event_type: string; payload: Record<string, unknown>; previous_digest: string | null; }): Promise<string>
