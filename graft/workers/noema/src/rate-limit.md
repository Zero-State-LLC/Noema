# workers/noema/src/rate-limit.ts

- SlidingWindowThrottle · class · L5-L27 — class SlidingWindowThrottle
- constructor · method · L7-L10 — constructor( private limit: number, private windowMs: number, )
- hit · method · L12-L22 — hit(key: string, now = Date.now()): boolean
- reset · method · L24-L26 — reset(): void
- allowLoginThrottled · function · L43-L54 — async function allowLoginThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, ip: string, email: string, now = Date.now(), ): Promise<boolean>
- RateLimitEnv · type · L58-L60 — type RateLimitEnv = { WORLD_DO?: DurableObjectNamespace; };
- allowThrottled · function · L66-L91 — async function allowThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, key: string, limit: number, windowMs: number, now = Date.now(), ): Promise<boolean>
- RateLimitRow · type · L110-L110 — type RateLimitRow = { hits: number[]; expires_at: number };
- RateLimitStorage · type · L112-L112 — type RateLimitStorage = Pick<DurableObjectStorage, "get" | "put" | "delete" | "list" | "getAlarm" | "setAlarm">;
- rateLimitRowKey · function · L114-L116 — async function rateLimitRowKey(key: string): Promise<string>
- rowHits · function · L118-L121 — function rowHits(value: unknown): number[]
- rateLimitRowExpiresAt · function · L124-L131 — function rateLimitRowExpiresAt(value: unknown): number
- durableRateLimitHit · function · L134-L153 — async function durableRateLimitHit( storage: RateLimitStorage, key: string, limit: number, windowMs: number, now: number, ): Promise<boolean>
- armRateLimitSweep · function · L156-L160 — async function armRateLimitSweep(storage: RateLimitStorage, now: number): Promise<void>
- sweepRateLimitRows · function · L166-L183 — async function sweepRateLimitRows(storage: RateLimitStorage, now: number): Promise<void>
