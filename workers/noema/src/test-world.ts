/**
 * Isolated hosted canonical-verification world admission.
 * PLAY /v1/command may target an admitted id only with dual-auth
 * (see resolvePlayWorld). This helper never admits Perihelion.
 */

export const TEST_WORLD_PREFIX = "test.hosted-canonical.";

export type WorldAdmission =
  | { ok: true; world_id: string }
  | { ok: false; code: "WORLD_FORBIDDEN"; message: string };

function deny(message: string): WorldAdmission {
  return { ok: false, code: "WORLD_FORBIDDEN", message };
}

export function isAdmittedTestWorldId(worldId: string): boolean {
  return admitTestWorldId(worldId).ok;
}

/** Ledger event ids are a global PK. Isolated worlds must not reuse Perihelion `evt.000000`. */
export function isolatedLedgerEventId(worldId: string, sequence: number): string {
  const admitted = admitTestWorldId(worldId);
  const seq = sequence.toString().padStart(6, "0");
  if (admitted.ok) {
    const suffix = admitted.world_id.slice(TEST_WORLD_PREFIX.length).replace(/[^a-zA-Z0-9.-]+/g, ".");
    return `evt.tw.${suffix}.${seq}`;
  }
  // Hosted successor shares the settlement table with frozen Perihelion.
  if (worldId === "world.perihelion-reach-2") return `evt.w.perihelion-reach-2.${seq}`;
  return `evt.${seq}`;
}

/**
 * Admit only `test.hosted-canonical.<suffix>`.
 * Deny Perihelion, DEFAULT_WORLD_ID, and arbitrary ids before any DO lookup.
 */
export function admitTestWorldId(raw: unknown, defaultWorldId?: string): WorldAdmission {
  const world_id = String(raw || "").trim();
  if (!world_id) return deny("world_id required");
  const defaultId = String(defaultWorldId || "world-01").trim() || "world-01";
  if (
    world_id === defaultId ||
    world_id === "world-01" ||
    world_id === "world.perihelion-reach" ||
    world_id.startsWith("world.perihelion")
  ) {
    return deny("that world is not admitted for isolated verification");
  }
  if (!world_id.startsWith(TEST_WORLD_PREFIX)) {
    return deny("world_id must be test.hosted-canonical.<suffix>");
  }
  const suffix = world_id.slice(TEST_WORLD_PREFIX.length);
  if (!suffix || suffix.startsWith(".") || suffix.endsWith(".") || suffix.includes("..")) {
    return deny("invalid test world suffix");
  }
  if (!/^[a-z0-9][a-z0-9.-]{0,47}$/i.test(suffix)) {
    return deny("invalid test world suffix");
  }
  return { ok: true, world_id };
}

/** DO load must use the admitted id when present; never silently fall back. */
export function resolveLoadWorldId(
  requestedWorldId: string | null | undefined,
  defaultWorldId: string | undefined,
): string {
  const requested = String(requestedWorldId || "").trim();
  if (requested) return requested;
  return String(defaultWorldId || "").trim() || "world-01";
}

/** Isolated recover bind. Perihelion / DEFAULT_WORLD_ID stay unbound so production load uses the default DO. */
export function lifecycleRequestedWorldId(raw: unknown): string | null {
  const admitted = admitTestWorldId(raw);
  return admitted.ok ? admitted.world_id : null;
}

export type RecoverBind =
  | { ok: true; world_id: string }
  | { ok: false; code: "WORLD_FORBIDDEN"; message: string };

/** Isolated recover may only read/adopt the admitted isolate. Production recover leaves requested null. */
export function recoverBoundWorldId(
  requested: string | null | undefined,
  storedWorldId: string | null | undefined,
  currentWorldId: string | null | undefined,
): RecoverBind {
  const req = String(requested || "").trim();
  const stored = String(storedWorldId || "").trim();
  const current = String(currentWorldId || "").trim();
  if (req) {
    if (stored && stored !== req) {
      return { ok: false, code: "WORLD_FORBIDDEN", message: "stored world is not the admitted isolate" };
    }
    if (current && current !== req) {
      return { ok: false, code: "WORLD_FORBIDDEN", message: "loaded world is not the admitted isolate" };
    }
    return { ok: true, world_id: req };
  }
  return { ok: true, world_id: stored || current };
}
