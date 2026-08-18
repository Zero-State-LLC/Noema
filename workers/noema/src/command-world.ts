/** Resolve which tenant a PLAY/command envelope may target. */

import { admitTestWorldId } from "./test-world";

export type PlayWorld =
  | { kind: "default"; world_id: string }
  | { kind: "isolated"; world_id: string }
  | { kind: "deny"; code: "WORLD_FORBIDDEN"; message: string };

const PERIHELION = new Set(["world.perihelion-reach", "world-01", "perihelion"]);

export function resolvePlayWorld(raw: unknown, defaultWorldId?: string): PlayWorld {
  const fallback = String(defaultWorldId || "world-01").trim() || "world-01";
  const value = String(raw || "").trim();
  if (!value) return { kind: "default", world_id: fallback };
  const key = value.toLowerCase();
  if (PERIHELION.has(key) || key.startsWith("world.perihelion") || value === fallback) {
    return { kind: "default", world_id: fallback };
  }
  const admitted = admitTestWorldId(value, fallback);
  if (admitted.ok) return { kind: "isolated", world_id: admitted.world_id };
  return { kind: "deny", code: "WORLD_FORBIDDEN", message: admitted.message };
}
