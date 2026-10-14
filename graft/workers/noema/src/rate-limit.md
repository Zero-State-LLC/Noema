# workers/noema/src/rate-limit.ts

- SlidingWindowThrottle · class · L3-L25 — class SlidingWindowThrottle
- constructor · method · L5-L8 — constructor( private limit: number, private windowMs: number, )
- hit · method · L10-L20 — hit(key: string, now = Date.now()): boolean
- reset · method · L22-L24 — reset(): void
- allowLoginThrottled · function · L41-L52 — async function allowLoginThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, ip: string, email: string, now = Date.now(), ): Promise<boolean>
- RateLimitEnv · type · L56-L58 — type RateLimitEnv = { WORLD_DO?: DurableObjectNamespace; };
- allowThrottled · function · L64-L89 — async function allowThrottled( local: SlidingWindowThrottle, env: RateLimitEnv, key: string, limit: number, windowMs: number, now = Date.now(), ): Promise<boolean>
