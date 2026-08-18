/** RFC-0115 sealed live attach. Hash only — never prompt text. */

import { resolvePlayWorld } from "./command-world";

export const SEAL_HEADER = "X-Noema-Seal";
export const SEAL_HASH_RE = /^sha256:[0-9a-f]{64}$/;

/** Published sealed-prompt/s0 digest. Catalog missing → empty → fail closed. */
export const ACCEPTED_SEALS: readonly string[] = [
  "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395",
];

export function parseSeal(raw: unknown): string | null {
  const value = String(raw || "").trim().toLowerCase();
  return SEAL_HASH_RE.test(value) ? value : null;
}

export function acceptedSeals(list: readonly string[] = ACCEPTED_SEALS): string[] {
  return list.filter((item) => SEAL_HASH_RE.test(item));
}

export type SealWorldKind = "default" | "isolated" | "deny";

export function checkLiveAgentSeal(input: {
  controllerType: string;
  worldKind: SealWorldKind;
  presented: string | null;
  catalog?: readonly string[];
}):
  | { ok: true; seal: string | null }
  | { ok: false; code: "SEAL_REQUIRED" | "SEAL_MISMATCH"; message: string } {
  if (input.worldKind !== "default" || input.controllerType !== "agent") {
    return { ok: true, seal: null };
  }
  const catalog = acceptedSeals(input.catalog ?? ACCEPTED_SEALS);
  if (!catalog.length) {
    return { ok: false, code: "SEAL_MISMATCH", message: "sealed prompt catalog unavailable" };
  }
  if (!input.presented) {
    return { ok: false, code: "SEAL_REQUIRED", message: "prompt_version_hash required for live agent attach" };
  }
  if (!catalog.includes(input.presented)) {
    return { ok: false, code: "SEAL_MISMATCH", message: "prompt_version_hash is not in the current catalog" };
  }
  return { ok: true, seal: input.presented };
}

export function sealHelloFields(
  worldId?: string,
  defaultWorldId?: string,
  catalog: readonly string[] = ACCEPTED_SEALS,
): { seal_required: boolean; accepted_seals?: string[] } {
  const target = resolvePlayWorld(worldId, defaultWorldId);
  if (target.kind === "isolated") return { seal_required: false };
  return { seal_required: true, accepted_seals: acceptedSeals(catalog) };
}
