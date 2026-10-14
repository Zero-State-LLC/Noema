# workers/noema/src/signal.ts

- SignalGrounding · type · L11-L11 — type SignalGrounding = (typeof SIGNAL_GROUNDING)[number];
- ActionSignal · interface · L13-L18 — interface ActionSignal
- clamp01 · function · L20-L22 — function clamp01(n: number): boolean
- parseActionSignal · function · L24-L60 — function parseActionSignal(raw: unknown): { ok: true; signal?: ActionSignal } | { ok: false; error: string; code: "INVALID_REQUEST" }
- mutationGroundingOk · function · L65-L68 — function mutationGroundingOk(signal?: ActionSignal): boolean
- signalFromArgs · function · L70-L76 — function signalFromArgs(args: Record<string, unknown>): { ok: true; signal?: ActionSignal } | { ok: false; error: string; code: "INVALID_REQUEST" }
