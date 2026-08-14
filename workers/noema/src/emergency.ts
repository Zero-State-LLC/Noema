/**
 * GC4-S3 emergency scopes. Time-bounded AuthorityGrant overlay.
 * Authority: Noema-Specs docs/GC4-S3-EMERGENCY-SCOPES.md / RFC-0030.
 */

import type { OfficeProfile, OfficeRecord, Treasury } from "./offices";
import { occupiedOfficesFor } from "./offices";

export const EMERGENCY_DURATION = 3;
export const REPAIR_CONDITION_THRESHOLD = 25;
export const TRADE_TREASURY_THRESHOLD = 5;
export const TRADE_MAX_ENERGY = 10;
export const WATCH_EMERGENCY_PULSE = "An institution declared a temporary repair authority.";

export type EmergencyCapability = "REPAIR" | "TRADE";
export type EmergencyStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type EmergencyCondition =
  | { kind: "ASSET_CONDITION_LT"; threshold: number }
  | { kind: "TREASURY_LT"; resource: "energy"; threshold: number };

export type EmergencyTemplate = {
  template_id: string;
  source_profiles: OfficeProfile[];
  capability: EmergencyCapability;
  condition: EmergencyCondition;
  duration_cycles: number;
  max_spend?: { energy?: number };
};

export type EmergencyScope = {
  scope_id: string;
  template_id: string;
  institution_id: string;
  holder_player_id: string;
  source_office_id?: string;
  capability: EmergencyCapability;
  target_ref: string;
  start_cycle: number;
  end_cycle: number;
  status: EmergencyStatus;
  created_cycle: number;
  revoked_cycle?: number;
  reason?: string;
  spent?: { energy?: number };
};

export function defaultEmergencyTemplates(): EmergencyTemplate[] {
  return [
    {
      template_id: "emrule.repair",
      source_profiles: ["GRANT_ACCESS", "OPERATE_NAMED_ASSET"],
      capability: "REPAIR",
      condition: { kind: "ASSET_CONDITION_LT", threshold: REPAIR_CONDITION_THRESHOLD },
      duration_cycles: EMERGENCY_DURATION,
    },
    {
      template_id: "emrule.trade",
      source_profiles: ["GRANT_ACCESS", "OPERATE_RESOURCE_ACCOUNT"],
      capability: "TRADE",
      condition: { kind: "TREASURY_LT", resource: "energy", threshold: TRADE_TREASURY_THRESHOLD },
      duration_cycles: EMERGENCY_DURATION,
      max_spend: { energy: TRADE_MAX_ENERGY },
    },
  ];
}

export function allocateScopeId(): string {
  return `emscope.${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function isScopeEffective(scope: EmergencyScope, cycle: number): boolean {
  return scope.status === "ACTIVE" && cycle >= scope.start_cycle && cycle < scope.end_cycle;
}

export function conditionHolds(
  template: EmergencyTemplate,
  args: { entityCondition?: number; treasury?: Treasury },
): boolean {
  if (template.condition.kind === "ASSET_CONDITION_LT") {
    if (typeof args.entityCondition !== "number") return false;
    return args.entityCondition < template.condition.threshold;
  }
  const energy = args.treasury?.energy ?? 0;
  return energy < template.condition.threshold;
}

export function canActivate(
  org: { status?: string; offices?: Record<string, OfficeRecord>; members?: Array<{ agent_id: string }> },
  actorId: string,
  actorRole: string | null,
  template: EmergencyTemplate,
  officeId?: string,
): { ok: true; office_id?: string } | { ok: false; code: "FORBIDDEN"; message: string } {
  if (actorRole === "founder" || actorRole === "officer") {
    return { ok: true };
  }
  if (officeId) {
    const office = org.offices?.[officeId];
    if (!office || office.status !== "OCCUPIED" || office.holder_player_id !== actorId) {
      return { ok: false, code: "FORBIDDEN", message: "You do not hold that office." };
    }
    if (!template.source_profiles.includes(office.authority_profile)) {
      return { ok: false, code: "FORBIDDEN", message: "That office cannot declare this emergency." };
    }
    return { ok: true, office_id: office.office_id };
  }
  const matches = template.source_profiles.flatMap((p) => occupiedOfficesFor(org, actorId, p));
  if (!matches.length) {
    return { ok: false, code: "FORBIDDEN", message: "You cannot declare that emergency." };
  }
  if (matches.length > 1) {
    return { ok: false, code: "FORBIDDEN", message: "Name which office you are using." };
  }
  return { ok: true, office_id: matches[0].office_id };
}

export function findDuplicate(
  scopes: EmergencyScope[] | undefined,
  templateId: string,
  holderId: string,
  targetRef: string,
  cycle: number,
): EmergencyScope | undefined {
  return (scopes || []).find(
    (s) =>
      s.template_id === templateId &&
      s.holder_player_id === holderId &&
      s.target_ref === targetRef &&
      isScopeEffective(s, cycle),
  );
}

export function expireDueScopes(scopes: EmergencyScope[] | undefined, cycle: number): EmergencyScope[] {
  const changed: EmergencyScope[] = [];
  for (const s of scopes || []) {
    if (s.status === "ACTIVE" && cycle >= s.end_cycle) {
      s.status = "EXPIRED";
      changed.push(s);
    }
  }
  return changed;
}

export function resolveEmergencyUse(
  org: {
    org_id?: string;
    status?: string;
    offices?: Record<string, OfficeRecord>;
    members?: Array<{ agent_id: string }>;
    emergency_scopes?: EmergencyScope[];
  },
  actorId: string,
  scopeId: string,
  capability: EmergencyCapability,
  targetRef: string,
  cycle: number,
):
  | { ok: true; scope: EmergencyScope }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN"; message: string } {
  if (org.status !== "ACTIVE") {
    return { ok: false, code: "NOT_FOUND", message: "That institution is not known here." };
  }
  const scope = (org.emergency_scopes || []).find((s) => s.scope_id === scopeId);
  if (!scope) return { ok: false, code: "NOT_FOUND", message: "Emergency scope not found." };
  if (!isScopeEffective(scope, cycle)) {
    return { ok: false, code: "FORBIDDEN", message: "That emergency authority is not in force." };
  }
  if (scope.holder_player_id !== actorId) {
    return { ok: false, code: "FORBIDDEN", message: "You do not hold that emergency authority." };
  }
  if (!(org.members || []).some((m) => m.agent_id === actorId)) {
    return { ok: false, code: "FORBIDDEN", message: "You are not a member of that institution." };
  }
  if (scope.capability !== capability || scope.target_ref !== targetRef) {
    return { ok: false, code: "FORBIDDEN", message: "That emergency scope does not cover this act." };
  }
  return { ok: true, scope };
}

export function resolveEmergencyFor(
  org: {
    org_id?: string;
    status?: string;
    offices?: Record<string, OfficeRecord>;
    members?: Array<{ agent_id: string }>;
    emergency_scopes?: EmergencyScope[];
  },
  actorId: string,
  capability: EmergencyCapability,
  targetRef: string,
  cycle: number,
  scopeId?: string,
):
  | { ok: true; scope: EmergencyScope }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN"; message: string } {
  if (scopeId) return resolveEmergencyUse(org, actorId, scopeId, capability, targetRef, cycle);
  const matches = (org.emergency_scopes || []).filter(
    (s) =>
      s.holder_player_id === actorId &&
      s.capability === capability &&
      s.target_ref === targetRef &&
      isScopeEffective(s, cycle),
  );
  if (!matches.length) {
    return { ok: false, code: "FORBIDDEN", message: "You do not hold that institutional authority." };
  }
  if (matches.length > 1) {
    return { ok: false, code: "FORBIDDEN", message: "Name which emergency scope you are using." };
  }
  return resolveEmergencyUse(org, actorId, matches[0].scope_id, capability, targetRef, cycle);
}

export function emergencyLines(scopes: EmergencyScope[] | undefined, playerId: string, cycle: number): string[] {
  return (scopes || [])
    .filter((s) => s.holder_player_id === playerId && isScopeEffective(s, cycle))
    .map((s) => `Emergency authority active: ${s.capability} on ${s.target_ref} until cycle ${s.end_cycle}.`);
}

export function publicEmergencyPulses(orgs: Record<string, { emergency_scopes?: EmergencyScope[] }> | undefined, cycle: number): string[] {
  for (const org of Object.values(orgs || {})) {
    if ((org.emergency_scopes || []).some((s) => isScopeEffective(s, cycle))) {
      return [WATCH_EMERGENCY_PULSE];
    }
  }
  return [];
}
