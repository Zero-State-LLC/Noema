/** RFC semantic-evolution v0.1 signaling sidecar. Optional on MESSAGE/ATTEST/TRADE. */

export const SIGNAL_GROUNDING = [
  "observed",
  "inferred-from-stock",
  "inferred-from-belief",
  "hearsay",
  "genesis",
] as const;

export type SignalGrounding = (typeof SIGNAL_GROUNDING)[number];

export interface ActionSignal {
  certainty?: number;
  grounding?: SignalGrounding;
  stochasticity?: number;
  assumptions?: string[];
}

function clamp01(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

export function parseActionSignal(raw: unknown): { ok: true; signal?: ActionSignal } | { ok: false; error: string; code: "INVALID_REQUEST" } {
  if (raw == null || raw === "") return { ok: true };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "signal must be an object", code: "INVALID_REQUEST" };
  }
  const o = raw as Record<string, unknown>;
  const signal: ActionSignal = {};
  const certainty = o.certainty ?? o["@C"] ?? o.C;
  const grounding = o.grounding ?? o["@G"] ?? o.G;
  const stochasticity = o.stochasticity ?? o["@S"] ?? o.S;
  const assumptions = o.assumptions;
  if (certainty !== undefined) {
    const n = typeof certainty === "number" ? certainty : Number(certainty);
    if (!clamp01(n)) return { ok: false, error: "signal.certainty must be 0–1", code: "INVALID_REQUEST" };
    signal.certainty = n;
  }
  if (grounding !== undefined) {
    const g = String(grounding);
    if (!(SIGNAL_GROUNDING as readonly string[]).includes(g)) {
      return { ok: false, error: "signal.grounding must be observed|inferred-from-stock|inferred-from-belief|hearsay|genesis", code: "INVALID_REQUEST" };
    }
    signal.grounding = g as SignalGrounding;
  }
  if (stochasticity !== undefined) {
    const n = typeof stochasticity === "number" ? stochasticity : Number(stochasticity);
    if (!clamp01(n)) return { ok: false, error: "signal.stochasticity must be 0–1", code: "INVALID_REQUEST" };
    signal.stochasticity = n;
  }
  if (assumptions !== undefined) {
    if (!Array.isArray(assumptions) || assumptions.some((a) => typeof a !== "string")) {
      return { ok: false, error: "signal.assumptions must be string[]", code: "INVALID_REQUEST" };
    }
    signal.assumptions = assumptions.map(String);
  }
  if (!Object.keys(signal).length) return { ok: true };
  return { ok: true, signal };
}

export function signalFromArgs(args: Record<string, unknown>): { ok: true; signal?: ActionSignal } | { ok: false; error: string; code: "INVALID_REQUEST" } {
  if (args.signal != null) return parseActionSignal(args.signal);
  if (args["@C"] != null || args["@G"] != null || args["@S"] != null) {
    return parseActionSignal({ "@C": args["@C"], "@G": args["@G"], "@S": args["@S"], assumptions: args.assumptions });
  }
  return { ok: true };
}
