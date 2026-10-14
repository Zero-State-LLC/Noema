# workers/noema/src/world-time.ts

- WorldTimePlayer · type · L9-L13 — type WorldTimePlayer = { entered?: boolean; last_seen_ms?: number; wait_until_cycle?: number; };
- presentPlayerIds · function · L15-L24 — function presentPlayerIds( players: Record<string, WorldTimePlayer> | undefined, now: number, idleMs = PRESENCE_IDLE_MS, ): string[]
- allPresentWaiting · function · L26-L35 — function allPresentWaiting( players: Record<string, WorldTimePlayer> | undefined, cycle: number, now: number, idleMs = PRESENCE_IDLE_MS, ): boolean
- commitCycleIfReady · function · L38-L46 — function commitCycleIfReady<T extends { cycle: number; players: Record<string, WorldTimePlayer> }>( w: T, now = Date.now(), idleMs = PRESENCE_IDLE_MS, ): boolean
