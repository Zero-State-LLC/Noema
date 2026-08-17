/**
 * ACCESS_POLICY S2 — EXIT/ROOM DENY/CLEAR/ALLOW_ONLY via occupied GRANT_ACCESS.
 * Authority: Noema-Specs docs/ACCESS-POLICY-S2.md / RFC-0103.
 */

export const ACCESS_POLICY_CATALOG_ID = "access-policy-catalog/s2";
export const ACCESS_POLICY_DEFAULT_DURATION = 4;
export const ACCESS_POLICY_COST = { compute: 1, influence: 2 } as const;
export const ACCESS_PROFILE = "GRANT_ACCESS" as const;

export type AccessPolicyMode = "DENY" | "CLEAR" | "ALLOW_ONLY";
export type AccessPolicyScope = "EXIT" | "ROOM";

export function parseAccessMode(raw: string): AccessPolicyMode | null {
  const t = String(raw || "").trim().toUpperCase().replace(/-/g, "_");
  if (t === "DENY") return "DENY";
  if (t === "CLEAR") return "CLEAR";
  if (t === "ALLOW_ONLY" || t === "ALLOWONLY" || t === "ALLOW") return "ALLOW_ONLY";
  return null;
}

export function parseAccessScope(raw: string): AccessPolicyScope | null {
  const t = String(raw || "").trim().toUpperCase();
  if (t === "EXIT") return "EXIT";
  if (t === "ROOM" || t === "HERE") return "ROOM";
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
          scope: AccessPolicyScope;
          mode: AccessPolicyMode;
          applies_to: string;
          acting_for?: string;
          expires_cycle?: number;
          direction?: string;
        };
      };
      display: string;
    }
  | { ok: false; error: string; code?: string } {
  const rest = parts.join(" ");
  const modeRaw =
    (rest.match(/\bmode=([^\s]+)/i) || [])[1] ||
    parts.find((p) => /^(deny|clear|allow|allow-only|allow_only)$/i.test(p)) ||
    "";
  const mode = parseAccessMode(modeRaw);
  if (!mode) {
    return {
      ok: false,
      error: "Access syntax: access <dir|here> deny|allow for <org>",
      code: "INVALID_REQUEST",
    };
  }
  const scopeKw = (rest.match(/\bscope=([^\s]+)/i) || [])[1] || "";
  const head = (parts[0] || "").toLowerCase();
  const explicit = parseAccessScope(scopeKw) || parseAccessScope(head);
  const target = /^(here|room|exit|deny|clear|allow|allow-only|allow_only)$/i.test(head) ? "" : head;
  const scope: AccessPolicyScope = explicit || (target ? "EXIT" : "ROOM");
  if (scope === "EXIT" && !target) {
    return { ok: false, error: "Name the exit.", code: "INVALID_REQUEST" };
  }
  const acting_for =
    (rest.match(/\bfor\s+(\S+)/i) || [])[1] ||
    (rest.match(/\bacting_for=([^\s]+)/i) || [])[1] ||
    "";
  const appliesRaw = (rest.match(/\bapplies_to=([^\s]+)/i) || [])[1] || (mode === "ALLOW_ONLY" ? "" : "*");
  if (mode === "ALLOW_ONLY" && (!appliesRaw || appliesRaw === "*")) {
    return { ok: false, error: "ALLOW_ONLY requires applies_to=<player>.", code: "INVALID_REQUEST" };
  }
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
  const direction = scope === "EXIT" ? target.toLowerCase() : undefined;
  const label = scope === "ROOM" ? "here" : target;
  return {
    ok: true,
    action: {
      verb: "COMMIT",
      arguments: {
        operation: "ACCESS_POLICY",
        scope,
        mode,
        applies_to,
        acting_for: acting_for || undefined,
        expires_cycle,
        direction,
      },
    },
    display:
      mode === "CLEAR"
        ? `You clear access ${label}.`
        : mode === "ALLOW_ONLY"
          ? `You allow only listed access ${label}.`
          : `You restrict access ${label}.`,
  };
}
