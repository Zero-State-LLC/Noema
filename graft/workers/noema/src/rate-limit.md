# workers/noema/src/rate-limit.ts

- SlidingWindowThrottle · class · L5-L39 — class SlidingWindowThrottle
- constructor · method · L8-L11 — constructor( private limit: number, private windowMs: number, )
- hit · method · L13-L28 — hit(key: string, now = Date.now()): boolean
- size · method · L31-L33 — get size(): number
- reset · method · L35-L38 — reset(): void
- allowLoginThrottled · function · L55-L66 — async function allowLoginThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, ip: string, email: string, now = Date.now(), ): Promise<boolean>
- RateLimitEnv · type · L70-L72 — type RateLimitEnv = { WORLD_DO?: DurableObjectNamespace; };
- allowThrottled · function · L78-L103 — async function allowThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, key: string, limit: number, windowMs: number, now = Date.now(), ): Promise<boolean>
- RateLimitRow · type · L120-L120 — type RateLimitRow = { hits: number[]; expires_at: number };
- RateLimitStorage · type · L122-L122 — type RateLimitStorage = Pick<DurableObjectStorage, "get" | "put" | "delete" | "list" | "getAlarm" | "setAlarm">;
- rateLimitRowKey · function · L124-L126 — async function rateLimitRowKey(key: string): Promise<string>
- rowHits · function · L128-L131 — function rowHits(value: unknown): number[]
- rateLimitRowExpiresAt · function · L138-L141 — function rateLimitRowExpiresAt(value: unknown): number
- durableRateLimitHit · function · L144-L163 — async function durableRateLimitHit( storage: RateLimitStorage, key: string, limit: number, windowMs: number, now: number, ): Promise<boolean>
- armRateLimitSweep · function · L166-L170 — async function armRateLimitSweep(storage: RateLimitStorage, now: number): Promise<void>
- sweepRateLimitRows · function · L176-L193 — async function sweepRateLimitRows(storage: RateLimitStorage, now: number): Promise<void>
