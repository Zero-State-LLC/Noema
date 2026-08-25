import { isUsableLiveWorld } from "./ops";
import { migrateWorldRuntime, type WorldRuntime } from "./world-actions";

export interface CompatibilityEvidence {
  pin: "do-compatibility-evidence/1";
  source_present: boolean;
  migration_ok: boolean;
  usable_before: boolean;
  usable_after: boolean;
  persisted_values_preserved: boolean;
  mismatch_count: number;
  raw_node_count: number;
  migrated_node_count: number;
  added_node_count: number;
  subsystem_cardinality: {
    rooms: number;
    entities: number;
    players: number;
    organizations: number;
    trades: number;
    agreements: number;
    scars: number;
    messages: number;
  };
}

function nodeCount(value: unknown): number {
  if (value === null || typeof value !== "object") return 1;
  if (Array.isArray(value)) return 1 + value.reduce<number>((sum, item) => sum + nodeCount(item), 0);
  return 1 + Object.values(value as Record<string, unknown>).reduce<number>(
    (sum, item) => sum + nodeCount(item),
    0,
  );
}

function mismatchCount(before: unknown, after: unknown): number {
  if (before === null || typeof before !== "object") return Object.is(before, after) ? 0 : 1;
  if (after === null || typeof after !== "object") return 1;
  if (Array.isArray(before)) {
    if (!Array.isArray(after)) return 1;
    return before.reduce((sum, item, i) => sum + mismatchCount(item, after[i]), 0);
  }
  if (Array.isArray(after)) return 1;
  return Object.entries(before as Record<string, unknown>).reduce(
    (sum, [key, value]) => sum + mismatchCount(value, (after as Record<string, unknown>)[key]),
    0,
  );
}

function cardinality(world: WorldRuntime): CompatibilityEvidence["subsystem_cardinality"] {
  const rooms = Object.values(world.rooms || {});
  return {
    rooms: rooms.length,
    entities: rooms.reduce((sum, room) => sum + (room.entities?.length || 0), 0),
    players: Object.keys(world.players || {}).length,
    organizations: Object.keys(world.organizations || {}).length,
    trades: Object.keys(world.trades || {}).length,
    agreements: Object.keys(world.agreements || {}).length,
    scars: world.scars?.length || 0,
    messages: world.messages?.length || 0,
  };
}

export function buildCompatibilityEvidence(source: WorldRuntime | undefined): CompatibilityEvidence {
  if (!source) {
    return {
      pin: "do-compatibility-evidence/1",
      source_present: false,
      migration_ok: false,
      usable_before: false,
      usable_after: false,
      persisted_values_preserved: false,
      mismatch_count: 0,
      raw_node_count: 0,
      migrated_node_count: 0,
      added_node_count: 0,
      subsystem_cardinality: {
        rooms: 0,
        entities: 0,
        players: 0,
        organizations: 0,
        trades: 0,
        agreements: 0,
        scars: 0,
        messages: 0,
      },
    };
  }

  const migrated = structuredClone(source);
  const usableBefore = isUsableLiveWorld(source);
  let migrationOk = true;
  try {
    migrateWorldRuntime(migrated);
  } catch {
    migrationOk = false;
  }
  const mismatches = migrationOk ? mismatchCount(source, migrated) : 1;
  const rawNodes = nodeCount(source);
  const migratedNodes = migrationOk ? nodeCount(migrated) : rawNodes;
  return {
    pin: "do-compatibility-evidence/1",
    source_present: true,
    migration_ok: migrationOk,
    usable_before: usableBefore,
    usable_after: migrationOk && isUsableLiveWorld(migrated),
    persisted_values_preserved: migrationOk && mismatches === 0,
    mismatch_count: mismatches,
    raw_node_count: rawNodes,
    migrated_node_count: migratedNodes,
    added_node_count: Math.max(0, migratedNodes - rawNodes),
    subsystem_cardinality: cardinality(migrated),
  };
}
