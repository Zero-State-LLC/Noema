/**
 * ACCESS_POLICY S0 — EXIT DENY/CLEAR via occupied GRANT_ACCESS.
 * Authority: Noema-Specs docs/ACCESS-POLICY-S0.md / RFC-0101.
 */

export const ACCESS_POLICY_CATALOG_ID = "access-policy-catalog/s0";
export const ACCESS_POLICY_DEFAULT_DURATION = 4;
export const ACCESS_POLICY_COST = { compute: 1, influence: 2 } as const;
export const ACCESS_PROFILE = "GRANT_ACCESS" as const;

export type AccessPolicyMode = "DENY" | "CLEAR";

export function parseAccessMode(raw: string): AccessPolicyMode | null {
  const t = String(raw || "").trim().toUpperCase().replace(/-/g, "_");
  if (t === "DENY") return "DENY";
  if (t === "CLEAR") return "CLEAR";
  return null;
}

export function parseAccessPolicyLine(
  parts: string[],
  ctx: { players?: Array<{ player_id: string; handle?: string }>; selfId?: string } = {},
):
  | {
      ok: true;
      action: {
        verb: "COMMIT";
        arguments: {
          operation: "ACCESS_POLICY";
          scope: "EXIT";
          mode: AccessPolicyMode;
          applies_to: string;
          acting_for?: string;
          expires_cycle?: number;
          direction: string;
        };
      };
      display: string;
    }
  | { ok: false; error: string; code?: string } {
  const rest = parts.join(" ");
  const modeRaw =
    (rest.match(/\bmode=([^\s]+)/i) || [])[1] ||
    parts.find((p) => /^(deny|clear)$/i.test(p)) ||
    "";
  const mode = parseAccessMode(modeRaw);
  if (!mode) {
    return {
      ok: false,
      error: "Access syntax: access <dir> deny for <org>",
      code: "INVALID_REQUEST",
    };
  }
  const dir =
    parts.find(
      (p) =>
        !/^(deny|clear)$/i.test(p) &&
        !/^(for|mode=|applies_to=|expires=)/i.test(p) &&
        !p.includes("="),
    ) || "";
  if (!dir) {
    return { ok: false, error: "Name the exit.", code: "INVALID_REQUEST" };
  }
  const acting_for =
    (rest.match(/\bfor\s+(\S+)/i) || [])[1] ||
    (rest.match(/\bacting_for=([^\s]+)/i) || [])[1] ||
    "";
  const appliesRaw = (rest.match(/\bapplies_to=([^\s]+)/i) || [])[1] || "*";
  let applies_to = appliesRaw;
  if (applies_to !== "*" && ctx.players && ctx.selfId) {
    const hit = ctx.players.find(
      (p) =>
        p.player_id === applies_to ||
        (p.handle && p.handle.toLowerCase() === applies_to.toLowerCase()),
    );
    if (hit) applies_to = hit.player_id;
  }
  const expiresRaw = (rest.match(/\bexpires=(\d+)/i) || [])[1];
  const expires_cycle = expiresRaw ? Number(expiresRaw) : undefined;
  return {
    ok: true,
    action: {
      verb: "COMMIT",
      arguments: {
        operation: "ACCESS_POLICY",
        scope: "EXIT",
        mode,
        applies_to,
        acting_for: acting_for || undefined,
        expires_cycle,
        direction: dir.toLowerCase(),
      },
    },
    display: mode === "CLEAR" ? `You clear access ${dir}.` : `You restrict access ${dir}.`,
  };
}
