# workers/noema/src/operator-digests.ts

- DigestCadence · type · L8-L8 — type DigestCadence = (typeof DIGEST_CADENCES)[number];
- DigestDepth · type · L9-L9 — type DigestDepth = "BRIEF" | "STANDARD" | "DETAILED";
- DigestConfig · interface · L21-L29 — interface DigestConfig
- DigestEvent · interface · L41-L50 — interface DigestEvent
- DigestSnapshot · interface · L52-L61 — interface DigestSnapshot
- OperatorDigest · interface · L63-L76 — interface OperatorDigest
- cadenceElapsed · function · L78-L82 — function cadenceElapsed(lastEnd: number, cadence: DigestCadence, now: number): boolean
- nameOf · function · L84-L86 — function nameOf(ev: DigestEvent): string
- locName · function · L88-L91 — function locName(payload?: Record<string, unknown>): string | undefined
- composeDigest · function · L93-L253 — function composeDigest( events: DigestEvent[], snap: DigestSnapshot, cfg: DigestConfig, window: { start: number; end: number; missed?: boolean }, ): OperatorDigest
- nextWindows · function · L255-L275 — function nextWindows( lastEnd: number, cadence: DigestCadence, now: number, ): Array<{ start: number; end: number; missed: boolean }>
