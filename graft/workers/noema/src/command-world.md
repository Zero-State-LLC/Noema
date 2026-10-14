# workers/noema/src/command-world.ts

- PlayWorld · type · L5-L8 — type PlayWorld = | { kind: "default"; world_id: string } | { kind: "isolated"; world_id: string } | { kind: "deny"; code: "WORLD_FORBIDDEN"; message: string };
- resolvePlayWorld · function · L12-L23 — function resolvePlayWorld(raw: unknown, defaultWorldId?: string): PlayWorld
