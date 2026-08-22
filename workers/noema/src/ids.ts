/**
 * Deterministic world-state identifiers (ADR-008).
 *
 * ADR-008 requires the reducer to produce the same next `world_state` for the
 * same inputs, and names "unnamed or implicit random streams" as illegal
 * without a later RFC. Ids minted with Math.random() and then persisted into
 * world state broke both: replaying identical inputs produced different ids and
 * therefore a different `world_state_digest`.
 *
 * These ids are derived from committed world facts (world sequence, cycle, and
 * the subject of the record), so a replay reproduces them exactly. This is a
 * named stream, not a random one.
 */

/** FNV-1a 32-bit. Stable across runtimes; no crypto, no async, no platform drift. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 8 hex chars derived from the given parts. Same parts → same suffix, always. */
export function deterministicSuffix(...parts: Array<string | number | undefined>): string {
  const joined = parts.map((p) => String(p ?? "")).join("|");
  // Two rounds over different salts widen the space and cut collision odds
  // without pulling in a crypto dependency on the hot path.
  const a = fnv1a(joined).toString(16).padStart(8, "0");
  const b = fnv1a(`${joined}#1`).toString(16).padStart(8, "0");
  return (a + b).slice(0, 8);
}

/** `<prefix>.<8 hex>` derived from world facts. */
export function deterministicId(prefix: string, ...parts: Array<string | number | undefined>): string {
  return `${prefix}.${deterministicSuffix(...parts)}`;
}
