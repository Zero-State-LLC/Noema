/**
 * GC4-S8 governance rule (RFC-0124 Accepted).
 *
 * A governance_rule is published configuration on an existing organization —
 * not a `government` entity, not a verb. It is executable only when all six
 * dimensions resolve; every refusal names exactly one unmet dimension.
 *
 * It grants no reach: a decision must resolve to an operation the acting
 * offices could already perform. Authority: docs/GC4-S8-GOVERNANCE-RULE.md.
 */

import { resolveOfficeConflict, type OfficeRecord } from "./offices";

export const GOVERNANCE_CATALOG_ID = "authority-catalog/gc4-s8";

/** SUCCESSION.md closed set. VACANT is excluded: it is the absence of appointment. */
export const APPOINTMENT_MECHANISMS = [
  "DESIGNATED",
  "RULE_BASED",
  "CONSENSUS",
  "INHERITED_BY_ORGANIZATION",
] as const;
export type AppointmentMechanism = (typeof APPOINTMENT_MECHANISMS)[number];

export type GovernanceRule = {
  rule_id: string;
  org_id: string;
  published: boolean;
  decision: { offices: string[]; quorum: number };
  appointment: { mechanism: AppointmentMechanism };
  jurisdiction: { objects?: string[]; rooms?: string[]; members?: string[] };
  enforcement: { operation: string };
  /** Absent on_vacancy/on_deadlock is undefined authority. Written REFUSE is defined. */
  failure: { on_vacancy?: "REFUSE" | "SUCCEED_THEN_DECIDE"; on_deadlock?: "REFUSE"; on_expiry?: "REFUSE" | "LAPSE" };
  evidence: { record: "PUBLIC_NOTICE" | "ORG_RECORD" };
  published_by?: string;
  published_cycle?: number;
};

export type GovernanceRefusal =
  | "unpublished"
  | "not_deciding_office"
  | "quorum_short"
  | "out_of_jurisdiction"
  | "unknown_enforcement"
  | "undefined_failure"
  | "vacancy_refused"
  | "authority_conflict";

/** Player-facing copy. Never leaks rule text, votes, or quorum counts. */
export const GOVERNANCE_REFUSAL_COPY: Record<GovernanceRefusal, string> = {
  unpublished: "That rule is not published, so it decides nothing.",
  not_deciding_office: "You do not hold an office that decides under that rule.",
  quorum_short: "Not enough deciding offices have concurred.",
  out_of_jurisdiction: "That is outside the rule's jurisdiction.",
  unknown_enforcement: "That rule names no action this world can carry out.",
  undefined_failure: "That rule does not say what happens when it cannot decide.",
  vacancy_refused: "A deciding office is vacant and the rule refuses.",
  authority_conflict: "Another office has precedence over this object.",
};

export type GovernanceDecision =
  | { ok: true; operation: string }
  | { ok: false; reason: GovernanceRefusal; message: string };

function refuse(reason: GovernanceRefusal): GovernanceDecision {
  return { ok: false, reason, message: GOVERNANCE_REFUSAL_COPY[reason] };
}

export function parseAppointmentMechanism(raw: unknown): AppointmentMechanism | null {
  const v = String(raw || "").trim().toUpperCase();
  return (APPOINTMENT_MECHANISMS as readonly string[]).includes(v) ? (v as AppointmentMechanism) : null;
}

/** Bounded set the rule may act on. Empty is empty, never universal. */
export function jurisdictionSet(rule: GovernanceRule): string[] {
  const j = rule.jurisdiction || {};
  return [...(j.objects || []), ...(j.rooms || []), ...(j.members || [])].filter(Boolean);
}

/**
 * Decide whether a governance decision is authorized. Mirrors evaluate_gc4_s8
 * in the specs validator; the fixtures there are the conformance oracle.
 */
export function evaluateGovernanceDecision(input: {
  rule: GovernanceRule | undefined;
  org?: { office_precedence?: string[]; offices?: Record<string, OfficeRecord> };
  actingOffices: string[];
  vacantOffices?: string[];
  concurring: number;
  target: { object_id?: string; room_id?: string; member_id?: string };
  knownOperations: string[];
}): GovernanceDecision {
  const rule = input.rule;
  if (!rule || !rule.published) return refuse("unpublished");

  const deciding = new Set(rule.decision?.offices || []);
  const acting = input.actingOffices || [];
  const held = acting.filter((o) => deciding.has(o));
  if (!held.length) return refuse("not_deciding_office");

  // Office precedence and emergency scopes still govern; a rule never overrides them.
  const targetId = input.target?.object_id || input.target?.room_id || input.target?.member_id || "";
  if (input.org && targetId) {
    for (const officeId of held) {
      const verdict = resolveOfficeConflict(input.org, officeId, targetId);
      if (!verdict.ok && verdict.code === "AUTHORITY_CONFLICT") return refuse("authority_conflict");
    }
  }

  const bounded = jurisdictionSet(rule);
  const hits = [input.target?.object_id, input.target?.room_id, input.target?.member_id].filter(Boolean) as string[];
  if (!bounded.length || !hits.some((h) => bounded.includes(h))) return refuse("out_of_jurisdiction");

  const op = rule.enforcement?.operation;
  if (!op || !(input.knownOperations || []).includes(op)) return refuse("unknown_enforcement");

  const failure = rule.failure || {};
  if (failure.on_vacancy === undefined || failure.on_deadlock === undefined) return refuse("undefined_failure");
  const vacant = new Set(input.vacantOffices || []);
  if ([...deciding].some((o) => vacant.has(o)) && failure.on_vacancy === "REFUSE") {
    return refuse("vacancy_refused");
  }

  const quorum = Math.max(1, Number(rule.decision?.quorum || 1));
  if (Number(input.concurring || 0) < quorum) return refuse("quorum_short");

  if (!rule.evidence?.record) return refuse("undefined_failure");
  return { ok: true, operation: op };
}

/**
 * Member-scoped summary: existence, deciding offices, jurisdiction size.
 * Never rule text, votes, or quorum counts. Nothing here reaches WATCH.
 */
export function governanceLines(
  rule: GovernanceRule | undefined,
  offices: Array<{ office_id: string; display_name: string }>,
  isMember: boolean,
): string[] {
  if (!rule || !rule.published || !isMember) return [];
  const byId = new Map(offices.map((o) => [o.office_id, o.display_name]));
  const names = (rule.decision?.offices || []).map((id) => byId.get(id)).filter(Boolean);
  const scope = jurisdictionSet(rule).length;
  const who = names.length ? names.join(", ") : "named offices";
  return [`A published rule lets ${who} decide over ${scope} bounded ${scope === 1 ? "thing" : "things"}.`];
}

export type GovernanceDecisionRecord = {
  rule_id: string;
  decided_by: string;
  decided_cycle: number;
  operation: string;
  target: string;
  concurring: number;
};

/**
 * Parse a submitted rule. Returns the rule or the dimension that is missing —
 * a rule that cannot be parsed is never stored half-formed.
 */
export function parseGovernanceRule(
  raw: unknown,
  orgId: string,
  offices: Record<string, { office_id: string }> | undefined,
): { ok: true; rule: GovernanceRule } | { ok: false; message: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const decision = (r.decision || {}) as { offices?: unknown; quorum?: unknown };
  const offs = Array.isArray(decision.offices) ? decision.offices.map(String).filter(Boolean) : [];
  if (!offs.length) return { ok: false, message: "A rule needs at least one deciding office." };
  const known = offices || {};
  const unknown = offs.filter((o) => !known[o]);
  if (unknown.length) return { ok: false, message: "That rule names an office this institution does not have." };

  const mechanism = parseAppointmentMechanism((r.appointment as { mechanism?: unknown })?.mechanism);
  if (!mechanism) {
    return { ok: false, message: "Appointment must name an existing succession mechanism." };
  }

  const j = (r.jurisdiction || {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const jurisdiction = { objects: list(j.objects), rooms: list(j.rooms), members: list(j.members) };
  // Empty jurisdiction is empty, never universal — refuse it at publish time
  // rather than storing a rule that can only ever refuse.
  if (!jurisdiction.objects.length && !jurisdiction.rooms.length && !jurisdiction.members.length) {
    return { ok: false, message: "A rule needs a bounded jurisdiction; an empty one decides nothing." };
  }

  const operation = String((r.enforcement as { operation?: unknown })?.operation || "").trim().toUpperCase();
  if (!operation) return { ok: false, message: "Enforcement must name an existing operation." };

  const f = (r.failure || {}) as Record<string, unknown>;
  const onVacancy = String(f.on_vacancy || "").toUpperCase();
  const onDeadlock = String(f.on_deadlock || "").toUpperCase();
  if (!["REFUSE", "SUCCEED_THEN_DECIDE"].includes(onVacancy) || onDeadlock !== "REFUSE") {
    return { ok: false, message: "A rule must say what happens on vacancy and on deadlock." };
  }

  const record = String((r.evidence as { record?: unknown })?.record || "").toUpperCase();
  if (!["PUBLIC_NOTICE", "ORG_RECORD"].includes(record)) {
    return { ok: false, message: "A rule must name the record that establishes its decisions." };
  }

  const quorumRaw = Number(decision.quorum ?? 1);
  const quorum = Number.isFinite(quorumRaw) ? Math.max(1, Math.floor(quorumRaw)) : 1;
  if (quorum > offs.length) {
    return { ok: false, message: "Quorum cannot exceed the number of deciding offices." };
  }

  return {
    ok: true,
    rule: {
      rule_id: `rule.${orgId.replace(/^org\./, "")}`,
      org_id: orgId,
      published: true,
      decision: { offices: offs, quorum },
      appointment: { mechanism },
      jurisdiction,
      enforcement: { operation },
      failure: {
        on_vacancy: onVacancy as "REFUSE" | "SUCCEED_THEN_DECIDE",
        on_deadlock: "REFUSE",
      },
      evidence: { record: record as "PUBLIC_NOTICE" | "ORG_RECORD" },
    },
  };
}
